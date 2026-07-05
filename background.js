if (typeof importScripts === 'function') {
  try {
    importScripts('config.js');
  } catch (e) {
    console.error('[Image Tools] Failed to import config.js', e);
  }
}

// Генерируем SEARCH_SERVICES из CONFIG для избежания дублирования
const SEARCH_SERVICES = (() => {
  const services = {};
  
  // Из UPLOAD_SERVICES
  for (const [key, svc] of Object.entries(CONFIG.UPLOAD_SERVICES)) {
    const urls = {
      lenso: 'https://lenso.ai/',
      facecheck: 'https://facecheck.id/',
      pimeyes: 'https://pimeyes.com/',
      wildberries: 'https://www.wildberries.ru/',
      yandexocr: 'https://translate.yandex.ru/ocr',
      yandexocr_replace: 'https://translate.yandex.ru/ocr',
      googleocr: 'https://translate.google.com/?hl=ru&sl=auto&tl=ru&op=images',
      googleocr_replace: 'https://translate.google.com/?hl=ru&sl=auto&tl=ru&op=images',
      tineye: 'https://tineye.com/',
      saucenao: 'https://saucenao.com/',
      namethatporn: 'https://namethatporn.com/search/images.html',
      namethatpornstar: 'https://namethatpornstar.com/search/'
    };
    
    const typeMap = {
      namethatporn: 'url',
      namethatpornstar: 'url'
    };
    
    services[svc.action] = {
      url: urls[key] || '',
      uploadAction: svc.uploadAction,
      type: typeMap[key] || 'image'
    };
  }
  
  return services;
})();

// Очистка слушателей при закрытии вкладок
const tabListeners = new Map();

function cleanupTabListeners(tabId) {
  if (tabListeners.has(tabId)) {
    const listener = tabListeners.get(tabId);
    chrome.tabs.onUpdated.removeListener(listener);
    tabListeners.delete(tabId);
  }
}

chrome.tabs.onRemoved.addListener((tabId) => {
  cleanupTabListeners(tabId);
});

// Создание контекстного меню
chrome.runtime.onInstalled.addListener(() => setupContextMenu());

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    if (CONFIG.ALL_SETTINGS_KEYS.some(key => changes[key])) setupContextMenu();
  }
});

async function setupContextMenu() {
  await chrome.contextMenus.removeAll();
  const items = await chrome.storage.sync.get(CONFIG.DEFAULT_SETTINGS);
  const s = { ...CONFIG.DEFAULT_SETTINGS, ...items };
  if (!s.showContextMenu) return;
  
  const add = (id, title) => chrome.contextMenus.create({ id, title, contexts: ['image'] });
  const sep = (id) => chrome.contextMenus.create({ id, type: 'separator', contexts: ['image'] });

  if (s.btnCopy) add('copyImage', '📋 Copy image');
  if (s.btnCopyLink) add('copyLink', '🔗 Copy image link');
  if (s.btnSave) add('saveImage', '💾 Save image');
  if (s.btnSaveAs) add('saveImageAs', '📁 Save image as...');
  if (s.btnGoogle || s.btnYandex || s.btnTinEye) sep('sep_img');
  if (s.btnGoogle) add('searchGoogle', 'Google Lens');
  if (s.btnYandex) add('searchYandex', 'Yandex');
  if (s.btnTinEye) add('searchTinEyeCtx', 'TinEye');
  if (s.btnPimeyes || s.btnFacecheck || s.btnLenso) sep('sep_face');
  if (s.btnPimeyes) add('searchPimeyesCtx', 'Pimeyes');
  if (s.btnFacecheck) add('searchFacecheckCtx', 'FaceCheck.id');
  if (s.btnLenso) add('searchLensoCtx', 'Lenso.ai');
  if (s.btnIqdb || s.btnTraceMoe || s.btnSauceNAO || s.btnAscii2d) sep('sep_anime');
  if (s.btnIqdb) add('searchIqdb', 'IQDB');
  if (s.btnTraceMoe) add('searchTraceMoeCtx', 'trace.moe');
  if (s.btnSauceNAO) add('searchSauceNAOCtx', 'SauceNAO');
  if (s.btnAscii2d) add('searchAscii2dCtx', 'ascii2d');
  if (s.btnNamethatporn || s.btnNamethatpornstar) sep('sep_nsfw');
  if (s.btnNamethatporn) add('searchNamethatpornCtx', 'Namethatporn');
  if (s.btnNamethatpornstar) add('searchNamethatpornstarCtx', 'Namethatpornstar');
  if (s.btnWildberries || s.btnOzon || s.btnAliexpress) sep('sep_shops');
  if (s.btnWildberries) add('searchWildberriesCtx', 'Wildberries (Google)');
  if (s.btnOzon) add('searchOzonCtx', 'Ozon (Google)');
  if (s.btnAliexpress) add('searchAliexpressCtx', 'AliExpress (Google)');
  if (s.btnGoogleOcr || s.btnYandexOcr || s.btnYandexOcrReplace || s.btnGoogleOcrReplace) sep('sep_ocr');
  if (s.btnGoogleOcr) add('ocrGoogle', 'Google OCR');
  if (s.btnYandexOcr) add('ocrYandex', 'Yandex OCR');
  if (s.btnYandexOcrReplace) add('ocrYandexReplace', 'Yandex OCR (Replace)');
  if (s.btnGoogleOcrReplace) add('ocrGoogleReplace', 'Google OCR (Replace)');
}

