package cn.lx.worldcoffee.launcher;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

/**
 * 本地开发环境统一启动器。
 *
 * <p>它不是一个业务 Spring Boot 服务，而是一个进程编排器：先启动
 * Docker Compose 基础设施，再启动各个已经打包好的 Spring Boot 服务。
 * 启动器自身退出时，只会回收自己创建的 Java 子进程，Docker 容器保持运行。</p>
 */
public final class WorldCoffeeStartupApplication {

    private static final Duration INFRASTRUCTURE_TIMEOUT = Duration.ofSeconds(120);
    private static final Duration SERVICE_TIMEOUT = Duration.ofSeconds(90);
    private static final int PORT_PROBE_TIMEOUT_MILLIS = 800;

    private static final List<Infrastructure> INFRASTRUCTURE = List.of(
            new Infrastructure("mysql8", 3306),
            new Infrastructure("redis", 6379),
            new Infrastructure("rabbitmq", 5672),
            new Infrastructure("nacos", 8848),
            new Infrastructure("es", 9200),
            new Infrastructure("worldcoffee-minio", 9000),
            new Infrastructure("chroma", 8000)
    );

    /** 网关最后启动，避免它在下游服务尚未注册时先接收请求。 */
    private static final List<BackendService> SERVICES = List.of(
            new BackendService("wc-user", 8082),
            new BackendService("wc-shop", 8081),
            new BackendService("wc-community", 8083),
            new BackendService("wc-message", 8084),
            new BackendService("wc-ai", 8085),
            new BackendService("wc-admin", 8086),
            new BackendService("wc-gateway", 8080)
    );

    private final Options options;
    private final List<Process> startedProcesses = new ArrayList<>();
    private Path microservicesRoot;
    private Path logRoot;
    private String dockerCommand;
    private String mavenCommand;

    private WorldCoffeeStartupApplication(Options options) {
        this.options = options;
    }

    public static void main(String[] args) {
        try {
            Options options = Options.parse(args);
            WorldCoffeeStartupApplication launcher = new WorldCoffeeStartupApplication(options);
            launcher.run();
        } catch (Exception exception) {
            System.err.println("WorldCoffee 启动失败：" + exception.getMessage());
            exception.printStackTrace(System.err);
            System.exit(1);
        }
    }

    private void run() throws Exception {
        microservicesRoot = locateMicroservicesRoot(options.root());
        logRoot = microservicesRoot.resolve(".run").resolve("launcher-logs");

        if (options.planOnly()) {
            printPlan();
            return;
        }

        ensureJava21();
        dockerCommand = resolveCommand("docker.exe", "docker")
                .orElseThrow(() -> new IllegalStateException("找不到 docker，请先启动 Docker Desktop 并确认 docker 已加入 PATH"));

        Files.createDirectories(logRoot);
        Runtime.getRuntime().addShutdownHook(new Thread(this::stopStartedProcesses, "worldcoffee-launcher-shutdown"));

        startInfrastructure();

        if (!options.skipBuild() && hasMissingServiceJars()) {
            mavenCommand = resolveMavenCommand()
                    .orElseThrow(() -> new IllegalStateException(
                            "找不到 Maven。请安装 Maven 或在 IntelliJ 中配置 Maven 后再启动；也可以先构建全部 *-exec.jar，再使用 --skip-build"));
            buildBackend();
        }

        if (options.skipBuild() && hasMissingServiceJars()) {
            throw new IllegalStateException("缺少服务启动包。请先执行 mvn -DskipTests package，或去掉 --skip-build");
        }

        if (!options.skipSql()) {
            initializeDatabase();
        }

        for (BackendService service : SERVICES) {
            startService(service);
        }

        printSuccessMessage();
        monitorServices();
    }

