
function safeHead() { 
  return document.head || document.getElementsByTagName('head')[0] || document.documentElement; 
}

function applyFontsFromStorage() {
  chrome.storage.sync.get(['uiFont','codeFont'], ({ uiFont, codeFont }) => {
    const head = safeHead();

 
    const prev = document.getElementById('lc-font-changer-style');
    if (prev) prev.remove();

    if (!uiFont && !codeFont) return;

  
    [uiFont, codeFont]
      .filter(fn => fn && fn.trim()) 
      .forEach(fn => {
        const key = fn.replace(/\s+/g, '+'); 
        
        if (!document.querySelector(`link[data-font="${key}"]`)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${key}&display=swap`; 
          link.setAttribute('data-font', key);
          head.appendChild(link);
        }
      });

    const style = document.createElement('style');
    style.id = 'lc-font-changer-style';
    style.textContent = `
      * { font-family: "${uiFont || 'Inter'}", sans-serif !important; }
      .monaco-editor *, .cm-editor *, code, pre {
        font-family: "${codeFont || 'JetBrains Mono'}", monospace !important;
      }
      [class*="icon"], .codicon, [class^="icon-"], .anticon {
        font-family: inherit !important;
      }
    `;
    head.appendChild(style);
  });
}


applyFontsFromStorage();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && (changes.uiFont || changes.codeFont)) {
    applyFontsFromStorage();
  }
});