// Обработчик контекстного меню
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.srcUrl) return;
  const { menuItemId: action, srcUrl } = info;
  
  // Обработка URL-сервисов для контекстного меню
  const CONTEXT_URL_SERVICES = {
    searchGoogle: 'https://lens.google.com/uploadbyurl?url={url}',
    searchYandex: 'https://yandex.ru/images/search?url={url}&rpt=imageview',
    searchIqdb: 'https://iqdb.org/?url={url}',
    searchAliexpressCtx: 'https://lens.google.com/uploadbyurl?url={url}&q=%22aliexpress.ru%22',
    searchOzonCtx: 'https://lens.google.com/uploadbyurl?url={url}&q=%22ozon.ru%22',
    searchWildberriesCtx: 'https://lens.google.com/uploadbyurl?url={url}&q=%22wildberries.ru%22',
    searchTraceMoeCtx: 'https://trace.moe/?url={url}',
    searchAscii2dCtx: 'https://ascii2d.net/search/url/{url}'
  };
  
  const urlTemplate = CONTEXT_URL_SERVICES[action];
  if (urlTemplate) {
    const url = urlTemplate.replace('{url}', encodeURIComponent(srcUrl));
    chrome.tabs.create({ url, active: false });
    return;
  }
  
  if (action === 'saveImage') { 
    chrome.downloads.download({ url: srcUrl, saveAs: false }); 
    return; 
  }
  
  if (action === 'saveImageAs') { 
    chrome.downloads.download({ url: srcUrl, saveAs: true }); 
    return; 
  }
  
  if (action === 'copyLink') { 
    chrome.tabs.sendMessage(tab.id, { action: 'copyLinkToClipboard', url: srcUrl }); 
    return; 
  }
  
  if (action === 'copyImage') {
    downloadImageToBase64WithRetry(srcUrl, 3)
      .then(base64 => chrome.tabs.sendMessage(tab.id, { action: 'copyImageToClipboard', imageData: base64 }))
      .catch(err => {
        console.error('Copy failed:', err);
        chrome.tabs.sendMessage(tab.id, { action: 'showError', message: 'Failed to copy image' });
      });
    return;
  }
  
  const serviceMap = {
    searchPimeyesCtx: 'searchPimeyes', searchLensoCtx: 'searchLenso', searchFacecheckCtx: 'searchFacecheck',
    searchWildberriesCtx: 'searchWildberries',
    ocrYandex: 'searchYandexOcr', ocrYandexReplace: 'searchYandexOcrReplace', ocrGoogle: 'searchGoogleOcr', ocrGoogleReplace: 'searchGoogleOcrReplace',
    searchTinEyeCtx: 'searchTinEye', searchSauceNAOCtx: 'searchSauceNAO',
    searchNamethatpornCtx: 'searchNamethatporn', searchNamethatpornstarCtx: 'searchNamethatpornstar'
  };
  
  const svcKey = serviceMap[action];
  if (svcKey && SEARCH_SERVICES[svcKey]) {
    const svc = SEARCH_SERVICES[svcKey];
    if (svc.type === 'url') {
      openTabWithUrlUpload(svc.url, svc.uploadAction, srcUrl);
    } else {
      downloadImageToBase64WithRetry(srcUrl, 3)
        .then(base64 => openTabWithImageUpload(svc.url, base64, svc.uploadAction, tab.id))
        .catch(err => {
          console.error('Image fetch failed:', err);
          chrome.tabs.sendMessage(tab.id, { action: 'showError', message: 'Failed to fetch image' });
        });
    }
  }
});

