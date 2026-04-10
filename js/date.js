/**
 * =================================================================
 * date.js - 日期工具 & 通用 UI 工具
 * =================================================================
 * 日期格式化函数、通用 HTML 转义（esc）、toast 提示等基础工具函数。
 * 不依赖任何业务逻辑，可在任何模块中使用。
 * =================================================================
 */

// ─────────────────────────────────────────────
// ① 日期格式化
// ─────────────────────────────────────────────

/**
 * 将 Date 对象格式化为 'YYYY-MM-DD' 字符串。
 * @param {Date} d
 */
function fd(d) {
  return (
    d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

/**
 * 将 'YYYY-MM-DD' 格式化为中文显示，如 "4月9日 周四"。
 * @param {string} s - 日期字符串
 */
function disp(s) {
  const d = parseDS(s);
  const p = s.split('-');
  const w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return `${+p[1]}月${+p[2]}日 周${w}`;
}

/**
 * 将 'YYYY-MM-DD' 格式化为简短中文，如 "4/9"。
 * @param {string} s
 */
function dispS(s) {
  const p = s.split('-');
  return `${+p[1]}/${+p[2]}`;
}

/**
 * 将 'YYYY-MM-DD' 字符串解析为 Date 对象（本地时区）。
 * @param {string} s
 */
function parseDS(s) {
  const p = s.split('-');
  return new Date(+p[0], +p[1] - 1, +p[2]);
}

/**
 * 将分钟数格式化为可读时长，如 90 -> "1h30m"。
 * @param {number} m
 */
function fmtDs(m) {
  if (!m) return '';
  if (m < 60) return m + 'm';
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? h + 'h' + r + 'm' : h + 'h';
}

/** 计算截止时间（计划时间 + 耗时）。 */
function calcDeadline(pt, dur) {
  if (!pt || !dur) return '';
  const [h, m] = pt.split(':').map(Number);
  const total = h * 60 + m + dur;
  const dh = Math.floor(total / 60) % 24;
  const dm = total % 60;
  return String(dh).padStart(2, '0') + ':' + String(dm).padStart(2, '0');
}

/** 截止时间排序用的数值 key（分钟数），无效则返回 null。 */
function deadlineSortKey(t) {
  const pt = t.planTime || '';
  const dur = parseInt(t.duration, 10) || 0;
  if (!pt) return null;
  const p = pt.split(':').map(Number);
  if (p.length < 2 || isNaN(p[0]) || isNaN(p[1])) return null;
  return p[0] * 60 + p[1] + dur;
}

// ─────────────────────────────────────────────
// ② 通用 HTML 转义（防止 XSS）
// ─────────────────────────────────────────────

/**
 * 将字符串转义为安全的 HTML 文本节点。
 * @param {string} t
 */
function esc(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

// ─────────────────────────────────────────────
// ③ Toast 提示
// ─────────────────────────────────────────────

/** 在页面底部显示临时提示，2.5 秒后自动消失。 */
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.classList.remove('show'), 2500);
}

// ─────────────────────────────────────────────
// ④ 剪贴板复制
// ─────────────────────────────────────────────

/** 使用现代 API 复制文本到剪贴板，失败时降级到 textarea。 */
function copyToClipboard(text) {
  try {
    navigator.clipboard.writeText(text).then(() => {
      toast('✅ 已复制到剪贴板');
    }).catch(() => {
      fallbackCopy(text);
    });
  } catch (e) {
    fallbackCopy(text);
  }
}

/** 使用 textarea 降级复制（兼容性方案）。 */
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    toast('✅ 已复制到剪贴板');
  } catch (e) {
    toast('❌ 复制失败');
  }
  document.body.removeChild(ta);
}
