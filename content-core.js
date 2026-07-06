// Модуль управления настройками и хранилищем
const Settings = {
  data: { ...CONFIG.DEFAULT_SETTINGS },

  async load() {
    const defaultSettings = await browser.runtime.sendMessage({ action: 'getDefaultSettings' });
    const defaults = defaultSettings || CONFIG.DEFAULT_SETTINGS;
    const globalItems = await browser.storage.sync.get(defaults);
    let merged = { ...defaults, ...globalItems };
    const hostname = window.location.hostname;
    const localData = await browser.storage.local.get('siteSettings');
    const siteSettings = localData.siteSettings;
    if (siteSettings && siteSettings[hostname] && siteSettings[hostname].enabled) {
      Object.assign(merged, siteSettings[hostname]);
    }
    this.data = merged;
  },

  setupListener(onChange) {
    browser.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync') {
        let changed = false;
        for (let key of CONFIG.ALL_SETTINGS_KEYS) {
          if (changes[key]) {
            this.data[key] = changes[key].newValue;
            changed = true;
          }
        }
        if (changed) onChange();
      } else if (area === 'local' && changes.siteSettings) {
        this.load().then(onChange);
      }
    });
  },

  get(key) {
    return this.data[key];
  }
};