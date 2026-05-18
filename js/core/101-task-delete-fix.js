(function patchTaskDelete() {
  function findTaskForDelete(id) {
    const targetId = +id;
    const currentTasks = T[sel] || [];
    const currentTask = currentTasks.find((task) => +task.id === targetId);

    if (currentTask) {
      return { task: currentTask, date: sel };
    }

    for (const date in T) {
      const tasks = T[date] || [];
      const task = tasks.find((item) => +item.id === targetId);
      if (task) return { task, date };
    }

    return null;
  }

  function clearRecurringRuleForDelete(ruleId) {
    if (!ruleId) return;

    if (typeof deleteRecurRule === 'function') {
      try {
        deleteRecurRule(ruleId, true);
      } catch {
        return;
      }
      return;
    }

    if (Array.isArray(recurRules)) {
      recurRules = recurRules.filter((rule) => rule.id !== ruleId);
    }

    for (const date in T) {
      (T[date] || []).forEach((task) => {
        if (task.recurRuleId === ruleId) task.recurRuleId = '';
      });
    }
  }

  function removeTaskByDate(date, id) {
    if (!T[date]) return;

    const targetId = +id;
    T[date] = T[date].filter((task) => +task.id !== targetId);
    if (!T[date].length) delete T[date];
  }

  function refreshAfterDelete() {
    rCal();
    rT();
    if (typeof rKanban === 'function') rKanban();
    save();
    toast('\ud83d\uddd1\ufe0f \u5df2\u5220\u9664');
  }

  window.del = function del(id) {
    const found = findTaskForDelete(id);
    if (!found) return;

    const ruleId = found.task.recurRuleId ? String(found.task.recurRuleId) : '';

    pushUndo('\u4efb\u52a1\u5df2\u5220\u9664');
    clearRecurringRuleForDelete(ruleId);
    removeTaskByDate(found.date, id);
    refreshAfterDelete();
  };
})();
