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
        link.href = theme === 'dark' 
            ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
            : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
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
                    code(token) {
                                        console.log('Mermaid renderer - token.lang:', token.lang, 'trimmed:', (token.lang || '').trim());
                                    if ((token.lang || '').trim() === 'mermaid') {
                            return `<pre class="mermaid">${token.text}</pre>`;                                                    }
                                        return false; // Use default renderer for non-mermaid blocks
                                }
                }
            });

// Fetch and render README.md
async function loadReadme() {
        const response = await fetch('https://raw.githubusercontent.com/g-h-0-S-t/JavaScript-Interview/main/README.md');
        const markdown = await response.text();
        
        // Configure marked options
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: true,
            mangle: false
        });

        
        // Parse markdown to HTML
        const html = marked.parse(markdown);
        document.getElementById('content').innerHTML = html;

        // Render Mermaid diagrams asynchronously after DOM update
        if (window.mermaid) {
            // Wait for next event loop tick to ensure DOM is fully updated
            setTimeout(async () => {
                        await mermaid.run();            
                        }, 100);
        }
        document.querySelectorAll('pre code').forEach((block) => {
                        // Skip mermaid diagrams - they should be rendered by mermaid.js, not highlighted
                        if (block.classList.contains('language-mermaid') || block.parentElement.classList.contains('mermaid')) {
                                            return;
                                        }
            hljs.highlightElement(block);
            addCopyButton(block.parentElement);
        });
        
        // Add smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        

// Add copy button to code blocks
function addCopyButton(pre) {
    const button = document.createElement('button');
    button.className = 'copy-button';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code to clipboard');
    
    pre.style.position = 'relative';
    pre.appendChild(button);
    
    pre.addEventListener('mouseenter', () => {
        button.style.opacity = '1';
    });
    
    pre.addEventListener('mouseleave', () => {
        button.style.opacity = '0';
    });
    
    button.addEventListener('click', async () => {
        const code = pre.querySelector('code');
        try {
            await navigator.clipboard.writeText(code.textContent);
            button.textContent = 'Copied!';
            button.style.background = 'var(--accent-color)';
            button.style.color = 'var(--bg-primary)';
            setTimeout(() => {
                button.textContent = 'Copy';
                button.style.background = 'var(--bg-tertiary)';
                button.style.color = 'var(--text-primary)';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            button.textContent = 'Failed';
            setTimeout(() => {
                button.textContent = 'Copy';
            }, 2000);
        }
    });
}

// Add keyboard shortcut for theme toggle (Ctrl+Shift+L)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        themeToggle.click();
    }
});

// Load README on page load
    }
loadReadme();

console.log('%cJavaScript Interview Guide', 'font-size: 20px; font-weight: bold; color: #58a6ff;');
console.log('%cTheme shortcut: Ctrl+Shift+L', 'font-size: 12px; color: #8b949e;');
console.log('%cCreated by g-h-0-S-t', 'font-size: 12px; color: #8b949e;');
