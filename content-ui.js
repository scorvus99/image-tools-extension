// Модуль UI: позиционирование, события мыши, отображение
const UI = {
  toolbar: null,
  hideTimeout: null,

  build() {
    if (this.toolbar) this.toolbar.remove();
    this.toolbar = document.createElement('div');
    this.toolbar.id = 'ext-img-toolbar';
    this.toolbar.style.cssText = `
      position: fixed; display: none; z-index: 2147483647;
      gap: 4px; flex-direction: column; pointer-events: auto;
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
      google:    (e) => { e.stopPropagation(); e.preventDefault(); Handlers.urlSearch('google', 'google'); },
      yandex:    (e) => { e.stopPropagation(); e.preventDefault(); Handlers.urlSearch('yandex', 'yandex'); },
      iqdb:      (e) => { e.stopPropagation(); e.preventDefault(); Handlers.urlSearch('iqdb', 'iqdb'); },
      lenso:     (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('lenso', 'lenso'); },
      facecheck: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('facecheck', 'facecheck'); },
      pimeyes:   (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('pimeyes', 'pimeyes'); },
      wildberries:(e)=>{ e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('wildberries', 'wildberries'); },
      yandexocr: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('yandexocr', 'yandexocr'); },
      googleocr: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('googleocr', 'googleocr'); },
      aliexpress: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.urlSearch('aliexpress', 'aliexpress'); },
      aliexpress_upload: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('aliexpress_upload', 'aliexpress_upload'); }
    };

    Object.entries(ButtonFactory.buttons).forEach(([id, btn]) => {
      btn.addEventListener('click', handlerMap[id]);
    });
  },

  position(img) {
    if (!this.toolbar) return;
    const rect = img.getBoundingClientRect();
    const wasHidden = this.toolbar.style.display === 'none';
    if (wasHidden) {
      this.toolbar.style.display = 'flex';
      this.toolbar.style.visibility = 'hidden';
      this.toolbar.style.top = '0px';
      this.toolbar.style.left = '0px';
    }
    const tRect = this.toolbar.getBoundingClientRect();
    const offset = 5;
    let top, left;
    const pos = Settings.get('position');
    if (pos === 'top-left') { top = rect.top + offset; left = rect.left + offset; }
    else if (pos === 'top-right') { top = rect.top + offset; left = rect.right - tRect.width - offset; }
    else if (pos === 'bottom-left') { top = rect.bottom - tRect.height - offset; left = rect.left + offset; }
    else { top = rect.bottom - tRect.height - offset; left = rect.right - tRect.width - offset; }
    top = Math.max(offset, Math.min(top, window.innerHeight - tRect.height - offset));
    left = Math.max(offset, Math.min(left, window.innerWidth - tRect.width - offset));
    this.toolbar.style.top = top + 'px';
    this.toolbar.style.left = left + 'px';
    if (wasHidden) { this.toolbar.style.visibility = ''; this.toolbar.style.display = 'flex'; }
  },

  show(img) {
    if (!this.toolbar || Object.keys(ButtonFactory.buttons).length === 0) return;
    if (!Settings.get('showButtons')) return;
    if (img.naturalWidth < Settings.get('minImageSize') || img.naturalHeight < Settings.get('minImageSize')) return;
    Handlers.setImage(img);
    this.position(img);
    clearTimeout(this.hideTimeout);
  },

  hide() {
    if (this.toolbar) this.toolbar.style.display = 'none';
    Handlers.clearImage();
    clearTimeout(this.hideTimeout);
  },

  setupMouseEvents() {
    document.addEventListener('mouseover', (e) => {
      const t = e.target;
      if (t.tagName === 'IMG' && t.naturalWidth > 0 && t.naturalHeight > 0) this.show(t);
    }, true);
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
      this.toolbar.addEventListener('mouseenter', () => clearTimeout(this.hideTimeout));
      this.toolbar.addEventListener('mouseleave', () => {
        this.hideTimeout = setTimeout(() => {
          if (Handlers.currentImg?.matches(':hover')) return;
          this.hide();
        }, 150);
      });
    }
    window.addEventListener('scroll', () => this.hide(), true);
    window.addEventListener('resize', () => Handlers.currentImg && this.position(Handlers.currentImg));
  }
};