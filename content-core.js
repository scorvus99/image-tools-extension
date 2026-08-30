if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
  window.browser = chrome;
}

// Модуль управления настройками и хранилищем
const Settings = {
  data: { ...CONFIG.DEFAULT_SETTINGS },
  isEnabled: true,

  async load() {
    const defaultSettings = await browser.runtime.sendMessage({ action: 'getDefaultSettings' });
    const defaults = defaultSettings || CONFIG.DEFAULT_SETTINGS;
    const globalItems = await browser.storage.sync.get(defaults);
    let merged = { ...defaults, ...globalItems };
    const hostname = window.location.hostname;
    const localData = await browser.storage.local.get('siteSettings');
    const siteSettings = localData.siteSettings;

    // 1. По умолчанию для всех сайтов
    const globalOn = merged.globalEnabled ?? true;

    // 2. Статус работы для текущего сайта
    let siteOn = globalOn;

    if (siteSettings && siteSettings[hostname]) {
      const siteData = siteSettings[hostname];
      // Если у сайта задан явный статус сайт вкл (работает даже при глобальном выкл)
      if (siteData.siteEnabled !== undefined) {
        siteOn = siteData.siteEnabled;
      }
      // 3. Отдельные настройки (UI)
      if (siteData.useSiteSettings) {
        Object.assign(merged, siteData);
      }
    }

    this.data = merged;
    this.isEnabled = siteOn;
  },

  setupListener(onChange) {
    browser.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' || (area === 'local' && changes.siteSettings)) {
        this.load().then(onChange);
      }
    });
  },

  get(key) {
    if (!this.isEnabled) {
      if (key === 'showButtons' || key === 'showContextMenu') return false;
    }
    return this.data[key];
  }
};