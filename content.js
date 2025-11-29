
function safeHead() { 
  return document.head || document.getElementsByTagName('head')[0] || document.documentElement; 
}

function applyFontsFromStorage() {
  chrome.storage.sync.get(['uiFont','codeFont', 'uiSize', 'codeSize'], (data) => {
    const head = safeHead();

    const {uiFont, codeFont} = data;

    const uSize = data.uiSize || 14;
    const cSize = data.codeSize || 14;
 
    const prev = document.getElementById('lc-font-changer-style');
    if (prev) prev.remove();

    if (!uiFont && !codeFont && !data.uiSize && !data.codeSize) return;

  
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
      /* UI font & size */
      body { font-size: ${uSize}px !important; }
      * { font-family: "${uiFont || 'Inter'}", sans-serif !important; }
      
      /* Code font & Size */
      .monaco-editor *, .cm-editor *, code, pre {
        font-family: "${codeFont || 'JetBrains Mono'}", monospace !important;
        font-size: ${cSize}px !important;
      }
      
      /* Preserve icons */
      [class*="icon"], .codicon, [class^="icon-"], .anticon {
        font-family: inherit !important;
      }
    `;
    head.appendChild(style);
  });
}


applyFontsFromStorage();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && (changes.uiFont || changes.codeFont || changes.uiSize || changes.codeSize)) {
    applyFontsFromStorage();
  }
});
