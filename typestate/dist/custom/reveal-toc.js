// Reveal plugin: clones a single source <ul id="toc"> into every
// <div class="toc"> placeholder. If the placeholder has data-focus="X",
// the matching <li data-id="X"> gets a .focus class and the cloned <ul>
// gets .has-focus (CSS dims the rest). The placeholder's original inner
// content is moved into the focused <li> as per-section detail.
//
// Runs after RevealIncludes (needs the included DOM) and before
// RevealHighlight / RevealMath.MathJax4 (so cloned annotated/math content
// gets typeset).
const RevealToc = () => ({
  id: 'toc',
  init: (reveal) => {
    const root = reveal.getRevealElement();
    const sources = root.querySelectorAll('ul#toc');
    if (sources.length === 0) return;
    if (sources.length > 1) console.warn(`RevealToc: found ${sources.length} <ul id="toc">, using first`);
    const source = sources[0];

    root.querySelectorAll('div.toc').forEach(placeholder => {
      const clone = source.cloneNode(true);
      clone.removeAttribute('id');

      const focus = placeholder.dataset.focus;
      const detail = [...placeholder.childNodes];

      if (focus) {
        const target = clone.querySelector(`li[data-id="${focus}"]`);
        if (target) {
          target.classList.add('focus');
          clone.classList.add('has-focus');
          detail.forEach(n => target.appendChild(n));
        } else {
          console.warn(`RevealToc: data-focus="${focus}" matches no <li data-id> in #toc; dropping detail`);
        }
      } else if (detail.some(n => n.nodeType !== Node.TEXT_NODE || n.nodeValue.trim() !== '')) {
        console.warn('RevealToc: <div class="toc"> has detail content but no data-focus; dropping');
      }

      placeholder.replaceChildren(clone);
    });
  },
});
