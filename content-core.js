// Модуль управления настройками и хранилищем
const Settings = {
  data: { ...CONFIG.DEFAULT_SETTINGS },

  async load() {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'getDefaultSettings' }, defaultSettings => {
        const defaults = defaultSettings || CONFIG.DEFAULT_SETTINGS;
        chrome.storage.sync.get(defaults, globalItems => {
          let merged = { ...defaults, ...globalItems };
          const hostname = window.location.hostname;
          chrome.storage.local.get('siteSettings', localData => {
            const siteSettings = localData.siteSettings;
            if (siteSettings && siteSettings[hostname] && siteSettings[hostname].enabled) {
              Object.assign(merged, siteSettings[hostname]);
            }
            this.data = merged;
            resolve();
          });
        });
      });
    });
  },

  setupListener(onChange) {
    chrome.storage.onChanged.addListener((changes, area) => {
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