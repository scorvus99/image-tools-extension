// background.js - полный файл с встроенным CONFIG

// ============================================
// ВСТРОЕННЫЙ CONFIG (копия из config.js)
// ============================================
const CONFIG = {
  ICONS_PATH: 'icons/',
  
  BUTTONS: {
    copy:        { type: 'emoji', emoji: '📋', icon: null, tooltip: 'Copy image' },
    save:        { type: 'emoji', emoji: '💾', icon: null, tooltip: 'Save image' },
    saveas:      { type: 'emoji', emoji: '📁', icon: null, tooltip: 'Save image as...' },
    copylink:    { type: 'emoji', emoji: '🔗', icon: null, tooltip: 'Copy image link' },
    google:      { type: 'icon',  emoji: null, icon: 'google.ico',           tooltip: 'Search with Google Lens' },
    yandex:      { type: 'icon',  emoji: null, icon: 'yandex.ico',           tooltip: 'Search with Yandex' },
    tineye:      { type: 'icon',  emoji: null, icon: 'tineye.ico',           tooltip: 'Search with TinEye' },
    pimeyes:     { type: 'icon',  emoji: null, icon: 'pimeyes.ico',          tooltip: 'Search with Pimeyes' },
    facecheck:   { type: 'icon',  emoji: null, icon: 'facecheck.ico',        tooltip: 'Search with FaceCheck.id' },
    lenso:       { type: 'icon',  emoji: null, icon: 'lenso.ico',            tooltip: 'Search with Lenso.ai' },
    iqdb:        { type: 'icon',  emoji: null, icon: 'iqdb.ico',             tooltip: 'Search with IQDB' },
    trace_moe:   { type: 'icon',  emoji: null, icon: 'trace.ico',            tooltip: 'Search with trace.moe' },
    saucenao:    { type: 'icon',  emoji: null, icon: 'saucenao.ico',         tooltip: 'Search with SauceNAO' },
    ascii2d:     { type: 'icon',  emoji: null, icon: 'ascii2d.ico',          tooltip: 'Search with ascii2d' },
    namethatporn:    { type: 'icon', emoji: null, icon: 'namethatporn.ico',       tooltip: 'Search on namethatporn (NSFW)' },
    namethatpornstar:{ type: 'icon', emoji: null, icon: 'namethatpornstar.ico',   tooltip: 'Search on namethatpornstar (NSFW)' },
    wildberries: { type: 'icon',  emoji: null, icon: 'wildberries.ico',       tooltip: 'Wildberries (Google Lens)' },
    ozon:        { type: 'icon',  emoji: null, icon: 'ozon.ico',              tooltip: 'Ozon (Google Lens)' },
    yandexocr:   { type: 'icon',  emoji: null, icon: 'yandexocr.ico',        tooltip: 'OCR with Yandex Translate' },
    yandexocr_replace: { type: 'icon', emoji: null, icon: 'yandexocrre.ico',   tooltip: 'OCR with Yandex Translate and replace original' },
    googleocr:   { type: 'icon',  emoji: null, icon: 'googleocr.ico',        tooltip: 'OCR with Google Translate' },
    googleocr_replace: { type: 'icon', emoji: null, icon: 'googleocrre.ico',   tooltip: 'OCR with Google Translate and replace original' },
    aliexpress:  { type: 'icon',  emoji: null, icon: 'aliexpress.ico',       tooltip: 'AliExpress (Google Lens)' },
    custom1:     { type: 'emoji', emoji: '1️⃣', icon: null, tooltip: 'Save to folder 1' },
    custom2:     { type: 'emoji', emoji: '2️⃣', icon: null, tooltip: 'Save to folder 2' },
    custom3:     { type: 'emoji', emoji: '3️⃣', icon: null, tooltip: 'Save to folder 3' },
    custom4:     { type: 'emoji', emoji: '4️⃣', icon: null, tooltip: 'Save to folder 4' }
  },

  ID_TO_KEY: {
    copy: 'btnCopy', save: 'btnSave', saveas: 'btnSaveAs', copylink: 'btnCopyLink',
    google: 'btnGoogle', yandex: 'btnYandex', tineye: 'btnTinEye',
    pimeyes: 'btnPimeyes', lenso: 'btnLenso', facecheck: 'btnFacecheck',
    iqdb: 'btnIqdb', trace_moe: 'btnTraceMoe', saucenao: 'btnSauceNAO', ascii2d: 'btnAscii2d',
    namethatporn: 'btnNamethatporn', namethatpornstar: 'btnNamethatpornstar',
    wildberries: 'btnWildberries', ozon: 'btnOzon',
    yandexocr: 'btnYandexOcr', yandexocr_replace: 'btnYandexOcrReplace', googleocr: 'btnGoogleOcr', googleocr_replace: 'btnGoogleOcrReplace',
    aliexpress: 'btnAliexpress',
    custom1: 'btnCustom1', custom2: 'btnCustom2', custom3: 'btnCustom3', custom4: 'btnCustom4'
  },

  BUTTON_ORDER: [
    'copy', 'save', 'saveas', 'copylink',
    'custom1', 'custom2', 'custom3', 'custom4',
    'google', 'yandex', 'tineye',
    'pimeyes', 'facecheck', 'lenso',
    'iqdb', 'trace_moe', 'saucenao', 'ascii2d',
    'namethatporn', 'namethatpornstar',
    'wildberries', 'ozon', 'aliexpress',
    'yandexocr', 'yandexocr_replace', 'googleocr', 'googleocr_replace'
  ],

  URL_SERVICES: {
    aliexpress: 'https://lens.google.com/uploadbyurl?url={url}&q=%22aliexpress.ru%22',
    ozon: 'https://lens.google.com/uploadbyurl?url={url}&q=%22ozon.ru%22',
    wildberries: 'https://lens.google.com/uploadbyurl?url={url}&q=%22wildberries.ru%22'
  },

  UPLOAD_SERVICES: {
    ascii2d:     { action: 'searchAscii2d',     uploadAction: 'uploadToAscii2d' },
    trace_moe:   { action: 'searchTraceMoe',    uploadAction: 'uploadToTraceMoe' },
    iqdb:        { action: 'searchIqdb',        uploadAction: 'uploadToIqdb' },
    google:      { action: 'searchGoogle',      uploadAction: 'uploadToGoogleLens' },
    yandex:      { action: 'searchYandex',      uploadAction: 'uploadToYandex' },
    lenso:       { action: 'searchLenso',       uploadAction: 'uploadToLenso' },
    facecheck:   { action: 'searchFacecheck',   uploadAction: 'uploadToFacecheck' },
    pimeyes:     { action: 'searchPimeyes',     uploadAction: 'uploadToPimeyes' },
    wildberries: { action: 'searchWildberries', uploadAction: 'uploadToGoogleLens', shopQuery: '"wildberries.ru"' },
    ozon:        { action: 'searchOzon',        uploadAction: 'uploadToGoogleLens', shopQuery: '"ozon.ru"' },
    aliexpress:  { action: 'searchAliexpress',  uploadAction: 'uploadToGoogleLens', shopQuery: '"aliexpress.ru"' },
    yandexocr:   { action: 'searchYandexOcr',   uploadAction: 'uploadToYandexOcr' },
    yandexocr_replace: { action: 'searchYandexOcrReplace', uploadAction: 'uploadToYandexOcrReplace' },
    googleocr:   { action: 'searchGoogleOcr',   uploadAction: 'uploadToGoogleOcr' },
    googleocr_replace: { action: 'searchGoogleOcrReplace', uploadAction: 'uploadToGoogleOcrReplace' },
    tineye:      { action: 'searchTinEye',      uploadAction: 'uploadToTinEye' },
    saucenao:    { action: 'searchSauceNAO',    uploadAction: 'uploadToSauceNAO' },
    namethatporn:    { action: 'searchNamethatporn',    uploadAction: 'uploadToNamethatporn' },
    namethatpornstar:{ action: 'searchNamethatpornstar',uploadAction: 'uploadToNamethatpornstar' }
  },

  DEFAULT_SETTINGS: {
    globalEnabled: true,
    siteEnabled: true,
    useSiteSettings: false,
    downloadFormat: 'original',
    btnCopy: true,
    btnSave: true, 
    btnSaveAs: false, 
    btnCopyLink: true,
    btnGoogle: false, 
    btnYandex: true, 
    btnTinEye: false,
    btnPimeyes: false, 
    btnLenso: false, 
    btnFacecheck: false,
    btnIqdb: false, 
    btnTraceMoe: false, 
    btnSauceNAO: false, 
    btnAscii2d: false,
    btnNamethatporn: false, 
    btnNamethatpornstar: false,
    btnWildberries: false,
    btnOzon: false,
    btnYandexOcr: false, 
    btnYandexOcrReplace: false, 
    btnGoogleOcr: false, 
    btnGoogleOcrReplace: false,
    btnAliexpress: false,
    btnCustom1: false, 
    btnCustom2: false, 
    btnCustom3: false, 
    btnCustom4: false,
    customFolder1: '', 
    customFolder2: '', 
    customFolder3: '', 
    customFolder4: '',
    showButtons: true, 
    showContextMenu: true,
    position: 'top-left', 
    minImageSize: 500,
    buttonSize: 22,
    buttonOpacity: 100
  },

  ALL_SETTINGS_KEYS: [
    'globalEnabled', 'siteEnabled', 'useSiteSettings', 'downloadFormat',
    'btnCopy','btnSave','btnSaveAs','btnCopyLink',
    'btnGoogle','btnYandex','btnTinEye',
    'btnPimeyes','btnLenso','btnFacecheck',
    'btnIqdb','btnTraceMoe','btnSauceNAO','btnAscii2d',
    'btnNamethatporn','btnNamethatpornstar',
    'btnWildberries','btnOzon',
    'btnYandexOcr','btnYandexOcrReplace','btnGoogleOcr','btnGoogleOcrReplace','btnAliexpress',
    'btnCustom1','btnCustom2','btnCustom3','btnCustom4',
    'customFolder1','customFolder2','customFolder3','customFolder4',
    'showButtons','showContextMenu','position','minImageSize',
    'buttonSize',
    'buttonOpacity'
  ]
};

