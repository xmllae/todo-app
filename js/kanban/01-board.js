// 看板页面：场景导航、日程视图与侧栏洞察

const KB_DAY_START_HOUR = 6;
const KB_DAY_END_HOUR = 22;
const KB_DEFAULT_SCHEDULE_MINUTES = 60;
const KB_UNSCHEDULED_MINUTES = 30;

const KB_SCENES = [
  { id: 'today', label: '今日看板', icon: 'ph-calendar-check' },
  { id: 'mine', label: '我的任务', icon: 'ph-user' },
  { id: 'urgent', label: '重要且紧急', icon: 'ph-lightning' },
  { id: 'study', label: '学习成长', icon: 'ph-graduation-cap' },
  { id: 'team', label: '团队协作', icon: 'ph-briefcase' },
  { id: 'health', label: '休息与健康', icon: 'ph-smiley' },
  { id: 'all', label: '全部任务', icon: 'ph-circles-four' }
];

const KB_PERIOD_META = [
  { id: 'all', label: '全部时段' },
  { id: 'morning', label: '晨间' },
  { id: 'forenoon', label: '上午' },
  { id: 'afternoon', label: '下午' },
  { id: 'evening', label: '晚上' },
  { id: 'unset', label: '未安排' }
];

const KB_STATUS_OPTIONS = [
  { id: 'all', label: '全部任务' },
  { id: 'pending', label: '仅待办' },
  { id: 'done', label: '已完成' },
  { id: 'high', label: '高优先级' },
  { id: 'frozen', label: '已冻结' }
];

const KB_CATEGORY_META = {
  work: { id: 'work', label: '工作', color: '#5b4ee8' },
  study: { id: 'study', label: '学习', color: '#67cda3' },
  health: { id: 'health', label: '健康', color: '#ec6fa6' },
  planning: { id: 'planning', label: '规划', color: '#94aef7' },
  rest: { id: 'rest', label: '休息', color: '#f5b854' },
  other: { id: 'other', label: '任务', color: '#8b93b3' }
};

let kbSceneFilter = 'today';
let kbStatusFilter = 'all';
let kbStatusMenuOpen = false;

function kbEnsureShell() {
  const page = document.getElementById('kbPage');
  if (!page || page.dataset.kbReady === '1') {
    return;
  }

  page.dataset.kbReady = '1';
  page.addEventListener('click', kbHandlePageClick);

  if (!window.__kbModalClickBound) {
    document.addEventListener('click', kbHandleDocumentClick);
    window.__kbModalClickBound = true;
  }
}

function kbGetStatusOptionLabel(statusId) {
  const match = KB_STATUS_OPTIONS.find(function findOption(option) {
    return option.id === statusId;
  });

  return match ? match.label : KB_STATUS_OPTIONS[0].label;
}

