# 项目目录结构说明

> 本文档记录项目的目录组织结构，最后更新于 2026-04-10。

## 目录结构概览

```
todo-app-main/
├── index.html              # 应用主入口（HTML + 内联 CSS/JS）
├── favicon.ico            # 网站图标
│
├── js/                    # 前端模块化脚本目录
│   ├── core.js           # 核心功能模块
│   ├── auth.js           # 用户认证模块
│   ├── date.js           # 日期工具函数
│   ├── init.js           # 应用初始化
│   ├── nav.js            # 导航相关功能
│   ├── recur.js          # 重复任务功能
│   ├── task-form.js      # 任务表单组件
│   ├── ui.js             # UI 通用组件
│   ├── subscriptions.js  # 订阅管理模块
│   ├── sub_form.js       # 订阅表单模块
│   └── prio-arc-svg.js   # 优先级弧形 SVG 组件
│
├── functions/            # 后端/服务端代码目录
│   └── api/             # API 接口模块
│       ├── clear.js     # 清除数据接口
│       ├── init-db.js   # 数据库初始化
│       ├── load.js      # 加载数据接口
│       ├── login.js    # 登录接口
│       ├── logout.js   # 登出接口
│       ├── profile.js  # 用户资料接口
│       ├── register.js # 注册接口
│       ├── save.js     # 保存数据接口
│       └── _middleware.js  # 中间件
│
├── docs/                 # 项目文档目录
│   ├── IMPLEMENTATION_SUMMARY.md   # 订阅模块实现总结
│   ├── QUICK_REFERENCE.md          # 快速参考
│   ├── SUBSCRIPTIONS_GUIDE.html    # 订阅功能演示
│   └── SUBSCRIPTIONS_README.md     # 订阅功能详细文档
│
├── tools/               # 工具脚本目录（开发和维护用）
│   ├── apply_add_task_feature.js   # 应用功能补丁
│   ├── fix_corruption.js           # 损坏修复脚本
│   ├── fix_corruption2.js
│   ├── fix_corruption3.js
│   ├── fix_corruption4.js
│   ├── fix_css_corruption.js       # CSS 损坏修复
│   ├── fix_showAddTaskRow.js       # 修复显示问题
│   ├── patch_ring_align.js         # 圆环对齐补丁
│   ├── patch_unify_add_ring_size.js # 统一尺寸补丁
│   ├── replace_ghost_row.js        # 替换空行脚本
│   ├── replace_ghost_row_js.js
│   └── verify.ps1                  # PowerShell 验证脚本
│
├── patches/             # 补丁文件目录（代码修改片段）
│   ├── _apply_details_form.js  # 详情表单应用补丁
│   ├── _strip_details_extras.js # 移除额外详情
│   ├── _renderTaskDash.txt     # 任务面板渲染代码
│   ├── _frag.txt               # 代码片段
│   └── _expand_chunk.txt       # 代码扩展片段
│
└── temp/               # 临时文件目录（开发调试用）
    ├── _extract-snippet.js  # 代码提取脚本
    ├── _extract_note.js    # 笔记提取脚本
    ├── _find.js           # 代码查找脚本
    ├── _get_markers.js    # 获取标记脚本
    ├── _remove_icons.js   # 移除图标脚本
    ├── block_to_replace.txt # 待替换代码块
    └── _dash_chunk.txt    # 面板代码片段
```

## 目录用途说明

### `js/` - 前端脚本模块
存放应用的前端 JavaScript 模块化脚本。这些文件按功能划分，便于维护和复用。

### `functions/` - 后端代码
存放 Node.js 后端服务代码，包括 API 接口、中间件等。

### `docs/` - 项目文档
存放项目的各类文档，包括功能说明、快速参考等。

### `tools/` - 工具脚本
存放开发和维护过程中使用的工具脚本，如数据修复、补丁应用等。

### `patches/` - 补丁文件
存放代码补丁和修改片段，用于追踪代码变更历史。

### `temp/` - 临时文件
存放开发调试过程中产生的临时文件，可以随时清理。

## 文件命名规范

| 前缀 | 含义 | 示例 |
|------|------|------|
| `_` 开头 | 临时/开发文件 | `_extract-snippet.js` |
| `fix_` | 修复脚本 | `fix_corruption.js` |
| `patch_` | 补丁脚本 | `patch_ring_align.js` |
| `apply_` | 应用脚本 | `apply_add_task_feature.js` |

## 维护建议

1. **定期清理 `temp/` 目录** - 开发完成后删除临时文件
2. **记录 `patches/` 使用** - 在使用完补丁后记录并可删除
3. **保持 `js/` 模块化** - 新功能优先添加到 `js/` 目录
4. **文档同步更新** - 目录结构变更时更新本文档

## 版本历史

| 日期 | 变更说明 |
|------|----------|
| 2026-04-10 | 初始创建目录结构文档，整理项目文件 |