console.log('[Background] CONFIG loaded successfully');

// ============================================
// ОСНОВНОЙ КОД BACKGROUND.JS
// ============================================

// Загрузка полифилла для Chrome
if (typeof browser === 'undefined') {
  if (typeof importScripts === 'function') {
    try {
      importScripts('webextension-polyfill.js');
      console.log('[Background] Polyfill loaded via importScripts');
    } catch (e) {
      console.error('[Background] Polyfill load failed:', e);
    }
  }
  if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
    globalThis.browser = chrome;
    console.log('[Background] Using chrome as browser fallback');
  }
}

// Теперь CONFIG доступен
// Генерация SEARCH_SERVICES из CONFIG
const SEARCH_SERVICES = (() => {
  const services = {};
  const urls = {
    ascii2d: 'https://ascii2d.net/',
    trace_moe: 'https://trace.moe/',
    iqdb: 'https://iqdb.org/',
    google: 'https://www.google.com/imghp',
    yandex: 'https://yandex.ru/images/search?rpt=imageview',
    lenso: 'https://lenso.ai/',
    facecheck: 'https://facecheck.id/',
    pimeyes: 'https://pimeyes.com/en/panel/search',
    wildberries: 'https://www.google.com/imghp',
    ozon: 'https://www.google.com/imghp',
    aliexpress: 'https://www.google.com/imghp',
    yandexocr: 'https://translate.yandex.ru/ocr',
    yandexocr_replace: 'https://translate.yandex.ru/ocr',
    googleocr: 'https://translate.google.com/?hl=ru&sl=auto&tl=ru&op=images',
    googleocr_replace: 'https://translate.google.com/?hl=ru&sl=auto&tl=ru&op=images',
    tineye: 'https://tineye.com/',
    saucenao: 'https://saucenao.com/',
    namethatporn: 'https://namethatporn.com/search/images.html',
    namethatpornstar: 'https://namethatpornstar.com/search/'
  };
  const typeMap = {};

  for (const [key, svc] of Object.entries(CONFIG.UPLOAD_SERVICES)) {
    services[svc.action] = {
      url: urls[key] || '',
      uploadAction: svc.uploadAction,
      type: typeMap[key] || 'image',
      shopQuery: svc.shopQuery
    };
  }
  return services;
})();

