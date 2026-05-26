/**
 * Local task detail panel rendered inside the middle task column.
 */

let drawerActiveTaskId = null;
let drawerExpandedSubtasks = new Set();
let taskDetailRenderPatched = false;
let taskDetailCloseTimer = null;
let drawerScrollbarResizeObserver = null;
let drawerScrollbarRaf = null;
let drawerScrollbarDragState = null;
let mainTaskScrollbarResizeObserver = null;
let mainTaskScrollbarRaf = null;
let mainTaskScrollbarDragState = null;
let drawerTitleCompletionAnimTaskId = null;
let drawerTitleCompletionAnimTimer = null;
let drawerTitleCompletionAnimFrame = null;
let drawerSubtaskDragState = null;
const TASK_DETAIL_CLOSE_DELAY = 460;
const DRAWER_TITLE_COMPLETION_ANIM_MS = 720;

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
    initDrawerScrollbar();
    initMainTaskScrollbar();
}

function patchTaskRenderSync() {
    if (taskDetailRenderPatched || typeof window.rT !== 'function') return;

    const originalRenderTasks = window.rT;
    window.rT = function() {
        const result = originalRenderTasks.apply(this, arguments);
        enhanceTaskRowInteractions();
        syncTaskDetailPanel();
        scheduleMainTaskScrollbarSync();
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

function ensureDrawerScrollbarElements() {
    const refs = getTaskDetailRefs();
    if (!refs.panel || !refs.content) return null;

    const inner = refs.panel.querySelector('.task-detail-inner');
    if (!inner) return null;

    let rail = inner.querySelector('.drawer-scrollbar');
    if (!rail) {
        rail = document.createElement('div');
        rail.className = 'drawer-scrollbar';
        rail.setAttribute('aria-hidden', 'true');

        const thumb = document.createElement('div');
        thumb.className = 'drawer-scrollbar-thumb';
        rail.appendChild(thumb);
        rail.addEventListener('pointerdown', handleDrawerScrollbarPointerDown);
        inner.appendChild(rail);
    }

    return {
        panel: refs.panel,
        content: refs.content,
        inner: inner,
        rail: rail,
        thumb: rail.querySelector('.drawer-scrollbar-thumb')
    };
}

function initDrawerScrollbar() {
    const refs = ensureDrawerScrollbarElements();
    if (!refs) return;

    if (!refs.content.dataset.drawerScrollbarBound) {
        refs.content.addEventListener('scroll', scheduleDrawerScrollbarSync, { passive: true });
        refs.content.dataset.drawerScrollbarBound = 'true';
    }

    if (!window.__drawerScrollbarResizeBound) {
        window.addEventListener('resize', scheduleDrawerScrollbarSync);
        document.addEventListener('pointerup', scheduleDrawerScrollbarSync, true);
        window.__drawerScrollbarResizeBound = true;
    }

    if (typeof ResizeObserver === 'function' && !drawerScrollbarResizeObserver) {
        drawerScrollbarResizeObserver = new ResizeObserver(function() {
            scheduleDrawerScrollbarSync();
        });
        drawerScrollbarResizeObserver.observe(refs.content);
        drawerScrollbarResizeObserver.observe(refs.inner);
    }

    scheduleDrawerScrollbarSync();
}

function scheduleDrawerScrollbarSync() {
    if (drawerScrollbarRaf !== null) return;

    drawerScrollbarRaf = window.requestAnimationFrame(function() {
        drawerScrollbarRaf = null;
        syncDrawerScrollbar();
    });
}

function syncDrawerScrollbar() {
    const refs = ensureDrawerScrollbarElements();
    if (!refs || !refs.rail || !refs.thumb) return;

    const viewportHeight = refs.content.clientHeight;
    const scrollHeight = refs.content.scrollHeight;
    const maxScroll = Math.max(0, scrollHeight - viewportHeight);
    const isOpen = refs.panel.classList.contains('task-detail-panel--open');
    const isScrollable = isOpen && maxScroll > 1;
    const footer = refs.content.querySelector('.drawer-footer');
    const footerStyle = footer ? window.getComputedStyle(footer) : null;
    const hasStickyFooter = footerStyle && (footerStyle.position === 'sticky' || footerStyle.position === '-webkit-sticky');
    const footerClearance = hasStickyFooter ? Math.ceil(footer.getBoundingClientRect().height) + 8 : 0;
    const railInset = 6;
    const railHeight = Math.max(0, viewportHeight - railInset * 2 - footerClearance);
    const canShowScrollbar = isScrollable && railHeight > 0;

    refs.rail.style.top = (refs.content.offsetTop + railInset) + 'px';
    refs.rail.style.height = railHeight + 'px';
    refs.rail.classList.toggle('is-visible', canShowScrollbar);

    if (!canShowScrollbar) {
        refs.thumb.style.height = '0px';
        refs.thumb.style.transform = 'translateY(0)';
        return;
    }

    const thumbHeight = Math.min(railHeight, Math.max(40, Math.round((viewportHeight / scrollHeight) * railHeight)));
    const maxThumbTravel = Math.max(0, railHeight - thumbHeight);
    const thumbTop = maxScroll > 0
        ? Math.round((refs.content.scrollTop / maxScroll) * maxThumbTravel)
        : 0;

    refs.thumb.style.height = thumbHeight + 'px';
    refs.thumb.style.transform = 'translateY(' + thumbTop + 'px)';
}

function handleDrawerScrollbarPointerDown(event) {
    const refs = ensureDrawerScrollbarElements();
    if (!refs || !refs.rail || !refs.thumb) return;

    const maxScroll = refs.content.scrollHeight - refs.content.clientHeight;
    if (maxScroll <= 0) return;

    const railRect = refs.rail.getBoundingClientRect();
    const thumbRect = refs.thumb.getBoundingClientRect();
    const maxThumbTravel = Math.max(0, railRect.height - thumbRect.height);

    event.preventDefault();
    event.stopPropagation();

    if (event.target.closest('.drawer-scrollbar-thumb')) {
        drawerScrollbarDragState = {
            pointerId: event.pointerId,
            startY: event.clientY,
            startScrollTop: refs.content.scrollTop,
            maxScroll: maxScroll,
            maxThumbTravel: maxThumbTravel,
            content: refs.content
        };

        refs.rail.classList.add('is-dragging');
        refs.thumb.classList.add('is-dragging');

        window.addEventListener('pointermove', handleDrawerScrollbarPointerMove);
        window.addEventListener('pointerup', handleDrawerScrollbarPointerUp);
        window.addEventListener('pointercancel', handleDrawerScrollbarPointerUp);
        return;
    }

    const clickThumbTop = Math.max(0, Math.min(maxThumbTravel, event.clientY - railRect.top - (thumbRect.height / 2)));
    refs.content.scrollTop = maxThumbTravel > 0
        ? (clickThumbTop / maxThumbTravel) * maxScroll
        : 0;
    scheduleDrawerScrollbarSync();
}

function handleDrawerScrollbarPointerMove(event) {
    if (!drawerScrollbarDragState) return;
    if (event.pointerId !== drawerScrollbarDragState.pointerId) return;

    event.preventDefault();

    const deltaY = event.clientY - drawerScrollbarDragState.startY;
    const scrollDelta = drawerScrollbarDragState.maxThumbTravel > 0
        ? (deltaY / drawerScrollbarDragState.maxThumbTravel) * drawerScrollbarDragState.maxScroll
        : 0;

    drawerScrollbarDragState.content.scrollTop = drawerScrollbarDragState.startScrollTop + scrollDelta;
    scheduleDrawerScrollbarSync();
}

function handleDrawerScrollbarPointerUp(event) {
    if (!drawerScrollbarDragState) return;
    if (event.pointerId !== drawerScrollbarDragState.pointerId) return;

    drawerScrollbarDragState = null;
    window.removeEventListener('pointermove', handleDrawerScrollbarPointerMove);
    window.removeEventListener('pointerup', handleDrawerScrollbarPointerUp);
    window.removeEventListener('pointercancel', handleDrawerScrollbarPointerUp);

    const refs = ensureDrawerScrollbarElements();
    if (refs && refs.rail && refs.thumb) {
        refs.rail.classList.remove('is-dragging');
        refs.thumb.classList.remove('is-dragging');
    }

    scheduleDrawerScrollbarSync();
}

function getMainTaskScrollRefs() {
    const taskMode = document.getElementById('taskMode');
    const panel = taskMode
        ? taskMode.querySelector('.task-main-col > .task-card > .list-panel')
            || taskMode.querySelector('.list-panel')
        : null;
    const content = panel ? panel.querySelector('.tasks') : null;

    return {
        taskMode: taskMode,
        panel: panel,
        content: content
    };
}

function ensureMainTaskScrollbarElements() {
    const refs = getMainTaskScrollRefs();
    if (!refs.panel || !refs.content) return null;

    refs.panel.classList.add('task-main-scroll-host');

    let rail = refs.panel.querySelector('.task-main-scrollbar');
    if (!rail) {
        rail = document.createElement('div');
        rail.className = 'drawer-scrollbar task-main-scrollbar';
        rail.setAttribute('aria-hidden', 'true');

        const thumb = document.createElement('div');
        thumb.className = 'drawer-scrollbar-thumb task-main-scrollbar-thumb';
        rail.appendChild(thumb);
        rail.addEventListener('pointerdown', handleMainTaskScrollbarPointerDown);
        refs.panel.appendChild(rail);
    }

    return {
        taskMode: refs.taskMode,
        panel: refs.panel,
        content: refs.content,
        rail: rail,
        thumb: rail.querySelector('.task-main-scrollbar-thumb')
    };
}

function initMainTaskScrollbar() {
    const refs = ensureMainTaskScrollbarElements();
    if (!refs) return;

    if (!refs.content.dataset.mainTaskScrollbarBound) {
        refs.content.addEventListener('scroll', scheduleMainTaskScrollbarSync, { passive: true });
        refs.content.dataset.mainTaskScrollbarBound = 'true';
    }

    if (!window.__mainTaskScrollbarResizeBound) {
        window.addEventListener('resize', scheduleMainTaskScrollbarSync);
        document.addEventListener('pointerup', scheduleMainTaskScrollbarSync, true);
        window.__mainTaskScrollbarResizeBound = true;
    }

    if (typeof ResizeObserver === 'function') {
        if (!mainTaskScrollbarResizeObserver) {
            mainTaskScrollbarResizeObserver = new ResizeObserver(function() {
                scheduleMainTaskScrollbarSync();
            });
        }
        mainTaskScrollbarResizeObserver.disconnect();
        mainTaskScrollbarResizeObserver.observe(refs.content);
        mainTaskScrollbarResizeObserver.observe(refs.panel);
    }

    scheduleMainTaskScrollbarSync();
}

function scheduleMainTaskScrollbarSync() {
    if (mainTaskScrollbarRaf !== null) return;

    mainTaskScrollbarRaf = window.requestAnimationFrame(function() {
        mainTaskScrollbarRaf = null;
        syncMainTaskScrollbar();
    });
}

function syncMainTaskScrollbar() {
    const refs = ensureMainTaskScrollbarElements();
    if (!refs || !refs.rail || !refs.thumb) return;

    const viewportHeight = refs.content.clientHeight;
    const scrollHeight = refs.content.scrollHeight;
    const maxScroll = Math.max(0, scrollHeight - viewportHeight);
    const taskModeVisible = refs.taskMode && !refs.taskMode.classList.contains('hidden');
    const isScrollable = taskModeVisible && maxScroll > 1;
    const railInset = 6;
    const railHeight = Math.max(0, viewportHeight - railInset * 2);
    const canShowScrollbar = isScrollable && railHeight > 0;

    refs.rail.style.top = (refs.content.offsetTop + railInset) + 'px';
    refs.rail.style.left = 'auto';
    refs.rail.style.right = '7px';
    refs.rail.style.height = railHeight + 'px';
    refs.rail.classList.toggle('is-visible', canShowScrollbar);

    if (!canShowScrollbar) {
        refs.thumb.style.height = '0px';
        refs.thumb.style.transform = 'translateY(0)';
        return;
    }

    const thumbHeight = Math.min(railHeight, Math.max(40, Math.round((viewportHeight / scrollHeight) * railHeight)));
    const maxThumbTravel = Math.max(0, railHeight - thumbHeight);
    const thumbTop = maxScroll > 0
        ? Math.round((refs.content.scrollTop / maxScroll) * maxThumbTravel)
        : 0;

    refs.thumb.style.height = thumbHeight + 'px';
    refs.thumb.style.transform = 'translateY(' + thumbTop + 'px)';
}

function handleMainTaskScrollbarPointerDown(event) {
    const refs = ensureMainTaskScrollbarElements();
    if (!refs || !refs.rail || !refs.thumb) return;

    const maxScroll = refs.content.scrollHeight - refs.content.clientHeight;
    if (maxScroll <= 0) return;

    const railRect = refs.rail.getBoundingClientRect();
    const thumbRect = refs.thumb.getBoundingClientRect();
    const maxThumbTravel = Math.max(0, railRect.height - thumbRect.height);

    event.preventDefault();
    event.stopPropagation();

    if (event.target.closest('.task-main-scrollbar-thumb')) {
        mainTaskScrollbarDragState = {
            pointerId: event.pointerId,
            startY: event.clientY,
            startScrollTop: refs.content.scrollTop,
            maxScroll: maxScroll,
            maxThumbTravel: maxThumbTravel,
            content: refs.content
        };

        refs.rail.classList.add('is-dragging');
        refs.thumb.classList.add('is-dragging');

        window.addEventListener('pointermove', handleMainTaskScrollbarPointerMove);
        window.addEventListener('pointerup', handleMainTaskScrollbarPointerUp);
        window.addEventListener('pointercancel', handleMainTaskScrollbarPointerUp);
        return;
    }

    const clickThumbTop = Math.max(0, Math.min(maxThumbTravel, event.clientY - railRect.top - (thumbRect.height / 2)));
    refs.content.scrollTop = maxThumbTravel > 0
        ? (clickThumbTop / maxThumbTravel) * maxScroll
        : 0;
    scheduleMainTaskScrollbarSync();
}

function handleMainTaskScrollbarPointerMove(event) {
    if (!mainTaskScrollbarDragState) return;
    if (event.pointerId !== mainTaskScrollbarDragState.pointerId) return;

    event.preventDefault();

    const deltaY = event.clientY - mainTaskScrollbarDragState.startY;
    const scrollDelta = mainTaskScrollbarDragState.maxThumbTravel > 0
        ? (deltaY / mainTaskScrollbarDragState.maxThumbTravel) * mainTaskScrollbarDragState.maxScroll
        : 0;

    mainTaskScrollbarDragState.content.scrollTop = mainTaskScrollbarDragState.startScrollTop + scrollDelta;
    scheduleMainTaskScrollbarSync();
}

function handleMainTaskScrollbarPointerUp(event) {
    if (!mainTaskScrollbarDragState) return;
    if (event.pointerId !== mainTaskScrollbarDragState.pointerId) return;

    mainTaskScrollbarDragState = null;
    window.removeEventListener('pointermove', handleMainTaskScrollbarPointerMove);
    window.removeEventListener('pointerup', handleMainTaskScrollbarPointerUp);
    window.removeEventListener('pointercancel', handleMainTaskScrollbarPointerUp);

    const refs = ensureMainTaskScrollbarElements();
    if (refs && refs.rail && refs.thumb) {
        refs.rail.classList.remove('is-dragging');
        refs.thumb.classList.remove('is-dragging');
    }

    scheduleMainTaskScrollbarSync();
}

function setTaskDetailOpenState(isOpen) {
    const refs = getTaskDetailRefs();
    if (refs.panel) {
        refs.panel.classList.toggle('task-detail-panel--open', isOpen);
    }
    if (refs.mainCol) {
        refs.mainCol.classList.toggle('task-main-col--detail-open', isOpen);
    }
    scheduleMainTaskScrollbarSync();
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

        const taskId = item.getAttribute('data-id');

        const checkSlot = taskId && item.querySelector('.task-ck-slot');
        if (checkSlot && !checkSlot._detailGapClickBound) {
            checkSlot._detailGapClickBound = true;
            checkSlot.addEventListener('click', function(e) {
                if (typeof onTaskCheckSlotClick === 'function') {
                    onTaskCheckSlotClick(e, Number(taskId));
                }
            });
        }

        if (item.classList.contains('archived-item')) return;

        const actions = item.querySelector('.task-actions');
        const moreWrap = actions && actions.querySelector('.task-more-wrap');
        if (!actions || !moreWrap || !taskId) return;


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
    scheduleDrawerScrollbarSync();
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
    scheduleDrawerScrollbarSync();

    taskDetailCloseTimer = window.setTimeout(function() {
        if (drawerActiveTaskId !== null) return;
        refs.content.classList.remove('fade-in', 'fade-out');
        refs.content.innerHTML = '';
        refs.content.scrollTop = 0;
        taskDetailCloseTimer = null;
        scheduleDrawerScrollbarSync();
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
    scheduleDrawerScrollbarSync();
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
    return taskPendingDoneInDrawer(task);
}

function taskPendingDoneInDrawer(task) {
    if (!task) return false;
    if (typeof _togVisualPendingIds !== 'undefined' && _togVisualPendingIds && typeof _togVisualPendingIds.has === 'function') {
        return _togVisualPendingIds.has(task.id);
    }
    return false;
}

function getDrawerCheckRingColor(priority) {
    return priority === 'high'
        ? ((typeof prioColor === 'function' ? prioColor('high') : '#ef4444') || '#ef4444')
        : '#94a3b8';
}

function getDrawerPhosphorIcon(name, extraClass) {
    return `<i class="ph ph-${name}${extraClass ? ' ' + extraClass : ''}" aria-hidden="true"></i>`;
}

function getDrawerPriorityFlagIcon(extraClass) {
    if (typeof priorityFlagIconHtml === 'function') {
        return priorityFlagIconHtml(extraClass);
    }
    return `<i class="ph-fill ph-flag${extraClass ? ' ' + extraClass : ''}" aria-hidden="true"></i>`;
}

function getDrawerCheckIconMarkup() {
    return getDrawerPhosphorIcon('check', 'chk-ring-ico');
}

function getDrawerTitleCheckIconMarkup() {
    return '<svg class="chk-ring-ico" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.15 12.35 10.95 16.05 17.1 8.2" stroke="currentColor" stroke-width="2.55" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function normalizeDrawerTaskId(taskId) {
    const numericTaskId = Number(taskId);
    return Number.isFinite(numericTaskId) ? numericTaskId : taskId;
}

function drawerTaskIdsMatch(a, b) {
    return String(a) === String(b);
}

function getDrawerTitleElement(taskId) {
    const titleEl = document.querySelector('.drawer-task-title');
    if (!titleEl || !titleEl.dataset) return null;
    return drawerTaskIdsMatch(titleEl.dataset.taskId, taskId) ? titleEl : null;
}

function isDrawerTitleCompletionAnimationActive(taskId) {
    return drawerTitleCompletionAnimTaskId !== null
        && drawerTaskIdsMatch(drawerTitleCompletionAnimTaskId, taskId);
}

function cancelDrawerTitleAnimationFrame() {
    if (drawerTitleCompletionAnimFrame !== null) {
        window.cancelAnimationFrame(drawerTitleCompletionAnimFrame);
        drawerTitleCompletionAnimFrame = null;
    }
}

function syncDrawerTitleStrikeMetrics(titleEl, task) {
    if (!titleEl) return;

    const field = titleEl.querySelector('.drawer-task-title-field');
    const titleInput = titleEl.querySelector('.drawer-task-title-text');
    if (!field) return;

    const text = (task && task.text) || (titleInput && titleInput.value) || '';
    let strikeWidth = 0;

    if (text) {
        const measure = document.createElement('span');
        const inputStyle = titleInput ? window.getComputedStyle(titleInput) : window.getComputedStyle(field);

        measure.textContent = text;
        measure.style.position = 'fixed';
        measure.style.left = '-9999px';
        measure.style.top = '-9999px';
        measure.style.visibility = 'hidden';
        measure.style.whiteSpace = 'pre';
        measure.style.font = inputStyle.font;
        measure.style.fontSize = inputStyle.fontSize;
        measure.style.fontWeight = inputStyle.fontWeight;
        measure.style.fontFamily = inputStyle.fontFamily;
        measure.style.letterSpacing = inputStyle.letterSpacing;
        measure.style.lineHeight = inputStyle.lineHeight;

        document.body.appendChild(measure);
        strikeWidth = Math.ceil(measure.getBoundingClientRect().width);
        measure.remove();
    }

    const fieldWidth = Math.max(0, field.getBoundingClientRect().width - 12);
    titleEl.style.setProperty('--drawer-title-strike-width', Math.max(0, Math.min(strikeWidth, fieldWidth)) + 'px');
}

function restartDrawerTitleStrikeAnimation(taskId) {
    const normalizedTaskId = normalizeDrawerTaskId(taskId);

    cancelDrawerTitleAnimationFrame();

    drawerTitleCompletionAnimFrame = window.requestAnimationFrame(function() {
        drawerTitleCompletionAnimFrame = null;

        const titleEl = getDrawerTitleElement(normalizedTaskId);
        const task = findTaskById(normalizedTaskId);
        if (!titleEl || !task || !isDrawerTitleCompletionAnimationActive(normalizedTaskId)) return;

        syncDrawerTitleStrikeMetrics(titleEl, task);
        titleEl.classList.remove('drawer-task-title--toggle-anim');
        titleEl.classList.add('drawer-task-title--strike-reset');
        void titleEl.offsetWidth;

        drawerTitleCompletionAnimFrame = window.requestAnimationFrame(function() {
            drawerTitleCompletionAnimFrame = null;

            const currentTitleEl = getDrawerTitleElement(normalizedTaskId);
            if (!currentTitleEl || !isDrawerTitleCompletionAnimationActive(normalizedTaskId)) return;

            syncDrawerTitleStrikeMetrics(currentTitleEl, task);
            currentTitleEl.classList.remove('drawer-task-title--toggle-anim', 'drawer-task-title--strike-reset');
            void currentTitleEl.offsetWidth;
            currentTitleEl.classList.add('drawer-task-title--toggle-anim');
        });
    });
}

function startDrawerTitleCompletionAnimation(taskId) {
    const normalizedTaskId = normalizeDrawerTaskId(taskId);
    drawerTitleCompletionAnimTaskId = normalizedTaskId;

    if (drawerTitleCompletionAnimTimer !== null) {
        window.clearTimeout(drawerTitleCompletionAnimTimer);
        drawerTitleCompletionAnimTimer = null;
    }

    const titleEl = getDrawerTitleElement(normalizedTaskId);
    if (titleEl) {
        const task = findTaskById(normalizedTaskId);
        syncDrawerTitleStrikeMetrics(titleEl, task);
        titleEl.classList.remove('drawer-task-title--toggle-anim');
        titleEl.classList.add('drawer-task-title--strike-reset');
    }

    restartDrawerTitleStrikeAnimation(normalizedTaskId);

    drawerTitleCompletionAnimTimer = window.setTimeout(function() {
        if (isDrawerTitleCompletionAnimationActive(normalizedTaskId)) {
            drawerTitleCompletionAnimTaskId = null;
        }

        const currentTitleEl = getDrawerTitleElement(normalizedTaskId);
        if (currentTitleEl) {
            currentTitleEl.classList.remove('drawer-task-title--toggle-anim', 'drawer-task-title--strike-reset');
        }

        drawerTitleCompletionAnimTimer = null;
    }, DRAWER_TITLE_COMPLETION_ANIM_MS);
}

function clearDrawerTitleCompletionAnimation(taskId) {
    const shouldClear = taskId == null || isDrawerTitleCompletionAnimationActive(taskId);
    if (!shouldClear) return;

    cancelDrawerTitleAnimationFrame();

    const normalizedTaskId = taskId == null
        ? drawerTitleCompletionAnimTaskId
        : normalizeDrawerTaskId(taskId);

    if (drawerTitleCompletionAnimTimer !== null) {
        window.clearTimeout(drawerTitleCompletionAnimTimer);
        drawerTitleCompletionAnimTimer = null;
    }

    drawerTitleCompletionAnimTaskId = null;

    const titleEl = normalizedTaskId != null
        ? getDrawerTitleElement(normalizedTaskId)
        : document.querySelector('.drawer-task-title');
    if (titleEl) {
        titleEl.classList.remove('drawer-task-title--toggle-anim', 'drawer-task-title--strike-reset');
    }
}

function updateDrawerTitleCompletionState(task, options) {
    if (!task) return false;

    const titleEl = getDrawerTitleElement(task.id);
    if (!titleEl) return false;

    const isDone = taskAppearsDoneInDrawer(task);
    const isPendingDone = taskPendingDoneInDrawer(task);
    let animationActive = isDrawerTitleCompletionAnimationActive(task.id);

    if (isDone && isPendingDone && !animationActive) {
        startDrawerTitleCompletionAnimation(task.id);
        animationActive = true;
    }

    syncDrawerTitleStrikeMetrics(titleEl, task);

    titleEl.classList.toggle('drawer-task-title--done', isDone);
    titleEl.dataset.taskState = isDone ? 'done' : 'todo';

    if (!isDone) {
        titleEl.classList.remove('drawer-task-title--toggle-anim', 'drawer-task-title--strike-reset');
    } else if (animationActive) {
        if (!titleEl.classList.contains('drawer-task-title--toggle-anim')) {
            titleEl.classList.add('drawer-task-title--strike-reset');
        }
    } else {
        titleEl.classList.remove('drawer-task-title--toggle-anim', 'drawer-task-title--strike-reset');
    }

    const checkSlot = titleEl.querySelector('.task-ck-ring.task-ck-slot');
    const chkRing = titleEl.querySelector('.chk-ring');
    const titleInput = titleEl.querySelector('.drawer-task-title-text');
    const normalizedPriority = task.priority === 'high' ? 'high' : 'normal';
    const ringRipple = isDone && (
        isPendingDone
        || isDrawerTitleCompletionAnimationActive(task.id)
        || (window._chkRippleTaskId != null && window._chkRippleTaskId == task.id)
        || (options && options.forceRipple)
    );

    if (checkSlot) {
        checkSlot.classList.toggle('task-ck-ring--prio-high', normalizedPriority === 'high');
        checkSlot.classList.toggle('task-ck-ring--done', isDone);
        checkSlot.style.setProperty('--ck-prio', getDrawerCheckRingColor(normalizedPriority));
        checkSlot.setAttribute('aria-pressed', isDone ? 'true' : 'false');
        checkSlot.setAttribute('title', isDone ? '\u6807\u8bb0\u4e3a\u672a\u5b8c\u6210' : '\u6807\u8bb0\u4e3a\u5df2\u5b8c\u6210');
    }

    if (chkRing) {
        chkRing.classList.toggle('checked', isDone);
        chkRing.classList.toggle('chk-ring--ripple', ringRipple);
        if (!isDone) {
            chkRing.classList.remove('hover-check');
        }
        chkRing.innerHTML = getDrawerTitleCheckIconMarkup();
    }

    if (titleInput) {
        titleInput.classList.toggle('drawer-task-title-text--done', isDone);
        if (document.activeElement !== titleInput && titleInput.value !== (task.text || '')) {
            titleInput.value = task.text || '';
        }
    }

    return true;
}

function syncTaskDetailDoneState(taskId) {
    const normalizedTaskId = normalizeDrawerTaskId(taskId);
    if (drawerActiveTaskId == null || !drawerTaskIdsMatch(drawerActiveTaskId, normalizedTaskId)) {
        return false;
    }

    const refs = getTaskDetailRefs();
    if (!refs.panel || !refs.content || !refs.mainCol) return false;

    const taskModeVisible = refs.taskMode && !refs.taskMode.classList.contains('hidden');
    const task = findTaskById(normalizedTaskId);
    if (!taskModeVisible || !task || !isTaskVisibleInCurrentDate(normalizedTaskId)) {
        closeTaskDetail();
        return true;
    }

    setTaskDetailOpenState(true);
    clearPendingTaskDetailClose(refs.content);

    if (!updateDrawerTitleCompletionState(task)) {
        renderDrawerContent(task);
    }

    refs.content.classList.remove('fade-out');
    refs.content.classList.add('fade-in');
    syncTaskDetailSelectionState();
    scheduleDrawerScrollbarSync();
    return true;
}

function renderDrawerFooter(task) {
    const refs = getTaskDetailRefs();
    if (!refs.panel || !refs.content) return;

    const inner = refs.panel.querySelector('.task-detail-inner');
    if (!inner) return;

    let footer = document.getElementById('taskDetailFooter');
    if (!footer || !inner.contains(footer)) {
        footer = document.createElement('div');
        footer.id = 'taskDetailFooter';
        refs.content.insertAdjacentElement('afterend', footer);
    }

    footer.className = 'drawer-footer';
    footer.innerHTML = `
        <button class="drawer-footer-btn drawer-footer-btn--repeat" onclick="event.stopPropagation();openRepeatInDrawer(${task.id})">
            ${getDrawerPhosphorIcon('arrows-clockwise')}
            \u91cd\u590d
        </button>
        <button class="drawer-footer-btn drawer-footer-btn--freeze" onclick="event.stopPropagation();toggleFreezeInDrawer(${task.id})">
            ${getDrawerPhosphorIcon('snowflake')}
            ${task.frozen ? '\u89e3\u51bb' : '\u51bb\u7ed3'}
        </button>
        <button class="drawer-footer-btn drawer-footer-btn--danger danger" onclick="event.stopPropagation();deleteTaskInDrawer(${task.id})">
            ${getDrawerPhosphorIcon('trash')}
            \u5220\u9664
        </button>
    `;
}

function renderDrawerContent(task) {
    const content = document.getElementById('taskDetailContent');
    if (!content) return;

    const subtasksState = renderSubtasksList(task);
    const subtasksHtml = subtasksState.listHtml;
    const tagsHtml = renderTagsList(task);
    const isDone = taskAppearsDoneInDrawer(task);
    const normalizedPriority = task.priority === 'high' ? 'high' : 'normal';
    const drawerCheckRingColor = getDrawerCheckRingColor(normalizedPriority);
    const scheduleState = getDrawerScheduleState(task);
    const scheduleDurationText = scheduleState.durationMinutes !== null
        ? formatDrawerDurationBadgeText(scheduleState.durationMinutes)
        : '\u5f85\u8bbe\u7f6e';
    const scheduleDurationChipClass = scheduleState.durationMinutes !== null
        ? 'drawer-schedule-duration-chip--filled'
        : 'drawer-schedule-duration-chip--idle';
    const isPendingDone = taskPendingDoneInDrawer(task);
    const ringRippleClass = isPendingDone || (window._chkRippleTaskId != null && window._chkRippleTaskId == task.id)
        ? ' chk-ring--ripple'
        : '';
    const doneSubtasksCount = subtasksState.doneCount;
    const totalSubtasksCount = subtasksState.totalCount;
    const collapseCompletedRows = subtasksState.collapseCompletedRows;
    const collapseCompletedByDefault = typeof shouldCollapseCompletedSubtasks === 'function'
        ? shouldCollapseCompletedSubtasks(task.id, Math.max(doneSubtasksCount, 1), Math.max(totalSubtasksCount, 1))
        : collapseCompletedRows;

    content.innerHTML = `
        <div class="drawer-task-title ${isDone ? 'drawer-task-title--done' : ''}" data-task-id="${task.id}">
            <div class="task-ck-slot task-ck-ring ${task.priority === 'high' ? 'task-ck-ring--prio-high' : ''} ${isDone ? 'task-ck-ring--done' : ''}"
                 data-task-id="${task.id}"
                 role="button"
                 tabindex="0"
                 aria-pressed="${isDone ? 'true' : 'false'}"
                 style="--ck-prio:${drawerCheckRingColor}"
                 onmousedown="event.preventDefault();event.stopPropagation()"
                 onclick="handleDrawerTitleCheckClick(event, ${task.id})"
                 onkeydown="if(event.key==='Enter'||event.key===' '){handleDrawerTitleCheckClick(event, ${task.id})}"
                 title="${isDone ? '\u6807\u8bb0\u4e3a\u672a\u5b8c\u6210' : '\u6807\u8bb0\u4e3a\u5df2\u5b8c\u6210'}"
                 onmouseenter="handleCheckRingHover(this, true)"
                 onmouseleave="handleCheckRingHover(this, false)">
                <div class="tc-check">
                    <div class="chk-ring ${isDone ? 'checked' : ''}${ringRippleClass}">
                        ${getDrawerTitleCheckIconMarkup()}
                    </div>
                </div>
            </div>
            <div class="drawer-task-title-field">
                <input type="text"
                   class="drawer-task-title-text"
                   id="drawer-task-title-input"
                   placeholder="输入任务标题..."
                   value="${escapeHtml(task.text || '')}"
                   onclick="event.stopPropagation()"
                   onblur="saveDrawerTitle(${task.id})"
                   onkeydown="if(event.key==='Enter'){event.target.blur()}">
            </div>
            <div class="drawer-priority-dropdown" onclick="event.stopPropagation()">
                <button type="button" class="drawer-priority-btn" onclick="togglePriorityDropdown(this)" title="\u9009\u62e9\u4f18\u5148\u7ea7">
                    ${getDrawerPhosphorIcon('caret-down', 'drawer-priority-arrow')}
                </button>
                <div class="drawer-priority-menu">
                    <div class="drawer-priority-option ${task.priority === 'high' ? 'selected' : ''}" data-priority="high" onclick="setDrawerPriority(${task.id}, 'high')">
                        ${getDrawerPriorityFlagIcon('drawer-priority-flag drawer-priority-flag--high')}
                        <span>\u9ad8\u4f18\u5148\u7ea7</span>
                    </div>
                    <div class="drawer-priority-option ${!task.priority || task.priority === 'normal' ? 'selected' : ''}" data-priority="normal" onclick="setDrawerPriority(${task.id}, 'normal')">
                        ${getDrawerPriorityFlagIcon('drawer-priority-flag drawer-priority-flag--normal')}
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
                            ${getDrawerPhosphorIcon('clock')}
                        </span>
                        <span>\u5f00\u59cb</span>
                    </span>
                    <div class="drawer-schedule-time-value">
                        <span class="drawer-schedule-time-core">
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
                        </span>
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
                        ${getDrawerPhosphorIcon('arrow-right')}
                    </div>
                    <div class="drawer-schedule-duration-side">
                        <span class="drawer-schedule-duration-chip ${scheduleDurationChipClass}">${scheduleDurationText}</span>
                    </div>
                </div>
                <label class="drawer-schedule-time-box drawer-schedule-time-box--end">
                    <span class="drawer-schedule-time-label">
                        <span class="drawer-schedule-time-icon" aria-hidden="true">
                            ${getDrawerPhosphorIcon('clock')}
                        </span>
                        <span>\u7ed3\u675f</span>
                    </span>
                    <div class="drawer-schedule-time-value">
                        <span class="drawer-schedule-time-core drawer-schedule-time-core--end">
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
                            <span class="drawer-schedule-next-day-badge ${scheduleState.spillsNextDay ? 'is-visible' : ''}"
                                  id="drawer-next-day-badge-${task.id}"
                                  aria-hidden="${scheduleState.spillsNextDay ? 'false' : 'true'}">+1\u5929</span>
                        </span>
                    </div>
                </label>
            </div>
        </div>

        ${tagsHtml ? `
        <div class="drawer-row drawer-row--tags">
            <div class="drawer-row-icon">
                ${getDrawerPhosphorIcon('tag')}
            </div>
            <label class="drawer-row-label">\u6807\u7b7e</label>
            <div class="drawer-row-value">${tagsHtml}</div>
        </div>
        ` : ''}

        <div class="drawer-section-header drawer-section-header--subtasks">
            <div class="drawer-section-label drawer-section-label--subtasks">
                <span class="drawer-section-title">\u5b50\u4efb\u52a1</span>
            </div>
            <div class="drawer-subtasks-head-actions">
                ${totalSubtasksCount > 0 ? `<span class="drawer-section-count">${doneSubtasksCount} / ${totalSubtasksCount}</span>` : ''}
            </div>
        </div>

        <label class="drawer-subtasks-pref" onclick="event.stopPropagation()">
            <input type="checkbox"
                   class="drawer-subtasks-pref-checkbox"
                   id="drawer-subtasks-default-toggle-${task.id}"
                   ${collapseCompletedByDefault ? 'checked' : ''}
                   onchange="toggleDrawerCompletedDefault(${task.id}, this.checked)">
            <span class="drawer-subtasks-pref-inner">
                <span class="drawer-subtasks-pref-icon" aria-hidden="true">${getDrawerPhosphorIcon('list-checks')}</span>
                <span class="drawer-subtasks-pref-text">\u9ed8\u8ba4\u6298\u53e0\u5df2\u5b8c\u6210\u4efb\u52a1</span>
                <span class="drawer-subtasks-pref-switch" aria-hidden="true">
                    <span class="drawer-subtasks-pref-knob"></span>
                </span>
            </span>
        </label>

        <div class="drawer-subtasks-list">
            ${subtasksHtml}
            <div class="subtask-add-inline" id="subtask-add-inline-${task.id}" onclick="event.stopPropagation();showSubtaskAddInline(${task.id})">
                <span class="subtask-add-icon" aria-hidden="true"></span>
                <span class="subtask-add-label">\u6dfb\u52a0\u5b50\u4efb\u52a1</span>
                <input type="text"
                       class="subtask-add-input"
                       id="subtask-add-input-${task.id}"
                       placeholder="\u8f93\u5165\u5b50\u4efb\u52a1\u5185\u5bb9\uff0c\u6309\u56de\u8f66\u6dfb\u52a0..."
                       onclick="event.stopPropagation()"
                       onblur="handleSubtaskAddInlineBlur(${task.id})"
                       onkeydown="if(event.key==='Enter'){addSubtaskFromDrawer(${task.id});}if(event.key==='Escape'){hideSubtaskAddInline(${task.id})}">
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
                  oninput="autoResizeDrawerNotes(this)"
                  onblur="saveDrawerNotes(${task.id})">${escapeHtml(task.note || '')}</textarea>
    `;
    renderDrawerFooter(task);

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

    autoResizeDrawerNotes(content.querySelector('#drawer-notes-input'));
    updateDrawerTitleCompletionState(task);
    updateDrawerPriorityUI(normalizedPriority);
    scheduleDrawerScrollbarSync();
}

function renderSubtasksList(task) {
    const subtasks = task.subtasks || [];
    const state = {
        listHtml: '',
        doneCount: 0,
        totalCount: subtasks.length,
        collapseCompletedRows: false
    };
    if (subtasks.length === 0) return state;

    const doneCount = subtasks.reduce(function(count, sub) {
        return count + (sub.done ? 1 : 0);
    }, 0);
    const collapseCompletedRows = typeof shouldCollapseCompletedSubtasks === 'function'
        ? shouldCollapseCompletedSubtasks(task.id, doneCount, subtasks.length)
        : false;
    const todoRows = [];
    const doneRows = [];

    subtasks.forEach(function(sub) {
        const isDone = sub.done;
        const rowHtml = `
            <div class="subtask-row"
                 data-subtask-id="${sub.id}"
                 title="\u53cc\u51fb\u7f16\u8f91\u5b50\u4efb\u52a1"
                 onclick="event.stopPropagation()"
                 ondragover="handleSubtaskDragOver(event, ${task.id}, ${sub.id})"
                 ondragleave="handleSubtaskDragLeave(event)"
                 ondrop="handleSubtaskDrop(event, ${task.id}, ${sub.id})"
                 ondblclick="event.stopPropagation();startSubtaskEditInDrawer(${task.id}, ${sub.id})">
                <button type="button"
                        class="subtask-check ${isDone ? 'is-done' : ''}"
                        aria-label="\u6807\u8bb0\u5b50\u4efb\u52a1\u5b8c\u6210"
                        onclick="event.stopPropagation();toggleSubtaskInDrawer(${task.id}, ${sub.id})"
                        ondblclick="event.stopPropagation()"
                        onmouseenter="handleSubtaskCheckHover(this, true)"
                        onmouseleave="handleSubtaskCheckHover(this, false)">
                    <span class="subtask-ring ${isDone ? 'is-checked' : ''}" aria-hidden="true"></span>
                </button>
                <span class="subtask-text ${isDone ? 'done' : ''}"
                      title="\u53cc\u51fb\u7f16\u8f91\u5b50\u4efb\u52a1"
                      ondblclick="event.stopPropagation();startSubtaskEditInDrawer(${task.id}, ${sub.id})">${escapeHtml(sub.text)}</span>
                <input type="text"
                       class="subtask-edit-input"
                       value="${escapeHtml(sub.text)}"
                       aria-label="\u7f16\u8f91\u5b50\u4efb\u52a1"
                       onclick="event.stopPropagation()"
                       ondblclick="event.stopPropagation()"
                       onblur="commitSubtaskEditInDrawer(${task.id}, ${sub.id})"
                       onkeydown="handleSubtaskEditKeydown(event, ${task.id}, ${sub.id})">
                <button type="button"
                        class="subtask-drag-handle"
                        draggable="true"
                        aria-label="\u62d6\u52a8\u6392\u5e8f"
                        title="\u62d6\u52a8\u6392\u5e8f"
                        onclick="event.stopPropagation()"
                        ondblclick="event.stopPropagation()"
                        onmousedown="event.stopPropagation()"
                        ondragstart="handleSubtaskDragStart(event, ${task.id}, ${sub.id})"
                        ondragend="handleSubtaskDragEnd(event)">
                    <span aria-hidden="true"></span>
                </button>
                <button type="button" class="subtask-delete-btn"
                        onclick="event.stopPropagation();deleteSubtaskInDrawer(${task.id}, ${sub.id})"
                        ondblclick="event.stopPropagation()"
                        title="\u5220\u9664\u5b50\u4efb\u52a1">
                    ${getDrawerPhosphorIcon('x')}
                </button>
            </div>
        `;

        if (isDone) {
            doneRows.push(rowHtml);
        } else {
            todoRows.push(rowHtml);
        }
    });

    const doneRowsHtml = doneRows.length
        ? `<div class="drawer-subtasks-completed-wrap${collapseCompletedRows ? ' is-collapsed' : ''}">${doneRows.join('')}</div>`
        : '';
    const doneHiddenHint = doneRows.length && collapseCompletedRows
        ? `<button type="button" class="drawer-subtasks-collapsed-hint" onclick="event.stopPropagation();toggleDrawerCompletedSubtasks(${task.id})">已有${doneCount}个已完成子任务被折叠</button>`
        : '';

    state.listHtml = `${todoRows.join('')}${doneRowsHtml}${doneHiddenHint}`;
    state.doneCount = doneCount;
    state.collapseCompletedRows = collapseCompletedRows;
    return state;
}

function toggleDrawerCompletedSubtasks(taskId) {
    if (typeof toggleCompletedSubtasksCollapse === 'function') {
        toggleCompletedSubtasksCollapse(taskId);
    }
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
                ${getDrawerPhosphorIcon('note-pencil')}
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

function handleDrawerTitleCheckClick(event, taskId) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const normalizedTaskId = Number(taskId);
    if (!Number.isFinite(normalizedTaskId)) return;

    const task = findTaskById(normalizedTaskId);
    const willMarkDone = task && !taskAppearsDoneInDrawer(task);
    if (willMarkDone) {
        startDrawerTitleCompletionAnimation(normalizedTaskId);
    } else {
        clearDrawerTitleCompletionAnimation(normalizedTaskId);
    }

    toggleTaskDoneFromDrawer(normalizedTaskId);
}

function toggleTaskDoneFromDrawer(taskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    if (typeof tog === 'function') {
        tog(taskId);
        return;
    }

    task.done = !task.done;
    task.status = task.done ? 'done' : 'todo';
    if (!task.done) {
        task.archived = false;
        clearDrawerTitleCompletionAnimation(taskId);
    } else if (!isDrawerTitleCompletionAnimationActive(taskId)) {
        startDrawerTitleCompletionAnimation(taskId);
    }

    if (typeof playCheckSound === 'function') {
        playCheckSound(task.done);
    }

    updateDrawerTitleCompletionState(task, {
        animate: task.done,
        forceRipple: task.done
    });

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
    const oldText = (task.text || '').trim();

    // Empty title on blur should roll back to the original title.
    if (!newText) {
        input.value = task.text || '';
        return;
    }

    if (newText !== oldText) {
        task.text = newText;
        persistTaskDetailChanges(task, { kanban: true });
        input.value = newText;
        return;
    }

    // Keep displayed text consistent when only whitespace was edited.
    input.value = task.text || '';
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

    return `<span class="drawer-priority-btn-copy">${getDrawerPriorityFlagIcon(flagClass)}<span class="drawer-priority-btn-text"><span class="drawer-priority-btn-label">${label}</span></span></span><span class="drawer-priority-arrow-wrap" aria-hidden="true">${getDrawerPhosphorIcon('caret-down', 'drawer-priority-arrow')}</span>`;
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
    const checkSlot = document.querySelector('.drawer-task-title .task-ck-ring');
    if (checkSlot) {
        checkSlot.classList.toggle('task-ck-ring--prio-high', activePriority === 'high');
        checkSlot.style.setProperty('--ck-prio', getDrawerCheckRingColor(activePriority));
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

function autoResizeDrawerNotes(textarea) {
    if (!textarea) return;

    const minHeight = 120;
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(minHeight, textarea.scrollHeight) + 'px';
    scheduleDrawerScrollbarSync();
}

function toggleDrawerCompletedDefault(taskId, checked) {
    const task = findTaskById(taskId);
    if (!task) return;
    if (typeof shouldCollapseCompletedSubtasks !== 'function' || typeof toggleCompletedSubtasksCollapse !== 'function') return;
    const subtasks = task.subtasks || [];
    const doneCount = subtasks.reduce(function(count, item) {
        return count + (item && item.done ? 1 : 0);
    }, 0);
    const totalCount = subtasks.length;
    const current = shouldCollapseCompletedSubtasks(task.id, Math.max(doneCount, 1), Math.max(totalCount, 1));
    if (!!checked === current) return;
    toggleCompletedSubtasksCollapse(task.id);
    syncTaskDetailPanel();
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
        const subtaskRing = subtaskRow.querySelector('.subtask-ring');
        const textSpan = subtaskRow.querySelector('.subtask-text');

        if (checkSlot) {
            checkSlot.classList.toggle('is-done', subtask.done);
        }
        if (subtaskRing) {
            subtaskRing.classList.toggle('is-checked', subtask.done);
            subtaskRing.classList.remove('hover-check');
        }
        if (textSpan) {
            textSpan.classList.toggle('done', subtask.done);
        }
    }

    persistTaskDetailChanges(task, { kanban: true });
}

function startSubtaskEditInDrawer(taskId, subtaskId) {
    const task = findTaskById(taskId);
    if (!task) return;

    const subtask = (task.subtasks || []).find(function(item) {
        return item.id === subtaskId;
    });
    if (!subtask) return;

    document.querySelectorAll('.subtask-row.is-editing .subtask-edit-input').forEach(function(openInput) {
        const openRow = openInput.closest('.subtask-row');
        if (!openRow || String(openRow.dataset.subtaskId) !== String(subtaskId)) {
            openInput.blur();
        }
    });

    const subtaskRow = document.querySelector(`.subtask-row[data-subtask-id="${subtaskId}"]`);
    if (!subtaskRow) return;

    const input = subtaskRow.querySelector('.subtask-edit-input');
    if (!input) return;

    input.dataset.originalValue = subtask.text || '';
    input.dataset.cancelEdit = 'false';
    input.value = subtask.text || '';
    subtaskRow.classList.add('is-editing');

    window.requestAnimationFrame(function() {
        input.focus();
        const length = input.value.length;
        try {
            input.setSelectionRange(length, length);
        } catch (_err) {
            // 部分浏览器输入法环境下可能抛错，忽略并保持可编辑状态
        }
    });
}

function commitSubtaskEditInDrawer(taskId, subtaskId) {
    const subtaskRow = document.querySelector(`.subtask-row[data-subtask-id="${subtaskId}"]`);
    if (!subtaskRow) return;

    const input = subtaskRow.querySelector('.subtask-edit-input');
    const textSpan = subtaskRow.querySelector('.subtask-text');
    if (!input || !textSpan) return;

    const originalValue = input.dataset.originalValue || '';
    const shouldCancel = input.dataset.cancelEdit === 'true';
    const nextText = input.value.trim();

    subtaskRow.classList.remove('is-editing');
    delete input.dataset.cancelEdit;
    delete input.dataset.originalValue;

    if (shouldCancel || !nextText) {
        input.value = originalValue;
        return;
    }

    const task = findTaskById(taskId);
    if (!task) return;

    const subtask = (task.subtasks || []).find(function(item) {
        return item.id === subtaskId;
    });
    if (!subtask) return;

    if (subtask.text !== nextText) {
        subtask.text = nextText;
        textSpan.textContent = nextText;
        input.value = nextText;
        persistTaskDetailChanges(task, { kanban: true });
    }
}

function handleSubtaskEditKeydown(event, taskId, subtaskId) {
    if (!event) return;

    if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        event.target.blur();
        return;
    }

    if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        event.target.dataset.cancelEdit = 'true';
        event.target.blur();
    }
}

function clearSubtaskDragIndicators() {
    document.querySelectorAll('.subtask-row.is-subtask-drop-before, .subtask-row.is-subtask-drop-after, .subtask-row.is-subtask-dragging').forEach(function(row) {
        row.classList.remove('is-subtask-drop-before', 'is-subtask-drop-after', 'is-subtask-dragging');
        delete row.dataset.dropPosition;
    });
}

function handleSubtaskDragStart(event, taskId, subtaskId) {
    if (!event) return;

    const row = event.currentTarget ? event.currentTarget.closest('.subtask-row') : null;
    if (row && row.classList.contains('is-editing')) {
        event.preventDefault();
        return;
    }

    drawerSubtaskDragState = {
        taskId: taskId,
        subtaskId: subtaskId
    };

    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(subtaskId));
        if (row && typeof event.dataTransfer.setDragImage === 'function') {
            event.dataTransfer.setDragImage(row, 24, Math.max(12, Math.min(row.offsetHeight / 2, 22)));
        }
    }

    if (row) {
        row.classList.add('is-subtask-dragging');
    }
}

function handleSubtaskDragOver(event, taskId, subtaskId) {
    if (!drawerSubtaskDragState) return;
    if (String(drawerSubtaskDragState.taskId) !== String(taskId)) return;
    if (String(drawerSubtaskDragState.subtaskId) === String(subtaskId)) return;

    event.preventDefault();
    event.stopPropagation();

    const row = event.currentTarget;
    if (!row) return;

    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
    }

    const rect = row.getBoundingClientRect();
    const dropBefore = event.clientY < rect.top + rect.height / 2;

    document.querySelectorAll('.subtask-row.is-subtask-drop-before, .subtask-row.is-subtask-drop-after').forEach(function(item) {
        if (item !== row) {
            item.classList.remove('is-subtask-drop-before', 'is-subtask-drop-after');
            delete item.dataset.dropPosition;
        }
    });

    row.dataset.dropPosition = dropBefore ? 'before' : 'after';
    row.classList.toggle('is-subtask-drop-before', dropBefore);
    row.classList.toggle('is-subtask-drop-after', !dropBefore);
}

