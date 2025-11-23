/* =========================================================
   Load README.md from GitHub
========================================================= */
const RAW_URL = "https://raw.githubusercontent.com/g-h-0-S-t/JavaScript-Interview/main/README.md";

const contentEl = document.getElementById("content");
const searchInput = document.getElementById("searchInput");
const themeToggle = document.getElementById("themeToggle");

/* =========================================================
   THEME TOGGLE
========================================================= */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}
applyTheme(localStorage.getItem("theme") || "dark");

themeToggle.onclick = () => {
  const newTheme = (localStorage.getItem("theme") === "dark" ? "light" : "dark");
  applyTheme(newTheme);
};

/* =========================================================
   FETCH RAW README
========================================================= */
async function loadReadme() {
  try {
    const res = await fetch(RAW_URL);
    const md = await res.text();

    const html = marked.parse(md, {
      breaks: true,
      gfm: true,
      async: false
    });

    contentEl.innerHTML = html;

    highlightAllCodeBlocks();
    enhanceMermaid();
    addCopyButtons();

  } catch (err) {
    contentEl.innerHTML = `<p style="color:red;">Failed to load README.md</p>`;
    console.error(err);
  }
}

loadReadme();

/* =========================================================
   HIGHLIGHT JS INITIALIZATION
========================================================= */
function highlightAllCodeBlocks() {
  document.querySelectorAll("pre code").forEach(block => {
    hljs.highlightElement(block);
  });
}

/* =========================================================
   COPY BUTTONS FOR CODE BLOCKS
========================================================= */
function addCopyButtons() {
  document.querySelectorAll("pre").forEach(pre => {
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.textContent = "Copy";

    btn.onclick = () => {
      const text = pre.querySelector("code").innerText;
      navigator.clipboard.writeText(text);
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = "Copy"), 1200);
    };

    pre.appendChild(btn);
  });
}

/* =========================================================
   MERMAID DIAGRAMS
========================================================= */
function enhanceMermaid() {
  // Scans for code blocks with "mermaid"
  const mermaidBlocks = document.querySelectorAll("pre code.language-mermaid");

  mermaidBlocks.forEach((block, idx) => {
    const parent = block.parentElement;
    const code = block.innerText;

    // Replace <pre><code> with <div class="mermaid">
    const div = document.createElement("div");
    div.className = "mermaid";
    div.textContent = code;

    parent.replaceWith(div);
  });

  // Initialize Mermaid (async)
  if (typeof mermaid !== "undefined") {
    mermaid.initialize({ startOnLoad: false, theme: "default" });
    mermaid.run();
  }
}

/* =========================================================
   SEARCH + HIGHLIGHT
========================================================= */
searchInput.addEventListener("input", () => {
  const term = searchInput.value.trim();

  // Clear previous highlights
  clearHighlights(contentEl);

  if (!term) return;

  highlightTerm(contentEl, term);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    searchInput.value = "";
    clearHighlights(contentEl);
  }
});

function highlightTerm(root, term) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  let node;
  while ((node = walker.nextNode())) {
    const val = node.nodeValue;
    const idx = val.toLowerCase().indexOf(term.toLowerCase());
    if (idx !== -1) {
      const mark = document.createElement("mark");
      mark.className = "search-hit";
      mark.textContent = val.substr(idx, term.length);

      const before = document.createTextNode(val.substr(0, idx));
      const after = document.createTextNode(val.substr(idx + term.length));

      const parent = node.parentNode;
      parent.replaceChild(after, node);
      parent.insertBefore(mark, after);
      parent.insertBefore(before, mark);
    }
  }
}

function clearHighlights(root) {
  root.querySelectorAll("mark.search-hit").forEach(mark => {
    mark.replaceWith(document.createTextNode(mark.textContent));
  });
}
