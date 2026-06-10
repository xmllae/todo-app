// 统计页：仪表盘结构、周期切换、标签筛选与图表渲染

var statView = 'overview';

var STATS_VIEW_META = {
  overview: {
    title: '数据概览',
    targetId: 'statsSummary'
  },
  task: {
    title: '任务分析',
    targetId: 'statsTrendCard'
  },
  focus: {
    title: '专注时间',
    targetId: 'statsFocusCard'
  }
};

var STATS_PERIOD_META = {
  week: '本周',
  month: '本月',
  year: '今年'
};

var STATS_PRIORITY_META = [
  { key: 'high', label: '高优先', color: '#ff6b6b' },
  { key: 'medium', label: '中优先', color: '#5b9af2' },
  { key: 'low', label: '低优先', color: '#d0d6df' }
];

var STATS_WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
var STATS_YEAR_MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

var STATS_GOAL_THEME_META = {
  learning: { icon: 'ph-graduation-cap', color: '#7c3aed' },
  health: { icon: 'ph-heartbeat', color: '#22c55e' },
  reading: { icon: 'ph-book-open-text', color: '#f97316' },
  finance: { icon: 'ph-wallet', color: '#2563eb' },
  career: { icon: 'ph-briefcase', color: '#0f766e' },
  creative: { icon: 'ph-rocket-launch', color: '#db2777' }
};

function html(value) {
  if (typeof esc === 'function') {
    return esc(value == null ? '' : String(value));
  }

  var div = document.createElement('div');
  div.textContent = value == null ? '' : String(value);
  return div.innerHTML;
}

function jsArgAttr(value) {
  var raw = value == null ? '' : String(value);
  return "'" + raw.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ') + "'";
}

function setStatP(period, button) {
  statP = normalizeStatsPeriod(period);
  syncStatsActiveButton('#statsPeriodNav .stats-period-nav__btn', button);
  rStats();
}

function setStatsView(view, button) {
  statView = STATS_VIEW_META[view] ? view : 'overview';
  syncStatsActiveButton('#statsViewNav .stats-view-nav__btn', button);
  applyStatsViewState(true);
  rStats();
}

function setStatsTag(tagId, button) {
  statTag = tagId || '';
  syncStatsActiveButton('#statsTagFilter .stats-tag-chip', button);
  rStats();
}

function exportStatsReport() {
  var state = buildStatsDashboardState();
  if (!state) return;

  var payload = {
    exportedAt: new Date().toISOString(),
    view: statView,
    period: state.period.period,
    tag: state.tagName || '全部任务',
    range: {
      label: state.period.rangeText,
      start: state.period.startKey,
      end: state.period.endKey
    },
    summary: {
      totalTasks: state.current.totalTasks,
      doneTasks: state.current.doneTasks,
      completionRate: state.current.completionRate,
      focusMinutes: state.current.focusTotalMinutes,
      streakDays: state.streakDays
    },
    trend: state.current.buckets.map(function (bucket) {
      return {
        key: bucket.key,
        label: bucket.tooltip,
        total: bucket.total,
        done: bucket.done,
        focusMinutes: bucket.focusMinutes
      };
    }),
    priority: state.current.priorityCounts,
    goals: state.goals.map(function (goal) {
      return {
        title: goal.title,
        progress: goal.progress,
        status: goal.status,
        deadline: goal.deadline,
        theme: goal.theme
      };
    })
  };

  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'tuole-stats-' + state.period.period + '-' + state.period.todayKey + '.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 1200);

  if (typeof toast === 'function') {
    toast('统计报告已导出');
  }
}

function openStatsGoalView() {
  var today = startOfDay(new Date());
  if (typeof fd === 'function') {
    sel = fd(today);
  }
  cY = today.getFullYear();
  cM = today.getMonth();

  if (typeof setGlobalSideNavQuickMode === 'function') {
    setGlobalSideNavQuickMode('goal-view');
  }

  if (typeof navigate === 'function') {
    navigate('/');
  }

  if (typeof rCal === 'function') {
    rCal();
  }

  if (typeof rAll === 'function') {
    rAll();
  }
}

