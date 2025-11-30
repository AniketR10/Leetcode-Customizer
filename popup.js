
const uiSelect = document.getElementById('uiChoice');
const codeSelect = document.getElementById('codeChoice');
const fontListEl = document.getElementById('fontList');
const searchInput = document.getElementById('search');
const applyBtn = document.getElementById('apply');
const resetBtn = document.getElementById('reset');
const loadingEl = document.getElementById('loading');
const uiSizeRange = document.getElementById('uiSizeRange');
const uiSizeInput = document.getElementById('uiSizeInput');
const codeSizeRange = document.getElementById('codeSizeRange');
const codeSizeInput = document.getElementById('codeSizeInput');
const bgColorPicker = document.getElementById('bgColorPicker');

let allFonts = []; 
let renderedCount = 0;
const PAGE_SIZE = 100; 
const loadedFontLinks = new Set();
let saveTimeOut = null;


function gkey(name){ 
  if(!name) return '';
  return name.replace(/\s+/g,'+');
}

function linkInputs(range, number){
  range.addEventListener('input', () => {number.value = range.value});
  number.addEventListener('input', () => {range.value = number.value});
}

linkInputs(uiSizeRange, uiSizeInput);
linkInputs(codeSizeRange, codeSizeInput);

bgColorPicker.addEventListener('input', () => {
  const bgColor = bgColorPicker.value;

  if(saveTimeOut){
    clearTimeout(saveTimeOut);
  }

  saveTimeOut = setTimeout(() => {
    chrome.storage.sync.set({editorBgColor: bgColor});
  }, 100);
})


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
    left.className = 'font-name-wrapper';

   
    const nameEl = document.createElement('div');
    nameEl.className = 'font-name';
    nameEl.textContent = name;

   
    const actions = document.createElement('div');
    actions.className = 'font-actions';

    const btnUI = document.createElement('button');
    btnUI.textContent = 'UI font';
    btnUI.className = 'secondary';
    btnUI.style.cssText = 'background:#3a3a3a;color:#1a90ff;border:0;padding:4px;margin-right:6px;border-radius:6px;';

    const btnCode = document.createElement('button');
    btnCode.textContent = 'Code';
    btnCode.style.cssText = 'background:#3a3a3a;color:#1a90ff;border:0;padding:4px;border-radius:6px;';

   
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


(async function init(){

  loadingEl.textContent = 'Loading resources…';
  const g = await getGoogleFonts();
  allFonts = g;

  loadingEl.textContent = '';
  refreshList('');


  chrome.storage.sync.get(['uiFont','codeFont', 'uiSize', 'codeSize', 'editorBgColor'], (data) => {
    if (data.uiFont) uiSelect.value = data.uiFont;
    if (data.codeFont) codeSelect.value = data.codeFont;

    const uSize = data.uiSize || 14;
    const cSize = data.codeSize || 14;

    uiSizeRange.value = uSize;
    uiSizeInput.value = uSize;
    codeSizeRange.value = cSize;
    codeSizeInput.value = cSize;

    if(data.editorBgColor){
      bgColorPicker.value = data.editorBgColor;
    } 
    else {
      bgColorPicker.value = '';
    }
  });
})();


applyBtn.addEventListener('click', async () => {


  const uiFont = uiSelect.value;
  const codeFont = codeSelect.value;
  const uiSize = uiSizeInput.value;
  const codeSize = codeSizeInput.value;

  await chrome.storage.sync.set({uiFont, codeFont, uiSize, codeSize});
 
});

resetBtn.addEventListener('click', async () => {
  await chrome.storage.sync.remove(['uiFont','codeFont', 'uiSize', 'codeSize', 'editorBgColor']);

  uiSelect.value = '';
  codeSelect.value = '';

  uiSizeInput.value = 14;
  uiSizeRange.value = 14;
  codeSizeInput.value = 14;
  codeSizeRange.value = 14;
  bgColorPicker.value = '';
  
});
