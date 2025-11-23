/* main app script for JS Interview Guide
   - safe marked renderer
   - highlight.js usage
   - mermaid rendering
   - search with highlight and scroll
   - copy code buttons
   - print / PDF
*/

/* ---------- README source (ONLY GitHub; no internal paths) ---------- */
const README_URL =
  'https://raw.githubusercontent.com/g-h-0-S-t/JavaScript-Interview/main/README.md';

const contentEl = document.getElementById('content');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const pdfBtn = document.getElementById('pdfBtn');
const themeToggle = document.getElementById('themeToggle');
const mdCssLink = document.getElementById('md-css');
const hljsCssLink = document.getElementById('hljs-css');

/* ---------- theme handling ---------- */
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  if (t === 'light') {
    mdCssLink.href =
      'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown-light.min.css';
    hljsCssLink.href =
      'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
  } else {
    mdCssLink.href =
      'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown-dark.min.css';
    hljsCssLink.href =
      'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';
  }
}

const savedTheme = localStorage.getItem('site-theme') || 'dark';
applyTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const next =
    document.documentElement.getAttribute('data-theme') === 'dark'
      ? 'light'
      : 'dark';
  localStorage.setItem('site-theme', next);
  applyTheme(next);
});

/* ---------- marked renderer ---------- */
marked.setOptions({ gfm: true, breaks: true });

function safeHighlight(code, lang) {
  const s = String(code || '');
  try {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(s, { language: lang }).value;
    }
    return hljs.highlightAuto(s).value;
  } catch (e) {
    return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }
}

const renderer = new marked.Renderer();

renderer.code = function (code, infostring) {
  const lang = (infostring || '').trim().toLowerCase();
  const text = String(code || '');

  if (lang === 'mermaid') {
    return `<div class="mermaid">${text}</div>`;
  }

  const highlighted = safeHighlight(text, lang);
  return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
};

renderer.codespan = t => `<code>${String(t)}</code>`;
renderer.text = t => String(t);
renderer.html = h => String(h);

marked.use({ renderer });

/* ---------- fetch markdown safely ---------- */
async function fetchReadme() {
  const res = await fetch(README_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error('Cannot load README.md');

  const txt = await res.text();

  // 👇 KEY FIX — ensure markdown is ALWAYS a string
  return typeof txt === 'string' ? txt : String(txt);
}

/* ---------- render markdown ---------- */
async function renderReadme() {
  try {
    const md = await fetchReadme();
    window.__FULL_MD__ = md;

    contentEl.innerHTML = marked.parse(md);

    requestAnimationFrame(() => {
      document.querySelectorAll('pre code').forEach(block => {
        try {
          hljs.highlightElement(block);
        } catch {}
      });
      attachCopyButtons();
    });

    requestAnimationFrame(() => {
      if (window.mermaid) {
        try {
          window.mermaid.initialize({
            startOnLoad: false,
            theme:
              document.documentElement.getAttribute('data-theme') === 'dark'
                ? 'dark'
                : 'default'
          });
          window.mermaid.init(undefined, document.querySelectorAll('.mermaid'));
        } catch (e) {
          console.warn('mermaid error', e);
        }
      }
    });
  } catch (e) {
    contentEl.innerHTML =
      '<p class="muted">Failed to load content. Try reloading the page.</p>';
  }
}

/* ---------- copy buttons ---------- */
function attachCopyButtons() {
  document.querySelectorAll('pre').forEach(pre => {
    if (pre.querySelector('.copy-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.type = 'button';

    btn.addEventListener('click', async () => {
      const codeEl = pre.querySelector('code');
      if (!codeEl) return;

      try {
        await navigator.clipboard.writeText(codeEl.innerText);
        btn.textContent = 'Copied!';
        setTimeout(() => (btn.textContent = 'Copy'), 1200);
      } catch {
        btn.textContent = 'Error';
        setTimeout(() => (btn.textContent = 'Copy'), 1200);
      }
    });

    pre.appendChild(btn);
  });
}

/* observer */
new MutationObserver(() => attachCopyButtons()).observe(contentEl, {
  childList: true,
  subtree: true
});

/* ---------- search & highlight ---------- */
function clearMarks(root) {
  root.querySelectorAll('mark.search-hit').forEach(m => {
    const p = m.parentNode;
    p.replaceChild(document.createTextNode(m.textContent), m);
    p.normalize();
  });
}

function highlightMatches(root, query) {
  if (!query) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let node;
  let firstHit = null;
  const qLower = query.toLowerCase();

  while ((node = walker.nextNode())) {
    const parent = node.parentNode;
    if (!parent || parent.closest('pre') || parent.closest('.mermaid')) continue;

    const text = node.nodeValue;
    const low = text.toLowerCase();
    let idx = low.indexOf(qLower);
    if (idx === -1) continue;

    const frag = document.createDocumentFragment();
    let last = 0;

    while (idx !== -1) {
      if (idx > last) frag.appendChild(document.createTextNode(text.slice(last, idx)));

      const mark = document.createElement('mark');
      mark.className = 'search-hit';
      mark.textContent = text.slice(idx, idx + query.length);
      frag.appendChild(mark);

      if (!firstHit) firstHit = mark;

      last = idx + query.length;
      idx = low.indexOf(qLower, last);
    }

    if (last < text.length)
      frag.appendChild(document.createTextNode(text.slice(last)));

    parent.replaceChild(frag, node);
  }

  if (firstHit) firstHit.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

let searchTimer = null;

searchInput.addEventListener('input', e => {
  const q = e.target.value.trim();
  clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    if (!window.__FULL_MD__) return;

    if (!q) {
      contentEl.innerHTML = marked.parse(window.__FULL_MD__);
      try {
        window.mermaid.init(undefined, contentEl.querySelectorAll('.mermaid'));
      } catch {}
      attachCopyButtons();
      return;
    }

    const blocks = window.__FULL_MD__
      .split(/\n{2,}/)
      .filter(b => b.toLowerCase().includes(q.toLowerCase()));

    const out = blocks.join('\n\n') || `> No results for "${q}"`;

    contentEl.innerHTML = marked.parse(out);

    try {
      window.mermaid.init(undefined, contentEl.querySelectorAll('.mermaid'));
    } catch {}

    attachCopyButtons();
    clearMarks(contentEl);
    highlightMatches(contentEl, q);
  }, 160);
});

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
  }
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchInput.dispatchEvent(new Event('input'));
});

/* ---------- PDF ---------- */
pdfBtn.addEventListener('click', () => window.print());

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  if (window.hljs) hljs.configure({ ignoreUnescapedHTML: true });
  renderReadme();
});

/* service worker */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch(e => console.warn('SW registration failed', e));
  });
}
