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
  const REPEAT_SEARCH_WINDOW_DAYS = 730;
  const REPEAT_TABS = ['all', 'daily', 'weekly', 'monthly'];

  let repeatViewTab = readSavedRepeatTab();

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
    const upcomingEntries = entries
      .filter(function (entry) {
        return entry.statusKey === 'active' && !!entry.nextDs;
      })
      .sort(compareNextDate)
      .slice(0, 3);

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
      entries: filteredEntries,
      upcomingEntries: upcomingEntries,
    };
  }

  function getRepeatSceneTotalCount() {
    return collectRepeatEntries().length;
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

  function plusIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="9"></circle>' +
      '<line x1="12" y1="8" x2="12" y2="16"></line>' +
      '<line x1="8" y1="12" x2="16" y2="12"></line>' +
      '</svg>'
    );
  }

  function docIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>' +
      '<polyline points="14 2 14 8 20 8"></polyline>' +
      '<line x1="16" y1="13" x2="8" y2="13"></line>' +
      '<line x1="16" y1="17" x2="8" y2="17"></line>' +
      '<polyline points="10 9 9 9 8 9"></polyline>' +
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
      repeatTableHtml(state) +
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
    shell.setAttribute('aria-label', '重复任务概览');
    return shell;
  }

  function repeatOverviewRingGradient(state) {
    const total = Math.max(1, state.activeCount + state.pausedCount + state.completedCount);
    const activeEnd = (state.activeCount / total) * 100;
    const pausedEnd = activeEnd + (state.pausedCount / total) * 100;
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
      '<span class="repeat-overview__legend-label">' +
      '<span class="repeat-overview__legend-dot repeat-overview__legend-dot--' +
      tone +
      '" aria-hidden="true"></span>' +
      html(label) +
      '</span><strong>' +
      count +
      '</strong></div>'
    );
  }

  function repeatUpcomingRowHtml(entry) {
    return (
      '<button type="button" class="repeat-upcoming__item repeat-upcoming__item--' +
      entry.tone +
      '" onclick="jumpToRepeatRuleDetail(' +
      jsArgAttr(entry.rule.id) +
      ')">' +
      '<span class="repeat-upcoming__accent" aria-hidden="true"></span>' +
      '<span class="repeat-upcoming__copy">' +
      '<strong title="' +
      html(entry.rule.text || '') +
      '">' +
      html(entry.rule.text || '') +
      '</strong>' +
      '<span class="repeat-upcoming__meta">' +
      '<span class="repeat-rule__type-pill repeat-rule__type-pill--' +
      entry.category +
      '">' +
      html(entry.typeLabel) +
      '</span></span></span>' +
      '<em>' +
      html(entry.nextLabel) +
      '</em></button>'
    );
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
    root.setAttribute('aria-label', '重复任务概览');

    shell.innerHTML =
      '<section class="repeat-side-card repeat-side-card--summary">' +
      '<div class="repeat-side-card__head">重复任务概览</div>' +
      '<div class="repeat-overview__hero">' +
      '<div class="repeat-overview__ring" style="--repeat-ring-bg:' +
      repeatOverviewRingGradient(state) +
      '">' +
      '<div class="repeat-overview__ring-center"><strong>' +
      state.totalCount +
      '</strong><span>总计</span></div></div>' +
      '<div class="repeat-overview__legend">' +
      repeatOverviewLegendItemHtml(state.activeCount, '进行中', 'active') +
      repeatOverviewLegendItemHtml(state.pausedCount, '已暂停', 'paused') +
      repeatOverviewLegendItemHtml(state.completedCount, '已完成', 'completed') +
      '</div></div></section>' +
      '<section class="repeat-side-card repeat-side-card--upcoming">' +
      '<div class="repeat-side-card__head">即将执行</div>' +
      '<div class="repeat-upcoming__list">' +
      (state.upcomingEntries.length
        ? state.upcomingEntries.map(repeatUpcomingRowHtml).join('')
        : '<div class="repeat-upcoming__empty">目前没有进行中的重复安排。</div>') +
      '</div>' +
      '<button type="button" class="repeat-side-card__ghost" onclick="leaveRepeatTaskView()">回到今日日程</button>' +
      '</section>' +
      '<section class="repeat-side-card repeat-side-card--actions">' +
      '<div class="repeat-side-card__head">管理快捷操作</div>' +
      '<div class="repeat-side-actions">' +
      '<button type="button" class="repeat-side-actions__btn" onclick="openRepeatTaskComposer()">' +
      '<span class="repeat-side-actions__icon" aria-hidden="true">' +
      plusIconMarkup() +
      '</span><span>新建重复任务</span></button>' +
      '<button type="button" class="repeat-side-actions__btn" onclick="openRepeatRuleManager()">' +
      '<span class="repeat-side-actions__icon" aria-hidden="true">' +
      docIconMarkup() +
      '</span><span>管理重复规则</span></button>' +
      '</div></section>';
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
    persistRepeatTab(nextTab);
    if (typeof rT === 'function') {
      rT();
    }
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

  window.openRepeatRuleManager = function () {
    if (typeof navigate === 'function') {
      navigate('/settings');
    }
    setTimeout(function () {
      const list = document.getElementById('recurList');
      if (list && typeof list.scrollIntoView === 'function') {
        list.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
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