    private void startInfrastructure() throws Exception {
        Path composeFile = microservicesRoot.resolve("docker-compose.yml");
        if (!Files.isRegularFile(composeFile)) {
            throw new IllegalStateException("找不到 Docker Compose 文件：" + composeFile);
        }

        System.out.println("== 启动 Docker 基础设施 ==");
        Set<String> existingContainers = new LinkedHashSet<>(List.of(
                runAndCapture(List.of(dockerCommand, "ps", "-a", "--format", "{{.Names}}"), microservicesRoot)
                        .split("\\R")
        ));
        List<String> missingComposeServices = new ArrayList<>();

        for (Infrastructure infrastructure : INFRASTRUCTURE) {
            if (!existingContainers.contains(infrastructure.name())) {
                missingComposeServices.add(infrastructure.name());
                continue;
            }

            String running = runAndCapture(List.of(
                    dockerCommand, "inspect", "-f", "{{.State.Running}}", infrastructure.name()), microservicesRoot);
            if (!"true".equalsIgnoreCase(running.trim())) {
                runChecked(List.of(dockerCommand, "start", infrastructure.name()), microservicesRoot, true);
            } else {
                System.out.println("[已运行] Docker 服务 " + infrastructure.name());
            }
        }

        if (!missingComposeServices.isEmpty()) {
            List<String> composeCommand = new ArrayList<>(List.of(
                    dockerCommand, "compose", "-f", composeFile.toString(), "up", "-d"));
            composeCommand.addAll(missingComposeServices);
            runChecked(composeCommand, microservicesRoot, true);
        }

        for (Infrastructure infrastructure : INFRASTRUCTURE) {
            waitForPort(infrastructure.port(), INFRASTRUCTURE_TIMEOUT,
                    "Docker 服务 " + infrastructure.name());
        }
    }