function ensureStatsShell() {
  var root = document.getElementById('statsMode');
  if (!root || root.dataset.statsShellReady === '1') {
    return root;
  }

  root.dataset.statsShellReady = '1';
  root.dataset.statsView = statView;
  root.innerHTML =
    '<section class="stats-dashboard" aria-label="统计仪表盘">' +
    '  <aside class="stats-dashboard__sidebar" aria-label="统计筛选">' +
    '    <section class="stats-panel">' +
    '      <p class="stats-panel__eyebrow">报告维度</p>' +
    '      <div class="stats-view-nav" id="statsViewNav" aria-label="报告维度">' +
    '        <button type="button" class="stats-view-nav__btn is-active" data-view="overview" onclick="setStatsView(\'overview\',this)">' +
    '          <span class="stats-view-nav__icon" aria-hidden="true"><i class="ph ph-chart-pie-slice"></i></span>' +
    '          <span>综合概览</span>' +
    '        </button>' +
    '        <button type="button" class="stats-view-nav__btn" data-view="task" onclick="setStatsView(\'task\',this)">' +
    '          <span class="stats-view-nav__icon" aria-hidden="true"><i class="ph ph-check-circle"></i></span>' +
    '          <span>任务分析</span>' +
    '        </button>' +
    '        <button type="button" class="stats-view-nav__btn" data-view="focus" onclick="setStatsView(\'focus\',this)">' +
    '          <span class="stats-view-nav__icon" aria-hidden="true"><i class="ph ph-timer"></i></span>' +
    '          <span>专注时间</span>' +
    '        </button>' +
    '      </div>' +
    '    </section>' +
    '    <section class="stats-panel">' +
    '      <div class="stats-panel__heading">' +
    '        <p class="stats-panel__eyebrow">时间范围</p>' +
    '        <span class="stats-panel__badge">当前</span>' +
    '      </div>' +
    '      <div class="stats-period-nav" id="statsPeriodNav" aria-label="时间范围">' +
    '        <button type="button" class="stats-period-nav__btn is-active" data-period="week" onclick="setStatP(\'week\',this)">本周</button>' +
    '        <button type="button" class="stats-period-nav__btn" data-period="month" onclick="setStatP(\'month\',this)">本月</button>' +
    '        <button type="button" class="stats-period-nav__btn" data-period="year" onclick="setStatP(\'year\',this)">今年</button>' +
    '      </div>' +
    '      <p class="stats-panel__note" id="statsScopeNote">当前展示全部任务的统计结果。</p>' +
    '    </section>' +
    '    <section class="stats-panel stats-panel--tags" id="statsTagPanel">' +
    '      <p class="stats-panel__eyebrow">标签筛选</p>' +
    '      <div class="stats-tag-filter" id="statsTagFilter" aria-label="标签筛选"></div>' +
    '    </section>' +
    '  </aside>' +
    '  <div class="stats-dashboard__content">' +
    '    <header class="stats-hero">' +
    '      <div class="stats-hero__copy">' +
    '        <p class="stats-hero__kicker">统计中心</p>' +
    '        <h2 class="stats-hero__title" id="statsTitle">数据概览</h2>' +
    '        <p class="stats-hero__meta" id="statsRangeLabel">--</p>' +
    '      </div>' +
    '      <button type="button" class="stats-export-btn" onclick="exportStatsReport()">' +
    '        <i class="ph ph-download-simple" aria-hidden="true"></i>' +
    '        <span>导出报告</span>' +
    '      </button>' +
    '    </header>' +
    '    <section class="stats-summary-grid" id="statsSummary" aria-label="核心指标"></section>' +
    '    <div class="stats-content-grid">' +
    '      <section class="stats-surface stats-surface--task" id="statsTrendCard" aria-label="任务完成趋势"></section>' +
    '      <section class="stats-surface stats-surface--task" id="statsPriorityCard" aria-label="任务优先级分布"></section>' +
    '      <section class="stats-surface stats-surface--focus" id="statsFocusCard" aria-label="专注时长趋势"></section>' +
    '      <section class="stats-surface" id="statsGoalCard" aria-label="长期目标进度"></section>' +
    '    </div>' +
    '  </div>' +
    '</section>';

  syncStatsActiveControls();
  return root;
}

function rStats() {
  var root = ensureStatsShell();
  if (!root) return;

  var state = buildStatsDashboardState();
  if (!state) return;

  applyStatsViewState(false);
  renderStatsTagFilter();
  renderStatsHero(state);
  renderStatsSummary(state);
  renderStatsTrendCard(state);
  renderStatsPriorityCard(state);
  renderStatsFocusCard(state);
  renderStatsGoalCard(state);
  syncStatsActiveControls();
}

function buildStatsDashboardState() {
  var period = buildStatsPeriodConfig(normalizeStatsPeriod(statP));
  if (!period) return null;

  var currentMetrics = buildStatsRangeMetrics(period.current);
  var previousMetrics = buildStatsRangeMetrics(period.previous);

  return {
    period: {
      period: period.period,
      label: period.label,
      rangeText: period.current.rangeText,
      todayKey: period.todayKey,
      startKey: period.current.startKey,
      endKey: period.current.endKey
    },
    tagName: getStatsTagName(statTag),
    current: currentMetrics,
    previous: previousMetrics,
    streakDays: getStatsCompletionStreak(period.todayKey),
    goals: getStatsGoalRows(),
    focusSource: currentMetrics.focusSource
  };
}

function buildStatsPeriodConfig(period) {
  var baseDate = startOfDay(new Date());
  var todayKey = fd(baseDate);
  var label = STATS_PERIOD_META[period] || STATS_PERIOD_META.week;
  var currentStart;
  var currentEnd;
  var previousStart;
  var previousEnd;
  var bucketType = 'day';

  if (period === 'month') {
    currentStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    currentEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
    previousStart = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
    previousEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), 0);
  } else if (period === 'year') {
    currentStart = new Date(baseDate.getFullYear(), 0, 1);
    currentEnd = new Date(baseDate.getFullYear(), 11, 31);
    previousStart = new Date(baseDate.getFullYear() - 1, 0, 1);
    previousEnd = new Date(baseDate.getFullYear() - 1, 11, 31);
    bucketType = 'month';
  } else {
    currentStart = getStatsWeekStart(baseDate);
    currentEnd = addDays(currentStart, 6);
    previousStart = addDays(currentStart, -7);
    previousEnd = addDays(currentStart, -1);
  }

  return {
    period: period,
    label: label,
    todayKey: todayKey,
    current: buildStatsRangePart(currentStart, currentEnd, bucketType, period, label, todayKey),
    previous: buildStatsRangePart(previousStart, previousEnd, bucketType, period, label, todayKey)
  };
}

