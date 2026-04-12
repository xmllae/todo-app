/**
 * 右侧抽屉面板功能
 * Right Drawer Panel - Task Detail View
 */

// ==================== 状态变量 ====================

let drawerActiveTaskId = null;          // 当前抽屉显示的任务ID
let drawerExpandedSubtasks = new Set();  // 展开的子任务ID集合

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', function() {
    initDrawer();
});

function initDrawer() {
    // 绑定关闭按钮事件
    const closeBtn = document.getElementById('drawer-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeDrawer);
    }

    // 点击遮罩层关闭
    document.addEventListener('click', function(e) {
        const drawer = document.getElementById('right-drawer');
        if (drawer && drawer.classList.contains('drawer-open')) {
            // 检查是否点击在抽屉外部
            if (!drawer.contains(e.target)) {
                closeDrawer();
            }
        }
    });

    // ESC 键关闭抽屉
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const drawer = document.getElementById('right-drawer');
            if (drawer && drawer.classList.contains('drawer-open')) {
                closeDrawer();
            }
        }
    });
}

// ==================== 打开抽屉 ====================

/**
 * 打开任务详情抽屉
 * @param {number} taskId - 任务ID
 */
function openTaskDrawer(taskId) {
    const drawer = document.getElementById('right-drawer');
    const content = document.getElementById('drawer-content');
    if (!drawer || !content) return;

    // 获取任务数据
    const task = findTaskById(taskId);
    if (!task) {
        console.error('任务不存在:', taskId);
        return;
    }

    // 保存当前任务ID
    drawerActiveTaskId = taskId;

    // 渲染抽屉内容
    renderDrawerContent(task);

    // 淡出当前内容
    content.classList.remove('fade-in');
    content.classList.add('fade-out');

    // 展开抽屉
    drawer.classList.remove('drawer-closed');
    drawer.classList.add('drawer-open');

    // 延迟淡入新内容
    setTimeout(function() {
        content.classList.remove('fade-out');
        content.classList.add('fade-in');
    }, 200);

    // 禁止背景滚动
    document.body.style.overflow = 'hidden';
}

/**
 * 根据ID查找任务
 * @param {number} taskId - 任务ID
 * @returns {Object|null} 任务对象
 */
function findTaskById(taskId) {
    // 遍历所有日期的任务
    for (const dateStr in T) {
        const task = T[dateStr].find(function(t) {
            return t.id === taskId;
        });
        if (task) {
            return task;
        }
    }
    return null;
}

// ==================== 关闭抽屉 ====================

/**
 * 关闭任务详情抽屉
 */
function closeDrawer() {
    const drawer = document.getElementById('right-drawer');
    const content = document.getElementById('drawer-content');
    if (!drawer) return;

    // 淡出内容
    if (content) {
        content.classList.remove('fade-in');
        content.classList.add('fade-out');
    }

    // 收起抽屉
    drawer.classList.remove('drawer-open');
    drawer.classList.add('drawer-closed');

    // 延迟清除任务ID和内容
    setTimeout(function() {
        drawerActiveTaskId = null;
        if (content) {
            content.innerHTML = '';
        }
    }, 350);

    // 恢复背景滚动
    document.body.style.overflow = '';
}

// ==================== 渲染抽屉内容 ====================

/**
 * 渲染抽屉内容
 * @param {Object} task - 任务对象
 */
