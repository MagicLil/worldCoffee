param(
  [string]$GatewayBaseUrl = 'http://localhost:8080',
  [string]$NacosBaseUrl = 'http://localhost:8848',
  [switch]$SkipFrontend
)

$ErrorActionPreference = 'Continue'
$script:failed = 0
$script:warned = 0

$services = @(
  @{ Name = 'wc-gateway'; Port = 8080 },
  @{ Name = 'wc-shop'; Port = 8081 },
  @{ Name = 'wc-user'; Port = 8082 },
  @{ Name = 'wc-community'; Port = 8083 },
  @{ Name = 'wc-message'; Port = 8084 },
  @{ Name = 'wc-ai'; Port = 8085 },
  @{ Name = 'wc-admin'; Port = 8086 }
)

$containers = @(
  @{ Name = 'mysql8'; Port = 3306 },
  @{ Name = 'redis'; Port = 6379 },
  @{ Name = 'rabbitmq'; Port = 5672 },
  @{ Name = 'nacos'; Port = 8848 },
  @{ Name = 'es'; Port = 9200 },
  @{ Name = 'worldcoffee-minio'; Port = 9000 },
  @{ Name = 'chroma'; Port = 8000 }
)

$gatewayRoutes = @(
  'wc-uploads',
  'wc-admin',
  'wc-shop',
  'wc-community',
  'wc-user',
  'wc-message-notification',
  'wc-message-chat',
  'wc-ai'
)

function Write-Check($state, $name, $detail = '') {
  $color = if ($state -eq 'PASS') { 'Green' } elseif ($state -eq 'WARN') { 'Yellow' } else { 'Red' }
  Write-Host ("[{0}] {1} {2}" -f $state, $name, $detail) -ForegroundColor $color
  if ($state -eq 'FAIL') { $script:failed++ }
  if ($state -eq 'WARN') { $script:warned++ }
}

function Test-PortOpen([int]$port) {
  try {
    $client = [Net.Sockets.TcpClient]::new()
    $iar = $client.BeginConnect('127.0.0.1', $port, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(700)
    if ($ok) { $client.EndConnect($iar) }
    $client.Close()
    return $ok
  } catch {
    return $false
  }
}

function Test-Http($method, $url, [int[]]$okStatuses = @(200)) {
  try {
    $response = Invoke-WebRequest -Method $method -Uri $url -TimeoutSec 5 -UseBasicParsing -Headers @{
      Origin = 'http://localhost:3000'
      'Access-Control-Request-Method' = 'GET'
    }
    return $okStatuses -contains [int]$response.StatusCode
  } catch {
    if ($_.Exception.Response -and ($okStatuses -contains [int]$_.Exception.Response.StatusCode)) {
      return $true
    }
    return $false
  }
}

Write-Host '== Docker infrastructure =='
foreach ($container in $containers) {
  $running = $false
  try {
    $running = (docker inspect -f '{{.State.Running}}' $container.Name 2>$null) -eq 'true'
  } catch {}
  if ($running -and (Test-PortOpen $container.Port)) {
    Write-Check PASS $container.Name "port=$($container.Port)"
  } elseif ($running) {
    Write-Check WARN $container.Name "container is running, port $($container.Port) is not open yet"
  } else {
    Write-Check FAIL $container.Name 'container is not running'
  }
}

Write-Host ''
Write-Host '== Service ports and actuator health =='
foreach ($service in $services) {
  if (Test-PortOpen $service.Port) {
    Write-Check PASS "$($service.Name) port" "port=$($service.Port)"
  } else {
    Write-Check FAIL "$($service.Name) port" "port=$($service.Port)"
    continue
  }

  $healthUrl = "http://localhost:$($service.Port)/actuator/health"
  try {
    $health = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 5
    if ($health.status -eq 'UP') {
      Write-Check PASS "$($service.Name) health" $health.status
    } else {
      Write-Check WARN "$($service.Name) health" $health.status
    }
  } catch {
    Write-Check FAIL "$($service.Name) health" $healthUrl
  }
}

Write-Host ''
Write-Host '== Nacos registration =='
foreach ($service in $services) {
  $urls = @(
    "$NacosBaseUrl/nacos/v1/ns/instance/list?serviceName=$($service.Name)",
    "$NacosBaseUrl/nacos/v1/ns/instance/list?serviceName=$($service.Name)&username=nacos&password=nacos"
  )
  $ok = $false
  foreach ($url in $urls) {
    try {
      $data = Invoke-RestMethod -Uri $url -TimeoutSec 5
      if ($data.hosts -and $data.hosts.Count -gt 0) {
        $ok = $true
        break
      }
    } catch {}
  }
  if ($ok) {
    Write-Check PASS "$($service.Name) registered"
  } else {
    Write-Check WARN "$($service.Name) registered" 'Nacos returned no instance or requires console token'
  }
}

Write-Host ''
Write-Host '== Gateway route self-check =='
try {
  $routes = Invoke-RestMethod -Uri "$GatewayBaseUrl/actuator/gateway/routes" -TimeoutSec 5
  $routeText = $routes | ConvertTo-Json -Depth 8
  foreach ($routeId in $gatewayRoutes) {
    if ($routeText -like "*$routeId*") {
      Write-Check PASS "route $routeId"
    } else {
      Write-Check FAIL "route $routeId" 'missing from actuator route list'
    }
  }
} catch {
  Write-Check FAIL 'gateway routes actuator' "$GatewayBaseUrl/actuator/gateway/routes"
}

$routeChecks = @(
  @{ Name = 'shop public route'; Method = 'GET'; Url = "$GatewayBaseUrl/api/shop/products?page=1&size=1"; Status = @(200) },
  @{ Name = 'community recommend route'; Method = 'GET'; Url = "$GatewayBaseUrl/api/coffee/posts/recommend?page=1&size=1&sessionId=healthcheck"; Status = @(200) },
  @{ Name = 'admin login preflight'; Method = 'OPTIONS'; Url = "$GatewayBaseUrl/api/admin/login"; Status = @(200,204) },
  @{ Name = 'user protected route reachable'; Method = 'GET'; Url = "$GatewayBaseUrl/api/user/me"; Status = @(401) }
)

foreach ($check in $routeChecks) {
  if (Test-Http $check.Method $check.Url $check.Status) {
    Write-Check PASS $check.Name
  } else {
    Write-Check FAIL $check.Name $check.Url
  }
}

if (-not $SkipFrontend) {
  Write-Host ''
  Write-Host '== Frontend ports =='
  if (Test-PortOpen 3000) { Write-Check PASS 'frontend' 'http://localhost:3000' } else { Write-Check WARN 'frontend' '3000 is not listening' }
  if (Test-PortOpen 5173) { Write-Check PASS 'admin-frontend' 'http://localhost:5173' } else { Write-Check WARN 'admin-frontend' '5173 is not listening' }
}

Write-Host ''
if ($script:failed -gt 0) {
  Write-Host "Health check failed: $script:failed failed, $script:warned warnings." -ForegroundColor Red
  exit 1
}

Write-Host "Health check passed: 0 failed, $script:warned warnings." -ForegroundColor Green