function buildStatsRangePart(startDate, endDate, bucketType, period, label, todayKey) {
  return {
    bucketType: bucketType,
    startKey: fd(startDate),
    endKey: fd(endDate),
    rangeText: formatStatsRangeText(startDate, endDate, label),
    entries:
      bucketType === 'month'
        ? buildStatsMonthEntries(startDate, todayKey)
        : buildStatsDayEntries(startDate, endDate, period, todayKey)
  };
}

function buildStatsRangeMetrics(rangePart) {
  var buckets = rangePart.entries.map(createStatsBucketModel);
  var bucketMap = {};
  var priorityCounts = {
    high: 0,
    medium: 0,
    low: 0
  };

  buckets.forEach(function (bucket) {
    bucketMap[bucket.key] = bucket;
  });

  Object.keys(T || {}).forEach(function (dateKey) {
    if (dateKey < rangePart.startKey || dateKey > rangePart.endKey) {
      return;
    }

    var tasks = getStatsTasksByDate(dateKey);
    if (!tasks.length) {
      return;
    }

    var bucketKey = rangePart.bucketType === 'month' ? dateKey.slice(0, 7) : dateKey;
    var bucket = bucketMap[bucketKey];
    if (!bucket) {
      return;
    }

    tasks.forEach(function (task) {
      var priorityKey = normalizeStatsPriority(task.priority);
      var durationMinutes = getStatsTaskDurationMinutes(task);
      bucket.total += 1;
      bucket.priority[priorityKey] += 1;
      priorityCounts[priorityKey] += 1;
      if (isStatsTaskDone(task)) {
        bucket.done += 1;
        bucket.doneDuration += durationMinutes;
      }
    });
  });

  buckets.forEach(function (bucket) {
    bucket.pending = Math.max(0, bucket.total - bucket.done);
  });

  var focusSeries = buildStatsFocusSeries(rangePart, buckets);
  focusSeries.series.forEach(function (item) {
    if (bucketMap[item.key]) {
      bucketMap[item.key].focusMinutes = item.value;
    }
  });

  var totalTasks = buckets.reduce(function (sum, bucket) {
    return sum + bucket.total;
  }, 0);
  var doneTasks = buckets.reduce(function (sum, bucket) {
    return sum + bucket.done;
  }, 0);

  return {
    buckets: buckets,
    totalTasks: totalTasks,
    doneTasks: doneTasks,
    completionRate: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
    priorityCounts: priorityCounts,
    focusTotalMinutes: focusSeries.totalMinutes,
    focusSource: focusSeries.source
  };
}

function buildStatsFocusSeries(rangePart, buckets) {
  var fallbackSeries = buckets.map(function (bucket) {
    return {
      key: bucket.key,
      value: bucket.doneDuration
    };
  });
  var fallbackTotal = fallbackSeries.reduce(function (sum, item) {
    return sum + item.value;
  }, 0);

  if (statTag) {
    return {
      series: fallbackSeries,
      totalMinutes: fallbackTotal,
      source: 'task-duration'
    };
  }

  var focusState = readStatsFocusState();
  var focusByDay = focusState.byDay || {};
  var series = buckets.map(function (bucket) {
    return {
      key: bucket.key,
      value: 0
    };
  });
  var totalMinutes = 0;

  if (rangePart.bucketType === 'month') {
    Object.keys(focusByDay).forEach(function (dateKey) {
      if (dateKey < rangePart.startKey || dateKey > rangePart.endKey) {
        return;
      }

      var bucketKey = dateKey.slice(0, 7);
      var item = series.find(function (seriesItem) {
        return seriesItem.key === bucketKey;
      });
      if (!item) return;

      var minutes = getStatsFocusMinutes(focusByDay[dateKey]);
      item.value += minutes;
      totalMinutes += minutes;
    });
  } else {
    series.forEach(function (item) {
      var record = focusByDay[item.key];
      var minutes = getStatsFocusMinutes(record);
      item.value = minutes;
      totalMinutes += minutes;
    });
  }

  if (totalMinutes <= 0) {
    return {
      series: fallbackSeries,
      totalMinutes: fallbackTotal,
      source: 'task-duration'
    };
  }

  return {
    series: series,
    totalMinutes: totalMinutes,
    source: 'focus-timer'
  };
}

function renderStatsHero(state) {
  var title = document.getElementById('statsTitle');
  var range = document.getElementById('statsRangeLabel');
  var scope = document.getElementById('statsScopeNote');

  if (title) {
    title.textContent = STATS_VIEW_META[statView].title;
  }

  if (range) {
    range.textContent = state.period.rangeText;
  }

  if (scope) {
    scope.textContent =
      '当前展示' +
      (state.tagName ? '“' + state.tagName + '”标签在' : '') +
      state.period.label +
      (state.tagName ? '内的统计结果。' : '全部任务的统计结果。');
  }
}

