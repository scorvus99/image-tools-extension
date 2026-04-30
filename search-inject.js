(function() {
  'use strict';

  function uploadImage(imageData, siteName) {
    const start = () => {
      switch(siteName) {
        case 'Pimeyes':
          tryUpload(() => uploadViaFileInput(imageData, 'Pimeyes'), 20);
          break;
        case 'Wildberries':
          uploadToWildberries(imageData, 0, 25);
          break;
        case 'FaceCheck':
        case 'Lenso':
          tryUpload(() => uploadViaFileInput(imageData, siteName), 20);
          break;
        case 'Google OCR':
          tryUpload(() => uploadToGoogle(imageData), 30);
          break;
        case 'AliExpress':
          uploadToAliexpress(imageData);
          break;
        default:
          tryUpload(() => uploadViaPaste(imageData, siteName, getSelectors(siteName)), 20);
      }
    };

    if (document.readyState === 'complete') setTimeout(start, 1000);
    else window.addEventListener('load', () => setTimeout(start, 1000));
  }

  function tryUpload(fn, max) {
    let n = 0;
    const t = () => { if (!fn() && ++n < max) setTimeout(t, 800); };
    t();
  }

  function uploadViaFileInput(imageData, siteName) {
    const input = document.querySelector('input[type="file"]:not(.hide)');
    if (input && input.offsetParent !== null) {
      setFile(input, imageData, siteName);
      return true;
    }
    const btn = document.querySelector('button, [role="button"], .upload-button, label[for]');
    if (btn) { 
      btn.dispatchEvent(new Event('click', { bubbles: true }));
      setTimeout(() => {
        const inp = document.querySelector('input[type="file"]:not(.hide)');
        if (inp) setFile(inp, imageData, siteName);
      }, 500); 
      return true; 
    }
    return false;
  }

  function uploadToWildberries(imageData, r, max) {
    const allInputs = document.querySelectorAll('input[type="file"]');
    for (const inp of allInputs) {
      if (inp.offsetParent !== null && !inp.classList.contains('hide')) {
        setFile(inp, imageData, 'Wildberries');
        return;
      }
    }

    const popUpInput = document.querySelector('#popUpFileInput');
    if (popUpInput) {
      setFile(popUpInput, imageData, 'Wildberries');
      return;
    }

    if (r === 0) {
      const selectors = [
        '#searchByImageFormAbOld',
        '#searchByImageFormAbNew',
        '#searchByImageContainer label',
        '#searchByImageContainer .mo-icon',
        '#searchByImageContainer svg',
        '#searchByImageContainer'
      ];
      
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el.offsetParent !== null && !el.classList.contains('hide')) {
          el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          break;
        }
      }
      
      setTimeout(() => uploadToWildberries(imageData, 1, max), 1000);
      return;
    }

    if (r < max) {
      setTimeout(() => uploadToWildberries(imageData, r + 1, max), 500);
    } else {
      const inputs = document.querySelectorAll('input[type="file"]');
      for (const inp of inputs) {
        setFile(inp, imageData, 'Wildberries');
      }
    }
  }

  function uploadToGoogle(imageData) {
    const imgInput = document.querySelector('input[type="file"][accept*="image"]');
    if (imgInput) { setFile(imgInput, imageData, 'Google OCR'); return true; }

    const fileInput = document.querySelector('input[type="file"]:not(.hide)');
    if (fileInput && fileInput.offsetParent !== null) {
      setFile(fileInput, imageData, 'Google OCR'); return true;
    }

    const dropzone = document.querySelector('[class*="drop"], [class*="upload"], .DVHcue');
    if (dropzone) { dropFile(dropzone, imageData, 'Google OCR'); return true; }

    if (document.body) { pasteToElement(document.body, imageData, 'Google OCR'); return true; }
    return false;
  }

  function uploadToAliexpress(imageData) {
    let attempts = 0;
    const maxAttempts = 30;

    const tryFindAndUpload = () => {
      attempts++;
      
      // 1. Ищем кнопку камеры в строке поиска и кликаем
      const searchBtn = document.querySelector('[class*="SearchByImage"], [class*="image-search"], [class*="camera"]');
      if (searchBtn && attempts <= 3) {
        console.log('AliExpress: clicking search button');
        searchBtn.click();
      }

      // 2. Ищем file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        console.log('AliExpress: found file input');
        setFile(fileInput, imageData, 'AliExpress');
        return;
      }

      // 3. Ищем область для дропа
      const dropZone = document.querySelector('[class*="drop"], [class*="upload"], [class*="search-image"]');
      if (dropZone) {
        console.log('AliExpress: found drop zone');
        dropFile(dropZone, imageData, 'AliExpress');
        return;
      }

      // 4. Пробуем найти кнопку "Загрузить фото" или похожую
      const uploadBtn = document.querySelector('[class*="upload"], button:contains("загрузить"), button:contains("выбрать")');
      if (uploadBtn) {
        uploadBtn.click();
        setTimeout(() => {
          const inp = document.querySelector('input[type="file"]');
          if (inp) setFile(inp, imageData, 'AliExpress');
        }, 500);
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(tryFindAndUpload, 1000);
      } else {
        console.error('AliExpress: failed to find upload element');
      }
    };

    // Начинаем поиск
    setTimeout(tryFindAndUpload, 1500);
  }

  function uploadViaPaste(imageData, siteName, selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent) { pasteToElement(el, imageData, siteName); return true; }
    }
    const inp = document.querySelector('input[type="file"]:not(.hide)');
    if (inp) { setFile(inp, imageData, siteName); return true; }
    if (document.body) { pasteToElement(document.body, imageData, siteName); return true; }
    return false;
  }

  function getSelectors(site) {
    const map = {
      'Yandex OCR': ['.ocr__target', '.ocr__source-target', 'textarea', '[contenteditable]', 'body'],
      'FaceCheck': ['input[type="file"]', '.dropzone', 'body'],
      'Lenso': ['input[type="file"]', '[contenteditable]', 'body']
    };
    return map[site] || ['[contenteditable]', 'body'];
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg.imageData) return;
    const map = {
      uploadToPimeyes: 'Pimeyes', uploadToLenso: 'Lenso', uploadToFacecheck: 'FaceCheck',
      uploadToWildberries: 'Wildberries', uploadToYandexOcr: 'Yandex OCR', 
      uploadToGoogleOcr: 'Google OCR', uploadToAliexpress: 'AliExpress'
    };
    uploadImage(msg.imageData, map[msg.action] || msg.action);
  });

  async function pasteToElement(el, imageData, siteName) {
    try {
      const resp = await fetch(imageData);
      let blob = await resp.blob();
      if (!blob.type || !blob.type.startsWith('image/')) blob = new Blob([blob], { type: 'image/png' });
      const file = new File([blob], 'image.png', { type: blob.type });
      const dt = new DataTransfer();
      dt.items.add(file);

      const ev = new ClipboardEvent('paste', { bubbles: true, cancelable: true, composed: true });
      Object.defineProperty(ev, 'clipboardData', { value: dt, writable: false });

      el.focus();
      el.dispatchEvent(ev);
      document.dispatchEvent(ev);
      console.log(`${siteName}: paste event dispatched`);
    } catch (e) {
      console.error(`${siteName}: paste error`, e);
    }
  }

  async function dropFile(el, imageData, siteName) {
    try {
      const resp = await fetch(imageData);
      let blob = await resp.blob();
      if (!blob.type || !blob.type.startsWith('image/')) blob = new Blob([blob], { type: 'image/png' });
      const file = new File([blob], 'image.png', { type: blob.type });
      const dt = new DataTransfer();
      dt.items.add(file);

      ['dragover', 'dragenter', 'drop'].forEach(type => {
        const ev = new DragEvent(type, { bubbles: true, cancelable: true, composed: true, dataTransfer: dt });
        el.dispatchEvent(ev);
      });
      console.log(`${siteName}: drop event dispatched`);
    } catch (e) {
      console.error(`${siteName}: drop error`, e);
    }
  }

  function setFile(input, imageData, siteName) {
    fetch(imageData).then(r => r.blob()).then(blob => {
      if (!blob.type || !blob.type.startsWith('image/')) blob = new Blob([blob], { type: 'image/png' });
      const file = new File([blob], 'image.png', { type: blob.type });
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      console.log(`✅ ${siteName}: file input set`);
    }).catch(e => console.error(`${siteName}: file error`, e));
  }
})();