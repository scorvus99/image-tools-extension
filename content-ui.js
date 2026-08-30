// Модуль UI: позиционирование, события мыши, отображение
const UI = {
  toolbar: null,
  hideTimeout: null,
  isStandaloneImage: false,
  standaloneShown: false,
  observer: null,

  build() {
    if (this.toolbar) this.toolbar.remove();
    this.toolbar = document.createElement('div');
    this.toolbar.id = 'ext-img-toolbar';
    this.toolbar.style.cssText = `
      position: fixed !important;
      z-index: 2147483647 !important;
      display: none;
      gap: 0px;
      flex-direction: column;
      pointer-events: auto !important;
      visibility: visible !important;
      opacity: 1 !important;
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
    this.setupTopLayerObserver();
  },

  // Следит, чтобы панель всегда была последним элементом в текущем контейнере
  setupTopLayerObserver() {
    if (this.observer) this.observer.disconnect();
    this.observer = new MutationObserver(() => {
      if (!this.toolbar || this.toolbar.style.display === 'none') return;

      const targetContainer = this.toolbar.parentElement || document.body;
      if (targetContainer.lastElementChild !== this.toolbar) {
        targetContainer.appendChild(this.toolbar);
      }
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
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
      google:    (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('google', 'google'); },
      yandex:    (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('yandex', 'yandex'); },
      tineye:    (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('tineye', 'tineye'); },
      pimeyes:   (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('pimeyes', 'pimeyes'); },
      facecheck: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('facecheck', 'facecheck'); },
      lenso:     (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('lenso', 'lenso'); },
      iqdb:      (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('iqdb', 'iqdb'); },
      trace_moe: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('trace_moe', 'trace_moe'); },
      saucenao:  (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('saucenao', 'saucenao'); },
      ascii2d:   (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('ascii2d', 'ascii2d'); },
      namethatporn:    (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('namethatporn', 'namethatporn'); },
      namethatpornstar:(e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('namethatpornstar', 'namethatpornstar'); },
      wildberries: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('wildberries', 'wildberries'); },
      ozon:        (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('ozon', 'ozon'); },
      aliexpress:  (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('aliexpress', 'aliexpress'); },
      yandexocr: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('yandexocr', 'yandexocr'); },
      yandexocr_replace: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('yandexocr_replace', 'yandexocr_replace'); },
      googleocr: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('googleocr', 'googleocr'); },
      googleocr_replace: (e) => { e.stopPropagation(); e.preventDefault(); Handlers.uploadSearch('googleocr_replace', 'googleocr_replace'); }
    };

    Object.entries(ButtonFactory.buttons).forEach(([id, btn]) => {
      btn.addEventListener('click', handlerMap[id]);
    });
  },

  position(img) {
    if (!this.toolbar || !img) return;

    const rect = this.getRenderedImageRect(img);
    if (!rect || rect.width === 0 || rect.height === 0) return;

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
      left = rect.left + rect.width - tRect.width - offset;
    } else if (pos === 'bottom-left') {
      top = rect.top + rect.height - tRect.height - offset;
      left = rect.left + offset;
    } else { // bottom-right
      top = rect.top + rect.height - tRect.height - offset;
      left = rect.left + rect.width - tRect.width - offset;
    }

    // Дополнительная проверка, чтобы не вылезать за границы вьюпорта (окна)
    const maxTop = window.innerHeight - tRect.height - offset;
    const maxLeft = window.innerWidth - tRect.width - offset;
    top = Math.max(offset, Math.min(top, maxTop));
    left = Math.max(offset, Math.min(left, maxLeft));

    this.toolbar.style.top = top + 'px';
    this.toolbar.style.left = left + 'px';
  },

  // Вычисляет реальные координаты отображаемого контента внутри <img> или <video>
  getRenderedImageRect(img) {
    const rect = img.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return rect;

    const style = window.getComputedStyle(img);
    const objectFit = style.objectFit;

    const isVideo = img.tagName === 'VIDEO';
    const naturalWidth = isVideo ? img.videoWidth : img.naturalWidth;
    const naturalHeight = isVideo ? img.videoHeight : img.naturalHeight;

    // Если изображение/видео не загружено или не использует object-fit, возвращаем базовый rect
    if (objectFit === 'fill' || objectFit === 'none' || !naturalWidth) {
      return rect;
    }

    const naturalRatio = naturalWidth / naturalHeight;
    const visibleRatio = rect.width / rect.height;

    let renderedWidth = rect.width;
    let renderedHeight = rect.height;
    let offsetX = 0;
    let offsetY = 0;

    if (objectFit === 'contain') {
      if (naturalRatio > visibleRatio) {
        renderedHeight = rect.width / naturalRatio;
        offsetY = (rect.height - renderedHeight) / 2;
      } else {
        renderedWidth = rect.height * naturalRatio;
        offsetX = (rect.width - renderedWidth) / 2;
      }
    } else if (objectFit === 'cover') {
      // Для cover кнопки лучше оставить у края контейнера, так как картинка занимает его целиком
      return rect;
    }

    return {
      top: rect.top + offsetY,
      left: rect.left + offsetX,
      width: renderedWidth,
      height: renderedHeight
    };
  },

  show(img) {
    if (!Settings.isEnabled) {
      this.hide();
      return;
    }
    if (!this.toolbar || Object.keys(ButtonFactory.buttons).length === 0) return;
    if (!Settings.get('showButtons')) return;

    if (img === Handlers.currentImg && this.toolbar.style.display === 'flex') {
      return;
    }

    const isVideo = img.tagName === 'VIDEO';
    const width = isVideo ? img.videoWidth : img.naturalWidth;
    const height = isVideo ? img.videoHeight : img.naturalHeight;

    if (width < Settings.get('minImageSize') ||
        height < Settings.get('minImageSize')) return;

    Handlers.setImage(img);

    // Telegram Fix: если картинка внутри <dialog> (просмотрщик),
    // перемещаем панель внутрь этого диалога, иначе она будет "под" ним.
    const modal = img.closest('dialog');
    if (modal) {
      if (this.toolbar.parentElement !== modal) {
        modal.appendChild(this.toolbar);
      }
    } else if (this.toolbar.parentElement !== document.body) {
      document.body.appendChild(this.toolbar);
    } else {
      // Даже если в body, убеждаемся что мы в конце (поверх других слоев)
      document.body.appendChild(this.toolbar);
    }

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

    // Вспомогательная функция для поиска картинки под курсором (сквозь слои)
    const findImageUnderCursor = (e) => {
      const target = e.target;

      // Если навели на саму панель или её кнопки - не ищем новую картинку
      if (this.toolbar && (this.toolbar === target || this.toolbar.contains(target))) {
        return Handlers.currentImg;
      }

      // Сначала проверяем прямой таргет
      if (target.tagName === 'IMG' || target.tagName === 'VIDEO') return target;

      // Если таргет не IMG/VIDEO, смотрим что находится под этой точкой
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      for (const el of elements) {
        if ((el.tagName === 'IMG' || el.tagName === 'VIDEO') && (el.naturalWidth > 0 || el.videoWidth > 0)) {
          const isVideo = el.tagName === 'VIDEO';
          const width = isVideo ? el.videoWidth : el.naturalWidth;
          const height = isVideo ? el.videoHeight : el.naturalHeight;

          // Проверяем минимальный размер, чтобы не цеплять мелкие иконки под кнопками
          if (width >= Settings.get('minImageSize') &&
              height >= Settings.get('minImageSize')) {
            return el;
          }
        }
      }
      return null;
    };

    document.addEventListener('mouseover', (e) => {
      const img = findImageUnderCursor(e);
      if (img) {
        if (this.isStandaloneImage && img === document.images[0]) return;
        this.show(img);
      }
    }, true);

    if (!this.isStandaloneImage) {
      // Инициализируем координаты, чтобы избежать ошибок при первом вызове elementFromPoint
      window._lastMouseX = 0;
      window._lastMouseY = 0;

      document.addEventListener('mouseout', (e) => {
        // Даем небольшую задержку перед скрытием
        clearTimeout(this.hideTimeout);
        this.hideTimeout = setTimeout(() => {
          // Если мышь все еще над панелью или над текущей картинкой (или тем, что её перекрывает) - не скрываем
          const currentImgUnderMouse = findImageUnderCursor({
            target: document.elementFromPoint(window._lastMouseX, window._lastMouseY),
            clientX: window._lastMouseX,
            clientY: window._lastMouseY
          });

          if (this.toolbar?.matches(':hover') || (Handlers.currentImg && currentImgUnderMouse === Handlers.currentImg)) {
            return;
          }
          this.hide();
        }, 300);
      }, true);

      // Запоминаем координаты мыши для корректной работы таймера скрытия
      document.addEventListener('mousemove', (e) => {
        window._lastMouseX = e.clientX;
        window._lastMouseY = e.clientY;

        // Если панель видна, но мышь переместилась на другую картинку под слоями
        if (this.toolbar && this.toolbar.style.display !== 'none') {
          const img = findImageUnderCursor(e);
          if (img && img !== Handlers.currentImg) {
            this.show(img);
          }
        }
      }, true);

      if (this.toolbar) {
        this.toolbar.addEventListener('mouseenter', () => {
          clearTimeout(this.hideTimeout);
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
    if (!Settings.isEnabled) {
      this.hide();
      return;
    }
    if (Handlers.currentImg) {
      this.position(Handlers.currentImg);
      if (this.toolbar && this.toolbar.style.display !== 'none') {
        this.show(Handlers.currentImg);
      }
    }
  }
};