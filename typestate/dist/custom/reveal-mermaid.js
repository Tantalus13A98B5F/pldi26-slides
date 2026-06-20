/* Reveal.js plugin: manually render mermaid diagrams.
 * Loads mermaid + ELK as ESM via a dynamically-injected module script,
 * using config.mermaid.path / .elkPath (defaults to jsdelivr CDN). The
 * .esm.min.mjs builds rewrite internal imports to relative CDN URLs, so
 * mermaid and ELK share a single module instance without an import map. */
const RevealMermaid = () => ({
  id: 'mermaid',
  init: async function (reveal) {
    const config = reveal.getConfig().mermaid || {};
    const {
      path = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs',
      elkPath = 'https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk@0/dist/mermaid-layout-elk.esm.min.mjs',
      ...mermaidConfig
    } = config;

    const resolve = p => new URL(p, document.baseURI).href;
    const ready = new Promise((res, rej) => {
      window.__revealMermaidReady = res;
      window.__revealMermaidFail = rej;
    });
    const loader = document.createElement('script');
    loader.type = 'module';
    loader.textContent = `
      try {
        const mermaid = (await import('${resolve(path)}')).default;
        const elk = (await import('${resolve(elkPath)}')).default;
        mermaid.registerLayoutLoaders(elk);
        window.mermaid = mermaid;
        window.__revealMermaidReady();
      } catch (e) {
        console.error('[reveal-mermaid] load failed', e);
        window.__revealMermaidFail(e);
      }
    `;
    document.head.appendChild(loader);
    await ready;

    mermaid.initialize({ startOnLoad: false, ...mermaidConfig });

    const nodes = reveal.getRevealElement().querySelectorAll('.my-mermaid');
    let i = 0;
    for (const node of nodes) {
      const { svg, bindFunctions } = await mermaid.render(`mermaid-svg-${i++}`, node.textContent.trim());
      node.innerHTML = svg;
      const el = node.querySelector('svg');
      el.removeAttribute('width');
      el.removeAttribute('height');
      el.style.maxWidth = 'none';
      el.style.width = '100%';
      el.style.height = '100%';
      bindFunctions?.(node);
    }
  }
});