function kbBuildStatusFilterHtml() {
  return `
    <div class="board-page__select">
      <button
        type="button"
        class="board-page__select-trigger"
        data-kb-action="toggle-status-menu"
        onclick="kbToggleStatusMenu()"
        aria-haspopup="menu"
        aria-expanded="${kbStatusMenuOpen ? 'true' : 'false'}"
      >
        <span>${esc(kbGetStatusOptionLabel(kbStatusFilter))}</span>
        <i class="ph ph-caret-down" aria-hidden="true"></i>
      </button>
      <div class="board-page__select-menu${kbStatusMenuOpen ? ' is-open' : ''}" role="menu" aria-label="任务筛选选项">
        ${KB_STATUS_OPTIONS.map(function mapOption(option) {
          return `
            <button
              type="button"
              class="board-page__select-option${option.id === kbStatusFilter ? ' is-active' : ''}"
              data-kb-action="set-status-filter"
              data-kb-status-id="${option.id}"
              onclick="kbSetStatusFilter('${option.id}')"
              role="menuitemradio"
              aria-checked="${option.id === kbStatusFilter ? 'true' : 'false'}"
            >
              <span>${esc(option.label)}</span>
              ${option.id === kbStatusFilter ? '<i class="ph ph-check" aria-hidden="true"></i>' : ''}
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function kbToggleStatusMenu() {
  kbStatusMenuOpen = !kbStatusMenuOpen;
  rKanban();
}

function kbSetStatusFilter(statusId) {
  kbStatusFilter = statusId || 'all';
  kbStatusMenuOpen = false;
  rKanban();
}

function kbGetTimePeriod(planTime) {
  if (!planTime) {
    return 'unset';
  }
  if (planTime < '09:00') {
    return 'morning';
  }
  if (planTime < '12:00') {
    return 'forenoon';
  }
  if (planTime < '18:00') {
    return 'afternoon';
  }
  return 'evening';
}

function kbParseTimeToMinutes(planTime) {
  const match = String(planTime || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function kbFormatMinutesClock(totalMinutes) {
  const safeMinutes = Math.max(0, Math.trunc(totalMinutes));
  const hours = Math.floor(safeMinutes / 60) % 24;
  const minutes = safeMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function kbFormatHours(minutes) {
  const value = minutes / 60;
  if (!value) {
    return '0 h';
  }
  if (Math.abs(value - Math.round(value)) < 0.01) {
    return `${Math.round(value)} h`;
  }
  return `${value.toFixed(1)} h`;
}

function kbGetEstimatedMinutes(task) {
  const rawDuration = parseInt(task && task.duration, 10);
  if (Number.isFinite(rawDuration) && rawDuration > 0) {
    return rawDuration;
  }
  if (task && task.planTime) {
    return KB_DEFAULT_SCHEDULE_MINUTES;
  }
  return KB_UNSCHEDULED_MINUTES;
}

function kbGetTaskEndMinutes(task) {
  const startMinutes = kbParseTimeToMinutes(task && task.planTime);
  if (startMinutes === null) {
    return null;
  }
  return Math.min(24 * 60, startMinutes + kbGetEstimatedMinutes(task));
}

function kbGetTaskRangeLabel(task) {
  const startMinutes = kbParseTimeToMinutes(task && task.planTime);
  if (startMinutes === null) {
    return '未安排时段';
  }

  const endMinutes = kbGetTaskEndMinutes(task);
  return `${kbFormatMinutesClock(startMinutes)} - ${kbFormatMinutesClock(endMinutes || startMinutes)}`;
}

function kbGetVisibleTasks() {
  generateRecurring(sel);
  checkUnfreeze();

  return (T[sel] || []).filter(function filterTask(task) {
    return isListedTask(task);
  });
}

function kbGetTaskTagNames(task) {
  return (task.tags || [])
    .map(function mapTag(tagId) {
      const tag = getTag(tagId);
      return tag ? tag.name : '';
    })
    .filter(Boolean);
}

function kbTaskText(task) {
  return [task && task.text, task && task.note, kbGetTaskTagNames(task).join(' ')]
    .join(' ')
    .toLowerCase();
}

function kbTaskHasAnyTag(task, tagNames) {
  const normalized = tagNames.map(function mapName(name) {
    return String(name).toLowerCase();
  });

  return kbGetTaskTagNames(task).some(function matchName(name) {
    return normalized.includes(String(name).toLowerCase());
  });
}

function kbTaskHasAnyKeyword(task, keywords) {
  const text = kbTaskText(task);
  return keywords.some(function matchKeyword(keyword) {
    return text.includes(String(keyword).toLowerCase());
  });
}

function kbMatchScene(task, sceneId) {
  if (sceneId === 'today' || sceneId === 'all') {
    return true;
  }

  if (sceneId === 'mine') {
    return !(task.tags || []).length || kbTaskHasAnyTag(task, ['个人', 'personal']);
  }

  if (sceneId === 'urgent') {
    return task.priority === 'high' && !task.done;
  }

  if (sceneId === 'study') {
    return kbTaskHasAnyTag(task, ['学习', 'study']) || kbTaskHasAnyKeyword(task, ['学习', '阅读', '笔记', '复习']);
  }

  if (sceneId === 'team') {
    return kbTaskHasAnyTag(task, ['工作', 'work']) || kbTaskHasAnyKeyword(task, ['项目', '会议', '协作', '同步', '评审']);
  }

  if (sceneId === 'health') {
    return kbTaskHasAnyTag(task, ['健康', 'health', '个人', 'personal']) || kbTaskHasAnyKeyword(task, ['运动', '健身', '跑步', '休息', '午休', '放松']);
  }

  return true;
}

function kbApplySceneFilter(tasks) {
  return tasks.filter(function filterTask(task) {
    return kbMatchScene(task, kbSceneFilter);
  });
}

function kbApplyStatusFilter(tasks) {
  if (kbStatusFilter === 'all') {
    return tasks;
  }

  if (kbStatusFilter === 'pending') {
    return tasks.filter(function filterTask(task) {
      return !task.done && !task.frozen;
    });
  }

  if (kbStatusFilter === 'done') {
    return tasks.filter(function filterTask(task) {
      return task.done;
    });
  }

  if (kbStatusFilter === 'high') {
    return tasks.filter(function filterTask(task) {
      return task.priority === 'high';
    });
  }

  if (kbStatusFilter === 'frozen') {
    return tasks.filter(function filterTask(task) {
      return task.frozen;
    });
  }

  return tasks;
}

function kbApplyTimeFilter(tasks) {
  if (kbTimeFilter === 'all') {
    return tasks;
  }

  return tasks.filter(function filterTask(task) {
    return kbGetTimePeriod(task.planTime || '') === kbTimeFilter;
  });
}

function kbCountTasksByPeriod(tasks, periodId) {
  if (periodId === 'all') {
    return tasks.length;
  }

  return tasks.filter(function filterTask(task) {
    return kbGetTimePeriod(task.planTime || '') === periodId;
  }).length;
}

function kbResolveTaskCategory(task) {
  const primaryTagId = Array.isArray(task.tags) && task.tags.length ? task.tags[0] : '';
  const primaryTag = primaryTagId ? getTag(primaryTagId) : null;

  if (kbTaskHasAnyKeyword(task, ['规划', '计划', '复盘', '总结']) || kbTaskHasAnyTag(task, ['规划'])) {
    return KB_CATEGORY_META.planning;
  }

  if (kbTaskHasAnyTag(task, ['健康', 'health']) || kbTaskHasAnyKeyword(task, ['运动', '健身', '跑步'])) {
    return KB_CATEGORY_META.health;
  }

  if (kbTaskHasAnyTag(task, ['学习', 'study']) || kbTaskHasAnyKeyword(task, ['学习', '阅读', '笔记', '复习'])) {
    return KB_CATEGORY_META.study;
  }

  if (kbTaskHasAnyTag(task, ['工作', 'work']) || kbTaskHasAnyKeyword(task, ['项目', '会议', '协作', '开发', '评审'])) {
    return KB_CATEGORY_META.work;
  }

  if (
    kbTaskHasAnyTag(task, ['个人', 'personal']) ||
    kbTaskHasAnyKeyword(task, ['休息', '午休', '放松', '散步', '咖啡', '冥想'])
  ) {
    return KB_CATEGORY_META.rest;
  }

  if (primaryTag) {
    return {
      id: primaryTag.id,
      label: primaryTag.name,
      color: primaryTag.color || KB_CATEGORY_META.other.color
    };
  }

  if (!(task.tags || []).length) {
    return KB_CATEGORY_META.planning;
  }

  return KB_CATEGORY_META.other;
}

function kbGetTagCloudSource() {
  return customTags && customTags.length ? customTags : DEFAULT_TAGS;
}

function kbBuildSceneNavHtml(tasks) {
  return KB_SCENES.map(function mapScene(scene) {
    const count = tasks.filter(function filterTask(task) {
      return kbMatchScene(task, scene.id);
    }).length;

    return `
      <button
        type="button"
        class="board-page__nav-item${kbSceneFilter === scene.id ? ' board-page__nav-item--active' : ''}"
        data-kb-action="set-scene"
        data-kb-scene-id="${scene.id}"
      >
        <span class="board-page__nav-icon" aria-hidden="true"><i class="ph ${scene.icon}"></i></span>
        <span class="board-page__nav-label">${scene.label}</span>
        <span class="board-page__nav-count">${count}</span>
      </button>
    `;
  }).join('');
}

function kbBuildTagCloudHtml() {
  return kbGetTagCloudSource()
    .slice(0, 8)
    .map(function mapTag(tag) {
      return `<span class="board-page__tag-pill" style="--board-tag-color:${tag.color}">${esc(tag.name)}</span>`;
    })
    .join('');
}

function kbBuildFilterBarHtml(tasks) {
  return KB_PERIOD_META.map(function mapPeriod(period) {
    const count = kbCountTasksByPeriod(tasks, period.id);
    return `
      <button
        type="button"
        class="board-page__filter-chip${kbTimeFilter === period.id ? ' board-page__filter-chip--active' : ''}"
        data-kb-action="set-time-filter"
        data-kb-time-filter="${period.id}"
      >
        <span>${period.label}</span>
        <span class="board-page__filter-count">${count}</span>
      </button>
    `;
  }).join('');
}

function kbSortTasksByPriorityAndTime(tasks) {
  const priorityRank = { high: 0, medium: 1, low: 2, normal: 1 };

  return tasks.slice().sort(function sortTask(a, b) {
    const startA = kbParseTimeToMinutes(a.planTime);
    const startB = kbParseTimeToMinutes(b.planTime);
    const safeA = startA === null ? Number.MAX_SAFE_INTEGER : startA;
    const safeB = startB === null ? Number.MAX_SAFE_INTEGER : startB;
    if (safeA !== safeB) {
      return safeA - safeB;
    }

    const rankA = priorityRank[a.priority || 'medium'] ?? 3;
    const rankB = priorityRank[b.priority || 'medium'] ?? 3;
    if (rankA !== rankB) {
      return rankA - rankB;
    }

    return (a.created || 0) - (b.created || 0);
  });
}

function kbBuildTaskNote(task) {
  if (task.note) {
    return esc(String(task.note).trim().slice(0, 42)) + (String(task.note).trim().length > 42 ? '…' : '');
  }

  const subtasks = Array.isArray(task.subtasks) ? task.subtasks.length : 0;
  if (subtasks) {
    return `包含 ${subtasks} 项子任务`;
  }

  const tagNames = kbGetTaskTagNames(task);
  if (tagNames.length) {
    return esc(tagNames.join(' · '));
  }

  return task.done ? '已完成，可点击查看复盘内容' : '点击查看详情并前往任务页编辑';
}

function kbBuildTaskCardHtml(task) {
  const category = kbResolveTaskCategory(task);
  const span = Math.max(1, Math.min(3, Math.ceil(kbGetEstimatedMinutes(task) / 60)));
  const meta = [];

  meta.push(`<span>${kbGetTaskRangeLabel(task)}</span>`);
  meta.push(`<span>预计 ${esc(fmtDs(kbGetEstimatedMinutes(task)))}</span>`);

  if (task.priority === 'high') {
    meta.push('<span>高优先级</span>');
  } else if (task.frozen) {
    meta.push('<span>已冻结</span>');
  } else if (task.done) {
    meta.push('<span>已完成</span>');
  }

  return `
    <button
      type="button"
      class="board-page__task${task.done ? ' board-page__task--done' : ''}${task.frozen ? ' board-page__task--frozen' : ''}"
      data-kb-action="open-task-detail"
      data-kb-task-id="${task.id}"
      style="--board-task-accent:${category.color};--board-task-span:${span}"
    >
      <span class="board-page__task-top">
        <span class="board-page__task-title">${esc(task.text)}</span>
        <span class="board-page__task-badge">${esc(category.label)}</span>
      </span>
      <span class="board-page__task-meta">${meta.join('')}</span>
      <span class="board-page__task-note">${kbBuildTaskNote(task)}</span>
    </button>
  `;
}

function kbBuildAgendaHtml(tasks) {
  const sortedTasks = kbSortTasksByPriorityAndTime(tasks);
  const scheduledMap = new Map();
  const unscheduledTasks = [];

  for (let hour = KB_DAY_START_HOUR; hour <= KB_DAY_END_HOUR; hour += 1) {
    scheduledMap.set(hour, []);
  }

  sortedTasks.forEach(function pushTask(task) {
    const startMinutes = kbParseTimeToMinutes(task.planTime);
    if (startMinutes === null) {
      unscheduledTasks.push(task);
      return;
    }

    const hour = Math.max(KB_DAY_START_HOUR, Math.min(KB_DAY_END_HOUR, Math.floor(startMinutes / 60)));
    scheduledMap.get(hour).push(task);
  });

  const rows = [];
  for (let hour = KB_DAY_START_HOUR; hour <= KB_DAY_END_HOUR; hour += 1) {
    const hourTasks = scheduledMap.get(hour) || [];
    rows.push(`
      <div class="board-page__agenda-row">
        <div class="board-page__agenda-time">${String(hour).padStart(2, '0')}:00</div>
        <div class="board-page__agenda-track">
          ${hourTasks.length ? hourTasks.map(kbBuildTaskCardHtml).join('') : '<div class="board-page__agenda-placeholder"></div>'}
        </div>
      </div>
    `);
  }

  if (unscheduledTasks.length) {
    rows.push(`
      <div class="board-page__agenda-extra">
        <div class="board-page__section-head">
          <div class="board-page__section-title">未安排时段</div>
          <div class="board-page__section-hint">${unscheduledTasks.length} 项</div>
        </div>
        <div class="board-page__loose-list">${unscheduledTasks.map(kbBuildTaskCardHtml).join('')}</div>
      </div>
    `);
  }

  if (!sortedTasks.length) {
    rows.push(`
      <div class="board-page__agenda-extra">
        <div class="board-page__empty">
          <div class="board-page__empty-copy">
            <strong>当前筛选下没有任务</strong>
            <span>换一个场景或状态试试，或者直接从右上角添加一项新的安排。</span>
          </div>
        </div>
      </div>
    `);
  }

  return rows.join('');
}

function kbBuildSummaryCardHtml(tasks) {
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(function filterTask(task) {
    return task.done;
  }).length;
  const totalMinutes = tasks.reduce(function sumMinutes(sum, task) {
    return sum + kbGetEstimatedMinutes(task);
  }, 0);
  const completion = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const shortDate = disp(sel).split(' ')[0] || disp(sel);

  return `
    <div class="board-page__card-head">
      <div class="board-page__card-title"><i class="ph ph-chart-bar"></i><span>今日总览</span></div>
      <div class="board-page__card-meta">${esc(shortDate)}</div>
    </div>
    <div class="board-page__summary-grid">
      <div class="board-page__summary-item">
        <div class="board-page__summary-value board-page__summary-value--accent">${totalTasks}</div>
        <div class="board-page__summary-label">总任务</div>
      </div>
      <div class="board-page__summary-item">
        <div class="board-page__summary-value">${esc(kbFormatHours(totalMinutes))}</div>
        <div class="board-page__summary-label">预计时长</div>
      </div>
      <div class="board-page__summary-item">
        <div class="board-page__summary-value">${completion}%</div>
        <div class="board-page__summary-label">完成率</div>
      </div>
    </div>
    <div class="board-page__progress">
      <div class="board-page__progress-track">
        <div class="board-page__progress-fill" style="width:${completion}%"></div>
      </div>
    </div>
  `;
}

function kbGetDistributionItems(tasks) {
  const bucketOrder = ['work', 'study', 'health', 'planning', 'rest'];
  const buckets = {};

  bucketOrder.forEach(function seedBucket(id) {
    buckets[id] = {
      id: id,
      label: KB_CATEGORY_META[id].label,
      color: KB_CATEGORY_META[id].color,
      minutes: 0
    };
  });

  tasks.forEach(function addTask(task) {
    const category = kbResolveTaskCategory(task);
    const targetId = buckets[category.id] ? category.id : 'planning';
    buckets[targetId].minutes += kbGetEstimatedMinutes(task);
  });

  return bucketOrder.map(function mapBucket(id) {
    return buckets[id];
  });
}

function kbBuildDistributionCardHtml(tasks) {
  const items = kbGetDistributionItems(tasks).filter(function filterItem(item) {
    return item.minutes > 0;
  });
  const totalMinutes = items.reduce(function sumMinutes(sum, item) {
    return sum + item.minutes;
  }, 0);

  if (!totalMinutes) {
    return `
      <div class="board-page__card-head">
        <div class="board-page__card-title"><i class="ph ph-clock"></i><span>时间分布</span></div>
      </div>
      <div class="board-page__empty">
        <div class="board-page__empty-copy">
          <strong>还没有足够的数据</strong>
          <span>给任务补上计划时间或预计时长后，这里会自动生成专注结构图。</span>
        </div>
      </div>
    `;
  }

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = items.map(function mapItem(item) {
    const share = item.minutes / totalMinutes;
    const arc = share * circumference;
    const segmentHtml = `
      <circle
        cx="60"
        cy="60"
        r="${radius}"
        fill="none"
        stroke="${item.color}"
        stroke-width="12"
        stroke-linecap="round"
        stroke-dasharray="${arc} ${circumference - arc}"
        stroke-dashoffset="${-offset}"
        transform="rotate(-90 60 60)"
      ></circle>
    `;
    offset += arc;
    return segmentHtml;
  }).join('');

  const legendRows = items.map(function mapItem(item) {
    const share = Math.round((item.minutes / totalMinutes) * 100);
    return `
      <div class="board-page__legend-row">
        <span class="board-page__legend-dot" style="background:${item.color}"></span>
        <span>${esc(item.label)}</span>
        <span class="board-page__legend-hours">${esc(kbFormatHours(item.minutes))}</span>
        <span class="board-page__legend-share">${share}%</span>
      </div>
    `;
  }).join('');

  return `
    <div class="board-page__card-head">
      <div class="board-page__card-title"><i class="ph ph-clock"></i><span>时间分布</span></div>
    </div>
    <div class="board-page__donut-layout">
      <div class="board-page__donut-wrap">
        <div class="board-page__donut">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle class="board-page__donut-base" cx="60" cy="60" r="${radius}" fill="none" stroke-width="12"></circle>
            ${segments}
          </svg>
          <div class="board-page__donut-center">
            <div class="board-page__donut-value">${esc(kbFormatHours(totalMinutes))}</div>
            <div class="board-page__donut-label">总时长</div>
          </div>
        </div>
      </div>
      <div class="board-page__legend">${legendRows}</div>
    </div>
  `;
}

function kbBuildFocusCardHtml(tasks) {
  const focusTasks = kbSortTasksByPriorityAndTime(
    tasks.filter(function filterTask(task) {
      return !task.done;
    })
  ).slice(0, 3);

  if (!focusTasks.length) {
    return `
      <div class="board-page__card-head">
        <div class="board-page__card-title"><i class="ph ph-list-checks"></i><span>本日重点</span></div>
      </div>
      <div class="board-page__empty">
        <div class="board-page__empty-copy">
          <strong>已经没有待办重点</strong>
          <span>当前筛选下的任务都处理得差不多了，可以切到别的场景继续推进。</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="board-page__card-head">
      <div class="board-page__card-title"><i class="ph ph-list-checks"></i><span>本日重点</span></div>
    </div>
    <div class="board-page__focus-list">
      ${focusTasks.map(function mapTask(task, index) {
        return `
          <div class="board-page__focus-item">
            <span class="board-page__focus-rank">${index + 1}</span>
            <div class="board-page__focus-copy">
              <strong>${esc(task.text)}</strong>
              <span>${esc(kbGetTaskRangeLabel(task))}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function kbBuildEnergyCardHtml(tasks) {
  const scheduledTasks = tasks.filter(function filterTask(task) {
    return kbParseTimeToMinutes(task.planTime) !== null;
  });

  if (!scheduledTasks.length) {
    return `
      <div class="board-page__card-head">
        <div class="board-page__card-title"><i class="ph ph-sparkle"></i><span>专注时段建议</span></div>
      </div>
      <div class="board-page__empty">
        <div class="board-page__empty-copy">
          <strong>暂时无法判断你的高峰</strong>
          <span>只要给任务补上时间安排，这里就能根据全天分布生成专注建议。</span>
        </div>
      </div>
    `;
  }

  const slots = [6, 9, 12, 15, 18, 21];
  const values = slots.map(function mapSlot(startHour) {
    const slotStart = startHour * 60;
    const slotEnd = slotStart + 180;

    return scheduledTasks.reduce(function sumMinutes(sum, task) {
      const taskStart = kbParseTimeToMinutes(task.planTime);
      const taskEnd = kbGetTaskEndMinutes(task);
      if (taskStart === null || taskEnd === null) {
        return sum;
      }
      const overlap = Math.max(0, Math.min(taskEnd, slotEnd) - Math.max(taskStart, slotStart));
      return sum + overlap;
    }, 0);
  });

  const peakValue = Math.max.apply(null, values);
  const peakIndex = values.indexOf(peakValue);
  const peakLabel = ['上午', '上午', '中午', '下午', '傍晚', '夜间'][peakIndex] || '白天';
  const graphWidth = 280;
  const graphHeight = 120;
  const graphTop = 12;
  const graphBottom = 92;
  const maxValue = Math.max(peakValue, 60);

  const points = values.map(function mapPoint(value, index) {
    const x = 14 + index * ((graphWidth - 28) / (values.length - 1));
    const progress = value / maxValue;
    const y = graphBottom - progress * (graphBottom - graphTop);
    return { x: x, y: y };
  });

  const linePoints = points.map(function mapPoint(point) {
    return `${point.x},${point.y}`;
  }).join(' ');

  const areaPath = `M ${points[0].x} ${graphBottom} L ${linePoints.replace(/,/g, ' ')} L ${
    points[points.length - 1].x
  } ${graphBottom} Z`;

  return `
    <div class="board-page__card-head">
      <div class="board-page__card-title"><i class="ph ph-sparkle"></i><span>专注时段建议</span></div>
    </div>
    <div class="board-page__energy-note">你的专注高峰更适合放在${peakLabel}</div>
    <div class="board-page__energy-chart">
      <svg class="board-page__energy-svg" viewBox="0 0 ${graphWidth} 120" aria-hidden="true">
        <path d="${areaPath}" fill="url(#kbEnergyFill)"></path>
        <polyline points="${linePoints}" fill="none" stroke="${KB_CATEGORY_META.work.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
        <defs>
          <linearGradient id="kbEnergyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#a78bfa" stop-opacity="0.42"></stop>
            <stop offset="100%" stop-color="#a78bfa" stop-opacity="0.02"></stop>
          </linearGradient>
        </defs>
      </svg>
      <div class="board-page__energy-axis">
        ${slots.map(function mapSlot(hour) {
          return `<span>${hour}时</span>`;
        }).join('')}
      </div>
    </div>
  `;
}

function kbBuildModalTagList(task) {
  const tags = (task.tags || [])
    .map(function mapTag(tagId) {
      return getTag(tagId);
    })
    .filter(Boolean);

  if (!tags.length) {
    return '';
  }

  return `<div class="board-page__tag-cloud">${tags
    .map(function mapTag(tag) {
      return `<span class="board-page__tag-pill" style="--board-tag-color:${tag.color}">${esc(tag.name)}</span>`;
    })
    .join('')}</div>`;
}

function kbBuildDetailHtml(task) {
  const category = kbResolveTaskCategory(task);
  const modalChips = [
    `<span class="board-page__modal-chip" style="color:${category.color}">${esc(category.label)}</span>`,
    `<span class="board-page__modal-chip">${esc(kbGetTaskRangeLabel(task))}</span>`,
    `<span class="board-page__modal-chip">预计 ${esc(fmtDs(kbGetEstimatedMinutes(task)))}</span>`
  ];

  if (task.done) {
    modalChips.push('<span class="board-page__modal-chip">已完成</span>');
  } else if (task.frozen) {
    modalChips.push('<span class="board-page__modal-chip">已冻结</span>');
  } else if (task.priority === 'high') {
    modalChips.push('<span class="board-page__modal-chip">高优先级</span>');
  }

  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];

  return `
    <div class="board-page__modal">
      <div class="board-page__modal-title">${esc(task.text)}</div>
      <div class="board-page__modal-meta">${modalChips.join('')}</div>
      ${kbBuildModalTagList(task)}
      ${
        task.note
          ? `<div class="board-page__modal-note">${esc(task.note)}</div>`
          : ''
      }
      ${
        subtasks.length
          ? `
            <div>
              <div class="board-page__section-head">
                <div class="board-page__section-title">子任务</div>
                <div class="board-page__section-hint">${subtasks.length} 项</div>
              </div>
              <ul class="board-page__modal-subtasks">
                ${subtasks
                  .map(function mapSubtask(subtask) {
                    return `<li>${subtask.done ? `已完成 · ${esc(subtask.text)}` : esc(subtask.text)}</li>`;
                  })
                  .join('')}
              </ul>
            </div>
          `
          : ''
      }
      <div class="board-page__modal-actions">
        <button type="button" class="board-page__modal-btn board-page__modal-btn--ghost" data-kb-modal-action="close">关闭</button>
        <button type="button" class="board-page__modal-btn board-page__modal-btn--primary" data-kb-modal-action="open-task" data-kb-task-id="${task.id}">前往任务页</button>
      </div>
    </div>
  `;
}

function showKbDetail(taskId) {
  const task = (T[sel] || []).find(function findTask(item) {
    return Number(item.id) === Number(taskId);
  });
  if (!task) {
    return;
  }

  const modalBody = document.getElementById('mBody');
  if (!modalBody) {
    return;
  }

  modalBody.innerHTML = kbBuildDetailHtml(task);
  document.getElementById('mBg')?.classList.add('show');
}

function kbOpenTaskInSchedule(taskId) {
  clM();
  navigate('/');
  setTimeout(function deferOpen() {
    expandedId = Number(taskId);
    if (typeof rT === 'function') {
      rT();
    }
  }, 40);
}

function kbHandleDocumentClick(event) {
  const statusAction = event.target.closest(
    '[data-kb-action="toggle-status-menu"], [data-kb-action="set-status-filter"]'
  );
  if (statusAction) {
    return;
  }

  if (kbStatusMenuOpen && !event.target.closest('#kbStatusFilter')) {
    kbStatusMenuOpen = false;
    rKanban();
    return;
  }

  const trigger = event.target.closest('[data-kb-modal-action]');
  if (!trigger) {
    return;
  }

  const action = trigger.getAttribute('data-kb-modal-action');
  if (action === 'close') {
    clM();
    return;
  }

  if (action === 'open-task') {
    kbOpenTaskInSchedule(trigger.getAttribute('data-kb-task-id'));
  }
}

function kbRunInTaskMode(callback) {
  navigate('/');
  if (typeof callback === 'function') {
    setTimeout(callback, 40);
  }
}

function kbHandlePageClick(event) {
  const trigger = event.target.closest('[data-kb-action]');
  if (!trigger) {
    return;
  }

  const action = trigger.getAttribute('data-kb-action');
  if (action === 'add-task') {
    kbRunInTaskMode(function openTaskInput() {
      if (typeof showAddTaskRow === 'function') {
        showAddTaskRow();
      }
    });
    return;
  }

  if (action === 'quick-record') {
    kbRunInTaskMode(function openQuickImport() {
      if (typeof toggleQuickImport === 'function') {
        toggleQuickImport();
      }
    });
    return;
  }

  if (action === 'focus-timer') {
    kbRunInTaskMode(function noop() {});
    return;
  }

  if (action === 'open-calendar') {
    kbRunInTaskMode(function openTaskDatePickerFromBoard() {
      if (typeof openTaskDatePicker === 'function') {
        openTaskDatePicker();
      }
    });
    return;
  }

  if (action === 'prev-day') {
    quickGo(-1);
    return;
  }

  if (action === 'next-day') {
    quickGo(1);
    return;
  }

  if (action === 'today') {
    quickGo(0);
    return;
  }

  if (action === 'set-scene') {
    kbSceneFilter = trigger.getAttribute('data-kb-scene-id') || 'today';
    rKanban();
    return;
  }

  if (action === 'set-time-filter') {
    kbTimeFilter = trigger.getAttribute('data-kb-time-filter') || 'all';
    rKanban();
    return;
  }

  if (action === 'open-task-detail') {
    showKbDetail(trigger.getAttribute('data-kb-task-id'));
  }
}

function rKanban() {
  kbEnsureShell();
  kbTimeFilter = 'all';

  const allTasks = kbGetVisibleTasks();
  const sceneTasks = kbApplySceneFilter(allTasks);
  const statusTasks = kbApplyStatusFilter(sceneTasks);
  const timeFilteredTasks = kbApplyTimeFilter(statusTasks);

  const dateLabel = document.getElementById('kbDateLabel');
  if (dateLabel) {
    dateLabel.textContent = disp(sel);
  }

  const statusFilter = document.getElementById('kbStatusFilter');
  if (statusFilter) {
    statusFilter.innerHTML = kbBuildStatusFilterHtml();
  }

  const sceneNav = document.getElementById('kbSceneNav');
  if (sceneNav) {
    sceneNav.innerHTML = kbBuildSceneNavHtml(allTasks);
  }

  const tagCloud = document.getElementById('kbTagCloud');
  if (tagCloud) {
    tagCloud.innerHTML = kbBuildTagCloudHtml();
  }

  const filterBar = document.getElementById('kbFilterBar');
  if (filterBar) {
    filterBar.innerHTML = kbBuildFilterBarHtml(statusTasks);
  }

  const agenda = document.getElementById('kbAgenda');
  if (agenda) {
    agenda.innerHTML = kbBuildAgendaHtml(timeFilteredTasks);
  }

  const summaryCard = document.getElementById('kbSummaryCard');
  if (summaryCard) {
    summaryCard.innerHTML = kbBuildSummaryCardHtml(statusTasks);
  }

  const distributionCard = document.getElementById('kbDistributionCard');
  if (distributionCard) {
    distributionCard.innerHTML = kbBuildDistributionCardHtml(statusTasks);
  }

  const focusCard = document.getElementById('kbFocusCard');
  if (focusCard) {
    focusCard.innerHTML = kbBuildFocusCardHtml(statusTasks);
  }

  const energyCard = document.getElementById('kbEnergyCard');
  if (energyCard) {
    energyCard.innerHTML = kbBuildEnergyCardHtml(statusTasks);
  }
}
