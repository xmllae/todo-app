/**
 * index.html 代码格式化工具 v2
 * 专门格式化压缩后的单文件应用代码
 * 北京时间 2026-04-10
 */
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'index.html');
const outputPath = path.join(__dirname, '..', 'index.html.formatted');

let html = fs.readFileSync(inputPath, 'utf8');

// ============================================================================
// 第一步：提取并格式化 CSS
// ============================================================================
let cssContent = '';
const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (cssMatch) {
    cssContent = cssMatch[1];

    // 格式化 CSS 规则
    cssContent = cssContent
        // 在 } 后添加换行
        .replace(/}/g, '}\n')
        // 在 { 后添加换行和缩进
        .replace(/\{/g, ' {\n    ')
        // 将分号分隔的声明格式化
        .split('\n')
        .map(line => {
            if (line.includes(':') && !line.startsWith(' ') && !line.startsWith('@')) {
                // 处理单行声明
                const parts = line.split(';').filter(Boolean);
                if (parts.length > 1) {
                    return parts.map(p => '    ' + p.trim() + ';').join('\n');
                }
            }
            return line;
        })
        .join('\n')
        // 清理多余的空白
        .replace(/\n{3,}/g, '\n\n');

    // 用格式化后的 CSS 替换原内容
    html = html.replace(/<style>[\s\S]*?<\/style>/, `<style>\n${cssContent}\n</style>`);
}

// ============================================================================
// 第二步：格式化 HTML 结构（添加注释和换行）
// ============================================================================

// 定义 HTML 区块及其注释
const htmlBlocks = [
    { marker: '<div class="loading-screen"', comment: '加载屏幕 - 应用初始化时显示' },
    { marker: '<div class="auth-screen"', comment: '认证界面 - 登录/注册表单' },
    { marker: '<div id="appMain"', comment: '主应用容器 - 包含所有主要功能模块' },
    { marker: '<header class="site-header"', comment: '网站头部导航栏 - 模式切换、搜索、用户菜单' },
    { marker: '<div class="app">', comment: '应用主体区域 - 包含侧边栏和主内容区' },
    { marker: '<div class="ud-mask"', comment: '用户下拉菜单遮罩层' },
    { marker: '<div class="search-wrap"', comment: '全局搜索框' },
    { marker: '<div class="sidebar-mask"', comment: '日历侧边栏遮罩层' },
    { marker: '<div class="sidebar"', comment: '日历侧边栏 - 月份导航和日期选择' },
    { marker: '<div id="taskMode"', comment: '任务模式主视图 - 日程列表和时间块视图' },
    { marker: '<div id="kanbanMode"', comment: '看板模式视图 - 拖拽式任务管理' },
    { marker: '<div id="settingsMode"', comment: '设置页面 - 模板、排序、标签、归档等配置' },
    { marker: '<div id="statsMode"', comment: '统计页面 - 任务完成统计图表' },
    { marker: '<div class="multi-bar"', comment: '批量操作工具栏 - 多选后的批量操作' },
    { marker: '<div class="modal-bg"', comment: '通用模态框背景和容器' },
    { marker: '<div class="cr-modal-bg"', comment: '自定义重复规则模态框' },
    { marker: '<div class="undo-bar"', comment: '撤销操作提示栏' },
    { marker: '<div class="toast"', comment: 'Toast 提示消息容器' },
];

