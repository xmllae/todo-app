// 看板视图：渲染、详情、拖拽与触屏交互
let kbTouchState = null;
let kbDragId = null;

function kbGetTimePeriod(planTime) {
  if (!planTime) return "unset";
  if (planTime < "09:00") return "morning";
  if (planTime < "12:00") return "forenoon";
  if (planTime < "18:00") return "afternoon";
  return "evening";
}

function kbGetVisibleTasks() {
  generateRecurring(sel);
  checkUnfreeze();

  const tasks = (T[sel] || []).filter((task) => isListedTask(task));
  if (!FTag) return tasks;

  return tasks.filter((task) => (task.tags || []).includes(FTag));
}

function kbCountTasksByPeriod(tasks, periodId) {
  if (periodId === "all") return tasks.length;
  return tasks.filter((task) => kbGetTimePeriod(task.planTime || "") === periodId).length;
}

function kbBuildPeriodList(tasks) {
  return [
    { id: "all", name: "全部", cnt: kbCountTasksByPeriod(tasks, "all") },
    { id: "morning", name: "🌅 早晨 00:00-09:00", cnt: kbCountTasksByPeriod(tasks, "morning") },
    { id: "forenoon", name: "☀️ 上午 09:00-12:00", cnt: kbCountTasksByPeriod(tasks, "forenoon") },
    { id: "afternoon", name: "🌤 下午 12:00-18:00", cnt: kbCountTasksByPeriod(tasks, "afternoon") },
    { id: "evening", name: "🌙 晚上 18:00-24:00", cnt: kbCountTasksByPeriod(tasks, "evening") },
    { id: "unset", name: "📌 未安排", cnt: kbCountTasksByPeriod(tasks, "unset") }
  ];
}

function kbRenderFilterBar(tasks) {
  const filterBar = document.getElementById("kbFilterBar");
  if (!filterBar) return;

  const periods = kbBuildPeriodList(tasks);
  filterBar.innerHTML = periods
    .map(
      (period) => `
        <button
          class="kb-filter-btn${kbTimeFilter === period.id ? " active" : ""}"
          onclick="kbTimeFilter='${period.id}';rKanban()"
        >
          ${period.name}
          <span class="kb-filter-badge">${period.cnt}</span>
        </button>
      `
    )
    .join("");
}

function kbApplyTimeFilter(tasks) {
  if (kbTimeFilter === "all") return tasks;
  return tasks.filter((task) => kbGetTimePeriod(task.planTime || "") === kbTimeFilter);
}

function kbGetColumnTitleHtml(id) {
  if (id === "high") {
    return `<span style="display:inline-flex;align-items:center;gap:6px;color:${priorityColors.high};">🔺 高优先级</span>`;
  }
  if (id === "medium") {
    return `<span style="display:inline-flex;align-items:center;gap:6px;color:${priorityColors.medium};">🔸 中优先级</span>`;
  }
  if (id === "low") {
    return `<span style="display:inline-flex;align-items:center;gap:6px;color:${priorityColors.low};">⚪ 低优先级</span>`;
  }
  if (id === "frozen") {
    return `<span style="display:inline-flex;align-items:center;gap:6px;color:#64748b;">❄️ 冷冻</span>`;
  }
  return `<span style="display:inline-flex;align-items:center;gap:6px;color:#10b981;">✅ 已完成</span>`;
}

function kbBuildColumns(tasks) {
  const doneTasks = tasks.filter((task) => task.done);
  const columns = [
    {
      id: "high",
      name: kbGetColumnTitleHtml("high"),
      tasks: tasks.filter((task) => !task.done && !task.frozen && task.priority === "high")
    },
    {
      id: "medium",
      name: kbGetColumnTitleHtml("medium"),
      tasks: tasks.filter((task) => !task.done && !task.frozen && task.priority === "medium")
    },
    {
      id: "low",
      name: kbGetColumnTitleHtml("low"),
      tasks: tasks.filter((task) => !task.done && !task.frozen && task.priority === "low")
    }
  ];

  const frozenTasks = tasks.filter((task) => task.frozen && !task.done);
  if (frozenTasks.length) {
    columns.push({
      id: "frozen",
      name: kbGetColumnTitleHtml("frozen"),
      tasks: frozenTasks
    });
  }

  if (!kbHideDone) {
    columns.push({
      id: "done",
      name: kbGetColumnTitleHtml("done"),
      tasks: doneTasks
    });
  }

  return { columns, doneTasks };
}

function kbUpdateDoneToggle(doneTasks) {
  const toggleBtn = document.getElementById("kbDoneToggle");
  const countEl = document.getElementById("kbDoneCnt");
  if (!toggleBtn) return;

  toggleBtn.classList.toggle("active", !kbHideDone);
  const labelEl = toggleBtn.firstElementChild || toggleBtn.firstChild;
  if (labelEl) {
    labelEl.innerHTML = kbHideDone
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12c.92-2.6 2.57-4.77 4.66-6.32"/><path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a11.08 11.08 0 0 1-2.1 3.36"/><path d="M14.12 14.12A3 3 0 0 1 9.88 9.88"/><path d="M1 1l22 22"/></svg> 显示已完成列 '
      : '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12"/></svg> 隐藏已完成列 ';
  }
  if (countEl) countEl.textContent = String(doneTasks.length);
}

