(function () {
  if (window.__goalViewBound) {
    return;
  }
  window.__goalViewBound = true;

  const GOAL_MODE = 'goal-view';
  const GOAL_CLASS = 'task-mode--goal-view';
  const GOAL_NAV_CLASS = 'date-nav--goal-view';
  const GOAL_SHELL_CLASS = 'goal-view-shell';
  const GOAL_STORAGE_KEY = 'tuole_long_term_goals_v1';
  const GOAL_FILTER_STORAGE_KEY = 'tuole_goal_view_filter_v1';
  const GOAL_SORT_STORAGE_KEY = 'tuole_goal_view_sort_v1';
  const GOAL_PAGE_SIZE_STORAGE_KEY = 'tuole_goal_view_page_size_v1';
  const GOAL_PAGE_SIZES = [4, 8, 12];
  const GOAL_FILTERS = ['all', 'active', 'completed', 'paused', 'planned'];
  const GOAL_SORT_MODES = ['progress', 'deadline', 'milestones'];
  const GOAL_STATUSES = ['active', 'completed', 'paused', 'planned'];
  const GOAL_THEMES = {
    learning: {
      label: '学习成长',
      icon: 'ph-graduation-cap',
      accent: '#6d28d9',
      soft: 'rgba(109, 40, 217, .12)',
      surface: 'rgba(245, 243, 255, .96)',
      progress: 'linear-gradient(90deg, #8b5cf6, #6d28d9)'
    },
    health: {
      label: '健康习惯',
      icon: 'ph-person-simple-run',
      accent: '#16a34a',
      soft: 'rgba(22, 163, 74, .12)',
      surface: 'rgba(240, 253, 244, .96)',
      progress: 'linear-gradient(90deg, #4ade80, #16a34a)'
    },
    reading: {
      label: '阅读积累',
      icon: 'ph-book-open-text',
      accent: '#f97316',
      soft: 'rgba(249, 115, 22, .12)',
      surface: 'rgba(255, 247, 237, .96)',
      progress: 'linear-gradient(90deg, #fb923c, #f97316)'
    },
    finance: {
      label: '收入增长',
      icon: 'ph-wallet',
      accent: '#2563eb',
      soft: 'rgba(37, 99, 235, .12)',
      surface: 'rgba(239, 246, 255, .96)',
      progress: 'linear-gradient(90deg, #60a5fa, #2563eb)'
    },
    career: {
      label: '职业进阶',
      icon: 'ph-briefcase',
      accent: '#0f766e',
      soft: 'rgba(15, 118, 110, .12)',
      surface: 'rgba(240, 253, 250, .96)',
      progress: 'linear-gradient(90deg, #2dd4bf, #0f766e)'
    },
    creative: {
      label: '创作表达',
      icon: 'ph-rocket-launch',
      accent: '#db2777',
      soft: 'rgba(219, 39, 119, .12)',
      surface: 'rgba(253, 242, 248, .96)',
      progress: 'linear-gradient(90deg, #f472b6, #db2777)'
    }
  };
  const GOAL_STATUS_LABELS = {
    all: '全部状态',
    active: '进行中',
    completed: '已完成',
    paused: '暂停中',
    planned: '未开始'
  };
  const GOAL_SORT_LABELS = {
    progress: '按进度',
    deadline: '按截止',
    milestones: '按里程碑'
  };
  const GOAL_STATUS_ORDER = {
    active: 0,
    planned: 1,
    paused: 2,
    completed: 3
  };
  const GOAL_DETAIL_TABS = ['milestones', 'plan', 'records', 'files'];
  const GOAL_MILESTONE_LIBRARY = {
    learning: [
      { title: '搭建学习路线', summary: '明确课程、资料和练习节奏，先搭好完整的学习框架。' },
      { title: '完成核心课程', summary: '围绕重点知识点推进系统学习，并沉淀可复用笔记。' },
      { title: '输出实战案例', summary: '把学习内容落到真实案例上，形成能展示的成果。' },
      { title: '模拟考试冲刺', summary: '通过真题、错题复盘和查漏补缺提升通过率。' },
      { title: '考试与复盘', summary: '完成最终考试，并整理后续可以继续深化的方向。' }
    ],
    health: [
      { title: '建立训练节奏', summary: '先固定每周训练频率，让计划具备连续性。' },
      { title: '打好力量基础', summary: '围绕核心动作逐步提升稳定性和基础力量。' },
      { title: '强化专项表现', summary: '根据目标提升动作质量、负重或耐力表现。' },
      { title: '优化恢复机制', summary: '把睡眠、拉伸和饮食配合进训练节奏。' },
      { title: '阶段复盘升级', summary: '回顾训练数据，调整下一阶段的重点方向。' }
    ],
    reading: [
      { title: '规划年度书单', summary: '先定主题、定数量，避免阅读方向过于分散。' },
      { title: '建立阅读节奏', summary: '把阅读安排进每周固定时间，形成稳定输入。' },
      { title: '沉淀知识卡片', summary: '把书中观点转成自己的卡片和摘录体系。' },
      { title: '输出读书内容', summary: '通过笔记、分享或文章把阅读转化成表达。' },
      { title: '年度复盘升级', summary: '复盘全年输入与输出，优化下一轮阅读策略。' }
    ],
    finance: [
      { title: '明确收入模型', summary: '先找清最可行的产品、服务或收入路径。' },
      { title: '打磨核心产品', summary: '把交付内容和价值表达做成可持续复用的方案。' },
      { title: '验证获客渠道', summary: '测试稳定带来线索或订单的主要渠道。' },
      { title: '稳定复购节奏', summary: '围绕老客户和口碑建立复购与转介绍机制。' },
      { title: '固化复盘机制', summary: '把数据复盘、预算和调整节奏纳入日常运营。' }
    ],
    career: [
      { title: '明确能力目标', summary: '先确认要补齐的核心能力和岗位目标。' },
      { title: '补齐关键技能', summary: '通过课程、项目或训练集中补强关键短板。' },
      { title: '积累项目成果', summary: '把学习结果转成可证明能力的项目经验。' },
      { title: '打造职业名片', summary: '完善简历、作品集和对外表达方式。' },
      { title: '推进岗位跃迁', summary: '围绕面试、内部机会或职业转型发起行动。' }
    ],
    creative: [
      { title: '确定创作主题', summary: '先聚焦主题和受众，避免创作方向发散。' },
      { title: '建立更新节奏', summary: '形成稳定的创作频率和内容生产流程。' },
      { title: '打磨代表作品', summary: '聚焦少量高质量作品，形成可辨识风格。' },
      { title: '扩大传播反馈', summary: '通过发布和互动获取真实反馈并迭代内容。' },
      { title: '沉淀创作方法', summary: '总结流程和模板，让创作更高效可复制。' }
    ]
  };

  let goalViewFilter = readSavedGoalFilter();
  let goalViewSortMode = readSavedGoalSortMode();
  let goalViewPage = 1;
  let goalViewPageSize = readSavedGoalPageSize();
  let goalViewActiveId = '';
  let goalViewDetailTab = GOAL_DETAIL_TABS[0];

  function html(value) {
    if (typeof esc === 'function') {
      return esc(value);
    }
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  function jsArgAttr(value) {
    const raw = value == null ? '' : String(value);
    return "'" + raw.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ') + "'";
  }

  function clampNumber(value, min, max, fallback) {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, parsed));
  }

  function todayKey() {
    return typeof fd === 'function' ? fd(new Date()) : '';
  }

  function createGoalId() {
    return 'goal-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  function isGoalMode() {
    return typeof getTaskQuickMode === 'function' && getTaskQuickMode() === GOAL_MODE;
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

  function normalizeGoalFilter(filter) {
    return GOAL_FILTERS.indexOf(filter) >= 0 ? filter : 'all';
  }

  function normalizeGoalSortMode(mode) {
    return GOAL_SORT_MODES.indexOf(mode) >= 0 ? mode : 'progress';
  }

  function readSavedGoalFilter() {
    try {
      return normalizeGoalFilter(localStorage.getItem(GOAL_FILTER_STORAGE_KEY));
    } catch (error) {
      return 'all';
    }
  }

  function persistGoalFilter(filter) {
    try {
      localStorage.setItem(GOAL_FILTER_STORAGE_KEY, normalizeGoalFilter(filter));
    } catch (error) {}
  }

  function readSavedGoalSortMode() {
    try {
      return normalizeGoalSortMode(localStorage.getItem(GOAL_SORT_STORAGE_KEY));
    } catch (error) {
      return 'progress';
    }
  }

  function persistGoalSortMode(mode) {
    try {
      localStorage.setItem(GOAL_SORT_STORAGE_KEY, normalizeGoalSortMode(mode));
    } catch (error) {}
  }

  function readSavedGoalPageSize() {
    if (window.taskViewPager && typeof window.taskViewPager.readStoredPageSize === 'function') {
      return window.taskViewPager.readStoredPageSize(GOAL_PAGE_SIZE_STORAGE_KEY, GOAL_PAGE_SIZES);
    }
    const parsed = parseInt(localStorage.getItem(GOAL_PAGE_SIZE_STORAGE_KEY), 10);
    return GOAL_PAGE_SIZES.indexOf(parsed) >= 0 ? parsed : GOAL_PAGE_SIZES[0];
  }

  function persistGoalPageSize(size) {
    if (window.taskViewPager && typeof window.taskViewPager.persistPageSize === 'function') {
      window.taskViewPager.persistPageSize(GOAL_PAGE_SIZE_STORAGE_KEY, size, GOAL_PAGE_SIZES);
      return;
    }
    try {
      localStorage.setItem(GOAL_PAGE_SIZE_STORAGE_KEY, String(size));
    } catch (error) {}
  }

  function getGoalTheme(themeKey) {
    return GOAL_THEMES[themeKey] || GOAL_THEMES.learning;
  }

  function normalizeGoalStatus(status) {
    return GOAL_STATUSES.indexOf(status) >= 0 ? status : 'active';
  }

  function normalizeGoalTheme(themeKey) {
    return GOAL_THEMES[themeKey] ? themeKey : 'learning';
  }

  function normalizeGoalDetailTab(tab) {
    return GOAL_DETAIL_TABS.indexOf(tab) >= 0 ? tab : GOAL_DETAIL_TABS[0];
  }

  function createGoalMilestoneId(goalId, index) {
    return String(goalId || 'goal') + '-milestone-' + (index + 1);
  }

  function getGoalMilestoneLibrary(themeKey) {
    return GOAL_MILESTONE_LIBRARY[normalizeGoalTheme(themeKey)] || GOAL_MILESTONE_LIBRARY.learning;
  }

  function getGoalMilestoneStatus(goalStatus, index, milestoneDone, progress) {
    if (goalStatus === 'completed') {
      return 'completed';
    }
    if (index < milestoneDone) {
      return 'completed';
    }
    if (goalStatus === 'paused' && index === milestoneDone) {
      return 'paused';
    }
    if (goalStatus === 'planned' && index >= milestoneDone) {
      return 'planned';
    }
    if (index === milestoneDone && progress > 0) {
      return 'active';
    }
    return 'planned';
  }

  function getGoalMilestoneProgress(index, milestoneCount, milestoneDone, progress, goalStatus) {
    if (goalStatus === 'completed' || index < milestoneDone) {
      return 100;
    }
    if (goalStatus === 'planned' || progress <= 0 || index > milestoneDone) {
      return 0;
    }
    const step = 100 / Math.max(1, milestoneCount);
    return clampNumber(Math.round(((progress - index * step) / step) * 100), 0, 100, 0);
  }

  function buildFallbackGoalMilestones(goalDraft) {
    const library = getGoalMilestoneLibrary(goalDraft.theme);
    return Array.from({ length: goalDraft.milestoneCount }, function (_, index) {
      const preset = library[index] || {
        title: '阶段 ' + (index + 1),
        summary: '把长期目标拆成更可执行的一步，方便持续推进和复盘。'
      };
      return {
        id: createGoalMilestoneId(goalDraft.id, index),
        title: preset.title,
        summary: preset.summary,
        status: getGoalMilestoneStatus(goalDraft.status, index, goalDraft.milestoneDone, goalDraft.progress),
        progress: getGoalMilestoneProgress(
          index,
          goalDraft.milestoneCount,
          goalDraft.milestoneDone,
          goalDraft.progress,
          goalDraft.status
        )
      };
    });
  }

  function normalizeGoalMilestones(milestones, goalDraft) {
    const fallback = buildFallbackGoalMilestones(goalDraft);
    if (!Array.isArray(milestones) || !milestones.length) {
      return fallback;
    }
    return fallback.map(function (item, index) {
      const raw = milestones[index] && typeof milestones[index] === 'object' ? milestones[index] : null;
      if (!raw) {
        return item;
      }
      return {
        id: raw.id ? String(raw.id) : item.id,
        title: String(raw.title || '').trim() || item.title,
        summary: String(raw.summary || '').trim() || item.summary,
        status: normalizeGoalStatus(raw.status || item.status),
        progress: clampNumber(raw.progress, 0, 100, item.progress)
      };
    });
  }

  function formatGoalDate(dateValue) {
    const raw = String(dateValue || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return raw;
    }
    return '--';
  }

  function goalThemeOptions() {
    return Object.keys(GOAL_THEMES).map(function (key) {
      return {
        key: key,
        label: GOAL_THEMES[key].label
      };
    });
  }

  function buildDefaultGoals() {
    const year = new Date().getFullYear();
    const nextYear = year + 1;
    return [
      {
        id: createGoalId(),
        title: '考取数据分析师证书（中级）',
        summary: '把课程学习、真题训练和项目实战拆成三段推进。',
        outcome: '完成系统学习并产出 2 个可展示的数据分析案例',
        progress: 45,
        status: 'active',
        deadline: year + '-12-31',
        milestoneCount: 3,
        milestoneDone: 1,
        theme: 'learning'
      },
      {
        id: createGoalId(),
        title: '坚持每周 3 次力量训练',
        summary: '稳定训练频率，让体能和恢复都能跟上节奏。',
        outcome: '连续 12 周保持训练习惯，形成可持续的健康节奏',
        progress: 60,
        status: 'active',
        deadline: year + '-10-30',
        milestoneCount: 4,
        milestoneDone: 2,
        theme: 'health'
      },
      {
        id: createGoalId(),
        title: '每年阅读 24 本书',
        summary: '把阅读拆成主题书单，兼顾输入和输出。',
        outcome: '建立个人知识卡片库，并输出 12 篇读书笔记',
        progress: 30,
        status: 'planned',
        deadline: year + '-12-31',
        milestoneCount: 6,
        milestoneDone: 1,
        theme: 'reading'
      },
      {
        id: createGoalId(),
        title: '把副业月收入提升到 8000 元',
        summary: '先跑通交付模型，再放大获客和复购。',
        outcome: '建立稳定的服务产品和每月复盘机制',
        progress: 20,
        status: 'paused',
        deadline: nextYear + '-06-30',
        milestoneCount: 5,
        milestoneDone: 1,
        theme: 'finance'
      }
    ];
  }

  function normalizeGoalEntry(goal, index) {
    const draft = goal && typeof goal === 'object' ? goal : {};
    const progress = clampNumber(draft.progress, 0, 100, 0);
    const rawMilestones = Array.isArray(draft.milestones) ? draft.milestones : [];
    const milestoneCount = clampNumber(
      draft.milestoneCount != null ? draft.milestoneCount : rawMilestones.length,
      1,
      12,
      rawMilestones.length || 3
    );
    const milestoneDone = clampNumber(
      draft.milestoneDone,
      0,
      milestoneCount,
      Math.min(milestoneCount, Math.round((progress / 100) * milestoneCount))
    );

    const nextGoal = {
      id: draft.id ? String(draft.id) : 'goal-seed-' + index,
      title: String(draft.title || '').trim() || '未命名目标',
      summary: String(draft.summary || '').trim() || '先定义阶段目标，再持续推进里程碑。',
      outcome: String(draft.outcome || '').trim() || '补充一个可衡量的结果，方便后续复盘',
      progress: progress,
      status: normalizeGoalStatus(draft.status),
      deadline: formatGoalDate(draft.deadline),
      milestoneCount: milestoneCount,
      milestoneDone: milestoneDone,
      theme: normalizeGoalTheme(draft.theme)
    };
    const milestones = normalizeGoalMilestones(rawMilestones, nextGoal);
    nextGoal.milestoneDone = milestones.filter(function (milestone) {
      return milestone.status === 'completed';
    }).length;
    nextGoal.milestones = milestones;
    return nextGoal;
  }

  function writeLongTermGoalsToStorage(goals) {
    const list = Array.isArray(goals) ? goals.map(normalizeGoalEntry) : [];
    try {
      localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(list));
    } catch (error) {}
    return list;
  }

  function clearLongTermGoalsStorage() {
    try {
      localStorage.removeItem(GOAL_STORAGE_KEY);
    } catch (error) {}
  }

  function readLongTermGoalsFromStorage() {
    try {
      const raw = localStorage.getItem(GOAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeGoalEntry);
        }
      }
    } catch (error) {}

    const seeded = buildDefaultGoals().map(normalizeGoalEntry);
    writeLongTermGoalsToStorage(seeded);
    return seeded;
  }

  function getLongTermGoalSceneTotalCount() {
    return readLongTermGoalsFromStorage().length;
  }

  function compareGoalEntries(a, b) {
    if (goalViewSortMode === 'deadline') {
      const aDue = String(a.deadline || '9999-12-31');
      const bDue = String(b.deadline || '9999-12-31');
      if (aDue !== bDue) {
        return aDue.localeCompare(bDue);
      }
    } else if (goalViewSortMode === 'milestones') {
      const aRemain = a.milestoneCount - a.milestoneDone;
      const bRemain = b.milestoneCount - b.milestoneDone;
      if (aRemain !== bRemain) {
        return aRemain - bRemain;
      }
    } else if (a.progress !== b.progress) {
      return b.progress - a.progress;
    }

    if (GOAL_STATUS_ORDER[a.status] !== GOAL_STATUS_ORDER[b.status]) {
      return GOAL_STATUS_ORDER[a.status] - GOAL_STATUS_ORDER[b.status];
    }

    if (a.deadline !== b.deadline) {
      return String(a.deadline || '9999-12-31').localeCompare(String(b.deadline || '9999-12-31'));
    }

    return String(a.title || '').localeCompare(String(b.title || ''), 'zh-CN');
  }

  function matchesGoalFilter(goal) {
    if (goalViewFilter === 'all') {
      return true;
    }
    return goal && goal.status === goalViewFilter;
  }

  function countGoalsByStatus(goals, status) {
    return goals.filter(function (goal) {
      return goal.status === status;
    }).length;
  }

  function createGoalPagerState(entries) {
    const items = Array.isArray(entries) ? entries : [];
    if (window.taskViewPager && typeof window.taskViewPager.createState === 'function') {
      const pager = window.taskViewPager.createState({
        items: items,
        currentPage: goalViewPage,
        pageSize: goalViewPageSize,
        pageSizes: GOAL_PAGE_SIZES
      });
      goalViewPage = pager.currentPage;
      goalViewPageSize = pager.pageSize;
      return pager;
    }

    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(Math.max(totalItems, 1) / goalViewPageSize));
    const currentPage = Math.min(Math.max(1, goalViewPage), totalPages);
    const start = totalItems ? (currentPage - 1) * goalViewPageSize : 0;
    const end = Math.min(start + goalViewPageSize, totalItems);
    goalViewPage = currentPage;
    return {
      currentPage: currentPage,
      totalItems: totalItems,
      totalPages: totalPages,
      pageSize: goalViewPageSize,
      pageSizes: GOAL_PAGE_SIZES.slice(),
      hasPrev: currentPage > 1,
      hasNext: currentPage < totalPages,
      pages: Array.from({ length: totalPages }, function (_, index) {
        return index + 1;
      }).slice(0, 3),
      items: items.slice(start, end)
    };
  }

  function getGoalSceneState() {
    const allGoals = readLongTermGoalsFromStorage().slice().sort(compareGoalEntries);
    const filteredGoals = allGoals.filter(matchesGoalFilter);
    const pager = createGoalPagerState(filteredGoals);
    const detailGoal = goalViewActiveId
      ? allGoals.find(function (goal) {
          return String(goal.id) === String(goalViewActiveId);
        }) || null
      : null;
    if (goalViewActiveId && !detailGoal) {
      goalViewActiveId = '';
      goalViewDetailTab = GOAL_DETAIL_TABS[0];
    }
    const totalMilestones = allGoals.reduce(function (sum, goal) {
      return sum + goal.milestoneCount;
    }, 0);
    const completedMilestones = allGoals.reduce(function (sum, goal) {
      return sum + goal.milestoneDone;
    }, 0);
    const averageProgress = allGoals.length
      ? Math.round(
          allGoals.reduce(function (sum, goal) {
            return sum + goal.progress;
          }, 0) / allGoals.length
        )
      : 0;

    return {
      activeFilter: normalizeGoalFilter(goalViewFilter),
      sortMode: normalizeGoalSortMode(goalViewSortMode),
      totalCount: allGoals.length,
      activeCount: countGoalsByStatus(allGoals, 'active'),
      completedCount: countGoalsByStatus(allGoals, 'completed'),
      pausedCount: countGoalsByStatus(allGoals, 'paused'),
      plannedCount: countGoalsByStatus(allGoals, 'planned'),
      totalMilestones: totalMilestones,
      completedMilestones: completedMilestones,
      averageProgress: averageProgress,
      filteredCount: filteredGoals.length,
      goals: pager.items,
      pager: pager,
      detailGoal: detailGoal,
      detailTab: normalizeGoalDetailTab(goalViewDetailTab)
    };
  }

  function bindGoalTitleClickGuard(dateNav) {
    if (!dateNav || dateNav.dataset.goalClickGuardBound) {
      return;
    }
    const titleWrap = dateNav.querySelector('h3');
    if (!titleWrap) {
      return;
    }
    dateNav.dataset.goalClickGuardBound = '1';
    titleWrap.addEventListener(
      'click',
      function (event) {
        if (!isGoalMode()) {
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true
    );
  }

  function goalTitleIconMarkup() {
    return '<i class="ph ph-target goal-title__glyph" aria-hidden="true"></i>';
  }

  function filterIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M4 5h16"></path>' +
      '<path d="M7 12h10"></path>' +
      '<path d="M10 19h4"></path>' +
      '</svg>'
    );
  }

  function plusIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 5v14"></path>' +
      '<path d="M5 12h14"></path>' +
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

  function checkListIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M9 6h11"></path>' +
      '<path d="M9 12h11"></path>' +
      '<path d="M9 18h11"></path>' +
      '<path d="M4 6h.01"></path>' +
      '<path d="M4 12h.01"></path>' +
      '<path d="M4 18h.01"></path>' +
      '</svg>'
    );
  }

  function trendIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M3 17l6-6 4 4 7-8"></path>' +
      '<path d="M14 7h6v6"></path>' +
      '</svg>'
    );
  }

  function arrowRightIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.05" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M9 6l6 6-6 6"></path>' +
      '</svg>'
    );
  }

  function arrowLeftIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.05" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M15 6l-6 6 6 6"></path>' +
      '</svg>'
    );
  }

  function pencilIconMarkup() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.05" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 20h9"></path>' +
      '<path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>' +
      '</svg>'
    );
  }

  function goalIconMarkup(themeKey) {
    const theme = getGoalTheme(themeKey);
    return '<i class="ph ' + theme.icon + '" aria-hidden="true"></i>';
  }

  function getGoalSortLabel(mode) {
    return GOAL_SORT_LABELS[normalizeGoalSortMode(mode)] || GOAL_SORT_LABELS.progress;
  }

  function getGoalFilterOptionsMarkup(activeFilter) {
    return GOAL_FILTERS.map(function (key) {
      return (
        '<option value="' +
        key +
        '"' +
        (key === activeFilter ? ' selected' : '') +
        '>' +
        html(GOAL_STATUS_LABELS[key]) +
        '</option>'
      );
    }).join('');
  }

  function getGoalHeaderToolsHost() {
    const dateNav = getDateNav();
    if (!dateNav) {
      return null;
    }
    let host = dateNav.querySelector('.goal-header-tools');
    if (!host) {
      host = document.createElement('div');
      host.className = 'goal-header-tools';
      dateNav.appendChild(host);
    }
    return host;
  }

  function clearGoalHeaderToolsHost() {
    const dateNav = getDateNav();
    if (!dateNav) {
      return;
    }
    const host = dateNav.querySelector('.goal-header-tools');
    if (host && host.parentNode) {
      host.parentNode.removeChild(host);
    }
  }

  function renderGoalTitle(state) {
    const title = getTitleHost();
    if (!title || !state) {
      return;
    }
    clearTitleMotion(title);
    if (state.detailGoal) {
      const detailGoal = state.detailGoal;
      const detailTheme = getGoalTheme(detailGoal.theme);
      const detailTone = getGoalStatusTone(detailGoal.status);
      title.innerHTML =
        '<span class="goal-title goal-title--detail">' +
        '<span class="goal-title__icon" style="background:' +
        detailTheme.soft +
        ';color:' +
        detailTheme.accent +
        ';" aria-hidden="true">' +
        goalIconMarkup(detailGoal.theme) +
        '</span>' +
        '<span class="goal-title__copy">' +
        '<span class="goal-title__main-wrap">' +
        '<span class="goal-title__main">' +
        html(detailGoal.title) +
        '</span>' +
        '<span class="goal-title__status goal-title__status--' +
        detailTone +
        '">' +
        html(getGoalStatusLabel(detailGoal.status)) +
        '</span>' +
        '</span>' +
        '<span class="goal-title__sub">' +
        html(detailGoal.summary) +
        '</span>' +
        '</span></span>';
      title.dataset.renderKey = GOAL_MODE + '|detail|' + detailGoal.id;
      title.dataset.lastDs = GOAL_MODE + '-detail';
      title.classList.remove(
        'is-week-scope',
        'is-range-offset',
        'is-relative',
        'is-plain-date',
        'is-overdue-scope',
        'is-priority-scope',
        'is-repeat-scope',
        'is-frozen-scope'
      );
      title.classList.add('is-goal-scope');
      return;
    }
    title.innerHTML =
      '<span class="goal-title">' +
      '<span class="goal-title__icon" aria-hidden="true">' +
      goalTitleIconMarkup() +
      '</span>' +
      '<span class="goal-title__copy">' +
      '<span class="goal-title__main">长期目标</span>' +
      '<span class="goal-title__sub">规划长期方向，跟踪关键里程碑的推进节奏</span>' +
      '</span></span>';
    title.dataset.renderKey = GOAL_MODE + '|' + state.totalCount;
    title.dataset.lastDs = GOAL_MODE;
    title.classList.remove(
      'is-week-scope',
      'is-range-offset',
      'is-relative',
      'is-plain-date',
      'is-overdue-scope',
      'is-priority-scope',
      'is-repeat-scope',
      'is-frozen-scope'
    );
    title.classList.add('is-goal-scope');
  }

  function clearGoalTitle() {
    const title = getTitleHost();
    if (!title) {
      return;
    }
    title.classList.remove('is-goal-scope');
  }

  function getGoalHeaderToolsMarkup(state) {
    if (state.detailGoal) {
      return (
        '<button type="button" class="goal-header-tool" data-goal-detail-action="back">' +
        '<span class="goal-header-tool__icon" aria-hidden="true">' +
        arrowLeftIconMarkup() +
        '</span>' +
        '<span class="goal-header-tool__label">返回列表</span>' +
        '</button>' +
        '<button type="button" class="goal-header-tool goal-header-tool--primary" data-goal-edit-id="' +
        html(state.detailGoal.id) +
        '">' +
        '<span class="goal-header-tool__icon" aria-hidden="true">' +
        pencilIconMarkup() +
        '</span>' +
        '<span class="goal-header-tool__label">编辑目标</span>' +
        '</button>'
      );
    }
    return (
      '<label class="goal-header-filter">' +
      '<select class="goal-header-filter__select" onchange="setLongTermGoalFilter(this.value)" aria-label="目标状态筛选">' +
      getGoalFilterOptionsMarkup(state.activeFilter) +
      '</select>' +
      '<span class="goal-header-filter__caret" aria-hidden="true">' +
      arrowRightIconMarkup() +
      '</span>' +
      '</label>' +
      '<button type="button" class="goal-header-tool" onclick="cycleLongTermGoalSortMode()" aria-label="' +
      html(getGoalSortLabel(state.sortMode)) +
      '">' +
      '<span class="goal-header-tool__icon" aria-hidden="true">' +
      filterIconMarkup() +
      '</span>' +
      '<span class="goal-header-tool__label">' +
      html(getGoalSortLabel(state.sortMode)) +
      '</span>' +
      '</button>' +
      '<button type="button" class="goal-header-tool goal-header-tool--primary" onclick="createLongTermGoal()">' +
      '<span class="goal-header-tool__icon" aria-hidden="true">' +
      plusIconMarkup() +
      '</span>' +
      '<span class="goal-header-tool__label">新建目标</span>' +
      '</button>'
    );
  }

  function ensureGoalHeaderState(state) {
    const taskMode = getTaskMode();
    const dateNav = getDateNav();
    if (taskMode) {
      taskMode.classList.toggle(GOAL_CLASS, !!state);
      taskMode.classList.toggle('task-mode--goal-detail', !!(state && state.detailGoal));
    }
    if (dateNav) {
      dateNav.classList.toggle(GOAL_NAV_CLASS, !!state);
      bindGoalTitleClickGuard(dateNav);
    }

    if (!state) {
      clearGoalTitle();
      clearGoalHeaderToolsHost();
      return;
    }

    renderGoalTitle(state);
    const host = getGoalHeaderToolsHost();
    if (host) {
      host.innerHTML = getGoalHeaderToolsMarkup(state);
    }
  }

  function getGoalStatusLabel(statusKey) {
    return GOAL_STATUS_LABELS[statusKey] || GOAL_STATUS_LABELS.active;
  }

  function getGoalStatusTone(statusKey) {
    if (statusKey === 'completed') {
      return 'completed';
    }
    if (statusKey === 'paused') {
      return 'paused';
    }
    if (statusKey === 'planned') {
      return 'planned';
    }
    return 'active';
  }

  function goalTipBannerHtml() {
    return (
      '<div class="goal-tip-banner">' +
      '<span class="goal-tip-banner__icon" aria-hidden="true">i</span>' +
      '<p class="goal-tip-banner__copy">把长期目标拆解成 3-5 个关键里程碑，会更容易持续推进和复盘。</p>' +
      '</div>'
    );
  }

  function goalCardHtml(goal) {
    const theme = getGoalTheme(goal.theme);
    const statusTone = getGoalStatusTone(goal.status);
    const milestoneText = goal.milestoneDone + ' / ' + goal.milestoneCount + ' 个里程碑';
    const cardStyle =
      '--goal-accent:' +
      theme.accent +
      ';--goal-accent-soft:' +
      theme.soft +
      ';--goal-card-surface:' +
      theme.surface +
      ';--goal-progress-fill:' +
      theme.progress +
      ';';

    return (
      '<article class="goal-card goal-card--' +
      statusTone +
      '" style="' +
      cardStyle +
      '">' +
      '<button type="button" class="goal-card__button" data-goal-detail-id="' +
      html(goal.id) +
      '">' +
      '<span class="goal-card__icon" aria-hidden="true">' +
      goalIconMarkup(goal.theme) +
      '</span>' +
      '<span class="goal-card__copy">' +
      '<span class="goal-card__head">' +
      '<strong class="goal-card__title">' +
      html(goal.title) +
      '</strong>' +
      '<span class="goal-card__status goal-card__status--' +
      statusTone +
      '">' +
      html(getGoalStatusLabel(goal.status)) +
      '</span>' +
      '</span>' +
      '<span class="goal-card__progress-row">' +
      '<span class="goal-card__progress-value">' +
      goal.progress +
      '%</span>' +
      '<span class="goal-card__progress-track"><span class="goal-card__progress-fill" style="width:' +
      goal.progress +
      '%"></span></span>' +
      '</span>' +
      '<span class="goal-card__meta">' +
      '<span class="goal-card__meta-item"><b>截止日期</b>' +
      html(goal.deadline) +
      '</span>' +
      '<span class="goal-card__meta-item"><b>关键成果</b>' +
      html(goal.outcome) +
      '</span>' +
      '</span>' +
      '</span>' +
      '<span class="goal-card__side">' +
      '<span class="goal-card__milestone">' +
      html(milestoneText) +
      '</span>' +
      '<span class="goal-card__arrow" aria-hidden="true">' +
      arrowRightIconMarkup() +
      '</span>' +
      '</span>' +
      '</button>' +
      '</article>'
    );
  }

  function getGoalEmptyCopy(state) {
    if (!state.totalCount) {
      return {
        title: '还没有长期目标',
        sub: '先放进一个想长期推进的方向，再把它拆成几个清晰的里程碑。'
      };
    }
    return {
      title: '当前筛选下没有匹配的目标',
      sub: '切换状态筛选，或者新建一个新的长期目标。'
    };
  }

  function goalEmptyStateHtml(state) {
    const copy = getGoalEmptyCopy(state);
    return (
      '<div class="goal-empty">' +
      '<div class="goal-empty__icon" aria-hidden="true">' +
      goalTitleIconMarkup() +
      '</div>' +
      '<p class="goal-empty__title">' +
      html(copy.title) +
      '</p>' +
      '<p class="goal-empty__sub">' +
      html(copy.sub) +
      '</p>' +
      '<button type="button" class="goal-empty__action" onclick="createLongTermGoal()">新建目标</button>' +
      '</div>'
    );
  }

  function goalListHtml(state) {
    if (!state.filteredCount) {
      return goalEmptyStateHtml(state);
    }
    return (
      '<div class="goal-list">' +
      state.goals.map(goalCardHtml).join('') +
      '</div>'
    );
  }

  function goalPagerHtml(state) {
    if (!window.taskViewPager || typeof window.taskViewPager.buildHtml !== 'function') {
      return '';
    }
    return window.taskViewPager.buildHtml({
      pager: state && state.pager ? state.pager : null,
      pageAction: 'setLongTermGoalPage',
      pageSizeAction: 'setLongTermGoalPageSize',
      ariaLabel: '长期目标分页',
      pageSizeLabel: '每页数量',
      escapeHtml: html
    });
  }

  function getGoalRemainingText(goal) {
    const deadline = String(goal && goal.deadline ? goal.deadline : '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      return '待设置';
    }
    const current = new Date();
    const today = new Date(current.getFullYear(), current.getMonth(), current.getDate());
    const dueDate = new Date(deadline + 'T00:00:00');
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
    if (diffDays < 0) {
      return '已逾期 ' + Math.abs(diffDays) + ' 天';
    }
    if (diffDays === 0) {
      return '今天截止';
    }
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays - years * 365 - months * 30;
    const chunks = [];
    if (years) {
      chunks.push(years + ' 年');
    }
    if (months) {
      chunks.push(months + ' 个月');
    }
    if (days || !chunks.length) {
      chunks.push(days + ' 天');
    }
    return chunks.slice(0, 3).join(' ');
  }

  function goalDetailMetricHtml(modifierClass, iconClass, label, value, sub, progress) {
    return (
      '<article class="goal-detail__metric' +
      (modifierClass ? ' ' + modifierClass : '') +
      '">' +
      '<span class="goal-detail__metric-icon" aria-hidden="true"><i class="ph ' +
      iconClass +
      '"></i></span>' +
      '<span class="goal-detail__metric-copy">' +
      '<span class="goal-detail__metric-label">' +
      html(label) +
      '</span>' +
      '<strong class="goal-detail__metric-value">' +
      html(value) +
      '</strong>' +
      (sub ? '<span class="goal-detail__metric-sub">' + html(sub) + '</span>' : '') +
      (typeof progress === 'number'
        ? '<span class="goal-detail__metric-track"><span class="goal-detail__metric-fill" style="width:' +
          progress +
          '%"></span></span>'
        : '') +
      '</span>' +
      '</article>'
    );
  }

  function goalDetailTabButtonHtml(tabKey, label, activeTab) {
    return (
      '<button type="button" class="goal-detail__tab' +
      (activeTab === tabKey ? ' is-active' : '') +
      '" data-goal-detail-tab="' +
      html(tabKey) +
      '">' +
      html(label) +
      '</button>'
    );
  }

  function goalMilestoneItemHtml(goal, milestone, index) {
    const tone = getGoalStatusTone(milestone.status);
    return (
      '<article class="goal-milestone goal-milestone--' +
      tone +
      '">' +
      '<span class="goal-milestone__index">' +
      (index + 1) +
      '</span>' +
      '<div class="goal-milestone__content">' +
      '<div class="goal-milestone__title-row">' +
      '<div class="goal-milestone__title-copy">' +
      '<strong class="goal-milestone__title">' +
      html(milestone.title) +
      '</strong>' +
      '<p class="goal-milestone__summary">' +
      html(milestone.summary) +
      '</p>' +
      '</div>' +
      '<div class="goal-milestone__meta">' +
      '<span class="goal-milestone__status goal-milestone__status--' +
      tone +
      '">' +
      html(getGoalStatusLabel(milestone.status)) +
      '</span>' +
      '<span class="goal-milestone__percent">' +
      milestone.progress +
      '%</span>' +
      '</div>' +
      '</div>' +
      '<div class="goal-milestone__progress">' +
      '<span class="goal-milestone__track"><span class="goal-milestone__fill" style="width:' +
      milestone.progress +
      '%"></span></span>' +
      '<span class="goal-milestone__arrow" aria-hidden="true">' +
      arrowRightIconMarkup() +
      '</span>' +
      '</div>' +
      '</div>' +
      '</article>'
    );
  }

  function buildGoalPlanRecommendations(goal) {
    return [
      '把「' + goal.title + '」拆成一个本周最小动作，并安排到固定时间推进。',
      '围绕关键成果补一个可衡量检查点，确保当前进度不是凭感觉在走。',
      '在截止日期前安排下一次阶段复盘，及时调整节奏和资源投入。'
    ];
  }

  function goalDetailEmptyPanelHtml(iconClass, title, sub, actionLabel, action) {
    return (
      '<div class="goal-detail-empty">' +
      '<span class="goal-detail-empty__icon" aria-hidden="true"><i class="ph ' +
      iconClass +
      '"></i></span>' +
      '<strong class="goal-detail-empty__title">' +
      html(title) +
      '</strong>' +
      '<p class="goal-detail-empty__sub">' +
      html(sub) +
      '</p>' +
      (actionLabel && action
        ? '<button type="button" class="goal-detail-empty__action" onclick="' +
          action +
          '">' +
          html(actionLabel) +
          '</button>'
        : '') +
      '</div>'
    );
  }

  function goalDetailBodyHtml(state) {
    const goal = state.detailGoal;
    if (!goal) {
      return '';
    }
    if (state.detailTab === 'plan') {
      return (
        '<div class="goal-detail-stack">' +
        '<section class="goal-detail-card">' +
        '<div class="goal-detail-card__head">' +
        '<div><h4 class="goal-detail-card__title">每日计划建议</h4><p class="goal-detail-card__sub">先把目标推进转成更小、更容易完成的动作。</p></div>' +
        '</div>' +
        '<div class="goal-plan-list">' +
        buildGoalPlanRecommendations(goal)
          .map(function (item, index) {
            return (
              '<article class="goal-plan-item">' +
              '<span class="goal-plan-item__index">' +
              (index + 1) +
              '</span>' +
              '<p class="goal-plan-item__copy">' +
              html(item) +
              '</p>' +
              '</article>'
            );
          })
          .join('') +
        '</div>' +
        '</section>' +
        goalDetailEmptyPanelHtml('ph-calendar-dots', '这里以后可以接真实计划', '目前先给出执行建议，后续我们可以继续把每日计划做成可勾选的行动清单。', '编辑目标', 'openLongTermGoalEditor(' + jsArgAttr(goal.id) + ')') +
        '</div>'
      );
    }
    if (state.detailTab === 'records') {
      return (
        '<div class="goal-detail-stack">' +
        '<section class="goal-detail-card">' +
        '<div class="goal-detail-card__head">' +
        '<div><h4 class="goal-detail-card__title">进度记录</h4><p class="goal-detail-card__sub">用几个关键数字快速回顾当前推进状态。</p></div>' +
        '</div>' +
        '<div class="goal-record-grid">' +
        goalDetailMetricHtml('', 'ph-chart-line-up', '当前进度', goal.progress + '%', '保持节奏，持续推进。', goal.progress) +
        goalDetailMetricHtml('', 'ph-flag-checkered', '已完成里程碑', goal.milestoneDone + ' / ' + goal.milestoneCount, '阶段推进越清晰，复盘越轻松。') +
        goalDetailMetricHtml('', 'ph-clock-countdown', '剩余时间', getGoalRemainingText(goal), '截止日期：' + goal.deadline) +
        '</div>' +
        '</section>' +
        goalDetailEmptyPanelHtml('ph-notepad', '还没有更多阶段记录', '如果你愿意，下一步我可以继续把这里扩展成时间线或周报视图。', '返回目标拆解', 'setLongTermGoalDetailTab(' + jsArgAttr('milestones') + ')') +
        '</div>'
      );
    }
    if (state.detailTab === 'files') {
      return goalDetailEmptyPanelHtml('ph-folder-open', '文件资料区域已预留', '目前先保留界面层，后续可以继续接附件、链接资料或阶段文档。', '导出目标报告', 'exportLongTermGoals()');
    }
    return (
      '<div class="goal-detail-stack">' +
      '<section class="goal-detail-card">' +
      '<div class="goal-detail-card__head">' +
      '<div>' +
      '<h4 class="goal-detail-card__title">目标拆解（' +
      goal.milestoneCount +
      ' 个阶段）</h4>' +
      '<p class="goal-detail-card__sub">把目标拆成可执行阶段，更容易稳定推进。</p>' +
      '</div>' +
      '<div class="goal-detail-card__toolbar">' +
      '<button type="button" class="goal-detail__toolbar-btn" data-goal-add-milestone="' +
      html(goal.id) +
      '">添加阶段</button>' +
      '<button type="button" class="goal-detail__toolbar-btn" data-goal-apply-template="' +
      html(goal.id) +
      '">导入模板</button>' +
      '</div>' +
      '</div>' +
      '<div class="goal-milestone-list">' +
      goal.milestones.map(function (milestone, index) {
        return goalMilestoneItemHtml(goal, milestone, index);
      }).join('') +
      '</div>' +
      '</section>' +
      '<section class="goal-detail-note">' +
      '<span class="goal-detail-note__icon" aria-hidden="true"><i class="ph ph-lightbulb"></i></span>' +
      '<div class="goal-detail-note__copy">' +
      '<strong>智能建议</strong>' +
      '<p>建议为每个阶段都设置一个可衡量的结果，并把当前阶段的下一步动作压缩到足够小。</p>' +
      '</div>' +
      '<button type="button" class="goal-detail-note__action" onclick="setLongTermGoalDetailTab(' +
      jsArgAttr('plan') +
      ')">查看执行建议</button>' +
      '</section>' +
      '</div>'
    );
  }

  function goalDetailViewHtml(state) {
    const goal = state.detailGoal;
    if (!goal) {
      return '';
    }
    const tone = getGoalStatusTone(goal.status);
    return (
      '<section class="goal-view goal-view--detail" aria-label="长期目标详情">' +
      '<button type="button" class="goal-detail__back" data-goal-detail-action="back">' +
      '<span class="goal-detail__back-icon" aria-hidden="true">' +
      arrowLeftIconMarkup() +
      '</span>' +
      '<span>返回目标列表</span>' +
      '</button>' +
      '<div class="goal-detail__hero">' +
      '<div class="goal-detail__hero-main">' +
      '<div class="goal-detail__title-row">' +
      '<h3 class="goal-detail__title">' +
      html(goal.title) +
      '</h3>' +
      '<span class="goal-detail__status goal-detail__status--' +
      tone +
      '">' +
      html(getGoalStatusLabel(goal.status)) +
      '</span>' +
      '</div>' +
      '<p class="goal-detail__summary">' +
      html(goal.summary) +
      '</p>' +
      '<p class="goal-detail__outcome"><span>关键成果</span>' +
      html(goal.outcome) +
      '</p>' +
      '</div>' +
      '<div class="goal-detail__hero-actions">' +
      '<button type="button" class="goal-detail__hero-btn" data-goal-edit-id="' +
      html(goal.id) +
      '">编辑目标</button>' +
      '<button type="button" class="goal-detail__hero-btn goal-detail__hero-btn--ghost" onclick="createLongTermGoal()">新建目标</button>' +
      '</div>' +
      '</div>' +
      '<div class="goal-detail__metrics">' +
      goalDetailMetricHtml('goal-detail__metric--progress', 'ph-wave-sine', '总进度', goal.progress + '%', '整体推进节奏', goal.progress) +
      goalDetailMetricHtml('', 'ph-flag-banner', '里程碑完成', goal.milestoneDone + ' / ' + goal.milestoneCount, '当前已完成阶段数') +
      goalDetailMetricHtml('', 'ph-calendar-blank', '预计完成', goal.deadline, '建议保留阶段缓冲时间') +
      goalDetailMetricHtml('', 'ph-timer', '剩余时间', getGoalRemainingText(goal), '按当前节奏持续推进') +
      '</div>' +
      '<div class="goal-detail__tabs" role="tablist" aria-label="长期目标详情标签">' +
      goalDetailTabButtonHtml('milestones', '目标拆解', state.detailTab) +
      goalDetailTabButtonHtml('plan', '每日计划', state.detailTab) +
      goalDetailTabButtonHtml('records', '进度记录', state.detailTab) +
      goalDetailTabButtonHtml('files', '文件资料', state.detailTab) +
      '</div>' +
      '<div class="goal-detail__panel">' +
      goalDetailBodyHtml(state) +
      '</div>' +
      '</section>'
    );
  }

  function renderGoalTaskScene(list, state) {
    if (!list || !state) {
      return;
    }
    if (state.detailGoal) {
      list.innerHTML = goalDetailViewHtml(state);
      return;
    }

    list.innerHTML =
      '<section class="goal-view" aria-label="长期目标视图">' +
      goalTipBannerHtml() +
      '<div class="goal-view__content">' +
      goalListHtml(state) +
      '</div>' +
      '<div class="goal-view__footer">' +
      '<div class="goal-view__footer-count">共 ' +
      state.filteredCount +
      ' 个目标</div>' +
      goalPagerHtml(state) +
      '</div>' +
      '</section>';
  }

  function ensureGoalOverviewShell(root) {
    if (!root) {
      return null;
    }
    let shell = root.querySelector('.' + GOAL_SHELL_CLASS);
    if (!shell) {
      shell = document.createElement('section');
      root.appendChild(shell);
    }
    shell.className = GOAL_SHELL_CLASS;
    shell.setAttribute('aria-label', '长期目标侧栏');
    return shell;
  }

  function goalOverviewRingGradient(state) {
    const total = Math.max(1, state.totalCount);
    const activeEnd = (state.activeCount / total) * 100;
    const completedEnd = activeEnd + (state.completedCount / total) * 100;
    const pausedEnd = completedEnd + (state.pausedCount / total) * 100;
    return (
      'conic-gradient(' +
      '#3b82f6 0 ' +
      activeEnd +
      '%, ' +
      '#22c55e ' +
      activeEnd +
      '% ' +
      completedEnd +
      '%, ' +
      '#8b5cf6 ' +
      completedEnd +
      '% ' +
      pausedEnd +
      '%, ' +
      '#cbd5e1 ' +
      pausedEnd +
      '% 100%)'
    );
  }

  function goalLegendItemHtml(count, label, tone) {
    return (
      '<div class="goal-overview__legend-item goal-overview__legend-item--' +
      tone +
      '">' +
      '<span class="goal-overview__legend-dot" aria-hidden="true"></span>' +
      '<span class="goal-overview__legend-label">' +
      html(label) +
      '</span>' +
      '<strong class="goal-overview__legend-count">' +
      count +
      '</strong>' +
      '</div>'
    );
  }

  function goalStatItemHtml(value, label, tone) {
    return (
      '<div class="goal-stat goal-stat--' +
      tone +
      '">' +
      '<b>' +
      html(value) +
      '</b>' +
      '<span>' +
      html(label) +
      '</span>' +
      '</div>'
    );
  }

  function goalSideActionHtml(action, label, iconMarkup, modifierClass) {
    return (
      '<button type="button" class="goal-side-action' +
      (modifierClass ? ' ' + modifierClass : '') +
      '" onclick="' +
      action +
      '">' +
      '<span class="goal-side-action__icon" aria-hidden="true">' +
      iconMarkup +
      '</span>' +
      '<span class="goal-side-action__label">' +
      html(label) +
      '</span>' +
      '</button>'
    );
  }

  function renderGoalOverviewSidebar(state) {
    const root = document.getElementById('taskDashCol');
    if (!root) {
      return;
    }

    const shell = ensureGoalOverviewShell(root);
    if (!shell) {
      return;
    }

    root.classList.remove(
      'is-week-action',
      'is-overdue-action',
      'is-priority-action',
      'is-repeat-action',
      'is-frozen-action'
    );
    root.classList.add('is-goal-action');
    root.setAttribute('aria-label', '长期目标概览');

    shell.innerHTML =
      '<section class="goal-side-card goal-side-card--summary">' +
      '<div class="goal-side-card__head"><span class="goal-side-card__title">目标总览</span></div>' +
      '<div class="goal-overview__hero">' +
      '<div class="goal-overview__ring" style="--goal-ring-bg:' +
      goalOverviewRingGradient(state) +
      '">' +
      '<div class="goal-overview__ring-center"><strong>' +
      state.totalCount +
      '</strong><span>总计</span></div>' +
      '</div>' +
      '<div class="goal-overview__legend">' +
      goalLegendItemHtml(state.activeCount, '进行中', 'active') +
      goalLegendItemHtml(state.completedCount, '已完成', 'completed') +
      goalLegendItemHtml(state.pausedCount, '暂停中', 'paused') +
      goalLegendItemHtml(state.plannedCount, '未开始', 'planned') +
      '</div>' +
      '</div>' +
      '</section>' +
      '<section class="goal-side-card goal-side-card--stats">' +
      '<div class="goal-side-card__head"><span class="goal-side-card__title">推进节奏</span></div>' +
      '<div class="goal-stats">' +
      goalStatItemHtml(state.averageProgress + '%', '平均进度', 'progress') +
      goalStatItemHtml(state.completedMilestones, '已完成里程碑', 'milestone') +
      goalStatItemHtml(state.totalMilestones, '里程碑总数', 'total') +
      '</div>' +
      '</section>' +
      '<section class="goal-side-card goal-side-card--actions">' +
      '<div class="goal-side-card__head"><span class="goal-side-card__title">快速操作</span></div>' +
      '<div class="goal-side-actions">' +
      goalSideActionHtml('createLongTermGoal()', '新建目标', plusIconMarkup()) +
      goalSideActionHtml('showActiveLongTermGoals()', '查看进行中', trendIconMarkup()) +
      goalSideActionHtml('showAllLongTermGoals()', '查看全部目标', checkListIconMarkup()) +
      goalSideActionHtml('exportLongTermGoals()', '导出目标报告', exportIconMarkup()) +
      '</div>' +
      '</section>' +
      '<section class="goal-side-card goal-side-card--tip">' +
      '<div class="goal-side-card__head"><span class="goal-side-card__title">小贴士</span></div>' +
      '<p class="goal-side-tip__copy">建议把每个长期目标拆成 3-5 个关键里程碑，并为每个阶段设置可衡量的结果。</p>' +
      '<button type="button" class="goal-side-tip__link" onclick="createLongTermGoal()">从一个新目标开始</button>' +
      '</section>';
  }

  function clearGoalOverviewSidebar() {
    const root = document.getElementById('taskDashCol');
    if (!root) {
      return;
    }
    root.classList.remove('is-goal-action');
    const shell = root.querySelector('.' + GOAL_SHELL_CLASS);
    if (shell && shell.parentNode) {
      shell.parentNode.removeChild(shell);
    }
  }

  function renderGoalModeFrame() {
    let state = null;
    if (isGoalMode()) {
      state = getGoalSceneState();
      renderGoalTaskScene(document.getElementById('tList'), state);
      if (state.detailGoal) {
        clearGoalOverviewSidebar();
      } else {
        renderGoalOverviewSidebar(state);
      }
    } else {
      clearGoalOverviewSidebar();
    }
    ensureGoalHeaderState(state);
    return state;
  }

  function rerenderGoalViews() {
    if (typeof rT === 'function') {
      rT();
      return;
    }
    renderGoalModeFrame();
  }

  function refreshSideNavSoon() {
    if (typeof window.refreshGlobalSideNav !== 'function') {
      return;
    }
    setTimeout(function () {
      window.refreshGlobalSideNav();
    }, 0);
  }

  function commitGoalChanges(goals, message) {
    writeLongTermGoalsToStorage(goals);
    if (typeof save === 'function') {
      save();
    }
    rerenderGoalViews();
    refreshSideNavSoon();
    if (typeof toast === 'function' && message) {
      toast(message);
    }
  }

  function getGoalById(goalId) {
    return readLongTermGoalsFromStorage().find(function (goal) {
      return String(goal.id) === String(goalId);
    }) || null;
  }

  function createGoalMilestoneDraft(goal, index) {
    const fallbackGoal = normalizeGoalEntry({
      id: goal.id,
      title: goal.title,
      summary: goal.summary,
      outcome: goal.outcome,
      progress: goal.progress,
      status: goal.status,
      deadline: goal.deadline,
      milestoneCount: index + 1,
      milestoneDone: goal.milestoneDone,
      theme: goal.theme
    });
    return fallbackGoal.milestones[index];
  }

  function openLongTermGoalDetail(goalId) {
    const goal = getGoalById(goalId);
    if (!goal) {
      return;
    }
    goalViewActiveId = String(goal.id);
    goalViewDetailTab = GOAL_DETAIL_TABS[0];
    rerenderGoalViews();
  }

  function closeLongTermGoalDetail() {
    if (!goalViewActiveId) {
      return;
    }
    goalViewActiveId = '';
    goalViewDetailTab = GOAL_DETAIL_TABS[0];
    rerenderGoalViews();
  }

  function setLongTermGoalDetailTab(tab) {
    const nextTab = normalizeGoalDetailTab(tab);
    if (goalViewDetailTab === nextTab) {
      return;
    }
    goalViewDetailTab = nextTab;
    rerenderGoalViews();
  }

  function addLongTermGoalMilestone(goalId) {
    const goals = readLongTermGoalsFromStorage();
    const goalIndex = goals.findIndex(function (goal) {
      return String(goal.id) === String(goalId);
    });
    if (goalIndex < 0) {
      return;
    }
    const currentGoal = goals[goalIndex];
    if (currentGoal.milestoneCount >= 12) {
      if (typeof toast === 'function') {
        toast('最多支持 12 个阶段');
      }
      return;
    }
    const nextGoal = normalizeGoalEntry({
      id: currentGoal.id,
      title: currentGoal.title,
      summary: currentGoal.summary,
      outcome: currentGoal.outcome,
      progress: currentGoal.progress,
      status: currentGoal.status,
      deadline: currentGoal.deadline,
      milestoneCount: currentGoal.milestoneCount + 1,
      milestoneDone: currentGoal.milestoneDone,
      theme: currentGoal.theme,
      milestones: (currentGoal.milestones || []).concat(createGoalMilestoneDraft(currentGoal, currentGoal.milestoneCount))
    });
    goals[goalIndex] = nextGoal;
    goalViewActiveId = nextGoal.id;
    commitGoalChanges(goals, '已添加一个新阶段');
  }

  function applyLongTermGoalTemplate(goalId) {
    const goals = readLongTermGoalsFromStorage();
    const goalIndex = goals.findIndex(function (goal) {
      return String(goal.id) === String(goalId);
    });
    if (goalIndex < 0) {
      return;
    }
    const currentGoal = goals[goalIndex];
    const nextCount = Math.max(4, currentGoal.milestoneCount);
    const nextGoal = normalizeGoalEntry({
      id: currentGoal.id,
      title: currentGoal.title,
      summary: currentGoal.summary,
      outcome: currentGoal.outcome,
      progress: currentGoal.progress,
      status: currentGoal.status,
      deadline: currentGoal.deadline,
      milestoneCount: nextCount,
      milestoneDone: currentGoal.milestoneDone,
      theme: currentGoal.theme
    });
    goals[goalIndex] = nextGoal;
    goalViewActiveId = nextGoal.id;
    commitGoalChanges(goals, '已按当前主题导入阶段模板');
  }

  function goalFormDraft(goal) {
    const item = goal || {};
    return {
      id: item.id ? String(item.id) : '',
      title: String(item.title || ''),
      summary: String(item.summary || ''),
      outcome: String(item.outcome || ''),
      progress: Number.isFinite(parseInt(item.progress, 10)) ? parseInt(item.progress, 10) : 0,
      status: normalizeGoalStatus(item.status || 'active'),
      deadline: /^\d{4}-\d{2}-\d{2}$/.test(String(item.deadline || '')) ? String(item.deadline) : todayKey(),
      milestoneCount: clampNumber(item.milestoneCount, 1, 12, 3),
      milestoneDone: clampNumber(item.milestoneDone, 0, 12, 0),
      theme: normalizeGoalTheme(item.theme || 'learning')
    };
  }

  function openGoalModal(goalId) {
    const isEdit = !!goalId;
    const draft = goalFormDraft(isEdit ? getGoalById(goalId) : null);
    const body = document.getElementById('mBody');
    const bg = document.getElementById('mBg');
    if (!body || !bg) {
      return;
    }

    body.classList.add('goal-modal-shell');
    body.innerHTML =
      '<div class="goal-modal">' +
      '<div class="goal-modal__head">' +
      '<div class="goal-modal__head-copy">' +
      '<span class="goal-modal__kicker">' +
      (isEdit ? '编辑目标' : '新建目标') +
      '</span>' +
      '<h3 class="goal-modal__title">' +
      (isEdit ? '调整长期目标推进计划' : '创建一个长期目标') +
      '</h3>' +
      '</div>' +
      '<button type="button" class="goal-modal__close" aria-label="关闭" onclick="clM()">×</button>' +
      '</div>' +
      '<div class="goal-modal__body">' +
      '<label class="goal-field">' +
      '<span class="goal-field__label">目标名称</span>' +
      '<input class="goal-field__input" type="text" id="goalFormTitle" maxlength="40" value="' +
      html(draft.title) +
      '" placeholder="例如：考取数据分析师证书">' +
      '</label>' +
      '<label class="goal-field">' +
      '<span class="goal-field__label">一句话说明</span>' +
      '<textarea class="goal-field__textarea" id="goalFormSummary" rows="2" maxlength="80" placeholder="补充这个目标为什么重要">' +
      html(draft.summary) +
      '</textarea>' +
      '</label>' +
      '<label class="goal-field">' +
      '<span class="goal-field__label">关键成果</span>' +
      '<textarea class="goal-field__textarea" id="goalFormOutcome" rows="2" maxlength="100" placeholder="写一个可衡量的结果">' +
      html(draft.outcome) +
      '</textarea>' +
      '</label>' +
      '<div class="goal-field-grid">' +
      '<label class="goal-field">' +
      '<span class="goal-field__label">状态</span>' +
      '<select class="goal-field__select" id="goalFormStatus">' +
      GOAL_STATUSES.map(function (statusKey) {
        return (
          '<option value="' +
          statusKey +
          '"' +
          (draft.status === statusKey ? ' selected' : '') +
          '>' +
          html(getGoalStatusLabel(statusKey)) +
          '</option>'
        );
      }).join('') +
      '</select>' +
      '</label>' +
      '<label class="goal-field">' +
      '<span class="goal-field__label">截止日期</span>' +
      '<input class="goal-field__input" type="date" id="goalFormDeadline" value="' +
      html(draft.deadline) +
      '">' +
      '</label>' +
      '<label class="goal-field">' +
      '<span class="goal-field__label">进度</span>' +
      '<input class="goal-field__input" type="number" id="goalFormProgress" min="0" max="100" step="1" value="' +
      draft.progress +
      '">' +
      '</label>' +
      '<label class="goal-field">' +
      '<span class="goal-field__label">主题</span>' +
      '<select class="goal-field__select" id="goalFormTheme">' +
      goalThemeOptions().map(function (theme) {
        return (
          '<option value="' +
          theme.key +
          '"' +
          (draft.theme === theme.key ? ' selected' : '') +
          '>' +
          html(theme.label) +
          '</option>'
        );
      }).join('') +
      '</select>' +
      '</label>' +
      '<label class="goal-field">' +
      '<span class="goal-field__label">里程碑总数</span>' +
      '<input class="goal-field__input" type="number" id="goalFormMilestones" min="1" max="12" step="1" value="' +
      draft.milestoneCount +
      '">' +
      '</label>' +
      '<label class="goal-field">' +
      '<span class="goal-field__label">已完成里程碑</span>' +
      '<input class="goal-field__input" type="number" id="goalFormMilestonesDone" min="0" max="12" step="1" value="' +
      Math.min(draft.milestoneDone, draft.milestoneCount) +
      '">' +
      '</label>' +
      '</div>' +
      '</div>' +
      '<div class="goal-modal__actions">' +
      (isEdit
        ? '<button type="button" class="goal-modal__danger" onclick="deleteLongTermGoal(' +
          jsArgAttr(draft.id) +
          ')">删除目标</button>'
        : '<span class="goal-modal__hint">建议先写清楚可衡量的结果，再设置进度。</span>') +
      '<div class="goal-modal__actions-main">' +
      '<button type="button" class="goal-modal__ghost" onclick="clM()">取消</button>' +
      '<button type="button" class="goal-modal__primary" onclick="saveLongTermGoalForm(' +
      jsArgAttr(draft.id) +
      ')">保存目标</button>' +
      '</div>' +
      '</div>' +
      '</div>';

    bg.classList.add('show');
    window.__mainModalCleanup = function () {
      body.classList.remove('goal-modal-shell');
    };

    const titleInput = document.getElementById('goalFormTitle');
    if (titleInput) {
      setTimeout(function () {
        titleInput.focus();
        titleInput.select();
      }, 30);
    }
  }

  function collectGoalFormPayload(goalId) {
    const titleInput = document.getElementById('goalFormTitle');
    const title = titleInput ? titleInput.value.trim() : '';
    const summary = document.getElementById('goalFormSummary') ? document.getElementById('goalFormSummary').value.trim() : '';
    const outcome = document.getElementById('goalFormOutcome') ? document.getElementById('goalFormOutcome').value.trim() : '';
    const deadline = document.getElementById('goalFormDeadline') ? document.getElementById('goalFormDeadline').value : '';
    const status = document.getElementById('goalFormStatus') ? document.getElementById('goalFormStatus').value : 'active';
    const theme = document.getElementById('goalFormTheme') ? document.getElementById('goalFormTheme').value : 'learning';
    const progress = document.getElementById('goalFormProgress') ? document.getElementById('goalFormProgress').value : 0;
    const milestoneCount = document.getElementById('goalFormMilestones') ? document.getElementById('goalFormMilestones').value : 3;
    const milestoneDone = document.getElementById('goalFormMilestonesDone') ? document.getElementById('goalFormMilestonesDone').value : 0;

    return {
      id: goalId ? String(goalId) : createGoalId(),
      title: title,
      summary: summary,
      outcome: outcome,
      deadline: deadline || todayKey(),
      status: status,
      theme: theme,
      progress: progress,
      milestoneCount: milestoneCount,
      milestoneDone: milestoneDone
    };
  }

  function saveLongTermGoalForm(goalId) {
    const payload = collectGoalFormPayload(goalId);
    const currentGoal = goalId ? getGoalById(goalId) : null;
    if (currentGoal && Array.isArray(currentGoal.milestones)) {
      payload.milestones = currentGoal.milestones;
    }
    if (!payload.title) {
      if (typeof toast === 'function') {
        toast('请先填写目标名称');
      }
      const titleInput = document.getElementById('goalFormTitle');
      if (titleInput) {
        titleInput.focus();
      }
      return;
    }

    const nextGoal = normalizeGoalEntry(payload);
    const goals = readLongTermGoalsFromStorage();
    const existingIndex = goals.findIndex(function (goal) {
      return String(goal.id) === String(nextGoal.id);
    });

    if (existingIndex >= 0) {
      goals[existingIndex] = nextGoal;
    } else {
      goals.unshift(nextGoal);
    }

    clM();
    commitGoalChanges(goals, existingIndex >= 0 ? '已更新长期目标' : '已创建长期目标');
  }

  function deleteLongTermGoal(goalId) {
    const target = getGoalById(goalId);
    if (!target) {
      return;
    }
    if (!window.confirm('确定要删除这个长期目标吗？')) {
      return;
    }
    const goals = readLongTermGoalsFromStorage().filter(function (goal) {
      return String(goal.id) !== String(goalId);
    });
    if (String(goalViewActiveId) === String(goalId)) {
      goalViewActiveId = '';
      goalViewDetailTab = GOAL_DETAIL_TABS[0];
    }
    clM();
    commitGoalChanges(goals, '已删除长期目标');
  }

  function exportLongTermGoals() {
    const goals = readLongTermGoalsFromStorage();
    if (!goals.length) {
      if (typeof toast === 'function') {
        toast('当前没有可导出的目标');
      }
      return;
    }
    const blob = new Blob([JSON.stringify(goals, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'long-term-goals-' + todayKey() + '.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 120);
    if (typeof toast === 'function') {
      toast('已导出长期目标报告');
    }
  }

  function showActiveLongTermGoals() {
    closeLongTermGoalDetail();
    window.setLongTermGoalFilter('active');
  }

  function showAllLongTermGoals() {
    closeLongTermGoalDetail();
    window.setLongTermGoalFilter('all');
  }

  function bindGoalUiEvents() {
    if (window.__goalViewEventBound) {
      return;
    }
    window.__goalViewEventBound = true;
    document.addEventListener('click', function (event) {
      const detailTrigger = event.target.closest('[data-goal-detail-id]');
      if (detailTrigger) {
        event.preventDefault();
        openLongTermGoalDetail(detailTrigger.getAttribute('data-goal-detail-id'));
        return;
      }

      const backTrigger = event.target.closest('[data-goal-detail-action="back"]');
      if (backTrigger) {
        event.preventDefault();
        closeLongTermGoalDetail();
        return;
      }

      const tabTrigger = event.target.closest('[data-goal-detail-tab]');
      if (tabTrigger) {
        event.preventDefault();
        setLongTermGoalDetailTab(tabTrigger.getAttribute('data-goal-detail-tab'));
        return;
      }

      const editTrigger = event.target.closest('[data-goal-edit-id]');
      if (editTrigger) {
        event.preventDefault();
        openGoalModal(editTrigger.getAttribute('data-goal-edit-id'));
        return;
      }

      const addMilestoneTrigger = event.target.closest('[data-goal-add-milestone]');
      if (addMilestoneTrigger) {
        event.preventDefault();
        addLongTermGoalMilestone(addMilestoneTrigger.getAttribute('data-goal-add-milestone'));
        return;
      }

      const applyTemplateTrigger = event.target.closest('[data-goal-apply-template]');
      if (applyTemplateTrigger) {
        event.preventDefault();
        applyLongTermGoalTemplate(applyTemplateTrigger.getAttribute('data-goal-apply-template'));
      }
    });
  }

  function hookRender() {
    if (typeof rT !== 'function' || window.__goalViewRTPatched) {
      return;
    }
    window.__goalViewRTPatched = true;
    const originalRT = rT;
    rT = function () {
      const result = originalRT.apply(this, arguments);
      renderGoalModeFrame();
      return result;
    };
  }

  window.readLongTermGoalsFromStorage = readLongTermGoalsFromStorage;
  window.writeLongTermGoalsToStorage = writeLongTermGoalsToStorage;
  window.clearLongTermGoalsStorage = clearLongTermGoalsStorage;
  window.getLongTermGoalSceneTotalCount = getLongTermGoalSceneTotalCount;
  window.refreshLongTermGoalView = rerenderGoalViews;
  window.createLongTermGoal = function () {
    openGoalModal('');
  };
  window.openLongTermGoalDetail = openLongTermGoalDetail;
  window.closeLongTermGoalDetail = closeLongTermGoalDetail;
  window.setLongTermGoalDetailTab = setLongTermGoalDetailTab;
  window.openLongTermGoalEditor = function (goalId) {
    openGoalModal(goalId);
  };
  window.addLongTermGoalMilestone = addLongTermGoalMilestone;
  window.applyLongTermGoalTemplate = applyLongTermGoalTemplate;
  window.saveLongTermGoalForm = saveLongTermGoalForm;
  window.deleteLongTermGoal = deleteLongTermGoal;
  window.exportLongTermGoals = exportLongTermGoals;
  window.showActiveLongTermGoals = showActiveLongTermGoals;
  window.showAllLongTermGoals = showAllLongTermGoals;

  window.setLongTermGoalFilter = function (filter) {
    const nextFilter = normalizeGoalFilter(filter);
    if (goalViewFilter === nextFilter) {
      return;
    }
    goalViewFilter = nextFilter;
    goalViewPage = 1;
    persistGoalFilter(goalViewFilter);
    rerenderGoalViews();
  };

  window.cycleLongTermGoalSortMode = function () {
    const currentIndex = GOAL_SORT_MODES.indexOf(normalizeGoalSortMode(goalViewSortMode));
    goalViewSortMode = GOAL_SORT_MODES[(currentIndex + 1) % GOAL_SORT_MODES.length];
    persistGoalSortMode(goalViewSortMode);
    rerenderGoalViews();
  };

  window.setLongTermGoalPage = function (page) {
    const nextPage = parseInt(page, 10);
    if (!Number.isFinite(nextPage)) {
      return;
    }
    goalViewPage = Math.max(1, nextPage);
    rerenderGoalViews();
  };

  window.setLongTermGoalPageSize = function (size) {
    const parsed = parseInt(size, 10);
    const nextSize = GOAL_PAGE_SIZES.indexOf(parsed) >= 0 ? parsed : GOAL_PAGE_SIZES[0];
    if (goalViewPageSize === nextSize) {
      return;
    }
    goalViewPageSize = nextSize;
    goalViewPage = 1;
    persistGoalPageSize(goalViewPageSize);
    rerenderGoalViews();
  };

  bindGoalUiEvents();
  hookRender();
  readLongTermGoalsFromStorage();
  renderGoalModeFrame();
  refreshSideNavSoon();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bindGoalUiEvents();
      hookRender();
      readLongTermGoalsFromStorage();
      renderGoalModeFrame();
      refreshSideNavSoon();
    });
  }

  window.addEventListener('hashchange', renderGoalModeFrame);
  window.addEventListener('popstate', renderGoalModeFrame);
  window.addEventListener('resize', renderGoalModeFrame);
})();
