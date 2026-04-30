const i18n = {
  ru: {
    site: 'Сайт',
    separateSettings: 'Отдельные настройки',
    buttons: 'Кнопки',
    contextMenu: 'Контекстное меню',
    copy: 'Копировать',
    copyUrl: 'Копировать URL',
    save: 'Сохранить',
    saveAs: 'Сохранить как',
    searchImage: 'Поиск по картинке',
    searchFace: 'Поиск по лицу',
    shops: 'Магазины',
    translate: 'Перевод',
    stock: 'Стоковые изображения',
    inProgress: 'В процессе',
    position: 'Положение',
    minSize: 'Мин. размер',
    aliexpress: 'AliExpress (URL)',
    aliexpressUpload: 'AliExpress (Загрузка)'
  },
  en: {
    site: 'Site',
    separateSettings: 'Separate settings',
    buttons: 'Buttons',
    contextMenu: 'Context menu',
    copy: 'Copy',
    copyUrl: 'Copy URL',
    save: 'Save',
    saveAs: 'Save as',
    searchImage: 'Search by image',
    searchFace: 'Face search',
    shops: 'Shops',
    translate: 'Translate',
    stock: 'Stock images',
    inProgress: 'In progress',
    position: 'Position',
    minSize: 'Min size',
    aliexpress: 'AliExpress (URL)',
    aliexpressUpload: 'AliExpress (Upload)'
  }
};

function getSystemLanguage() {
  const lang = (navigator.language || 'en').split('-')[0];
  return i18n[lang] ? lang : 'en';
}

function applyI18n(lang) {
  const strings = i18n[lang] || i18n.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (strings[key]) el.textContent = strings[key];
  });
}

const currentLang = getSystemLanguage();
document.addEventListener('DOMContentLoaded', () => applyI18n(currentLang));