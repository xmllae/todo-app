/**
 * 优先级弧形渐变 SVG（设置页卡片与模板选择器共用）
 * @param {string} edge 深色端
 * @param {string} hi 高光色
 * @param {{width?:number,height?:number,strokeWidth?:number}} [opts]
 */
(function () {
  function prioArcSvgHtmlStops(edge, hi, opts) {
    opts = opts || {};
    var w = opts.width != null ? opts.width : 22;
    var h = opts.height != null ? opts.height : 54;
    var strokeWidth = opts.strokeWidth != null ? opts.strokeWidth : 2.8;
    if (!window._prioArcGid) window._prioArcGid = 0;
    var gid = 'prioArcMG' + ++window._prioArcGid;
    return (
      '<svg width="' +
      w +
      '" height="' +
      h +
      '" viewBox="-2 0 19 48" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false"><defs><linearGradient id="' +
      gid +
      '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' +
      edge +
      '"/><stop offset="27.5%" stop-color="' +
      hi +
      '"/><stop offset="72.5%" stop-color="' +
      hi +
      '"/><stop offset="100%" stop-color="' +
      edge +
      '"/></linearGradient></defs><path d="M13,3 Q1,24 13,45" stroke="url(#' +
      gid +
      ')" stroke-width="' +
      strokeWidth +
      '" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'
    );
  }
  window.prioArcSvgHtmlStops = prioArcSvgHtmlStops;
})();
