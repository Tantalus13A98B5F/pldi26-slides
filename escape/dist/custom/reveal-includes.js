// Reveal plugin: resolves <element data-include="path"> by fetching the URL
// and inlining the HTML into the host element, preserving its attributes.
// Recurses so partials can themselves include partials. Reveal awaits the
// promise returned from init() before scanning slides, so includes complete
// before slide layout runs.
const RevealIncludes = () => {
  const expand = (root) => {
    const nodes = root.querySelectorAll('[data-include]');
    return Promise.all([...nodes].map(node => {
      const url = node.dataset.include;
      return fetch(url, { cache: 'no-cache' })
        .then(res => {
          if (!res.ok) throw new Error(`include failed: ${url} → ${res.status}`);
          return res.text();
        })
        .then(html => {
          node.innerHTML = html;
          node.removeAttribute('data-include');
          return expand(node);
        });
    }));
  };
  // <script> tags assigned via innerHTML never execute (the HTML spec flags
  // them "already started"). After all partials are inlined, re-create each
  // script element so it runs, in document order. Lets a slide carry its own
  // logic alongside its markup, e.g. a chart definition next to its canvas.
  const runScripts = (root) => {
    for (const old of root.querySelectorAll('script')) {
      const s = document.createElement('script');
      for (const { name, value } of old.attributes) s.setAttribute(name, value);
      s.textContent = old.textContent;
      old.replaceWith(s);
    }
  };
  return {
    id: 'includes',
    init: (reveal) => {
      const root = reveal.getRevealElement();
      return expand(root).then(() => runScripts(root));
    },
  };
};
