/**
 * Local task detail panel rendered inside the middle task column.
 */

let drawerActiveTaskId = null;
let drawerExpandedSubtasks = new Set();
let taskDetailRenderPatched = false;
let taskDetailCloseTimer = null;
const TASK_DETAIL_CLOSE_DELAY = 460;

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
    enhanceTaskRowInteractions();
    syncTaskDetailPanel();
}

function patchTaskRenderSync() {
    if (taskDetailRenderPatched || typeof window.rT !== 'function') return;

    const originalRenderTasks = window.rT;
    window.rT = function() {
        const result = originalRenderTasks.apply(this, arguments);
        enhanceTaskRowInteractions();
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
    document.querySelectorAll('#tList .task-detail-trigger').forEach(function(button) {
        button.classList.remove('is-active');
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('title', '查看详情');
        button.setAttribute('aria-label', '查看详情');
    });

    if (drawerActiveTaskId == null) return;

    const activeItem = document.querySelector('#tList .task-item[data-id="' + drawerActiveTaskId + '"]');
    if (activeItem) {
        activeItem.classList.add('task-item--detail-active');
        const trigger = activeItem.querySelector('.task-detail-trigger');
        if (trigger) {
            trigger.classList.add('is-active');
            trigger.setAttribute('aria-pressed', 'true');
            trigger.setAttribute('title', '收起详情');
            trigger.setAttribute('aria-label', '收起详情');
        }
    }
}

function enhanceTaskRowInteractions() {
    document.querySelectorAll('#tList .task-item').forEach(function(item) {
        const title = item.querySelector('.task-row-center .txt');
        if (title && title.getAttribute('ondblclick')) {
            title.classList.add('txt--editable');
            if (!title.getAttribute('title')) {
                title.setAttribute('title', '双击修改标题');
            }
        } else if (title) {
            title.classList.remove('txt--editable');
            if (title.getAttribute('title') === '双击修改标题') {
                title.removeAttribute('title');
            }
        }

        if (item.classList.contains('archived-item')) return;

        const actions = item.querySelector('.task-actions');
        const moreWrap = actions && actions.querySelector('.task-more-wrap');
        const taskId = item.getAttribute('data-id');
        if (!actions || !moreWrap || !taskId) return;

        if (!actions.querySelector('.task-detail-trigger')) {
            actions.insertBefore(createTaskDetailTrigger(taskId), moreWrap);
        }

        // ── 背景点击监听器（共用排除逻辑）──────────────────────────────
        // stopPropagation 只阻止事件冒泡到父元素，不影响同一元素上的其他监听器。
        // 因此需要在 .task-item 和 .task-row-center 两处各绑一次：
        //   · .task-item      ← 覆盖 task-row / task-strike-wrap 等外层背景
        //   · .task-row-center ← onTaskRowCenterClick 调用了 stopPropagation，
        //                        事件无法冒泡到 task-item，必须在此直接监听
        function isBgClick(e, boundary) {
            var node = e.target;
            while (node && node !== boundary) {
                var tag = node.tagName;
                if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA' ||
                    tag === 'SELECT' || tag === 'A' || tag === 'LABEL') return false;
                if (node.classList.contains('task-actions'))      return false;
                if (node.classList.contains('task-ck-slot'))      return false;
                if (node.classList.contains('chk-ring'))          return false;
                if (node.classList.contains('task-rail'))         return false;
                if (node.classList.contains('task-inline-meta'))  return false;
                if (node.classList.contains('sub-task-pill-btn')) return false;
                if (node.classList.contains('task-expand-area'))  return false;
                if (node.classList.contains('exp-bg-wrap'))       return false;
                if (node.classList.contains('txt'))               return false;
                if (node.classList.contains('time-plain'))        return false;
                if (node.classList.contains('time-edit'))         return false;
                node = node.parentNode;
            }
            return true;
        }

        function handleBackgroundClick(e, boundary) {
            if (e.__taskDetailBgHandled) return;
            if (!isBgClick(e, boundary)) return;
            e.__taskDetailBgHandled = true;
            openTaskDrawer(Number(taskId));
        }

        // 1) task-item 级别：覆盖 task-row、task-strike-wrap 等外层背景
        if (!item._bgClickBound) {
            item._bgClickBound = true;
            item.addEventListener('click', function(e) {
                handleBackgroundClick(e, item);
            });
        }

        var taskRow = item.querySelector('.task-row');
        if (taskRow && !taskRow._bgClickBound) {
            taskRow._bgClickBound = true;
            taskRow.addEventListener('click', function(e) {
                handleBackgroundClick(e, taskRow);
            });
        }

        // 2) task-row-center 级别：onTaskRowCenterClick 调用了 stopPropagation，
        //    时间右侧空白区的点击无法冒泡到 task-item，需在此捕获
        var rowCenter = item.querySelector('.task-row-center');
        if (rowCenter && !rowCenter._bgClickBound) {
            rowCenter._bgClickBound = true;
            rowCenter.addEventListener('click', function(e) {
                handleBackgroundClick(e, rowCenter);
            });
        }

        var strikeWrap = item.querySelector('.task-strike-wrap');
        if (strikeWrap && !strikeWrap._bgClickBound) {
            strikeWrap._bgClickBound = true;
            strikeWrap.addEventListener('click', function(e) {
                handleBackgroundClick(e, strikeWrap);
            });
        }

        var inlineMeta = item.querySelector('.task-inline-meta');
        if (inlineMeta && !inlineMeta._bgClickBound) {
            inlineMeta._bgClickBound = true;
            inlineMeta.addEventListener('click', function(e) {
                handleBackgroundClick(e, inlineMeta);
            });
        }
    });

    syncTaskDetailSelectionState();
}

