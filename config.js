const CONFIG = {
  ICONS_PATH: 'icons/',
  
  BUTTONS: {
    copy:        { type: 'emoji', emoji: '📋', icon: null, tooltip: 'Copy image' },
    save:        { type: 'emoji', emoji: '💾', icon: null, tooltip: 'Save image' },
    saveas:      { type: 'emoji', emoji: '📁', icon: null, tooltip: 'Save image as...' },
    copylink:    { type: 'emoji', emoji: '🔗', icon: null, tooltip: 'Copy image link' },
    google:      { type: 'icon',  emoji: null, icon: 'google.ico',    tooltip: 'Search with Google Lens' },
    yandex:      { type: 'icon',  emoji: null, icon: 'yandex.ico',    tooltip: 'Search with Yandex' },
    pimeyes:     { type: 'icon',  emoji: null, icon: 'pimeyes.ico',   tooltip: 'Search with Pimeyes' },
    iqdb:        { type: 'icon',  emoji: null, icon: 'iqdb.ico',      tooltip: 'Search with IQDB' },
    lenso:       { type: 'icon',  emoji: null, icon: 'lenso.ico',     tooltip: 'Search with Lenso.ai' },
    facecheck:   { type: 'icon',  emoji: null, icon: 'facecheck.ico', tooltip: 'Search with FaceCheck.id' },
    wildberries: { type: 'icon',  emoji: null, icon: 'wildberries.ico', tooltip: 'Search with Wildberries' },
    yandexocr:   { type: 'icon',  emoji: null, icon: 'yandexocr.ico', tooltip: 'OCR with Yandex Translate' },
    googleocr:   { type: 'icon',  emoji: null, icon: 'googleocr.ico', tooltip: 'OCR with Google Translate' },
    aliexpress:  { type: 'icon',  emoji: null, icon: 'aliexpress.ico', tooltip: 'Search on AliExpress (URL)' },
    aliexpress_upload: { type: 'icon', emoji: null, icon: 'aliexpress_upload.ico', tooltip: 'Search on AliExpress (Upload)' }
  },

  ID_TO_KEY: {
    copy: 'btnCopy', save: 'btnSave', saveas: 'btnSaveAs', copylink: 'btnCopyLink',
    google: 'btnGoogle', yandex: 'btnYandex', pimeyes: 'btnPimeyes',
    iqdb: 'btnIqdb', lenso: 'btnLenso', facecheck: 'btnFacecheck',
    wildberries: 'btnWildberries', yandexocr: 'btnYandexOcr', googleocr: 'btnGoogleOcr',
    aliexpress: 'btnAliexpress', aliexpress_upload: 'btnAliexpressUpload'
  },

  BUTTON_ORDER: ['copy', 'save', 'saveas', 'copylink', 'google', 'yandex', 'pimeyes', 'iqdb', 'lenso', 'facecheck', 'wildberries', 'yandexocr', 'googleocr', 'aliexpress', 'aliexpress_upload'],

  URL_SERVICES: {
    google: 'https://lens.google.com/uploadbyurl?url={url}',
    yandex: 'https://yandex.ru/images/search?url={url}&rpt=imageview',
    iqdb: 'https://iqdb.org/?url={url}',
    aliexpress: 'https://lens.google.com/uploadbyurl?url={url}&hl=ru&site=aliexpress.ru'
  },

  UPLOAD_SERVICES: {
    lenso:       { action: 'searchLenso',       uploadAction: 'uploadToLenso' },
    facecheck:   { action: 'searchFacecheck',   uploadAction: 'uploadToFacecheck' },
    pimeyes:     { action: 'searchPimeyes',     uploadAction: 'uploadToPimeyes' },
    wildberries: { action: 'searchWildberries', uploadAction: 'uploadToWildberries' },
    yandexocr:   { action: 'searchYandexOcr',   uploadAction: 'uploadToYandexOcr' },
    googleocr:   { action: 'searchGoogleOcr',   uploadAction: 'uploadToGoogleOcr' },
    aliexpress_upload: { action: 'searchAliexpressUpload', uploadAction: 'uploadToAliexpress' }
  },

  DEFAULT_SETTINGS: {
    btnCopy: true, btnSave: true, btnSaveAs: false, btnCopyLink: true,
    btnGoogle: false, btnYandex: true,
    btnPimeyes: false, btnIqdb: false,
    btnLenso: false, btnFacecheck: false, btnWildberries: false,
    btnYandexOcr: false, btnGoogleOcr: false,
    btnAliexpress: false, btnAliexpressUpload: false,
    showButtons: true, showContextMenu: true,
    position: 'top-left', minImageSize: 200
  },

  ALL_SETTINGS_KEYS: ['btnCopy','btnSave','btnSaveAs','btnCopyLink','btnGoogle','btnYandex','btnPimeyes','btnIqdb','btnLenso','btnFacecheck','btnWildberries','btnYandexOcr','btnGoogleOcr','btnAliexpress','btnAliexpressUpload','showButtons','showContextMenu','position','minImageSize']
};