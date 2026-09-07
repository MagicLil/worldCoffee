# WorldCoffee（世界咖啡）

> 一个**咖啡爱好者社区 + 电商 + AI 助手**平台：发帖互动、线上商城、实时通知与私信，以及基于阿里云百炼（DashScope / Qwen）的 AI 问答。

---

## 目录

- [项目简介](#项目简介)
- [技术栈](#技术栈)
- [架构与模块](#架构与模块)
- [快速开始](#快速开始)
- [默认端口](#默认端口)
- [环境变量一览](#环境变量一览)
- [安全须知](#安全须知)
- [许可证](#许可证)

---

## 项目简介

WorldCoffee 把"咖啡社区"和"咖啡电商"合在一起，并接入大模型做智能助手：

- **社区**：帖子、评论、点赞、关注、Feed 流
- **商城**：商品、购物车、订单、优惠券、秒杀、支付、Elasticsearch 搜索
- **实时**：通知（SSE）+ 私信（RabbitMQ + SSE）
- **AI**：基于阿里云百炼（DashScope / Qwen）的对话问答 + 知识库向量检索

---

## 技术栈

| 层 | 技术 |
|----|------|
| 单体后端 `backend/`（遗留） | Spring Boot **3.4.1** · Java **21** · MyBatis-Plus · Spring Security · JWT · Spring AI 1.1.2 |
| 微服务 `microservices/` | Spring Boot **3.2.5** · Java **21** · Spring Cloud Alibaba（Nacos）· Spring AI 1.0.0 |
| 用户前端 `frontend/` | Vue 3 · Vite 5 · Tailwind · Axios |
| 管理前端 `admin-frontend/` | Vue 3 · Vite · Element Plus · Axios |
| 基础设施 | MySQL 8 · Redis · RabbitMQ · Elasticsearch 8 · Nacos · MinIO · Chroma（AI 向量库） |

> `microservices/` 是当前默认开发与部署路径。`backend/` 已标记为旧单体后端，仅用于接口对照、迁移兜底或回退；不要在同一台机器上与微服务网关同时启动，因为两者都会占用 `8080`。

---

## 架构与模块

```
worldCoffee/
├── backend/                # 旧单体后端（Legacy Monolith，仅保留作对照与回退）
│   ├── worldcoffee-common  # 公共库：JWT、统一返回、全局异常、API 文档
│   └── worldcoffee-admin   # 业务入口 WorldCoffeeApplication
├── microservices/          # 微服务（Spring Cloud Alibaba + Nacos）
│   ├── wc-common           # 共享库：Result<T>、异常、JWT、RabbitMQ 拓扑、MinIO 上传
│   ├── wc-gateway   (:8080) # 网关：JWT 鉴权、路由、CORS
│   ├── wc-user     (:8082) # 用户：注册/登录/资料/关注
│   ├── wc-shop     (:8081) # 商城：商品/订单/优惠券/秒杀/支付/搜索
│   ├── wc-community (:8083) # 社区：帖子/评论/点赞/Feed
│   ├── wc-message  (:8084) # 消息：通知(SSE)+私信
│   ├── wc-ai       (:8085) # AI：对话 + 知识库向量
│   └── wc-admin    (:8086) # 管理后台：用户/商品/审核/敏感词/日志
├── frontend/               # 用户端 SPA
└── admin-frontend/         # 管理端 SPA
```

---

## 快速开始

### 先决条件

- **Java 21**
- **Node.js 20+**（管理端用了较新的 Vite，建议新版本 Node）
- **Maven**（仓库已自带 `./mvnw` / `mvnw.cmd`，无需单独安装）
- **Docker + Docker Compose**（用于一键起基础设施）

### 1. 启动基础设施

```bash
cd microservices
docker compose up -d
```

这会启动 MySQL 8、Redis、RabbitMQ、Nacos、Elasticsearch 8、MinIO、Chroma。
（Nacos / MySQL / Redis / RabbitMQ 为必选；ES 供商城搜索，MinIO 供文件上传，Chroma 供 AI 向量检索。）

### 2. 配置密钥（非常重要）

本项目**所有密钥都通过环境变量注入，请勿写死到代码或配置里**。在启动后端前，请设置以下变量（值换成你自己的强随机字符串）：

```bash
# 单体后端
export ALIYUN_API_KEY=你的阿里云百炼APIKey
export JWT_SECRET=一段足够长的随机字符串

# 微服务
export MICROSERVICES_JWT_SECRET=另一段足够长的随机字符串

# AI 服务（wc-ai，可选；也可用 DashScope 替代）
export OPENAI_API_KEY=你的OpenAI兼容Key

# MinIO（建议改掉默认的 minioadmin/minioadmin）
export MINIO_ACCESS_KEY=你的MinIO账号
export MINIO_SECRET_KEY=你的MinIO密码
```

> 数据库、Redis、RabbitMQ、Nacos、Elasticsearch 的连接信息在 `application.yml` 中配置，
> 请改成你自己的**强密码**，不要使用仓库里示例中的弱口令。

### 3. 启动单体后端（仅用于回退或接口对照）

```bash
cd backend
./mvnw clean package -DskipTests
./mvnw spring-boot:run -pl worldcoffee-admin
# 或：java -jar worldcoffee-admin/target/*.jar
```

### 4. 启动微服务（默认方案）

```bash
cd microservices
mvn clean package -DskipTests

# 逐个启动，例如：
java -jar wc-gateway/target/wc-gateway-0.0.1-SNAPSHOT-exec.jar
java -jar wc-user/target/wc-user-0.0.1-SNAPSHOT-exec.jar
# ……其余模块同理
```

也可用 Maven 直接跑：`mvn -pl wc-gateway -am spring-boot:run`

### 5. 启动前端

用户端：

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
```

管理端：

```bash
cd admin-frontend
npm install
npm run dev      # http://localhost:5173
```

---

## 默认端口

| 服务 | 端口 |
|------|------|
| 单体后端 | 8080 |
| wc-gateway | 8080 |
| wc-shop | 8081 |
| wc-user | 8082 |
| wc-community | 8083 |
| wc-message | 8084 |
| wc-ai | 8085 |
| wc-admin | 8086 |
| 用户前端（dev） | 3000 |
| 管理前端（dev） | 5173 |
| MySQL | 3306 |
| Redis | 6379 |
| RabbitMQ | 5672（管理台 15672） |
| Nacos | 8848 |
| Elasticsearch | 9200 |
| MinIO | 9000（控制台 9001） |
| Chroma | 8000 |

---

## 环境变量一览

| 变量 | 用途 | 说明 |
|------|------|------|
| `ALIYUN_API_KEY` | 单体后端 DashScope / Qwen AI | 阿里云百炼 API Key |
| `JWT_SECRET` | 单体 JWT 签名密钥 | 随机长字符串 |
| `MICROSERVICES_JWT_SECRET` | 微服务 JWT 签名密钥 | 随机长字符串 |
| `OPENAI_API_KEY` | wc-ai 服务 | OpenAI 兼容 Key（可选） |
| `MINIO_ENABLED` | 是否启用 MinIO | `true` / `false` |
| `MINIO_ENDPOINT` | MinIO 服务地址 | 默认 `:9000` |
| `MINIO_PUBLIC_ENDPOINT` | MinIO 公网访问地址 | 按需设置 |
| `MINIO_ACCESS_KEY` | MinIO 账号 | **请改掉默认 `minioadmin`** |
| `MINIO_SECRET_KEY` | MinIO 密码 | **请改掉默认 `minioadmin`** |
| `MINIO_BUCKET` | 存储桶名 | 默认 `worldcoffee` |

> 其它连接信息（MySQL / Redis / RabbitMQ / Nacos / ES）在 `application.yml` 中配置，
> 部署时请统一改成你自己的强密码。文件上传目录 `uploads/` 也请按部署机器调整路径。

---

## 安全须知

- **所有密钥与密码请通过环境变量或配置中心注入，切勿提交到代码仓库。**
- 本项目早期版本曾在代码中硬编码了部分密钥与弱口令（如数据库 `root/123456`、RabbitMQ `guest/guest`、MinIO `minioadmin` 等），已在后续提交中移除并改写历史。
- **请务必为你自己的部署设置独立、强随机的密钥**（`JWT_SECRET`、`MICROSERVICES_JWT_SECRET`、`ALIYUN_API_KEY` 等），并修改上述基础设施的默认弱口令。
- 不要复用任何示例密码；一旦密钥有泄露风险，立即在对应平台吊销并轮换。

---

## 许可证

详见仓库内许可证文件（如有）。
