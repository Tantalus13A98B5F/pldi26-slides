/*
Language: Scala
Category: functional
Author: Jan Berkel <jan.berkel@gmail.com>
Contributors: Erik Osheim <d_m@plastic-idolatry.com>
Website: https://www.scala-lang.org
*/

function rtLangDef(hljs) {
  const regex = hljs.regex;
  const ANNOTATION = {
    className: 'meta',
    begin: '@[A-Za-z]+'
  };

  // used in strings for escaping/interpolation/substitution
  const SUBST = {
    className: 'subst',
    variants: [
      { begin: '\\$[A-Za-z0-9_]+' },
      {
        begin: /\$\{/,
        end: /\}/
      }
    ]
  };

  const STRING = {
    className: 'string',
    variants: [
      {
        begin: '"""',
        end: '"""'
      },
      {
        begin: '"',
        end: '"',
        illegal: '\\n',
        contains: [ hljs.BACKSLASH_ESCAPE ]
      },
      {
        begin: '[a-z]+"',
        end: '"',
        illegal: '\\n',
        contains: [
          hljs.BACKSLASH_ESCAPE,
          SUBST
        ]
      },
      {
        className: 'string',
        begin: '[a-z]+"""',
        end: '"""',
        contains: [ SUBST ],
        relevance: 10
      }
    ]

  };

  const TYPE = {
    className: 'type',
    begin: '\\b[A-Z][A-Za-z0-9_]*',
    relevance: 0
  };

  const NAME = {
    className: 'title',
    begin: /[^0-9\n\t "'(),.`{}\[\]:;][^\n\t "'(),.`{}\[\]:;]+|[^0-9\n\t "'(),.`{}\[\]:;=]/,
    relevance: 0
  };

  const CLASS = {
    className: 'class',
    beginKeywords: 'class object trait type',
    end: /[:={\[\n;]/,
    excludeEnd: true,
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      {
        beginKeywords: 'extends with',
        relevance: 10
      },
      {
        begin: /\[/,
        end: /\]/,
        excludeBegin: true,
        excludeEnd: true,
        relevance: 0,
        contains: [ 
          TYPE, 
          hljs.C_LINE_COMMENT_MODE, 
          hljs.C_BLOCK_COMMENT_MODE, 
        ]
      },
      {
        className: 'params',
        begin: /\(/,
        end: /\)/,
        excludeBegin: true,
        excludeEnd: true,
        relevance: 0,
        contains: [ 
          TYPE, 
          hljs.C_LINE_COMMENT_MODE, 
          hljs.C_BLOCK_COMMENT_MODE, 
        ]
      },
      NAME
    ]
  };

  const METHOD = {
    className: 'function',
    beginKeywords: 'def',
    end: regex.lookahead(/[:={\[(\n;]/),
    contains: [ NAME ]
  };

  const EXTENSION = {
    begin: [
      /^\s*/, // Is first token on the line
      'extension',
      /\s+(?=[[(])/, // followed by at least one space and `[` or `(`
    ],
    beginScope: { 2: "keyword", }
  };

  const END = {
    begin: [
      /^\s*/, // Is first token on the line
      /end/,
      /\s+/,
      /(extension\b)?/, // `extension` is the only marker that follows an `end` that cannot be captured by another rule.
    ],
    beginScope: {
      2: "keyword",
      4: "keyword",
    }
  };

  // TODO: use negative look-behind in future
  //       /(?<!\.)\binline(?=\s)/
  const INLINE_MODES = [
    { match: /\.inline\b/ },
    {
      begin: /\binline(?=\s)/,
      keywords: 'inline'
    }
  ];

  const USING_PARAM_CLAUSE = {
    begin: [
      /\(\s*/, // Opening `(` of a parameter or argument list
      /using/,
      /\s+(?!\))/, // Spaces not followed by `)`
    ],
    beginScope: { 2: "keyword", }
  };

  // glob all non-whitespace characters as a "string"
  // sourced from https://github.com/scala/docs.scala-lang/pull/2845
  const DIRECTIVE_VALUE = {
    className: 'string',
    begin: /\S+/,
  };

  // directives
  // sourced from https://github.com/scala/docs.scala-lang/pull/2845
  const USING_DIRECTIVE = {
    begin: [
      '//>',
      /\s+/,
      /using/,
      /\s+/,
      /\S+/
    ],
    beginScope: {
      1: "comment",
      3: "keyword",
      5: "type"
    },
    end: /$/,
    contains: [
      DIRECTIVE_VALUE,
    ]
  };

  return {
    name: 'Reachability',
    keywords: {
      literal: 'true false null',
      keyword: 'type yield lazy override def with val var sealed abstract private trait object if then forSome for while do throw finally protected extends import final return else break new catch super class case package default try this match continue throws implicit export enum given transparent let ref fun'
    },
    contains: [
      USING_DIRECTIVE,
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      STRING,
      TYPE,
      METHOD,
      CLASS,
      hljs.C_NUMBER_MODE,
      EXTENSION,
      END,
      ...INLINE_MODES,
      USING_PARAM_CLAUSE,
      ANNOTATION
    ]
  };
}


// Generic highlight.js plugin: for each pattern, capture matching text
// before tokenization, leave an identifier-shaped placeholder, then after
// highlighting replace the placeholder with a custom DOM node.
// Workaround for https://github.com/highlightjs/highlight.js/issues/2889
//
// patterns: [entry, ...], where entry is either
//   { regex, languages?, apply }
//     regex     — RegExp. If it has a capture group, group 1 is the captured
//                 text; otherwise the whole match is captured.
//     languages — string | string[]. Omit for no restriction.
//     apply     — (captured: string) => Node. Produces the replacement node.
//   { translations: { from: to, ... }, languages? }
//     Sugar for a block of plain string→string substitutions. Expanded in
//     place into one spec per key, preserving the slot's nesting position.
function createHighlightAnnotationPlugin(patterns) {
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expanded = patterns.flatMap(p => {
    if (p.translations) {
      return Object.entries(p.translations).map(([from, to]) => ({
        regex: new RegExp(escapeRe(from), 'g'),
        languages: p.languages,
        apply: () => document.createTextNode(to)
      }));
    }
    return [p];
  });
  const specs = expanded.map((p, i) => {
    const langs = p.languages == null ? null
      : Array.isArray(p.languages) ? p.languages : [p.languages];
    const flags = p.regex.flags.includes('g') ? p.regex.flags : p.regex.flags + 'g';
    return {
      regex: new RegExp(p.regex.source, flags),
      languages: langs,
      apply: p.apply,
      // Identifier-shaped so highlighters don't split it across nodes.
      token: `__hljsAnn${i}__`,
      captures: []
    };
  });

  const activeFor = (language) =>
    specs.filter(s => s.languages == null || s.languages.includes(language));

  return {
    // Patterns are applied in list order. To support nesting, list innermost
    // patterns first: their matches become placeholder tokens, and outer
    // patterns' regexes then match strings that contain those tokens. The
    // after-hook's walk(repl) recursion renders the nested structure.
    // One-direction only: a pattern listed later cannot appear inside a
    // listed-earlier pattern's capture.
    "before:highlightElement": ({ el, language }) => {
      const active = activeFor(language);
      active.forEach(s => { s.captures = []; });

      active.forEach(spec => {
        const walk = (node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.nodeValue;
            spec.regex.lastIndex = 0;
            const parts = [];
            let last = 0, m;
            while ((m = spec.regex.exec(text)) !== null) {
              parts.push(text.slice(last, m.index));
              parts.push(spec.token);
              spec.captures.push(m[1] ?? m[0]);
              last = spec.regex.lastIndex;
            }
            if (parts.length > 0) {
              parts.push(text.slice(last));
              // Rewrite in place rather than splitting into multiple text
              // nodes — later pattern passes must see the concatenated text
              // (including this pass's placeholder tokens) as one string, so
              // their regexes can match across what we just substituted.
              node.nodeValue = parts.join('');
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            Array.from(node.childNodes).forEach(walk);
          }
        };
        walk(el);
      });
    },

    "after:highlightElement": ({ el }) => {
      if (specs.length === 0) return;
      const counters = new Map(specs.map(s => [s, 0]));
      const tokenToSpec = new Map(specs.map(s => [s.token, s]));
      const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const tokenRe = new RegExp(specs.map(s => escapeRe(s.token)).join('|'), 'g');

      const walk = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.nodeValue;
          // Materialize matches eagerly: tokenRe is shared, and walk(repl)
          // below reuses it. Iterating via exec/while would have its
          // lastIndex clobbered by the recursion and loop forever.
          const matches = [...text.matchAll(tokenRe)];
          if (matches.length === 0) return;
          const frag = document.createDocumentFragment();
          let last = 0;
          for (const m of matches) {
            if (m.index > last)
              frag.appendChild(document.createTextNode(text.slice(last, m.index)));
            const spec = tokenToSpec.get(m[0]);
            const i = counters.get(spec);
            counters.set(spec, i + 1);
            const repl = spec.apply(spec.captures[i]);
            // Outer captures may contain placeholder tokens for patterns
            // listed before this one (the nesting order); descend into the
            // freshly-built replacement so those get resolved too.
            walk(repl);
            frag.appendChild(repl);
            last = m.index + m[0].length;
          }
          if (last < text.length)
            frag.appendChild(document.createTextNode(text.slice(last)));
          node.parentNode.replaceChild(frag, node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // Snapshot childNodes — the NodeList is live and our text-node
          // branch mutates children via replaceChild.
          Array.from(node.childNodes).forEach(walk);
        }
      };
      walk(el);
    }
  };
}


// Math helpers paired with MathJax. captureMathSpan produces a placeholder
// span for $tex$ during code-annotation; typesetCollectedMath is wired to
// MathJax's startup.pageReady and drains the queue once MathJax is ready.
const { captureMathSpan, typesetCollectedMath } = (() => {
  const pendingMathSpans = [];
  return {
    captureMathSpan: (tex) => {
      const span = document.createElement('span');
      span.textContent = '\\( \\tt ' + tex + '\\)';
      pendingMathSpans.push(span);
      return span;
    },
    typesetCollectedMath: () =>
      MathJax.startup.defaultPageReady().then(() =>
        MathJax.typesetPromise(pendingMathSpans)
      ),
  };
})();

const makeColorSpan = (color) => (text) => {
  const span = document.createElement('span');
  span.style.color = color;
  span.textContent = text;
  return span;
};

const makeSup = (text) => {
  const sup = document.createElement('sup');
  sup.textContent = text;
  return sup;
};

// Re-highlights free-standing code blocks matching `selector` that Reveal's
// highlight plugin skips. Call after Reveal.initialize resolves.
function highlightExtras(selector) {
  const highlight = Reveal.getPlugin('highlight');
  const extras = Reveal.getRevealElement().querySelectorAll(selector);
  extras.forEach(block => highlight.highlightBlock(block));
}