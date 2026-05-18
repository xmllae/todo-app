// 模板管理：负责新增、勾选、删除、渲染以及批量应用模板。

function addTpl() {
  const input = document.getElementById("tplIn");
  const planTimeInput = document.getElementById("tplTime");
  const text = input.value.trim();

  if (!text) {
    return;
  }

  templates.push({
    id: Date.now(),
    text: text,
    priority: document.getElementById("tplPSel").value,
    checked: true,
    planTime: planTimeInput.value || ""
  });

  input.value = "";
  planTimeInput.value = "";
  rTpl();
  save();
  toast("📦 已添加");
}

function togTpl(id) {
  const tpl = templates.find(function(item) {
    return item.id === id;
  });

  if (!tpl) {
    return;
  }

  tpl.checked = !tpl.checked;
  rTpl();
  save();
}

function delTpl(id) {
  templates = templates.filter(function(item) {
    return item.id !== id;
  });

  rTpl();
  save();
}

function rTpl() {
  const list = document.getElementById("tplList");

  if (!list) {
    return;
  }

  if (!templates.length) {
    list.innerHTML = buildTplEmptyState();
    return;
  }

  list.innerHTML = templates.map(renderTplItem).join("");
}

function applyTpl() {
  const checkedTemplates = getCheckedTemplates();

  if (!checkedTemplates.length) {
    toast("⚠️ 请勾选模板");
    return;
  }

  const days = getTplRangeDays("applyDays");
  let count = 0;

  forEachTplDay(days, function(dayKey) {
    if (!T[dayKey]) {
      T[dayKey] = [];
    }

    checkedTemplates.forEach(function(tpl) {
      const exists = T[dayKey].some(function(task) {
        return task.text === tpl.text && !task.done && !task.archived;
      });

      if (exists) {
        return;
      }

      T[dayKey].push(
        mkTask(tpl.text, tpl.priority, tpl.planTime, 0, { fromTpl: true })
      );
      count += 1;
    });
  });

  rCal();
  rT();
  save();
  setTplMessage("applyMsg", `✅ 已添加 ${count} 条`);
  toast(`🚀 已添加 ${count} 条`);
}

function batchDelTpl() {
  const checkedTemplates = getCheckedTemplates();

  if (!checkedTemplates.length) {
    toast("⚠️ 请勾选模板");
    return;
  }

  const days = getTplRangeDays("delDays");
  const names = new Set(checkedTemplates.map(function(tpl) {
    return tpl.text;
  }));
  let count = 0;

  forEachTplDay(days, function(dayKey) {
    if (!T[dayKey]) {
      return;
    }

    const before = T[dayKey].length;
    T[dayKey] = T[dayKey].filter(function(task) {
      return !names.has(task.text) || task.archived;
    });
    count += before - T[dayKey].length;

    if (!T[dayKey].length) {
      delete T[dayKey];
    }
  });

  rCal();
  rT();
  save();
  setTplMessage("delMsg", count ? `🗑️ 已删除 ${count} 条` : "ℹ️ 未找到匹配");
}

function getCheckedTemplates() {
  return templates.filter(function(tpl) {
    return tpl.checked;
  });
}

function getTplRangeDays(inputId) {
  return parseInt(document.getElementById(inputId).value, 10) || 7;
}

function forEachTplDay(days, iteratee) {
  for (let i = 0; i < days; i += 1) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    iteratee(fd(date));
  }
}

function setTplMessage(elementId, text) {
  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  element.textContent = text;
  setTimeout(function() {
    element.textContent = "";
  }, 3000);
}

function buildTplEmptyState() {
  return [
    '<div style="text-align:center;padding:28px;color:var(--text3)">',
    '<div style="font-size:2rem;margin-bottom:6px">📦</div>',
    "<p>暂无模板</p>",
    "</div>"
  ].join("");
}

function renderTplItem(tpl) {
  const checkedMark = tpl.checked ? "✓" : "";
  const timeMarkup = tpl.planTime
    ? `<span class="time-badge" style="font-size:.76rem;padding:1px 7px">🕐${tpl.planTime}</span>`
    : "";

  return [
    '<div class="tpl-item">',
    `<div class="tpl-ck ${tpl.checked ? "checked" : ""}" onclick="togTpl(${tpl.id})">${checkedMark}</div>`,
    `<div class="tpl-txt">${esc(tpl.text)}</div>`,
    timeMarkup,
    " ",
    prioBadge(tpl.priority),
    `<button class="tpl-del" onclick="delTpl(${tpl.id})">`,
    '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">',
    '<line x1="18" y1="6" x2="6" y2="18"></line>',
    '<line x1="6" y1="6" x2="18" y2="18"></line>',
    "</svg>",
    "</button>",
    "</div>"
  ].join("");
}