function renderDrawerContent(task) {
    const content = document.getElementById('drawer-content');
    if (!content) return;

    // 生成优先级颜色
    const priorityClass = getPriorityClass(task.priority);
    const priorityText = getPriorityText(task.priority);

    // 生成子任务HTML
    const subtasksHtml = renderSubtasksList(task);

    // 生成标签HTML
    const tagsHtml = renderTagsList(task);

    // 生成备注HTML
    const notesHtml = renderNotesArea(task);

    // 渲染内容
    content.innerHTML = `
        <!-- 任务标题区域 -->
        <div class="drawer-task-title">
            <div class="drawer-task-check ${task.done ? 'checked' : ''}"
                 onclick="toggleTaskDoneFromDrawer(${task.id})"
                 title="${task.done ? '标记为未完成' : '标记为已完成'}">
                ${task.done ? getCheckIconSvg() : getCircleIconSvg()}
            </div>
            <input type="text"
                   class="drawer-task-title-text"
                   id="drawer-task-title-input"
                   value="${escapeHtml(task.text || '')}"
                   onclick="event.stopPropagation()"
                   onblur="saveDrawerTitle(${task.id})"
                   onkeydown="if(event.key==='Enter'){event.target.blur()}">
        </div>

        <!-- 属性列表 -->
        <div class="drawer-attrs">
            <!-- 时间 -->
            <div class="drawer-attr-row" onclick="event.stopPropagation();openTimePickerInDrawer(${task.id})">
                <div class="drawer-attr-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    时间
                </div>
                <div class="drawer-attr-value">
                    ${task.planTime || '全天'}
                </div>
            </div>

            <!-- 优先级 -->
            <div class="drawer-attr-row" onclick="event.stopPropagation();openPriorityPickerInDrawer(${task.id})">
                <div class="drawer-attr-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    优先级
                </div>
                <div class="drawer-attr-value">
                    <span class="priority-dot ${priorityClass}"></span>
                    ${priorityText}
                </div>
            </div>

            <!-- 耗时 -->
            <div class="drawer-attr-row" onclick="event.stopPropagation();openDurationPickerInDrawer(${task.id})">
                <div class="drawer-attr-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 8v4l2.5 2.5"/>
                        <path d="M9 3h6"/>
                    </svg>
                    耗时
                </div>
                <div class="drawer-attr-value">
                    ${task.duration ? `<span class="time-badge">${task.duration} 分钟</span>` : '<span style="color:var(--text3)">未设置</span>'}
                </div>
            </div>

            <!-- 标签 -->
            ${tagsHtml ? `
            <div class="drawer-attr-row" onclick="event.stopPropagation()">
                <div class="drawer-attr-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                        <line x1="7" y1="7" x2="7.01" y2="7"/>
                    </svg>
                    标签
                </div>
                <div class="drawer-attr-value">
                    ${tagsHtml}
                </div>
            </div>
            ` : ''}
        </div>

        <hr class="drawer-divider">

        <!-- 子任务区域 -->
        <div class="drawer-subtasks">
            <div class="drawer-subtasks-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                子任务
                ${(task.subtasks || []).length > 0 ? `<span class="drawer-subtasks-count">${getSubtaskDoneCount(task)}/${task.subtasks.length}</span>` : ''}
            </div>
            <div class="drawer-subtasks-list">
                ${subtasksHtml}
                <div class="subtask-add-btn" onclick="event.stopPropagation();openAddSubtaskInDrawer(${task.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    <span>添加子任务...</span>
                </div>
            </div>
        </div>

        <!-- 备注区域 -->
        ${notesHtml}

        <!-- 底部操作栏 -->
        <div class="drawer-footer">
            <button class="drawer-footer-btn" onclick="event.stopPropagation();openRepeatInDrawer(${task.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 4v6h-6"/>
                    <path d="M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                重复
            </button>
            <button class="drawer-footer-btn" onclick="event.stopPropagation();toggleFreezeInDrawer(${task.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                ${task.frozen ? '解冻' : '冻结'}
            </button>
            <button class="drawer-footer-btn danger" onclick="event.stopPropagation();deleteTaskInDrawer(${task.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                删除
            </button>
        </div>
    `;
}

// ==================== 子任务渲染 ====================

/**
 * 渲染子任务列表
 * @param {Object} task - 任务对象
 * @returns {string} HTML字符串
 */
function renderSubtasksList(task) {
    const subtasks = task.subtasks || [];
    if (subtasks.length === 0) return '';

    return subtasks.map(function(sub) {
        const isDone = sub.done;
        return `
            <div class="subtask-row"
                 data-subtask-id="${sub.id}"
                 onclick="event.stopPropagation();toggleSubtaskInDrawer(${task.id}, ${sub.id})">
                <div class="subtask-check ${isDone ? 'done' : ''}">
                    ${isDone ? getCheckIconSvg() : ''}
                </div>
                <span class="subtask-text ${isDone ? 'done' : ''}">${escapeHtml(sub.text)}</span>
            </div>
        `;
    }).join('');
}

/**
 * 获取子任务完成数量
 * @param {Object} task - 任务对象
 * @returns {number} 已完成的子任务数量
 */
function getSubtaskDoneCount(task) {
    const subtasks = task.subtasks || [];
    return subtasks.filter(function(s) { return s.done; }).length;
}

// ==================== 标签渲染 ====================

/**
 * 渲染标签列表
 * @param {Object} task - 任务对象
 * @returns {string} HTML字符串
 */
function renderTagsList(task) {
    const tagIds = task.tags || [];
    if (tagIds.length === 0) return '';

    const tags = tagIds.map(function(tagId) {
        return getTag(tagId);
    }).filter(Boolean);

    if (tags.length === 0) return '';

    return tags.map(function(tag) {
        return `<span class="drawer-tag" style="background:color-mix(in srgb, ${tag.color} 20%, transparent); color:${tag.color}; border-color:${tag.color}40">${escapeHtml(tag.name)}</span>`;
    }).join('');
}

// ==================== 备注渲染 ====================

/**
 * 渲染备注区域
 * @param {Object} task - 任务对象
 * @returns {string} HTML字符串
 */
function renderNotesArea(task) {
    return `
        <div class="drawer-notes">
            <div class="drawer-notes-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                备注
            </div>
            <textarea class="drawer-notes-textarea"
                      id="drawer-notes-input"
                      placeholder="添加任务备注..."
                      onclick="event.stopPropagation()"
                      onblur="saveDrawerNotes(${task.id})">${escapeHtml(task.note || '')}</textarea>
        </div>
    `;
}

// ==================== 操作函数 ====================

/**
 * 切换任务完成状态
 */
