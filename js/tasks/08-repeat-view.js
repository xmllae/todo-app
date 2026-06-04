(function () {
  if (window.__repeatViewBound) {
    return;
  }
  window.__repeatViewBound = true;

  const REPEAT_MODE = 'repeat-view';
  const REPEAT_CLASS = 'task-mode--repeat-view';
  const REPEAT_NAV_CLASS = 'date-nav--repeat-view';
  const REPEAT_SHELL_CLASS = 'repeat-view-shell';
  const REPEAT_TAB_STORAGE_KEY = 'todo_repeat_view_tab_v1';
  const REPEAT_PAGE_SIZE_STORAGE_KEY = 'todo_repeat_view_page_size_v1';
  const REPEAT_SEARCH_WINDOW_DAYS = 730;
  const REPEAT_TABS = ['all', 'daily', 'weekly', 'monthly'];
  const REPEAT_PAGE_SIZES = [10, 20, 50];

  let repeatViewTab = readSavedRepeatTab();
  let repeatViewPage = 1;
  let repeatViewPageSize = readSavedRepeatPageSize();

  function html(value) {
    if (typeof esc === 'function') {
      return esc(value);
    }
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  function jsArgAttr(value) {
    return html(JSON.stringify(value == null ? '' : String(value)));
  }

  function createTaskViewPagerHelper() {
    function normalizePageSize(size, pageSizes) {
      const allowedSizes = Array.isArray(pageSizes) && pageSizes.length ? pageSizes : [10, 20, 50];
      const pageSize = parseInt(size, 10);
      return allowedSizes.indexOf(pageSize) >= 0 ? pageSize : allowedSizes[0];
    }

    function readStoredPageSize(storageKey, pageSizes) {
      try {
        return normalizePageSize(localStorage.getItem(storageKey), pageSizes);
      } catch (error) {
        return normalizePageSize('', pageSizes);
      }
    }

    function persistPageSize(storageKey, size, pageSizes) {
      try {
        localStorage.setItem(storageKey, String(normalizePageSize(size, pageSizes)));
      } catch (error) {}
    }

    function buildVisiblePages(currentPage, totalPages) {
      const visibleCount = 3;
      const pages = [];
      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages, start + visibleCount - 1);
      if (end - start < visibleCount - 1) {
        start = Math.max(1, end - visibleCount + 1);
      }
      for (let page = start; page <= end; page += 1) {
        pages.push(page);
      }
      return pages;
    }

    function createState(options) {
      const config = options || {};
      const items = Array.isArray(config.items) ? config.items : [];
      const pageSizes = Array.isArray(config.pageSizes) && config.pageSizes.length ? config.pageSizes.slice() : [10, 20, 50];
      const pageSize = normalizePageSize(config.pageSize, pageSizes);
      const totalItems = items.length;
      const totalPages = Math.max(1, Math.ceil(Math.max(totalItems, 1) / pageSize));
      const currentPage = Math.min(Math.max(1, parseInt(config.currentPage, 10) || 1), totalPages);
      const startIndex = totalItems ? (currentPage - 1) * pageSize : 0;
      const endIndex = Math.min(startIndex + pageSize, totalItems);

      return {
        currentPage: currentPage,
        totalItems: totalItems,
        totalPages: totalPages,
        pageSize: pageSize,
        pageSizes: pageSizes,
        hasPrev: currentPage > 1,
        hasNext: currentPage < totalPages,
        pages: buildVisiblePages(currentPage, totalPages),
        items: items.slice(startIndex, endIndex),
      };
    }

    function pagerArrowIconMarkup(direction) {
      const points = direction === 'left' ? '14.5 6.5 9 12 14.5 17.5' : '9.5 6.5 15 12 9.5 17.5';
      return (
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<polyline points="' + points + '"></polyline>' +
        '</svg>'
      );
    }

    function pagerChevronDownIconMarkup() {
      return (
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<polyline points="7 10 12 15 17 10"></polyline>' +
        '</svg>'
      );
    }

    function escapePagerText(value, escapeFn) {
      return typeof escapeFn === 'function' ? escapeFn(value) : html(value);
    }

    function buildHtml(options) {
      const config = options || {};
      const pager = config.pager;
      const pageAction = String(config.pageAction || '');
      const pageSizeAction = String(config.pageSizeAction || '');
      const ariaLabel = config.ariaLabel || '分页';
      const pageSizeLabel = config.pageSizeLabel || '每页条数';

      if (!pager || !pager.totalItems) {
        return '';
      }

      const pageButtons = pager.pages
        .map(function (pageNumber) {
          return (
            '<button type="button" class="task-view-pager__btn' +
            (pageNumber === pager.currentPage ? ' is-active' : '') +
            '" onclick="' +
            pageAction +
            '(' +
            pageNumber +
            ')"' +
            (pageNumber === pager.currentPage ? ' aria-current="page"' : '') +
            '>' +
            pageNumber +
            '</button>'
          );
        })
        .join('');

      const pageSizeOptions = pager.pageSizes
        .map(function (size) {
          return (
            '<option value="' +
            size +
            '"' +
            (size === pager.pageSize ? ' selected' : '') +
            '>' +
            size +
            '条 / 页</option>'
          );
        })
        .join('');

      return (
        '<footer class="task-view-pager" aria-label="' +
        escapePagerText(ariaLabel, config.escapeHtml) +
        '">' +
        '<div class="task-view-pager__group">' +
        '<button type="button" class="task-view-pager__btn task-view-pager__btn--arrow" onclick="' +
        pageAction +
        '(' +
        (pager.currentPage - 1) +
        ')" aria-label="上一页"' +
        (pager.hasPrev ? '' : ' disabled') +
        '>' +
        pagerArrowIconMarkup('left') +
        '</button>' +
        pageButtons +
        '<button type="button" class="task-view-pager__btn task-view-pager__btn--arrow" onclick="' +
        pageAction +
        '(' +
        (pager.currentPage + 1) +
        ')" aria-label="下一页"' +
        (pager.hasNext ? '' : ' disabled') +
        '>' +
        pagerArrowIconMarkup('right') +
        '</button>' +
        '</div>' +
        '<label class="task-view-pager__size" aria-label="' +
        escapePagerText(pageSizeLabel, config.escapeHtml) +
        '">' +
        '<select class="task-view-pager__size-select" onchange="' +
        pageSizeAction +
        '(this.value)" aria-label="' +
        escapePagerText(pageSizeLabel, config.escapeHtml) +
        '">' +
        pageSizeOptions +
        '</select>' +
        '<span class="task-view-pager__size-icon" aria-hidden="true">' +
        pagerChevronDownIconMarkup() +
        '</span>' +
        '</label>' +
        '</footer>'
      );
    }

    return {
      buildHtml: buildHtml,
      createState: createState,
      normalizePageSize: normalizePageSize,
      persistPageSize: persistPageSize,
      readStoredPageSize: readStoredPageSize,
    };
  }

  // Repeat view always loads before frozen view, so we bootstrap the shared pager
  // here to keep both task modes on one implementation without another runtime hop.
  function getTaskViewPager() {
    if (
      !window.taskViewPager ||
      typeof window.taskViewPager.buildHtml !== 'function' ||
      typeof window.taskViewPager.createState !== 'function'
    ) {
      window.taskViewPager = createTaskViewPagerHelper();
    }
    return window.taskViewPager;
  }

  function isRepeatMode() {
    return typeof getTaskQuickMode === 'function' && getTaskQuickMode() === REPEAT_MODE;
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
    return typeof fd === 'function' ? fd(now) : '';
  }

  function normalizeRepeatTab(tab) {
    return REPEAT_TABS.indexOf(tab) >= 0 ? tab : 'all';
  }

  function readSavedRepeatTab() {
    try {
      return normalizeRepeatTab(localStorage.getItem(REPEAT_TAB_STORAGE_KEY));
    } catch (error) {
      return 'all';
    }
  }

  function persistRepeatTab(tab) {
    try {
      localStorage.setItem(REPEAT_TAB_STORAGE_KEY, normalizeRepeatTab(tab));
    } catch (error) {}
  }

  function normalizeRepeatPageSize(size) {
    return getTaskViewPager().normalizePageSize(size, REPEAT_PAGE_SIZES);
  }

  function readSavedRepeatPageSize() {
    return getTaskViewPager().readStoredPageSize(REPEAT_PAGE_SIZE_STORAGE_KEY, REPEAT_PAGE_SIZES);
  }

  function persistRepeatPageSize(size) {
    getTaskViewPager().persistPageSize(REPEAT_PAGE_SIZE_STORAGE_KEY, size, REPEAT_PAGE_SIZES);
  }

  function clearRepeatHeaderToolsHost() {
    const dateNav = getDateNav();
    if (!dateNav) {
      return;
    }
    const host = dateNav.querySelector('.repeat-header-tools');
    if (host && host.parentNode) {
      host.parentNode.removeChild(host);
    }
  }

  function bindRepeatTitleClickGuard(dateNav) {
    if (!dateNav || dateNav.dataset.repeatClickGuardBound) {
      return;
    }
    const titleWrap = dateNav.querySelector('h3');
    if (!titleWrap) {
      return;
    }
    dateNav.dataset.repeatClickGuardBound = '1';
    titleWrap.addEventListener(
      'click',
      function (event) {
        if (!isRepeatMode()) {
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true
    );
  }

  function addDays(ds, offset) {
    const base = typeof parseDS === 'function' ? parseDS(ds) : null;
    if (!base || Number.isNaN(base.getTime())) {
      return '';
    }
    const date = new Date(base);
    date.setDate(base.getDate() + offset);
    return fd(date);
  }

  function getDayOffset(ds) {
    try {
      const base = parseDS(todayKey());
      const target = parseDS(ds);
      if (!base || !target || Number.isNaN(base.getTime()) || Number.isNaN(target.getTime())) {
        return 0;
      }
      const baseDate = new Date(base.getFullYear(), base.getMonth(), base.getDate()).getTime();
      const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
      return Math.round((targetDate - baseDate) / 86400000);
    } catch (error) {
      return 0;
    }
  }

  function getWeekdayText(ds) {
    const parsed = typeof parseDS === 'function' ? parseDS(ds) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) {
      return '';
    }
    return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][parsed.getDay()] || '';
  }

  function getMonthDayText(ds) {
    const parsed = typeof parseDS === 'function' ? parseDS(ds) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) {
      return String(ds || '');
    }
    return parsed.getMonth() + 1 + '/' + parsed.getDate();
  }

  function getChineseDateText(ds) {
    const parsed = typeof parseDS === 'function' ? parseDS(ds) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) {
      return String(ds || '');
    }
    return parsed.getMonth() + 1 + '月' + parsed.getDate() + '日';
  }

  function buildOccurrenceLabel(ds, planTime, kind) {
    if (!ds) {
      return kind === 'last' ? '尚未执行' : '未安排';
    }
    const offset = getDayOffset(ds);
    const timeText = planTime ? formatPlanTimeDisp(planTime) : '';
    const withTime = function(baseLabel) {
      if (typeof joinRecurringSummaryAndTime === 'function') {
        return joinRecurringSummaryAndTime(baseLabel, timeText);
      }
      return timeText ? baseLabel + ' (' + timeText + ')' : baseLabel;
    };
    if (offset === 0) {
      return withTime('今天');
    }
    if (offset === 1) {
      return withTime('明天');
    }
    if (offset === -1) {
      return withTime('昨天');
    }
    if (Math.abs(offset) <= 6) {
      return withTime(getWeekdayText(ds) + ' ' + getMonthDayText(ds));
    }
    return withTime(getChineseDateText(ds));
  }

  function matchesRepeatRuleDate(rule, ds) {
    if (!rule || !ds || !rule.startDate || ds < rule.startDate) {
      return false;
    }
    const parsed = typeof parseDS === 'function' ? parseDS(ds) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) {
      return false;
    }
    const weekday = parsed.getDay();
    const dayOfMonth = parsed.getDate();
    const lastDayOfMonth = new Date(parsed.getFullYear(), parsed.getMonth() + 1, 0).getDate();
    if (typeof doesRecurringRuleMatchDate !== 'function') {
      return false;
    }
    if (!doesRecurringRuleMatchDate(rule, weekday, dayOfMonth, lastDayOfMonth)) {
      return false;
    }
    return typeof shouldSkipRecurringDate === 'function' ? !shouldSkipRecurringDate(rule, weekday) : true;
  }

  function findNextRepeatDate(rule, startDs) {
    if (!rule || !startDs) {
      return '';
    }
    const firstDate = rule.startDate && rule.startDate > startDs ? rule.startDate : startDs;
    for (let offset = 0; offset <= REPEAT_SEARCH_WINDOW_DAYS; offset += 1) {
      const currentDs = addDays(firstDate, offset);
      if (!currentDs) {
        break;
      }
      if (matchesRepeatRuleDate(rule, currentDs)) {
        return currentDs;
      }
    }
    return '';
  }

  function getRepeatRuleCategory(rule) {
    if (!rule) {
      return 'monthly';
    }
    if (rule.type === 'daily') {
      return 'daily';
    }
    if (rule.type === 'weekly') {
      return 'weekly';
    }
    return 'monthly';
  }

  function getRepeatRuleTypeLabel(rule) {
    const category = getRepeatRuleCategory(rule);
    if (category === 'daily') {
      return '每日';
    }
    if (category === 'weekly') {
      return '每周';
    }
    return '每月';
  }

  function getRepeatRuleDetail(rule) {
    if (!rule) {
      return '';
    }
    if (rule.type === 'daily') {
      return rule.planTime ? formatPlanTimeDisp(rule.planTime) : '全天';
    }
    if (rule.type === 'weekly') {
      const weekdayLabels = Array.isArray(rule.advWeeklyDays) && rule.advWeeklyDays.length
        ? rule.advWeeklyDays.map(function (item) {
            return '周' + item;
          })
        : (rule.weekdays || []).map(function (day) {
            return '周' + ((typeof WD !== 'undefined' && WD[day]) || day);
          });
      if (!weekdayLabels.length) {
        return '未设置';
      }
      return weekdayLabels.slice(0, 2).join(' / ') + (weekdayLabels.length > 2 ? ' +' + (weekdayLabels.length - 2) : '');
    }
    const monthLabels = Array.isArray(rule.monthDays) && rule.monthDays.length
      ? rule.monthDays.map(function (item) {
          return item + '号';
        })
      : rule.monthDay != null
        ? [rule.monthDay + '号']
        : [];
    if (rule.monthlyLastDay) {
      monthLabels.push('月底');
    }
    return monthLabels.slice(0, 2).join(' / ') || '未设置';
  }

  function getRepeatRuleTooltip(rule) {
    if (!rule) {
      return '';
    }
    if (typeof getRecurDesc === 'function') {
      return getRecurDesc(rule.id) || '';
    }
    return '';
  }

  function getRepeatRuleInlineLabel(entry) {
    if (!entry || !entry.rule) {
      return '重复';
    }
    const rule = entry.rule;
    const baseLabel = (typeof getRecurDesc === 'function' ? getRecurDesc(rule.id) : '') || entry.detailLabel || '重复';
    const timeLabel = rule.planTime ? formatPlanTimeDisp(rule.planTime) : '';
    if (!timeLabel || baseLabel.indexOf(timeLabel) >= 0) {
      return baseLabel;
    }
    if (typeof joinRecurringSummaryAndTime === 'function') {
      return joinRecurringSummaryAndTime(baseLabel, timeLabel);
    }
    return baseLabel + ' (' + timeLabel + ')';
  }

  function getRepeatEntryTone(entry) {
    if (!entry || !entry.rule) {
      return 'normal';
    }
    if (!entry.rule.active) {
      return 'paused';
    }
    if (entry.nextOffset === 0) {
      return 'today';
    }
    if (entry.nextOffset === 1) {
      return 'soon';
    }
    return 'normal';
  }

  function getRepeatRuleDisplayLabelTop(entry) {
    if (!entry || !entry.rule) {
      return '重复';
    }
    const rule = entry.rule;
    const summary = ((typeof getRecurDesc === 'function' ? getRecurDesc(rule.id) : '') || '').trim();
    if (summary) {
      return summary;
    }
    if (entry.category === 'daily') {
      return entry.typeLabel || '每日';
    }
    if (entry.detailLabel) {
      return entry.typeLabel && entry.typeLabel !== entry.detailLabel
        ? entry.typeLabel + ' ' + entry.detailLabel
        : entry.detailLabel;
    }
    return entry.typeLabel || '重复';
  }

  function getRepeatRuleDisplayTimeTop(entry) {
    if (!entry || !entry.rule || !entry.rule.planTime) {
      return '';
    }
    return formatPlanTimeDisp(entry.rule.planTime);
  }

  function buildRepeatRuleMetaMarkup(ruleLabel, ruleTimeLabel) {
    const summary = String(ruleLabel || '').trim();
    const timeText = String(ruleTimeLabel || '').trim();
    const combinedText = typeof joinRecurringSummaryAndTime === 'function'
      ? joinRecurringSummaryAndTime(summary, timeText)
      : (summary && timeText ? summary + ' (' + timeText + ')' : (summary || timeText));

    if (typeof buildRecurringMetaTextHtml === 'function') {
      return {
        title: combinedText,
        html:
          '<span class="repeat-rule__meta-text task-recur-badge-txt">' +
          buildRecurringMetaTextHtml(summary, timeText) +
          '</span>'
      };
    }

    return {
      title: combinedText,
      html:
        '<span class="repeat-rule__meta-text">' +
        html(combinedText) +
        '</span>'
    };
  }

  function buildRepeatEntry(rule) {
    if (!rule) {
      return null;
    }
    const today = todayKey();
    const nextDs = findNextRepeatDate(rule, today);
    const lastDs = '';
    const category = getRepeatRuleCategory(rule);
    const nextOffset = nextDs ? getDayOffset(nextDs) : Number.POSITIVE_INFINITY;
    const entry = {
      rule: rule,
      category: category,
      typeLabel: getRepeatRuleTypeLabel(rule),
      detailLabel: getRepeatRuleDetail(rule),
      tooltip: getRepeatRuleTooltip(rule),
      nextDs: nextDs,
      nextLabel: buildOccurrenceLabel(nextDs, rule.planTime || '', 'next'),
      nextOffset: nextOffset,
      lastLabel: lastDs ? buildOccurrenceLabel(lastDs, rule.planTime || '', 'last') : (rule.startDate && rule.startDate > today ? '尚未开始' : '尚未执行'),
      statusKey: rule.active ? 'active' : 'paused',
      statusLabel: rule.active ? '进行中' : '已暂停',
      tone: getRepeatEntryTone({ rule: rule, nextOffset: nextOffset }),
    };
    entry.ruleLabel = getRepeatRuleDisplayLabelTop(entry);
    entry.ruleTimeLabel = getRepeatRuleDisplayTimeTop(entry);
    return entry;
  }

  function compareNextDate(a, b) {
    const aHasNext = !!a.nextDs;
    const bHasNext = !!b.nextDs;
    if (aHasNext && !bHasNext) {
      return -1;
    }
    if (!aHasNext && bHasNext) {
      return 1;
    }
    if (a.nextDs !== b.nextDs) {
      return String(a.nextDs || '').localeCompare(String(b.nextDs || ''));
    }
    const aTime = String(a.rule.planTime || '99:99');
    const bTime = String(b.rule.planTime || '99:99');
    if (aTime !== bTime) {
      return aTime.localeCompare(bTime);
    }
    return String(a.rule.text || '').localeCompare(String(b.rule.text || ''), 'zh-CN');
  }

  function compareRepeatEntries(a, b) {
    if (a.statusKey !== b.statusKey) {
      return a.statusKey === 'active' ? -1 : 1;
    }
    return compareNextDate(a, b);
  }

  function collectRepeatEntries() {
    if (!Array.isArray(recurRules) || !recurRules.length) {
      return [];
    }
    return recurRules
      .map(buildRepeatEntry)
      .filter(Boolean)
      .sort(compareRepeatEntries);
  }

  function filterRepeatEntries(entries) {
    return entries.filter(function (entry) {
      if (repeatViewTab !== 'all' && entry.category !== repeatViewTab) {
        return false;
      }
      return true;
    });
  }

  function getRepeatSceneState() {
    const entries = collectRepeatEntries();
    const filteredEntries = filterRepeatEntries(entries);
    const pager = buildRepeatPagerState(filteredEntries);
    const sidebarStats = getRepeatSidebarStats();

    return {
      activeTab: normalizeRepeatTab(repeatViewTab),
      totalCount: entries.length,
      dailyCount: entries.filter(function (entry) { return entry.category === 'daily'; }).length,
      weeklyCount: entries.filter(function (entry) { return entry.category === 'weekly'; }).length,
      monthlyCount: entries.filter(function (entry) { return entry.category === 'monthly'; }).length,
      activeCount: entries.filter(function (entry) { return entry.statusKey === 'active'; }).length,
      pausedCount: entries.filter(function (entry) { return entry.statusKey === 'paused'; }).length,
      completedCount: 0,
      filteredCount: filteredEntries.length,
      entries: pager.items,
      pager: pager,
      sidebarStats: sidebarStats,
    };
  }

  function getRepeatSceneTotalCount() {
    return collectRepeatEntries().length;
  }

  function buildRepeatPagerState(entries) {
    const pager = getTaskViewPager().createState({
      items: entries,
      currentPage: repeatViewPage,
      pageSize: repeatViewPageSize,
      pageSizes: REPEAT_PAGE_SIZES,
    });

    repeatViewPage = pager.currentPage;
    repeatViewPageSize = pager.pageSize;
    return pager;
  }

  function repeatLoopIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M17 1l4 4-4 4"></path>' +
      '<path d="M3 11V9a4 4 0 0 1 4-4h14"></path>' +
      '<path d="M7 23l-4-4 4-4"></path>' +
      '<path d="M21 13v2a4 4 0 0 1-4 4H3"></path>' +
      '</svg>'
    );
  }

  function repeatRuleMetaIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M23 4v6h-6"></path>' +
      '<path d="M1 20v-6h6"></path>' +
      '<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>' +
      '<path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>' +
      '</svg>'
    );
  }

  function pauseIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<rect x="6" y="5" width="4.2" height="14" rx="1.2"></rect>' +
      '<rect x="13.8" y="5" width="4.2" height="14" rx="1.2"></rect>' +
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

  function trashIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M3 6h18"></path>' +
      '<path d="M8 6V4.8c0-.66.54-1.2 1.2-1.2h5.6c.66 0 1.2.54 1.2 1.2V6"></path>' +
      '<path d="M6.8 6l.8 13.2c.05.74.66 1.3 1.4 1.3h6c.74 0 1.35-.56 1.4-1.3L17.2 6"></path>' +
      '<line x1="10" y1="10" x2="10" y2="17"></line>' +
      '<line x1="14" y1="10" x2="14" y2="17"></line>' +
      '</svg>'
    );
  }

  function chevronsLeftIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<polyline points="13 17 8 12 13 7"></polyline>' +
      '<polyline points="18 17 13 12 18 7"></polyline>' +
      '</svg>'
    );
  }

  function calendarClockIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="3" y="5" width="18" height="16" rx="3"></rect>' +
      '<path d="M8 3v4"></path>' +
      '<path d="M16 3v4"></path>' +
      '<path d="M3 10h18"></path>' +
      '<path d="M12 13v3l2 1"></path>' +
      '<circle cx="12" cy="16" r="3.5"></circle>' +
      '</svg>'
    );
  }

  function trendArcIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M4 17l4-4 3 3 6-7"></path>' +
      '<path d="M17 9h3v3"></path>' +
      '</svg>'
    );
  }

  function streakFlameIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 3c2 2.3 3.2 4.1 3.2 6.1 0 1.7-.8 3-2.3 4.3-.9.8-1.3 1.6-1.3 2.6 0 1.6 1.2 2.8 2.9 2.8 3.2 0 5.5-2.6 5.5-6.1 0-3.6-2-6.8-6-9.7z"></path>' +
      '<path d="M9.4 10.8C6.8 12.8 5 15.2 5 18.1 5 20.8 7 23 10.1 23c2.5 0 4.9-1.8 4.9-4.8 0-2.2-1.3-3.8-3.3-5.2"></path>' +
      '</svg>'
    );
  }

  function repeatSideHeadActionHtml() {
    return (
      '<button type="button" class="repeat-side-card__head-action" ' +
      'onclick="leaveRepeatTaskView()" aria-label="返回今日日程" title="返回今日日程">' +
      '<span class="repeat-side-card__head-action-icon" aria-hidden="true">' +
      chevronsLeftIconMarkup() +
      '</span></button>'
    );
  }

  function repeatStatItemHtml(kind, iconMarkup, title, sub, value) {
    return (
      '<div class="repeat-stats__item repeat-stats__item--' +
      html(kind || 'neutral') +
      '">' +
      '<span class="repeat-stats__icon" aria-hidden="true">' +
      iconMarkup +
      '</span>' +
      '<span class="repeat-stats__copy">' +
      '<strong>' +
      html(title || '') +
      '</strong>' +
      '<span>' +
      html(sub || '') +
      '</span></span>' +
      '<strong class="repeat-stats__value">' +
      html(value || '') +
      '</strong></div>'
    );
  }

  function repeatRowActionButtonHtml(action, ruleId, label, iconMarkup, modifierClass) {
    return (
      '<button type="button" class="repeat-row-actions__btn' +
      (modifierClass ? ' ' + modifierClass : '') +
      '" data-repeat-action="' +
      html(action || '') +
      '" data-rule-id="' +
      html(ruleId || '') +
      '" title="' +
      html(label || '') +
      '" aria-label="' +
      html(label || '') +
      '">' +
      '<span class="repeat-row-actions__icon" aria-hidden="true">' +
      iconMarkup +
      '</span></button>'
    );
  }

  function repeatRowActionsHtml(entry) {
    const rule = entry && entry.rule ? entry.rule : null;
    const ruleId = rule ? rule.id : '';
    const toggleLabel = rule && rule.active ? '暂停重复任务' : '开始重复任务';

    return (
      '<div class="repeat-row-actions">' +
      repeatRowActionButtonHtml(
        'toggle',
        ruleId,
        toggleLabel,
        rule && rule.active ? pauseIconMarkup() : playIconMarkup()
      ) +
      repeatRowActionButtonHtml('delete', ruleId, '删除重复任务', trashIconMarkup(), 'repeat-row-actions__btn--danger') +
      '</div>'
    );
  }

  function renderRepeatTitle(state) {
    const title = getTitleHost();
    if (!title || !state) {
      return;
    }
    clearTitleMotion(title);
    title.innerHTML =
      '<span class="repeat-title">' +
      '<span class="repeat-title__icon" aria-hidden="true">' +
      repeatLoopIconMarkup() +
      '</span>' +
      '<span class="repeat-title__copy">' +
      '<span class="repeat-title__main">重复任务</span>' +
      '<span class="repeat-title__sub">共 ' +
      state.totalCount +
      ' 个重复任务</span>' +
      '</span></span>';
    title.dataset.renderKey = REPEAT_MODE + '|' + state.totalCount;
    title.dataset.lastDs = REPEAT_MODE;
    title.classList.remove('is-week-scope', 'is-range-offset', 'is-relative', 'is-plain-date', 'is-overdue-scope');
    title.classList.add('is-repeat-scope');
  }

  function clearRepeatTitle() {
    const title = getTitleHost();
    if (!title) {
      return;
    }
    title.classList.remove('is-repeat-scope');
  }

  function ensureRepeatHeaderState(state) {
    const taskMode = getTaskMode();
    const dateNav = getDateNav();
    if (taskMode) {
      taskMode.classList.toggle(REPEAT_CLASS, !!state);
    }
    if (dateNav) {
      dateNav.classList.toggle(REPEAT_NAV_CLASS, !!state);
      bindRepeatTitleClickGuard(dateNav);
    }
    if (!state) {
      clearRepeatTitle();
      clearRepeatHeaderToolsHost();
      return;
    }
    renderRepeatTitle(state);
    clearRepeatHeaderToolsHost();
  }

  function repeatTabsHtml(state) {
    return [
      { key: 'all', label: '全部', count: state.totalCount },
      { key: 'daily', label: '每日', count: state.dailyCount },
      { key: 'weekly', label: '每周', count: state.weeklyCount },
      { key: 'monthly', label: '每月', count: state.monthlyCount },
    ]
      .map(function (item) {
        return (
          '<button type="button" class="repeat-tabs__button' +
          (state.activeTab === item.key ? ' is-active' : '') +
          '" onclick="setRepeatViewTab(\'' +
          item.key +
          '\')">' +
          '<span class="repeat-tabs__label">' +
          html(item.label) +
          '</span><span class="repeat-tabs__count">' +
          item.count +
          '</span></button>'
        );
      })
      .join('');
  }

  function repeatStatusPillHtml(entry) {
    return (
      '<span class="repeat-status repeat-status--' +
      entry.statusKey +
      '">' +
      html(entry.statusLabel) +
      '</span>'
    );
  }

  function repeatRuleBulletHtml(rule) {
    const isHighPriority = !!rule && (rule.priority || 'normal') === 'high';
    return (
      '<span class="repeat-rule__bullet task-priority-ring' +
      (isHighPriority ? ' task-priority-ring--high' : '') +
      '" aria-hidden="true">' +
      '<span class="tc-check">' +
      '<span class="chk-ring"></span>' +
      '</span></span>'
    );
  }

  function repeatTableRowHtmlLegacy(entry) {
    const ruleMeta = buildRepeatRuleMetaMarkup(entry.inlineRuleLabel, '');

    return (
      '<article class="repeat-table__row repeat-table__row--' +
      entry.tone +
      '">' +
      '<div class="repeat-table__cell repeat-table__cell--name" data-label="任务名称">' +
      '<button type="button" class="repeat-rule__title-button" title="' +
      html(entry.rule.text || '') +
      '" onclick="jumpToRepeatRuleDetail(' +
      jsArgAttr(entry.rule.id) +
      ')">' +
      repeatRuleBulletHtml(entry.rule) +
      '<span class="repeat-rule__title-copy">' +
      '<strong class="repeat-rule__title">' +
      html(entry.rule.text || '') +
      '</strong>' +
      '<span class="repeat-rule__hint">' +
      html(entry.tooltip || '点击查看对应任务') +
      '</span></span></button></div>' +
      '<div class="repeat-table__cell repeat-table__cell--pattern" data-label="重复规则">' +
      '<span class="repeat-rule__meta" title="' +
      html(entry.tooltip || ruleMeta.title || entry.detailLabel) +
      '">' +
      '<span class="repeat-rule__meta-icon" aria-hidden="true">' +
      repeatRuleMetaIconMarkup() +
      '</span>' +
      ruleMeta.html +
      '</span></div>' +
      '<div class="repeat-table__cell repeat-table__cell--last" data-label="最后执行">' +
      '<span class="repeat-rule__date repeat-rule__date--muted">' +
      html(entry.lastLabel) +
      '</span></div>' +
      '<div class="repeat-table__cell repeat-table__cell--status" data-label="状态">' +
      repeatStatusPillHtml(entry) +
      '</div>' +
      '<div class="repeat-table__cell repeat-table__cell--actions" data-label="操作">' +
      repeatRowActionsHtml(entry) +
      '</div></article>'
    );
  }

  function repeatEmptyStateHtml(state) {
    const copy = state.totalCount
      ? {
          title: '当前筛选下没有重复任务',
          sub: '切换上面的标签或状态筛选，看看其它周期的安排。',
        }
      : {
          title: '还没有重复任务',
          sub: '先创建一个任务，再在任务详情里开启重复规则，它就会集中展示在这里。',
        };
    return (
      '<div class="repeat-empty">' +
      '<div class="repeat-empty__icon" aria-hidden="true">' +
      repeatLoopIconMarkup() +
      '</div>' +
      '<p class="repeat-empty__title">' +
      html(copy.title) +
      '</p><p class="repeat-empty__sub">' +
      html(copy.sub) +
      '</p>' +
      '<button type="button" class="repeat-empty__action" onclick="openRepeatTaskComposer()">新建重复任务</button>' +
      '</div>'
    );
  }

  function repeatTableHeadHtmlLegacy() {
    return (
      '<div class="repeat-table__head" aria-hidden="true">' +
      '<span>任务名称</span>' +
      '<span>重复规则</span>' +
      '<span>最后执行</span>' +
      '<span>状态</span>' +
      '<span>操作</span>' +
      '</div>'
    );
  }

  function repeatTableRowHtmlLegacyCompact(entry) {
    const ruleMeta = buildRepeatRuleMetaMarkup(entry.inlineRuleLabel, '');

    return (
      '<article class="repeat-table__row repeat-table__row--' +
      entry.tone +
      '">' +
      '<div class="repeat-table__cell repeat-table__cell--name" data-label="任务名称">' +
      '<button type="button" class="repeat-rule__title-button" title="' +
      html(entry.rule.text || '') +
      '" onclick="jumpToRepeatRuleDetail(' +
      jsArgAttr(entry.rule.id) +
      ')">' +
      repeatRuleBulletHtml(entry.rule) +
      '<span class="repeat-rule__title-copy">' +
      '<span class="repeat-rule__title">' +
      html(entry.rule.text || '') +
      '</span>' +
      '<span class="repeat-rule__hint">' +
      html(entry.tooltip || '点击查看对应任务') +
      '</span></span></button></div>' +
      '<div class="repeat-table__cell repeat-table__cell--pattern" data-label="重复规则">' +
      '<span class="repeat-rule__meta" title="' +
      html(entry.tooltip || ruleMeta.title || entry.inlineRuleLabel) +
      '">' +
      '<span class="repeat-rule__meta-icon" aria-hidden="true">' +
      repeatRuleMetaIconMarkup() +
      '</span>' +
      ruleMeta.html +
      '</span></div>' +
      '<div class="repeat-table__cell repeat-table__cell--status" data-label="状态">' +
      repeatStatusPillHtml(entry) +
      '</div>' +
      '<div class="repeat-table__cell repeat-table__cell--actions" data-label="操作">' +
      repeatRowActionsHtml(entry) +
      '</div></article>'
    );
  }

  function repeatTableRowHtml(entry) {
    const ruleLabel = entry.ruleLabel || getRepeatRuleDisplayLabelTop(entry);
    const ruleTimeLabel = entry.ruleTimeLabel || getRepeatRuleDisplayTimeTop(entry);
    const ruleMeta = buildRepeatRuleMetaMarkup(ruleLabel, ruleTimeLabel);

    return (
      '<article class="repeat-table__row repeat-table__row--' +
      entry.tone +
      '">' +
      '<div class="repeat-table__cell repeat-table__cell--name" data-label="任务名称">' +
      '<button type="button" class="repeat-rule__title-button" title="' +
      html(entry.rule.text || '') +
      '" onclick="jumpToRepeatRuleDetail(' +
      jsArgAttr(entry.rule.id) +
      ')">' +
      repeatRuleBulletHtml(entry.rule) +
      '<span class="repeat-rule__title-copy">' +
      '<span class="repeat-rule__title">' +
      html(entry.rule.text || '') +
      '</span></span></button></div>' +
      '<div class="repeat-table__cell repeat-table__cell--pattern" data-label="重复规则">' +
      '<span class="repeat-rule__meta" title="' +
      html(entry.tooltip || ruleMeta.title || ruleLabel || '') +
      '">' +
      '<span class="repeat-rule__meta-main">' +
      '<span class="repeat-rule__meta-icon" aria-hidden="true">' +
      repeatRuleMetaIconMarkup() +
      '</span>' +
      ruleMeta.html +
      '</span>' +
      '</span></div>' +
      '<div class="repeat-table__cell repeat-table__cell--status" data-label="状态">' +
      repeatStatusPillHtml(entry) +
      '</div>' +
      '<div class="repeat-table__cell repeat-table__cell--actions" data-label="操作">' +
      repeatRowActionsHtml(entry) +
      '</div></article>'
    );
  }

  function repeatTableHeadHtml() {
    return (
      '<div class="repeat-table__head" aria-hidden="true">' +
      '<span>任务名称</span>' +
      '<span>重复规则</span>' +
      '<span>状态</span>' +
      '<span>操作</span>' +
      '</div>'
    );
  }

  function repeatPagerHtml(state) {
    return getTaskViewPager().buildHtml({
      pager: state && state.pager ? state.pager : null,
      pageAction: 'setRepeatViewPage',
      pageSizeAction: 'setRepeatViewPageSize',
      ariaLabel: '重复任务分页',
      pageSizeLabel: '每页条数',
      escapeHtml: html,
    });
  }

  function repeatTableHtml(state) {
    if (!state.filteredCount) {
      return repeatEmptyStateHtml(state);
    }
    return (
      '<section class="repeat-table" aria-label="重复任务列表">' +
      repeatTableHeadHtml() +
      '<div class="repeat-table__body">' +
      state.entries.map(repeatTableRowHtml).join('') +
      '</div></section>'
    );
  }

  function renderRepeatTaskScene(list, state) {
    if (!list || !state) {
      return;
    }
    list.innerHTML =
      '<section class="repeat-view" aria-label="重复任务视图">' +
      '<div class="repeat-view__toolbar">' +
      '<div class="repeat-tabs" role="tablist" aria-label="重复任务分类">' +
      repeatTabsHtml(state) +
      '</div></div>' +
      '<div class="repeat-view__content">' +
      repeatTableHtml(state) +
      repeatPagerHtml(state) +
      '</div>' +
      '</section>';
  }

  function ensureRepeatOverviewShell(root) {
    if (!root) {
      return null;
    }
    let shell = root.querySelector('.' + REPEAT_SHELL_CLASS);
    if (!shell) {
      shell = document.createElement('section');
      root.appendChild(shell);
    }
    shell.className = REPEAT_SHELL_CLASS;
    shell.setAttribute('aria-label', '重复任务侧栏');
    return shell;
  }

  function repeatOverviewRingGradient(state) {
    const activeCount = Math.max(0, Number(state && state.activeCount) || 0);
    const pausedCount = Math.max(0, Number(state && state.pausedCount) || 0);
    const completedCount = Math.max(0, Number(state && state.completedCount) || 0);
    const includeCompleted = !!(state && state.showCompleted);
    const visibleTotal = activeCount + pausedCount + (includeCompleted ? completedCount : 0);

    if (!visibleTotal) {
      return 'conic-gradient(#e2e8f0 0 100%)';
    }

    const total = Math.max(1, visibleTotal);
    const activeEnd = (activeCount / total) * 100;
    const pausedEnd = activeEnd + (pausedCount / total) * 100;

    if (!includeCompleted) {
      return (
        'conic-gradient(' +
        '#4ade80 0 ' +
        activeEnd +
        '%, ' +
        '#a5b4fc ' +
        activeEnd +
        '% 100%)'
      );
    }

    return (
      'conic-gradient(' +
      '#4ade80 0 ' +
      activeEnd +
      '%, ' +
      '#a5b4fc ' +
      activeEnd +
      '% ' +
      pausedEnd +
      '%, ' +
      '#fb923c ' +
      pausedEnd +
      '% 100%)'
    );
  }

  function repeatOverviewLegendItemHtml(count, label, tone) {
    return (
      '<div class="repeat-overview__legend-item">' +
      '<span class="repeat-overview__legend-label repeat-overview__legend-label--' +
      tone +
      '">' +
      html(label) +
      '</span><strong>' +
      count +
      '</strong></div>'
    );
  }

  function repeatOverviewHeadHtml(title, actionHtml) {
    return (
      '<div class="repeat-side-card__head-row">' +
      '<div class="repeat-side-card__head">' +
      html(title || '') +
      '</div>' +
      (actionHtml || '') +
      '</div>'
    );
  }

  function getRepeatListedRecurringTasksForDate(ds) {
    if (!ds || !T || !Array.isArray(T[ds])) {
      return [];
    }
    return T[ds].filter(function (task) {
      return isListedTask(task) && !!task.recurRuleId && !task.frozen;
    });
  }

  function getRepeatWeekStart(todayDs) {
    const parsed = typeof parseDS === 'function' ? parseDS(todayDs) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) {
      return todayDs || '';
    }
    const weekday = parsed.getDay();
    const offset = weekday === 0 ? -6 : 1 - weekday;
    parsed.setDate(parsed.getDate() + offset);
    return fd(parsed);
  }

  function getRepeatCompletionStreak(todayDs) {
    if (!todayDs) {
      return 0;
    }
    let streakDays = 0;
    for (let offset = 0; offset < 366; offset += 1) {
      const currentDs = addDays(todayDs, -offset);
      const dayTasks = getRepeatListedRecurringTasksForDate(currentDs);
      if (!dayTasks.length) {
        break;
      }
      if (!dayTasks.every(function (task) { return !!task.done; })) {
        break;
      }
      streakDays += 1;
    }
    return streakDays;
  }

  function getRepeatSidebarStats() {
    const todayDs = todayKey();
    const todayTasks = getRepeatListedRecurringTasksForDate(todayDs);
    const weekStart = getRepeatWeekStart(todayDs);
    let weekTotal = 0;
    let weekDone = 0;

    for (let offset = 0; offset < 7; offset += 1) {
      const currentDs = addDays(weekStart, offset);
      const dayTasks = getRepeatListedRecurringTasksForDate(currentDs);
      weekTotal += dayTasks.length;
      weekDone += dayTasks.filter(function (task) { return !!task.done; }).length;
    }

    const completionRate = weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0;
    const streakDays = getRepeatCompletionStreak(todayDs);

    return {
      todayCount: todayTasks.length,
      todaySub: todayTasks.length
        ? '\u4eca\u65e5\u6709' + todayTasks.length + '\u4e2a\u91cd\u590d\u4efb\u52a1'
        : '\u4eca\u65e5\u65e0\u91cd\u590d\u4efb\u52a1',
      weekRate: completionRate,
      weekSub: weekTotal
        ? (weekDone ? weekDone + '/' + weekTotal + ' \u5df2\u5b8c\u6210' : '\u6682\u65e0\u5b8c\u6210\u4efb\u52a1')
        : '\u672c\u5468\u6682\u65e0\u91cd\u590d\u4efb\u52a1',
      streakDays: streakDays,
      streakSub: streakDays
        ? '\u8fde\u7eed' + streakDays + '\u5929\u5168\u90e8\u5b8c\u6210'
        : '\u7ee7\u7eed\u4fdd\u6301\u5f53\u524d\u8282\u594f'
    };
  }

  function renderRepeatOverviewSidebar(state) {
    const root = document.getElementById('taskDashCol');
    if (!root) {
      return;
    }
    const shell = ensureRepeatOverviewShell(root);
    if (!shell) {
      return;
    }
    root.classList.remove('is-week-action', 'is-overdue-action', 'is-priority-action');
    root.classList.add('is-repeat-action');
    root.setAttribute('aria-label', '\u91cd\u590d\u4efb\u52a1\u4fa7\u8fb9\u680f');

    const stats = state.sidebarStats || getRepeatSidebarStats();
    const summaryState = {
      activeCount: state.activeCount,
      pausedCount: state.pausedCount,
      completedCount: state.completedCount,
      showCompleted: false,
    };
    const summaryTotal = Math.max(0, summaryState.activeCount + summaryState.pausedCount);

    shell.innerHTML =
      '<section class="repeat-side-card repeat-side-card--summary">' +
      repeatOverviewHeadHtml('\u4efb\u52a1\u6982\u89c8', repeatSideHeadActionHtml()) +
      '<div class="repeat-overview__hero">' +
      '<div class="repeat-overview__ring" style="--repeat-ring-bg:' +
      repeatOverviewRingGradient(summaryState) +
      '">' +
      '<div class="repeat-overview__ring-center"><strong>' +
      summaryTotal +
      '</strong><span>\u603b\u8ba1</span></div></div>' +
      '<div class="repeat-overview__legend">' +
      repeatOverviewLegendItemHtml(state.activeCount, '\u8fdb\u884c\u4e2d', 'active') +
      repeatOverviewLegendItemHtml(state.pausedCount, '\u5df2\u6682\u505c', 'paused') +
      '</div></div>' +
      '</section>' +
      '<section class="repeat-side-card repeat-side-card--stats">' +
      repeatOverviewHeadHtml('\u7edf\u8ba1\u4fe1\u606f') +
      '<div class="repeat-stats">' +
      repeatStatItemHtml(
        'today',
        calendarClockIconMarkup(),
        '\u4eca\u65e5\u4efb\u52a1',
        stats.todaySub,
        String(stats.todayCount)
      ) +
      repeatStatItemHtml(
        'rate',
        trendArcIconMarkup(),
        '\u672c\u5468\u5b8c\u6210\u7387',
        stats.weekSub,
        stats.weekRate + '%'
      ) +
      repeatStatItemHtml(
        'streak',
        streakFlameIconMarkup(),
        '\u8fde\u7eed\u5b8c\u6210',
        stats.streakSub,
        stats.streakDays + ' \u5929'
      ) +
      '</div>' +
      '</section>';
  }

  function clearRepeatOverviewSidebar() {
    const root = document.getElementById('taskDashCol');
    if (!root) {
      return;
    }
    root.classList.remove('is-repeat-action');
    const shell = root.querySelector('.' + REPEAT_SHELL_CLASS);
    if (shell && shell.parentNode) {
      shell.parentNode.removeChild(shell);
    }
  }

  function renderRepeatModeFrame() {
    let state = null;
    if (isRepeatMode()) {
      state = getRepeatSceneState();
      renderRepeatTaskScene(document.getElementById('tList'), state);
      renderRepeatOverviewSidebar(state);
    } else {
      clearRepeatOverviewSidebar();
    }
    ensureRepeatHeaderState(state);
    return state;
  }

  function scheduleApply() {
    renderRepeatModeFrame();
  }

  function hookRender() {
    if (typeof rT !== 'function' || window.__repeatViewRTPatched) {
      return;
    }
    window.__repeatViewRTPatched = true;
    const originalRT = rT;
    rT = function () {
      const result = originalRT.apply(this, arguments);
      renderRepeatModeFrame();
      return result;
    };
  }

  function refreshSideNavSoon() {
    if (typeof window.refreshGlobalSideNav !== 'function') {
      return;
    }
    setTimeout(function () {
      window.refreshGlobalSideNav();
    }, 0);
  }

  function getRepeatRuleById(ruleId) {
    return typeof findRecurRule === 'function' ? findRecurRule(ruleId) : null;
  }

  function rerenderRepeatViews() {
    if (typeof rT === 'function') {
      rT();
      return;
    }
    renderRepeatModeFrame();
  }

  function persistRepeatRuleStateChange() {
    if (typeof save === 'function') {
      save();
    }
    rerenderRepeatViews();
    if (typeof rRecurList === 'function') {
      rRecurList();
    }
  }

  function setRepeatRuleActiveState(ruleId, isActive) {
    const rule = getRepeatRuleById(ruleId);
    if (!rule) {
      return false;
    }
    if (typeof updateRecurRule === 'function') {
      updateRecurRule(ruleId, 'active', !!isActive);
    } else {
      if (typeof setRecurRuleActiveState === 'function') {
        if (!setRecurRuleActiveState(ruleId, !!isActive)) {
          return false;
        }
      } else {
        rule.active = !!isActive;
      }
      persistRepeatRuleStateChange();
      if (typeof rCal === 'function') {
        rCal();
      }
    }
    refreshSideNavSoon();
    return true;
  }

  function deleteRepeatRuleEntry(ruleId) {
    const rule = getRepeatRuleById(ruleId);
    if (!rule) {
      return false;
    }
    if (typeof deleteRecurRule === 'function') {
      deleteRecurRule(ruleId);
      refreshSideNavSoon();
      return true;
    }

    if (Array.isArray(recurRules)) {
      recurRules = recurRules.filter(function (item) {
        return item && item.id !== ruleId;
      });
    }

    const today = todayKey();
    for (const ds in T) {
      if (ds > today) {
        T[ds] = (T[ds] || []).filter(function (task) {
          return !(task && task.recurRuleId === ruleId && !task.done && !task.archived);
        });
        if (T[ds] && !T[ds].length) {
          delete T[ds];
        }
      }
      (T[ds] || []).forEach(function (task) {
        if (task && task.recurRuleId === ruleId) {
          task.recurRuleId = '';
        }
      });
    }

    persistRepeatRuleStateChange();
    if (typeof rCal === 'function') {
      rCal();
    }
    if (typeof toast === 'function') {
      toast('🗑️ 已删除重复任务');
    }
    refreshSideNavSoon();
    return true;
  }

  function handleRepeatRowAction(action, ruleId) {
    if (!action || !ruleId) {
      return;
    }
    if (action === 'toggle') {
      const rule = getRepeatRuleById(ruleId);
      if (rule) {
        setRepeatRuleActiveState(ruleId, !rule.active);
      }
      return;
    }
    if (action === 'delete') {
      deleteRepeatRuleEntry(ruleId);
    }
  }

  function bindRepeatRowActions() {
    if (window.__repeatRowActionsBound) {
      return;
    }
    window.__repeatRowActionsBound = true;
    document.addEventListener('click', function (event) {
      const trigger = event.target && typeof event.target.closest === 'function'
        ? event.target.closest('.repeat-row-actions__btn[data-repeat-action]')
        : null;
      if (!trigger || !trigger.closest('.repeat-view')) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      handleRepeatRowAction(trigger.dataset.repeatAction, trigger.dataset.ruleId || '');
    });
  }

  window.setRepeatViewTab = function (tab) {
    const nextTab = normalizeRepeatTab(tab);
    if (repeatViewTab === nextTab) {
      return;
    }
    repeatViewTab = nextTab;
    repeatViewPage = 1;
    persistRepeatTab(nextTab);
    if (typeof rT === 'function') {
      rT();
    }
  };

  window.setRepeatViewPage = function (page) {
    const nextPage = parseInt(page, 10);
    if (!Number.isFinite(nextPage)) {
      return;
    }
    repeatViewPage = Math.max(1, nextPage);
    rerenderRepeatViews();
  };

  window.setRepeatViewPageSize = function (size) {
    const nextSize = normalizeRepeatPageSize(size);
    if (nextSize === repeatViewPageSize) {
      return;
    }
    repeatViewPageSize = nextSize;
    repeatViewPage = 1;
    persistRepeatPageSize(nextSize);
    rerenderRepeatViews();
  };

  window.jumpToRepeatRuleDetail = function (ruleId) {
    const rule = typeof findRecurRule === 'function' ? findRecurRule(ruleId) : null;
    if (!rule) {
      toast('没有找到对应的重复规则');
      return;
    }
    const entry = buildRepeatEntry(rule);
    const targetDs = entry && entry.nextDs ? entry.nextDs : todayKey();
    if (typeof pick === 'function') {
      pick(targetDs);
    }
    setTimeout(function () {
      const rows = T && T[targetDs] ? T[targetDs] : [];
      const task = rows.find(function (item) {
        return item && item.recurRuleId === ruleId;
      });
      if (task && typeof window.openTaskDetail === 'function') {
        window.openTaskDetail(task.id);
      }
    }, 60);
  };

  window.toggleRepeatRuleState = function (ruleId) {
    const rule = getRepeatRuleById(ruleId);
    if (!rule) {
      return;
    }
    setRepeatRuleActiveState(ruleId, !rule.active);
  };

  window.openRepeatTaskComposer = function () {
    if (typeof goToday === 'function') {
      goToday(false);
    }
    setTimeout(function () {
      if (typeof showAddTaskRow === 'function') {
        showAddTaskRow();
      }
      if (typeof toast === 'function') {
        toast('添加任务后，可在任务详情里设置重复规则');
      }
    }, 60);
  };

  window.leaveRepeatTaskView = function () {
    if (typeof goToday === 'function') {
      goToday(false);
    }
  };

  window.getRepeatSceneTotalCount = getRepeatSceneTotalCount;

  bindRepeatRowActions();
  hookRender();
  scheduleApply();
  refreshSideNavSoon();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      hookRender();
      scheduleApply();
      refreshSideNavSoon();
    });
  }

  window.addEventListener('hashchange', scheduleApply);
  window.addEventListener('popstate', scheduleApply);
  window.addEventListener('resize', scheduleApply);
})();
