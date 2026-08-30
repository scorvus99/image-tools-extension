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
    globalEnabled: document.getElementById('globalEnabled'),
    siteEnabled: document.getElementById('siteEnabled'),
    useSiteSettings: document.getElementById('useSiteSettings'),
    siteHostname: document.getElementById('siteHostname'),
    formatOriginal: document.getElementById('formatOriginal'),
    formatJpg: document.getElementById('formatJpg'),
    formatPng: document.getElementById('formatPng'),
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
    btnOzon: document.getElementById('btnOzon'),
    btnAliexpress: document.getElementById('btnAliexpress'),
    btnYandexOcr: document.getElementById('btnYandexOcr'),
    btnYandexOcrReplace: document.getElementById('btnYandexOcrReplace'),
    btnGoogleOcr: document.getElementById('btnGoogleOcr'),
    btnGoogleOcrReplace: document.getElementById('btnGoogleOcrReplace'),
    btnCustom1: document.getElementById('btnCustom1'),
    btnCustom2: document.getElementById('btnCustom2'),
    btnCustom3: document.getElementById('btnCustom3'),
    btnCustom4: document.getElementById('btnCustom4'),
    customFolder1: document.getElementById('customFolder1'),
    customFolder2: document.getElementById('customFolder2'),
    customFolder3: document.getElementById('customFolder3'),
    customFolder4: document.getElementById('customFolder4'),
    minSize: document.getElementById('minSize'),
    minSizeValue: document.getElementById('minSizeValue'),
    buttonSize: document.getElementById('buttonSize'),
    buttonSizeValue: document.getElementById('buttonSizeValue'),
    buttonOpacity: document.getElementById('buttonOpacity'),
    buttonOpacityValue: document.getElementById('buttonOpacityValue')
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
    'btnWildberries','btnOzon','btnAliexpress',
    'btnYandexOcr','btnYandexOcrReplace','btnGoogleOcr','btnGoogleOcrReplace',
    'btnCustom1','btnCustom2','btnCustom3','btnCustom4',
    'customFolder1','customFolder2','customFolder3','customFolder4',
    'position','minImageSize','buttonSize','buttonOpacity'
  ];

  function getSettingsFromDOM() {
    const selectedPos = document.querySelector('input[name="position"]:checked');
    const settings = {};

    let selectedFormat = 'original';
    if (elements.formatJpg.checked) selectedFormat = 'jpg';
    else if (elements.formatPng.checked) selectedFormat = 'png';

    SETTINGS_KEYS.forEach(key => {
      if (key === 'position') {
        settings[key] = selectedPos ? selectedPos.value : 'top-left';
      } else if (key === 'minImageSize') {
        settings[key] = parseInt(elements.minSize.value, 10);
      } else if (key === 'buttonSize') {
        settings[key] = parseInt(elements.buttonSize.value, 10);
      } else if (key === 'buttonOpacity') {
        settings[key] = parseInt(elements.buttonOpacity.value, 10);
      } else if (key.startsWith('customFolder')) {
        settings[key] = elements[key]?.value.trim() || '';
      } else {
        settings[key] = elements[key]?.checked || false;
      }
    });

    settings.downloadFormat = selectedFormat;
    return settings;
  }

  function applySettingsToDOM(settings) {
    const format = settings.downloadFormat || 'original';
    elements.formatOriginal.checked = (format === 'original');
    elements.formatJpg.checked = (format === 'jpg');
    elements.formatPng.checked = (format === 'png');

    SETTINGS_KEYS.forEach(key => {
      if (key === 'minImageSize') {
        elements.minSize.value = settings.minImageSize;
        updateRangeLabel();
      } else if (key === 'buttonSize') {
        elements.buttonSize.value = settings.buttonSize || 22;
        updateButtonSizeLabel();
      } else if (key === 'buttonOpacity') {
        elements.buttonOpacity.value = settings.buttonOpacity ?? 100;
        updateOpacityLabel();
      } else if (key === 'position') {
        const radio = document.querySelector(`input[name="position"][value="${settings.position}"]`);
        if (radio) radio.checked = true;
      } else if (key.startsWith('customFolder')) {
        if (elements[key]) elements[key].value = settings[key] || '';
      } else {
        if (elements[key]) elements[key].checked = !!settings[key];
      }
    });
    highlightSelectedPosition();
  }

  function updateRangeLabel() {
    elements.minSizeValue.innerText = elements.minSize.value + 'px';
  }

  function updateButtonSizeLabel() {
    elements.buttonSizeValue.innerText = elements.buttonSize.value + 'px';
  }

  function updateOpacityLabel() {
    elements.buttonOpacityValue.innerText = elements.buttonOpacity.value + '%';
  }

  function highlightSelectedPosition() {
    document.querySelectorAll('.pos-btn').forEach(btn => {
      const radio = btn.querySelector('input');
      btn.classList.toggle('selected', radio?.checked);
    });
  }

  async function getDefaultSettings() {
    const settings = await browser.runtime.sendMessage({ action: 'getDefaultSettings' });
    return settings || {};
  }

  async function loadSettings() {
    const defaultConfig = await getDefaultSettings();
    const defaults = defaultConfig || {};

    const globalItems = await browser.storage.sync.get(defaults);
    const globalSettings = { ...defaults, ...globalItems };

    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      try {
        currentHostname = new URL(tab.url).hostname;
      } catch (e) {
        currentHostname = null;
      }
    }
    elements.siteHostname.textContent = currentHostname || '…';

    // 1. по умолчанию определяет работу расширения на всех сайтах
    elements.globalEnabled.checked = globalSettings.globalEnabled ?? true;

    const localData = await browser.storage.local.get('siteSettings');
    const siteSettings = localData.siteSettings || {};
    const siteData = currentHostname ? (siteSettings[currentHostname] || {}) : {};

    // 2. сайт вкл (всегда доступна, позволяет включить сайт отдельно даже при глобальном выкл)
    elements.siteEnabled.disabled = false;
    if (siteData.siteEnabled !== undefined) {
      elements.siteEnabled.checked = siteData.siteEnabled;
    } else {
      elements.siteEnabled.checked = elements.globalEnabled.checked;
    }

    // 3. отдельные настройки (UI)
    elements.useSiteSettings.checked = !!siteData.useSiteSettings;

    if (elements.useSiteSettings.checked) {
      currentSettings = { ...defaults, ...siteData };
    } else {
      currentSettings = { ...globalSettings };
    }
    applySettingsToDOM(currentSettings);
  }

  async function saveSettings() {
    const newSettings = getSettingsFromDOM();

    // Всегда сохраняем глобальный статус "по умолчанию" в sync
    await browser.storage.sync.set({
      globalEnabled: elements.globalEnabled.checked,
      downloadFormat: newSettings.downloadFormat
    });

    if (currentHostname) {
      const localData = await browser.storage.local.get('siteSettings');
      const siteSettings = localData.siteSettings || {};
      const currentSiteData = siteSettings[currentHostname] || {};

      siteSettings[currentHostname] = {
        ...currentSiteData,
        ...(elements.useSiteSettings.checked ? newSettings : {}),
        siteEnabled: elements.siteEnabled.checked,
        useSiteSettings: elements.useSiteSettings.checked
      };

      await browser.storage.local.set({ siteSettings });
    }

    if (!elements.useSiteSettings.checked) {
      await browser.storage.sync.set(newSettings);
    }
  }

  // Настройка единственного выбора формата скачивания
  const formatBoxes = [elements.formatOriginal, elements.formatJpg, elements.formatPng];
  formatBoxes.forEach(box => {
    box.addEventListener('change', () => {
      if (box.checked) {
        formatBoxes.forEach(other => {
          if (other !== box) other.checked = false;
        });
      } else {
        box.checked = true;
      }
      saveSettings();
    });
  });

  // Применяем i18n если загружен
  if (typeof i18n !== 'undefined' && typeof getSystemLanguage === 'function') {
    const lang = getSystemLanguage();
    if (typeof applyI18n === 'function') {
      applyI18n(lang);
    }
  }

  // Загружаем настройки
  loadSettings();

  // Обработчики событий для элементов UI
  document.querySelectorAll('input').forEach(input => {
    if (['useSiteSettings', 'siteEnabled', 'globalEnabled', 'formatOriginal', 'formatJpg', 'formatPng'].includes(input.id)) return;
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

  // Обработчик 1: по умолчанию
  elements.globalEnabled.addEventListener('change', async () => {
    const globalOn = elements.globalEnabled.checked;
    if (currentHostname) {
      const localData = await browser.storage.local.get('siteSettings');
      const siteSettings = localData.siteSettings || {};
      const siteData = siteSettings[currentHostname] || {};
      // Если сайт не имел индивидуально сохраненного siteEnabled, он следует за глобальным
      if (siteData.siteEnabled === undefined) {
        elements.siteEnabled.checked = globalOn;
      }
    } else {
      elements.siteEnabled.checked = globalOn;
    }
    await saveSettings();
  });

  // Обработчик 2: сайт вкл
  elements.siteEnabled.addEventListener('change', async () => {
    // Пользователь может явно включить/выключить сайт, даже если "по умолчанию" выключено
    await saveSettings();
  });

  // Обработчик 3: отдельные настройки
  elements.useSiteSettings.addEventListener('change', async () => {
    const isCustom = elements.useSiteSettings.checked;
    if (!currentHostname) return;

    const defaultConfig = await getDefaultSettings();
    const defaults = defaultConfig || {};
    const globalItems = await browser.storage.sync.get(defaults);
    const globalSettings = { ...defaults, ...globalItems };

    const localData = await browser.storage.local.get('siteSettings');
    const siteSettings = localData.siteSettings || {};
    const siteData = siteSettings[currentHostname] || {};

    if (isCustom) {
      currentSettings = { ...globalSettings, ...siteData };
    } else {
      currentSettings = { ...globalSettings };
    }
    applySettingsToDOM(currentSettings);
    await saveSettings();
  });

  ['customFolder1','customFolder2','customFolder3','customFolder4'].forEach(id => {
    elements[id]?.addEventListener('input', saveSettings);
  });

  elements.minSize.addEventListener('input', () => {
    updateRangeLabel();
    saveSettings();
  });

  elements.buttonSize.addEventListener('input', () => {
    updateButtonSizeLabel();
    saveSettings();
  });

  elements.buttonOpacity.addEventListener('input', () => {
    updateOpacityLabel();
    saveSettings();
  });

  highlightSelectedPosition();
}

// Запускаем
initWhenReady();