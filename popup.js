let currentHostname = null;
let currentSettings = {};

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
  btnPimeyes: document.getElementById('btnPimeyes'),
  btnIqdb: document.getElementById('btnIqdb'),
  btnLenso: document.getElementById('btnLenso'),
  btnFacecheck: document.getElementById('btnFacecheck'),
  btnWildberries: document.getElementById('btnWildberries'),
  btnAliexpress: document.getElementById('btnAliexpress'),
  btnAliexpressUpload: document.getElementById('btnAliexpressUpload'),
  btnYandexOcr: document.getElementById('btnYandexOcr'),
  btnGoogleOcr: document.getElementById('btnGoogleOcr'),
  minSize: document.getElementById('minSize'),
  minSizeValue: document.getElementById('minSizeValue')
};

const SETTINGS_KEYS = ['showButtons','showContextMenu','btnCopy','btnSave','btnSaveAs','btnCopyLink','btnGoogle','btnYandex','btnPimeyes','btnIqdb','btnLenso','btnFacecheck','btnWildberries','btnAliexpress','btnAliexpressUpload','btnYandexOcr','btnGoogleOcr','position','minImageSize'];

async function getDefaultSettings() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ action: 'getDefaultSettings' }, settings => {
      resolve(settings || {
        btnCopy: true, btnSave: true, btnSaveAs: false, btnCopyLink: true,
        btnGoogle: false, btnYandex: true,
        btnPimeyes: false, btnIqdb: false,
        btnLenso: false, btnFacecheck: false, btnWildberries: false,
        btnYandexOcr: false, btnGoogleOcr: false,
        showButtons: true, showContextMenu: true,
        position: 'top-left', minImageSize: 200
      });
    });
  });
}

function getSettingsFromDOM() {
  const selectedPos = document.querySelector('input[name="position"]:checked');
  const settings = {};
  SETTINGS_KEYS.forEach(key => {
    if (key === 'position') {
      settings[key] = selectedPos ? selectedPos.value : 'top-left';
    } else if (key === 'minImageSize') {
      settings[key] = parseInt(elements.minSize.value, 10);
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
    } else {
      if (elements[key]) elements[key].checked = settings[key];
    }
  });
  highlightSelectedPosition();
  updateDisplayButtons();
}

function updateDisplayButtons() {
  const showButtonsLabel = document.getElementById('showButtonsLabel');
  const showContextMenuLabel = document.getElementById('showContextMenuLabel');
  if (showButtonsLabel) showButtonsLabel.classList.toggle('selected', elements.showButtons.checked);
  if (showContextMenuLabel) showContextMenuLabel.classList.toggle('selected', elements.showContextMenu.checked);
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

async function loadSettings() {
  const defaults = await getDefaultSettings();
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
  updateDisplayButtons();
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

  const defaults = await getDefaultSettings();
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

document.addEventListener('DOMContentLoaded', async () => {
  const lang = (navigator.language || 'en').split('-')[0];
  const strings = window.i18n ? (window.i18n[lang] || window.i18n.en) : null;
  if (strings) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (strings[key]) el.textContent = strings[key];
    });
  }

  await loadSettings();

  document.querySelectorAll('input').forEach(input => {
    if (input.id === 'useSiteSettings') return;
    input.addEventListener('change', saveSettings);
  });
  elements.minSize.addEventListener('input', () => {
    updateRangeLabel();
    saveSettings();
  });
  elements.useSiteSettings.addEventListener('change', onUseSiteToggle);
  highlightSelectedPosition();
});