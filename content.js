
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
      const {bg, text, selection} = editorThemeColors;
      cssRules += `
        /* 1. FORCE BACKGROUND on all main editor containers */
        .monaco-editor,
        .monaco-editor .monaco-editor-background,
        .monaco-editor .margin,
        .monaco-editor .inputarea {
          background-color: ${bg} !important;
        }

        /* 2. MAKE TEXT LAYERS TRANSPARENT (So background shows through) */
        .monaco-editor .view-lines,
        .monaco-editor .view-overlays,
        .monaco-editor .lines-content {
          background-color: transparent !important;
        }

        /* 3. Text Color (Global fallback) */
        .monaco-editor,
        .monaco-editor .mtk1,
        .monaco-editor .view-lines {
          color: ${text} !important;
        }

        /* 4. Selection & Current Line */
        .monaco-editor .current-line {
          background-color: ${selection} !important;
          border: none !important;
        }
        
        /* 5. Gutter (Line Numbers) Text Color */
        .monaco-editor .margin-view-overlays .line-numbers {
           color: ${text} !important;
           opacity: 0.5; /* Dim it slightly */
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
