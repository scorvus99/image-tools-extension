const i18n = {
  ru: {
    // Основные
    site: 'Сайт',
    separateSettings: 'Отдельные настройки',
    buttons: 'Кнопки',
    contextMenu: 'Контекстное меню',
    actions: 'Действия',
    
    // Действия с изображениями
    copy: 'Копировать',
    copyUrl: 'Копировать URL',
    save: 'Сохранить',
    saveAs: 'Сохранить как',
    quickFolders: 'Быстрые папки',
    folderPlaceholder: 'папка',
    
    // Поиск
    searchByImage: 'Поиск по картинке',
    searchByFace: 'Поиск по лицу',
    searchAnime: 'Поиск по аниме/рисунку',
    searchNSFW: 'Поиск NSFW',
    
    // Магазины и OCR
    shops: 'Магазины',
    translate: 'Перевод (OCR)',
    stock: 'Стоковые изображения',
    inProgress: 'В процессе',
    
    // Настройки отображения
    panelPosition: 'Положение панели',
    minImageSize: 'Мин. размер изображения',
    buttonSize: 'Размер кнопок',
    buttonOpacity: 'Прозрачность кнопок',
    
    // Бренды
    googleLens: 'Google Lens',
    yandex: 'Yandex',
    tineye: 'TinEye',
    pimeyes: 'Pimeyes',
    facecheck: 'FaceCheck.id',
    lenso: 'Lenso.ai',
    iqdb: 'IQDB',
    traceMoe: 'trace.moe',
    saucenao: 'SauceNAO',
    ascii2d: 'ascii2d',
    namethatporn: 'Namethatporn',
    namethatpornstar: 'Namethatpornstar',
    wildberries: 'Wildberries (Google)',
    ozon: 'Ozon (Google)',
    aliexpress: 'AliExpress (Google)',
    googleTranslate: 'Google Translate',
    googleTranslateReplace: 'Google Translate (Replace)',
    yandexTranslate: 'Yandex Translate',
    yandexTranslateReplace: 'Yandex Translate (Replace)',
    
    // Состояния
    loading: 'Загрузка...',
    success: 'Успешно!',
    error: 'Ошибка'
  },
  en: {
    // Основные
    site: 'Site',
    separateSettings: 'Separate settings',
    buttons: 'Buttons',
    contextMenu: 'Context menu',
    actions: 'Actions',
    
    // Действия с изображениями
    copy: 'Copy',
    copyUrl: 'Copy URL',
    save: 'Save',
    saveAs: 'Save as',
    quickFolders: 'Quick folders',
    folderPlaceholder: 'folder',
    
    // Поиск
    searchByImage: 'Search by image',
    searchByFace: 'Face search',
    searchAnime: 'Anime/Art search',
    searchNSFW: 'NSFW search',
    
    // Магазины и OCR
    shops: 'Shops',
    translate: 'Translate (OCR)',
    stock: 'Stock images',
    inProgress: 'In progress',
    
    // Настройки отображения
    panelPosition: 'Panel position',
    minImageSize: 'Min image size',
    buttonSize: 'Button size',
    buttonOpacity: 'Button opacity',
    
    // Бренды
    googleLens: 'Google Lens',
    yandex: 'Yandex',
    tineye: 'TinEye',
    pimeyes: 'Pimeyes',
    facecheck: 'FaceCheck.id',
    lenso: 'Lenso.ai',
    iqdb: 'IQDB',
    traceMoe: 'trace.moe',
    saucenao: 'SauceNAO',
    ascii2d: 'ascii2d',
    namethatporn: 'Namethatporn',
    namethatpornstar: 'Namethatpornstar',
    wildberries: 'Wildberries (Google)',
    ozon: 'Ozon (Google)',
    aliexpress: 'AliExpress (Google)',
    googleTranslate: 'Google Translate',
    googleTranslateReplace: 'Google Translate (Replace)',
    yandexTranslate: 'Yandex Translate',
    yandexTranslateReplace: 'Yandex Translate (Replace)',
    
    // Состояния
    loading: 'Loading...',
    success: 'Success!',
    error: 'Error'
  }
};

let currentLang = 'en';

function getSystemLanguage() {
  const lang = (navigator.language || 'en').split('-')[0];
  return i18n[lang] ? lang : 'en';
}

function applyI18n(lang) {
  currentLang = lang || getSystemLanguage();
  const strings = i18n[currentLang] || i18n.en;
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (strings[key] !== undefined) {
      el.textContent = strings[key];
    }
  });
  
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (strings[key] !== undefined) {
      el.placeholder = strings[key];
    }
  });
  
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (strings[key] !== undefined) {
      el.title = strings[key];
    }
  });
  
  return currentLang;
}

function getCurrentLang() {
  return currentLang;
}

// Автоматическое применение при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => applyI18n());
} else {
  applyI18n();
}