// Очистка слушателей вкладок
const tabListeners = new Map();
const pendingQueries = new Map();

function cleanupTabListeners(tabId) {
  if (tabListeners.has(tabId)) {
    const listener = tabListeners.get(tabId);
    browser.tabs.onUpdated.removeListener(listener);
    tabListeners.delete(tabId);
  }
}

browser.tabs.onRemoved.addListener((tabId) => {
  cleanupTabListeners(tabId);
  pendingQueries.delete(tabId);
});

// Создание контекстного меню
browser.runtime.onInstalled.addListener(() => setupContextMenu());

browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && CONFIG.ALL_SETTINGS_KEYS.some(key => changes[key])) {
    setupContextMenu();
  }
});

async function setupContextMenu() {
  try {
    if (typeof chrome !== 'undefined' && chrome.contextMenus?.removeAll) {
      await new Promise(resolve => chrome.contextMenus.removeAll(resolve));
    } else if (typeof browser !== 'undefined' && browser.contextMenus?.removeAll) {
      await browser.contextMenus.removeAll();
    }
  } catch (e) {
    console.warn('[Background] contextMenus.removeAll failed:', e);
  }

  const items = await browser.storage.sync.get(CONFIG.DEFAULT_SETTINGS);
  const s = { ...CONFIG.DEFAULT_SETTINGS, ...items };
  if (!s.showContextMenu) return;

  const add = (id, title) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.contextMenus?.create) {
        chrome.contextMenus.create({ id, title, contexts: ['image'] }, () => {
          if (chrome.runtime.lastError) {
            // Игнорируем дублирование ID в асинхронном окружении Chrome
          }
        });
      } else {
        browser.contextMenus.create({ id, title, contexts: ['image'] });
      }
    } catch (e) {}
  };

  const sep = (id) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.contextMenus?.create) {
        chrome.contextMenus.create({ id, type: 'separator', contexts: ['image'] }, () => {
          if (chrome.runtime.lastError) {
            // Игнорируем дублирование ID в асинхронном окружении Chrome
          }
        });
      } else {
        browser.contextMenus.create({ id, type: 'separator', contexts: ['image'] });
      }
    } catch (e) {}
  };

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
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.srcUrl) return;
  console.log('[Background] Context menu clicked:', info.menuItemId, 'for URL:', info.srcUrl);

  // Передаем управление в контентный скрипт вкладки
  browser.tabs.sendMessage(tab.id, {
    action: 'contextMenuAction',
    menuItemId: info.menuItemId,
    srcUrl: info.srcUrl
  }).catch(err => {
    console.error('[Background] Failed to send context menu action to tab:', err);
    // Фолбек для скачивания, если вкладка не отвечает (например, на страницах настроек или PDF)
    if (info.menuItemId === 'saveImage') {
      browser.downloads.download({ url: info.srcUrl, saveAs: false });
    } else if (info.menuItemId === 'saveImageAs') {
      browser.downloads.download({ url: info.srcUrl, saveAs: true });
    }
  });
});

