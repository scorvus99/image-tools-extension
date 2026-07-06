(function() {
  'use strict';

  if (window.__imageToolsInjected) return;
  window.__imageToolsInjected = true;

  console.log('[Image Tools] search-inject.js loaded');

  // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
  function waitForElement(selector, timeout = 15000) {
    return new Promise((resolve) => {
      const el = typeof selector === 'string' ? document.querySelector(selector) : null;
      if (el) {
        resolve(el);
        return;
      }
      const observer = new MutationObserver(() => {
        const found = typeof selector === 'string' ? document.querySelector(selector) : null;
        if (found) {
          observer.disconnect();
          resolve(found);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

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

  async function ensurePngBlob(base64) {
    const mimeMatch = base64.match(/^data:([^;]+)/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp'];

    if (allowed.includes(mime)) {
      return base64ToBlob(base64);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        }, 'image/png');
      };
      img.onerror = () => reject(new Error('Image loading failed'));
      img.src = base64;
    });
  }

  async function createFileFromBase64(base64, filename) {
    const blob = await ensurePngBlob(base64);
    return new File([blob], filename, { type: blob.type || 'image/png' });
  }

  function setFileToInputSync(input, file) {
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

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

  // ========== ФУНКЦИЯ ДЛЯ ВСТАВКИ URL В ПОЛЕ ==========
  function insertUrlIntoField(selector, url, buttonSelector = null, buttonClickDelay = 500) {
    const field = document.querySelector(selector);
    if (field) {
      console.log('[Image Tools] Found field, inserting URL');
      field.value = url;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));

      if (buttonSelector) {
        setTimeout(() => {
          const button = document.querySelector(buttonSelector);
          if (button) {
            console.log('[Image Tools] Found search button, clicking');
            button.click();
          } else {
            console.warn('[Image Tools] Search button not found, trying Enter');
            field.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
            }));
            field.dispatchEvent(new KeyboardEvent('keyup', {
              key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
            }));
          }
        }, buttonClickDelay);
      } else {
        setTimeout(() => {
          field.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
          }));
          field.dispatchEvent(new KeyboardEvent('keyup', {
            key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
          }));
        }, 500);
      }
    } else {
      console.warn(`[Image Tools] Field not found: ${selector}`);
      waitForElement(selector, 5000).then(found => {
        if (found) {
          found.value = url;
          found.dispatchEvent(new Event('input', { bubbles: true }));
          found.dispatchEvent(new Event('change', { bubbles: true }));

          if (buttonSelector) {
            setTimeout(() => {
              const button = document.querySelector(buttonSelector);
              if (button) button.click();
            }, 500);
          }
        }
      });
    }
  }

  // ========== ФУНКЦИИ ДЛЯ GOOGLE TRANSLATE ==========
  function uploadToGoogle(file) {
    console.log('[Image Tools] Uploading to Google OCR');

    waitForElement('input[type="file"][accept*="image/"]', 5000)
      .then(input => {
        if (input) {
          setFileToInputSync(input, file);
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }

        waitForElement('.VfPpkd-LgbsSe, button[aria-label*="Выбрать"]', 3000)
          .then(trigger => {
            if (trigger) {
              trigger.click();
              setTimeout(() => {
                const newInput = document.querySelector('input[type="file"][accept*="image/"]');
                if (newInput) {
                  setFileToInputSync(newInput, file);
                  newInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }, 500);
            }
          });
      })
      .catch(() => {
        document.body.focus();
        document.body.dispatchEvent(createPasteEvent(file));
      });
  }

  function uploadToGoogleOcrWithReplace(imageData, file, originalTabId, translatorTabId) {
    uploadToGoogle(file);

    const extractAndSend = (imgElement) => {
      fetch(imgElement.src)
        .then(res => res.blob())
        .then(blob => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }))
        .then(dataUrl => {
          browser.runtime.sendMessage({
            action: 'ocrReplaceImage',
            imageData: dataUrl,
            tabId: originalTabId
          });
          if (translatorTabId) {
            setTimeout(() => {
              browser.runtime.sendMessage({ action: 'closeTranslator', tabId: translatorTabId });
            }, 500);
          }
        })
        .catch(err => console.error('[Image Tools] Fetch failed:', err));
    };

    waitForElement('div.CMhTbb.tyW0pd img.Jmlpdc', 30000)
      .then(img => {
        if (img && img.src && img.src.startsWith('blob:')) {
          extractAndSend(img);
        }
      })
      .catch(() => console.warn('[Image Tools] Timeout waiting for translated image'));
  }

  // ========== ФУНКЦИИ ДЛЯ YANDEX TRANSLATE ==========
  function uploadToYandexOcr(file, imageData) {
    console.log('[Image Tools] Uploading to Yandex OCR');

    const tryUpload = (attempt = 0) => {
      if (attempt > 30) {
        console.warn('[Image Tools] Yandex: Max attempts reached');
        return;
      }

      let fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        console.log('[Image Tools] Found file input, setting file');
        setFileToInputSync(fileInput, file);
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }

      const uploadBtn = document.querySelector(
        'button[data-action="upload"], ' +
        '.upload-button, ' +
        '[class*="upload-btn"], ' +
        'button:has(svg), ' +
        '.file-upload-area'
      );

      if (uploadBtn) {
        console.log('[Image Tools] Found upload button, clicking');
        uploadBtn.click();

        setTimeout(() => {
          const newInput = document.querySelector('input[type="file"]');
          if (newInput) {
            console.log('[Image Tools] Found file input after click');
            setFileToInputSync(newInput, file);
            newInput.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            console.warn('[Image Tools] No file input appeared');
            setTimeout(() => tryUpload(attempt + 1), 500);
          }
        }, 500);
        return;
      }

      const dropZone = document.querySelector(
        '.file-upload-area, .upload-area, [class*="drop-zone"], [class*="upload-zone"], .ocr__source-target'
      );
      if (dropZone) {
        console.log('[Image Tools] Found drop zone, dispatching drop');
        dispatchDropToElement(dropZone, file);
        return;
      }

      console.log('[Image Tools] Trying paste to body');
      document.body.focus();
      document.body.dispatchEvent(createPasteEvent(file));

      setTimeout(() => tryUpload(attempt + 1), 1000);
    };

    setTimeout(() => tryUpload(), 500);
  }

  function uploadToYandexOcrWithReplace(imageData, file, originalTabId, translatorTabId) {
    uploadToYandexOcr(file, imageData);

    const extractAndSendYandexResult = () => {
      console.log('[Image Tools] Trying to extract Yandex OCR result');

      const svg = document.querySelector('#resultImage');
      if (svg) {
        try {
          const imageEl = svg.querySelector('image');
          if (imageEl) {
            const href = imageEl.getAttribute('href');
            if (href) {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const svgString = new XMLSerializer().serializeToString(svg);
              const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
              const url = URL.createObjectURL(svgBlob);
              const img = new Image();
              img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                const dataUrl = canvas.toDataURL('image/png');
                browser.runtime.sendMessage({
                  action: 'ocrReplaceImage',
                  imageData: dataUrl,
                  tabId: originalTabId
                });
                if (translatorTabId) {
                  setTimeout(() => {
                    browser.runtime.sendMessage({ action: 'closeTranslator', tabId: translatorTabId });
                  }, 500);
                }
              };
              img.onerror = () => URL.revokeObjectURL(url);
              img.src = url;
              return true;
            }
          }
        } catch (e) {
          console.error('[Image Tools] SVG extraction error:', e);
        }
      }

      const canvas = document.querySelector('canvas#resultCanvas, canvas[class*="result"]');
      if (canvas) {
        try {
          const dataUrl = canvas.toDataURL('image/png');
          browser.runtime.sendMessage({
            action: 'ocrReplaceImage',
            imageData: dataUrl,
            tabId: originalTabId
          });
          if (translatorTabId) {
            setTimeout(() => {
              browser.runtime.sendMessage({ action: 'closeTranslator', tabId: translatorTabId });
            }, 500);
          }
          return true;
        } catch (e) {
          console.error('[Image Tools] Canvas extraction error:', e);
        }
      }

      return false;
    };

    let attempts = 0;
    const checkResult = () => {
      attempts++;
      if (attempts > 30) {
        console.warn('[Image Tools] Yandex: Max attempts waiting for result');
        return;
      }

      if (extractAndSendYandexResult()) {
        console.log('[Image Tools] Yandex result extracted successfully');
        return;
      }

      setTimeout(checkResult, 2000);
    };

    setTimeout(checkResult, 3000);
  }

  // ========== ОСТАЛЬНЫЕ СЕРВИСЫ ==========
  function uploadToTinEye(file) {
    let fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      setFileToInputSync(fileInput, file);
      return;
    }

    const uploadBtn = document.querySelector('button.upload-button, .upload-icon, [data-action="upload"]');
    if (uploadBtn) {
      uploadBtn.click();
      setTimeout(() => {
        fileInput = document.querySelector('input[type="file"]');
        if (fileInput) setFileToInputSync(fileInput, file);
      }, 1500);
      return;
    }

    document.body.focus();
    document.body.dispatchEvent(createPasteEvent(file));
  }

  function uploadToFaceCheck(file) {
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      setFileToInputSync(fileInput, file);
      return;
    }

    const uploadBtn = document.querySelector('.upload-btn, .btn-upload, [class*="upload-btn"]');
    if (uploadBtn) {
      uploadBtn.click();
      setTimeout(() => {
        const newInput = document.querySelector('input[type="file"]');
        if (newInput) setFileToInputSync(newInput, file);
      }, 1500);
      return;
    }
  }

  function uploadToPimeyes(file) {
    const fileInput = document.querySelector('input[type="file"][accept*="image"]');
    if (fileInput) {
      setFileToInputSync(fileInput, file);
      return;
    }

    document.body.focus();
    document.body.dispatchEvent(createPasteEvent(file));
  }

  function uploadToLenso(file) {
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      setFileToInputSync(fileInput, file);
      return;
    }

    const uploadTrigger = document.querySelector('[data-testid="upload-area"], .upload-area, .dropzone');
    if (uploadTrigger) {
      uploadTrigger.click();
      setTimeout(() => {
        const newInput = document.querySelector('input[type="file"]');
        if (newInput) setFileToInputSync(newInput, file);
      }, 1500);
      return;
    }

    dispatchDropToElement(document.body, file);
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

  function uploadToWildberries(file) {
    const inputs = document.querySelectorAll('input[type="file"]');
    for (const inp of inputs) {
      if (inp.offsetParent !== null) {
        setFileToInputSync(inp, file);
        return;
      }
    }

    document.body.focus();
    document.body.dispatchEvent(createPasteEvent(file));
  }

  function uploadViaPasteOrDrop(file) {
    document.body.focus();
    document.body.dispatchEvent(createPasteEvent(file));
  }

  // ========== ФУНКЦИЯ ДЛЯ ЗАГРУЗКИ URL ==========
  function uploadUrl(url, siteName) {
    const start = () => {
      console.log(`[Image Tools] Uploading URL to ${siteName}`);
      switch(siteName) {
        case 'Namethatporn':
          insertUrlIntoField('#srcvhbta_fld', url, '#srcvhbta_btn', 500);
          break;
        case 'Namethatpornstar':
          insertUrlIntoField('#url__input', url, 'button[type="submit"], input[type="submit"]', 500);
          break;
        default:
          console.warn(`[Image Tools] Unknown site: ${siteName}`);
      }
    };

    if (document.readyState === 'complete') {
      start();
    } else {
      window.addEventListener('load', start);
    }
  }

  // ========== ОСНОВНАЯ ФУНКЦИЯ ЗАГРУЗКИ ==========
  async function uploadImage(imageData, siteName, meta = {}) {
    if (window.__imageToolsUploading) {
      console.warn('[Image Tools] Upload already in progress');
      return;
    }
    window.__imageToolsUploading = true;

    console.log(`[Image Tools] Starting upload to ${siteName}`);
    const file = await createFileFromBase64(imageData, 'image.png');

    const startUpload = () => {
      console.log(`[Image Tools] Performing upload to ${siteName}`);
      switch(siteName) {
        case 'TinEye': uploadToTinEye(file); break;
        case 'FaceCheck': uploadToFaceCheck(file); break;
        case 'Yandex OCR': uploadToYandexOcr(file, imageData); break;
        case 'Yandex OCR Replace':
          if (meta.replaceOriginal && meta.originalTabId) {
            uploadToYandexOcrWithReplace(imageData, file, meta.originalTabId, meta.translatorTabId);
          } else {
            uploadToYandexOcr(file, imageData);
          }
          break;
        case 'SauceNAO': uploadToSaucenao(file); break;
        case 'Pimeyes': uploadToPimeyes(file); break;
        case 'Lenso': uploadToLenso(file); break;
        case 'Wildberries': uploadToWildberries(file); break;
        case 'Google OCR': uploadToGoogle(file); break;
        case 'Google OCR Replace':
          if (meta.replaceOriginal && meta.originalTabId) {
            uploadToGoogleOcrWithReplace(imageData, file, meta.originalTabId, meta.translatorTabId);
          } else {
            uploadToGoogle(file);
          }
          break;
        default: uploadViaPasteOrDrop(file);
      }

      setTimeout(() => {
        window.__imageToolsUploading = false;
      }, 10000);
    };

    if (document.readyState === 'complete') {
      startUpload();
    } else {
      window.addEventListener('load', startUpload);
    }
  }

  // ========== СЛУШАТЕЛЬ СООБЩЕНИЙ ==========
  browser.runtime.onMessage.addListener((msg) => {
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
        uploadToGoogleOcrReplace: 'Google OCR Replace',
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