function handleSubtaskDragLeave(event) {
    const row = event && event.currentTarget;
    if (!row) return;
    if (event.relatedTarget && row.contains(event.relatedTarget)) return;

    row.classList.remove('is-subtask-drop-before', 'is-subtask-drop-after');
    delete row.dataset.dropPosition;
}

function handleSubtaskDrop(event, taskId, subtaskId) {
    if (!drawerSubtaskDragState) return;
    if (String(drawerSubtaskDragState.taskId) !== String(taskId)) return;

    event.preventDefault();
    event.stopPropagation();

    const row = event.currentTarget;
    let dropPosition = row && row.dataset.dropPosition === 'after' ? 'after' : 'before';
    if (row && !row.dataset.dropPosition) {
        const rect = row.getBoundingClientRect();
        dropPosition = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    }
    const fromSubtaskId = drawerSubtaskDragState.subtaskId;

    clearSubtaskDragIndicators();
    drawerSubtaskDragState = null;

    reorderSubtasksInDrawer(taskId, fromSubtaskId, subtaskId, dropPosition);
}

function handleSubtaskDragEnd() {
    clearSubtaskDragIndicators();
    drawerSubtaskDragState = null;
}

function reorderSubtasksInDrawer(taskId, fromSubtaskId, toSubtaskId, dropPosition) {
    if (String(fromSubtaskId) === String(toSubtaskId)) return;

    const task = findTaskById(taskId);
    if (!task || !Array.isArray(task.subtasks)) return;

    const fromIndex = task.subtasks.findIndex(function(item) {
        return String(item.id) === String(fromSubtaskId);
    });
    const toIndex = task.subtasks.findIndex(function(item) {
        return String(item.id) === String(toSubtaskId);
    });

    if (fromIndex < 0 || toIndex < 0) return;

    let insertIndex = dropPosition === 'after' ? toIndex + 1 : toIndex;
    if (fromIndex < insertIndex) {
        insertIndex -= 1;
    }

    if (insertIndex === fromIndex) return;

    const moved = task.subtasks.splice(fromIndex, 1)[0];
    task.subtasks.splice(Math.max(0, Math.min(insertIndex, task.subtasks.length)), 0, moved);
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
    const input = document.getElementById('subtask-add-input-' + taskId);

    if (!inputWrap || !input) return;

    inputWrap.classList.add('is-editing');
    input.focus();
}

