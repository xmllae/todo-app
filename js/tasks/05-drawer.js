/**
 * Local task detail panel rendered inside the middle task column.
 */

let drawerActiveTaskId = null;
let drawerExpandedSubtasks = new Set();
let taskDetailRenderPatched = false;

document.addEventListener('DOMContentLoaded', function() {
    initDrawer();
});

function initDrawer() {
    const closeBtn = document.getElementById('detail-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeTaskDetail);
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && drawerActiveTaskId !== null) {
            closeTaskDetail();
        }
    });

    patchTaskRenderSync();
    syncTaskDetailPanel();
}

function patchTaskRenderSync() {
    if (taskDetailRenderPatched || typeof window.rT !== 'function') return;

    const originalRenderTasks = window.rT;
    window.rT = function() {
        const result = originalRenderTasks.apply(this, arguments);
        syncTaskDetailPanel();
        return result;
    };

    taskDetailRenderPatched = true;
}

function getTaskDetailRefs() {
    return {
        panel: document.getElementById('taskDetailPanel'),
        content: document.getElementById('taskDetailContent'),
        mainCol: document.querySelector('#taskMode .task-main-col'),
        taskMode: document.getElementById('taskMode')
    };
}

function setTaskDetailOpenState(isOpen) {
    const refs = getTaskDetailRefs();
    if (refs.panel) {
        refs.panel.classList.toggle('task-detail-panel--open', isOpen);
    }
    if (refs.mainCol) {
        refs.mainCol.classList.toggle('task-main-col--detail-open', isOpen);
    }
}

function syncTaskDetailSelectionState() {
    document.querySelectorAll('#tList .task-item--detail-active').forEach(function(node) {
        node.classList.remove('task-item--detail-active');
    });

    if (drawerActiveTaskId == null) return;

    const activeItem = document.querySelector('#tList .task-item[data-id="' + drawerActiveTaskId + '"]');
    if (activeItem) {
        activeItem.classList.add('task-item--detail-active');
    }
}

function refreshTaskViews(options) {
    const next = options || {};

    if (next.calendar && typeof rCal === 'function') {
        rCal();
    }

    if (typeof rT === 'function') {
        rT();
    } else {
        syncTaskDetailPanel();
    }

    if (next.kanban && typeof rKanban === 'function') {
        rKanban();
    }
}

function persistTaskDetailChanges(task, options) {
    if (!task) return;

    if (typeof syncToRule === 'function') {
        syncToRule(task);
    }

    save();
    refreshTaskViews(options);
}

function isTaskVisibleInCurrentDate(taskId) {
    return !!(T[sel] || []).some(function(task) {
        return task.id === taskId;
    });
}

function findTaskById(taskId) {
    for (const dateStr in T) {
        const tasks = T[dateStr] || [];
        const task = tasks.find(function(item) {
            return item.id === taskId;
        });
        if (task) return task;
    }
    return null;
}

function openTaskDrawer(taskId) {
    const refs = getTaskDetailRefs();
    if (!refs.panel || !refs.content || !refs.mainCol) return;

    const task = findTaskById(taskId);
    if (!task) {
        closeTaskDetail();
        return;
    }

    const taskChanged = drawerActiveTaskId !== taskId;
    drawerActiveTaskId = taskId;

    setTaskDetailOpenState(true);
    renderDrawerContent(task);
    refs.content.classList.remove('fade-out');
    refs.content.classList.add('fade-in');

    if (taskChanged) {
        refs.content.scrollTop = 0;
    }

    syncTaskDetailSelectionState();
}

function closeTaskDetail() {
    const refs = getTaskDetailRefs();

    drawerActiveTaskId = null;
    drawerExpandedSubtasks.clear();
    setTaskDetailOpenState(false);

    if (refs.content) {
        refs.content.classList.remove('fade-in', 'fade-out');
        refs.content.innerHTML = '';
        refs.content.scrollTop = 0;
    }

    syncTaskDetailSelectionState();
}

function closeDrawer() {
    closeTaskDetail();
}

function syncTaskDetailPanel() {
    const refs = getTaskDetailRefs();
    if (!refs.panel || !refs.content || !refs.mainCol) return;

    if (drawerActiveTaskId == null) {
        setTaskDetailOpenState(false);
        syncTaskDetailSelectionState();
        return;
    }

    const taskModeVisible = refs.taskMode && !refs.taskMode.classList.contains('hidden');
    const task = findTaskById(drawerActiveTaskId);
    if (!taskModeVisible || !task || !isTaskVisibleInCurrentDate(drawerActiveTaskId)) {
        closeTaskDetail();
        return;
    }

    setTaskDetailOpenState(true);
    renderDrawerContent(task);
    refs.content.classList.remove('fade-out');
    refs.content.classList.add('fade-in');
    syncTaskDetailSelectionState();
}