function kbBuildSubtaskPreview(task) {
  const subtasks = task.subtasks || [];
  if (!subtasks.length) return "";

  const doneCount = subtasks.filter((subtask) => subtask.done).length;
  const percent = Math.round((doneCount / subtasks.length) * 100);
  return `
    <div class="kc-sub-row" title="子任务进度">
      <div class="kc-sub-preview" style="${prioSubProgressVars(task.priority)}">
        📋 ${doneCount}/${subtasks.length}
        <span class="kc-sub-track">
          <span class="kc-sub-fill" style="width:${percent}%"></span>
        </span>
      </div>
    </div>
  `;
}

function kbBuildTaskMeta(task) {
  const timeBadge = task.planTime ? `<span>🕐 ${esc(task.planTime)}</span>` : "";
  const durationBadge = task.duration ? `<span>⏱ ${esc(fmtDs(task.duration))}</span>` : "";
  const priorityBadge = task.subtasks && task.subtasks.length > 0 ? "" : prioBadge(task.priority);
  const tagsHtml = (task.tags || [])
    .map((tagId) => {
      const tag = getTag(tagId);
      return tag
        ? `<span class="task-tag" style="background:${tag.color}22;color:${tag.color};">${esc(tag.name)}</span>`
        : "";
    })
    .join("");

  return `
    <div class="kc-meta">
      ${priorityBadge}
      ${timeBadge}
      ${durationBadge}
    </div>
    ${tagsHtml ? `<div class="kc-tags">${tagsHtml}</div>` : ""}
  `;
}

function kbBuildTaskCard(task) {
  const cardColor = task.color || prioColor(task.priority);
  return `
    <div
      class="kb-card${task.frozen ? " frozen-card" : ""}${task.done ? " kb-done-card" : ""}"
      data-id="${task.id}"
      style="border-left-color:${cardColor}"
      onclick="showKbDetail(${task.id})"
    >
      <div class="kc-title">${esc(task.text)}</div>
      ${kbBuildTaskMeta(task)}
      ${kbBuildSubtaskPreview(task)}
    </div>
  `;
}

function kbBuildColumnHtml(column) {
  const cardsHtml = column.tasks.length
    ? column.tasks.map(kbBuildTaskCard).join("")
    : '<div class="kb-empty-hint">拖拽任务到此列</div>';

  return `
    <div class="kb-col" data-col="${column.id}">
      <div class="kb-col-head">
        <span>${column.name}</span>
        <span>${column.tasks.length}</span>
      </div>
      <div class="kb-cards">
        ${cardsHtml}
        <div class="kb-drop-zone"></div>
      </div>
    </div>
  `;
}

function kbRenderColumns(columns) {
  const wrap = document.getElementById("kanbanWrap");
  if (!wrap) return;
  wrap.innerHTML = columns.map(kbBuildColumnHtml).join("");
}

function kbBindDragEvents() {
  document.querySelectorAll(".kb-card").forEach((card) => {
    card.draggable = true;
    card.addEventListener("dragstart", (event) => {
      kbDragId = Number(card.dataset.id);
      event.dataTransfer.setData("text/plain", String(kbDragId));
    });
    card.addEventListener("touchstart", kbTouchStart, { passive: false });
  });

  document.querySelectorAll(".kb-cards").forEach((cards) => {
    cards.addEventListener("dragover", (event) => {
      event.preventDefault();
      cards.querySelector(".kb-drop-zone")?.classList.add("drag-over");
    });

    cards.addEventListener("dragleave", () => {
      cards.querySelector(".kb-drop-zone")?.classList.remove("drag-over");
    });

    cards.addEventListener("drop", (event) => {
      event.preventDefault();
      cards.querySelector(".kb-drop-zone")?.classList.remove("drag-over");
      kbDrop(cards.parentElement.dataset.col);
    });
  });
}

function rKanban() {
  const dateEl = document.getElementById("kbDate");
  if (dateEl) dateEl.textContent = disp(sel);

  const visibleTasks = kbGetVisibleTasks();
  kbRenderFilterBar(visibleTasks);

  const filteredTasks = kbApplyTimeFilter(visibleTasks);
  const { columns, doneTasks } = kbBuildColumns(filteredTasks);

  kbUpdateDoneToggle(doneTasks);
  kbRenderColumns(columns);
  kbBindDragEvents();
}

function kbBuildDetailMeta(task) {
  return `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;color:#64748b;font-size:.95rem;">
      ${prioBadge(task.priority)}
      ${task.planTime ? `<span>🕐 ${esc(task.planTime)}</span>` : ""}
      ${task.duration ? `<span>⏱ ${esc(fmtDs(task.duration))}</span>` : ""}
      ${task.frozen ? '<span style="color:#64748b">❄️ 冷冻</span>' : ""}
    </div>
  `;
}

