const i18n = {
  ru: {
    site: 'Сайт',
    separateSettings: 'Отдельные настройки',
    actions: '⚡ Действия',
    buttons: 'Кнопки',
    contextMenu: 'Контекстное меню',
    quickFolders: '📂 Быстрые папки',
    imageSearch: '🔍 Поиск по картинке',
    faceSearch: '👤 Поиск по лицу',
    animeSearch: '🎨 Поиск по аниме/рисунку',
    nsfwSearch: '🔞 Поиск NSFW',
    shops: '🛍️ Магазины',
    translateOcr: '🌐 Перевод (OCR)',
    stock: '🖼️ Стоковые изображения',
    inProgress: 'В процессе',
    position: '📍 Положение панели',
    minSize: '📏 Мин. размер изображения',
    buttonSize: '🔘 Размер кнопок',
    buttonOpacity: '🔘 Прозрачность кнопок',
    copy: 'Копировать',
    copyUrl: 'Копировать URL',
    save: 'Сохранить',
    saveAs: 'Сохранить как',
    searchImage: 'Поиск по картинке',
    searchFace: 'Поиск по лицу',
    translate: 'Перевод',
    // плейсхолдеры для быстрых папок
    folderPlaceholder1: 'папка 1',
    folderPlaceholder2: 'папка 2',
    folderPlaceholder3: 'папка 3',
    folderPlaceholder4: 'папка 4'
  },
  en: {
    site: 'Site',
    separateSettings: 'Separate settings',
    actions: '⚡ Actions',
    buttons: 'Buttons',
    contextMenu: 'Context menu',
    quickFolders: '📂 Quick folders',
    imageSearch: '🔍 Image search',
    faceSearch: '👤 Face search',
    animeSearch: '🎨 Anime/art search',
    nsfwSearch: '🔞 NSFW search',
    shops: '🛍️ Shops',
    translateOcr: '🌐 Translate (OCR)',
    stock: '🖼️ Stock images',
    inProgress: 'In progress',
    position: '📍 Panel position',
    minSize: '📏 Min image size',
    buttonSize: '🔘 Button size',
    buttonOpacity: '🔘 Button opacity',
    copy: 'Copy',
    copyUrl: 'Copy URL',
    save: 'Save',
    saveAs: 'Save as',
    searchImage: 'Search by image',
    searchFace: 'Face search',
    translate: 'Translate',
    folderPlaceholder1: 'folder 1',
    folderPlaceholder2: 'folder 2',
    folderPlaceholder3: 'folder 3',
    folderPlaceholder4: 'folder 4'
  }
};

function getSystemLanguage() {
  const lang = (navigator.language || 'en').split('-')[0];
  return i18n[lang] ? lang : 'en';
}

function applyI18n(lang) {
  const strings = i18n[lang] || i18n.en;
  // Обработка текстовых узлов
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (strings[key]) el.textContent = strings[key];
  });
  // Обработка плейсхолдеров
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (strings[key]) el.placeholder = strings[key];
  });
}

const currentLang = getSystemLanguage();
document.addEventListener('DOMContentLoaded', () => applyI18n(currentLang));