function renderStatsTagFilter() {
  var panel = document.getElementById('statsTagPanel');
  var host = document.getElementById('statsTagFilter');
  if (!panel || !host) return;

  var tags = Array.isArray(customTags) ? customTags.slice() : [];
  panel.hidden = tags.length === 0;
  if (!tags.length) {
    host.innerHTML = '';
    return;
  }

  var htmlParts = [
    '<button type="button" class="stats-tag-chip' +
      (!statTag ? ' is-active' : '') +
      '" data-tag="" onclick="setStatsTag(\'\',this)">全部</button>'
  ];

  tags.forEach(function (tag) {
    var tagColor = normalizeStatsColor(tag.color, '#7c3aed');
    var isActive = statTag === tag.id;
    htmlParts.push(
      '<button type="button" class="stats-tag-chip' +
        (isActive ? ' is-active' : '') +
        '" data-tag="' +
        html(tag.id) +
        '" style="--stats-tag-color:' +
        tagColor +
        '" onclick="setStatsTag(\'' +
        jsArgAttr(tag.id).slice(1, -1) +
        '\',this)">' +
        html(tag.name) +
        '</button>'
    );
  });

  host.innerHTML = htmlParts.join('');
}

function renderStatsSummary(state) {
  var host = document.getElementById('statsSummary');
  if (!host) return;

  var completedDelta = buildStatsChangeMeta(state.current.doneTasks, state.previous.doneTasks);
  var focusDelta = buildStatsChangeMeta(state.current.focusTotalMinutes, state.previous.focusTotalMinutes);
  var rateDelta = buildStatsChangeMeta(state.current.completionRate, state.previous.completionRate);

  var cards = [
    buildStatsMetricCard({
      modifier: 'done',
      icon: 'ph-check-square-offset',
      label: '已完成任务',
      valueHtml: String(state.current.doneTasks),
      delta: completedDelta
    }),
    buildStatsMetricCard({
      modifier: 'focus',
      icon: 'ph-timer',
      label: '专注总时长',
      valueHtml: formatStatsMinutesValue(state.current.focusTotalMinutes),
      delta: focusDelta
    }),
    buildStatsMetricCard({
      modifier: 'rate',
      icon: 'ph-target',
      label: '任务完成率',
      valueHtml: String(state.current.completionRate) + '<span class="stats-metric__unit">%</span>',
      delta: rateDelta
    }),
    buildStatsMetricCard({
      modifier: 'streak',
      icon: 'ph-fire-simple',
      label: '连续打卡',
      valueHtml: String(state.streakDays) + '<span class="stats-metric__unit">天</span>',
      delta: {
        text: state.streakDays > 0 ? '连续进行中' : '等待点亮',
        tone: state.streakDays > 0 ? 'positive' : 'neutral'
      }
    })
  ];

  host.innerHTML = cards.join('');
}

function renderStatsTrendCard(state) {
  var host = document.getElementById('statsTrendCard');
  if (!host) return;

  var buckets = state.current.buckets;
  var hasValues = buckets.some(function (bucket) {
    return bucket.total > 0;
  });

  if (!hasValues) {
    host.innerHTML = buildStatsEmptyCard('任务完成趋势', '当前时间范围内还没有可展示的任务数据。');
    return;
  }

  var maxValue = Math.max.apply(
    null,
    buckets.map(function (bucket) {
      return Math.max(bucket.total, bucket.done);
    })
  );
  maxValue = Math.max(4, maxValue);

  var chartWidth = getStatsChartWidth(buckets.length, 40, 58, 520);
  var guideRows = buildStatsGuideRows(maxValue);
  var groups = buckets
    .map(function (bucket) {
      return buildStatsTrendGroup(bucket, maxValue);
    })
    .join('');

  host.innerHTML =
    '<div class="stats-surface__head">' +
    '  <div>' +
    '    <h3 class="stats-surface__title">每日任务完成趋势</h3>' +
    '    <p class="stats-surface__sub">按计划日期查看任务总量与完成量的变化。</p>' +
    '  </div>' +
    '  <div class="stats-legend">' +
    '    <span class="stats-legend__item"><i class="stats-legend__dot stats-legend__dot--done" aria-hidden="true"></i>已完成</span>' +
    '    <span class="stats-legend__item"><i class="stats-legend__dot stats-legend__dot--total" aria-hidden="true"></i>总任务</span>' +
    '  </div>' +
    '</div>' +
    '<div class="stats-bar-chart">' +
    '  <div class="stats-bar-chart__scroll">' +
    '    <div class="stats-bar-chart__canvas" style="width:' +
    chartWidth +
    'px">' +
    guideRows +
    '      <div class="stats-bar-chart__groups">' +
    groups +
    '      </div>' +
    '    </div>' +
    '  </div>' +
    '</div>';
}

