const FILTER_SEG_INSTANT_MS = 96;
const INLINE_ADD_BLUR_CLOSE_MS = 56;
const INLINE_ADD_POINTER_GUARD_MS = 280;

function taskMatchesFilterKey(task, key) {
  if (key === 'all') return !task.frozen;
  if (key === 'pending') return !task.done && !task.frozen;
  if (key === 'done') return task.done;
  if (key === 'high') return task.priority === 'high';
  if (key === 'frozen') return task.frozen;
  if (key === 'scheduled') return !!task.planTime && !task.done && !task.frozen;
  if (key === 'repeating') return !!task.recurRuleId && !task.done && !task.frozen;
  if (key === 'unscheduled') return !task.planTime && !task.done && !task.frozen;
  if (key === 'default-list') return !(task.tags || []).length && !task.done && !task.frozen;
  return !task.frozen;
}

function passesFMulti(task) {
  for (const key of FMulti) {
    if (taskMatchesFilterKey(task, key)) return true;
  }
  return FMulti.size === 1
    && FMulti.has('done')
    && _togPendingDoneId != null
    && _togPendingDoneId === task.id;
}

function applyBatchBarPanelState() {
  const panel = document.querySelector('#addSplitPanel');
  const chevron = document.querySelector('.add-split-chev');

  if (panel) panel.classList.toggle('open', addSplitOpen);
  if (chevron) {
    chevron.classList.toggle('open', addSplitOpen);
    chevron.setAttribute('aria-expanded', addSplitOpen ? 'true' : 'false');
  }
}

function toggleAddSplitMenu(event) {
  if (event) event.stopPropagation();
  addSplitOpen = !addSplitOpen;
  applyBatchBarPanelState();
}

function closeAddSplitMenu() {
  addSplitOpen = false;
  applyBatchBarPanelState();
}

function toggleFFilter(key) {
  const nextFilters = new Set(FMulti);

  if (key === 'all') {
    FMulti = new Set(['all']);
  } else {
    nextFilters.delete('all');
    if (nextFilters.has(key)) nextFilters.delete(key);
    else nextFilters.add(key);
    if (nextFilters.size === 0) nextFilters.add('all');
    FMulti = nextFilters;
  }

  if (_togPendingDoneId != null) {
    flushPendingTogIfAny();
    return;
  }
  rT();
}

function setF(value) {
  FMulti = new Set([value]);
  if (_togPendingDoneId != null) {
    flushPendingTogIfAny();
    return;
  }
  rT();
}

function filterSegIconSvg(kind) {
  if (kind === 'pending') {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
  }
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
}

function isFilterSegVisible(taskFilter) {
  const batchBar = document.querySelector('#batchBar');
  const element = batchBar || taskFilter;

  if (!element) return true;
  if (element.style && element.style.display === 'none') return false;
  if (window.getComputedStyle) {
    const styles = window.getComputedStyle(element);
    if (!styles || styles.display === 'none' || styles.visibility === 'hidden') return false;
  }
  if (element.getBoundingClientRect) {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 && rect.height <= 0) return false;
  }
  return true;
}

function applyFilterSegInstant(segEl) {
  if (!segEl || !segEl.classList) return;

  segEl.classList.add('filter-seg--instant');
  if (segEl._filterSegInstantTimer) clearTimeout(segEl._filterSegInstantTimer);

  segEl._filterSegInstantTimer = setTimeout(() => {
    segEl._filterSegInstantTimer = null;
    if (segEl && segEl.classList) segEl.classList.remove('filter-seg--instant');
  }, FILTER_SEG_INSTANT_MS);
}

function syncFilterSegIndicator(segEl) {
  if (!segEl || !segEl.querySelector) return;

  const activeBtn = segEl.querySelector('.filter-seg-btn.is-active')
    || segEl.querySelector('.filter-seg-btn[aria-selected="true"]');

  if (!activeBtn) {
    segEl.classList.remove('filter-seg--indicator');
    segEl.style.setProperty('--seg-indicator-o', '0');
    return;
  }

  const segRect = segEl.getBoundingClientRect();
  const btnRect = activeBtn.getBoundingClientRect();
  if (segRect.width <= 0 || btnRect.width <= 0) return;

  const firstBtn = segEl.querySelector('.filter-seg-btn');
  const baseLeft = firstBtn
    ? Math.round(firstBtn.getBoundingClientRect().left - segRect.left)
    : 0;
  const x = Math.max(0, Math.round(btnRect.left - segRect.left) - baseLeft);
  const width = Math.max(0, Math.round(btnRect.width));

  segEl.classList.add('filter-seg--indicator');
  segEl.style.setProperty('--seg-indicator-x', `${x}px`);
  segEl.style.setProperty('--seg-indicator-w', `${width}px`);
  segEl.style.setProperty('--seg-indicator-o', width > 0 ? '1' : '0');
}

function getFilterDayTasks() {
  return T[sel] || [];
}