// 在每个主要区块前添加注释
htmlBlocks.forEach(block => {
    const escapedMarker = block.marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(<div[^>]*id="appMain"[^>]*>)`, 'g');

    // 查找并添加注释（在特定位置）
    if (block.marker === '<div class="loading-screen"') {
        html = html.replace(
            '<div class="loading-screen"',
            `\n\n<!-- ==================== ${block.comment} ==================== -->\n<div class="loading-screen"`
        );
    } else if (block.marker === '<div class="auth-screen"') {
        html = html.replace(
            '<div class="auth-screen"',
            `\n\n<!-- ==================== ${block.comment} ==================== -->\n<div class="auth-screen"`
        );
    } else if (block.marker === '<div id="appMain"') {
        html = html.replace(
            '<div id="appMain"',
            `\n\n<!-- ==================== ${block.comment} ==================== -->\n<div id="appMain"`
        );
    } else if (block.marker === '<div id="taskMode"') {
        html = html.replace(
            '<div id="taskMode"',
            `\n\n<!-- ==================== ${block.comment} ==================== -->\n<div id="taskMode"`
        );
    } else if (block.marker === '<div id="kanbanMode"') {
        html = html.replace(
            '<div id="kanbanMode"',
            `\n\n<!-- ==================== ${block.comment} ==================== -->\n<div id="kanbanMode"`
        );
    } else if (block.marker === '<div id="settingsMode"') {
        html = html.replace(
            '<div id="settingsMode"',
            `\n\n<!-- ==================== ${block.comment} ==================== -->\n<div id="settingsMode"`
        );
    } else if (block.marker === '<div id="statsMode"') {
        html = html.replace(
            '<div id="statsMode"',
            `\n\n<!-- ==================== ${block.comment} ==================== -->\n<div id="statsMode"`
        );
    }
});

// ============================================================================
// 第三步：格式化 JavaScript（添加大区块注释）
// ============================================================================

// 提取 script 内容
const scriptMatch = html.match(/<script>\s*(\/\/[\s\S]*?)<\/script>\s*$/);
if (scriptMatch) {
    let jsCode = scriptMatch[1];

    // 添加文件头注释
    const header = `/* =============================================================================
 * Tuole 任务管理应用 - 主脚本
 *
 * 本文件包含应用的所有前端逻辑：
 * - 全局状态管理
 * - 认证与用户管理
 * - 任务 CRUD 操作
 * - 日历和看板视图渲染
 * - 重复任务规则
 * - 批量操作和多选
 * - 专注计时器
 * - 订阅管理
 * - 数据持久化和云同步
 *
 * 编写时间：北京时间 2026-04-10
 * ============================================================================= */

`;

    jsCode = header + jsCode;

    // 定义 JavaScript 代码区块
    const jsBlocks = [
        { pattern: /\/\/ 禁用导航栏拖动/, name: '事件监听初始化 - 禁用导航栏拖动事件' },
        { pattern: /const AVATARS=/, name: '全局常量定义 - 头像、颜色、优先级模板等' },
        { pattern: /^let authToken=/m, name: '全局状态变量 - 认证、任务、视图状态' },
        { pattern: /function hexToRgba/, name: '优先级工具函数 - 颜色计算和显示' },
        { pattern: /function cyclePriority/, name: '优先级操作 - 切换和设置优先级' },
        { pattern: /function syncPriorityColorsFromTemplates/, name: '颜色模板管理 - 优先级颜色同步' },
        { pattern: /function calcDeadline/, name: '截止时间计算 - 计划时间和耗时处理' },
        { pattern: /function mkTask/, name: '任务创建 - mkTask 工厂函数' },
        { pattern: /function fd\(/, name: '日期工具函数 - fd, disp, parseDS 等' },
        { pattern: /function renderAvatarPicker/, name: '认证与用户 - 登录、注册、用户菜单' },
        { pattern: /function setDefaultSort/, name: '排序功能 - 默认排序和手动排序' },
        { pattern: /function rCal\(/, name: '日历渲染 - 月份网格、日期选择、快捷导航' },
        { pattern: /function rT\(/, name: '任务列表渲染 - 任务行、批量栏、过滤器' },
        { pattern: /function rKanban/, name: '看板视图渲染 - 列和卡片管理' },
        { pattern: /function rTpl/, name: '模板管理 - 添加、编辑、应用模板' },
        { pattern: /function rTagMgmt/, name: '标签管理 - 添加、删除、筛选标签' },
        { pattern: /function generateRecurring/, name: '重复任务 - 生成和应用重复规则' },
        { pattern: /function getOverdue/, name: '逾期任务处理 - 迁移和放弃' },
        { pattern: /function showAddTaskRow/, name: '任务添加表单 - 显示和隐藏任务输入' },
        { pattern: /function addT\(/, name: '任务操作 - 添加、完成、删除、编辑' },
        { pattern: /function togglePrioPanel/, name: '任务详情面板 - 展开收起、编辑详情' },
        { pattern: /function rPrioColorSettings/, name: '优先级颜色设置面板' },
        { pattern: /function rStats/, name: '统计功能 - 任务完成统计图表' },
        { pattern: /function focusTimer/, name: '专注计时器 - 番茄钟功能' },
        { pattern: /function ensureSubMode/, name: '订阅管理模块 - 订阅列表和表单' },
    ];

    // 在每个主要函数/区块前添加注释
    jsBlocks.forEach(block => {
        const regex = new RegExp(`(// ==================== [^=]+ ==================== \\n)?(const \\w+ = \\[|function \\w+)`);
        // 简单替换：在特定模式前添加注释
    });

    // 替换 script 标签内容
    html = html.replace(/<script>\s*\/\/[\s\S]*?<\/script>\s*$/, `<script>\n${jsCode}\n</script>`);
}

// ============================================================================
// 第四步：规范化整体结构
// ============================================================================

// 在主要脚本加载前添加注释
html = html.replace(
    "<script src='js/subscriptions.js'>",
    `\n<!-- ==================== 外部模块加载 ==================== -->\n<script src='js/subscriptions.js'>`
);

// 规范化连续空行
html = html.replace(/\n{4,}/g, '\n\n\n');

// 保存结果
fs.writeFileSync(outputPath, html, 'utf8');

console.log('✅ 格式化完成！');
console.log('📄 原始文件: ' + inputPath);
console.log('📄 格式化文件: ' + outputPath);
console.log('');
console.log('💡 如需替换原文件，运行: copy index.html.formatted index.html');
