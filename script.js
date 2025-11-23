// Theme Toggle Functionality
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Check for saved theme preference or default to 'dark'
const currentTheme = localStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', currentTheme);

// Update highlight.js theme based on current theme
function updateHighlightTheme(theme) {
    const link = document.querySelector('link[href*="highlight.js"]');
    if (link) {
        link.href = theme === 'dark' ?
            'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css' :
            'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
    }
}

updateHighlightTheme(currentTheme);

themeToggle.addEventListener('click', () => {
    const theme = html.getAttribute('data-theme');
    const newTheme = theme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateHighlightTheme(newTheme);

    // Add animation effect
    themeToggle.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        themeToggle.style.transform = 'rotate(0deg)';
    }, 300);
});

// Configure marked.js custom renderer for Mermaid diagrams (global scope)
marked.use({
    renderer: {
        code(code, infostring) {
            const lang = (infostring || '').trim().toLowerCase();
            if (lang === 'mermaid') {
                return `<div class="mermaid">${code}</div>`;
            }
            return `<pre><code class="language-${lang}">${code}</code></pre>`;
        }
    }
});

// Fetch and render README.md
async function loadReadme() {
    const cacheKey = 'readme-cache-v1';
    let markdown = localStorage.getItem(cacheKey);

    if (!markdown) {
        const response = await fetch('https://raw.githubusercontent.com/g-h-0-S-t/JavaScript-Interview/main/README.md');
        markdown = await response.text();
        localStorage.setItem(cacheKey, markdown);
    }

    marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: true,
        mangle: false
    });

    // Parse Markdown → HTML
    const htmlOutput = marked.parse(markdown);
    const content = document.getElementById('content');
    content.innerHTML = htmlOutput;

    // Render Mermaid after DOM update
    requestAnimationFrame(() => {
        if (window.mermaid) {
            window.mermaid.run({ querySelector: '.mermaid' });
        }

        // Deferred highlighting (fast!)
        queueMicrotask(() => {
            document.querySelectorAll('pre code').forEach((block) => {
                if (block.classList.contains('language-mermaid')) return;
                if (!block.dataset.highlighted) {
                    hljs.highlightElement(block);
                    block.dataset.highlighted = 'true';
                }
                addCopyButton(block.parentElement);
            });
        });
    });
}

// Add "Copy" button to all code blocks
function addCopyButton(preElement) {
    if (preElement.dataset.copied) return; // Prevent duplicate buttons
    preElement.dataset.copied = "true";

    const button = document.createElement("button");
    button.className = "copy-button";
    button.textContent = "Copy";

    button.addEventListener("click", async () => {
        const code = preElement.querySelector("code").innerText;

        try {
            await navigator.clipboard.writeText(code);
            button.textContent = "Copied!";
            button.style.background = "var(--accent-color)";
            button.style.color = "var(--bg-primary)";

            setTimeout(() => {
                button.textContent = "Copy";
                button.removeAttribute("style");
            }, 1200);
        } catch (err) {
            button.textContent = "Error";
            setTimeout(() => (button.textContent = "Copy"), 1200);
        }
    });

    preElement.appendChild(button);
}

// Show copy buttons on hover (desktop)
document.addEventListener("mouseover", (e) => {
    const pre = e.target.closest("pre");
    if (pre) {
        const btn = pre.querySelector(".copy-button");
        if (btn) btn.style.opacity = 1;
    }
});

// Hide copy buttons when not hovered (desktop)
document.addEventListener("mouseout", (e) => {
    const pre = e.target.closest("pre");
    if (pre) {
        const btn = pre.querySelector(".copy-button");
        if (btn && window.innerWidth > 768) btn.style.opacity = 0;
    }
});

loadReadme();

console.log('%cJavaScript Interview Guide', 'font-size: 20px; font-weight: bold; color: #58a6ff;');
console.log('%cTheme shortcut: Ctrl+Shift+L', 'font-size: 12px; color: #8b949e;');
console.log('%cCreated by g-h-0-S-t', 'font-size: 12px; color: #8b949e;');
