# Legacy Monolith（旧单体后端）

> 状态：保留，不再作为默认开发或部署路径。

`backend/` 是 WorldCoffee 早期的单体实现，覆盖用户、社区、商城、通知、私信和 AI 功能。当前的默认后端是仓库根目录下的 `microservices/`。

## 维护边界

- 新功能、日常缺陷修复和部署只进入 `microservices/`。
- 本目录仅用于接口对照、迁移验收、紧急回退和保留历史实现。
- 不要同时启动单体和微服务网关；两者默认都会占用 `8080`。
- 在确认微服务接口和数据行为覆盖完成前，不删除本目录。

## 需要运行单体时

```powershell
cd backend
.\mvnw.cmd clean package -DskipTests
.\mvnw.cmd spring-boot:run -pl worldcoffee-admin
```

默认开发、启动和健康检查说明请看 `microservices/docs/production-stability-runbook.md`。
