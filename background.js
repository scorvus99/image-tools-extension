importScripts('config.js');

const SEARCH_SERVICES = {
  searchPimeyes: { url: 'https://pimeyes.com/', uploadAction: 'uploadToPimeyes' },
  searchLenso:   { url: 'https://lenso.ai/',   uploadAction: 'uploadToLenso' },
  searchFacecheck: { url: 'https://facecheck.id/', uploadAction: 'uploadToFacecheck' },
  searchWildberries: { url: 'https://www.wildberries.ru/', uploadAction: 'uploadToWildberries' },
  searchYandexOcr: { url: 'https://translate.yandex.ru/ocr', uploadAction: 'uploadToYandexOcr' },
  searchGoogleOcr: { url: 'https://translate.google.com/?hl=ru&sl=auto&tl=ru&op=images', uploadAction: 'uploadToGoogleOcr' },
  searchAliexpressUpload: { url: 'https://aliexpress.ru/', uploadAction: 'uploadToAliexpress' }
};

// === Контекстное меню ===
chrome.runtime.onInstalled.addListener(() => setupContextMenu());

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    const relevantKeys = ['showContextMenu', 'btnCopy', 'btnCopyLink', 'btnSave', 'btnSaveAs',
      'btnGoogle', 'btnYandex', 'btnIqdb', 'btnPimeyes', 'btnLenso', 'btnFacecheck',
      'btnWildberries', 'btnYandexOcr', 'btnGoogleOcr', 'btnAliexpress', 'btnAliexpressUpload'];
    if (relevantKeys.some(key => changes[key])) {
      setupContextMenu();
    }
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

  const hasSearch = s.btnGoogle || s.btnYandex || s.btnIqdb || s.btnPimeyes || s.btnFacecheck || s.btnLenso || s.btnWildberries || s.btnAliexpress || s.btnAliexpressUpload;
  const hasOcr = s.btnGoogleOcr || s.btnYandexOcr;

  if (hasSearch) sep('sep1');
  if (s.btnGoogle) add('searchGoogle', 'Google Lens');
  if (s.btnYandex) add('searchYandex', 'Yandex');
  if (s.btnIqdb) add('searchIqdb', 'IQDB');
  if (s.btnPimeyes) add('searchPimeyesCtx', 'Pimeyes');
  if (s.btnFacecheck) add('searchFacecheckCtx', 'FaceCheck.id');
  if (s.btnLenso) add('searchLensoCtx', 'Lenso.ai');
  if (s.btnWildberries) add('searchWildberriesCtx', 'Wildberries');
  if (s.btnAliexpress) add('searchAliexpressCtx', 'AliExpress (URL)');
  if (s.btnAliexpressUpload) add('searchAliexpressUploadCtx', 'AliExpress (Upload)');

  if (hasOcr) sep('sep2');
  if (s.btnGoogleOcr) add('ocrGoogle', 'Google OCR');
  if (s.btnYandexOcr) add('ocrYandex', 'Yandex OCR');
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.srcUrl) return;
  const { menuItemId: action, srcUrl } = info;

  const urlServices = {
    searchGoogle:  `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(srcUrl)}`,
    searchYandex:  `https://yandex.ru/images/search?url=${encodeURIComponent(srcUrl)}&rpt=imageview`,
    searchIqdb:    `https://iqdb.org/?url=${encodeURIComponent(srcUrl)}`,
    searchAliexpressCtx: `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(srcUrl)}`
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
    searchPimeyesCtx: 'searchPimeyes',
    searchLensoCtx: 'searchLenso',
    searchFacecheckCtx: 'searchFacecheck',
    searchWildberriesCtx: 'searchWildberries',
    ocrYandex: 'searchYandexOcr',
    ocrGoogle: 'searchGoogleOcr',
    searchAliexpressUploadCtx: 'searchAliexpressUpload'
  };

  const svcKey = serviceMap[action];
  if (svcKey && SEARCH_SERVICES[svcKey]) {
    downloadImageToBase64WithRetry(srcUrl, 3)
      .then(base64 => openTabWithImageUpload(SEARCH_SERVICES[svcKey].url, base64, SEARCH_SERVICES[svcKey].uploadAction))
      .catch(err => console.error('Image fetch failed:', err));
  }
});

// === Обработка сообщений ===
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
    chrome.downloads.download({ url: message.url, saveAs: false }, (downloadId) => {
      sendResponse({ 
        success: !chrome.runtime.lastError && downloadId !== undefined,
        error: chrome.runtime.lastError?.message 
      });
    });
    return true;
  }

  if (message.action === 'downloadImageAs') {
    chrome.downloads.download({ url: message.url, saveAs: true }, (downloadId) => {
      sendResponse({ 
        success: !chrome.runtime.lastError && downloadId !== undefined,
        error: chrome.runtime.lastError?.message 
      });
    });
    return true;
  }

  if (message.action === 'openTab') {
    chrome.tabs.create({ url: message.url, active: message.active ?? false }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  const service = SEARCH_SERVICES[message.action];
  if (service) {
    openTabWithImageUpload(service.url, message.imageData, service.uploadAction);
    sendResponse({ success: true });
    return true;
  }
});

// === Открытие вкладки с последующей вставкой ===
function openTabWithImageUpload(url, imageData, actionName) {
  chrome.tabs.create({ url, active: false }, (tab) => {
    const trySend = () => {
      chrome.tabs.get(tab.id, (currentTab) => {
        if (currentTab.status === 'complete') {
          chrome.tabs.sendMessage(tab.id, { action: actionName, imageData })
            .catch(() => {
              setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, { action: actionName, imageData })
                  .catch(() => console.log(`Failed to send to ${url}`));
              }, 1000);
            });
        } else {
          setTimeout(trySend, 500);
        }
      });
    };

    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId === tab.id && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(onUpdated);
        setTimeout(trySend, 1000);
      }
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
    setTimeout(trySend, 1000);
  });
}

// === Загрузка изображений ===
async function downloadImageToBase64WithRetry(url, maxAttempts) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await downloadImageToBase64(url);
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
      }
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