function getFilterVisibleTasks(dayTasks) {
  return dayTasks.filter((task) => !task.archived);
}

function getFilteredTaskCount(filterKey, visibleTasks, dayTasks) {
  let filteredTasks;

  if (filterKey === 'pending') {
    filteredTasks = visibleTasks.filter((task) => !task.done && !task.frozen);
  } else if (filterKey === 'done') {
    filteredTasks = visibleTasks.filter((task) => task.done || (
      _togPendingDoneId != null && _togPendingDoneId === task.id
    ));
  } else if (filterKey === 'high') {
    filteredTasks = visibleTasks.filter((task) => task.priority === 'high');
  } else if (filterKey === 'frozen') {
    filteredTasks = dayTasks.filter((task) => task.frozen && !task.archived);
  } else {
    filteredTasks = visibleTasks.filter((task) => !task.frozen);
  }

  if (FTag) {
    filteredTasks = filteredTasks.filter((task) => (task.tags || []).indexOf(FTag) >= 0);
  }
  return filteredTasks.length;
}

function ensureFilterSegment(taskFilter) {
  let segEl = taskFilter.querySelector('.filter-seg');
  let segBtns = segEl ? segEl.querySelectorAll('.filter-seg-btn') : null;
  const hasSeg = !!(
    segEl
    && segBtns
    && segBtns.length === 2
    && segEl.querySelector('.filter-seg-slider')
  );

  if (!hasSeg) {
    taskFilter.innerHTML = [
      '<div class="filter-seg" role="tablist" aria-label="\u4efb\u52a1\u7b5b\u9009">',
      '<div class="filter-seg-slider" aria-hidden="true"></div>',
      '<button type="button" role="tab" class="filter-seg-btn" onclick="setF(\'pending\')">',
      `<span class="filter-seg-icon" aria-hidden="true">${filterSegIconSvg('pending')}</span>`,
      '<span class="filter-seg-label">\u5f85\u529e</span>',
      '<span class="filter-seg-badge">0</span>',
      '</button>',
      '<button type="button" role="tab" class="filter-seg-btn" onclick="setF(\'done\')">',
      `<span class="filter-seg-icon" aria-hidden="true">${filterSegIconSvg('done')}</span>`,
      '<span class="filter-seg-label">\u5df2\u5b8c\u6210</span>',
      '<span class="filter-seg-badge">0</span>',
      '</button>',
      '</div>'
    ].join('');

    segEl = taskFilter.querySelector('.filter-seg');
    segBtns = segEl ? segEl.querySelectorAll('.filter-seg-btn') : null;
  }

  return { segEl, segBtns, hasSeg };
}

function patchFilterSegmentButton(button, isActive, count) {
  button.classList.toggle('is-active', isActive);
  button.setAttribute('aria-selected', isActive ? 'true' : 'false');

  const badge = button.querySelector('.filter-seg-badge');
  if (!badge) return;

  badge.textContent = String(count);
  badge.classList.toggle('filter-seg-badge--on', isActive);
}

function getFreezeFilterIcon() {
  return '<svg class="filter-ico-freeze" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>';
}

function getAdvancedFilterRows() {
  return [
    { html: '\u5168\u90e8', value: 'all' },
    { html: '\u9ad8\u4f18\u5148', value: 'high' },
    { html: `${getFreezeFilterIcon()}\u51bb\u7ed3`, value: 'frozen' }
  ];
}

function renderAdvancedFilterRows(advEl) {
  if (!advEl) return;

  advEl.innerHTML = getAdvancedFilterRows().map((filter) => {
    const isActive = FMulti.has(filter.value);
    const check = `<span class="fdd-chk${isActive ? ' on' : ''}">${isActive ? '\u2713' : ''}</span>`;
    const highClass = filter.value === 'high' ? ' fp-high' : '';

    return [
      `<button type="button" class="filter-dd-row filter-adv-row${highClass}" onclick="event.stopPropagation();toggleFFilter('${filter.value}')">`,
      check,
      `<span class="fdd-lbl">${filter.html}</span>`,
      '</button>'
    ].join('');
  }).join('');
}

