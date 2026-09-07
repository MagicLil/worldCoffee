param(
  [switch]$SkipInfra,
  [switch]$SkipBuild,
  [switch]$SkipSql,
  [switch]$SkipFrontend,
  [switch]$SkipHealthCheck,
  [switch]$ForceRestartPorts
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$microRoot = Join-Path $repoRoot 'microservices'
$runRoot = Join-Path $microRoot '.run'
$logRoot = Join-Path $runRoot 'logs'
$pidRoot = Join-Path $runRoot 'pids'

New-Item -ItemType Directory -Force -Path $logRoot, $pidRoot | Out-Null

function Get-JavaMajorVersion($javaPath) {
  if ($env:OS -eq 'Windows_NT') {
    $versionText = (& cmd.exe /c "`"$javaPath`" -version 2>&1" | Out-String)
  } else {
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'SilentlyContinue'
    try {
      $versionText = (& $javaPath -version 2>&1 | Out-String)
    } finally {
      $ErrorActionPreference = $previousErrorActionPreference
    }
  }
  if ($versionText -match 'version\s+"(\d+)') {
    return [int]$Matches[1]
  }
  return 0
}

function Resolve-Java21 {
  $candidates = New-Object System.Collections.Generic.List[string]

  if ($env:JAVA_HOME) {
    $candidates.Add((Join-Path $env:JAVA_HOME 'bin\java.exe'))
  }

  $pathJava = Get-Command java -ErrorAction SilentlyContinue
  if ($pathJava) {
    $candidates.Add($pathJava.Source)

    $javaBin = Split-Path -Parent $pathJava.Source
    $javaRoot = Split-Path -Parent $javaBin
    $toolRoot = Split-Path -Parent $javaRoot
    if (Test-Path $toolRoot) {
      Get-ChildItem $toolRoot -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^(java|jdk).*(21|22|23|24|25)' } |
        ForEach-Object { $candidates.Add((Join-Path $_.FullName 'bin\java.exe')) }
    }
  }

  foreach ($candidate in $candidates | Select-Object -Unique) {
    if ((Test-Path $candidate) -and ((Get-JavaMajorVersion $candidate) -ge 21)) {
      return $candidate
    }
  }

  throw 'Java 21 or newer was not found. Set JAVA_HOME to a JDK 21 installation before starting the services.'
}

function Resolve-MavenCommand {
  $maven = Get-Command mvn.cmd -ErrorAction SilentlyContinue
  if (-not $maven) { $maven = Get-Command mvn -ErrorAction SilentlyContinue }
  if ($maven) { return $maven.Source }

  $wrapper = Join-Path $microRoot 'mvnw.cmd'
  if (Test-Path $wrapper) { return $wrapper }

  if ($env:MAVEN_HOME) {
    $configuredMaven = Join-Path $env:MAVEN_HOME 'bin\mvn.cmd'
    if (Test-Path $configuredMaven) { return $configuredMaven }
  }

  throw 'Maven was not found. Install Maven, add it to PATH, or provide mvnw.cmd.'
}

function Test-PortOpen([int]$port) {
  try {
    $client = [Net.Sockets.TcpClient]::new()
    $iar = $client.BeginConnect('127.0.0.1', $port, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(800)
    if ($ok) { $client.EndConnect($iar) }
    $client.Close()
    return $ok
  } catch {
    return $false
  }
}

function Get-PortPid([int]$port) {
  $lines = netstat -ano | Select-String -Pattern "LISTENING\s+(\d+)$" | Where-Object { $_.Line -match "[:.]$port\s" }
  foreach ($line in $lines) {
    if ($line.Line -match 'LISTENING\s+(\d+)$') {
      return [int]$Matches[1]
    }
  }
  return $null
}

function Stop-PortOwner([int]$port, $name) {
  $pidOnPort = Get-PortPid $port
  if ($pidOnPort) {
    Write-Host "Stopping existing process on port $port for $name pid=$pidOnPort"
    Stop-Process -Id $pidOnPort -Force
    for ($i = 0; $i -lt 20; $i++) {
      if (-not (Test-PortOpen $port)) { return }
      Start-Sleep -Milliseconds 500
    }
    throw "Port $port is still listening after stopping pid=$pidOnPort"
  }
}

function Start-JavaService($name, [int]$port, $jarRelative) {
  $jar = Join-Path $microRoot $jarRelative
  if (Test-PortOpen $port) {
    if ($ForceRestartPorts) {
      Stop-PortOwner $port $name
    } else {
      Write-Host "$name port $port is already listening. Skip start. Use -ForceRestartPorts to replace stale services."
      return
    }
  }
  if (-not (Test-Path $jar)) {
    throw "$name jar not found: $jar. Run without -SkipBuild first."
  }
  $out = Join-Path $logRoot "$name.out.log"
  $err = Join-Path $logRoot "$name.err.log"
  Write-Host "Starting $name -> port $port"
  $proc = Start-Process -FilePath $javaCommand `
    -ArgumentList @("-DLOG_DIR=$logRoot", '-jar', $jar) `
    -WorkingDirectory $microRoot `
    -RedirectStandardOutput $out `
    -RedirectStandardError $err `
    -PassThru `
    -WindowStyle Hidden
  Set-Content -Path (Join-Path $pidRoot "$name.pid") -Value $proc.Id -Encoding ASCII
}

function Start-Frontend($name, $dirRelative, [int]$port) {
  if (Test-PortOpen $port) {
    if ($ForceRestartPorts) {
      Stop-PortOwner $port $name
    } else {
      Write-Host "$name port $port is already listening. Skip start. Use -ForceRestartPorts to replace stale services."
      return
    }
  }
  $dir = Join-Path $repoRoot $dirRelative
  if (-not (Test-Path $dir)) { throw "$name directory not found: $dir" }
  if (-not (Test-Path (Join-Path $dir 'node_modules'))) {
    Write-Host "$name node_modules not found. Running npm install ..."
    Push-Location $dir
    try { npm install } finally { Pop-Location }
  }
  $out = Join-Path $logRoot "$name.out.log"
  $err = Join-Path $logRoot "$name.err.log"
  Write-Host "Starting $name -> port $port"
  $proc = Start-Process -FilePath 'npm.cmd' `
    -ArgumentList @('run', 'dev', '--', '--host', '127.0.0.1', '--port', "$port") `
    -WorkingDirectory $dir `
    -RedirectStandardOutput $out `
    -RedirectStandardError $err `
    -PassThru `
    -WindowStyle Hidden
  Set-Content -Path (Join-Path $pidRoot "$name.pid") -Value $proc.Id -Encoding ASCII
}

function Invoke-SqlFile($file) {
  if (-not (Test-Path $file)) { return }
  Write-Host "Running SQL: $file"
  $cmd = "type `"$file`" | docker exec -i mysql8 mysql --default-character-set=utf8mb4 -uroot -p123456 worldCoffee"
  cmd /c $cmd
}

$javaCommand = Resolve-Java21
$javaHomeForStartup = Split-Path -Parent (Split-Path -Parent $javaCommand)
$env:JAVA_HOME = $javaHomeForStartup
$env:Path = "$javaHomeForStartup\bin;$env:Path"
$mavenCommand = $null
if (-not $SkipBuild) {
  $mavenCommand = Resolve-MavenCommand
}

if (-not $SkipInfra) {
  & (Join-Path $PSScriptRoot 'start-infra.ps1') -Wait
}

if (-not $SkipBuild) {
  Push-Location $microRoot
  try {
    Write-Host 'Packaging backend: mvn -DskipTests package'
    & $mavenCommand -DskipTests package
    if ($LASTEXITCODE -ne 0) {
      throw "Maven package failed with exit code $LASTEXITCODE."
    }
  } finally {
    Pop-Location
  }
}

if (-not $SkipSql) {
  Invoke-SqlFile (Join-Path $microRoot 'wc-community\src\main\resources\db\feed_event.sql')
  Invoke-SqlFile (Join-Path $microRoot 'wc-community\src\main\resources\db\community_phase1.sql')
  Invoke-SqlFile (Join-Path $microRoot 'wc-community\src\main\resources\db\community_phase2.sql')
  Invoke-SqlFile (Join-Path $microRoot 'wc-admin\src\main\resources\admin_governance.sql')
}

$javaServices = @(
  @{ Name = 'wc-user'; Port = 8082; Jar = 'wc-user\target\wc-user-0.0.1-SNAPSHOT-exec.jar' },
  @{ Name = 'wc-shop'; Port = 8081; Jar = 'wc-shop\target\wc-shop-0.0.1-SNAPSHOT-exec.jar' },
  @{ Name = 'wc-community'; Port = 8083; Jar = 'wc-community\target\wc-community-0.0.1-SNAPSHOT-exec.jar' },
  @{ Name = 'wc-message'; Port = 8084; Jar = 'wc-message\target\wc-message-0.0.1-SNAPSHOT-exec.jar' },
  @{ Name = 'wc-ai'; Port = 8085; Jar = 'wc-ai\target\wc-ai-0.0.1-SNAPSHOT-exec.jar' },
  @{ Name = 'wc-admin'; Port = 8086; Jar = 'wc-admin\target\wc-admin-0.0.1-SNAPSHOT-exec.jar' },
  @{ Name = 'wc-gateway'; Port = 8080; Jar = 'wc-gateway\target\wc-gateway-0.0.1-SNAPSHOT-exec.jar' }
)

foreach ($svc in $javaServices) {
  Start-JavaService $svc.Name $svc.Port $svc.Jar
}

if (-not $SkipFrontend) {
  Start-Frontend 'frontend' 'frontend' 3000
  Start-Frontend 'admin-frontend' 'admin-frontend' 5173
}

if (-not $SkipHealthCheck) {
  Write-Host 'Waiting for services to become stable ...'
  Start-Sleep -Seconds 12
  & (Join-Path $PSScriptRoot 'health-check.ps1')
}

Write-Host ''
Write-Host 'Startup complete.'
Write-Host 'Frontend: http://localhost:3000'
Write-Host 'Admin frontend: http://localhost:5173'
Write-Host 'Gateway: http://localhost:8080'
Write-Host "Logs: $logRoot"
