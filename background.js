// CONFIG уже доступен, так как загружается через manifest.json "scripts": ["config.js", "background.js"]

const SEARCH_SERVICES = {
  searchPimeyes: { url: 'https://pimeyes.com/', uploadAction: 'uploadToPimeyes' },
  searchLenso:   { url: 'https://lenso.ai/',   uploadAction: 'uploadToLenso' },
  searchFacecheck: { url: 'https://facecheck.id/', uploadAction: 'uploadToFacecheck' },
  searchWildberries: { url: 'https://www.wildberries.ru/', uploadAction: 'uploadToWildberries' },
  searchYandexOcr: { url: 'https://translate.yandex.ru/ocr', uploadAction: 'uploadToYandexOcr' },
  searchYandexOcrReplace: { url: 'https://translate.yandex.ru/ocr', uploadAction: 'uploadToYandexOcrReplace' },
  searchGoogleOcr: { url: 'https://translate.google.com/?hl=ru&sl=auto&tl=ru&op=images', uploadAction: 'uploadToGoogleOcr' },
  searchAliexpressUpload: { url: 'https://aliexpress.ru/', uploadAction: 'uploadToAliexpress' },
  searchTinEye: { url: 'https://tineye.com/', uploadAction: 'uploadToTinEye' },
  searchSauceNAO: { url: 'https://saucenao.com/', uploadAction: 'uploadToSauceNAO' },
  searchNamethatporn: { url: 'https://namethatporn.com/search/images.html', uploadAction: 'uploadToNamethatporn', type: 'url' },
  searchNamethatpornstar: { url: 'https://namethatpornstar.com/search/', uploadAction: 'uploadToNamethatpornstar', type: 'url' }
};

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
  if (s.btnWildberries || s.btnAliexpress || s.btnAliexpressUpload) sep('sep_shops');
  if (s.btnWildberries) add('searchWildberriesCtx', 'Wildberries');
  if (s.btnAliexpress) add('searchAliexpressCtx', 'AliExpress (URL)');
  if (s.btnAliexpressUpload) add('searchAliexpressUploadCtx', 'AliExpress (Upload)');
  if (s.btnGoogleOcr || s.btnYandexOcr || s.btnYandexOcrReplace) sep('sep_ocr');
  if (s.btnGoogleOcr) add('ocrGoogle', 'Google OCR');
  if (s.btnYandexOcr) add('ocrYandex', 'Yandex OCR');
  if (s.btnYandexOcrReplace) add('ocrYandexReplace', 'Yandex OCR (Replace)');
}

// Обработчик контекстного меню
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.srcUrl) return;
  const { menuItemId: action, srcUrl } = info;
  
  const urlServices = {
    searchGoogle: `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(srcUrl)}`,
    searchYandex: `https://yandex.ru/images/search?url=${encodeURIComponent(srcUrl)}&rpt=imageview`,
    searchIqdb: `https://iqdb.org/?url=${encodeURIComponent(srcUrl)}`,
    searchAliexpressCtx: `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(srcUrl)}`,
    searchTraceMoeCtx: `https://trace.moe/?url=${encodeURIComponent(srcUrl)}`,
    searchAscii2dCtx: `https://ascii2d.net/search/url/${encodeURIComponent(srcUrl)}`
  };
  
  if (urlServices[action]) { 
    chrome.tabs.create({ url: urlServices[action], active: false }); 
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
      .catch(err => console.error('Copy failed:', err));
    return;
  }
  
  const serviceMap = {
    searchPimeyesCtx: 'searchPimeyes', searchLensoCtx: 'searchLenso', searchFacecheckCtx: 'searchFacecheck',
    searchWildberriesCtx: 'searchWildberries', searchAliexpressUploadCtx: 'searchAliexpressUpload',
    ocrYandex: 'searchYandexOcr', ocrYandexReplace: 'searchYandexOcrReplace', ocrGoogle: 'searchGoogleOcr',
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
        .catch(err => console.error('Image fetch failed:', err));
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
      // Пробуем отправить ещё раз
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
    
    const trySend = (attempt = 0) => {
      if (attempt > 120) {
        console.error(`Failed to send message to tab ${translatorTabId}`);
        return;
      }
      
      chrome.tabs.get(translatorTabId, (currentTab) => {
        if (chrome.runtime.lastError) {
          setTimeout(() => trySend(attempt + 1), 500);
          return;
        }
        if (currentTab.status === 'complete') {
          setTimeout(() => {
            chrome.tabs.sendMessage(translatorTabId, {
              action: actionName,
              imageData,
              originalTabId,
              replaceOriginal: (actionName === 'uploadToYandexOcrReplace'),
              translatorTabId
            }).catch((err) => {
              console.log(`[Background] Send failed (attempt ${attempt}):`, err);
              setTimeout(() => trySend(attempt + 1), 1000);
            });
          }, 2000);
        } else {
          setTimeout(() => trySend(attempt + 1), 500);
        }
      });
    };
    
    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId === translatorTabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(onUpdated);
        setTimeout(() => trySend(), 3000);
      }
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
    
    setTimeout(() => trySend(), 3000);
  });
}

function openTabWithUrlUpload(url, actionName, imageUrl) {
  chrome.tabs.create({ url, active: false }, (tab) => {
    const trySend = (attempt = 0) => {
      if (attempt > 60) {
        console.error(`Failed to send URL to tab ${tab.id}`);
        return;
      }
      
      chrome.tabs.get(tab.id, (currentTab) => {
        if (chrome.runtime.lastError) {
          setTimeout(() => trySend(attempt + 1), 500);
          return;
        }
        if (currentTab.status === 'complete') {
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { action: actionName, url: imageUrl })
              .catch(() => setTimeout(() => trySend(attempt + 1), 1000));
          }, 1500);
        } else {
          setTimeout(() => trySend(attempt + 1), 500);
        }
      });
    };
    
    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId === tab.id && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(onUpdated);
        setTimeout(() => trySend(), 1500);
      }
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
    setTimeout(() => trySend(), 2000);
  });
}

// Загрузка изображений в base64
async function downloadImageToBase64WithRetry(url, maxAttempts) {
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