function rFilterBar() {
  const taskFilter = document.querySelector('#filterBar');
  const advEl = document.querySelector('#batchMoreAdv');

  if (!taskFilter) return;

  const filterSegVisible = isFilterSegVisible(taskFilter);
  const wasFilterSegHidden = taskFilter.dataset.filterSegVisible === '0';
  const keepAdd = addSplitOpen;

  FMulti.delete('starred');
  FMulti.delete('star');
  if (FMulti.size === 0) FMulti = new Set(['pending']);

  const dayTasks = getFilterDayTasks();
  const visibleTasks = getFilterVisibleTasks(dayTasks);
  const pendingCount = getFilteredTaskCount('pending', visibleTasks, dayTasks);
  const doneCount = getFilteredTaskCount('done', visibleTasks, dayTasks);
  const pendingActive = FMulti.size === 1 && FMulti.has('pending');
  const doneActive = FMulti.size === 1 && FMulti.has('done');
  const { segEl, segBtns, hasSeg } = ensureFilterSegment(taskFilter);
  const shouldInstant = !!(segEl && filterSegVisible && (wasFilterSegHidden || !hasSeg));

  if (shouldInstant) applyFilterSegInstant(segEl);

  if (segEl && segBtns && segBtns.length === 2) {
    patchFilterSegmentButton(segBtns[0], pendingActive, pendingCount);
    patchFilterSegmentButton(segBtns[1], doneActive, doneCount);
  }

  renderAdvancedFilterRows(advEl);

  if (segEl && filterSegVisible) {
    if (shouldInstant) syncFilterSegIndicator(segEl);
    else requestAnimationFrame(() => syncFilterSegIndicator(segEl));
  }

  taskFilter.dataset.filterSegVisible = filterSegVisible ? '1' : '0';
  addSplitOpen = keepAdd;
  applyBatchBarPanelState();
}

function bindBatchBarGlobalHandlers() {
  if (window._batchBarClickOutside) return;

  window._batchBarClickOutside = true;

  document.addEventListener('click', (event) => {
    if (!addSplitOpen) return;
    if (event.target.closest && event.target.closest('.add-split')) return;

    addSplitOpen = false;
    applyBatchBarPanelState();
  });

  document.addEventListener('click', (event) => {
    if (typeof taskMoreMenuId === 'undefined' || taskMoreMenuId == null) return;
    if (
      event.target.closest
      && (event.target.closest('.task-more-wrap') || event.target.closest('.task-more-float'))
    ) {
      return;
    }

    if (typeof closeTaskMoreFloat === 'function') closeTaskMoreFloat();
    taskMoreMenuId = null;
  }, true);

  if (window._taskMoreScrollClose) return;
  window._taskMoreScrollClose = true;

  document.addEventListener('scroll', () => {
    if (typeof taskMoreMenuId === 'undefined' || taskMoreMenuId == null) return;
    if (typeof closeTaskMoreFloat === 'function') closeTaskMoreFloat();
    taskMoreMenuId = null;
  }, true);
}

function wrapRenderTasksWithFilterSync() {
  if (window._filterBarRenderWrapped) return;

  window._filterBarRenderWrapped = true;
  const renderTasks = rT;
  let filterBarSchedule = null;

  rT = function renderTasksWithFilterBarSync() {
    const result = renderTasks.apply(this, arguments);
    if (typeof rFilterBar !== 'function') return result;

    if (filterBarSchedule != null) clearTimeout(filterBarSchedule);
    rFilterBar();
    filterBarSchedule = setTimeout(() => {
      filterBarSchedule = null;
      rFilterBar();
    }, 0);

    return result;
  };
}

function bindInlineAddBlurClose() {
  document.addEventListener('focusout', (event) => {
    const input = document.querySelector('#tIn');
    const holder = document.querySelector('#addTaskInlineHold');

    if (!input || !holder) return;
    if (holder.classList.contains('hidden') || !holder.classList.contains('task-add-inline-open')) return;

    const related = event && event.relatedTarget;
    if (related && holder.contains(related)) return;

    setTimeout(() => {
      if (window.__taskAddInlineGuardUntil && Date.now() < window.__taskAddInlineGuardUntil) return;
      if (window.__taskAddInlinePointerGuardUntil && Date.now() < window.__taskAddInlinePointerGuardUntil) return;

      const active = document.activeElement;
      const isInsideHolder = !!(active && holder.contains(active));
      if (isInsideHolder) return;

      const addBox = input.closest ? input.closest('.add-embed-wrap') : null;
      const isInsideAddBox = !!(addBox && active && addBox.contains(active));
      const addButton = document.querySelector('#btnAddTaskBar');
      const isOnAddButton = !!(addButton && active === addButton);

      if (!isInsideAddBox && !isOnAddButton && !input.value.trim()) {
        hideAddTaskInline();
      }
    }, INLINE_ADD_BLUR_CLOSE_MS);
  });
}

function bindInlineAddPointerGuards() {
  const holder = document.querySelector('#addTaskInlineHold');
  if (!holder) return;

  const keepInlineAddOpen = () => {
    window.__taskAddInlinePointerGuardUntil = Date.now() + INLINE_ADD_POINTER_GUARD_MS;
  };

  holder.addEventListener('pointerdown', keepInlineAddOpen, true);
  holder.addEventListener('mousedown', keepInlineAddOpen, true);
  holder.addEventListener('touchstart', keepInlineAddOpen, { capture: true, passive: true });
  holder.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (holder.classList.contains('hidden')) return;

    event.preventDefault();
    cancelAddTask();
  });
}

bindBatchBarGlobalHandlers();
wrapRenderTasksWithFilterSync();
bindInlineAddBlurClose();
bindInlineAddPointerGuards();
