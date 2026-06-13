# 登录与部署说明

## 405 的根因

之前前端已经在请求 `POST /api/login`，但仓库里没有真正的后端接口实现，部署到纯静态托管后：

- 页面资源可以正常返回
- `/api/login` 这类接口路径没有后端处理器
- 平台会把它当作静态路径或只读资源处理
- `POST` 请求因此直接返回 `405 Method Not Allowed`

这不是账号密码问题，也不是前端表单问题，而是部署形态和代码结构不匹配。

## 现在的方案

当前仓库已经补成了方案 A：

- 前端统一走 `/api/*`
- 后端提供 `login / register / load / save / profile / logout / health`
- 使用 Node 内置能力实现认证、密码散列、文件存储和静态资源服务
- 本地和自托管部署都走同一套逻辑，不再保留旧补丁式分支

## 推荐部署方式

推荐部署到支持 Node 长驻进程或服务端函数且可持久化数据的环境，例如：

- Railway
- Render
- Fly.io
- 自有 Linux / Windows 服务器

启动命令：

```bash
npm install
npm start
```

默认端口读取 `PORT`，默认数据目录是 `./data`。

## 必配环境变量

- `TUOLE_TOKEN_SECRET`
  - 用于签发登录令牌
  - 生产环境必须配置

建议示例：

```bash
TUOLE_TOKEN_SECRET=replace-with-a-long-random-secret
```

## 可选环境变量

- `PORT`
  - 服务监听端口
- `TUOLE_DATA_DIR`
  - 数据库存储目录，默认是项目下的 `data`
- `TUOLE_CORS_ORIGIN`
  - 当前后端分域部署时可配置允许的来源

## 持久化说明

当前后端默认使用本地 JSON 文件存储，适合：

- 单实例
- 轻量自用
- 带持久磁盘的 Node 部署

如果继续部署到“只读 / 无状态”的纯静态或临时函数环境，虽然 405 不会再出现，但注册、保存数据时会收到明确的持久化错误提示。这时需要：

1. 改为带持久磁盘的 Node 部署
2. 或把存储层替换成数据库

## 健康检查

可访问：

- `/api/health`

用于确认 API 是否已经真正上线，而不是只有静态页面上线。