// Обработчик сообщений (с возвратом Promise)
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handleMessage = async () => {
    if (message.action === 'getDefaultSettings') {
      return CONFIG.DEFAULT_SETTINGS;
    }

    if (message.action === 'fetchImage') {
      try {
        const base64 = await downloadImageToBase64WithRetry(message.url, 3);
        return { success: true, data: base64 };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    if (message.action === 'downloadImage') {
      try {
        const url = await prepareDownloadUrl(message.url);
        const filename = message.suggestedFilename || getDefaultFilename(message.originalUrl || message.url);

        await browser.downloads.download({
          url: url,
          saveAs: false,
          filename: filename,
          conflictAction: 'uniquify'
        });
        if (url.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(url), 10000);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    if (message.action === 'downloadImageAs') {
      try {
        const url = await prepareDownloadUrl(message.url);
        const filename = message.suggestedFilename || getDefaultFilename(message.originalUrl || message.url);

        await browser.downloads.download({
          url: url,
          saveAs: true,
          filename: filename
        });
        if (url.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(url), 10000);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    if (message.action === 'downloadToFolder') {
      try {
        const url = await prepareDownloadUrl(message.url);
        await downloadToFolderFirefox(url, message.folder, message.originalUrl, message.suggestedFilename);
        if (url.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(url), 10000);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    if (message.action === 'openTab') {
      await browser.tabs.create({ url: message.url, active: message.active ?? false });
      return { success: true };
    }

    if (message.action === 'captureVisibleTab') {
      try {
        const dataUrl = await browser.tabs.captureVisibleTab(null, { format: 'png' });
        return { success: true, data: dataUrl };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    if (message.action === 'getPendingQuery') {
      const tabId = sender.tab ? sender.tab.id : null;
      if (tabId && pendingQueries.has(tabId)) {
        const query = pendingQueries.get(tabId);
        // Не удаляем сразу, так как страница может перезагрузиться пару раз
        return { success: true, query: query };
      }
      return { success: false };
    }

    if (message.action === 'clearPendingQuery') {
      const tabId = sender.tab ? sender.tab.id : null;
      if (tabId) pendingQueries.delete(tabId);
      return { success: true };
    }

    const service = SEARCH_SERVICES[message.action];
    if (service) {
      if (service.type === 'url' && message.url) {
        openTabWithUrlUpload(service.url, service.uploadAction, message.url);
      } else if (message.imageData) {
        openTabWithImageUpload(
          service.url,
          message.imageData,
          service.uploadAction,
          sender.tab ? sender.tab.id : null,
          message.shopQuery || service.shopQuery
        );
      }
      return { success: true };
    }

    if (message.action === 'closeTranslator' && message.tabId) {
      await browser.tabs.remove(message.tabId).catch(() => {});
      return;
    }

    if (message.action === 'ocrReplaceImage' && message.imageData && message.tabId) {
      console.log('[Background] Forwarding OCR result to tab:', message.tabId);
      try {
        await browser.tabs.sendMessage(message.tabId, {
          action: 'replaceImage',
          imageData: message.imageData
        });
      } catch (err) {
        console.error('[Background] Failed to send OCR result:', err);
        setTimeout(() => {
          browser.tabs.sendMessage(message.tabId, {
            action: 'replaceImage',
            imageData: message.imageData
          }).catch(() => console.error('[Background] Retry failed'));
        }, 1000);
      }
      return;
    }
  };

  handleMessage().then(sendResponse);
  return true; // Keep channel open for async response
});

// Вспомогательные функции
function openTabWithImageUpload(url, imageData, actionName, originalTabId, shopQuery) {
  browser.tabs.create({ url, active: false }).then(tab => {
    const translatorTabId = tab.id;
    if (shopQuery) {
      pendingQueries.set(translatorTabId, shopQuery);
    }
    let listenerRemoved = false;
    let loadCount = 0;
    const MAX_LOADS = 2;
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
      browser.tabs.sendMessage(translatorTabId, {
        action: actionName,
        imageData,
        originalTabId,
        replaceOriginal: (actionName === 'uploadToYandexOcrReplace' || actionName === 'uploadToGoogleOcrReplace'),
        translatorTabId,
        shopQuery: shopQuery
      }).catch(() => {
        setTimeout(() => trySend(attempt + 1), 100);
      });
    };

    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId === translatorTabId && changeInfo.status === 'complete') {
        loadCount++;
        console.log(`[Background] Tab ${translatorTabId} loaded (${loadCount}/${MAX_LOADS})`);
        const shouldSend = isPimeyes ? loadCount >= MAX_LOADS : true;
        if (shouldSend) {
          cleanup();
          setTimeout(() => trySend(), isPimeyes ? 1000 : 300);
        }
      }
    };

    browser.tabs.onUpdated.addListener(onUpdated);
    tabListeners.set(translatorTabId, onUpdated);

    const timeout = isPimeyes ? 600000 : 300000;
    setTimeout(() => {
      if (!listenerRemoved) cleanup();
    }, timeout);
  });
}

function openTabWithUrlUpload(url, actionName, imageUrl) {
  browser.tabs.create({ url, active: false }).then(tab => {
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
      browser.tabs.sendMessage(tab.id, { action: actionName, url: imageUrl })
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

    browser.tabs.onUpdated.addListener(onUpdated);
    tabListeners.set(tab.id, onUpdated);

    const timeout = isPimeyes ? 600000 : 300000;
    setTimeout(() => {
      if (!listenerRemoved) cleanup();
    }, timeout);
  });
}

async function downloadImageToBase64WithRetry(url, maxAttempts) {
  if (url.startsWith('data:')) return url;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await downloadImageToBase64(url);
    } catch (error) {
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

async function downloadToFolderFirefox(url, folder, originalUrl, suggestedFilename) {
  let filename = suggestedFilename || getDefaultFilename(originalUrl || url);
  if (!filename.includes('.')) filename += '.png';

  let folderName = (folder || '')
    .replace(/^\/+/, '')
    .replace(/[<>:"\\|?*]/g, '_')
    .trim()
    .replace(/\/+$/, '');

  const fullPath = folderName ? `${folderName}/${filename}` : filename;

  console.log('[Background] Downloading to folder:', fullPath);
  await browser.downloads.download({
    url,
    saveAs: false,
    filename: fullPath,
    conflictAction: 'uniquify'
  });
}

// Вспомогательная функция для обхода ограничений скачивания Base64 в Firefox
async function prepareDownloadUrl(sourceUrl) {
  if (!sourceUrl || !sourceUrl.startsWith('data:')) {
    return sourceUrl;
  }
  // В Chrome MV3 Service Worker метод URL.createObjectURL недоступен,
  // при этом chrome.downloads.download прекрасно принимает data: URL нативно.
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return sourceUrl;
  }
  try {
    const response = await fetch(sourceUrl);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (e) {
    return sourceUrl;
  }
}

function sanitizeFilename(name) {
  if (!name) return '';
  // Удаляем всё, что не буквы, цифры, точки, тире и подчеркивания, чтобы быть максимально безопасными для Chrome
  return name.replace(/[<>:"/\\|?*]/g, '_')
             .replace(/[\x00-\x1F\x7F]/g, '') // Удаляем управляющие символы
             .replace(/^\.+/, '') // Удаляем точки в начале
             .replace(/\s+/g, ' ')
             .trim() || 'image';
}

function getDefaultFilename(url) {
  const defaultName = 'image.png';
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return defaultName;

  try {
    const urlObj = new URL(url);
    const urlPath = urlObj.pathname;
    let filename = urlPath.substring(urlPath.lastIndexOf('/') + 1);

    // Если имя пустое, пробуем взять из параметров
    if (!filename || filename === '/') {
      filename = urlObj.searchParams.get('file') || urlObj.searchParams.get('name') || urlObj.searchParams.get('url')?.split('/').pop();
    }

    if (filename) {
      // Декодируем и очищаем от параметров
      filename = decodeURIComponent(filename).split('?')[0].split('#')[0];

      if (!filename) return defaultName;

      // Ограничение длины для безопасности
      if (filename.length > 100) {
        const extMatch = filename.match(/\.([a-z0-9]+)$/i);
        const ext = extMatch ? extMatch[0] : '';
        filename = filename.substring(0, 100 - ext.length) + ext;
      }

      // Замена расширений видео на изображение
      const videoExts = ['webm', 'mp4', 'ogg', 'mov', 'avi', 'mkv'];
      const parts = filename.split('.');
      if (parts.length > 1) {
        const currentExt = parts[parts.length - 1].toLowerCase();
        if (videoExts.includes(currentExt)) {
          parts[parts.length - 1] = 'png';
          filename = parts.join('.');
        }
        return sanitizeFilename(filename);
      }

      return sanitizeFilename(filename) + '.png';
    }
  } catch (e) {
    console.warn('[Background] Filename extraction failed:', e);
  }

  return defaultName;
}

console.log('[Background] Initialized successfully');
