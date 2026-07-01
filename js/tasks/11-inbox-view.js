(function () {
  if (window.__inboxViewBound) {
    return;
  }
  window.__inboxViewBound = true;

  const INBOX_MODE = 'inbox-view';
  const INBOX_CLASS = 'task-mode--inbox-view';
  const INBOX_NAV_CLASS = 'date-nav--inbox-view';

  function isInboxMode() {
    return typeof getTaskQuickMode === 'function' && getTaskQuickMode() === INBOX_MODE;
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

  function html(value) {
    if (typeof esc === 'function') {
      return esc(value);
    }
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  function isInboxTask(task) {
    if (typeof taskMatchesFilterKey === 'function') {
      return taskMatchesFilterKey(task, 'unscheduled');
    }
    return !!task && !task.done && !task.frozen && !task.planTime;
  }

  function taskDurationMinutes(task) {
    const raw = parseInt(task && task.duration, 10);
    return Number.isFinite(raw) && raw > 0 ? Math.min(24 * 60, raw) : 0;
  }

  function sortInboxTasks(tasks) {
    return (tasks || []).slice().sort(function (a, b) {
      const priorityDiff = (a && a.priority === 'high' ? 0 : 1) - (b && b.priority === 'high' ? 0 : 1);
      if (priorityDiff) {
        return priorityDiff;
      }
      const createdDiff = (parseInt(b && b.created, 10) || 0) - (parseInt(a && a.created, 10) || 0);
      if (createdDiff) {
        return createdDiff;
      }
      return (parseInt(b && b.id, 10) || 0) - (parseInt(a && a.id, 10) || 0);
    });
  }

  function formatMinutesText(totalMinutes) {
    const minutes = Math.max(0, parseInt(totalMinutes, 10) || 0);
    if (!minutes) {
      return '\u672a\u4f30\u65f6';
    }
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) {
      return minutes + ' \u5206\u949f';
    }
    if (!rest) {
      return hours + ' \u5c0f\u65f6';
    }
    return hours + ' \u5c0f\u65f6 ' + rest + ' \u5206';
  }

  function inboxTitleIconMarkup() {
    return (
      '<span class="inbox-title__icon" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" fill="none" focusable="false">' +
      '<path d="M3.75 8.75C3.75 7.64543 4.64543 6.75 5.75 6.75H18.25C19.3546 6.75 20.25 7.64543 20.25 8.75V17.25C20.25 18.3546 19.3546 19.25 18.25 19.25H5.75C4.64543 19.25 3.75 18.3546 3.75 17.25V8.75Z" stroke="currentColor" stroke-width="1.75"></path>' +
      '<path d="M4.25 13.25H8.4L9.9 15.25H14.1L15.6 13.25H19.75" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path>' +
      '<path d="M8.5 10.25H15.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"></path>' +
      '</svg>' +
      '</span>'
    );
  }

  function getInboxState(ds) {
    const currentDs = typeof ds === 'string' && ds ? ds : todayKey();
    const listedTasks = ((T && T[currentDs]) || []).filter(function (task) {
      return typeof isListedTask === 'function' ? isListedTask(task) : !!task;
    });
    const filteredTasks = sortInboxTasks(listedTasks.filter(isInboxTask));
    const highTasks = filteredTasks.filter(function (task) {
      return task && task.priority === 'high';
    });
    const normalTasks = filteredTasks.filter(function (task) {
      return !task || task.priority !== 'high';
    });
    const untaggedCount = filteredTasks.filter(function (task) {
      return !((task && task.tags) || []).length;
    }).length;
    const sizedTasks = filteredTasks.filter(function (task) {
      return taskDurationMinutes(task) > 0;
    });
    const longTaskCount = filteredTasks.filter(function (task) {
      return taskDurationMinutes(task) >= 60;
    }).length;
    const quickWinCount = filteredTasks.filter(function (task) {
      const duration = taskDurationMinutes(task);
      return duration > 0 && duration <= 30;
    }).length;
    const totalMinutes = filteredTasks.reduce(function (sum, task) {
      return sum + taskDurationMinutes(task);
    }, 0);

    return {
      ds: currentDs,
      listedTasks: listedTasks,
      filteredTasks: filteredTasks,
      highTasks: highTasks,
      normalTasks: normalTasks,
      untaggedCount: untaggedCount,
      sizedCount: sizedTasks.length,
      longTaskCount: longTaskCount,
      quickWinCount: quickWinCount,
      totalMinutes: totalMinutes
    };
  }

  function inboxMetricHtml(value, label, helper, tone) {
    return (
      '<div class="inbox-view__metric inbox-view__metric--' + tone + '">' +
      '<strong>' + html(value) + '</strong>' +
      '<span>' + html(label) + '</span>' +
      '<em>' + html(helper) + '</em>' +
      '</div>'
    );
  }

  function buildInboxSuggestions(state) {
    const items = [];
    if (state.highTasks.length) {
      items.push({
        tone: 'alert',
        title: '\u5148\u5904\u7406\u9ad8\u4f18\u5148\u7ea7',
        text: '\u8fd8\u6709 ' + state.highTasks.length + ' \u9879\u9ad8\u4f18\u4efb\u52a1\u6ca1\u6709\u5b89\u6392\u65f6\u95f4\uff0c\u53ef\u4ee5\u5148\u4ece\u8fd9\u4e9b\u4efb\u52a1\u5f00\u59cb\u6392\u671f\u3002'
      });
    }
    if (state.untaggedCount) {
      items.push({
        tone: 'soft',
        title: '\u8865\u5145\u5206\u7c7b',
        text: '\u6709 ' + state.untaggedCount + ' \u9879\u4efb\u52a1\u8fd8\u6ca1\u6709\u6807\u7b7e\uff0c\u8865\u4e0a\u540e\u540e\u7eed\u641c\u7d22\u548c\u6279\u5904\u7406\u4f1a\u66f4\u5feb\u3002'
      });
    }
    if (state.longTaskCount) {
      items.push({
        tone: 'warn',
        title: '\u62c6\u5206\u5927\u4efb\u52a1',
        text: '\u6709 ' + state.longTaskCount + ' \u9879\u9884\u8ba1\u8017\u65f6\u8f83\u957f\uff0c\u62c6\u6210\u5c0f\u6b65\u9aa4\u4f1a\u66f4\u9002\u5408\u6536\u4ef6\u7bb1\u6574\u7406\u3002'
      });
    }
    if (!items.length) {
      items.push({
        tone: 'calm',
        title: '\u4fdd\u6301\u8f7b\u91cf\u6536\u96c6',
        text: '\u5148\u628a\u60f3\u5230\u7684\u4e8b\u60c5\u653e\u8fdb\u6536\u4ef6\u7bb1\uff0c\u7a7a\u51fa\u65f6\u95f4\u518d\u6162\u6162\u5b89\u6392\u8fdb\u65e5\u7a0b\u3002'
      });
    }
    return items.slice(0, 3);
  }

  function inboxSuggestionHtml(item) {
    return (
      '<div class="inbox-view__suggestion inbox-view__suggestion--' + html(item.tone) + '">' +
      '<strong>' + html(item.title) + '</strong>' +
      '<p>' + html(item.text) + '</p>' +
      '</div>'
    );
  }

  function inboxTaskStackHtml(tasks, emptyTitle, emptySub) {
    if (!tasks.length) {
      return (
        '<div class="inbox-view__stack-empty">' +
        '<strong>' + html(emptyTitle) + '</strong>' +
        '<p>' + html(emptySub) + '</p>' +
        '</div>'
      );
    }
    return '<div class="inbox-view__task-stack">' + tasks.map(function (task) {
      return typeof taskHTML === 'function' ? taskHTML(task, false) : '';
    }).join('') + '</div>';
  }

  function inboxSectionHtml(title, subtitle, tasks, emptyTitle, emptySub, tone) {
    return (
      '<section class="inbox-view__section inbox-view__section--' + tone + '">' +
      '<div class="inbox-view__section-head">' +
      '<div class="inbox-view__section-copy">' +
      '<h4>' + html(title) + '</h4>' +
      '<p>' + html(subtitle) + '</p>' +
      '</div>' +
      '<span class="inbox-view__section-count">' + tasks.length + '</span>' +
      '</div>' +
      inboxTaskStackHtml(tasks, emptyTitle, emptySub) +
      '</section>'
    );
  }

  function inboxEmptyActionHtml() {
    return (
      '<button type="button" class="inbox-view__cta inbox-view__cta--ghost" onclick="if(window.showAddTaskRow)showAddTaskRow()">' +
      '\u65b0\u5efa\u6536\u4ef6\u7bb1\u4efb\u52a1' +
      '</button>'
    );
  }

  function renderInboxTaskScene(list, ds) {
    const state = getInboxState(ds);
    const heroTitle = state.filteredTasks.length
      ? '\u5148\u6536\u96c6\uff0c\u518d\u5b89\u6392'
      : '\u6536\u4ef6\u7bb1\u5df2\u7ecf\u6e05\u7a7a';
    const heroSub = state.filteredTasks.length
      ? '\u8fd9\u91cc\u53ea\u4fdd\u7559\u4eca\u5929\u8fd8\u6ca1\u5b89\u6392\u5177\u4f53\u65f6\u95f4\u7684\u5f85\u529e\uff0c\u9002\u5408\u5148\u8bb0\u4e0b\u6765\uff0c\u7a0d\u540e\u518d\u6392\u8fdb\u65e5\u7a0b\u3002'
      : '\u5f53\u524d\u6ca1\u6709\u5f85\u6574\u7406\u7684\u672a\u5b89\u6392\u4efb\u52a1\uff0c\u4f60\u53ef\u4ee5\u7ee7\u7eed\u8bb0\u5f55\u65b0\u60f3\u6cd5\uff0c\u6216\u76f4\u63a5\u53bb\u4eca\u5929\u5217\u8868\u6267\u884c\u3002';
    const normalTitle = state.highTasks.length ? '\u5176\u4ed6\u5f85\u5b89\u6392' : '\u5f85\u5b89\u6392\u4efb\u52a1';
    const normalSub = state.highTasks.length
      ? '\u8fd9\u4e9b\u4efb\u52a1\u53ef\u4ee5\u5728\u6709\u7a7a\u6863\u65f6\u518d\u7ee7\u7eed\u5206\u914d\u3002'
      : '\u8fd8\u6ca1\u6709\u6392\u65f6\u95f4\u7684\u4efb\u52a1\u90fd\u96c6\u4e2d\u5728\u8fd9\u91cc\u3002';
    const suggestions = buildInboxSuggestions(state).map(inboxSuggestionHtml).join('');
    const mainContent = state.filteredTasks.length
      ? (
        (state.highTasks.length
          ? inboxSectionHtml(
            '\u9ad8\u4f18\u5148\u5f85\u5b89\u6392',
            '\u5148\u4e3a\u8fd9\u4e9b\u4efb\u52a1\u786e\u5b9a\u65f6\u95f4\u7a97\u53e3\uff0c\u53ef\u4ee5\u66f4\u5feb\u6e05\u7a7a\u6536\u4ef6\u7bb1\u3002',
            state.highTasks,
            '\u73b0\u5728\u6ca1\u6709\u9ad8\u4f18\u5148\u672a\u5b89\u6392\u4efb\u52a1',
            '\u53ef\u4ee5\u7ee7\u7eed\u6574\u7406\u4e0b\u65b9\u666e\u901a\u5f85\u529e\u3002',
            'priority'
          )
          : '') +
        inboxSectionHtml(
          normalTitle,
          normalSub,
          state.normalTasks.length ? state.normalTasks : state.filteredTasks,
          '\u6682\u65f6\u6ca1\u6709\u5176\u4ed6\u5f85\u5b89\u6392\u4efb\u52a1',
          '\u9ad8\u4f18\u4efb\u52a1\u5df2\u7ecf\u8db3\u591f\u5145\u5b9e\uff0c\u53ef\u4ee5\u5148\u5904\u7406\u5b83\u4eec\u3002',
          'queue'
        )
      )
      : (
        '<section class="inbox-view__empty">' +
        '<div class="inbox-view__empty-icon" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" focusable="false">' +
        '<path d="M3.75 8.75C3.75 7.64543 4.64543 6.75 5.75 6.75H18.25C19.3546 6.75 20.25 7.64543 20.25 8.75V17.25C20.25 18.3546 19.3546 19.25 18.25 19.25H5.75C4.64543 19.25 3.75 18.3546 3.75 17.25V8.75Z" stroke="currentColor" stroke-width="1.75"></path>' +
        '<path d="M7.5 12.25L10.35 15L16.5 9" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"></path>' +
        '</svg>' +
        '</div>' +
        '<h4>\u5f53\u524d\u6536\u4ef6\u7bb1\u5f88\u5e72\u51c0</h4>' +
        '<p>\u4eca\u5929\u6ca1\u6709\u672a\u5b89\u6392\u65f6\u95f4\u7684\u5f85\u529e\uff0c\u65b0\u60f3\u6cd5\u4ecd\u7136\u53ef\u4ee5\u5148\u653e\u8fdb\u6765\uff0c\u540e\u9762\u518d\u6162\u6162\u6574\u7406\u3002</p>' +
        '<div class="inbox-view__empty-actions">' + inboxEmptyActionHtml() + '</div>' +
        '</section>'
      );

    list.innerHTML =
      '<section class="inbox-view" aria-label="\u6536\u4ef6\u7bb1\u89c6\u56fe">' +
      '<div class="inbox-view__hero">' +
      '<div class="inbox-view__hero-main">' +
      '<span class="inbox-view__hero-kicker">\u4eca\u65e5\u672a\u5b89\u6392\u6c60</span>' +
      '<h4>' + html(heroTitle) + '</h4>' +
      '<p>' + html(heroSub) + '</p>' +
      '<div class="inbox-view__metrics">' +
      inboxMetricHtml(state.filteredTasks.length, '\u5f85\u6574\u7406', state.filteredTasks.length ? '\u8fd8\u5728\u7b49\u4f60\u6392\u671f' : '\u5f53\u524d\u5df2\u6e05\u7a7a', 'main') +
      inboxMetricHtml(state.highTasks.length, '\u9ad8\u4f18\u5148', state.highTasks.length ? '\u5efa\u8bae\u5148\u5b89\u6392' : '\u6682\u65e0\u7d27\u6025', 'priority') +
      inboxMetricHtml(formatMinutesText(state.totalMinutes), '\u9884\u8ba1\u8017\u65f6', state.sizedCount ? state.sizedCount + ' \u9879\u5df2\u4f30\u65f6' : '\u53ef\u4ee5\u6162\u6162\u8865\u5145', 'time') +
      '</div>' +
      '</div>' +
      '<div class="inbox-view__hero-side">' +
      '<button type="button" class="inbox-view__cta" onclick="if(window.showAddTaskRow)showAddTaskRow()">' +
      '\u5feb\u901f\u8bb0\u5f55' +
      '</button>' +
      '<p class="inbox-view__hero-side-copy">\u628a\u60f3\u5230\u7684\u4e8b\u5148\u653e\u8fdb\u6536\u4ef6\u7bb1\uff0c\u4e0d\u5fc5\u5f53\u573a\u51b3\u5b9a\u65f6\u95f4\u3002</p>' +
      '<div class="inbox-view__hero-notes">' +
      '<span>' + html(state.quickWinCount + ' \u9879\u53ef\u5feb\u901f\u5b89\u6392') + '</span>' +
      '<span>' + html(state.untaggedCount + ' \u9879\u8fd8\u6ca1\u5206\u7c7b') + '</span>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="inbox-view__layout">' +
      '<div class="inbox-view__main">' + mainContent + '</div>' +
      '<aside class="inbox-view__aside">' +
      '<section class="inbox-view__aside-card">' +
      '<div class="inbox-view__aside-head">' +
      '<h4>\u6574\u7406\u5efa\u8bae</h4>' +
      '<p>\u8ba9\u6536\u4ef6\u7bb1\u66f4\u5feb\u53d8\u6210\u53ef\u6267\u884c\u7684\u65e5\u7a0b\u3002</p>' +
      '</div>' +
      '<div class="inbox-view__suggestions">' + suggestions + '</div>' +
      '</section>' +
      '<section class="inbox-view__aside-card inbox-view__aside-card--guide">' +
      '<div class="inbox-view__aside-head">' +
      '<h4>\u4f7f\u7528\u65b9\u5f0f</h4>' +
      '<p>\u8fd9\u4e2a\u89c6\u56fe\u9002\u5408\u5148\u6536\u96c6\uff0c\u518d\u7edf\u4e00\u5b89\u6392\u3002</p>' +
      '</div>' +
      '<ol class="inbox-view__guide-list">' +
      '<li>\u5148\u5feb\u901f\u8bb0\u5f55\uff0c\u4e0d\u8ba9\u601d\u8def\u88ab\u6253\u65ad\u3002</li>' +
      '<li>\u4e3a\u9ad8\u4f18\u4efb\u52a1\u8865\u4e0a\u65f6\u95f4\u6216\u8017\u65f6\u3002</li>' +
      '<li>\u8ba9\u6709\u6807\u7b7e\u7684\u4efb\u52a1\u66f4\u5bb9\u6613\u6279\u91cf\u5904\u7406\u3002</li>' +
      '</ol>' +
      '</section>' +
      '</aside>' +
      '</div>' +
      '</section>';

    return state;
  }

  function renderInboxTitle(state) {
    const title = getTitleHost();
    if (!title) {
      return;
    }
    clearTitleMotion(title);
    const count = state && state.filteredTasks ? state.filteredTasks.length : 0;
    const subText = count
      ? '\u4eca\u5929\u8fd8\u6709 ' + count + ' \u9879\u672a\u5b89\u6392\u5177\u4f53\u65f6\u95f4\u7684\u5f85\u529e'
      : '\u8fd9\u91cc\u4f1a\u96c6\u4e2d\u653e\u7f6e\u6682\u65f6\u4e0d\u60f3\u6392\u65f6\u95f4\u7684\u4efb\u52a1';

    title.innerHTML =
      '<span class="inbox-title">' +
      inboxTitleIconMarkup() +
      '<span class="inbox-title__copy">' +
      '<span class="inbox-title__main">\u6536\u4ef6\u7bb1</span>' +
      '<span class="inbox-title__sub">' + html(subText) + '</span>' +
      '</span>' +
      '</span>';
    title.dataset.renderKey = 'inbox|title|' + count;
    title.dataset.lastDs = INBOX_MODE;
    title.classList.remove('is-week-scope', 'is-range-offset', 'is-relative', 'is-plain-date', 'is-overdue-scope', 'is-priority-scope', 'is-repeat-scope', 'is-frozen-scope', 'is-goal-scope');
    title.classList.add('is-inbox-scope');
  }

  function clearInboxTitle() {
    const title = getTitleHost();
    if (!title) {
      return;
    }
    title.classList.remove('is-inbox-scope');
  }

  function bindInboxTitleClickGuard(dateNav) {
    if (!dateNav || dateNav.dataset.inboxClickGuardBound) {
      return;
    }
    const titleWrap = dateNav.querySelector('h3');
    if (!titleWrap) {
      return;
    }
    dateNav.dataset.inboxClickGuardBound = '1';
    titleWrap.addEventListener('click', function (event) {
      if (!isInboxMode()) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  }

  function applyInboxHeaderState() {
    const taskMode = getTaskMode();
    const dateNav = getDateNav();
    const inbox = isInboxMode();

    if (taskMode) {
      taskMode.classList.toggle(INBOX_CLASS, inbox);
    }
    if (dateNav) {
      dateNav.classList.toggle(INBOX_NAV_CLASS, inbox);
      bindInboxTitleClickGuard(dateNav);
    }

    if (inbox) {
      renderInboxTitle(getInboxState(typeof sel === 'string' && sel ? sel : todayKey()));
    } else {
      clearInboxTitle();
    }
  }

  function scheduleApply() {
    applyInboxHeaderState();
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(applyInboxHeaderState);
    }
  }

  function hookRender() {
    if (typeof rT !== 'function' || window.__inboxViewRTPatched) {
      return;
    }
    window.__inboxViewRTPatched = true;
    const originalRT = rT;
    rT = function () {
      const result = originalRT.apply(this, arguments);
      scheduleApply();
      return result;
    };
  }

  window.renderInboxTaskScene = renderInboxTaskScene;
  hookRender();
  scheduleApply();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      hookRender();
      scheduleApply();
    });
  }

  window.applyInboxHeaderState = scheduleApply;
})();