function clearTaskRowHoverSuspension(taskId) {
    if (taskId == null) return;
    const item = document.querySelector('#tList .task-item[data-id="' + taskId + '"]');
    if (item) {
        item.classList.remove('task-item--hover-suspended');
    }
}

function releaseTaskRowInteractionState(taskId) {
    if (taskId == null) return;

    const item = document.querySelector('#tList .task-item[data-id="' + taskId + '"]');
    if (!item) return;

    const activeEl = document.activeElement;
    if (activeEl && item.contains(activeEl) && typeof activeEl.blur === 'function') {
        activeEl.blur();
    }

    // Closing the drawer should return the row to its natural hover state.
    // If the pointer is still over the task, keep the corner accents visible.
    item.classList.remove('task-item--hover-suspended');
}

function createTaskDetailTrigger(taskId) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'act-btn task-detail-trigger';
    button.setAttribute('title', '查看详情');
    button.setAttribute('aria-label', '查看详情');
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6h10"/><path d="M9 12h10"/><path d="M9 18h6"/><path d="M5 6h.01"/><path d="M5 12h.01"/><path d="M5 18h.01"/></svg>';
    button.addEventListener('click', function(event) {
        event.stopPropagation();
        openTaskDrawer(Number(taskId));
    });
    return button;
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

    if (drawerActiveTaskId === taskId && refs.panel.classList.contains('task-detail-panel--open')) {
        closeTaskDetail();
        return;
    }

    const task = findTaskById(taskId);
    if (!task) {
        closeTaskDetail();
        return;
    }

    const taskChanged = drawerActiveTaskId !== taskId;
    drawerActiveTaskId = taskId;
    clearPendingTaskDetailClose(refs.content);
    clearTaskRowHoverSuspension(taskId);

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
    if (!refs.panel || !refs.content) {
        drawerActiveTaskId = null;
        drawerExpandedSubtasks.clear();
        return;
    }

    const closingTaskId = drawerActiveTaskId;
    drawerActiveTaskId = null;
    drawerExpandedSubtasks.clear();
    clearPendingTaskDetailClose(refs.content);

    refs.content.classList.remove('fade-in');
    refs.content.classList.add('fade-out');
    setTaskDetailOpenState(false);
    syncTaskDetailSelectionState();
    releaseTaskRowInteractionState(closingTaskId);

    taskDetailCloseTimer = window.setTimeout(function() {
        if (drawerActiveTaskId !== null) return;
        refs.content.classList.remove('fade-in', 'fade-out');
        refs.content.innerHTML = '';
        refs.content.scrollTop = 0;
        taskDetailCloseTimer = null;
    }, TASK_DETAIL_CLOSE_DELAY);
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
    clearPendingTaskDetailClose(refs.content);
    renderDrawerContent(task);
    refs.content.classList.remove('fade-out');
    refs.content.classList.add('fade-in');
    syncTaskDetailSelectionState();
}