function renderStatsPriorityCard(state) {
  var host = document.getElementById('statsPriorityCard');
  if (!host) return;

  var totalTasks = state.current.totalTasks;
  var counts = state.current.priorityCounts;

  if (!totalTasks) {
    host.innerHTML = buildStatsEmptyCard('任务优先级分布', '当前时间范围内还没有任务，分布图会在有数据后自动生成。');
    return;
  }

  var ringBackground = buildStatsDonutBackground(counts, totalTasks);
  var legend = STATS_PRIORITY_META.map(function (meta) {
    var value = counts[meta.key] || 0;
    var percent = totalTasks ? Math.round((value / totalTasks) * 100) : 0;
    return (
      '<div class="stats-priority-legend__item">' +
      '  <span class="stats-priority-legend__label"><i class="stats-priority-legend__dot" style="background:' +
      meta.color +
      '" aria-hidden="true"></i>' +
      meta.label +
      '</span>' +
      '  <span class="stats-priority-legend__value">' +
      value +
      ' · ' +
      percent +
      '%</span>' +
      '</div>'
    );
  }).join('');

  host.innerHTML =
    '<div class="stats-surface__head">' +
    '  <div>' +
    '    <h3 class="stats-surface__title">任务优先级分布</h3>' +
    '    <p class="stats-surface__sub">看清当前任务池里哪些事情更值得优先推进。</p>' +
    '  </div>' +
    '</div>' +
    '<div class="stats-donut">' +
    '  <div class="stats-donut__ring" style="background:' +
    ringBackground +
    '">' +
    '    <div class="stats-donut__center">' +
    '      <strong>' +
    totalTasks +
    '</strong>' +
    '      <span>总任务</span>' +
    '    </div>' +
    '  </div>' +
    '</div>' +
    '<div class="stats-priority-legend">' +
    legend +
    '</div>';
}

function renderStatsFocusCard(state) {
  var host = document.getElementById('statsFocusCard');
  if (!host) return;

  var buckets = state.current.buckets.map(function (bucket) {
    return {
      key: bucket.key,
      value: bucket.focusMinutes,
      axisLabel: bucket.axisLabel,
      tooltip: bucket.tooltip,
      isFuture: bucket.isFuture
    };
  });

  var hasValues = buckets.some(function (bucket) {
    return bucket.value > 0;
  });

  if (!hasValues) {
    host.innerHTML = buildStatsEmptyCard('专注时长趋势', '还没有专注时长记录，完成带时长的任务或使用番茄钟后这里会自动更新。');
    return;
  }

  var maxValue = Math.max.apply(
    null,
    buckets.map(function (bucket) {
      return bucket.value;
    })
  );
  maxValue = Math.max(60, maxValue);

  var chartWidth = getStatsChartWidth(buckets.length, 34, 52, 520);
  var chartPayload = buildStatsLineChartPayload(buckets, maxValue, chartWidth);
  var delta = buildStatsChangeMeta(state.current.focusTotalMinutes, state.previous.focusTotalMinutes);

  host.innerHTML =
    '<div class="stats-surface__head">' +
    '  <div>' +
    '    <h3 class="stats-surface__title">专注时长趋势（分钟）</h3>' +
    '    <p class="stats-surface__sub">' +
    (state.focusSource === 'focus-timer'
      ? '优先使用番茄钟记录；没有记录时会自动回退到已完成任务时长。'
      : '当前使用已完成任务的预计时长作为专注时间参考。') +
    '</p>' +
    '  </div>' +
    '  <div class="stats-inline-meta stats-inline-meta--' +
    delta.tone +
    '">' +
    delta.text +
    '</div>' +
    '</div>' +
    '<div class="stats-line-chart">' +
    '  <div class="stats-line-chart__scroll">' +
    '    <div class="stats-line-chart__stage" style="width:' +
    chartWidth +
    'px">' +
    chartPayload.grid +
    '      <svg class="stats-line-chart__svg" viewBox="0 0 ' +
    chartWidth +
    ' 260" preserveAspectRatio="none" aria-hidden="true">' +
    '        <defs>' +
    '          <linearGradient id="statsFocusAreaFill" x1="0" y1="0" x2="0" y2="1">' +
    '            <stop offset="0%" stop-color="rgba(23, 190, 145, 0.34)"></stop>' +
    '            <stop offset="100%" stop-color="rgba(23, 190, 145, 0.02)"></stop>' +
    '          </linearGradient>' +
    '        </defs>' +
    '        <path class="stats-line-chart__area" d="' +
    chartPayload.areaPath +
    '" fill="url(#statsFocusAreaFill)"></path>' +
    '        <path class="stats-line-chart__path" d="' +
    chartPayload.linePath +
    '"></path>' +
    chartPayload.dots +
    '      </svg>' +
    '      <div class="stats-line-chart__labels">' +
    chartPayload.labels +
    '      </div>' +
    '    </div>' +
    '  </div>' +
    '</div>';
}

function renderStatsGoalCard(state) {
  var host = document.getElementById('statsGoalCard');
  if (!host) return;

  if (!state.goals.length) {
    host.innerHTML = buildStatsEmptyCard('长期目标执行进度', '还没有长期目标，创建后这里会显示最值得跟进的目标进度。');
    return;
  }

  var rows = state.goals
    .map(function (goal) {
      var theme = STATS_GOAL_THEME_META[goal.theme] || STATS_GOAL_THEME_META.learning;
      return (
        '<div class="stats-goal-row">' +
        '  <div class="stats-goal-row__head">' +
        '    <span class="stats-goal-row__title"><i class="ph ' +
        theme.icon +
        '" style="color:' +
        theme.color +
        '" aria-hidden="true"></i>' +
        html(goal.title) +
        '</span>' +
        '    <span class="stats-goal-row__pct">' +
        goal.progress +
        '%</span>' +
        '  </div>' +
        '  <div class="stats-goal-row__track">' +
        '    <span class="stats-goal-row__fill" style="width:' +
        goal.progress +
        '%;background:' +
        theme.color +
        '"></span>' +
        '  </div>' +
        '</div>'
      );
    })
    .join('');

  host.innerHTML =
    '<div class="stats-surface__head">' +
    '  <div>' +
    '    <h3 class="stats-surface__title">长期目标执行进度</h3>' +
    '    <p class="stats-surface__sub">挑出当前最值得关注的目标，避免只忙于眼前任务。</p>' +
    '  </div>' +
    '  <button type="button" class="stats-link-btn" onclick="openStatsGoalView()">查看全部</button>' +
    '</div>' +
    '<div class="stats-goal-list">' +
    rows +
    '</div>';
}

