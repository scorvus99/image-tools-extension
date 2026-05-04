(function() {
  'use strict';

  // Проверка, что скрипт ещё не был загружен
  if (window.__imageToolsInjected) return;
  window.__imageToolsInjected = true;

  console.log('[Image Tools] search-inject.js loaded');

  // Функция для конвертации base64 в Blob
  function base64ToBlob(base64) {
    const parts = base64.split(',');
    const mime = parts[0].match(/:(.*?);/)[1] || 'image/png';
    const bytes = atob(parts[1]);
    const array = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      array[i] = bytes.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  }

  // Функция для создания File из base64
  function createFileFromBase64(base64, filename) {
    const blob = base64ToBlob(base64);
    return new File([blob], filename, { type: blob.type || 'image/png' });
  }

  // Установка файла в input[type=file]
  function setFileToInputSync(input, file) {
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // Создание события paste
  function createPasteEvent(file) {
    const dt = new DataTransfer();
    dt.items.add(file);
    const event = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      composed: true
    });
    Object.defineProperty(event, 'clipboardData', {
      value: dt,
      writable: false
    });
    return event;
  }

  // Создание событий drop
  function createDropEvents(file) {
    const dt = new DataTransfer();
    dt.items.add(file);
    return ['dragover', 'dragenter', 'drop'].map(type => 
      new DragEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        dataTransfer: dt
      })
    );
  }

  // Создание DragEvent для конкретной цели
  function dispatchDropToElement(element, file) {
    const dt = new DataTransfer();
    dt.items.add(file);
    
    ['dragenter', 'dragover', 'drop'].forEach((type) => {
      const event = new DragEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        dataTransfer: dt,
        clientX: element.getBoundingClientRect().left + 50,
        clientY: element.getBoundingClientRect().top + 50
      });
      
      if (type === 'dragover' || type === 'dragenter') {
        event.preventDefault();
      }
      
      element.dispatchEvent(event);
    });
  }

  function uploadImage(imageData, siteName, meta = {}) {
    console.log(`[Image Tools] Starting upload to ${siteName}`);
    const file = createFileFromBase64(imageData, 'image.png');

    const startUpload = () => {
      console.log(`[Image Tools] Performing upload to ${siteName}`);
      switch(siteName) {
        case 'TinEye':
          uploadToTinEye(file);
          break;
        case 'FaceCheck':
          uploadToFaceCheck(file);
          break;
        case 'Yandex OCR':
          uploadToYandexOcr(file, imageData);
          break;
        case 'Yandex OCR Replace':
          if (meta.replaceOriginal && meta.originalTabId) {
            uploadToYandexOcrWithReplace(imageData, file, meta.originalTabId, meta.translatorTabId);
          } else {
            uploadToYandexOcr(file, imageData);
          }
          break;
        case 'SauceNAO':
          uploadToSaucenao(file);
          break;
        case 'Pimeyes':
        case 'Lenso':
          uploadFaceService(file, siteName);
          break;
        case 'Wildberries':
          uploadToWildberries(file);
          break;
        case 'Google OCR':
          uploadToGoogle(file);
          break;
        case 'AliExpress':
          uploadToAliexpress(file);
          break;
        default:
          tryUpload(() => uploadViaPasteOrDrop(file, siteName), 20);
      }
    };

    if (document.readyState === 'complete') {
      setTimeout(startUpload, 1500);
    } else {
      window.addEventListener('load', () => setTimeout(startUpload, 1500));
    }
  }

  function uploadUrl(url, siteName) {
    const start = () => {
      switch(siteName) {
        case 'Namethatporn':
          insertUrlIntoField('#srcvhbta_fld', url);
          break;
        case 'Namethatpornstar':
          insertUrlIntoField('#url__input', url);
          break;
      }
    };

    if (document.readyState === 'complete') {
      setTimeout(start, 1000);
    } else {
      window.addEventListener('load', () => setTimeout(start, 1000));
    }
  }

  // ======== СПЕЦИАЛЬНЫЕ ФУНКЦИИ ДЛЯ САЙТОВ ========

  function uploadToTinEye(file) {
    console.log('[Image Tools] Uploading to TinEye...');
    let fileInput = document.querySelector('input[type="file"]');
    
    if (fileInput) {
      console.log('[Image Tools] Found file input, setting file...');
      setFileToInputSync(fileInput, file);
      return;
    }

    const uploadBtn = document.querySelector('button.upload-button, .upload-icon, [data-action="upload"]');
    if (uploadBtn) {
      uploadBtn.click();
      setTimeout(() => {
        fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
          setFileToInputSync(fileInput, file);
        } else {
          document.body.focus();
          document.body.dispatchEvent(createPasteEvent(file));
        }
      }, 1500);
      return;
    }

    const dropZone = document.querySelector('.drop-zone, [class*="drop"], [class*="upload"]');
    if (dropZone) {
      dispatchDropToElement(dropZone, file);
      return;
    }

    document.body.focus();
    document.body.dispatchEvent(createPasteEvent(file));
  }

  function uploadToFaceCheck(file) {
    console.log('[Image Tools] Uploading to FaceCheck...');
    let fileInput = document.querySelector('input[type="file"]');
    
    if (fileInput) {
      setFileToInputSync(fileInput, file);
      return;
    }

    const dropZone = document.querySelector('.dropzone, [class*="drop"], [class*="upload"]');
    if (dropZone) {
      dispatchDropToElement(dropZone, file);
      return;
    }

    document.body.focus();
    document.body.dispatchEvent(createPasteEvent(file));

    setTimeout(() => {
      fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        setFileToInputSync(fileInput, file);
      }
    }, 2000);
  }

  // Функция для Яндекс OCR
  function uploadToYandexOcr(file, imageData) {
    console.log('[Image Tools] Uploading to Yandex OCR...');

    // Способ 1: Ищем область для перетаскивания
    const dropZone = document.querySelector('.file-upload-area, .upload-area, [class*="drop-zone"], [class*="upload-zone"]');
    if (dropZone) {
      console.log('[Image Tools] Found drop zone, dispatching drop...');
      dispatchDropToElement(dropZone, file);
      return;
    }

    // Способ 2: Ищем кнопку загрузки
    const uploadBtn = document.querySelector('button[data-action="upload"], .upload-button, [class*="upload-btn"]');
    if (uploadBtn) {
      console.log('[Image Tools] Found upload button, clicking...');
      uploadBtn.click();
      
      setTimeout(() => {
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
          console.log('[Image Tools] Found file input after click, setting file...');
          setFileToInputSync(fileInput, file);
        }
      }, 1000);
      return;
    }

    // Способ 3: Ищем скрытый file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      console.log('[Image Tools] Found hidden file input, setting file...');
      fileInput.style.display = 'block';
      fileInput.style.visibility = 'visible';
      setFileToInputSync(fileInput, file);
      return;
    }

    // Способ 4: Пробуем найти OCR target и вставить через paste
    const ocrTarget = document.querySelector('.ocr__target, .ocr__source-target, [class*="ocr"]');
    if (ocrTarget) {
      console.log('[Image Tools] Found OCR target, pasting...');
      ocrTarget.focus();
      ocrTarget.dispatchEvent(createPasteEvent(file));
      return;
    }

    // Способ 5: Пробуем contenteditable элементы
    const editable = document.querySelector('[contenteditable="true"]');
    if (editable) {
      console.log('[Image Tools] Found contenteditable, pasting...');
      editable.focus();
      editable.dispatchEvent(createPasteEvent(file));
      return;
    }

    // Способ 6: Пробуем textarea
    const textarea = document.querySelector('textarea');
    if (textarea) {
      console.log('[Image Tools] Found textarea, pasting...');
      textarea.focus();
      textarea.dispatchEvent(createPasteEvent(file));
      return;
    }

    // Способ 7: Последняя попытка - paste на body
    console.log('[Image Tools] Fallback: pasting to body...');
    document.body.focus();
    document.body.dispatchEvent(createPasteEvent(file));

    // Пробуем также drag-and-drop на body
    setTimeout(() => {
      console.log('[Image Tools] Trying drag-and-drop on body...');
      dispatchDropToElement(document.body, file);
    }, 1000);
  }

  function uploadToSaucenao(file) {
    const fileInput = document.querySelector('input[type="file"][name="file"]');
    if (fileInput) {
      setFileToInputSync(fileInput, file);
      setTimeout(() => {
        const btn = document.getElementById('searchButton');
        if (btn) btn.click();
      }, 1500);
      return;
    }

    document.body.focus();
    document.body.dispatchEvent(createPasteEvent(file));
    setTimeout(() => {
      const btn = document.getElementById('searchButton');
      if (btn) btn.click();
    }, 2000);
  }

  function uploadFaceService(file, siteName) {
    console.log(`[Image Tools] Uploading to ${siteName}...`);
    document.body.focus();
    document.body.dispatchEvent(createPasteEvent(file));

    setTimeout(() => {
      const dropZone = document.querySelector('[class*="drop"], [class*="upload-zone"], .dropzone');
      if (dropZone) {
        dispatchDropToElement(dropZone, file);
      }
    }, 1000);

    setTimeout(() => {
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput && fileInput.offsetParent !== null) {
        setFileToInputSync(fileInput, file);
      }
    }, 2000);
  }

  function uploadToWildberries(file) {
    const inputs = document.querySelectorAll('input[type="file"]');
    for (const inp of inputs) {
      if (inp.offsetParent !== null) {
        setFileToInputSync(inp, file);
        return;
      }
    }

    const popUp = document.querySelector('#popUpFileInput');
    if (popUp) {
      setFileToInputSync(popUp, file);
      return;
    }

    const container = document.querySelector('#searchByImageContainer');
    if (container) {
      container.click();
      setTimeout(() => {
        const newInput = document.querySelector('input[type="file"]');
        if (newInput) setFileToInputSync(newInput, file);
      }, 2000);
      return;
    }

    document.body.focus();
    document.body.dispatchEvent(createPasteEvent(file));
  }

  function uploadToGoogle(file) {
    const fileInput = document.querySelector('input[type="file"][accept*="image"], input[type="file"]:not(.hide)');
    if (fileInput) {
      setFileToInputSync(fileInput, file);
      return;
    }

    const dropzone = document.querySelector('[class*="drop"], [class*="upload"], .DVHcue');
    if (dropzone) {
      dispatchDropToElement(dropzone, file);
      return;
    }

    document.body.focus();
    document.body.dispatchEvent(createPasteEvent(file));
  }

  function uploadToAliexpress(file) {
    let attempts = 0;
    const maxAttempts = 30;

    const tryUpload = () => {
      attempts++;
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        setFileToInputSync(fileInput, file);
        return;
      }

      const dropZone = document.querySelector('[class*="drop"], [class*="upload"], [class*="search-image"]');
      if (dropZone) {
        dispatchDropToElement(dropZone, file);
        return;
      }

      if (attempts <= 3) {
        const searchBtn = document.querySelector('[class*="SearchByImage"], [class*="image-search"], [class*="camera"]');
        if (searchBtn) {
          searchBtn.click();
          setTimeout(tryUpload, 1500);
          return;
        }
      }

      if (attempts < maxAttempts) {
        setTimeout(tryUpload, 1000);
      }
    };

    setTimeout(tryUpload, 1500);
  }

  function uploadViaPasteOrDrop(file, siteName) {
    document.body.focus();
    document.body.dispatchEvent(createPasteEvent(file));

    setTimeout(() => {
      const dropZone = document.querySelector('[class*="drop"], [class*="upload"]');
      if (dropZone) {
        dispatchDropToElement(dropZone, file);
      }
    }, 1000);

    setTimeout(() => {
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        setFileToInputSync(fileInput, file);
      }
    }, 2000);
  }

  function tryUpload(fn, max) {
    let n = 0;
    const t = () => { 
      if (fn() === false && ++n < max) setTimeout(t, 800); 
    };
    t();
  }

  function insertUrlIntoField(selector, url) {
    const field = document.querySelector(selector);
    if (field) {
      field.value = url;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      setTimeout(() => {
        const eventInit = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
        field.dispatchEvent(new KeyboardEvent('keydown', eventInit));
        field.dispatchEvent(new KeyboardEvent('keypress', eventInit));
        field.dispatchEvent(new KeyboardEvent('keyup', eventInit));
        const searchBtn = field.closest('form')?.querySelector('button[type="submit"], input[type="submit"]');
        if (searchBtn) searchBtn.click();
        if (!searchBtn) {
          const nearbyBtn = field.parentElement?.querySelector('button, input[type="button"]');
          if (nearbyBtn && nearbyBtn !== field) nearbyBtn.click();
        }
      }, 300);
    }
  }

  // ========== Яндекс OCR с заменой и закрытием вкладки ==========
  function uploadToYandexOcrWithReplace(imageData, file, originalTabId, translatorTabId) {
    uploadToYandexOcr(file, imageData);

    // Функция для получения переведённого изображения через canvas (обходит CSP)
    const extractTranslatedImage = () => {
      console.log('[Image Tools] Trying to extract translated image...');
      
      const svg = document.querySelector('#resultImage');
      if (svg) {
        console.log('[Image Tools] Found #resultImage SVG');
        
        try {
          const imageElement = svg.querySelector('image');
          if (!imageElement) {
            console.log('[Image Tools] No image element in SVG');
            return false;
          }
          
          const href = imageElement.getAttribute('href');
          console.log('[Image Tools] Image href:', href);
          
          if (!href) {
            console.log('[Image Tools] No href in image element');
            return false;
          }
          
          // Создаём canvas и рисуем оригинальный SVG на нём
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Сериализуем оригинальный SVG (используем оригинальный svg, не клонированный)
          const svgString = new XMLSerializer().serializeToString(svg);
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          
          const img = new Image();
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            
            const finalDataUrl = canvas.toDataURL('image/png');
            console.log('[Image Tools] Extracted image via canvas');
            
            chrome.runtime.sendMessage({ 
              action: 'ocrReplaceImage', 
              imageData: finalDataUrl, 
              tabId: originalTabId 
            });
            
            if (translatorTabId) {
              setTimeout(() => {
                chrome.runtime.sendMessage({ action: 'closeTranslator', tabId: translatorTabId });
              }, 500);
            }
          };
          
          img.onerror = (e) => {
            console.error('[Image Tools] Failed to load SVG in image:', e);
            URL.revokeObjectURL(url);
          };
          
          img.src = url;
          return true;
        } catch (e) {
          console.error('[Image Tools] Error extracting image:', e);
        }
      }
      
      // Способ 2: Ищем canvas с результатом
      const resultCanvas = document.querySelector('canvas#resultCanvas, canvas[class*="result"]');
      if (resultCanvas) {
        console.log('[Image Tools] Found result canvas');
        try {
          const finalDataUrl = resultCanvas.toDataURL('image/png');
          chrome.runtime.sendMessage({ 
            action: 'ocrReplaceImage', 
            imageData: finalDataUrl, 
            tabId: originalTabId 
          });
          
          if (translatorTabId) {
            setTimeout(() => {
              chrome.runtime.sendMessage({ action: 'closeTranslator', tabId: translatorTabId });
            }, 500);
          }
          return true;
        } catch (e) {
          console.error('[Image Tools] Canvas extraction error:', e);
        }
      }
      
      return false;
    };

    // Ждём появления результата
    const checkForResult = (attempts = 0) => {
      if (attempts > 60) return;
      
      const downloadBtn = document.querySelector('button[data-action="download"]');
      const svg = document.querySelector('#resultImage');
      
      if ((downloadBtn && !downloadBtn.disabled && downloadBtn.offsetParent !== null) || 
          (svg && svg.querySelector('image'))) {
        console.log('[Image Tools] Result found, extracting...');
        setTimeout(() => {
          if (!extractTranslatedImage()) {
            setTimeout(() => checkForResult(attempts + 1), 2000);
          }
        }, 1500);
        return;
      }
      
      setTimeout(() => checkForResult(attempts + 1), 2000);
    };

    setTimeout(() => checkForResult(), 3000);
    
    const observer = new MutationObserver(() => {
      const downloadBtn = document.querySelector('button[data-action="download"]');
      if (downloadBtn && !downloadBtn.disabled && downloadBtn.offsetParent !== null) {
        observer.disconnect();
        setTimeout(() => {
          if (!extractTranslatedImage()) {
            setTimeout(() => extractTranslatedImage(), 2000);
          }
        }, 1500);
      }
    });
    
    observer.observe(document.body, { 
      childList: true, subtree: true, attributes: true, 
      attributeFilter: ['src', 'href', 'disabled'] 
    });
    
    setTimeout(() => observer.disconnect(), 120000);
  }

  // ========== СЛУШАТЕЛЬ СООБЩЕНИЙ ==========
  chrome.runtime.onMessage.addListener((msg) => {
    console.log('[Image Tools] Received message:', msg.action);

    if (msg.url) {
      const mapUrl = { uploadToNamethatporn: 'Namethatporn', uploadToNamethatpornstar: 'Namethatpornstar' };
      const site = mapUrl[msg.action];
      if (site) { uploadUrl(msg.url, site); return; }
    }

    if (msg.imageData) {
      const mapImage = {
        uploadToPimeyes: 'Pimeyes',
        uploadToLenso: 'Lenso',
        uploadToFacecheck: 'FaceCheck',
        uploadToWildberries: 'Wildberries',
        uploadToYandexOcr: 'Yandex OCR',
        uploadToYandexOcrReplace: 'Yandex OCR Replace',
        uploadToGoogleOcr: 'Google OCR',
        uploadToAliexpress: 'AliExpress',
        uploadToTinEye: 'TinEye',
        uploadToSauceNAO: 'SauceNAO'
      };
      const site = mapImage[msg.action];
      if (site) {
        const meta = {
          replaceOriginal: msg.replaceOriginal === true,
          originalTabId: msg.originalTabId,
          translatorTabId: msg.translatorTabId
        };
        uploadImage(msg.imageData, site, meta);
      }
    }
  });

  console.log('[Image Tools] search-inject.js initialized');
})();