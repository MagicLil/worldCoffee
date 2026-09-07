# World Coffee 本地启动与稳定性 Runbook

这份文档是给项目作者、接手同学、或者以后忘了怎么启动的自己看的。目标不是讲源码，而是把“怎么一键跑起来、怎么确认真的健康、出问题先看哪里”说清楚。

## 1. 一句话启动

在 Windows PowerShell 或双击脚本均可：

```powershell
cd D:\mycode\worldCoffee\worldCoffee\microservices
.\start-all.bat
```

如果你已经打开 PowerShell，也可以直接运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-all.ps1
```

如果你之前在 IDEA 或旧脚本里已经启动过服务，端口可能被旧包占住。默认脚本为了安全不会乱杀端口进程，只会跳过。要明确替换旧服务，用：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-all.ps1 -ForceRestartPorts
```

启动脚本会做这些事：

1. 启动 Docker 基础设施：MySQL、Redis、RabbitMQ、Nacos、Elasticsearch、MinIO、Chroma。
2. 打包后端微服务：`mvn -DskipTests package`。
3. 执行幂等 SQL：Feed、话题/草稿/举报、收藏夹/不感兴趣/视频笔记/内容治理。
4. 启动 7 个后端服务。
5. 启动用户端前端和管理后台前端。
6. 执行健康检查、Nacos 注册检查、网关路由自检。

## 1.1 IntelliJ 一键启动后端

项目新增了统一启动类：

```text
wc-launcher/src/main/java/cn/lx/worldcoffee/launcher/WorldCoffeeStartupApplication.java
```

在 IntelliJ 中用 **Java 21** 运行这个类即可。它会：

1. 复用已经存在的 Docker 容器；缺少的容器才交给 Compose 创建。
2. 如果服务启动包不存在，自动执行 `mvn -DskipTests package`。
3. 按用户、商城、社区、消息、AI、管理端、网关的顺序启动后端。
4. 等待基础设施和服务端口就绪，并把服务日志写入 `.run/launcher-logs`。

启动器只负责后端和 Docker，不启动两个前端。停止 IntelliJ 中的启动器时，只会停止本次启动的 Java 服务，Docker 容器会继续运行。

可选参数：

```text
--plan        只打印启动计划，不执行命令
--skip-build  不执行 Maven，要求各服务 target 下已有启动包
--skip-sql    不执行幂等数据库初始化脚本
--root PATH   指定 microservices 目录
```

脚本输出是英文，这是为了兼容 Windows PowerShell 5 的脚本编码；本文档保持中文。

## 2. 常用入口

| 用途 | 地址 | 说明 |
| --- | --- | --- |
| 用户端 | <http://localhost:3000> | WorldCoffee 咖啡社区主前端 |
| 管理后台 | <http://localhost:5173> | 管理后台前端 |
| 网关 | <http://localhost:8080> | 所有前端 API 统一入口 |
| Nacos 控制台 | <http://localhost:8848/nacos> | 服务注册中心 |
| RabbitMQ 控制台 | <http://localhost:15672> | 账号/密码：`guest/guest` |
| MinIO 控制台 | <http://localhost:9001> | 账号/密码：`minioadmin/minioadmin` |
| Elasticsearch | <http://localhost:9200> | 商品搜索依赖 |

管理后台默认账号密码：

```text
username: admin
password: admin123
```

## 3. 端口表

| 服务 | 端口 | Nacos 服务名 | 主要职责 |
| --- | ---: | --- | --- |
| wc-gateway | 8080 | wc-gateway | API 网关、JWT 透传、CORS、路由 |
| wc-shop | 8081 | wc-shop | 商品、订单、购物车、营销 |
| wc-user | 8082 | wc-user | 登录、注册、用户资料 |
| wc-community | 8083 | wc-community | 笔记、Feed、评论、话题、收藏 |
| wc-message | 8084 | wc-message | 通知、私信、SSE |
| wc-ai | 8085 | wc-ai | AI 对话 |
| wc-admin | 8086 | wc-admin | 管理后台 API |
| frontend | 3000 | - | 用户端 Vite |
| admin-frontend | 5173 | - | 管理端 Vite |

## 4. 基础设施启动方式

只启动 Docker 基础设施：

```powershell
cd D:\mycode\worldCoffee\worldCoffee\microservices
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-infra.ps1 -Wait
```

对应 Compose 文件：

```text
microservices/docker-compose.yml
```

脚本逻辑：

- 如果本机已经有 `mysql8`、`redis`、`rabbitmq`、`nacos`、`es`、`worldcoffee-minio`、`chroma` 这些容器，就直接 `docker start`。
- 如果缺少某个容器，就用 `docker compose up -d <service>` 创建缺失的服务。
- 不会删除已有容器，不会清空数据卷。

## 5. 健康检查

手动执行：

```powershell
cd D:\mycode\worldCoffee\worldCoffee\microservices
.\health-check.bat
```

或者：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\health-check.ps1
```

健康检查覆盖：

1. Docker 容器是否运行。
2. 基础设施端口是否监听。
3. 每个后端服务端口是否监听。
4. 每个后端服务 `/actuator/health` 是否 UP。
5. Nacos 是否能查到服务实例。
6. 网关 `/actuator/gateway/routes` 是否包含关键路由。
7. 网关公开接口是否能打通：
   - `/api/shop/products`
   - `/api/coffee/posts/recommend`
   - `/api/admin/login` 预检
   - `/api/user/me` 未登录返回 401
8. 用户前端 3000 和管理前端 5173 是否监听。

如果只想检查后端，跳过前端：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\health-check.ps1 -SkipFrontend
```

## 6. 停止服务

停止脚本启动过的 Java/Vite 进程：