function renderDrawerContent(task) {
    const content = document.getElementById('taskDetailContent');
    if (!content) return;

    const priorityClass = getPriorityClass(task.priority);
    const priorityText = getPriorityText(task.priority);
    const subtasksHtml = renderSubtasksList(task);
    const tagsHtml = renderTagsList(task);
    const notesHtml = renderNotesArea(task);

    content.innerHTML = `
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

        <div class="drawer-attrs">
            <div class="drawer-attr-row" onclick="event.stopPropagation();openTimePickerInDrawer(${task.id})">
                <div class="drawer-attr-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    时间
                </div>
                <div class="drawer-attr-value">${task.planTime || '全天'}</div>
            </div>

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

            <div class="drawer-attr-row" onclick="event.stopPropagation();openDurationPickerInDrawer(${task.id})">
                <div class="drawer-attr-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 8v4l2.5 2.5"/>
                        <path d="M9 3h6"/>
                    </svg>
                    时长
                </div>
                <div class="drawer-attr-value">
                    ${task.duration ? `<span class="time-badge">${task.duration} 分钟</span>` : '<span style="color:var(--text3)">未设置</span>'}
                </div>
            </div>

            ${tagsHtml ? `
            <div class="drawer-attr-row" onclick="event.stopPropagation()">
                <div class="drawer-attr-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                        <line x1="7" y1="7" x2="7.01" y2="7"/>
                    </svg>
                    标签
                </div>
                <div class="drawer-attr-value">${tagsHtml}</div>
            </div>
            ` : ''}
        </div>

        <hr class="drawer-divider">

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

        ${notesHtml}

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

function getSubtaskDoneCount(task) {
    return (task.subtasks || []).filter(function(subtask) {
        return subtask.done;
    }).length;
}

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

function toggleTaskDoneFromDrawer(taskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    task.done = !task.done;
    task.status = task.done ? 'done' : 'todo';
    if (!task.done) {
        task.archived = false;
    }

    persistTaskDetailChanges(task, { calendar: true, kanban: true });
}

function saveDrawerTitle(taskId) {
    const input = document.getElementById('drawer-task-title-input');
    if (!input) return;

    const task = findTaskById(taskId);
    if (!task) return;

    const newText = input.value.trim();
    if (newText && newText !== task.text) {
        task.text = newText;
        persistTaskDetailChanges(task, { kanban: true });
    }
}

function saveDrawerNotes(taskId) {
    const textarea = document.getElementById('drawer-notes-input');
    if (!textarea) return;

    const task = findTaskById(taskId);
    if (!task) return;

    const newNote = textarea.value.trim();
    if (newNote !== (task.note || '')) {
        task.note = newNote;
        persistTaskDetailChanges(task, { kanban: true });
    }
}

function toggleSubtaskInDrawer(taskId, subtaskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    const subtask = (task.subtasks || []).find(function(item) {
        return item.id === subtaskId;
    });
    if (!subtask) return;

    subtask.done = !subtask.done;
    persistTaskDetailChanges(task, { kanban: true });
}

function openAddSubtaskInDrawer(taskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    const newText = prompt('输入子任务内容');
    if (!newText || !newText.trim()) return;

    if (!task.subtasks) {
        task.subtasks = [];
    }

    task.subtasks.push({
        id: Date.now(),
        text: newText.trim(),
        done: false
    });

    persistTaskDetailChanges(task, { kanban: true });
}

function getPriorityClass(priority) {
    switch (priority) {
        case 'high': return 'high';
        case 'medium': return 'medium';
        case 'normal': return 'normal';
        case 'low': return 'low';
        default: return 'normal';
    }
}

function getPriorityText(priority) {
    switch (priority) {
        case 'high': return '高';
        case 'medium': return '中';
        case 'normal': return '正常';
        case 'low': return '低';
        default: return '正常';
    }
}

function getCircleIconSvg() {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
    </svg>`;
}

function getCheckIconSvg() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
    </svg>`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function openTimePickerInDrawer(taskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    const newTime = prompt('输入计划时间 (HH:MM)', task.planTime || '');
    if (newTime !== null) {
        task.planTime = newTime || '';
        persistTaskDetailChanges(task, { kanban: true });
    }
}

function openPriorityPickerInDrawer(taskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    const priorities = [
        { value: 'high', label: '0. 高' },
        { value: 'medium', label: '1. 中' },
        { value: 'normal', label: '2. 正常' },
        { value: 'low', label: '3. 低' }
    ];

    const current = task.priority || 'normal';
    const currentIndex = priorities.findIndex(function(item) {
        return item.value === current;
    });

    const newPriority = prompt(
        '选择优先级\n' + priorities.map(function(item, index) {
            return (index === currentIndex ? '当前 ' : '    ') + item.label;
        }).join('\n'),
        String(Math.max(currentIndex, 0))
    );

    if (newPriority === null || newPriority === '') return;

    const index = parseInt(newPriority, 10);
    if (index >= 0 && index < priorities.length) {
        task.priority = priorities[index].value;
        persistTaskDetailChanges(task, { kanban: true });
    }
}

function openDurationPickerInDrawer(taskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    const newDuration = prompt('输入预计时长 (分钟)', task.duration || '30');
    if (newDuration === null) return;

    const duration = parseInt(newDuration, 10);
    if (!isNaN(duration) && duration >= 0) {
        task.duration = duration;
        persistTaskDetailChanges(task, { kanban: true });
    }
}

function openRepeatInDrawer(taskId) {
    if (typeof openCustomRepeatModal === 'function') {
        openCustomRepeatModal(taskId);
        return;
    }
    toast('重复规则功能暂不可用');
}

function toggleFreezeInDrawer(taskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    task.frozen = !task.frozen;
    persistTaskDetailChanges(task, { kanban: true });
    toast(task.frozen ? '任务已冻结' : '任务已解冻');
}

function deleteTaskInDrawer(taskId) {
    if (confirm('确定要删除这个任务吗？')) {
        del(taskId);
        closeTaskDetail();
    }
}

window.openTaskDrawer = openTaskDrawer;
window.openTaskDetail = openTaskDrawer;
window.closeDrawer = closeDrawer;
window.closeTaskDetail = closeTaskDetail;
window.syncTaskDetailPanel = syncTaskDetailPanel;
