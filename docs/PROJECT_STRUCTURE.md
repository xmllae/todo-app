# 项目目录结构说明

> 本文档记录项目的目录组织结构，最后更新于 2026-04-10。

## 目录结构概览

```
todo-app-main/
├── index.html              # 应用主入口
├── favicon.ico            # 网站图标
│
├── css/                    # CSS 样式目录
│   ├── all.css           # 合并后的完整样式（主要使用）
│   ├── variables.css     # CSS 变量定义
│   ├── common.css        # 通用组件样式
│   ├── header.css        # 头部和导航样式
│   ├── user-dropdown.css # 用户下拉菜单样式
│   ├── sidebar.css       # 侧边栏和日历样式
│   ├── search.css        # 搜索框样式
│   ├── task-card.css     # 任务卡片样式
│   ├── date-nav.css      # 日期导航样式
│   ├── task-list.css     # 任务列表样式
│   ├── task-item.css     # 任务项样式
│   ├── add-task.css      # 添加任务表单样式
│   ├── kanban.css        # 看板模式样式
│   ├── settings.css      # 设置页面样式
│   ├── stats.css         # 统计页面样式
│   ├── modal.css         # 模态框样式
│   ├── toast.css         # Toast 提示样式
│   ├── focus-timer.css   # 专注计时器样式
│   ├── multi-bar.css     # 批量操作栏样式
│   ├── prio-settings.css # 优先级设置样式
│   ├── responsive.css     # 响应式布局样式
│   └── animations.css    # 动画效果样式
│
├── js/                    # 前端 JavaScript 模块目录
│   ├── auth.js           # 认证相关功能
│   ├── core.js           # 核心功能模块
│   ├── date.js           # 日期工具函数
│   ├── init.js           # 应用初始化
│   ├── nav.js            # 导航功能
│   ├── recur.js          # 重复任务功能
│   ├── subscriptions.js  # 订阅管理功能
│   ├── sub_form.js       # 订阅表单
│   ├── task-form.js      # 任务表单
│   ├── ui.js             # UI 渲染组件
│   └── prio-arc-svg.js   # 优先级弧形 SVG
│
├── functions/            # 后端 API 目录
│   └── api/             # API 接口
│       ├── clear.js     # 清除数据
│       ├── init-db.js   # 数据库初始化
│       ├── load.js      # 加载数据
│       ├── login.js     # 登录接口
│       ├── logout.js    # 登出接口
│       ├── profile.js   # 用户资料
│       ├── register.js  # 注册接口
│       ├── save.js      # 保存数据
│       └── _middleware.js # 中间件
│
├── tools/               # 工具脚本目录
│   ├── apply_add_task_feature.js   # 功能应用脚本
│   ├── fix_corruption.js          # 数据修复脚本 v1
│   ├── fix_corruption2.js         # 数据修复脚本 v2
│   ├── fix_corruption3.js         # 数据修复脚本 v3
│   ├── fix_corruption4.js         # 数据修复脚本 v4
│   ├── fix_css_corruption.js      # CSS 修复脚本
│   ├── fix_showAddTaskRow.js      # 显示修复脚本
│   ├── format-index-v2.js         # 代码格式化工具
│   ├── merge-css.js               # CSS 合并工具
│   ├── patch_ring_align.js        # 圆环对齐补丁
│   ├── patch_unify_add_ring_size.js # 尺寸统一补丁
│   ├── replace_ghost_row.js       # 空行替换脚本
│   ├── replace_ghost_row_js.js    # JS 空行替换
│   └── verify.ps1                # 验证脚本
│
└── docs/                 # 项目文档目录
    ├── IMPLEMENTATION_SUMMARY.md  # 实现总结
    ├── PROJECT_STRUCTURE.md       # 项目结构说明
    ├── QUICK_REFERENCE.md         # 快速参考
    ├── SUBSCRIPTIONS_GUIDE.html  # 订阅功能演示
    └── SUBSCRIPTIONS_README.md   # 订阅功能文档
```

## 目录用途说明

### `css/` - 样式文件
存放应用的样式文件。其中 `all.css` 是合并后的完整样式文件。

### `js/` - 前端脚本
存放前端 JavaScript 模块化脚本，按功能划分。

### `functions/` - 后端代码
存放 Node.js 后端服务代码，包括 API 接口、中间件等。

### `tools/` - 工具脚本
存放开发和维护过程中使用的工具脚本。

### `docs/` - 项目文档
存放项目的各类文档。

## 文件命名规范

| 前缀 | 含义 | 示例 |
|------|------|------|
| `fix_` | 修复脚本 | `fix_corruption.js` |
| `patch_` | 补丁脚本 | `patch_ring_align.js` |
| `apply_` | 应用脚本 | `apply_add_task_feature.js` |
| `_middleware` | 中间件 | `_middleware.js` |

## 工具脚本说明

| 文件 | 说明 |
|------|------|
| `merge-css.js` | 合并 CSS 模块为单一文件 |
| `format-index-v2.js` | 格式化 index.html 代码 |
| `verify.ps1` | PowerShell 验证脚本 |
| `fix_*.js` | 各类数据修复脚本 |
| `replace_ghost_row*.js` | 空行替换脚本 |

## 版本历史

| 日期 | 变更说明 |
|------|----------|
| 2026-04-10 | 初始创建目录结构文档 |
| 2026-04-10 | CSS 模块化拆分 |
| 2026-04-10 | 代码格式化重构 |
| 2026-04-10 | 清理冗余文件，优化目录结构 |