function buildStatsMetricCard(config) {
  return (
    '<article class="stats-metric stats-metric--' +
    config.modifier +
    '">' +
    '  <div class="stats-metric__icon"><i class="ph ' +
    config.icon +
    '" aria-hidden="true"></i></div>' +
    '  <div class="stats-metric__copy">' +
    '    <p class="stats-metric__label">' +
    config.label +
    '</p>' +
    '    <div class="stats-metric__row">' +
    '      <strong class="stats-metric__value">' +
    config.valueHtml +
    '</strong>' +
    '      <span class="stats-inline-meta stats-inline-meta--' +
    config.delta.tone +
    '">' +
    config.delta.text +
    '</span>' +
    '    </div>' +
    '  </div>' +
    '</article>'
  );
}

function buildStatsTrendGroup(bucket, maxValue) {
  return (
    '<div class="stats-bar-chart__group' +
    (bucket.isFuture ? ' is-future' : '') +
    '" title="' +
    html(bucket.tooltip + ' · 已完成 ' + bucket.done + ' / 总任务 ' + bucket.total) +
    '">' +
    '  <div class="stats-bar-chart__bars">' +
    '    <span class="stats-bar-chart__bar stats-bar-chart__bar--done" style="height:' +
    getStatsBarHeight(bucket.done, maxValue) +
    '%"></span>' +
    '    <span class="stats-bar-chart__bar stats-bar-chart__bar--total" style="height:' +
    getStatsBarHeight(bucket.total, maxValue) +
    '%"></span>' +
    '  </div>' +
    '  <span class="stats-bar-chart__label">' +
    html(bucket.axisLabel) +
    '</span>' +
    '</div>'
  );
}

function buildStatsGuideRows(maxValue) {
  var rows = [];
  for (var index = 4; index >= 1; index -= 1) {
    var value = Math.round((maxValue * index) / 4);
    rows.push(
      '<div class="stats-guide-row" style="bottom:' +
        (index / 4) * 100 +
        '%">' +
        '<span class="stats-guide-row__value">' +
        value +
        '</span>' +
        '<span class="stats-guide-row__line" aria-hidden="true"></span>' +
        '</div>'
    );
  }

  rows.push(
    '<div class="stats-guide-row stats-guide-row--base" style="bottom:0%">' +
      '<span class="stats-guide-row__value">0</span>' +
      '<span class="stats-guide-row__line" aria-hidden="true"></span>' +
      '</div>'
  );

  return rows.join('');
}

function buildStatsDonutBackground(counts, totalTasks) {
  var segments = [];
  var offset = 0;

  STATS_PRIORITY_META.forEach(function (meta) {
    var value = counts[meta.key] || 0;
    if (!value) return;
    var nextOffset = offset + (value / totalTasks) * 360;
    segments.push(meta.color + ' ' + offset + 'deg ' + nextOffset + 'deg');
    offset = nextOffset;
  });

  if (offset < 360) {
    segments.push('var(--stats-ring-track) ' + offset + 'deg 360deg');
  }

  return 'conic-gradient(' + segments.join(',') + ')';
}

function buildStatsLineChartPayload(series, maxValue, chartWidth) {
  var left = 24;
  var right = 24;
  var top = 18;
  var bottom = 34;
  var plotWidth = Math.max(1, chartWidth - left - right);
  var plotHeight = 200;
  var points = series.map(function (item, index) {
    var x = left;
    if (series.length > 1) {
      x = left + (plotWidth * index) / (series.length - 1);
    } else {
      x = left + plotWidth / 2;
    }

    var y = top + plotHeight - (item.value / maxValue) * plotHeight;
    return {
      x: roundStatsNumber(x),
      y: roundStatsNumber(y),
      value: item.value,
      axisLabel: item.axisLabel,
      tooltip: item.tooltip
    };
  });

  var linePath = '';
  var areaPath = '';
  var dots = [];

  points.forEach(function (point, index) {
    linePath += (index === 0 ? 'M' : 'L') + point.x + ' ' + point.y + ' ';
  });

  if (points.length) {
    areaPath =
      'M' +
      points[0].x +
      ' ' +
      (top + plotHeight) +
      ' ' +
      linePath.replace(/M/, 'L') +
      'L' +
      points[points.length - 1].x +
      ' ' +
      (top + plotHeight) +
      ' Z';
  }

  points.forEach(function (point) {
    dots.push(
      '<circle class="stats-line-chart__dot" cx="' +
        point.x +
        '" cy="' +
        point.y +
        '" r="4.5">' +
        '<title>' +
        html(point.tooltip + ' · ' + point.value + ' 分钟') +
        '</title>' +
        '</circle>'
    );
  });

  var gridRows = [];
  for (var index = 4; index >= 1; index -= 1) {
    var value = Math.round((maxValue * index) / 4);
    gridRows.push(
      '<div class="stats-line-chart__grid-row" style="bottom:' +
        (index / 4) * 100 +
        '%">' +
        '<span class="stats-line-chart__grid-value">' +
        value +
        '</span>' +
        '<span class="stats-line-chart__grid-line" aria-hidden="true"></span>' +
        '</div>'
    );
  }
  gridRows.push(
    '<div class="stats-line-chart__grid-row stats-line-chart__grid-row--base" style="bottom:0%">' +
      '<span class="stats-line-chart__grid-value">0</span>' +
      '<span class="stats-line-chart__grid-line" aria-hidden="true"></span>' +
      '</div>'
  );

  var labels = series
    .map(function (item) {
      return '<span class="stats-line-chart__label">' + html(item.axisLabel) + '</span>';
    })
    .join('');

  return {
    grid: '<div class="stats-line-chart__grid">' + gridRows.join('') + '</div>',
    linePath: linePath.trim(),
    areaPath: areaPath.trim(),
    dots: dots.join(''),
    labels: labels
  };
}

