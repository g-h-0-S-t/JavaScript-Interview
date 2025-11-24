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
  enhanceMermaid(); // Re-render Mermaid diagrams with new theme
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
    mermaid.initialize({ startOnLoad: false, theme: "base" });
    mermaid.run();
  }
}

/* =========================================================
   SEARCH + HIGHLIGHT
========================================================= */

// Clear all highlighted text
function clearHighlights(el) {
  el.querySelectorAll('mark.search-hit').forEach(mark => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
  });
  el.normalize();
}

// Highlight search term in element
function highlightTerm(el, term) {
  if (!term) return;
  // Escape special regex characters
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedTerm})`, 'gi');
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
  const nodesToReplace = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement.tagName !== 'MARK' && node.nodeValue.match(regex)) {
      nodesToReplace.push(node);
    }
  }

  nodesToReplace.forEach(node => {
    const fragment = document.createDocumentFragment();
    const parts = node.nodeValue.split(regex);
    parts.forEach((part, i) => {
      if (i % 2 === 0) {
        fragment.appendChild(document.createTextNode(part));
      } else {
        const mark = document.createElement('mark');
        mark.className = 'search-hit';
        mark.textContent = part;
        fragment.appendChild(mark);
      }
    });
    node.parentNode.replaceChild(fragment, node);
  });
}


// State for search cycling
let currentMatchIndex = 0;
let matchElements = [];
searchInput.addEventListener("input", () => {
  const term = searchInput.value.trim();

  // Clear previous highlights
  clearHighlights(contentEl);

  if (!term) return;

  highlightTerm(contentEl, term);

  // Reset state
  currentMatchIndex = 0;
  matchElements = [];

  // Collect all matches
  matchElements = Array.from(contentEl.querySelectorAll('mark.search-hit'));

  // Highlight first match as active
  if (matchElements.length > 0) {
    matchElements[0].classList.add('active');
    matchElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

// Handle Enter key to cycle through matches
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && matchElements.length > 0) {
    e.preventDefault();

    // Remove active class from current match
    matchElements[currentMatchIndex].classList.remove('active');

    // Move to next match (wrap around at end)
    currentMatchIndex = (currentMatchIndex + 1) % matchElements.length;

    // Add active class to new current match
    matchElements[currentMatchIndex].classList.add('active');

    // Scroll to the new match
    matchElements[currentMatchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});