// Основной обработчик сообщений
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getDefaultSettings') { 
    sendResponse(CONFIG.DEFAULT_SETTINGS); 
    return false; 
  }
  
  if (message.action === 'fetchImage') {
    downloadImageToBase64WithRetry(message.url, 3)
      .then(base64 => sendResponse({ success: true, data: base64 }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (message.action === 'downloadImage') {
    chrome.downloads.download({
      url: message.url,
      saveAs: false,
      filename: message.suggestedFilename || undefined,
      conflictAction: 'uniquify'
    }, (downloadId) => {
      sendResponse({ 
        success: !chrome.runtime.lastError && downloadId !== undefined, 
        error: chrome.runtime.lastError?.message 
      });
    });
    return true;
  }
  
  if (message.action === 'downloadImageAs') {
    chrome.downloads.download({
      url: message.url,
      saveAs: true,
      filename: message.suggestedFilename || undefined
    }, (downloadId) => {
      sendResponse({ 
        success: !chrome.runtime.lastError && downloadId !== undefined, 
        error: chrome.runtime.lastError?.message 
      });
    });
    return true;
  }
  
  if (message.action === 'downloadToFolder') {
    downloadToFolderFirefox(message.url, message.folder)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  
  if (message.action === 'openTab') {
    chrome.tabs.create({ url: message.url, active: message.active ?? false }, () => 
      sendResponse({ success: true })
    );
    return true;
  }

  const service = SEARCH_SERVICES[message.action];
  if (service) {
    if (service.type === 'url' && message.url) {
      openTabWithUrlUpload(service.url, service.uploadAction, message.url);
    } else if (message.imageData) {
      openTabWithImageUpload(service.url, message.imageData, service.uploadAction, sender.tab ? sender.tab.id : null);
    }
    sendResponse({ success: true });
    return true;
  }

  // Закрытие вкладки переводчика
  if (message.action === 'closeTranslator' && message.tabId) {
    chrome.tabs.remove(message.tabId, () => {
      if (chrome.runtime.lastError) console.error('Close tab error:', chrome.runtime.lastError);
    });
    return false;
  }

  // Пересылка результата OCR в исходную вкладку
  if (message.action === 'ocrReplaceImage' && message.imageData && message.tabId) {
    console.log('[Background] Forwarding OCR result to tab:', message.tabId);
    chrome.tabs.sendMessage(message.tabId, { 
      action: 'replaceImage', 
      imageData: message.imageData 
    }).then(() => {
      console.log('[Background] OCR result sent successfully');
    }).catch((err) => {
      console.error('[Background] Failed to send OCR result:', err);
      setTimeout(() => {
        chrome.tabs.sendMessage(message.tabId, { 
          action: 'replaceImage', 
          imageData: message.imageData 
        }).catch(() => console.error('[Background] Retry failed'));
      }, 1000);
    });
    return false;
  }
});

// Вспомогательные функции для открытия вкладок с загрузкой
function openTabWithImageUpload(url, imageData, actionName, originalTabId) {
  chrome.tabs.create({ url, active: false }, (tab) => {
    const translatorTabId = tab.id;
    let listenerRemoved = false;
    let loadCount = 0;
    const MAX_LOADS = 2; // Ожидаем две загрузки (первая - начальная, вторая - после обновления)
    const isPimeyes = url && url.includes('pimeyes.com');
    
    const cleanup = () => {
      if (!listenerRemoved) {
        cleanupTabListeners(translatorTabId);
        listenerRemoved = true;
      }
    };
    
    const trySend = (attempt = 0) => {
      if (attempt > 60) {
        console.error(`Failed to send message to tab ${translatorTabId}`);
        cleanup();
        return;
      }
      
      chrome.tabs.sendMessage(translatorTabId, {
        action: actionName,
        imageData,
        originalTabId,
        replaceOriginal: (actionName === 'uploadToYandexOcrReplace' || actionName === 'uploadToGoogleOcrReplace'),
        translatorTabId
      }).catch(() => {
        setTimeout(() => trySend(attempt + 1), 100);
      });
    };
    
    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId === translatorTabId && changeInfo.status === 'complete') {
        loadCount++;
        console.log(`[Background] Tab ${translatorTabId} loaded (${loadCount}/${MAX_LOADS})`);
        
        // Для Pimeyes нужно дождаться второй загрузки
        const shouldSend = isPimeyes ? loadCount >= MAX_LOADS : true;
        
        if (shouldSend) {
          cleanup();
          // Даём небольшую задержку для полной инициализации страницы
          setTimeout(() => trySend(), isPimeyes ? 1000 : 300);
        }
      }
    };
    
    chrome.tabs.onUpdated.addListener(onUpdated);
    tabListeners.set(translatorTabId, onUpdated);
    
    // Таймаут для очистки
    const timeout = isPimeyes ? 600000 : 300000; // 10 минут для Pimeyes, 5 минут для остальных
    setTimeout(() => {
      if (!listenerRemoved) {
        console.log(`[Background] Timeout for tab ${translatorTabId}, cleaning up`);
        cleanup();
      }
    }, timeout);
  });
}

