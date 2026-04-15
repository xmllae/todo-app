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
        button.setAttribute('title', '\u67e5\u770b\u8be6\u60c5');
        button.setAttribute('aria-label', '\u67e5\u770b\u8be6\u60c5');
    });

    if (drawerActiveTaskId == null) return;

    const activeItem = document.querySelector('#tList .task-item[data-id="' + drawerActiveTaskId + '"]');
    if (activeItem) {
        activeItem.classList.add('task-item--detail-active');
        const trigger = activeItem.querySelector('.task-detail-trigger');
        if (trigger) {
            trigger.classList.add('is-active');
            trigger.setAttribute('aria-pressed', 'true');
            trigger.setAttribute('title', '\u6536\u8d77\u8be6\u60c5');
            trigger.setAttribute('aria-label', '\u6536\u8d77\u8be6\u60c5');
        }
    }
}

function enhanceTaskRowInteractions() {
    document.querySelectorAll('#tList .task-item').forEach(function(item) {
        const title = item.querySelector('.task-row-center .txt');
        if (title && title.getAttribute('ondblclick')) {
            title.classList.add('txt--editable');
            if (!title.getAttribute('title')) {
                title.setAttribute('title', '\u53cc\u51fb\u4fee\u6539\u6807\u9898');
            }
        } else if (title) {
            title.classList.remove('txt--editable');
            if (title.getAttribute('title') === '\u53cc\u51fb\u4fee\u6539\u6807\u9898') {
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

        // 鈹€鈹€ 鑳屾櫙鐐瑰嚮鐩戝惉鍣紙鍏辩敤鎺掗櫎閫昏緫锛夆攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
        // stopPropagation 鍙樆姝簨浠跺啋娉″埌鐖跺厓绱狅紝涓嶅奖鍝嶅悓涓€鍏冪礌涓婄殑鍏朵粬鐩戝惉鍣ㄣ€?
        // 鍥犳闇€瑕佸湪 .task-item 鍜?.task-row-center 涓ゅ鍚勭粦涓€娆★細
        //   路 .task-item      鈫?瑕嗙洊 task-row / task-strike-wrap 绛夊灞傝儗鏅?
        //   路 .task-row-center 鈫?onTaskRowCenterClick 璋冪敤浜?stopPropagation锛?
        //                        浜嬩欢鏃犳硶鍐掓场鍒?task-item锛屽繀椤诲湪姝ょ洿鎺ョ洃鍚?
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

        // 1) task-item 绾у埆锛氳鐩?task-row銆乼ask-strike-wrap 绛夊灞傝儗鏅?
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

        // 2) task-row-center 绾у埆锛歰nTaskRowCenterClick 璋冪敤浜?stopPropagation锛?
        //    鏃堕棿鍙充晶绌虹櫧鍖虹殑鐐瑰嚮鏃犳硶鍐掓场鍒?task-item锛岄渶鍦ㄦ鎹曡幏
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
    button.setAttribute('title', '\u67e5\u770b\u8be6\u60c5');
    button.setAttribute('aria-label', '\u67e5\u770b\u8be6\u60c5');
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

function taskAppearsDoneInDrawer(task) {
    if (!task) return false;
    if (task.done) return true;
    if (typeof _togVisualPendingIds !== 'undefined' && _togVisualPendingIds && typeof _togVisualPendingIds.has === 'function') {
        return _togVisualPendingIds.has(task.id);
    }
    return false;
}

function renderDrawerContent(task) {
    const content = document.getElementById('taskDetailContent');
    if (!content) return;

    const subtasksHtml = renderSubtasksList(task);
    const tagsHtml = renderTagsList(task);
    const isDone = taskAppearsDoneInDrawer(task);
    const normalizedPriority = task.priority === 'high' ? 'high' : 'normal';
    const scheduleState = getDrawerScheduleState(task);
    const scheduleDurationText = scheduleState.durationMinutes !== null
        ? formatDrawerDurationBadgeText(scheduleState.durationMinutes)
        : '\u5f85\u8bbe\u7f6e';
    const scheduleDurationChipClass = scheduleState.durationMinutes !== null
        ? 'drawer-schedule-duration-chip--filled'
        : 'drawer-schedule-duration-chip--idle';

    content.innerHTML = `
        <div class="drawer-task-title ${isDone ? 'drawer-task-title--done' : ''}">
            <div class="task-ck-slot task-ck-ring ${task.priority === 'high' ? 'task-ck-ring--prio-high' : ''} ${isDone ? 'task-ck-ring--done' : ''}"
                 onclick="toggleTaskDoneFromDrawer(${task.id})"
                 title="${task.done ? '\u6807\u8bb0\u4e3a\u672a\u5b8c\u6210' : '\u6807\u8bb0\u4e3a\u5df2\u5b8c\u6210'}"
                 onmouseenter="handleCheckRingHover(this, true)"
                 onmouseleave="handleCheckRingHover(this, false)">
                <div class="tc-check">
                    <div class="chk-ring ${isDone ? 'checked' : ''}">
                        <svg class="chk-ring-ico" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.15 12.35 10.95 16.05 17.1 8.2" stroke="currentColor" stroke-width="2.55" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                </div>
            </div>
            <input type="text"
                   class="drawer-task-title-text"
                   id="drawer-task-title-input"
                   value="${escapeHtml(task.text || '')}"
                   onclick="event.stopPropagation()"
                   onblur="saveDrawerTitle(${task.id})"
                   onkeydown="if(event.key==='Enter'){event.target.blur()}">
            <div class="drawer-priority-dropdown" onclick="event.stopPropagation()">
                <button type="button" class="drawer-priority-btn" onclick="togglePriorityDropdown(this)" title="\u9009\u62e9\u4f18\u5148\u7ea7">
                    <svg class="drawer-priority-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </button>
                <div class="drawer-priority-menu">
                    <div class="drawer-priority-option ${task.priority === 'high' ? 'selected' : ''}" data-priority="high" onclick="setDrawerPriority(${task.id}, 'high')">
                        <svg class="drawer-priority-flag drawer-priority-flag--high" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 21V5.5"/>
                            <path d="M6 5.5h10.5l-1.7 4 1.7 4H6"/>
                        </svg>
                        <span>\u9ad8\u4f18\u5148\u7ea7</span>
                    </div>
                    <div class="drawer-priority-option ${!task.priority || task.priority === 'normal' ? 'selected' : ''}" data-priority="normal" onclick="setDrawerPriority(${task.id}, 'normal')">
                        <svg class="drawer-priority-flag drawer-priority-flag--normal" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 21V5.5"/>
                            <path d="M6 5.5h10.5l-1.7 4 1.7 4H6"/>
                        </svg>
                        <span>\u65e0\u4f18\u5148\u7ea7</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="drawer-section-header drawer-section-header--schedule">
            <div class="drawer-section-label drawer-section-label--schedule">
                <span class="drawer-section-title">\u65f6\u95f4\u5b89\u6392</span>
            </div>
        </div>

        <div class="drawer-schedule-card" onclick="event.stopPropagation()">
            <div class="drawer-schedule-time-row">
                <label class="drawer-schedule-time-box drawer-schedule-time-box--start">
                    <span class="drawer-schedule-time-label">
                        <span class="drawer-schedule-time-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="8.25"/>
                                <path d="M12 7.8v4.25l2.9 1.85"/>
                            </svg>
                        </span>
                        <span>\u5f00\u59cb</span>
                    </span>
                    <div class="drawer-schedule-time-value">
                        <input type="text"
                               class="drawer-schedule-input drawer-schedule-input--time"
                               id="drawer-start-time-input-${task.id}"
                               value="${task.planTime || ''}"
                               placeholder="00:00"
                               inputmode="numeric"
                               maxlength="5"
                               spellcheck="false"
                               autocomplete="off"
                               onclick="event.stopPropagation()"
                               oninput="handleDrawerTimeTyping(this, ${task.id}, 'start')"
                               onkeydown="if(event.key==='Enter'){event.target.blur()}"
                               onchange="saveDrawerStartTime(${task.id})">
                    </div>
                </label>
                <div class="drawer-schedule-duration-row ${scheduleState.spillsNextDay ? 'drawer-schedule-duration-row--overnight' : ''}">
                    <label class="drawer-schedule-duration-main">
                        <span class="drawer-schedule-duration-label">\u9884\u8ba1\u8017\u65f6</span>
                        <div class="drawer-schedule-duration-inputline">
                            <input type="number"
                                   class="drawer-schedule-input drawer-schedule-input--duration"
                                   id="drawer-duration-input-${task.id}"
                                   value="${scheduleState.durationMinutes !== null ? scheduleState.durationMinutes : ''}"
                                   min="0"
                                   max="1440"
                                   step="5"
                                   inputmode="numeric"
                                   placeholder="0"
                                   onclick="event.stopPropagation()"
                                   onchange="saveDrawerDuration(${task.id})">
                            <span class="drawer-schedule-unit">\u5206\u949f</span>
                        </div>
                    </label>
                    <div class="drawer-schedule-arrow" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4.5 12h15"/>
                            <path d="m13.5 6 6 6-6 6"/>
                        </svg>
                    </div>
                    <div class="drawer-schedule-duration-side">
                        <span class="drawer-schedule-duration-chip ${scheduleDurationChipClass}">${scheduleDurationText}</span>
                        ${scheduleState.spillsNextDay ? `<span class="drawer-schedule-duration-note">\u6b21\u65e5\u7ed3\u675f</span>` : ''}
                    </div>
                </div>
                <label class="drawer-schedule-time-box drawer-schedule-time-box--end">
                    <span class="drawer-schedule-time-label">
                        <span class="drawer-schedule-time-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="8.25"/>
                                <path d="M12 7.8v4.25l2.9 1.85"/>
                            </svg>
                        </span>
                        <span>\u7ed3\u675f</span>
                    </span>
                    <div class="drawer-schedule-time-value">
                        <input type="text"
                               class="drawer-schedule-input drawer-schedule-input--time"
                               id="drawer-end-time-input-${task.id}"
                               value="${scheduleState.endTime}"
                               placeholder="00:00"
                               inputmode="numeric"
                               maxlength="5"
                               spellcheck="false"
                               autocomplete="off"
                               onclick="event.stopPropagation()"
                               oninput="handleDrawerTimeTyping(this, ${task.id}, 'end')"
                               onkeydown="if(event.key==='Enter'){event.target.blur()}"
                               onchange="saveDrawerEndTime(${task.id})">
                    </div>
                </label>
            </div>
        </div>

        ${tagsHtml ? `
        <div class="drawer-row drawer-row--tags">
            <div class="drawer-row-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
            </div>
            <label class="drawer-row-label">\u6807\u7b7e</label>
            <div class="drawer-row-value">${tagsHtml}</div>
        </div>
        ` : ''}

        <div class="drawer-section-header">
            <div class="drawer-section-label drawer-section-label--subtasks">
                <span class="drawer-section-title">\u5b50\u4efb\u52a1</span>
            </div>
            ${(task.subtasks || []).length > 0 ? `<span class="drawer-section-count">${getSubtaskDoneCount(task)}/${task.subtasks.length}</span>` : ''}
        </div>

        <div class="drawer-subtasks-list">
            ${subtasksHtml}
            <div class="subtask-add-inline" id="subtask-add-inline-${task.id}" style="display:none">
                <input type="text"
                       class="subtask-add-input"
                       id="subtask-add-input-${task.id}"
                       placeholder="\u8f93\u5165\u5b50\u4efb\u52a1\u5185\u5bb9\uff0c\u6309\u56de\u8f66\u6dfb\u52a0..."
                       onclick="event.stopPropagation()"
                       onkeydown="if(event.key==='Enter'){addSubtaskFromDrawer(${task.id});}if(event.key==='Escape'){hideSubtaskAddInline(${task.id})}">
                <button type="button" class="subtask-add-confirm-btn" onclick="addSubtaskFromDrawer(${task.id})" title="\u786e\u8ba4">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </button>
                <button type="button" class="subtask-add-cancel-btn" onclick="hideSubtaskAddInline(${task.id})" title="\u53d6\u6d88">
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
                <span>\u6dfb\u52a0\u5b50\u4efb\u52a1</span>
            </div>
        </div>

        <div class="drawer-section-header">
            <div class="drawer-section-label drawer-section-label--notes">
                <span class="drawer-section-title">\u5907\u6ce8</span>
            </div>
        </div>

        <textarea class="drawer-notes-textarea"
                  id="drawer-notes-input"
                  placeholder="\u6dfb\u52a0\u4efb\u52a1\u8be6\u60c5\u3001\u94fe\u63a5\u6216\u5907\u5fd8\u5f55..."
                  onclick="event.stopPropagation()"
                  onblur="saveDrawerNotes(${task.id})">${escapeHtml(task.note || '')}</textarea>

        <div class="drawer-footer">
            <button class="drawer-footer-btn drawer-footer-btn--repeat" onclick="event.stopPropagation();openRepeatInDrawer(${task.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 4v6h-6"/>
                    <path d="M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                \u91cd\u590d
            </button>
            <button class="drawer-footer-btn drawer-footer-btn--freeze" onclick="event.stopPropagation();toggleFreezeInDrawer(${task.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                ${task.frozen ? '\u89e3\u51bb' : '\u51bb\u7ed3'}
            </button>
            <button class="drawer-footer-btn drawer-footer-btn--danger danger" onclick="event.stopPropagation();deleteTaskInDrawer(${task.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                \u5220\u9664
            </button>
        </div>
    `;

    const checkSlot = content.querySelector('.drawer-task-title .task-ck-ring');
    if (checkSlot) {
        checkSlot.title = isDone ? '\u6807\u8bb0\u4e3a\u672a\u5b8c\u6210' : '\u6807\u8bb0\u4e3a\u5df2\u5b8c\u6210';
        if (isDone) {
            checkSlot.onmouseenter = null;
            checkSlot.onmouseleave = null;
        } else {
            checkSlot.onmouseenter = function() { handleCheckRingHover(this, true); };
            checkSlot.onmouseleave = function() { handleCheckRingHover(this, false); };
        }
    }

    updateDrawerPriorityUI(normalizedPriority);
}

function renderSubtasksList(task) {
    const subtasks = task.subtasks || [];
    if (subtasks.length === 0) return '';

    return subtasks.map(function(sub) {
        const isDone = sub.done;
        return `
            <div class="subtask-row"
                 data-subtask-id="${sub.id}">
                <div class="subtask-check task-ck-slot ${isDone ? 'task-ck-ring--done' : ''}"
                     onclick="event.stopPropagation();toggleSubtaskInDrawer(${task.id}, ${sub.id})"
                     onmouseenter="handleSubtaskCheckHover(this, true)"
                     onmouseleave="handleSubtaskCheckHover(this, false)">
                    <div class="tc-check">
                        <div class="chk-ring ${isDone ? 'checked' : ''}">
                            <svg class="chk-ring-ico" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.15 12.35 10.95 16.05 17.1 8.2" stroke="currentColor" stroke-width="2.55" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </div>
                    </div>
                </div>
                <span class="subtask-text ${isDone ? 'done' : ''}"
                      onclick="event.stopPropagation();toggleSubtaskInDrawer(${task.id}, ${sub.id})">${escapeHtml(sub.text)}</span>
                <button type="button" class="subtask-delete-btn"
                        onclick="event.stopPropagation();deleteSubtaskInDrawer(${task.id}, ${sub.id})"
                        title="\u5220\u9664\u5b50\u4efb\u52a1">
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
                \u5907\u6ce8
            </div>
            <textarea class="drawer-notes-textarea"
                      id="drawer-notes-input"
                      placeholder="\u6dfb\u52a0\u4efb\u52a1\u5907\u6ce8..."
                      onclick="event.stopPropagation()"
                      onblur="saveDrawerNotes(${task.id})">${escapeHtml(task.note || '')}</textarea>
        </div>
    `;
}

function toggleTaskDoneFromDrawer(taskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    if (typeof _togVisualPendingIds !== 'undefined' && _togVisualPendingIds && _togVisualPendingIds.has(taskId) && typeof tog === 'function') {
        tog(taskId);
        return;
    }

    task.done = !task.done;
    task.status = task.done ? 'done' : 'todo';
    if (!task.done) {
        task.archived = false;
    }

    // Update title styling
    const titleEl = document.querySelector('.drawer-task-title');
    const checkSlot = document.querySelector('.task-ck-ring');
    const chkRing = document.querySelector('.task-ck-ring .chk-ring');
    const titleInput = document.getElementById('drawer-task-title-input');

    if (titleEl) {
        titleEl.classList.toggle('drawer-task-title--done', task.done);
    }
    if (checkSlot) {
        checkSlot.classList.toggle('task-ck-ring--done', task.done);
        // Update hover handlers based on done state
        if (task.done) {
            checkSlot.onmouseenter = null;
            checkSlot.onmouseleave = null;
        } else {
            checkSlot.onmouseenter = function() { handleCheckRingHover(this, true); };
            checkSlot.onmouseleave = function() { handleCheckRingHover(this, false); };
        }
    }
    if (chkRing) {
        chkRing.classList.toggle('checked', task.done);
        chkRing.innerHTML = '<svg class="chk-ring-ico" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.15 12.35 10.95 16.05 17.1 8.2" stroke="currentColor" stroke-width="2.55" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    if (titleInput) {
        titleInput.classList.toggle('drawer-task-title--done', task.done);
    }

    // Update priority ring if needed
    updateDrawerPriorityUI(task.priority);

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

function togglePriorityDropdown(btn) {
    const dropdown = btn.closest('.drawer-priority-dropdown');
    const menu = dropdown.querySelector('.drawer-priority-menu');
    const isOpen = menu.classList.contains('open');

    // Close all other dropdowns
    document.querySelectorAll('.drawer-priority-menu.open').forEach(m => {
        if (m !== menu) m.classList.remove('open');
    });
    document.querySelectorAll('.drawer-priority-dropdown.is-open').forEach(d => {
        if (d !== dropdown) d.classList.remove('is-open');
    });

    menu.classList.toggle('open', !isOpen);
    dropdown.classList.toggle('is-open', !isOpen);
}

function setDrawerPriority(taskId, priority) {
    const task = findTaskById(taskId);
    if (!task) return;

    const nextPriority = priority === 'high' ? 'high' : 'normal';
    task.priority = nextPriority;
    persistTaskDetailChanges(task, { kanban: true });

    // Close dropdown
    document.querySelectorAll('.drawer-priority-menu.open').forEach(m => {
        m.classList.remove('open');
    });
    document.querySelectorAll('.drawer-priority-dropdown.is-open').forEach(d => {
        d.classList.remove('is-open');
    });

    // Update UI
    updateDrawerPriorityUI(nextPriority);
}

function getDrawerPriorityPreviewHTML(priority) {
    const isHigh = priority === 'high';
    const label = isHigh ? '\u9ad8\u4f18\u5148\u7ea7' : '\u65e0\u4f18\u5148\u7ea7';
    const flagClass = isHigh ? 'drawer-priority-preview-flag drawer-priority-preview-flag--high' : 'drawer-priority-preview-flag drawer-priority-preview-flag--normal';

    return `<span class="drawer-priority-btn-copy"><svg class="${flagClass}" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M6 21V5.5"/><path d="M6 5.5h10.5l-1.7 4 1.7 4H6"/></svg><span class="drawer-priority-btn-text"><span class="drawer-priority-btn-label">${label}</span></span></span><span class="drawer-priority-arrow-wrap" aria-hidden="true"><svg class="drawer-priority-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span>`;
}

function updateDrawerPriorityUI(priority) {
    const dropdown = document.querySelector('.drawer-priority-dropdown');
    if (!dropdown) return;

    const activePriority = priority === 'high' ? 'high' : 'normal';
    dropdown.dataset.priority = activePriority;

    const button = dropdown.querySelector('.drawer-priority-btn');
    const menu = dropdown.querySelector('.drawer-priority-menu');
    const options = menu.querySelectorAll('.drawer-priority-option');

    if (button) {
        button.innerHTML = getDrawerPriorityPreviewHTML(activePriority);
        button.classList.toggle('is-high', activePriority === 'high');
        button.classList.toggle('is-normal', activePriority === 'normal');
        button.setAttribute('title', activePriority === 'high' ? '\u5f53\u524d\uff1a\u9ad8\u4f18\u5148\u7ea7' : '\u5f53\u524d\uff1a\u65e0\u4f18\u5148\u7ea7');
        button.setAttribute('aria-label', activePriority === 'high' ? '\u5f53\u524d\u4e3a\u9ad8\u4f18\u5148\u7ea7\uff0c\u70b9\u51fb\u5207\u6362' : '\u5f53\u524d\u4e3a\u65e0\u4f18\u5148\u7ea7\uff0c\u70b9\u51fb\u5207\u6362');
    }

    // Update selected option
    options.forEach((opt, index) => {
        const optionPriority = index === 0 ? 'high' : 'normal';
        const selected = optionPriority === activePriority;
        opt.dataset.priority = optionPriority;
        opt.classList.toggle('selected', selected);
        opt.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });

    // Update check ring in title
    const checkSlot = document.querySelector('.task-ck-ring');
    if (checkSlot) {
        checkSlot.classList.toggle('task-ck-ring--prio-high', activePriority === 'high');
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

    // Update checkbox visual
    const subtaskRow = document.querySelector(`.subtask-row[data-subtask-id="${subtaskId}"]`);
    if (subtaskRow) {
        const checkSlot = subtaskRow.querySelector('.subtask-check');
        const chkRing = subtaskRow.querySelector('.chk-ring');
        const textSpan = subtaskRow.querySelector('.subtask-text');

        if (checkSlot) {
            checkSlot.classList.toggle('task-ck-ring--done', subtask.done);
            // Update hover handlers
            if (subtask.done) {
                checkSlot.onmouseenter = null;
                checkSlot.onmouseleave = null;
            } else {
                checkSlot.onmouseenter = function() { handleSubtaskCheckHover(this, true); };
                checkSlot.onmouseleave = function() { handleSubtaskCheckHover(this, false); };
            }
        }
        if (chkRing) {
            chkRing.classList.toggle('checked', subtask.done);
            chkRing.classList.remove('hover-check');
        }
        if (textSpan) {
            textSpan.classList.toggle('done', subtask.done);
        }
    }

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
    // 宸叉敼涓哄唴宓岃緭鍏ワ紝姝ゅ嚱鏁颁繚鐣欎絾涓嶅啀浣跨敤
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
        case 'high': return '\u9ad8';
        case 'medium': return '\u4e2d';
        case 'normal': return '\u6b63\u5e38';
        case 'low': return '\u4f4e';
        default: return '\u6b63\u5e38';
    }
}

function handleCheckRingHover(element, isEntering) {
    const chkRing = element.querySelector('.chk-ring');
    if (!chkRing) return;

    // Don't show checkmark if already done
    if (chkRing.classList.contains('checked')) return;

    if (isEntering) {
        chkRing.classList.add('hover-check');
    } else {
        chkRing.classList.remove('hover-check');
    }
}

function handleSubtaskCheckHover(element, isEntering) {
    const chkRing = element.querySelector('.chk-ring');
    if (!chkRing) return;

    // Don't show checkmark if already done
    if (chkRing.classList.contains('checked')) return;

    if (isEntering) {
        chkRing.classList.add('hover-check');
    } else {
        chkRing.classList.remove('hover-check');
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

function parseDrawerTimeToMinutes(value) {
    const normalized = String(value || '').trim();
    const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

    return hours * 60 + minutes;
}

function formatDrawerMinutesToTime(totalMinutes) {
    if (!Number.isFinite(totalMinutes)) return '';

    const normalized = ((Math.trunc(totalMinutes) % 1440) + 1440) % 1440;
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;

    return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
}

function getDrawerDurationMinutes(task) {
    const parsed = parseInt(task && task.duration, 10);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return parsed;
}

function clampDrawerDuration(minutes) {
    if (!Number.isFinite(minutes)) return 0;
    return Math.max(0, Math.min(1440, Math.trunc(minutes)));
}

function formatDrawerDurationText(minutes) {
    if (!Number.isFinite(minutes) || minutes < 0) return '';
    if (minutes === 0) return '\u0030 \u5206\u949f';

    const hours = Math.floor(minutes / 60);
    const restMinutes = minutes % 60;

    if (hours && restMinutes) {
        return hours + ' \u5c0f\u65f6 ' + restMinutes + ' \u5206\u949f';
    }
    if (hours) {
        return hours + ' \u5c0f\u65f6';
    }
    return restMinutes + ' \u5206\u949f';
}

function formatDrawerDurationBadgeText(minutes) {
    if (!Number.isFinite(minutes) || minutes < 0) return '\u5f85\u8bbe\u7f6e';
    if (minutes === 0) return '\u0030\u5206\u949f';

    const hours = Math.floor(minutes / 60);
    const restMinutes = minutes % 60;

    if (hours && restMinutes) {
        return hours + '\u5c0f\u65f6 ' + restMinutes + '\u5206\u949f';
    }
    if (hours) {
        return hours + '\u5c0f\u65f6';
    }
    return restMinutes + '\u5206\u949f';
}

function normalizeDrawerTimeTextInput(rawValue) {
    const trimmed = String(rawValue || '').trim().replace(/\uFF1A/g, ':');
    if (!trimmed) return '';

    let candidate = trimmed;

    if (/^\d{2}:?$/.test(trimmed)) {
        candidate = String(trimmed.replace(':', '')).padStart(2, '0') + ':00';
    } else if (/^\d{3,4}$/.test(trimmed)) {
        candidate = trimmed.length === 3
            ? ('0' + trimmed.charAt(0) + ':' + trimmed.slice(1))
            : (trimmed.slice(0, 2) + ':' + trimmed.slice(2));
    }

    const parsedMinutes = parseDrawerTimeToMinutes(candidate);
    if (parsedMinutes === null) return null;

    return formatDrawerMinutesToTime(parsedMinutes);
}

function formatDrawerTimeTypingValue(rawValue, caretPosition) {
    const normalized = String(rawValue || '').replace(/\uFF1A/g, ':');
    if (normalized.includes(':')) {
        const parts = normalized.split(':');
        const hours = (parts[0] || '').replace(/\D/g, '').slice(0, 2);
        const minutes = parts.slice(1).join('').replace(/\D/g, '').slice(0, 2);
        const value = hours || minutes ? hours + ':' + minutes : '';
        const shouldSelectMinutes = hours.length === 2 && typeof caretPosition === 'number' && caretPosition <= 2;
        return { value: value, selectMinutes: shouldSelectMinutes, isComplete: hours.length > 0 && minutes.length === 2 };
    }

    const digits = normalized.replace(/\D/g, '').slice(0, 4);
    if (!digits) return { value: '', selectMinutes: false, isComplete: false };
    if (digits.length === 1) {
        return { value: digits, selectMinutes: false, isComplete: false };
    }
    if (digits.length === 2) {
        return { value: digits + ':00', selectMinutes: true, isComplete: true };
    }
    if (digits.length === 3) {
        return { value: digits.slice(0, 2) + ':' + digits.slice(2), selectMinutes: false, isComplete: false };
    }
    return { value: digits.slice(0, 2) + ':' + digits.slice(2), selectMinutes: false, isComplete: true };
}

function updateDrawerScheduleLivePreview(taskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    const startInput = document.getElementById('drawer-start-time-input-' + taskId);
    const endInput = document.getElementById('drawer-end-time-input-' + taskId);
    const durationInput = document.getElementById('drawer-duration-input-' + taskId);
    const durationChip = document.querySelector('.drawer-schedule-duration-chip');
    const durationRow = document.querySelector('.drawer-schedule-duration-row');
    const durationSide = document.querySelector('.drawer-schedule-duration-side');
    if (!durationInput || !durationChip || !durationRow || !durationSide) return;

    const startTime = startInput ? normalizeDrawerTimeTextInput(startInput.value) : '';
    const endTime = endInput ? normalizeDrawerTimeTextInput(endInput.value) : '';
    const startMinutes = parseDrawerTimeToMinutes(startTime);
    const endMinutes = parseDrawerTimeToMinutes(endTime);

    let durationMinutes = getDrawerDurationMinutes(task);
    let spillsNextDay = false;

    if (startMinutes !== null && endMinutes !== null) {
        durationMinutes = endMinutes - startMinutes;
        if (durationMinutes < 0) {
            durationMinutes += 1440;
        }
        durationMinutes = clampDrawerDuration(durationMinutes);
        spillsNextDay = endMinutes < startMinutes || (startMinutes + durationMinutes) >= 1440;
    } else if (durationInput.value.trim() !== '') {
        const typedDuration = parseInt(durationInput.value.trim(), 10);
        if (Number.isFinite(typedDuration) && typedDuration >= 0) {
            durationMinutes = clampDrawerDuration(typedDuration);
        }
    } else if (startMinutes === null && endMinutes === null) {
        durationMinutes = 0;
    }

    const shouldDefaultToZero = startMinutes === null && endMinutes === null && durationMinutes === null;
    const resolvedDuration = shouldDefaultToZero ? 0 : durationMinutes;

    if (resolvedDuration === null) {
        if (document.activeElement !== durationInput) {
            durationInput.value = '';
        }
        durationChip.textContent = '\u5f85\u8bbe\u7f6e';
        durationChip.classList.remove('drawer-schedule-duration-chip--filled');
        durationChip.classList.add('drawer-schedule-duration-chip--idle');
    } else {
        if (document.activeElement !== durationInput || (startMinutes !== null && endMinutes !== null)) {
            durationInput.value = String(resolvedDuration);
        }
        durationChip.textContent = formatDrawerDurationBadgeText(resolvedDuration);
        durationChip.classList.remove('drawer-schedule-duration-chip--idle');
        durationChip.classList.add('drawer-schedule-duration-chip--filled');
    }

    durationRow.classList.toggle('drawer-schedule-duration-row--overnight', spillsNextDay);

    let note = durationSide.querySelector('.drawer-schedule-duration-note');
    if (spillsNextDay) {
        if (!note) {
            note = document.createElement('span');
            note.className = 'drawer-schedule-duration-note';
            durationSide.appendChild(note);
        }
        note.textContent = '\u6b21\u65e5\u7ed3\u675f';
    } else if (note) {
        note.remove();
    }
}

function handleDrawerTimeTyping(input, taskId) {
    if (!input) return;
    const previousValue = input.value;
    const previousSelectionStart = typeof input.selectionStart === 'number' ? input.selectionStart : null;
    const formatState = formatDrawerTimeTypingValue(input.value, previousSelectionStart);
    if (input.value !== formatState.value) {
        input.value = formatState.value;
        if (!formatState.selectMinutes && previousSelectionStart !== null && typeof input.setSelectionRange === 'function') {
            const lengthDiff = formatState.value.length - previousValue.length;
            const nextCaret = Math.max(0, Math.min(formatState.value.length, previousSelectionStart + lengthDiff));
            requestAnimationFrame(function() {
                input.setSelectionRange(nextCaret, nextCaret);
            });
        }
    }

    if (formatState.selectMinutes && typeof input.setSelectionRange === 'function') {
        requestAnimationFrame(function() {
            input.setSelectionRange(3, 5);
        });
    }

    if (taskId != null) {
        updateDrawerScheduleLivePreview(taskId);
    }
}

function getDrawerScheduleState(task) {
    const startTime = String(task && task.planTime || '').trim();
    const startMinutes = parseDrawerTimeToMinutes(startTime);
    const storedDurationMinutes = getDrawerDurationMinutes(task);
    const durationMinutes = storedDurationMinutes === null && !startTime ? 0 : storedDurationMinutes;

    if (startMinutes === null || storedDurationMinutes === null) {
        return {
            startTime: startTime,
            durationMinutes: durationMinutes,
            endTime: '',
            spillsNextDay: false
        };
    }

    const totalEndMinutes = startMinutes + durationMinutes;

    return {
        startTime: startTime,
        durationMinutes: durationMinutes,
        endTime: formatDrawerMinutesToTime(totalEndMinutes),
        spillsNextDay: totalEndMinutes >= 1440
    };
}

function getDrawerSchedulePrimaryText(state) {
    if (state.startTime && state.endTime) {
        return state.startTime + ' - ' + state.endTime;
    }
    if (state.startTime) {
        return '\u5f00\u59cb\u4e8e ' + state.startTime;
    }
    if (state.durationMinutes !== null) {
        return '\u9884\u8ba1 ' + formatDrawerDurationText(state.durationMinutes);
    }
    return '\u5b89\u6392\u4eca\u5929\u7684\u8282\u594f';
}

function getDrawerScheduleSecondaryText(state) {
    if (state.startTime && state.endTime) {
        return '\u9884\u8ba1\u8017\u65f6 ' + formatDrawerDurationText(state.durationMinutes) + (state.spillsNextDay ? ' \u00b7 \u6b21\u65e5\u7ed3\u675f' : '');
    }
    if (state.startTime) {
        return '\u8bbe\u7f6e\u7ed3\u675f\u65f6\u95f4\u6216\u9884\u8ba1\u8017\u65f6\u540e\u4f1a\u81ea\u52a8\u540c\u6b65';
    }
    if (state.durationMinutes !== null) {
        return '\u8865\u5145\u5f00\u59cb\u65f6\u95f4\u540e\u4f1a\u81ea\u52a8\u63a8\u7b97\u7ed3\u675f\u65f6\u95f4';
    }
    return '\u5f00\u59cb\u65f6\u95f4\u3001\u7ed3\u675f\u65f6\u95f4\u4e0e\u9884\u8ba1\u8017\u65f6\u4f1a\u81ea\u52a8\u8054\u52a8';
}

function getDrawerScheduleBadgeText(state) {
    if (state.spillsNextDay) return '\u6b21\u65e5\u7ed3\u675f';
    if (state.durationMinutes !== null) return '\u81ea\u52a8\u8054\u52a8';
    return '\u5f85\u5b89\u6392';
}

function openTimePickerInDrawer(taskId) {
    // 宸叉敼涓哄唴宓岃緭鍏ワ紝姝ゅ嚱鏁颁繚鐣欎絾涓嶅啀浣跨敤
}

function saveDrawerStartTime(taskId) {
    const input = document.getElementById('drawer-start-time-input-' + taskId) || document.getElementById('drawer-time-input-' + taskId);
    if (!input) return;

    const task = findTaskById(taskId);
    if (!task) return;

    const newTime = normalizeDrawerTimeTextInput(input.value);
    if (newTime === null) {
        toast('\u8bf7\u8f93\u5165\u6b63\u786e\u7684\u65f6\u95f4\uff0c\u4f8b\u5982 09:30');
        syncTaskDetailPanel();
        return;
    }

    input.value = newTime;
    if (newTime !== (task.planTime || '')) {
        task.planTime = newTime;
        persistTaskDetailChanges(task, { kanban: true });
    }
}

function saveDrawerTime(taskId) {
    saveDrawerStartTime(taskId);
}

function openPriorityPickerInDrawer(taskId) {
    // 宸叉敼涓哄唴宓岃緭鍏ワ紝姝ゅ嚱鏁颁繚鐣欎絾涓嶅啀浣跨敤
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
    // 宸叉敼涓哄唴宓岃緭鍏ワ紝姝ゅ嚱鏁颁繚鐣欎絾涓嶅啀浣跨敤
}

function saveDrawerDuration(taskId) {
    const input = document.getElementById('drawer-duration-input-' + taskId);
    if (!input) return;

    const task = findTaskById(taskId);
    if (!task) return;

    const rawValue = input.value.trim();

    if (rawValue === '') {
        if (getDrawerDurationMinutes(task) !== null) {
            task.duration = undefined;
            persistTaskDetailChanges(task, { kanban: true });
        } else {
            syncTaskDetailPanel();
        }
        return;
    }

    const parsedDuration = parseInt(rawValue, 10);
    if (!Number.isFinite(parsedDuration) || parsedDuration < 0) {
        syncTaskDetailPanel();
        return;
    }

    const nextDuration = clampDrawerDuration(parsedDuration);
    if (getDrawerDurationMinutes(task) !== nextDuration) {
        task.duration = nextDuration;
        persistTaskDetailChanges(task, { kanban: true });
    } else if (String(nextDuration) !== rawValue) {
        input.value = String(nextDuration);
    }
}

function saveDrawerEndTime(taskId) {
    const input = document.getElementById('drawer-end-time-input-' + taskId);
    if (!input) return;

    const task = findTaskById(taskId);
    if (!task) return;

    const nextEndTime = normalizeDrawerTimeTextInput(input.value);
    if (nextEndTime === null) {
        toast('\u8bf7\u8f93\u5165\u6b63\u786e\u7684\u65f6\u95f4\uff0c\u4f8b\u5982 15:30');
        syncTaskDetailPanel();
        return;
    }

    input.value = nextEndTime;
    if (!nextEndTime) {
        if (getDrawerDurationMinutes(task) !== null) {
            task.duration = undefined;
            persistTaskDetailChanges(task, { kanban: true });
        } else {
            syncTaskDetailPanel();
        }
        return;
    }

    const startMinutes = parseDrawerTimeToMinutes(task.planTime || '');
    if (startMinutes === null) {
        toast('\u8bf7\u5148\u8bbe\u7f6e\u5f00\u59cb\u65f6\u95f4');
        syncTaskDetailPanel();
        return;
    }

    const endMinutes = parseDrawerTimeToMinutes(nextEndTime);
    if (endMinutes === null) return;

    let durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 0) {
        durationMinutes += 1440;
    }

    durationMinutes = clampDrawerDuration(durationMinutes);

    if (getDrawerDurationMinutes(task) !== durationMinutes) {
        task.duration = durationMinutes;
        persistTaskDetailChanges(task, { kanban: true });
    } else {
        syncTaskDetailPanel();
    }
}

function openRepeatInDrawer(taskId) {
    if (typeof openCustomRepeatModal === 'function') {
        openCustomRepeatModal(taskId);
        return;
    }
    toast('\u91cd\u590d\u89c4\u5219\u529f\u80fd\u6682\u4e0d\u53ef\u7528');
}

function toggleFreezeInDrawer(taskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    task.frozen = !task.frozen;
    persistTaskDetailChanges(task, { kanban: true });
    toast(task.frozen ? '\u4efb\u52a1\u5df2\u51bb\u7ed3' : '\u4efb\u52a1\u5df2\u89e3\u51bb');
}

function deleteTaskInDrawer(taskId) {
    if (confirm('\u786e\u5b9a\u8981\u5220\u9664\u8fd9\u4e2a\u4efb\u52a1\u5417\uff1f')) {
        del(taskId);
        closeTaskDetail();
    }
}

window.openTaskDrawer = openTaskDrawer;
window.openTaskDetail = openTaskDrawer;
window.closeDrawer = closeDrawer;
window.closeTaskDetail = closeTaskDetail;
window.syncTaskDetailPanel = syncTaskDetailPanel;

// Close priority dropdown when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.drawer-priority-dropdown')) {
        document.querySelectorAll('.drawer-priority-menu.open').forEach(m => {
            m.classList.remove('open');
        });
        document.querySelectorAll('.drawer-priority-dropdown.is-open').forEach(d => {
            d.classList.remove('is-open');
        });
    }
});
