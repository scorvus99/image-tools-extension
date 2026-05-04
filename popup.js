// Дожидаемся полной загрузки DOM и i18n
let currentHostname = null;
let currentSettings = {};

// Инициализация только после готовности DOM
function initWhenReady() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPopup);
  } else {
    initPopup();
  }
}

function initPopup() {
  // Элементы
  const elements = {
    useSiteSettings: document.getElementById('useSiteSettings'),
    siteHostname: document.getElementById('siteHostname'),
    showButtons: document.getElementById('showButtons'),
    showContextMenu: document.getElementById('showContextMenu'),
    btnCopy: document.getElementById('btnCopy'),
    btnSave: document.getElementById('btnSave'),
    btnSaveAs: document.getElementById('btnSaveAs'),
    btnCopyLink: document.getElementById('btnCopyLink'),
    btnGoogle: document.getElementById('btnGoogle'),
    btnYandex: document.getElementById('btnYandex'),
    btnTinEye: document.getElementById('btnTinEye'),
    btnPimeyes: document.getElementById('btnPimeyes'),
    btnIqdb: document.getElementById('btnIqdb'),
    btnTraceMoe: document.getElementById('btnTraceMoe'),
    btnSauceNAO: document.getElementById('btnSauceNAO'),
    btnAscii2d: document.getElementById('btnAscii2d'),
    btnNamethatporn: document.getElementById('btnNamethatporn'),
    btnNamethatpornstar: document.getElementById('btnNamethatpornstar'),
    btnLenso: document.getElementById('btnLenso'),
    btnFacecheck: document.getElementById('btnFacecheck'),
    btnWildberries: document.getElementById('btnWildberries'),
    btnAliexpress: document.getElementById('btnAliexpress'),
    btnAliexpressUpload: document.getElementById('btnAliexpressUpload'),
    btnYandexOcr: document.getElementById('btnYandexOcr'),
    btnYandexOcrReplace: document.getElementById('btnYandexOcrReplace'),
    btnGoogleOcr: document.getElementById('btnGoogleOcr'),
    btnCustom1: document.getElementById('btnCustom1'),
    btnCustom2: document.getElementById('btnCustom2'),
    btnCustom3: document.getElementById('btnCustom3'),
    btnCustom4: document.getElementById('btnCustom4'),
    customFolder1: document.getElementById('customFolder1'),
    customFolder2: document.getElementById('customFolder2'),
    customFolder3: document.getElementById('customFolder3'),
    customFolder4: document.getElementById('customFolder4'),
    minSize: document.getElementById('minSize'),
    minSizeValue: document.getElementById('minSizeValue')
  };

  // Проверка, что все элементы найдены
  for (const [key, el] of Object.entries(elements)) {
    if (!el) {
      console.warn(`Element not found: ${key}`);
      return;
    }
  }

  const SETTINGS_KEYS = [
    'showButtons','showContextMenu',
    'btnCopy','btnSave','btnSaveAs','btnCopyLink',
    'btnGoogle','btnYandex','btnTinEye',
    'btnPimeyes','btnIqdb','btnTraceMoe','btnSauceNAO','btnAscii2d','btnLenso','btnFacecheck',
    'btnNamethatporn','btnNamethatpornstar',
    'btnWildberries','btnAliexpress','btnAliexpressUpload',
    'btnYandexOcr','btnYandexOcrReplace','btnGoogleOcr',
    'btnCustom1','btnCustom2','btnCustom3','btnCustom4',
    'customFolder1','customFolder2','customFolder3','customFolder4',
    'position','minImageSize'
  ];

  function getSettingsFromDOM() {
    const selectedPos = document.querySelector('input[name="position"]:checked');
    const settings = {};
    SETTINGS_KEYS.forEach(key => {
      if (key === 'position') {
        settings[key] = selectedPos ? selectedPos.value : 'top-left';
      } else if (key === 'minImageSize') {
        settings[key] = parseInt(elements.minSize.value, 10);
      } else if (key.startsWith('customFolder')) {
        settings[key] = elements[key]?.value.trim() || '';
      } else {
        settings[key] = elements[key]?.checked || false;
      }
    });
    return settings;
  }

  function applySettingsToDOM(settings) {
    SETTINGS_KEYS.forEach(key => {
      if (key === 'minImageSize') {
        elements.minSize.value = settings.minImageSize;
        updateRangeLabel();
      } else if (key === 'position') {
        const radio = document.querySelector(`input[name="position"][value="${settings.position}"]`);
        if (radio) radio.checked = true;
      } else if (key.startsWith('customFolder')) {
        if (elements[key]) elements[key].value = settings[key] || '';
      } else {
        if (elements[key]) elements[key].checked = settings[key];
      }
    });
    highlightSelectedPosition();
  }

  function updateRangeLabel() {
    elements.minSizeValue.innerText = elements.minSize.value + 'px';
  }

  function highlightSelectedPosition() {
    document.querySelectorAll('.pos-btn').forEach(btn => {
      const radio = btn.querySelector('input');
      btn.classList.toggle('selected', radio?.checked);
    });
  }

  async function getDefaultSettings() {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'getDefaultSettings' }, settings => {
        resolve(settings || {});
      });
    });
  }

  async function loadSettings() {
    const defaultConfig = await getDefaultSettings();
    const defaults = defaultConfig || {};

    const globalItems = await chrome.storage.sync.get(defaults);
    const globalSettings = { ...defaults, ...globalItems };

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      try {
        currentHostname = new URL(tab.url).hostname;
      } catch (e) {
        currentHostname = null;
      }
    }
    elements.siteHostname.textContent = currentHostname || '…';

    const localData = await chrome.storage.local.get('siteSettings');
    const siteSettings = localData.siteSettings || {};
    const siteOverride = siteSettings[currentHostname];

    if (siteOverride?.enabled) {
      elements.useSiteSettings.checked = true;
      currentSettings = { ...defaults, ...siteOverride };
    } else {
      elements.useSiteSettings.checked = false;
      currentSettings = { ...globalSettings };
    }
    applySettingsToDOM(currentSettings);
  }

  async function saveSettings() {
    const newSettings = getSettingsFromDOM();
    if (elements.useSiteSettings.checked && currentHostname) {
      const localData = await chrome.storage.local.get('siteSettings');
      const siteSettings = localData.siteSettings || {};
      siteSettings[currentHostname] = { ...newSettings, enabled: true };
      await chrome.storage.local.set({ siteSettings });
    } else {
      await chrome.storage.sync.set(newSettings);
    }
  }

  async function onUseSiteToggle() {
    const enabled = elements.useSiteSettings.checked;
    if (!currentHostname) return;

    const defaultConfig = await getDefaultSettings();
    const defaults = defaultConfig || {};
    const globalItems = await chrome.storage.sync.get(defaults);
    const globalSettings = { ...defaults, ...globalItems };

    const localData = await chrome.storage.local.get('siteSettings');
    const siteSettings = localData.siteSettings || {};

    if (enabled) {
      siteSettings[currentHostname] = { ...globalSettings, enabled: true };
      await chrome.storage.local.set({ siteSettings });
      currentSettings = { ...globalSettings };
    } else {
      if (siteSettings[currentHostname]) {
        siteSettings[currentHostname].enabled = false;
        await chrome.storage.local.set({ siteSettings });
      }
      currentSettings = { ...globalSettings };
    }
    applySettingsToDOM(currentSettings);
  }

  // Применяем i18n если загружен
  if (typeof i18n !== 'undefined' && typeof getSystemLanguage === 'function') {
    const lang = getSystemLanguage();
    if (typeof applyI18n === 'function') {
      applyI18n(lang);
    }
  }

  // Загружаем настройки
  loadSettings();

  // Обработчики событий
  document.querySelectorAll('input').forEach(input => {
    if (input.id === 'useSiteSettings') return;
    if (input.type === 'text') return;
    if (input.type === 'radio') {
      input.addEventListener('change', () => {
        highlightSelectedPosition();
        saveSettings();
      });
    } else {
      input.addEventListener('change', saveSettings);
    }
  });

  ['customFolder1','customFolder2','customFolder3','customFolder4'].forEach(id => {
    elements[id]?.addEventListener('input', saveSettings);
  });

  elements.minSize.addEventListener('input', () => {
    updateRangeLabel();
    saveSettings();
  });
  elements.useSiteSettings.addEventListener('change', onUseSiteToggle);
  highlightSelectedPosition();
}

// Запускаем
initWhenReady();