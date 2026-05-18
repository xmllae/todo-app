// 统计页：周期切换、标签筛选、概要数据与图表渲染

function setStatP(period, button) {
  statP = period;
  document.querySelectorAll(".stats-period button").forEach((item) => item.classList.remove("on"));
  button.classList.add("on");
  rStats();
}

function getStatsDays() {
  if (statP === "week") return 7;
  if (statP === "two") return 14;
  return 30;
}

function renderStatsTagFilter() {
  const tagFilter = document.getElementById("statsTagFilter");
  if (!tagFilter) return;

  const allButton = `
    <span
      class="stf-btn${!statTag ? " on" : ""}"
      style="${!statTag ? "background:#111827;color:#fff;border-color:#111827" : ""}"
      onclick="statTag='';rStats()"
    >
      全部
    </span>
  `;

  const tagButtons = customTags
    .map(
      (tag) => `
        <span
          class="stf-btn${statTag === tag.id ? " on" : ""}"
          style="${statTag === tag.id ? `background:${tag.color};color:#fff;border-color:${tag.color}` : ""}"
          onclick="statTag='${tag.id}';rStats()"
        >
          ${esc(tag.name)}
        </span>
      `
    )
    .join("");

  tagFilter.innerHTML = allButton + tagButtons;
}

function getStatsAllDatesWithTasks() {
  return new Set(
    Object.keys(T).filter((dateKey) => Array.isArray(T[dateKey]) && T[dateKey].length > 0)
  );
}

function buildStatsDateEntries(days, today, datesWithTasks) {
  const entries = [];
  const entrySet = new Set();

  for (let index = days - 1; index >= 0; index -= 1) {
    const dateKey = fd(new Date(new Date(today).getTime() - index * 86400000));
    entries.push(dateKey);
    entrySet.add(dateKey);
  }

  for (let index = 1; index <= days; index += 1) {
    const dateKey = fd(new Date(new Date(today).getTime() + index * 86400000));
    if (datesWithTasks.has(dateKey) && !entrySet.has(dateKey)) {
      entries.push(dateKey);
      entrySet.add(dateKey);
    }
  }

  return entries.sort();
}

function getStatsTasksByDate(dateKey) {
  let tasks = (T[dateKey] || []).filter((task) => !task.frozen);
  if (statTag) {
    tasks = tasks.filter((task) => (task.tags || []).includes(statTag));
  }
  return tasks;
}

function collectStatsRows(dateEntries, today) {
  let totalTasks = 0;
  let totalDone = 0;
  let perfectDays = 0;

  const rows = dateEntries.map((dateKey) => {
    const tasks = getStatsTasksByDate(dateKey);
    const doneCount = tasks.filter((task) => task.done || task.archived).length;
    const totalCount = tasks.length;

    totalTasks += totalCount;
    totalDone += doneCount;
    if (totalCount > 0 && doneCount === totalCount) {
      perfectDays += 1;
    }

    return {
      ds: dateKey,
      label: dispS(dateKey),
      total: totalCount,
      done: doneCount,
      isToday: dateKey === today,
      isFuture: dateKey > today
    };
  });

  return { rows, totalTasks, totalDone, perfectDays };
}

function renderStatsSummary(totalTasks, totalDone, perfectDays) {
  const summaryEl = document.getElementById("statsSummary");
  if (!summaryEl) return;

  const rate = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
  summaryEl.innerHTML = `
    <div class="stat-box"><div class="num">${totalTasks}</div><div class="lab">总任务数</div></div>
    <div class="stat-box"><div class="num">${totalDone}</div><div class="lab">已完成</div></div>
    <div class="stat-box"><div class="num">${rate}%</div><div class="lab">完成率</div></div>
    <div class="stat-box"><div class="num">${perfectDays}</div><div class="lab">满分日</div></div>
  `;
}

function getStatsBarStyle(row) {
  if (row.total === 0) {
    return {
      width: 0,
      colorStart: "#e2e8f0",
      colorEnd: "#e2e8f0",
      text: "-"
    };
  }

  const percent = Math.round((row.done / row.total) * 100);
  if (percent === 100) {
    return {
      width: Math.max(percent, 3),
      colorStart: "#22c55e",
      colorEnd: "#4ade80",
      text: `${row.done}/${row.total} ✓`
    };
  }

  if (percent > 0) {
    return {
      width: Math.max(percent, 3),
      colorStart: "#818cf8",
      colorEnd: "#a5b4fc",
      text: `${row.done}/${row.total}`
    };
  }

  return {
    width: 3,
    colorStart: "#cbd5e1",
    colorEnd: "#e2e8f0",
    text: `${row.done}/${row.total}`
  };
}

function buildStatsChartRow(row, isFirstFutureRow) {
  const { width, colorStart, colorEnd, text } = getStatsBarStyle(row);
  const divider = isFirstFutureRow
    ? '<div class="chart-divider"><span>📅 未来计划</span></div>'
    : "";
  const leftClass = `${row.isToday ? " cl-today" : ""}${row.isFuture ? " cl-future" : ""}`;
  const rightClass = `${row.isToday ? " cr-today" : ""}${row.isFuture ? " cr-future" : ""}`;
  const todayMark = row.isToday ? " ←今天" : "";

  return `
    ${divider}
    <div class="chart-row">
      <div class="chart-left${leftClass}">${row.label}${todayMark}</div>
      <div class="chart-bar">
        <div
          class="chart-bar-fill"
          style="width:${width}%;background:linear-gradient(90deg,${colorStart},${colorEnd});"
        ></div>
      </div>
      <div class="chart-right${rightClass}">${text}</div>
    </div>
  `;
}

function renderStatsChart(rows) {
  const chartEl = document.getElementById("chartArea");
  if (!chartEl) return;

  let firstFutureInserted = false;
  const chartHtml = rows
    .map((row) => {
      const isFirstFutureRow = row.isFuture && !firstFutureInserted;
      if (isFirstFutureRow) firstFutureInserted = true;
      return buildStatsChartRow(row, isFirstFutureRow);
    })
    .join("");

  chartEl.innerHTML = chartHtml;
}

function rStats() {
  const days = getStatsDays();
  const today = fd(now);
  renderStatsTagFilter();

  const allDatesWithTasks = getStatsAllDatesWithTasks();
  const dateEntries = buildStatsDateEntries(days, today, allDatesWithTasks);
  const { rows, totalTasks, totalDone, perfectDays } = collectStatsRows(dateEntries, today);

  renderStatsSummary(totalTasks, totalDone, perfectDays);
  renderStatsChart(rows);
}