function buildStatsEmptyCard(title, message) {
  return (
    '<div class="stats-surface__head">' +
    '  <div>' +
    '    <h3 class="stats-surface__title">' +
    title +
    '</h3>' +
    '  </div>' +
    '</div>' +
    '<div class="stats-empty">' +
    '  <i class="ph ph-chart-bar" aria-hidden="true"></i>' +
    '  <p>' +
    message +
    '</p>' +
    '</div>'
  );
}

function createStatsBucketModel(entry) {
  return {
    key: entry.key,
    axisLabel: entry.axisLabel,
    tooltip: entry.tooltip,
    isFuture: !!entry.isFuture,
    total: 0,
    done: 0,
    pending: 0,
    doneDuration: 0,
    focusMinutes: 0,
    priority: {
      high: 0,
      medium: 0,
      low: 0
    }
  };
}

function buildStatsDayEntries(startDate, endDate, period, todayKey) {
  var entries = [];
  var totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;

  for (var index = 0; index < totalDays; index += 1) {
    var current = addDays(startDate, index);
    var dayKey = fd(current);
    entries.push({
      key: dayKey,
      axisLabel:
        period === 'week'
          ? STATS_WEEK_LABELS[current.getDay()]
          : shouldShowStatsTick(index, totalDays)
          ? String(current.getDate()) + '日'
          : '',
      tooltip: formatStatsDate(current),
      isFuture: dayKey > todayKey
    });
  }

  return entries;
}

function buildStatsMonthEntries(startDate, todayKey) {
  var year = startDate.getFullYear();
  var todayDate = parseDS(todayKey);
  var entries = [];

  for (var monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    var firstDay = new Date(year, monthIndex, 1);
    var lastDay = new Date(year, monthIndex + 1, 0);
    entries.push({
      key: year + '-' + String(monthIndex + 1).padStart(2, '0'),
      axisLabel: STATS_YEAR_MONTH_LABELS[monthIndex],
      tooltip: year + '年' + (monthIndex + 1) + '月',
      isFuture:
        year > todayDate.getFullYear() ||
        (year === todayDate.getFullYear() && monthIndex > todayDate.getMonth()),
      startKey: fd(firstDay),
      endKey: fd(lastDay)
    });
  }

  return entries;
}

function getStatsTasksByDate(dateKey) {
  var rows = (T[dateKey] || []).filter(function (task) {
    return isStatsCountedTask(task) && (!statTag || (task.tags || []).indexOf(statTag) >= 0);
  });
  return rows;
}

function getStatsCompletionStreak(todayKey) {
  var streak = 0;
  var currentDate = parseDS(todayKey);

  for (var index = 0; index < 365; index += 1) {
    var dateKey = fd(currentDate);
    var tasks = getStatsTasksByDate(dateKey);

    if (
      tasks.length > 0 &&
      tasks.every(function (task) {
        return isStatsTaskDone(task);
      })
    ) {
      streak += 1;
      currentDate.setDate(currentDate.getDate() - 1);
      continue;
    }

    if (tasks.length === 0 && index === 0) {
      currentDate.setDate(currentDate.getDate() - 1);
      continue;
    }

    break;
  }

  return streak;
}

function getStatsGoalRows() {
  var goals = readStatsGoalRows();
  var statusWeight = {
    active: 0,
    planned: 1,
    paused: 2,
    completed: 3
  };

  return goals
    .slice()
    .sort(function (left, right) {
      var leftWeight = statusWeight[left.status] == null ? 9 : statusWeight[left.status];
      var rightWeight = statusWeight[right.status] == null ? 9 : statusWeight[right.status];

      if (leftWeight !== rightWeight) {
        return leftWeight - rightWeight;
      }

      if (left.progress !== right.progress) {
        return right.progress - left.progress;
      }

      return String(left.deadline || '9999-12-31').localeCompare(String(right.deadline || '9999-12-31'));
    })
    .slice(0, 3);
}

