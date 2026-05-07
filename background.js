// Подключаем config.js в контексте сервис-воркера MV3
importScripts('config.js');

// CONFIG уже доступен через manifest.json "service_worker": "background.js"

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

  if (s.btnCopy) add('copyImage', '📋 Copy image');
  if (s.btnCopyLink) add('copyLink', '🔗 Copy image link');
  if (s.btnSave) add('saveImage', '💾 Save image');
  if (s.btnSaveAs) add('saveImageAs', '📁 Save image as...');
}

// Обработчик контекстного меню
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.srcUrl) return;
  const { menuItemId: action, srcUrl } = info;
  
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

  if (message.action === 'translatedImageReady' && message.sourceTabId && message.imageUrl) {
    downloadImageToBase64WithRetry(message.imageUrl, 3)
      .then((imageData) => chrome.tabs.sendMessage(message.sourceTabId, {
        action: 'replaceCurrentImage',
        imageUrl: imageData,
        originalImageSrc: message.originalImageSrc || ''
      }))
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // Новый обработчик: открыть фоновую вкладку и после загрузки вставить изображение
  if (message.action === 'openTabAndPaste' && message.url && message.imageData) {
    const sourceTabId = sender?.tab?.id;
    openTabAndPaste(message.url, message.imageData, {
      serviceId: message.serviceId || null,
      sourceTabId,
      originalImageSrc: message.originalImageSrc || '',
      replaceOriginal: !!message.replaceOriginal
    })
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

// Открывает вкладку, ждёт загрузки и отправляет команду pasteImage
function openTabAndPaste(url, imageData, options = {}) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url, active: false }, (tab) => {
      const tabId = tab.id;
      let completed = false;

      const cleanup = () => {
        cleanupTabListeners(tabId);
      };

      const trySend = () => {
        chrome.tabs.sendMessage(tabId, {
          action: 'pasteImage',
          imageData,
          serviceId: options.serviceId || null,
          sourceTabId: options.sourceTabId || null,
          originalImageSrc: options.originalImageSrc || '',
          replaceOriginal: !!options.replaceOriginal
        })
          .then(() => resolve())
          .catch((err) => {
            // Если вкладка ещё не готова или скрипт не загружен, пробуем позже
            if (!completed) {
              setTimeout(trySend, 1000);
            } else {
              reject(err);
            }
          });
      };

      const onUpdated = (updatedTabId, changeInfo) => {
        if (updatedTabId === tabId && changeInfo.status === 'complete') {
          completed = true;
          cleanup();
          // Даём странице время на окончательную инициализацию
          setTimeout(trySend, 1500);
        }
      };

      chrome.tabs.onUpdated.addListener(onUpdated);
      tabListeners.set(tabId, onUpdated);

      // Резервный таймаут на случай, если событие complete не сработает
      setTimeout(() => {
        if (!completed) {
          completed = true;
          cleanup();
          trySend();
        }
      }, 30000);

      // Таймаут для общей очистки
      setTimeout(cleanup, 60000);
    });
  });
}

// Загрузка изображений в base64
async function downloadImageToBase64WithRetry(url, maxAttempts) {
  if (url.startsWith('data:')) return url;
  
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
  if (url.startsWith('data:')) return url;
  
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

// Сохранение в папку (Firefox)
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
    
    filename = filename.replace(/[<>:\"/\\|?*]/g, '_').trim() || 'image.png';
    
    let folderName = (folder || '')
      .replace(/^\/+/, '')
      .replace(/[<>:\"\\|?*]/g, '_')
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
