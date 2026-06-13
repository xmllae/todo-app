# Cloudflare 部署说明

## 为什么之前会 405

之前前端已经在请求 `POST /api/login`，但仓库里实际跑的是纯静态 Pages 部署，没有 Cloudflare Pages Functions 来处理该接口。

结果就是：

- 页面静态资源能打开
- `/api/login` 没有真正的服务端处理器
- `POST` 请求落到静态站点路径
- Cloudflare 返回 `405 Method Not Allowed`

## 现在的实现

当前仓库已经改成 Cloudflare Pages + D1 结构：

- `functions/api/*.js`
  - 处理登录、注册、加载、保存、更新资料、退出登录、健康检查
- `functions/_shared/*.js`
  - 共享 HTTP、认证、D1 数据访问逻辑
- `migrations/0001_init.sql`
  - 初始化 `users` 表
- `wrangler.jsonc`
  - Pages 与 D1 绑定配置

前端仍然请求 `/api/*`，所以不用改页面调用方式。

## 第一步：安装 Wrangler

```bash
npm install
```

## 第二步：登录 Cloudflare

```bash
npx wrangler login
```

## 第三步：创建 D1 数据库

```bash
npx wrangler d1 create tuole-db
```

执行后你会拿到：

- `database_name`
- `database_id`

把 `wrangler.jsonc` 里的：

```json
"database_id": "REPLACE_WITH_TUOLE_DB_D1_DATABASE_ID"
```

替换成真实的 `database_id`。

## 第四步：配置登录密钥

本地开发可复制 `.dev.vars.example` 为 `.dev.vars`，并填入：

```bash
TUOLE_TOKEN_SECRET=your-local-secret
```

线上部署请执行：

```bash
npx wrangler pages secret put TUOLE_TOKEN_SECRET
```

## 第五步：执行 D1 迁移

本地：

```bash
npm run db:migrate:local
```

线上：

```bash
npm run db:migrate:remote
```

## 第六步：本地联调

```bash
npm run dev
```

## 第七步：部署到 Cloudflare Pages

GitHub 连接部署时，请确认：

- Pages 项目名和 `wrangler.jsonc` 的 `name` 一致
- Build output directory 使用仓库根目录
- 已绑定 D1 数据库
- 已配置 `TUOLE_TOKEN_SECRET`

如果你用命令行直接发布，也可以执行：

```bash
npm run deploy
```

## 上线后自检

先打开：

- `/api/health`

如果正常，应返回 JSON，且包含：

- `runtime: "cloudflare-pages-functions"`
- `storage.driver: "d1"`

再检查登录、注册、保存数据是否正常。

## 常见问题

### 1. 还是 405

说明 `/api/*` 仍然没有进入 Pages Functions。重点检查：

- 仓库里是否已经有 `/functions/api/*`
- Pages 是否重新部署成功
- 部署的是当前分支最新提交

### 2. 返回数据库未初始化

说明 D1 已绑定，但还没有执行迁移。运行：

```bash
npm run db:migrate:remote
```

### 3. 返回缺少 D1 绑定

说明 `wrangler.jsonc` 的 `d1_databases` 没配好，或 Cloudflare 项目里没绑定 `DB`。

### 4. 返回缺少 TUOLE_TOKEN_SECRET

说明线上密钥还没配置。执行：

```bash
npx wrangler pages secret put TUOLE_TOKEN_SECRET
```
