
function safeHead() { 
  return document.head || document.getElementsByTagName('head')[0] || document.documentElement; 
}

function applyFontsFromStorage() {
  chrome.storage.sync.get(['uiFont','codeFont', 'uiSize', 'codeSize', 'editorThemeColors'], (data) => {
    const head = safeHead();

    const {uiFont, codeFont, editorThemeColors} = data;

    const uSize = data.uiSize || 14;
    const cSize = data.codeSize || 14;
 
    const prev = document.getElementById('lc-font-changer-style');
    if (prev) prev.remove();

    if (!uiFont && !codeFont && !data.uiSize && !data.codeSize && !editorThemeColors) return;

  
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

    let cssRules = `
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

    if(editorThemeColors){
     const { bg, text, selection, useSmartFilter } = editorThemeColors;
      const safeText = text || '#eff1f6'; 
      const safeSel = selection || '#264f78';

      // if bg is light, we invert the code colors to make them dark/readable
      const syntaxFilter = useSmartFilter 
        ? 'invert(1) hue-rotate(180deg) brightness(0.75) contrast(1.2)' 
        : 'none';
      cssRules += `
        /* Backgrounds */
        .monaco-editor,
        .monaco-editor .monaco-editor-background,
        .monaco-editor .margin,
        .monaco-editor .inputarea {
          background-color: ${bg} !important;
        }

        /* 2. Text Transparency */
        .monaco-editor .view-lines,
        .monaco-editor .view-overlays {
          background-color: transparent !important;
        }

        
        .monaco-editor,
        .monaco-editor .mtk1 {
          color: ${safeText} !important;
        }

        
        .monaco-editor .view-lines span[class*="mtk"]:not(.mtk1) {
          filter: ${syntaxFilter} !important;
        }

       
        .monaco-editor .current-line {
          background-color: ${safeSel} !important;
          border: none !important;
        }
        .monaco-editor .margin-view-overlays .line-numbers {
           color: ${safeText} !important;
           opacity: 0.5;
        }
      `;
    }
    const style = document.createElement('style');
    style.id = 'lc-font-changer-style';
    style.textContent = cssRules;
    head.appendChild(style);
  });
}


applyFontsFromStorage();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && (changes.uiFont || changes.codeFont || changes.uiSize || changes.codeSize || changes.editorThemeColors)) {
    applyFontsFromStorage();
  }
});