function hideSubtaskAddInline(taskId) {
    const inputWrap = document.getElementById('subtask-add-inline-' + taskId);
    const input = document.getElementById('subtask-add-input-' + taskId);

    if (!inputWrap || !input) return;

    inputWrap.classList.remove('is-editing');
    input.value = '';
}

function handleSubtaskAddInlineBlur(taskId) {
    const input = document.getElementById('subtask-add-input-' + taskId);
    if (!input) return;

    const hasContent = input.value.trim().length > 0;
    if (hasContent) {
        addSubtaskFromDrawer(taskId);
        return;
    }

    hideSubtaskAddInline(taskId);
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
    const subtaskRing = element.querySelector('.subtask-ring');
    if (!subtaskRing) return;

    // Don't show checkmark if already done
    if (subtaskRing.classList.contains('is-checked')) return;

    if (isEntering) {
        subtaskRing.classList.add('hover-check');
    } else {
        subtaskRing.classList.remove('hover-check');
    }
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
    const nextDayBadge = document.getElementById('drawer-next-day-badge-' + taskId);
    if (!durationInput || !durationChip || !durationRow) return;

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
    if (nextDayBadge) {
        nextDayBadge.classList.toggle('is-visible', spillsNextDay);
        nextDayBadge.setAttribute('aria-hidden', spillsNextDay ? 'false' : 'true');
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
window.syncTaskDetailDoneState = syncTaskDetailDoneState;
window.handleDrawerTitleCheckClick = handleDrawerTitleCheckClick;

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
