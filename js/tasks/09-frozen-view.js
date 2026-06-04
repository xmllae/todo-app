(function () {
  if (window.__frozenViewBound) {
    return;
  }
  window.__frozenViewBound = true;

  const FROZEN_MODE = 'frozen-view';
  const FROZEN_CLASS = 'task-mode--frozen-view';
  const FROZEN_NAV_CLASS = 'date-nav--frozen-view';
  const FROZEN_SHELL_CLASS = 'frozen-view-shell';
  const FROZEN_BODY_CLASS = 'body--frozen-view';
  const FROZEN_FILTER_STORAGE_KEY = 'todo_frozen_view_filter_v1';
  const FROZEN_SORT_STORAGE_KEY = 'todo_frozen_view_sort_v1';
  const FROZEN_PAGE_SIZE_STORAGE_KEY = 'todo_frozen_view_page_size_v1';
  const FROZEN_FILTERS = ['all', 'high', 'repeating'];
  const FROZEN_SORT_MODES = ['latest', 'schedule'];
  const FROZEN_PAGE_SIZES = [10, 20, 50];
  const DAY_MS = 86400000;

  let frozenViewFilter = readSavedFrozenFilter();
  let frozenViewSortMode = readSavedFrozenSortMode();
  let frozenViewPage = 1;
  let frozenViewPageSize = readSavedFrozenPageSize();

  function html(value) {
    if (typeof esc === 'function') {
      return esc(value);
    }
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  function isFrozenMode() {
    return typeof getTaskQuickMode === 'function' && getTaskQuickMode() === FROZEN_MODE;
  }

  function getTaskMode() {
    return document.getElementById('taskMode');
  }

  function getDateNav() {
    return document.querySelector('#taskMode .task-main-col > .task-card > .date-nav');
  }

  function getTitleHost() {
    return document.getElementById('dTitle');
  }

  function clearTitleMotion(title) {
    if (!title) {
      return;
    }
    title.classList.remove('is-animating', 'is-animating-prev', 'is-animating-next');
  }

  function todayKey() {
    return typeof fd === 'function' ? fd(new Date()) : '';
  }

  function normalizeFrozenFilter(filter) {
    return FROZEN_FILTERS.indexOf(filter) >= 0 ? filter : 'all';
  }

  function readSavedFrozenFilter() {
    try {
      return normalizeFrozenFilter(localStorage.getItem(FROZEN_FILTER_STORAGE_KEY));
    } catch (error) {
      return 'all';
    }
  }

  function persistFrozenFilter(filter) {
    try {
      localStorage.setItem(FROZEN_FILTER_STORAGE_KEY, normalizeFrozenFilter(filter));
    } catch (error) {}
  }

  function normalizeFrozenSortMode(mode) {
    return FROZEN_SORT_MODES.indexOf(mode) >= 0 ? mode : 'latest';
  }

  function readSavedFrozenSortMode() {
    try {
      return normalizeFrozenSortMode(localStorage.getItem(FROZEN_SORT_STORAGE_KEY));
    } catch (error) {
      return 'latest';
    }
  }

  function persistFrozenSortMode(mode) {
    try {
      localStorage.setItem(FROZEN_SORT_STORAGE_KEY, normalizeFrozenSortMode(mode));
    } catch (error) {}
  }

  function normalizeFrozenPageSize(size) {
    if (window.taskViewPager && typeof window.taskViewPager.normalizePageSize === 'function') {
      return window.taskViewPager.normalizePageSize(size, FROZEN_PAGE_SIZES);
    }
    const pageSize = parseInt(size, 10);
    return FROZEN_PAGE_SIZES.indexOf(pageSize) >= 0 ? pageSize : FROZEN_PAGE_SIZES[0];
  }

  function readSavedFrozenPageSize() {
    if (window.taskViewPager && typeof window.taskViewPager.readStoredPageSize === 'function') {
      return window.taskViewPager.readStoredPageSize(FROZEN_PAGE_SIZE_STORAGE_KEY, FROZEN_PAGE_SIZES);
    }
    return FROZEN_PAGE_SIZES[0];
  }

  function persistFrozenPageSize(size) {
    if (window.taskViewPager && typeof window.taskViewPager.persistPageSize === 'function') {
      window.taskViewPager.persistPageSize(FROZEN_PAGE_SIZE_STORAGE_KEY, size, FROZEN_PAGE_SIZES);
      return;
    }
    try {
      localStorage.setItem(FROZEN_PAGE_SIZE_STORAGE_KEY, String(normalizeFrozenPageSize(size)));
    } catch (error) {}
  }

  function getFrozenSortLabel(mode) {
    if (mode === 'schedule') {
      return '按原计划';
    }
    return '按最近冻结';
  }

  function bindFrozenTitleClickGuard(dateNav) {
    if (!dateNav || dateNav.dataset.frozenClickGuardBound) {
      return;
    }
    const titleWrap = dateNav.querySelector('h3');
    if (!titleWrap) {
      return;
    }
    dateNav.dataset.frozenClickGuardBound = '1';
    titleWrap.addEventListener(
      'click',
      function (event) {
        if (!isFrozenMode()) {
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true
    );
  }

  function snowflakeIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 2v20"></path>' +
      '<path d="m4.93 6 14.14 12"></path>' +
      '<path d="M19.07 6 4.93 18"></path>' +
      '<path d="m7.2 3.8 1.45 2.52"></path>' +
      '<path d="m15.35 17.68 1.45 2.52"></path>' +
      '<path d="m16.8 3.8-1.45 2.52"></path>' +
      '<path d="m8.65 17.68-1.45 2.52"></path>' +
      '</svg>'
    );
  }

  function loopIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M17 1l4 4-4 4"></path>' +
      '<path d="M3 11V9a4 4 0 0 1 4-4h14"></path>' +
      '<path d="M7 23l-4-4 4-4"></path>' +
      '<path d="M21 13v2a4 4 0 0 1-4 4H3"></path>' +
      '</svg>'
    );
  }

  function flagIconMarkup() {
    if (typeof priorityFlagIconHtml === 'function') {
      return priorityFlagIconHtml('frozen-task__lead-ph');
    }
    return '<i class="ph-fill ph-flag frozen-task__lead-ph" aria-hidden="true"></i>';
  }

  function calendarIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="3" y="4" width="18" height="18" rx="3"></rect>' +
      '<path d="M8 2v4"></path>' +
      '<path d="M16 2v4"></path>' +
      '<path d="M3 10h18"></path>' +
      '</svg>'
    );
  }

  function sparkIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="m12 2 1.75 4.75L18.5 8.5l-4.75 1.75L12 15l-1.75-4.75L5.5 8.5l4.75-1.75Z"></path>' +
      '<path d="M5 18.5 5.85 21 8.5 21.85 5.85 22.7 5 25.2 4.15 22.7 1.5 21.85 4.15 21Z" transform="translate(0 -2.8)"></path>' +
      '</svg>'
    );
  }

  function playIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<polygon points="8 5 19 12 8 19 8 5"></polygon>' +
      '</svg>'
    );
  }

  function exportIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>' +
      '<polyline points="7 10 12 15 17 10"></polyline>' +
      '<line x1="12" y1="15" x2="12" y2="3"></line>' +
      '</svg>'
    );
  }

  function trashIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M3 6h18"></path>' +
      '<path d="M8 6V4.8c0-.66.54-1.2 1.2-1.2h5.6c.66 0 1.2.54 1.2 1.2V6"></path>' +
      '<path d="M6.8 6l.8 13.2c.05.74.66 1.3 1.4 1.3h6c.74 0 1.35-.56 1.4-1.3L17.2 6"></path>' +
      '<line x1="10" y1="10" x2="10" y2="17"></line>' +
      '<line x1="14" y1="10" x2="14" y2="17"></line>' +
      '</svg>'
    );
  }

  function renderFrozenTitle(state) {
    const title = getTitleHost();
    if (!title || !state) {
      return;
    }
    clearTitleMotion(title);
    title.innerHTML =
      '<span class="frozen-title">' +
      '<span class="frozen-title__icon" aria-hidden="true">' +
      snowflakeIconMarkup() +
      '</span>' +
      '<span class="frozen-title__copy">' +
      '<span class="frozen-title__main">已冻结任务</span>' +
      '<span class="frozen-title__sub">共 ' +
      state.totalCount +
      ' 个冻结任务</span>' +
      '</span></span>';
    title.dataset.renderKey = FROZEN_MODE + '|' + state.totalCount;
    title.dataset.lastDs = FROZEN_MODE;
    title.classList.remove('is-week-scope', 'is-range-offset', 'is-relative', 'is-plain-date', 'is-overdue-scope', 'is-priority-scope', 'is-repeat-scope');
    title.classList.add('is-frozen-scope');
  }

  function clearFrozenTitle() {
    const title = getTitleHost();
    if (!title) {
      return;
    }
    title.classList.remove('is-frozen-scope');
  }

  function ensureFrozenHeaderState(state) {
    const taskMode = getTaskMode();
    const dateNav = getDateNav();
    if (taskMode) {
      taskMode.classList.toggle(FROZEN_CLASS, !!state);
    }
    if (dateNav) {
      dateNav.classList.toggle(FROZEN_NAV_CLASS, !!state);
      bindFrozenTitleClickGuard(dateNav);
    }
    if (!state) {
      clearFrozenTitle();
      return;
    }
    renderFrozenTitle(state);
  }

  function getFrozenTimestamp(task) {
    const frozenStamp = parseInt(task && task.frozenAt, 10);
    if (Number.isFinite(frozenStamp) && frozenStamp > 0) {
      return frozenStamp;
    }
    const createdStamp = parseInt(task && task.created, 10);
    return Number.isFinite(createdStamp) && createdStamp > 0 ? createdStamp : 0;
  }

  function getFrozenStampSource(task) {
    const frozenStamp = parseInt(task && task.frozenAt, 10);
    if (Number.isFinite(frozenStamp) && frozenStamp > 0) {
      return 'frozen';
    }
    const createdStamp = parseInt(task && task.created, 10);
    return Number.isFinite(createdStamp) && createdStamp > 0 ? 'created' : 'unknown';
  }

  function getFrozenAgeBucket(task) {
    const stamp = getFrozenTimestamp(task);
    if (!stamp) {
      return 'earlier';
    }
    const today = parseDS(todayKey());
    if (!today || Number.isNaN(today.getTime())) {
      return 'earlier';
    }
    const base = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const targetDate = new Date(stamp);
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const diffDays = Math.floor((base - target) / DAY_MS);
    if (diffDays <= 0) {
      return 'today';
    }
    if (diffDays <= 7) {
      return 'week';
    }
    return 'earlier';
  }

  function buildFrozenEntry(ds, task) {
    if (!task || !task.frozen) {
      return null;
    }
    if (typeof isListedTask === 'function' && !isListedTask(task)) {
      return null;
    }
    return {
      ds: ds,
      task: task,
      frozenStamp: getFrozenTimestamp(task),
      frozenStampSource: getFrozenStampSource(task),
      ageBucket: getFrozenAgeBucket(task),
      originDs: task.frozenOriginDs || ds,
      originPlanTime: task.frozenOriginPlanTime || task.planTime || ''
    };
  }

  function collectFrozenEntries() {
    return Object.keys(T || {})
      .sort()
      .reduce(function (items, ds) {
        const rows = T && T[ds] ? T[ds] : [];
        rows.forEach(function (task) {
          const entry = buildFrozenEntry(ds, task);
          if (entry) {
            items.push(entry);
          }
        });
        return items;
      }, []);
  }

  function compareFrozenEntries(a, b) {
    if (frozenViewSortMode === 'schedule') {
      if (a.originDs !== b.originDs) {
        return String(a.originDs || '').localeCompare(String(b.originDs || ''));
      }
      if (a.originPlanTime !== b.originPlanTime) {
        return String(a.originPlanTime || '99:99').localeCompare(String(b.originPlanTime || '99:99'));
      }
      if (a.frozenStamp !== b.frozenStamp) {
        return b.frozenStamp - a.frozenStamp;
      }
    } else {
      if (a.frozenStamp !== b.frozenStamp) {
        return b.frozenStamp - a.frozenStamp;
      }
      if (a.originDs !== b.originDs) {
        return String(b.originDs || '').localeCompare(String(a.originDs || ''));
      }
    }
    const aCreated = parseInt(a.task && a.task.created, 10) || 0;
    const bCreated = parseInt(b.task && b.task.created, 10) || 0;
    if (aCreated !== bCreated) {
      return bCreated - aCreated;
    }
    return String(a.task && a.task.text || '').localeCompare(String(b.task && b.task.text || ''), 'zh-CN');
  }

  function matchesFrozenFilter(entry) {
    if (!entry || !entry.task) {
      return false;
    }
    if (frozenViewFilter === 'high') {
      return (entry.task.priority || 'normal') === 'high';
    }
    if (frozenViewFilter === 'repeating') {
      return !!entry.task.recurRuleId;
    }
    return true;
  }

  function countFrozenFilter(entries, filterKey) {
    return entries.filter(function (entry) {
      if (!entry || !entry.task) {
        return false;
      }
      if (filterKey === 'high') {
        return (entry.task.priority || 'normal') === 'high';
      }
      if (filterKey === 'repeating') {
        return !!entry.task.recurRuleId;
      }
      return true;
    }).length;
  }

  function buildFrozenPagerState(entries) {
    const pagerHelper = window.taskViewPager;
    const pager = pagerHelper && typeof pagerHelper.createState === 'function'
      ? pagerHelper.createState({
          items: entries,
          currentPage: frozenViewPage,
          pageSize: frozenViewPageSize,
          pageSizes: FROZEN_PAGE_SIZES,
        })
      : {
          currentPage: 1,
          totalItems: Array.isArray(entries) ? entries.length : 0,
          totalPages: 1,
          pageSize: FROZEN_PAGE_SIZES[0],
          pageSizes: FROZEN_PAGE_SIZES.slice(),
          hasPrev: false,
          hasNext: false,
          pages: [1],
          items: Array.isArray(entries) ? entries.slice(0, FROZEN_PAGE_SIZES[0]) : [],
        };

    frozenViewPage = pager.currentPage;
    frozenViewPageSize = pager.pageSize;
    return pager;
  }

  function getFrozenSceneState() {
    const allEntries = collectFrozenEntries().sort(compareFrozenEntries);
    const filteredEntries = allEntries.filter(matchesFrozenFilter);
    const pager = buildFrozenPagerState(filteredEntries);
    const latestEntries = allEntries.slice(0, 3);

    return {
      activeFilter: normalizeFrozenFilter(frozenViewFilter),
      sortMode: normalizeFrozenSortMode(frozenViewSortMode),
      totalCount: allEntries.length,
      highCount: countFrozenFilter(allEntries, 'high'),
      repeatCount: countFrozenFilter(allEntries, 'repeating'),
      todayCount: allEntries.filter(function (entry) { return entry.ageBucket === 'today'; }).length,
      weekCount: allEntries.filter(function (entry) { return entry.ageBucket === 'week'; }).length,
      earlierCount: allEntries.filter(function (entry) { return entry.ageBucket === 'earlier'; }).length,
      filteredCount: filteredEntries.length,
      entries: pager.items,
      pager: pager,
      latestEntries: latestEntries
    };
  }

  function getFrozenSceneTotalCount() {
    return collectFrozenEntries().length;
  }

  function getFrozenTaskTone(entry) {
    if (!entry || !entry.task) {
      return 'base';
    }
    if (entry.task.recurRuleId) {
      return 'repeating';
    }
    if ((entry.task.priority || 'normal') === 'high') {
      return 'high';
    }
    if (entry.originPlanTime) {
      return 'scheduled';
    }
    return 'base';
  }

  function formatFrozenDateTime(stamp) {
    if (!(stamp > 0)) {
      return {
        primary: '未记录',
        secondary: '这项任务较早被冻结'
      };
    }
    const date = new Date(stamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return {
      primary: year + '-' + month + '-' + day,
      secondary: hour + ':' + minute
    };
  }

  function buildPlanSummary(entry) {
    const task = entry && entry.task ? entry.task : null;
    const originDs = entry && entry.originDs ? entry.originDs : entry.ds;
    const originPlanTime = entry && entry.originPlanTime ? entry.originPlanTime : '';
    const dateText = typeof disp === 'function' ? disp(originDs) : originDs;
    let scheduleText = originPlanTime ? (typeof formatPlanTimeDisp === 'function' ? formatPlanTimeDisp(originPlanTime) : originPlanTime) : '全天';
    if (typeof taskRowPlainTimeText === 'function' && originPlanTime) {
      scheduleText = taskRowPlainTimeText({ planTime: originPlanTime, duration: task && task.duration || 0 }, scheduleText);
    }
    if (task && task.recurRuleId && typeof getRecurDesc === 'function') {
      const recurText = getRecurDesc(task.recurRuleId) || '重复任务';
      return {
        primary: dateText,
        secondary: scheduleText ? recurText + ' · ' + scheduleText : recurText
      };
    }
    return {
      primary: dateText,
      secondary: scheduleText || '未安排具体时间'
    };
  }

  function frozenTaskBadgeHtml(text, modifier) {
    return '<span class="frozen-task__badge frozen-task__badge--' + html(modifier || 'neutral') + '">' + html(text || '') + '</span>';
  }

  function frozenTaskMetaHtml(entry) {
    const task = entry && entry.task ? entry.task : null;
    if (!task) {
      return '';
    }
    const badges = [];
    if ((task.priority || 'normal') === 'high') {
      badges.push(frozenTaskBadgeHtml('高优先级', 'high'));
    }
    if (task.recurRuleId) {
      badges.push(frozenTaskBadgeHtml('重复任务', 'repeating'));
    }
    if (task.note) {
      badges.push(frozenTaskBadgeHtml('有备注', 'note'));
    }
    const subtaskCount = Array.isArray(task.subtasks) ? task.subtasks.length : 0;
    if (subtaskCount > 0) {
      badges.push(frozenTaskBadgeHtml(subtaskCount + ' 个子任务', 'subtasks'));
    }
    return badges.length ? '<div class="frozen-task__meta">' + badges.join('') + '</div>' : '';
  }

  function frozenFilterTabsHtml(state) {
    return [
      { key: 'all', label: '全部', count: state.totalCount },
      { key: 'high', label: '高优先', count: state.highCount },
      { key: 'repeating', label: '重复任务', count: state.repeatCount }
    ]
      .map(function (item) {
        return (
          '<button type="button" class="frozen-tabs__button' +
          (state.activeFilter === item.key ? ' is-active' : '') +
          '" onclick="setFrozenViewFilter(\'' +
          item.key +
          '\')">' +
          '<span class="frozen-tabs__label">' +
          html(item.label) +
          '</span><span class="frozen-tabs__count">' +
          item.count +
          '</span></button>'
        );
      })
      .join('');
  }

  function frozenListEmptyCopy(state) {
    if (!state.totalCount) {
      return {
        title: '当前没有已冻结任务',
        sub: '冻结后的任务会集中显示在这里，方便统一恢复和整理。'
      };
    }
    return {
      title: '当前筛选下没有匹配的冻结任务',
      sub: '可以切换上方筛选，查看其他类型的冻结任务。'
    };
  }

  function frozenEmptyIllustrationMarkup() {
    return (
      '<svg class="frozen-empty__svg" viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="110" cy="150" rx="54" ry="11" fill="rgba(129,140,248,.12)"></ellipse>' +
      '<rect x="70" y="38" width="82" height="94" rx="20" fill="white" stroke="#c7d2fe" stroke-width="6"></rect>' +
      '<path d="M90 68h42" stroke="#bfdbfe" stroke-width="6" stroke-linecap="round"></path>' +
      '<path d="M90 88h42" stroke="#bfdbfe" stroke-width="6" stroke-linecap="round"></path>' +
      '<path d="M90 108h28" stroke="#bfdbfe" stroke-width="6" stroke-linecap="round"></path>' +
      '<circle cx="162" cy="62" r="22" fill="#eef2ff"></circle>' +
      '<path d="M162 46v32" stroke="#4f46e5" stroke-width="4" stroke-linecap="round"></path>' +
      '<path d="m150 53 24 18" stroke="#4f46e5" stroke-width="4" stroke-linecap="round"></path>' +
      '<path d="m174 53-24 18" stroke="#4f46e5" stroke-width="4" stroke-linecap="round"></path>' +
      '<circle cx="54" cy="68" r="6" fill="#c7d2fe"></circle>' +
      '<circle cx="179" cy="119" r="5" fill="#bfdbfe"></circle>' +
      '</svg>'
    );
  }

  function frozenRowActionButtonHtml(action, label, iconMarkup, actionClass) {
    return (
      '<button type="button" class="frozen-row__action' +
      (actionClass ? ' ' + actionClass : '') +
      '" title="' +
      html(label) +
      '" aria-label="' +
      html(label) +
      '" onclick="' +
      action +
      '">' +
      '<span class="frozen-row__action-icon" aria-hidden="true">' +
      iconMarkup +
      '</span></button>'
    );
  }

  function frozenStatusPillHtml() {
    return '<span class="frozen-status-pill">冻结中</span>';
  }

  function frozenTaskBulletHtml(entry) {
    const isHighPriority = !!entry && !!entry.task && (entry.task.priority || 'normal') === 'high';
    return (
      '<span class="frozen-task__bullet task-priority-ring' +
      (isHighPriority ? ' task-priority-ring--high' : '') +
      '" aria-hidden="true">' +
      '<span class="tc-check">' +
      '<span class="chk-ring"></span>' +
      '</span></span>'
    );
  }

  function frozenTaskRowHtml(entry) {
    const frozenTime = formatFrozenDateTime(entry.frozenStamp);
    const planSummary = buildPlanSummary(entry);
    const titleMeta = frozenTaskMetaHtml(entry);
    const timeHint = entry.frozenStampSource === 'created' ? '未记录冻结时间，当前暂用任务创建时间展示' : '冻结时间';
    return (
      '<article class="frozen-row frozen-row--' +
      getFrozenTaskTone(entry) +
      '">' +
      '<div class="frozen-row__cell frozen-row__cell--task" data-label="任务名称">' +
      '<button type="button" class="frozen-task" onclick="openFrozenTaskDetail(\'' +
      entry.ds +
      '\',' +
      entry.task.id +
      ')">' +
      frozenTaskBulletHtml(entry) +
      '<span class="frozen-task__copy">' +
      '<strong class="frozen-task__title" title="' +
      html(entry.task.text || '') +
      '">' +
      html(entry.task.text || '') +
      '</strong>' +
      titleMeta +
      '</span></button></div>' +
      '<div class="frozen-row__cell frozen-row__cell--time" data-label="冻结时间" title="' +
      html(timeHint) +
      '">' +
      '<span class="frozen-row__primary">' +
      html(frozenTime.primary) +
      '</span><span class="frozen-row__secondary">' +
      html(frozenTime.secondary) +
      '</span></div>' +
      '<div class="frozen-row__cell frozen-row__cell--plan" data-label="原计划执行">' +
      '<span class="frozen-row__primary">' +
      html(planSummary.primary) +
      '</span><span class="frozen-row__secondary">' +
      html(planSummary.secondary) +
      '</span></div>' +
      '<div class="frozen-row__cell frozen-row__cell--status" data-label="状态">' +
      frozenStatusPillHtml() +
      '</div>' +
      '<div class="frozen-row__cell frozen-row__cell--actions" data-label="操作">' +
      frozenRowActionButtonHtml('resumeFrozenTask(' + entry.task.id + ')', '解冻任务', playIconMarkup(), 'frozen-row__action--primary') +
      '</div></article>'
    );
  }

  function frozenPagerPageButtonHtml(pageNumber, currentPage) {
    return (
      '<button type="button" class="frozen-pager__btn' +
      (pageNumber === currentPage ? ' is-active' : '') +
      '" onclick="setFrozenViewPage(' +
      pageNumber +
      ')"' +
      (pageNumber === currentPage ? ' aria-current="page"' : '') +
      '>' +
      pageNumber +
      '</button>'
    );
  }

  function frozenPagerSizeOptionsHtml(pageSize) {
    return FROZEN_PAGE_SIZES.map(function (size) {
      return (
        '<option value="' +
        size +
        '"' +
        (size === pageSize ? ' selected' : '') +
        '>' +
        size +
        '条 / 页</option>'
      );
    }).join('');
  }

  function frozenPagerHtml(state) {
    const pagerHelper = window.taskViewPager;
    if (pagerHelper && typeof pagerHelper.buildHtml === 'function') {
      return pagerHelper.buildHtml({
        pager: state && state.pager ? state.pager : null,
        pageAction: 'setFrozenViewPage',
        pageSizeAction: 'setFrozenViewPageSize',
        ariaLabel: '冻结任务分页',
        pageSizeLabel: '每页条数',
        escapeHtml: html,
      });
    }
    const pager = state && state.pager ? state.pager : null;
    if (!pager || !state.filteredCount) {
      return '';
    }

    return (
      '<footer class="frozen-pager" aria-label="冻结任务分页">' +
      '<div class="frozen-pager__group">' +
      '<button type="button" class="frozen-pager__btn frozen-pager__btn--arrow" onclick="setFrozenViewPage(' +
      (pager.currentPage - 1) +
      ')" aria-label="上一页"' +
      (pager.hasPrev ? '' : ' disabled') +
      '>' +
      pagerArrowIconMarkup('left') +
      '</button>' +
      pager.pages.map(function (pageNumber) {
        return frozenPagerPageButtonHtml(pageNumber, pager.currentPage);
      }).join('') +
      '<button type="button" class="frozen-pager__btn frozen-pager__btn--arrow" onclick="setFrozenViewPage(' +
      (pager.currentPage + 1) +
      ')" aria-label="下一页"' +
      (pager.hasNext ? '' : ' disabled') +
      '>' +
      pagerArrowIconMarkup('right') +
      '</button>' +
      '</div>' +
      '<label class="frozen-pager__size" aria-label="每页条数">' +
      '<select class="frozen-pager__size-select" onchange="setFrozenViewPageSize(this.value)" aria-label="每页条数">' +
      frozenPagerSizeOptionsHtml(pager.pageSize) +
      '</select>' +
      '<span class="frozen-pager__size-icon" aria-hidden="true">' +
      pagerChevronDownIconMarkup() +
      '</span>' +
      '</label>' +
      '</footer>'
    );
  }

  function frozenTaskTableHtml(state) {
    if (!state.filteredCount) {
      const emptyCopy = frozenListEmptyCopy(state);
      return (
        '<div class="frozen-empty">' +
        '<div class="frozen-empty__art" aria-hidden="true">' +
        frozenEmptyIllustrationMarkup() +
        '</div>' +
        '<p class="frozen-empty__title">' +
        html(emptyCopy.title) +
        '</p><p class="frozen-empty__sub">' +
        html(emptyCopy.sub) +
        '</p></div>'
      );
    }

    return (
      '<div class="frozen-table">' +
      '<div class="frozen-table__head" aria-hidden="true">' +
      '<span>任务名称</span><span>冻结时间</span><span>原计划执行</span><span>状态</span><span>操作</span>' +
      '</div>' +
      '<div class="frozen-table__body">' +
      state.entries.map(frozenTaskRowHtml).join('') +
      '</div></div>'
    );
  }

  function renderFrozenTaskScene(list, state) {
    if (!list || !state) {
      return;
    }
    list.innerHTML =
      '<section class="frozen-scene" aria-label="已冻结任务列表">' +
      '<div class="frozen-scene__toolbar">' +
      '<div class="frozen-tabs" role="tablist" aria-label="冻结任务筛选">' +
      frozenFilterTabsHtml(state) +
      '</div>' +
      '<button type="button" class="frozen-toolbar__sort" onclick="cycleFrozenViewSortMode()" title="' +
      html(getFrozenSortLabel(state.sortMode)) +
      '" aria-label="' +
      html(getFrozenSortLabel(state.sortMode)) +
      '">' +
      '<span class="frozen-toolbar__sort-icon" aria-hidden="true">' +
      calendarIconMarkup() +
      '</span><span>' +
      html(getFrozenSortLabel(state.sortMode)) +
      '</span></button>' +
      '</div>' +
      '<div class="frozen-scene__content">' +
      frozenTaskTableHtml(state) +
      frozenPagerHtml(state) +
      '</div>' +
      '</section>';
  }

  function ensureFrozenOverviewShell(root) {
    if (!root) {
      return null;
    }
    let shell = root.querySelector('.' + FROZEN_SHELL_CLASS);
    if (!shell) {
      shell = document.createElement('section');
      root.appendChild(shell);
    }
    shell.className = 'week-action-shell ' + FROZEN_SHELL_CLASS;
    shell.setAttribute('aria-label', '冻结任务侧边栏');
    return shell;
  }

  function frozenOverviewRingGradient(state) {
    const total = Math.max(1, state.todayCount + state.weekCount + state.earlierCount);
    const todayEnd = (state.todayCount / total) * 100;
    const weekEnd = todayEnd + (state.weekCount / total) * 100;
    return (
      'conic-gradient(' +
      '#3b82f6 0 ' +
      todayEnd +
      '%, ' +
      '#8b5cf6 ' +
      todayEnd +
      '% ' +
      weekEnd +
      '%, ' +
      '#cbd5e1 ' +
      weekEnd +
      '% 100%)'
    );
  }

  function frozenOverviewLegendItemHtml(count, label, tone) {
    return (
      '<div class="frozen-overview__legend-item frozen-overview__legend-item--' +
      html(tone || 'neutral') +
      '">' +
      '<span class="frozen-overview__legend-dot" aria-hidden="true"></span>' +
      '<span class="frozen-overview__legend-label">' +
      html(label || '') +
      '</span>' +
      '<strong class="frozen-overview__legend-count">' +
      html(count || 0) +
      '</strong></div>'
    );
  }

  function frozenQuickActionHtml(action, label, iconMarkup, modifierClass) {
    return (
      '<button type="button" class="frozen-side-action' +
      (modifierClass ? ' ' + modifierClass : '') +
      '" onclick="' +
      action +
      '">' +
      '<span class="frozen-side-action__icon" aria-hidden="true">' +
      iconMarkup +
      '</span><span class="frozen-side-action__label">' +
      html(label) +
      '</span></button>'
    );
  }

  function renderFrozenOverviewSidebar(state) {
    const root = document.getElementById('taskDashCol');
    if (!root) {
      return;
    }
    const shell = ensureFrozenOverviewShell(root);
    if (!shell) {
      return;
    }

    root.classList.remove('is-week-action', 'is-overdue-action', 'is-priority-action', 'is-repeat-action');
    root.classList.add('is-frozen-action');
    root.setAttribute('aria-label', '冻结任务侧边栏');

    shell.innerHTML =
      '<section class="frozen-side-card frozen-side-card--summary">' +
      '<div class="frozen-side-card__head"><span class="frozen-side-card__title">冻结任务概览</span></div>' +
      '<div class="frozen-overview__hero">' +
      '<div class="frozen-overview__ring" style="--frozen-ring-bg:' +
      frozenOverviewRingGradient(state) +
      '">' +
      '<div class="frozen-overview__ring-center"><strong>' +
      state.totalCount +
      '</strong><span>总计</span></div></div>' +
      '<div class="frozen-overview__legend">' +
      frozenOverviewLegendItemHtml(state.todayCount, '今日冻结', 'today') +
      frozenOverviewLegendItemHtml(state.weekCount, '7 天内', 'week') +
      frozenOverviewLegendItemHtml(state.earlierCount, '更早', 'earlier') +
      '</div></div>' +
      '</section>' +
      '<section class="frozen-side-card frozen-side-card--actions">' +
      '<div class="frozen-side-card__head"><span class="frozen-side-card__title">快捷操作</span></div>' +
      '<div class="frozen-side-actions">' +
      frozenQuickActionHtml('resumeAllFrozenTasks()', '批量解冻', playIconMarkup(), '') +
      frozenQuickActionHtml('clearFrozenTasks()', '清空已冻结任务', trashIconMarkup(), 'is-danger') +
      frozenQuickActionHtml('exportFrozenTasks()', '导出冻结任务', exportIconMarkup(), '') +
      '</div></section>' +
      '<section class="frozen-side-card frozen-side-card--tip">' +
      '<div class="frozen-side-card__head"><span class="frozen-side-card__title">提示</span></div>' +
      '<p class="frozen-side-tip__copy">解冻后的任务会重新回到原计划日期，并恢复到日程视图中继续跟进。</p>' +
      '<button type="button" class="frozen-side-tip__link" onclick="leaveFrozenView()">返回日程</button>' +
      '</section>';
  }

  function clearFrozenOverviewSidebar() {
    const root = document.getElementById('taskDashCol');
    if (!root) {
      return;
    }
    root.classList.remove('is-frozen-action');
    const shell = root.querySelector('.' + FROZEN_SHELL_CLASS);
    if (shell && shell.parentNode) {
      shell.parentNode.removeChild(shell);
    }
  }

  function syncFrozenBodyState(active) {
    if (!document.body) {
      return;
    }
    document.body.classList.toggle(FROZEN_BODY_CLASS, !!active);
  }

  function closeFrozenTaskToolbar() {
    const sortDropdown = document.getElementById('sortDropdown');
    const tagDropdown = document.getElementById('tagDropdown');
    const multiBtn = document.getElementById('multiSelectBtn');
    const multiBar = document.getElementById('multiBar');
    const batchBar = document.getElementById('batchBar');
    const listPanel = document.querySelector('#taskMode .list-panel');

    if (sortDropdown) {
      sortDropdown.classList.remove('show');
    }
    if (tagDropdown) {
      tagDropdown.classList.remove('show');
    }
    if (batchBar && document.activeElement && batchBar.contains(document.activeElement)) {
      try {
        document.activeElement.blur();
      } catch (error) {}
    }
    if (typeof multiSelect !== 'undefined') {
      multiSelect = false;
    }
    if (typeof selectedIds !== 'undefined' && selectedIds && selectedIds.clear) {
      selectedIds.clear();
    }
    if (multiBtn) {
      multiBtn.classList.remove('on');
    }
    if (multiBar) {
      multiBar.classList.remove('show');
    }
    if (listPanel) {
      listPanel.classList.remove('list-panel--multi');
    }
    if (typeof closeTaskMoreFloat === 'function') {
      closeTaskMoreFloat();
    }
    if (typeof closeSidebar === 'function') {
      closeSidebar();
    }
  }

  function renderFrozenModeFrame() {
    const active = isFrozenMode();
    let state = null;
    syncFrozenBodyState(active);
    if (active) {
      closeFrozenTaskToolbar();
      state = getFrozenSceneState();
      renderFrozenTaskScene(document.getElementById('tList'), state);
      renderFrozenOverviewSidebar(state);
    } else {
      clearFrozenOverviewSidebar();
    }
    ensureFrozenHeaderState(state);
    return state;
  }

  function rerenderFrozenViews() {
    if (typeof rT === 'function') {
      rT();
      return;
    }
    renderFrozenModeFrame();
  }

  function commitFrozenViewChanges(message) {
    if (typeof rCal === 'function') {
      rCal();
    }
    if (typeof rKanban === 'function') {
      rKanban();
    }
    if (typeof save === 'function') {
      save();
    }
    rerenderFrozenViews();
    if (typeof refreshGlobalSideNav === 'function') {
      refreshGlobalSideNav();
    }
    if (typeof toast === 'function' && message) {
      toast(message);
    }
  }

  function findFrozenEntry(taskId) {
    if (typeof findTaskEntryById === 'function') {
      return findTaskEntryById(taskId);
    }
    const id = +taskId;
    if (!Number.isFinite(id)) {
      return null;
    }
    for (const ds in T) {
      const tasks = T[ds] || [];
      for (let i = 0; i < tasks.length; i += 1) {
        const task = tasks[i];
        if (task && +task.id === id) {
          return { ds: ds, task: task, index: i, tasks: tasks };
        }
      }
    }
    return null;
  }

  function unfreezeEntry(entry) {
    if (!entry || !entry.task) {
      return false;
    }
    if (typeof setTaskFrozenState === 'function') {
      setTaskFrozenState(entry.task, false, entry.ds);
    } else {
      entry.task.frozen = false;
      entry.task.frozenUntil = '';
    }
    if (typeof syncToRule === 'function') {
      syncToRule(entry.task);
    }
    return true;
  }

  function exportFrozenEntries(entries) {
    const payload = (entries || []).map(function (entry) {
      const planSummary = buildPlanSummary(entry);
      return {
        id: entry.task.id,
        text: entry.task.text || '',
        date: entry.ds,
        frozenAt: entry.frozenStamp || 0,
        frozenAtDisplay: formatFrozenDateTime(entry.frozenStamp).primary + ' ' + formatFrozenDateTime(entry.frozenStamp).secondary,
        priority: entry.task.priority || 'normal',
        originDate: entry.originDs,
        originPlanTime: entry.originPlanTime || '',
        originDisplay: planSummary.primary + ' ' + planSummary.secondary,
        recurring: !!entry.task.recurRuleId,
        tags: Array.isArray(entry.task.tags) ? entry.task.tags.slice() : []
      };
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'frozen-tasks-' + todayKey() + '.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 120);
  }

  function hookRender() {
    if (typeof rT !== 'function' || window.__frozenViewRTPatched) {
      return;
    }
    window.__frozenViewRTPatched = true;
    const originalRT = rT;
    rT = function () {
      const result = originalRT.apply(this, arguments);
      renderFrozenModeFrame();
      return result;
    };
  }

  window.setFrozenViewFilter = function (filter) {
    const nextFilter = normalizeFrozenFilter(filter);
    if (nextFilter === frozenViewFilter) {
      return;
    }
    frozenViewFilter = nextFilter;
    frozenViewPage = 1;
    persistFrozenFilter(frozenViewFilter);
    rerenderFrozenViews();
  };

  window.cycleFrozenViewSortMode = function () {
    const currentIndex = FROZEN_SORT_MODES.indexOf(normalizeFrozenSortMode(frozenViewSortMode));
    frozenViewSortMode = FROZEN_SORT_MODES[(currentIndex + 1) % FROZEN_SORT_MODES.length];
    persistFrozenSortMode(frozenViewSortMode);
    rerenderFrozenViews();
  };

  window.jumpFrozenTaskDate = function (ds, taskId) {
    if (typeof pick === 'function') {
      pick(ds);
    }
    if (typeof openTaskDrawer === 'function') {
      setTimeout(function () {
        openTaskDrawer(taskId);
      }, 40);
    }
  };

  window.openFrozenTaskDetail = function (ds, taskId) {
    window.jumpFrozenTaskDate(ds, taskId);
  };

  window.resumeFrozenTask = function (taskId) {
    const entry = findFrozenEntry(taskId);
    if (!entry || !entry.task || !entry.task.frozen) {
      return;
    }
    if (!unfreezeEntry(entry)) {
      return;
    }
    commitFrozenViewChanges('🔥 任务已解冻');
  };

  window.resumeAllFrozenTasks = function () {
    const entries = collectFrozenEntries();
    if (!entries.length) {
      if (typeof toast === 'function') {
        toast('当前没有已冻结任务');
      }
      return;
    }
    if (!window.confirm('确定要解冻当前所有冻结任务吗？')) {
      return;
    }
    if (typeof pushUndo === 'function') {
      pushUndo('批量解冻');
    }
    entries.forEach(function (entry) {
      unfreezeEntry(entry);
    });
    commitFrozenViewChanges('🔥 已批量解冻冻结任务');
  };

  window.clearFrozenTasks = function () {
    const entries = collectFrozenEntries();
    if (!entries.length) {
      if (typeof toast === 'function') {
        toast('当前没有已冻结任务');
      }
      return;
    }
    if (!window.confirm('确定要清空所有已冻结任务吗？你仍可通过撤销恢复。')) {
      return;
    }
    if (typeof pushUndo === 'function') {
      pushUndo('清空已冻结任务');
    }
    Object.keys(T || {}).forEach(function (ds) {
      T[ds] = (T[ds] || []).filter(function (task) {
        return !task.frozen;
      });
      if (!T[ds].length) {
        delete T[ds];
      }
    });
    commitFrozenViewChanges('🗑️ 已清空冻结任务');
  };

  window.exportFrozenTasks = function () {
    const entries = collectFrozenEntries().sort(compareFrozenEntries);
    if (!entries.length) {
      if (typeof toast === 'function') {
        toast('当前没有可导出的冻结任务');
      }
      return;
    }
    exportFrozenEntries(entries);
    if (typeof toast === 'function') {
      toast('📦 已导出冻结任务');
    }
  };

  window.leaveFrozenView = function () {
    if (typeof goToday === 'function') {
      goToday();
    }
  };

  window.setFrozenViewPage = function (page) {
    const nextPage = parseInt(page, 10);
    if (!Number.isFinite(nextPage)) {
      return;
    }
    frozenViewPage = Math.max(1, nextPage);
    rerenderFrozenViews();
  };

  window.setFrozenViewPageSize = function (size) {
    const nextSize = normalizeFrozenPageSize(size);
    if (nextSize === frozenViewPageSize) {
      return;
    }
    frozenViewPageSize = nextSize;
    frozenViewPage = 1;
    persistFrozenPageSize(frozenViewPageSize);
    rerenderFrozenViews();
  };

  window.getFrozenSceneTotalCount = getFrozenSceneTotalCount;

  hookRender();
  renderFrozenModeFrame();
  if (typeof window.refreshGlobalSideNav === 'function') {
    window.refreshGlobalSideNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      hookRender();
      renderFrozenModeFrame();
      if (typeof window.refreshGlobalSideNav === 'function') {
        window.refreshGlobalSideNav();
      }
    });
  }

  window.addEventListener('hashchange', renderFrozenModeFrame);
  window.addEventListener('popstate', renderFrozenModeFrame);
  window.addEventListener('resize', renderFrozenModeFrame);
})();