    private void buildBackend() throws Exception {
        System.out.println("== 构建微服务启动包：mvn -DskipTests package ==");
        ProcessBuilder processBuilder = new ProcessBuilder(List.of(mavenCommand, "-DskipTests", "package"))
                .directory(microservicesRoot.toFile())
                .inheritIO();
        Path javaHome = Paths.get(System.getProperty("java.home"));
        String currentPath = processBuilder.environment().getOrDefault("PATH", "");
        processBuilder.environment().put("JAVA_HOME", javaHome.toString());
        processBuilder.environment().put("PATH",
                javaHome.resolve("bin") + System.getProperty("path.separator") + currentPath);
        Process process = processBuilder.start();
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new IllegalStateException("Maven package 失败，退出码=" + exitCode);
        }
    }

    private void initializeDatabase() throws Exception {
        List<Path> sqlFiles = List.of(
                microservicesRoot.resolve("wc-community/src/main/resources/db/feed_event.sql"),
                microservicesRoot.resolve("wc-community/src/main/resources/db/community_phase1.sql"),
                microservicesRoot.resolve("wc-community/src/main/resources/db/community_phase2.sql"),
                microservicesRoot.resolve("wc-admin/src/main/resources/admin_governance.sql")
        );

        System.out.println("== 初始化幂等数据库脚本 ==");
        for (Path sqlFile : sqlFiles) {
            if (!Files.isRegularFile(sqlFile)) {
                System.out.println("跳过不存在的 SQL：" + sqlFile);
                continue;
            }

            String username = environment("DB_USERNAME", "root");
            String password = environment("DB_PASSWORD", "123456");
            String database = environment("DB_NAME", "worldCoffee");
            List<String> command = List.of(
                    dockerCommand, "exec", "-i", "mysql8", "mysql",
                    "--default-character-set=utf8mb4",
                    "-u" + username,
                    "-p" + password,
                    database
            );
            System.out.println("执行 SQL：" + microservicesRoot.relativize(sqlFile));
            ProcessBuilder processBuilder = new ProcessBuilder(command)
                    .directory(microservicesRoot.toFile())
                    .redirectInput(sqlFile.toFile())
                    .redirectError(ProcessBuilder.Redirect.INHERIT)
                    .redirectOutput(ProcessBuilder.Redirect.INHERIT);
            Process process = processBuilder.start();
            if (process.waitFor(60, TimeUnit.SECONDS) && process.exitValue() == 0) {
                continue;
            }
            throw new IllegalStateException("SQL 执行失败：" + sqlFile);
        }
    }

    private void startService(BackendService service) throws Exception {
        if (isPortOpen(service.port())) {
            System.out.printf("[跳过] %s 已占用端口 %d，认为该服务已经启动%n", service.name(), service.port());
            return;
        }

        Path jar = findRunnableJar(service.name())
                .orElseThrow(() -> new IllegalStateException("找不到 " + service.name() + " 的启动包，请先执行 Maven 打包"));
        Path outputLog = logRoot.resolve(service.name() + ".out.log");
        Path errorLog = logRoot.resolve(service.name() + ".err.log");

        List<String> command = List.of(
                javaCommand(),
                "-DLOG_DIR=" + logRoot,
                "-jar",
                jar.toString()
        );
        ProcessBuilder processBuilder = new ProcessBuilder(command)
                .directory(microservicesRoot.toFile())
                .redirectOutput(outputLog.toFile())
                .redirectError(errorLog.toFile());

        System.out.printf("启动 %s（端口 %d）%n", service.name(), service.port());
        Process process = processBuilder.start();
        startedProcesses.add(process);

        Thread.sleep(500);
        if (!process.isAlive()) {
            throw new IllegalStateException(service.name() + " 启动后立即退出，请查看：" + errorLog);
        }
        waitForPort(service.port(), SERVICE_TIMEOUT, service.name());
    }

    private void monitorServices() throws InterruptedException {
        System.out.println("后端服务已启动，启动器保持运行；停止启动器时会停止本次启动的 Java 服务。Docker 容器不会自动停止。");
        if (startedProcesses.isEmpty()) {
            System.out.println("本次没有新启动 Java 服务，现有服务已在运行。");
            return;
        }
        while (true) {
            for (Process process : startedProcesses) {
                if (!process.isAlive()) {
                    throw new IllegalStateException("某个后端服务进程已退出，请查看 .run/launcher-logs");
                }
            }
            Thread.sleep(2000);
        }
    }

    private void waitForPort(int port, Duration timeout, String name) throws InterruptedException {
        long deadline = System.nanoTime() + timeout.toNanos();
        while (System.nanoTime() < deadline) {
            if (isPortOpen(port)) {
                System.out.printf("[就绪] %s：%d%n", name, port);
                return;
            }
            Thread.sleep(1000);
        }
        throw new IllegalStateException(name + " 未在 " + timeout.toSeconds() + " 秒内监听端口 " + port);
    }

    private boolean hasMissingServiceJars() {
        return SERVICES.stream()
                .filter(service -> !isPortOpen(service.port()))
                .anyMatch(service -> findRunnableJar(service.name()).isEmpty());
    }

    private Optional<Path> findRunnableJar(String serviceName) {
        Path targetDirectory = microservicesRoot.resolve(serviceName).resolve("target");
        if (!Files.isDirectory(targetDirectory)) {
            return Optional.empty();
        }

        try (Stream<Path> files = Files.list(targetDirectory)) {
            Optional<Path> execJar = files
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().endsWith("-exec.jar"))
                    .max(Comparator.comparingLong(this::lastModified));
            if (execJar.isPresent()) {
                return execJar;
            }
        } catch (IOException exception) {
            throw new IllegalStateException("无法读取启动包目录：" + targetDirectory, exception);
        }

        try (Stream<Path> files = Files.list(targetDirectory)) {
            return files
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().endsWith(".jar"))
                    .filter(path -> !path.getFileName().toString().endsWith(".original"))
                    .filter(path -> !path.getFileName().toString().contains("-sources"))
                    .filter(path -> !path.getFileName().toString().contains("-javadoc"))
                    .max(Comparator.comparingLong(this::lastModified));
        } catch (IOException exception) {
            throw new IllegalStateException("无法读取启动包目录：" + targetDirectory, exception);
        }
    }

    private long lastModified(Path path) {
        try {
            return Files.getLastModifiedTime(path).toMillis();
        } catch (IOException exception) {
            return 0L;
        }
    }

    private void printPlan() {
        System.out.println("WorldCoffee 启动计划（不会执行任何命令）");
        System.out.println("微服务目录：" + microservicesRoot);
        System.out.println("Docker：docker compose -f docker-compose.yml up -d");
        if (hasMissingServiceJars()) {
            System.out.println("构建：mvn -DskipTests package");
        } else {
            System.out.println("构建：已找到全部服务启动包，跳过 Maven 构建");
        }
        for (BackendService service : SERVICES) {
            System.out.printf("服务：%s -> %d%n", service.name(), service.port());
        }
        System.out.println("日志目录：" + microservicesRoot.resolve(".run/launcher-logs"));
    }

    private void printSuccessMessage() {
        System.out.println();
        System.out.println("WorldCoffee 后端启动完成：");
        System.out.println("网关：http://localhost:8080");
        System.out.println("Nacos：http://localhost:8848/nacos");
        System.out.println("日志：" + logRoot);
    }

    private void ensureJava21() {
        int feature = Runtime.version().feature();
        if (feature < 21) {
            throw new IllegalStateException("当前启动器运行在 Java " + feature + "，项目要求 Java 21。请在 IntelliJ 中把该启动配置切换到 JDK 21");
        }
    }

    private String javaCommand() {
        Path javaHome = Paths.get(System.getProperty("java.home"));
        Path executable = javaHome.resolve("bin").resolve(isWindows() ? "java.exe" : "java");
        if (!Files.isRegularFile(executable)) {
            throw new IllegalStateException("当前 Java 环境缺少可执行文件：" + executable);
        }
        return executable.toString();
    }

    private Optional<String> resolveMavenCommand() {
        Path wrapper = microservicesRoot.resolve(isWindows() ? "mvnw.cmd" : "mvnw");
        if (Files.isRegularFile(wrapper)) {
            return Optional.of(wrapper.toString());
        }

        Optional<String> pathMaven = resolveCommand(isWindows() ? "mvn.cmd" : "mvn", "mvn");
        if (pathMaven.isPresent()) {
            return pathMaven;
        }

        String mavenHome = System.getenv("MAVEN_HOME");
        if (mavenHome != null && !mavenHome.isBlank()) {
            Path configuredMaven = Paths.get(mavenHome).resolve("bin").resolve(isWindows() ? "mvn.cmd" : "mvn");
            if (Files.isRegularFile(configuredMaven)) {
                return Optional.of(configuredMaven.toString());
            }
        }

        if (isWindows()) {
            // IntelliJ 自带的 Maven 位于 IDEA 安装目录下，运行类时通常能从 java.home 反推出该目录。
            Path javaHome = Paths.get(System.getProperty("java.home"));
            Path ideaRoot = javaHome.getParent();
            if (ideaRoot != null) {
                Path bundledMaven = ideaRoot.resolve("plugins/maven-plugin/lib/maven3/bin/mvn.cmd");
                if (Files.isRegularFile(bundledMaven)) {
                    return Optional.of(bundledMaven.toString());
                }
            }
        }

        return Optional.empty();
    }

    private Optional<String> resolveCommand(String... commandNames) {
        List<Path> pathEntries = new ArrayList<>();
        String path = System.getenv("PATH");
        if (path != null) {
            for (String entry : path.split(java.util.regex.Pattern.quote(System.getProperty("path.separator")))) {
                if (!entry.isBlank()) {
                    try {
                        pathEntries.add(Paths.get(entry));
                    } catch (InvalidPathException ignored) {
                        // Windows 环境变量可能混入被错误编码的路径，跳过即可继续扫描其它 PATH 项。
                    }
                }
            }
        }

        for (String commandName : commandNames) {
            for (Path entry : pathEntries) {
                Path candidate = entry.resolve(commandName);
                if (Files.isRegularFile(candidate)) {
                    return Optional.of(candidate.toString());
                }
            }
        }
        return Optional.empty();
    }

    private static Path locateMicroservicesRoot(Path requestedRoot) {
        Path start = requestedRoot == null
                ? Paths.get(System.getProperty("user.dir"))
                : requestedRoot;
        start = start.toAbsolutePath().normalize();

        for (Path current = start; current != null; current = current.getParent()) {
            if (isMicroservicesRoot(current)) {
                return current;
            }
            Path child = current.resolve("microservices");
            if (isMicroservicesRoot(child)) {
                return child;
            }
        }
        throw new IllegalStateException("无法定位 microservices 目录，请从项目目录启动，或传入 --root <microservices目录>");
    }

    private static boolean isMicroservicesRoot(Path path) {
        return Files.isRegularFile(path.resolve("docker-compose.yml"))
                && Files.isDirectory(path.resolve("wc-gateway"));
    }

    private static boolean isPortOpen(int port) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress("127.0.0.1", port), PORT_PROBE_TIMEOUT_MILLIS);
            return true;
        } catch (IOException ignored) {
            return false;
        }
    }

    private static int runChecked(List<String> command, Path workingDirectory, boolean inheritOutput)
            throws IOException, InterruptedException {
        System.out.println("执行：" + String.join(" ", command));
        ProcessBuilder processBuilder = new ProcessBuilder(command).directory(workingDirectory.toFile());
        if (inheritOutput) {
            processBuilder.inheritIO();
        }
        Process process = processBuilder.start();
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new IllegalStateException("命令执行失败，退出码=" + exitCode + "：" + command.get(0));
        }
        return exitCode;
    }

    private static String runAndCapture(List<String> command, Path workingDirectory)
            throws IOException, InterruptedException {
        Process process = new ProcessBuilder(command)
                .directory(workingDirectory.toFile())
                .redirectErrorStream(true)
                .start();
        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new IllegalStateException("命令执行失败，退出码=" + exitCode + "：" + command.get(0));
        }
        return output.trim();
    }

    private void stopStartedProcesses() {
        for (Process process : startedProcesses) {
            if (!process.isAlive()) {
                continue;
            }
            process.destroy();
            try {
                if (!process.waitFor(5, TimeUnit.SECONDS)) {
                    process.destroyForcibly();
                }
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                process.destroyForcibly();
            }
        }
    }

    private static String environment(String name, String fallback) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? fallback : value;
    }

    private static boolean isWindows() {
        return System.getProperty("os.name", "").toLowerCase(Locale.ROOT).contains("win");
    }

    private record Infrastructure(String name, int port) {
    }

    private record BackendService(String name, int port) {
    }

    private record Options(Path root, boolean skipBuild, boolean skipSql, boolean planOnly) {

        private static Options parse(String[] args) {
            Path root = null;
            boolean skipBuild = false;
            boolean skipSql = false;
            boolean planOnly = false;

            for (int index = 0; index < args.length; index++) {
                String argument = Objects.requireNonNull(args[index]);
                switch (argument) {
                    case "--root" -> {
                        if (++index >= args.length) {
                            throw new IllegalArgumentException("--root 后面必须跟 microservices 目录");
                        }
                        root = Paths.get(args[index]);
                    }
                    case "--skip-build" -> skipBuild = true;
                    case "--skip-sql" -> skipSql = true;
                    case "--plan" -> planOnly = true;
                    case "--help", "-h" -> {
                        printUsage();
                        System.exit(0);
                    }
                    default -> throw new IllegalArgumentException("未知参数：" + argument + "，使用 --help 查看用法");
                }
            }
            return new Options(root, skipBuild, skipSql, planOnly);
        }

        private static void printUsage() {
            System.out.println("WorldCoffee 启动器参数：");
            System.out.println("  --plan        只打印启动计划，不执行 Docker、Maven 或服务");
            System.out.println("  --skip-build  不执行 Maven，要求 target 下已有启动包");
            System.out.println("  --skip-sql    不执行幂等数据库初始化脚本");
            System.out.println("  --root PATH   指定 microservices 目录");
        }
    }
}