```powershell
cd D:\mycode\worldCoffee\worldCoffee\microservices
.\stop-all.bat
```

注意：不要只关闭启动脚本窗口。Windows 上脚本启动出来的 Java 和 Node 子进程可能还会继续在后台运行，浏览器仍然能访问就是因为端口还被这些子进程占着。请用 `stop-all.bat` 停服务。

`stop-all.bat` 会先按 `.run\pids` 里记录的 PID 停止服务；如果 PID 已经过期，还会兜底检查并释放 WorldCoffee 固定端口：`3000`、`5173`、`8080` 到 `8086`。

同时停止 Docker 基础设施：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stop-all.ps1 -StopInfra
```

说明：停止脚本只处理 WorldCoffee 的固定端口和 `.run/pids/*.pid` 记录的进程，不会扫描全系统乱杀所有 Java 或 Node 进程。

## 7. 日志与 traceId

本轮补了基础日志追踪：

- 网关会生成或透传 `X-Trace-Id`。
- MVC 微服务也会生成或透传 `X-Trace-Id`。
- 日志格式包含：

```text
[traceId=xxxx]
```

启动脚本的日志目录：

```text
microservices/.run/logs
```

每个服务会有：

```text
wc-gateway.out.log
wc-gateway.err.log
wc-user.out.log
...
```

如果接口出问题，建议按这个顺序查：

1. 浏览器 Network 里看响应头 `X-Trace-Id`。
2. 在 `.run/logs` 里搜索这个 traceId。
3. 先看网关日志，再看目标微服务日志。

## 8. 网关路由自检

网关路由来自：

```text
microservices/wc-gateway/src/main/resources/application.yml
```

当前关键路由：

| 路由 ID | 路径 | 下游服务 |
| --- | --- | --- |
| wc-uploads | `/uploads/**` | wc-user |
| wc-admin | `/api/admin/**` | wc-admin |
| wc-shop | `/api/shop/**` | wc-shop |
| wc-community | `/api/coffee/**` | wc-community |
| wc-user | `/api/user/**,/api/users/**` | wc-user |
| wc-message-notification | `/api/notifications/**` | wc-message |
| wc-message-chat | `/api/messages/**` | wc-message |
| wc-ai | `/api/ai/**` | wc-ai |

网关路由详情：

```text
http://localhost:8080/actuator/gateway/routes
```

如果这里没有某条路由，说明不是前端问题，是网关配置或网关启动包问题。

## 9. 基础测试

新增了两个基础测试：

| 测试 | 作用 |
| --- | --- |
| `GatewayRouteConfigTest` | 防止关键网关路由被误删 |
| `TraceIdFilterTest` | 防止 traceId 生成/透传失效 |

运行：

```powershell
cd D:\mycode\worldCoffee\worldCoffee\microservices
mvn -pl wc-gateway,wc-common -am test
```

全量打包：

```powershell
cd D:\mycode\worldCoffee\worldCoffee\microservices
mvn -DskipTests package
```

## 10. 数据库脚本

启动脚本会自动执行这些幂等 SQL：

```text
wc-community/src/main/resources/db/feed_event.sql
wc-community/src/main/resources/db/community_phase1.sql
wc-community/src/main/resources/db/community_phase2.sql
wc-admin/src/main/resources/admin_governance.sql
```

如果手动执行，推荐用 Docker MySQL：

```powershell
cmd /c type wc-community\src\main\resources\db\community_phase2.sql | docker exec -i mysql8 mysql --default-character-set=utf8mb4 -uroot -p123456 worldCoffee
cmd /c type wc-admin\src\main\resources\admin_governance.sql | docker exec -i mysql8 mysql --default-character-set=utf8mb4 -uroot -p123456 worldCoffee
```

注意：不要用普通 PowerShell `Get-Content | mysql` 管道执行中文 SQL，可能会把中文注释编码打坏。

## 11. 常见问题

### 11.1 网页报 503

优先跑：

```powershell
.\health-check.bat
```

如果某个服务端口没开，说明下游微服务没起来。比如推荐流 503 通常看 `wc-community` 和 `wc-gateway`。

如果端口开着但 `/actuator/health` 失败，常见原因是旧进程占着端口。用下面命令强制替换旧服务：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-all.ps1 -SkipBuild -SkipSql -SkipFrontend -ForceRestartPorts
```

### 11.2 网关能开，接口 401

这是正常的未登录保护。比如：

```text
/api/user/me
```

未登录应该返回 401。登录、注册、商品列表、推荐 Feed、上传静态资源等路径有白名单或可选登录逻辑。

### 11.3 Nacos 查不到服务

检查：

1. `nacos` 容器是否运行。
2. <http://localhost:8848/nacos> 是否能打开。
3. 对应服务日志里是否有 Nacos 注册错误。
4. 服务自己的 `/actuator/health` 是否 UP。

### 11.4 Maven package 失败

先确认没有旧 Java 服务占用正在打包的 jar。现在主要服务都使用 `*-exec.jar` 启动包，降低了 `.jar.original` 改名冲突概率。

### 11.5 前端打不开

检查端口：

```powershell
netstat -ano | findstr 3000
netstat -ano | findstr 5173
```

用户端固定 3000，管理端固定 5173。

## 12. 新人接手建议顺序

1. 先双击 `microservices/start-all.bat`。
2. 等健康检查跑完。
3. 打开 `http://localhost:3000` 看用户端。
4. 打开 `http://localhost:5173` 看管理后台。
5. 如果有红色 FAIL，先看 `microservices/.run/logs`。
6. 复制 `X-Trace-Id` 到日志里搜。

这套流程的核心思想很朴素：不要只相信“启动日志显示 Started”，要同时看端口、Actuator、Nacos 注册和网关路由。