function readStatsGoalRows() {
  if (typeof window.readLongTermGoalsFromStorage === 'function') {
    return window.readLongTermGoalsFromStorage() || [];
  }

  try {
    var raw = localStorage.getItem('tuole_long_term_goals_v1');
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function readStatsFocusState() {
  try {
    var raw = JSON.parse(localStorage.getItem('tuole_focus_v2') || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch (error) {
    return {};
  }
}

function syncStatsActiveControls() {
  var root = document.getElementById('statsMode');
  if (!root) return;

  root.dataset.statsView = statView;

  document.querySelectorAll('#statsViewNav .stats-view-nav__btn').forEach(function (button) {
    button.classList.toggle('is-active', button.getAttribute('data-view') === statView);
  });

  document.querySelectorAll('#statsPeriodNav .stats-period-nav__btn').forEach(function (button) {
    button.classList.toggle('is-active', button.getAttribute('data-period') === normalizeStatsPeriod(statP));
  });
}

function applyStatsViewState(shouldScroll) {
  var root = ensureStatsShell();
  if (!root) return;

  root.dataset.statsView = statView;

  if (!shouldScroll) return;

  var targetId = STATS_VIEW_META[statView] ? STATS_VIEW_META[statView].targetId : '';
  var target = targetId ? document.getElementById(targetId) : null;
  if (!target || typeof target.scrollIntoView !== 'function') {
    return;
  }

  try {
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  } catch (error) {
    target.scrollIntoView();
  }
}

function syncStatsActiveButton(selector, button) {
  if (!button) return;
  document.querySelectorAll(selector).forEach(function (node) {
    node.classList.toggle('is-active', node === button);
  });
}

function normalizeStatsPeriod(period) {
  if (period === 'month' || period === 'year' || period === 'week') {
    return period;
  }
  return 'week';
}

function normalizeStatsPriority(priority) {
  if (priority === 'high') return 'high';
  if (priority === 'low') return 'low';
  return 'medium';
}

function normalizeStatsColor(color, fallback) {
  if (/^#[0-9a-fA-F]{3,8}$/.test(String(color || '').trim())) {
    return String(color).trim();
  }
  return fallback;
}

function isStatsCountedTask(task) {
  return !!task && !task.dismissed && !task.frozen;
}

function isStatsTaskDone(task) {
  return !!task && (task.done || task.archived);
}

function getStatsTaskDurationMinutes(task) {
  var duration = parseInt(task && task.duration, 10);
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }
  return Math.min(1440, duration);
}

function getStatsFocusMinutes(record) {
  var minutes = record && parseInt(record.m, 10);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return 0;
  }
  return minutes;
}

function getStatsTagName(tagId) {
  if (!tagId) return '';
  var tag = (customTags || []).find(function (item) {
    return item.id === tagId;
  });
  return tag ? tag.name : '';
}

function formatStatsRangeText(startDate, endDate, label) {
  return formatStatsDate(startDate) + ' - ' + formatStatsDate(endDate) + '（' + label + '）';
}

function formatStatsDate(date) {
  return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日';
}

function formatStatsMinutesValue(totalMinutes) {
  var minutes = Math.max(0, parseInt(totalMinutes, 10) || 0);
  var hours = Math.floor(minutes / 60);
  var restMinutes = minutes % 60;

  if (hours <= 0) {
    return String(restMinutes) + '<span class="stats-metric__unit">m</span>';
  }

  return (
    String(hours) +
    '<span class="stats-metric__unit">h</span>' +
    String(restMinutes) +
    '<span class="stats-metric__unit">m</span>'
  );
}

function buildStatsChangeMeta(currentValue, previousValue) {
  if (currentValue === previousValue) {
    return {
      text: '持平',
      tone: 'neutral'
    };
  }

  if (!previousValue) {
    return {
      text: currentValue > 0 ? '新增' : '持平',
      tone: currentValue > 0 ? 'positive' : 'neutral'
    };
  }

  var delta = Math.round((Math.abs(currentValue - previousValue) / previousValue) * 100);
  var isUp = currentValue > previousValue;

  return {
    text: (isUp ? '↗ ' : '↘ ') + delta + '%',
    tone: isUp ? 'positive' : 'negative'
  };
}

function getStatsBarHeight(value, maxValue) {
  if (!value) return 0;
  return Math.max(6, Math.round((value / maxValue) * 100));
}

function getStatsChartWidth(count, denseWidth, roomyWidth, minWidth) {
  var widthPerItem = count > 20 ? denseWidth : roomyWidth;
  return Math.max(minWidth, count * widthPerItem);
}

function shouldShowStatsTick(index, total) {
  if (total <= 8) return true;
  if (total <= 16) return index % 2 === 0 || index === total - 1;
  if (total <= 24) return index % 3 === 0 || index === total - 1;
  return index % 5 === 0 || index === total - 1;
}

function getStatsWeekStart(date) {
  var result = startOfDay(date);
  var weekday = result.getDay() || 7;
  result.setDate(result.getDate() - (weekday - 1));
  return result;
}

function startOfDay(date) {
  var result = new Date(date.getTime());
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date, amount) {
  var result = new Date(date.getTime());
  result.setDate(result.getDate() + amount);
  return result;
}

function roundStatsNumber(value) {
  return Math.round(value * 100) / 100;
}
