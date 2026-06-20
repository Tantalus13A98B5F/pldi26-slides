/* Reveal.js plugin: render Chart.js charts declared in the reveal config.
 * Loads Chart.js from config.chartjs.path (or jsdelivr CDN), deep-merges
 * config.chartjs.default into the global Chart.defaults, then instantiates
 * each entry of config.chartjs.charts onto the <canvas> whose id matches.
 *
 *   chartjs: {
 *     path:    './node_modules/chart.js/dist/chart.umd.js',  // optional, local file
 *     default: { font: { size: 32 } },                       // merged into Chart.defaults
 *     charts:  { myChart: { type: 'bar', data: {...}, options: {...} } },
 *   }
 */
const RevealChartjs = () => ({
  id: 'chartjs',
  init: async function (reveal) {
    const { path = 'https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js',
            default: defaults = {},
            charts = {} } = reveal.getConfig().chartjs || {};

    const s = document.createElement('script');
    s.src = path;
    document.head.appendChild(s);
    await new Promise(res => s.onload = res);

    deepMerge(Chart.defaults, defaults);

    const root = reveal.getRevealElement();
    for (const [id, cfg] of Object.entries(charts)) {
      const canvas = root.querySelector(`#${CSS.escape(id)}`);
      if (!canvas) {
        console.warn(`[chartjs] no canvas found with id "${id}"`);
        continue;
      }
      new Chart(canvas, cfg);
    }
  }
});

/* Recursively merge plain-object properties of `src` into `dst`, mutating
 * `dst`. Arrays and non-object values overwrite. */
function deepMerge(dst, src) {
  for (const [k, v] of Object.entries(src)) {
    if (isPlainObject(v) && isPlainObject(dst[k])) deepMerge(dst[k], v);
    else dst[k] = v;
  }
  return dst;
}

const isPlainObject = (v) =>
  v != null && typeof v === 'object' && !Array.isArray(v);