function openTabWithUrlUpload(url, actionName, imageUrl) {
  chrome.tabs.create({ url, active: false }, (tab) => {
    let listenerRemoved = false;
    let loadCount = 0;
    const MAX_LOADS = 2;
    const isPimeyes = url && url.includes('pimeyes.com');
    
    const cleanup = () => {
      if (!listenerRemoved) {
        cleanupTabListeners(tab.id);
        listenerRemoved = true;
      }
    };
    
    const trySend = (attempt = 0) => {
      if (attempt > 60) {
        console.error(`Failed to send URL to tab ${tab.id}`);
        cleanup();
        return;
      }
      
      chrome.tabs.sendMessage(tab.id, { action: actionName, url: imageUrl })
        .catch(() => setTimeout(() => trySend(attempt + 1), 100));
    };
    
    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId === tab.id && changeInfo.status === 'complete') {
        loadCount++;
        console.log(`[Background] Tab ${tab.id} loaded (${loadCount}/${MAX_LOADS})`);
        
        const shouldSend = isPimeyes ? loadCount >= MAX_LOADS : true;
        
        if (shouldSend) {
          cleanup();
          setTimeout(() => trySend(), isPimeyes ? 1000 : 300);
        }
      }
    };
    
    chrome.tabs.onUpdated.addListener(onUpdated);
    tabListeners.set(tab.id, onUpdated);
    
    const timeout = isPimeyes ? 600000 : 300000;
    setTimeout(() => {
      if (!listenerRemoved) {
        cleanup();
      }
    }, timeout);
  });
}

// Загрузка изображений в base64
async function downloadImageToBase64WithRetry(url, maxAttempts) {
  if (url.startsWith('data:')) {
    return url;
  }
  
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try { 
      return await downloadImageToBase64(url); 
    }
    catch (error) { 
      lastError = error; 
      if (attempt < maxAttempts) await new Promise(r => setTimeout(r, attempt * 500)); 
    }
  }
  throw lastError;
}

async function downloadImageToBase64(url) {
  if (url.startsWith('data:')) {
    return url;
  }
  
  const response = await fetch(url, { 
    headers: { 'Accept': 'image/*' }, 
    mode: 'cors', 
    credentials: 'omit' 
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Функция сохранения в папку (Firefox)
async function downloadToFolderFirefox(url, folder) {
  return new Promise((resolve, reject) => {
    let filename = 'image.png';
    
    if (url.startsWith('data:')) {
      const mimeMatch = url.match(/^data:(image\/\w+);/);
      const ext = mimeMatch ? mimeMatch[1].split('/')[1].replace('jpeg','jpg') : 'png';
      filename = `image.${ext}`;
    } else {
      try {
        const urlPath = new URL(url).pathname;
        filename = urlPath.substring(urlPath.lastIndexOf('/') + 1).split('?')[0] || 'image.png';
      } catch(e) {}
    }
    
    filename = filename.replace(/[<>:"/\\|?*]/g, '_').trim() || 'image.png';
    
    let folderName = (folder || '')
      .replace(/^\/+/, '')
      .replace(/[<>:"\\|?*]/g, '_')
      .trim()
      .replace(/\/+$/, '');
    
    const fullPath = folderName ? `${folderName}/${filename}` : filename;

    chrome.downloads.download({
      url,
      saveAs: false,
      filename: fullPath,
      conflictAction: 'uniquify'
    }, (downloadId) => {
      if (chrome.runtime.lastError || downloadId === undefined) {
        reject(new Error(chrome.runtime.lastError?.message || 'Download failed'));
      } else {
        resolve();
      }
    });
  });
}