function kbBuildDetailTags(task) {
  const tags = (task.tags || [])
    .map((tagId) => {
      const tag = getTag(tagId);
      return tag
        ? `<span class="task-tag" style="background:${tag.color}22;color:${tag.color};">${esc(tag.name)}</span>`
        : "";
    })
    .join("");

  return tags ? `<div class="kc-tags" style="margin-top:8px;">${tags}</div>` : "";
}

function kbBuildDetailNote(task) {
  if (!task.note) return "";
  return `
    <div style="margin-top:12px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;color:#475569;line-height:1.7;">
      ${esc(task.note)}
    </div>
  `;
}

function kbBuildDetailSubtasks(task) {
  const subtasks = task.subtasks || [];
  if (!subtasks.length) return "";

  const itemsHtml = subtasks
    .map(
      (subtask) => `
        <li class="${subtask.done ? "done" : ""}" onclick="kbToggleSub(${task.id},${subtask.id})">
          <input type="checkbox" ${subtask.done ? "checked" : ""} onclick="event.stopPropagation();kbToggleSub(${task.id},${subtask.id})">
          <span>${esc(subtask.text)}</span>
        </li>
      `
    )
    .join("");

  return `
    <div style="margin-top:14px;">
      <div style="font-weight:700;color:#0f172a;margin-bottom:10px;">子任务</div>
      <ul class="subtask-list subtask-list--static">${itemsHtml}</ul>
    </div>
  `;
}

function showKbDetail(id) {
  const task = (T[sel] || []).find((item) => item.id === id);
  if (!task) return;

  const modalBody = document.getElementById("mBody");
  if (!modalBody) return;

  modalBody.innerHTML = `
    <div class="kb-detail-modal">
      <p style="font-weight:600;font-size:1.1rem;line-height:1.6;margin:0 0 4px;">${esc(task.text)}</p>
      ${kbBuildDetailMeta(task)}
      ${kbBuildDetailTags(task)}
      ${kbBuildDetailNote(task)}
      ${kbBuildDetailSubtasks(task)}
      <div class="kb-detail-actions">
        <button class="btn btn-ghost" onclick="clM()">关闭</button>
        <button class="btn btn-primary" onclick="clM();navigate('/');expandedId=${task.id};rT()">查看详情</button>
      </div>
    </div>
  `;
  document.getElementById("mBg")?.classList.add("show");
}

function kbToggleSub(taskId, subtaskId) {
  const task = (T[sel] || []).find((item) => item.id === taskId);
  const subtask = task?.subtasks?.find((item) => item.id === subtaskId);
  if (!task || !subtask) return;

  subtask.done = !subtask.done;
  showKbDetail(taskId);
  rKanban();
  save();
}

function kbDrop(columnId) {
  const task = (T[sel] || []).find((item) => item.id === kbDragId);
  if (!task) return;

  if (columnId === "high" || columnId === "medium" || columnId === "low") {
    task.priority = columnId;
    task.done = false;
    task.status = "todo";
    task.frozen = false;
    task.archived = false;
  } else if (columnId === "done") {
    task.status = "done";
    task.done = true;
    task.frozen = false;
  } else if (columnId === "frozen") {
    task.frozen = true;
  }

  kbDragId = null;
  rKanban();
  rCal();
  save();
}

function kbCreateTouchGhost(sourceCard) {
  const ghost = sourceCard.cloneNode(true);
  ghost.classList.add("drag-ghost");
  ghost.style.width = `${sourceCard.offsetWidth}px`;
  document.body.appendChild(ghost);
  return ghost;
}

function kbTouchStart(event) {
  const touch = event.touches[0];
  const sourceCard = event.currentTarget;
  kbTouchState = {
    id: Number(sourceCard.dataset.id),
    ghost: kbCreateTouchGhost(sourceCard)
  };

  sourceCard.classList.add("dragging");
  kbTouchMove(event);
  document.addEventListener("touchmove", kbTouchMove, { passive: false });
  document.addEventListener("touchend", kbTouchEnd, { passive: false });
  event.preventDefault();
}

function kbTouchMove(event) {
  if (!kbTouchState) return;

  const touch = event.touches[0];
  kbTouchState.ghost.style.left = `${touch.clientX - 120}px`;
  kbTouchState.ghost.style.top = `${touch.clientY - 28}px`;

  document.querySelectorAll(".kb-drop-zone").forEach((zone) => zone.classList.remove("drag-over"));

  const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest(".kb-col");
  target?.querySelector(".kb-drop-zone")?.classList.add("drag-over");
  event.preventDefault();
}

function kbTouchEnd(event) {
  if (!kbTouchState) return;

  document.removeEventListener("touchmove", kbTouchMove);
  document.removeEventListener("touchend", kbTouchEnd);
  document.querySelector(".kb-card.dragging")?.classList.remove("dragging");
  document.querySelectorAll(".kb-drop-zone").forEach((zone) => zone.classList.remove("drag-over"));

  const touch = event.changedTouches[0];
  const targetColumn = document.elementFromPoint(touch.clientX, touch.clientY)?.closest(".kb-col");
  if (targetColumn) {
    kbDragId = kbTouchState.id;
    kbDrop(targetColumn.dataset.col);
  }

  kbTouchState.ghost.remove();
  kbTouchState = null;
}
