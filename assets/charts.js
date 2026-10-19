/* WorseWatch — hand-rolled SVG charts, zero dependencies */
window.WW_CHARTS = (function () {
  "use strict";

  var PALETTE = ["#7aa2ff", "#f5a524", "#4cc38a", "#ff5d5d", "#c792ea", "#3ddbd9"];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function niceStep(range) {
    var raw = range / 4;
    var p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    var n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
  }

  /* Multi-series line chart.
     series: [{ name, pts:[{x:Date, y:Number}], color? }] */
  function lineChart(series, opts) {
    opts = opts || {};
    var W = opts.w || 720, H = opts.h || 240;
    var L = 46, R = 12, T = 12, B = 28;
    var iw = W - L - R, ih = H - T - B;

    var all = [];
    series.forEach(function (s) { s.pts.forEach(function (p) { all.push(p); }); });
    if (!all.length) return '<div class="emptyblock">No chart data.</div>';
    all.sort(function (a, b) { return a.x - b.x; });

    var x0 = all[0].x.getTime(), x1 = all[all.length - 1].x.getTime();
    if (x1 === x0) x1 = x0 + 1;
    var yMax = 0, yMin = 0;
    all.forEach(function (p) { if (p.y > yMax) yMax = p.y; if (p.y < yMin) yMin = p.y; });
    var yRange = yMax - yMin || 1;
    var step = niceStep(yRange);
    var yTop = Math.ceil(yMax / step) * step;

    function X(t) { return L + (t - x0) / (x1 - x0) * iw; }
    function Y(v) { return T + (1 - (v - yMin) / (yTop - yMin || 1)) * ih; }

    var out = [];
    out.push('<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img">');

    /* y grid */
    for (var v = yMin; v <= yTop + 1e-9; v += step) {
      var yv = Y(v);
      out.push('<line class="gridline" x1="' + L + '" y1="' + yv + '" x2="' + (W - R) + '" y2="' + yv + '"/>');
      out.push('<text class="axis-t" x="' + (L - 7) + '" y="' + (yv + 3) + '" text-anchor="end">' + esc((opts.yFmt || String)(v)) + '</text>');
    }

    /* x ticks: every January */
    var d = new Date(all[0].x);
    d = new Date(d.getFullYear() + 1, 0, 1);
    while (d.getTime() <= x1) {
      var xv = X(d.getTime());
      out.push('<line class="gridline" x1="' + xv + '" y1="' + T + '" x2="' + xv + '" y2="' + (T + ih) + '" stroke-dasharray="2 4"/>');
      out.push('<text class="axis-t" x="' + xv + '" y="' + (H - 8) + '" text-anchor="middle">' + d.getFullYear() + '</text>');
      d = new Date(d.getFullYear() + 1, 0, 1);
    }

    /* series lines + dots */
    series.forEach(function (s, i) {
      if (s.pts.length < 2) return;
      var color = s.color || PALETTE[i % PALETTE.length];
      var dPath = "";
      s.pts.forEach(function (p, j) {
        dPath += (j ? "L" : "M") + X(p.x.getTime()).toFixed(1) + " " + Y(p.y).toFixed(1) + " ";
      });
      out.push('<path d="' + dPath + '" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>');
      s.pts.forEach(function (p) {
        out.push('<circle cx="' + X(p.x.getTime()).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) +
          '" r="3.4" fill="' + color + '"><title>' + esc(s.name + " — " + fmtTitle(p.x) + " · " +
          esc((opts.yFmt || String)(p.y))) + '</title></circle>');
      });
    });

    out.push('</svg>');
    return out.join("");
  }

  function fmtTitle(d) {
    return d.toLocaleDateString("en", { month: "short", year: "numeric" });
  }

  /* Sparkline with area fill. pts:[{x,y}] */
  function spark(pts, opts) {
    opts = opts || {};
    var W = opts.w || 260, H = opts.h || 46;
    var color = opts.color || "#ff5d5d";
    if (!pts || pts.length < 2) return "";
    var xs = pts.map(function (p) { return p.x; });
    var ys = pts.map(function (p) { return p.y; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    if (opts.y0 != null) y0 = opts.y0;
    if (opts.y1 != null) y1 = opts.y1;
    if (x1 === x0) x1 = x0 + 1;
    if (y1 === y0) y1 = y0 + 1;
    var pad = 3;
    function X(t) { return pad + (t - x0) / (x1 - x0) * (W - pad * 2); }
    function Y(v) { return H - pad - (v - y0) / (y1 - y0) * (H - pad * 2); }
    var dLine = "", dArea = "";
    pts.forEach(function (p, i) {
      dLine += (i ? "L" : "M") + X(p.x.getTime()).toFixed(1) + " " + Y(p.y).toFixed(1) + " ";
    });
    dArea = dLine + "L" + X(x1).toFixed(1) + " " + H + " L" + X(x0).toFixed(1) + " " + H + " Z";
    var last = pts[pts.length - 1];
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" style="display:block;width:100%;height:' + H + 'px">' +
      '<path d="' + dArea + '" fill="' + color + '" opacity="0.13"/>' +
      '<path d="' + dLine + '" fill="none" stroke="' + color + '" stroke-width="2"/>' +
      '<circle cx="' + X(last.x.getTime()).toFixed(1) + '" cy="' + Y(last.y).toFixed(1) + '" r="2.6" fill="' + color + '">' +
      '<title>' + esc((opts.tip || "") + " " + last.y) + '</title></circle></svg>';
  }

  return { lineChart: lineChart, spark: spark, PALETTE: PALETTE };
})();