function clearPendingTaskDetailClose(content) {
    if (taskDetailCloseTimer !== null) {
        window.clearTimeout(taskDetailCloseTimer);
        taskDetailCloseTimer = null;
    }

    if (content) {
        content.classList.remove('fade-out');
    }
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

        <div class="drawer-row drawer-row--time">
            <div class="drawer-row-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
            </div>
            <label class="drawer-row-label">时间</label>
            <input type="time"
                   class="drawer-row-input"
                   id="drawer-time-input-${task.id}"
                   value="${task.planTime || ''}"
                   onclick="event.stopPropagation()"
                   onchange="saveDrawerTime(${task.id})">
        </div>

        <div class="drawer-row drawer-row--priority">
            <div class="drawer-row-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
            </div>
            <label class="drawer-row-label">优先级</label>
            <select class="drawer-row-select"
                    id="drawer-priority-input-${task.id}"
                    onclick="event.stopPropagation()"
                    onchange="saveDrawerPriority(${task.id})">
                <option value="high" ${task.priority === 'high' ? 'selected' : ''}>高</option>
                <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>中</option>
                <option value="normal" ${!task.priority || task.priority === 'normal' ? 'selected' : ''}>正常</option>
                <option value="low" ${task.priority === 'low' ? 'selected' : ''}>低</option>
            </select>
        </div>

        <div class="drawer-row drawer-row--duration">
            <div class="drawer-row-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4l2.5 2.5"/>
                    <path d="M9 3h6"/>
                </svg>
            </div>
            <label class="drawer-row-label">时长</label>
            <input type="number"
                   class="drawer-row-input drawer-row-input--short"
                   id="drawer-duration-input-${task.id}"
                   value="${task.duration || ''}"
                   min="0"
                   max="480"
                   placeholder="分钟"
                   onclick="event.stopPropagation()"
                   onchange="saveDrawerDuration(${task.id})">
            <span class="drawer-row-suffix">分钟</span>
        </div>

        ${tagsHtml ? `
        <div class="drawer-row drawer-row--tags">
            <div class="drawer-row-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
            </div>
            <label class="drawer-row-label">标签</label>
            <div class="drawer-row-value">${tagsHtml}</div>
        </div>
        ` : ''}

        <div class="drawer-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            <span>子任务</span>
            ${(task.subtasks || []).length > 0 ? `<span class="drawer-section-count">${getSubtaskDoneCount(task)}/${task.subtasks.length}</span>` : ''}
        </div>

        <div class="drawer-subtasks-list">
            ${subtasksHtml}
            <div class="subtask-add-inline" id="subtask-add-inline-${task.id}" style="display:none">
                <input type="text"
                       class="subtask-add-input"
                       id="subtask-add-input-${task.id}"
                       placeholder="输入子任务内容，按回车添加..."
                       onclick="event.stopPropagation()"
                       onkeydown="if(event.key==='Enter'){addSubtaskFromDrawer(${task.id});}if(event.key==='Escape'){hideSubtaskAddInline(${task.id})}">
                <button type="button" class="subtask-add-confirm-btn" onclick="addSubtaskFromDrawer(${task.id})" title="确认">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </button>
                <button type="button" class="subtask-add-cancel-btn" onclick="hideSubtaskAddInline(${task.id})" title="取消">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="subtask-add-btn" onclick="event.stopPropagation();showSubtaskAddInline(${task.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span>添加子任务</span>
            </div>
        </div>

        <div class="drawer-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>备注</span>
        </div>

        <textarea class="drawer-notes-textarea"
                  id="drawer-notes-input"
                  placeholder="添加任务备注..."
                  onclick="event.stopPropagation()"
                  onblur="saveDrawerNotes(${task.id})">${escapeHtml(task.note || '')}</textarea>

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
                 data-subtask-id="${sub.id}">
                <div class="subtask-check ${isDone ? 'done' : ''}"
                     onclick="event.stopPropagation();toggleSubtaskInDrawer(${task.id}, ${sub.id})">
                    ${isDone ? getCheckIconSvg() : ''}
                </div>
                <span class="subtask-text ${isDone ? 'done' : ''}"
                      onclick="event.stopPropagation();toggleSubtaskInDrawer(${task.id}, ${sub.id})">${escapeHtml(sub.text)}</span>
                <button type="button" class="subtask-delete-btn"
                        onclick="event.stopPropagation();deleteSubtaskInDrawer(${task.id}, ${sub.id})"
                        title="删除子任务">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
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

function deleteSubtaskInDrawer(taskId, subtaskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    task.subtasks = (task.subtasks || []).filter(function(item) {
        return item.id !== subtaskId;
    });
    persistTaskDetailChanges(task, { kanban: true });
}

function openAddSubtaskInDrawer(taskId) {
    // 已改为内嵌输入，此函数保留但不再使用
}

function showSubtaskAddInline(taskId) {
    const inputWrap = document.getElementById('subtask-add-inline-' + taskId);
    const addBtn = inputWrap && inputWrap.nextElementSibling;
    const input = document.getElementById('subtask-add-input-' + taskId);

    if (!inputWrap || !addBtn || !input) return;

    inputWrap.style.display = 'flex';
    addBtn.style.display = 'none';
    input.focus();
}

function hideSubtaskAddInline(taskId) {
    const inputWrap = document.getElementById('subtask-add-inline-' + taskId);
    const addBtn = inputWrap && inputWrap.nextElementSibling;
    const input = document.getElementById('subtask-add-input-' + taskId);

    if (!inputWrap || !addBtn || !input) return;

    inputWrap.style.display = 'none';
    addBtn.style.display = 'flex';
    input.value = '';
}

function addSubtaskFromDrawer(taskId) {
    const input = document.getElementById('subtask-add-input-' + taskId);
    if (!input) return;

    const newText = input.value.trim();
    if (!newText) return;

    const task = findTaskById(taskId);
    if (!task) return;

    if (!task.subtasks) {
        task.subtasks = [];
    }

    task.subtasks.push({
        id: Date.now(),
        text: newText,
        done: false
    });

    input.value = '';
    hideSubtaskAddInline(taskId);
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
    // 已改为内嵌输入，此函数保留但不再使用
}

function saveDrawerTime(taskId) {
    const input = document.getElementById('drawer-time-input-' + taskId);
    if (!input) return;

    const task = findTaskById(taskId);
    if (!task) return;

    const newTime = input.value.trim();
    if (newTime !== (task.planTime || '')) {
        task.planTime = newTime;
        persistTaskDetailChanges(task, { kanban: true });
    }
}

function openPriorityPickerInDrawer(taskId) {
    // 已改为内嵌输入，此函数保留但不再使用
}

function saveDrawerPriority(taskId) {
    const select = document.getElementById('drawer-priority-input-' + taskId);
    if (!select) return;

    const task = findTaskById(taskId);
    if (!task) return;

    const newPriority = select.value;
    if (newPriority !== (task.priority || 'normal')) {
        task.priority = newPriority;
        persistTaskDetailChanges(task, { kanban: true });
    }
}

function openDurationPickerInDrawer(taskId) {
    // 已改为内嵌输入，此函数保留但不再使用
}

function saveDrawerDuration(taskId) {
    const input = document.getElementById('drawer-duration-input-' + taskId);
    if (!input) return;

    const task = findTaskById(taskId);
    if (!task) return;

    const newDuration = parseInt(input.value, 10);
    if (!isNaN(newDuration) && newDuration >= 0) {
        if (task.duration !== newDuration) {
            task.duration = newDuration;
            persistTaskDetailChanges(task, { kanban: true });
        }
    } else if (input.value === '') {
        if (task.duration) {
            task.duration = undefined;
            persistTaskDetailChanges(task, { kanban: true });
        }
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