function toggleTaskDoneFromDrawer(taskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    task.done = !task.done;
    saveData();
    renderDrawerContent(task);
    rT(); // 刷新主列表
}

/**
 * 保存任务标题
 */
function saveDrawerTitle(taskId) {
    const input = document.getElementById('drawer-task-title-input');
    if (!input) return;

    const task = findTaskById(taskId);
    if (!task) return;

    const newText = input.value.trim();
    if (newText && newText !== task.text) {
        task.text = newText;
        saveData();
        rT(); // 刷新主列表
    }
}

/**
 * 保存任务备注
 */
function saveDrawerNotes(taskId) {
    const textarea = document.getElementById('drawer-notes-input');
    if (!textarea) return;

    const task = findTaskById(taskId);
    if (!task) return;

    const newNote = textarea.value.trim();
    if (newNote !== (task.note || '')) {
        task.note = newNote;
        saveData();
    }
}

/**
 * 切换子任务完成状态
 */
function toggleSubtaskInDrawer(taskId, subtaskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    const subtask = (task.subtasks || []).find(function(s) { return s.id === subtaskId; });
    if (!subtask) return;

    subtask.done = !subtask.done;
    saveData();
    renderDrawerContent(task);
    rT(); // 刷新主列表
}

/**
 * 在抽屉中打开添加子任务
 */
function openAddSubtaskInDrawer(taskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    const newText = prompt('输入子任务内容:');
    if (newText && newText.trim()) {
        if (!task.subtasks) task.subtasks = [];

        task.subtasks.push({
            id: Date.now(),
            text: newText.trim(),
            done: false
        });

        saveData();
        renderDrawerContent(task);
        rT(); // 刷新主列表
    }
}

// ==================== 辅助函数 ====================

/**
 * 获取优先级CSS类
 */
function getPriorityClass(priority) {
    switch (priority) {
        case 'high': return 'high';
        case 'medium': return 'medium';
        case 'normal': return 'normal';
        case 'low': return 'low';
        default: return 'normal';
    }
}

/**
 * 获取优先级显示文本
 */
function getPriorityText(priority) {
    switch (priority) {
        case 'high': return '高';
        case 'medium': return '中';
        case 'normal': return '正常';
        case 'low': return '低';
        default: return '正常';
    }
}

/**
 * 获取圆形图标SVG
 */
function getCircleIconSvg() {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
    </svg>`;
}

/**
 * 获取勾选图标SVG
 */
function getCheckIconSvg() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
    </svg>`;
}

/**
 * HTML转义
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== 占位函数（后续扩展） ====================

/**
 * 打开时间选择器（在抽屉中）
 */
function openTimePickerInDrawer(taskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    const newTime = prompt('输入计划时间 (HH:MM格式):', task.planTime || '');
    if (newTime !== null) {
        task.planTime = newTime || '';
        saveData();
        renderDrawerContent(task);
        rT();
    }
}

/**
 * 打开优先级选择器（在抽屉中）
 */
function openPriorityPickerInDrawer(taskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    const priorities = [
        { value: 'high', label: '高' },
        { value: 'medium', label: '中' },
        { value: 'normal', label: '正常' },
        { value: 'low', label: '低' }
    ];

    const current = task.priority || 'normal';
    const currentIndex = priorities.findIndex(function(p) { return p.value === current; });

    const newPriority = prompt(
        '选择优先级:\n' + priorities.map(function(p, i) {
            return (i === currentIndex ? '▶ ' : '  ') + p.label;
        }).join('\n'),
        currentIndex
    );

    if (newPriority !== null && newPriority !== '') {
        const index = parseInt(newPriority);
        if (index >= 0 && index < priorities.length) {
            task.priority = priorities[index].value;
            saveData();
            renderDrawerContent(task);
            rT();
        }
    }
}

/**
 * 打开耗时输入（在抽屉中）
 */
function openDurationPickerInDrawer(taskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    const newDuration = prompt('输入预计耗时 (分钟):', task.duration || '30');
    if (newDuration !== null) {
        const duration = parseInt(newDuration);
        if (!isNaN(duration) && duration >= 0) {
            task.duration = duration;
            saveData();
            renderDrawerContent(task);
            rT();
        }
    }
}

/**
 * 打开重复设置（在抽屉中）
 */
function openRepeatInDrawer(taskId) {
    toast('重复功能开发中...');
}

/**
 * 切换冻结状态（在抽屉中）
 */
function toggleFreezeInDrawer(taskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    task.frozen = !task.frozen;
    saveData();
    renderDrawerContent(task);
    rT();
    toast(task.frozen ? '任务已冻结' : '任务已解冻');
}

/**
 * 删除任务（在抽屉中）
 */
function deleteTaskInDrawer(taskId) {
    if (confirm('确定要删除这个任务吗？')) {
        del(taskId);
        closeDrawer();
    }
}

// ==================== 导出（供外部调用） ====================

// 将 openTaskDrawer 暴露到全局
window.openTaskDrawer = openTaskDrawer;
window.closeDrawer = closeDrawer;
