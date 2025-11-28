
const uiSelect = document.getElementById('uiChoice');
const codeSelect = document.getElementById('codeChoice');
const fontListEl = document.getElementById('fontList');
const searchInput = document.getElementById('search');
const applyBtn = document.getElementById('apply');
const resetBtn = document.getElementById('reset');
const loadingEl = document.getElementById('loading');

let allFonts = []; 
let renderedCount = 0;
const PAGE_SIZE = 100; 
const loadedFontLinks = new Set(); 


function gkey(name){ return name.replace(/\s+/g,'+'); }

async function getGoogleFonts() {
  try {
   
    const res = await fetch(chrome.runtime.getURL('fonts.json'));
    const json = await res.json();
    
    return json.map(f => f.family);
  } catch (e) {
    console.warn("Local JSON fetch failed,", e);
    return;
  }
}


function renderChunk(filter = '') {
  const fontsToRender = allFonts.filter(f =>
    f.toLowerCase().includes(filter.toLowerCase())
  );

  const slice = fontsToRender.slice(renderedCount, renderedCount + PAGE_SIZE);

  for (const name of slice) {
    const item = document.createElement('div');
    item.className = 'font-item row';

    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.alignItems = 'center';

   
    const nameEl = document.createElement('div');
    nameEl.className = 'font-name';
    nameEl.textContent = name;

   
    const actions = document.createElement('div');
    actions.className = 'font-actions';

    const btnUI = document.createElement('button');
    btnUI.textContent = 'Use UI';
    btnUI.className = 'secondary';
    btnUI.style.cssText = 'background:#e0e0e0;border:0;padding:6px;border-radius:6px;';

    const btnCode = document.createElement('button');
    btnCode.textContent = 'Use Code';
    btnCode.style.cssText = 'background:#0b69ff;color:white;border:0;padding:6px;border-radius:6px;';

   
    const ensureFontLoaded = async () => {
      const key = gkey(name);
      if (!loadedFontLinks.has(key)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${key}&display=swap`;
        link.setAttribute('data-font', key);
        document.head.appendChild(link);
        loadedFontLinks.add(key);
      }
      nameEl.style.fontFamily = `"${name}", sans-serif`;
    };

   
    ensureFontLoaded();


    nameEl.addEventListener('mouseenter', ensureFontLoaded);


    btnUI.addEventListener('click', () => {
      uiSelect.value = name;
    });

    btnCode.addEventListener('click', () => {
      codeSelect.value = name;
    });

    left.appendChild(nameEl);
    actions.appendChild(btnUI);
    actions.appendChild(btnCode);

    item.appendChild(left);
    item.appendChild(actions);
    fontListEl.appendChild(item);
  }

  renderedCount += slice.length;

  if (renderedCount >= fontsToRender.length) {
    loadingEl.textContent = `Showing ${fontsToRender.length} fonts.`;
  } else {
    loadingEl.textContent =
      `Showing ${renderedCount} / ${fontsToRender.length}. Scroll to load more…`;
  }
}



function refreshList(filter=''){
  fontListEl.innerHTML = '';
  renderedCount = 0;
  renderChunk(filter);
}


fontListEl.addEventListener('scroll', () => {
  if (fontListEl.scrollTop + fontListEl.clientHeight >= fontListEl.scrollHeight - 40) {
   
    const filter = searchInput.value.trim();
    renderChunk(filter);
  }
});


searchInput.addEventListener('input', (e) => {
  const q = e.target.value.trim();
  refreshList(q);
});



function injectFontsToTab(tabId, uiFont, codeFont){
  chrome.scripting.executeScript({
    target: { tabId },
    func: (uiFont, codeFont) => {
  
      const head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
      [uiFont, codeFont].filter(Boolean).forEach(fn => {
        const key = fn.replace(/\s+/g,'+');
        if (!document.querySelector(`link[data-font="${key}"]`)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${key}&display=swap`;
          link.setAttribute('data-font', key);
          head.appendChild(link);
        }
      });
     
      const prev = document.getElementById('lc-font-changer-style');
      if (prev) prev.remove();
   
      const style = document.createElement('style');
      style.id = 'lc-font-changer-style';
      style.textContent = `
        /* Global UI */
        * { font-family: "${uiFont || 'Inter'}", sans-serif !important; }
        /* Code editors and monospace areas */
        .monaco-editor *, .cm-editor *, code, pre { font-family: "${codeFont || 'JetBrains Mono'}", monospace !important; }
        /* Try to preserve icon fonts by not replacing them: */
        [class*="icon"], .codicon, [class^="icon-"], .anticon { font-family: inherit !important; }
      `;
      head.appendChild(style);
    },
    args: [uiFont, codeFont]
  });
}

(async function init(){

  loadingEl.textContent = 'Fetching Google Fonts metadata…';
  const g = await getGoogleFonts();

  allFonts = g;
  loadingEl.textContent = '';
  refreshList('');

  chrome.storage.sync.get(['uiFont','codeFont'], ({uiFont, codeFont}) => {
    if (uiFont) uiSelect.value = uiFont;
    if (codeFont) codeSelect.value = codeFont;
  });


})();


applyBtn.addEventListener('click', async () => {
  const uiFont = uiSelect.value;
  const codeFont = codeSelect.value;
  await chrome.storage.sync.set({uiFont, codeFont});
 
  chrome.tabs.query({active:true, currentWindow:true}, (tabs) => {
    if (!tabs[0]) return;
    injectFontsToTab(tabs[0].id, uiFont, codeFont);
  });
});

resetBtn.addEventListener('click', async () => {
  await chrome.storage.sync.remove(['uiFont','codeFont']);
  chrome.tabs.query({active:true,currentWindow:true}, (tabs) => {
    if (!tabs[0]) return;
    chrome.scripting.executeScript({
      target:{tabId:tabs[0].id},
      func: () => {
        const s = document.getElementById('lc-font-changer-style'); if (s) s.remove();
        document.querySelectorAll('link[data-font]').forEach(l=>l.remove());
      }
    });
  });
});
