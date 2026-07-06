// Модуль UI: позиционирование, события мыши, отображение
const UI = {
  toolbar: null,
  hideTimeout: null,
  isStandaloneImage: false,
  standaloneShown: false,

  build() {
    if (this.toolbar) this.toolbar.remove();
    this.toolbar = document.createElement('div');
    this.toolbar.id = 'ext-img-toolbar';
    this.toolbar.style.cssText = `
      position: fixed;
      z-index: 2147483647;
      display: none;
      gap: 0px;
      flex-direction: column;
      pointer-events: auto;
    `;

    ButtonFactory.buttons = {};
    CONFIG.BUTTON_ORDER.forEach(id => {
      const key = CONFIG.ID_TO_KEY[id];
      if (Settings.get(key)) {
        ButtonFactory.buttons[id] = ButtonFactory.create(id);
        this.toolbar.appendChild(ButtonFactory.buttons[id]);
      }
    });
    document.body.appendChild(this.toolbar);
    this.attachEvents();
  },

  attachEvents() {
    const handlerMap = {
      copy:      (e) => { e.stopPropagation(); e.preventDefault(); Handlers.copy(); },
      save:      (e) => { e.stopPropagation(); e.preventDefault(); Handlers.save(); },
      saveas:    (e) => { e.stopPropagation(); e.preventDefault(); Handlers.saveAs(); },
      copylink:  (e) => { e.stopPropagation(); e.preventDefault(); Handlers.copyLink(); },
      custom1: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.customSave('customFolder1', 'custom1'); },
      custom2: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.customSave('customFolder2', 'custom2'); },
      custom3: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.customSave('customFolder3', 'custom3'); },
      custom4: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.customSave('customFolder4', 'custom4'); },
      google:    (e) => { e.stopPropagation(); e.preventDefault(); Handlers.urlSearch('google', 'google'); },
      yandex:    (e) => { e.stopPropagation(); e.preventDefault(); Handlers.urlSearch('yandex', 'yandex'); },
      tineye:    (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('tineye', 'tineye'); },
      pimeyes:   (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('pimeyes', 'pimeyes'); },
      facecheck: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('facecheck', 'facecheck'); },
      lenso:     (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('lenso', 'lenso'); },
      iqdb:      (e) => { e.stopPropagation(); e.preventDefault(); Handlers.urlSearch('iqdb', 'iqdb'); },
      trace_moe: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.urlSearch('trace_moe', 'trace_moe'); },
      saucenao:  (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('saucenao', 'saucenao'); },
      ascii2d:   (e) => { e.stopPropagation(); e.preventDefault(); Handlers.urlSearch('ascii2d', 'ascii2d'); },
      namethatporn:    (e) => { e.stopPropagation(); e.preventDefault(); Handlers.urlToFieldSearch('namethatporn', 'namethatporn'); },
      namethatpornstar:(e) => { e.stopPropagation(); e.preventDefault(); Handlers.urlToFieldSearch('namethatpornstar', 'namethatpornstar'); },
      wildberries: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.urlSearch('wildberries', 'wildberries'); },
      ozon:        (e) => { e.stopPropagation(); e.preventDefault(); Handlers.urlSearch('ozon', 'ozon'); },
      yandexocr: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('yandexocr', 'yandexocr'); },
      yandexocr_replace: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('yandexocr_replace', 'yandexocr_replace'); },
      googleocr: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('googleocr', 'googleocr'); },
      googleocr_replace: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('googleocr_replace', 'googleocr_replace'); },
      aliexpress: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.urlSearch('aliexpress', 'aliexpress'); }
    };

    Object.entries(ButtonFactory.buttons).forEach(([id, btn]) => {
      btn.addEventListener('click', handlerMap[id]);
    });
  },

  position(img) {
    if (!this.toolbar || !img) return;

    const rect = img.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const offset = 5;
    const pos = Settings.get('position');

    const wasHidden = this.toolbar.style.display === 'none' || this.toolbar.style.visibility === 'hidden';
    if (wasHidden) {
      this.toolbar.style.visibility = 'hidden';
      this.toolbar.style.display = 'flex';
    }

    const tRect = this.toolbar.getBoundingClientRect();

    if (wasHidden) {
      this.toolbar.style.display = 'none';
      this.toolbar.style.visibility = 'visible';
    }

    if (tRect.width === 0 || tRect.height === 0) return;

    let top, left;
    if (pos === 'top-left') {
      top = rect.top + offset;
      left = rect.left + offset;
    } else if (pos === 'top-right') {
      top = rect.top + offset;
      left = rect.right - tRect.width - offset;
    } else if (pos === 'bottom-left') {
      top = rect.bottom - tRect.height - offset;
      left = rect.left + offset;
    } else { // bottom-right
      top = rect.bottom - tRect.height - offset;
      left = rect.right - tRect.width - offset;
    }

    const maxTop = window.innerHeight - tRect.height - offset;
    const maxLeft = window.innerWidth - tRect.width - offset;
    top = Math.max(offset, Math.min(top, maxTop));
    left = Math.max(offset, Math.min(left, maxLeft));

    this.toolbar.style.top = top + 'px';
    this.toolbar.style.left = left + 'px';
  },

  show(img) {
    if (!this.toolbar || Object.keys(ButtonFactory.buttons).length === 0) return;
    if (!Settings.get('showButtons')) return;

    if (img.naturalWidth < Settings.get('minImageSize') ||
        img.naturalHeight < Settings.get('minImageSize')) return;

    Handlers.setImage(img);

    if (this.isStandaloneImage && this.standaloneShown) {
      return;
    }

    if (!this.isStandaloneImage) {
      clearTimeout(this.hideTimeout);
    }

    this.position(img);

    this.toolbar.style.display = 'flex';

    if (this.isStandaloneImage) {
      this.standaloneShown = true;
    }
  },

  hide() {
    if (this.toolbar) {
      this.toolbar.style.display = 'none';
      this.standaloneShown = false;
    }
    clearTimeout(this.hideTimeout);
  },

  setupMouseEvents() {
    this.detectStandaloneImage();

    document.addEventListener('mouseover', (e) => {
      const t = e.target;
      if (t.tagName === 'IMG' && t.naturalWidth > 0 && t.naturalHeight > 0) {
        if (this.isStandaloneImage && t === document.images[0]) return;
        this.show(t);
      }
    }, true);

    if (!this.isStandaloneImage) {
      document.addEventListener('mouseout', (e) => {
        if (e.target.tagName === 'IMG') {
          clearTimeout(this.hideTimeout);
          this.hideTimeout = setTimeout(() => {
            if (this.toolbar?.matches(':hover') || Handlers.currentImg?.matches(':hover')) return;
            this.hide();
          }, 150);
        }
      }, true);

      if (this.toolbar) {
        this.toolbar.addEventListener('mouseenter', () => {
          clearTimeout(this.hideTimeout);
        });

        this.toolbar.addEventListener('mouseleave', () => {
          this.hideTimeout = setTimeout(() => {
            if (Handlers.currentImg?.matches(':hover')) return;
            this.hide();
          }, 150);
        });
      }
    }

    window.addEventListener('scroll', () => {
      if (this.toolbar && this.toolbar.style.display !== 'none' && Handlers.currentImg) {
        this.position(Handlers.currentImg);
      }
    }, true);

    window.addEventListener('resize', () => {
      if (this.toolbar && this.toolbar.style.display !== 'none' && Handlers.currentImg) {
        this.position(Handlers.currentImg);
      }
    });

    if (this.isStandaloneImage) {
      document.addEventListener('mouseleave', () => {
        this.hide();
      });

      document.addEventListener('mouseenter', () => {
        if (Handlers.currentImg) {
          this.show(Handlers.currentImg);
        }
      });
    }
  },

  detectStandaloneImage() {
    this.isStandaloneImage = false;

    const isImageUrl = /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico)(\?.*)?$/i.test(window.location.pathname);
    const contentTypeIsImage = document.contentType?.startsWith('image/');

    if ((isImageUrl || contentTypeIsImage) && document.images.length === 1) {
      const soloImg = document.images[0];
      let onlyImage = true;

      for (const child of document.body.children) {
        if (child === soloImg) continue;
        if (child.tagName === 'STYLE' || child.tagName === 'SCRIPT' || child.tagName === 'META' || child.tagName === 'LINK') {
          continue;
        }
        if (child.offsetParent !== null || (child.innerText && child.innerText.trim())) {
          onlyImage = false;
          break;
        }
      }

      if (onlyImage) {
        this.isStandaloneImage = true;
        console.log('[Image Tools] Detected standalone image page');

        const showStandalonePanel = () => {
          if (this.standaloneShown) return;
          if (soloImg.naturalWidth > 0 && soloImg.naturalHeight > 0) {
            this.show(soloImg);
          }
        };

        if (soloImg.complete) {
          setTimeout(showStandalonePanel, 300);
        } else {
          soloImg.addEventListener('load', () => setTimeout(showStandalonePanel, 300));
        }

        setTimeout(() => {
          if (!this.standaloneShown) {
            showStandalonePanel();
          }
        }, 3000);
      }
    }
  },

  rebuild() {
    this.build();
    this.setupMouseEvents();
    if (Handlers.currentImg) {
      this.position(Handlers.currentImg);
      if (this.toolbar && this.toolbar.style.display !== 'none') {
        this.show(Handlers.currentImg);
      }
    }
  }
};