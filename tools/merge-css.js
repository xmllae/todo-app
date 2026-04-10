/**
 * 合并所有 CSS 文件为一个文件
 * 确保所有样式正确加载
 * 北京时间 2026-04-10
 */
const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '..', 'css');
const outputPath = path.join(__dirname, '..', 'css', 'all.css');

// 要合并的文件顺序（重要：variables.css 必须在最前面）
const files = [
    'variables.css',
    'common.css',
    'header.css',
    'user-dropdown.css',
    'sidebar.css',
    'search.css',
    'task-card.css',
    'date-nav.css',
    'task-list.css',
    'task-item.css',
    'add-task.css',
    'kanban.css',
    'settings.css',
    'stats.css',
    'modal.css',
    'toast.css',
    'focus-timer.css',
    'multi-bar.css',
    'prio-settings.css',
    'responsive.css',
    'animations.css',
    'misc.css',
    'remaining-01.css',
    'remaining-02.css',
    'remaining-03.css',
    'remaining-04.css',
    'remaining-05.css',
    'remaining-06.css',
];

let mergedCss = `/**
 * all.css - 合并后的完整样式文件
 * 由 tools/merge-css.js 自动生成
 * 北京时间 2026-04-10
 */

`;

let totalSize = 0;

files.forEach(filename => {
    const filePath = path.join(cssDir, filename);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        // 移除文件头注释
        content = content.replace(/^\/\*\*[\s\S]*?\*\/\n\n/, '');
        mergedCss += `/* ===== ${filename} ===== */\n\n${content}\n\n`;
        totalSize += content.length;
        console.log(`✅ 合并: ${filename} (${content.length} 字符)`);
    } else {
        console.log(`⚠️ 跳过: ${filename} (不存在)`);
    }
});

// 保存合并后的文件
fs.writeFileSync(outputPath, mergedCss, 'utf8');
console.log(`\n✅ 已生成: css/all.css (总计 ${totalSize} 字符)`);
