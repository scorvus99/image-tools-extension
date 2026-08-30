const Handlers = {
  stateTimers: {},
  currentImg: null,

  setImage(img) { this.currentImg = img; },
  clearImage() { this.currentImg = null; },

  isValidUrl(src) {
    return src && !src.startsWith('blob:') && !src.startsWith('data:');
  },

  fixUrlForOrig(src) {
    try {
      const urlObj = new URL(src);
      if (urlObj.searchParams.has('name')) {
        urlObj.searchParams.set('name', 'orig');
        return urlObj.toString();
      }
    } catch(e) {}
    return src;
  },

  replaceCurrentImage(dataUrl) {
    if (!this.currentImg) {
      console.error('[Image Tools] No current element to replace');
      return;
    }
    const el = this.currentImg;
    console.log('[Image Tools] Replacing content:', el.src || 'video', 'with new data');

    const originalStyles = el.style.cssText;

    const newImg = new Image();
    newImg.onload = () => {
      console.log('[Image Tools] New image loaded, size:', newImg.width, 'x', newImg.height);

      if (el.tagName === 'VIDEO') {
        newImg.style.cssText = originalStyles;
        el.parentNode.replaceChild(newImg, el);
        this.setImage(newImg);
      } else {
        el.src = dataUrl;
        el.srcset = '';
        if (originalStyles) {
          el.style.cssText = originalStyles;
        }
      }

      if (UI.toolbar && UI.toolbar.style.display !== 'none') {
        UI.position(this.currentImg);
      }
      console.log('[Image Tools] Replaced successfully');
    };
    newImg.onerror = () => {
      console.error('[Image Tools] Failed to load new image');
      if (el.tagName !== 'VIDEO') {
        el.src = dataUrl;
      }
    };
    newImg.src = dataUrl;
  },

  getExtensionFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const match = pathname.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
      if (match) return match[1].toLowerCase();
      const format = urlObj.searchParams.get('format');
      if (format) return format.toLowerCase();
      return 'jpg';
    } catch(e) {
      return 'jpg';
    }
  },

  getPikabuFilename() {
    const img = this.currentImg;
    if (!img) return null;

    const wrapper = img.closest('.story__content-wrapper');
    if (!wrapper) return null;

    const storyMain = wrapper.closest('.story__main');
    if (!storyMain) return null;

    const storyEl = storyMain.closest('.story[data-story-id]');
    if (!storyEl) return null;

    const storyId = storyEl.getAttribute('data-story-id');
    if (!storyId) return null;

    const tagsContainer = storyMain.querySelector('.story__tags');
    if (!tagsContainer) return storyId;

    const tags = Array.from(tagsContainer.querySelectorAll('.tags__tag'))
      .map(tag => tag.textContent.trim())
      .filter(text => text.length > 0);

    const sanitize = (s) => s.replace(/[\/\\?%*:|"<>]/g, '_').trim();
    const tagsPart = tags.map(sanitize).join('-');

    const extension = this.getExtensionFromUrl(img.src);

    const baseName = tagsPart ? `${tagsPart}-${storyId}` : `${storyId}`;
    return `${baseName}.${extension}`;
  },

  async urlToFieldSearch(serviceId, btnId) {
    const img = this.currentImg;
    if (!img) return;
    const src = this.fixUrlForOrig(img.src);
    if (!this.isValidUrl(src) || src.startsWith('data:')) {
      ButtonFactory.setState(btnId, 'error');
      this.showError(btnId, 'Invalid image source');
      this.autoReset(btnId);
      return;
    }
    ButtonFactory.setState(btnId, 'loading');
    try {
      const svc = CONFIG.UPLOAD_SERVICES[serviceId];
      await browser.runtime.sendMessage({ action: svc.action, url: src });
      ButtonFactory.setState(btnId, 'success');
    } catch {
      ButtonFactory.setState(btnId, 'error');
      this.showError(btnId, 'Search failed');
    }
    this.autoReset(btnId);
  },

  async urlSearch(serviceId, btnId) {
    const img = this.currentImg;
    if (!img) return;
    const src = this.fixUrlForOrig(img.src);
    if (!this.isValidUrl(src) || src.startsWith('data:')) {
      ButtonFactory.setState(btnId, 'error');
      this.showError(btnId, 'Invalid image source');
      this.autoReset(btnId);
      return;
    }
    ButtonFactory.setState(btnId, 'loading');
    try {
      const template = CONFIG.URL_SERVICES[serviceId];
      const url = template.replace('{url}', encodeURIComponent(src));
      await browser.runtime.sendMessage({ action: 'openTab', url, active: false });
      ButtonFactory.setState(btnId, 'success');
    } catch (error) {
      console.error('[Image Tools] Search failed:', error);
      ButtonFactory.setState(btnId, 'error');
      this.showError(btnId, 'Search failed');
    }
    this.autoReset(btnId);
  },

  async getImageData(img) {
    const isVideo = img.tagName === 'VIDEO';
    let src = img.src;
    if (!src && isVideo) {
      src = img.querySelector('source')?.src;
    }

    // 1. Если это уже data:, просто возвращаем
    if (src && src.startsWith('data:')) return src;

    // 2. Попытка через Canvas (самый надежный способ для blob и локальных файлов, и единственный для видео)
    try {
      const canvas = document.createElement('canvas');
      canvas.width = isVideo ? img.videoWidth : (img.naturalWidth || img.width);
      canvas.height = isVideo ? img.videoHeight : (img.naturalHeight || img.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (e) {
      if (isVideo) {
        console.warn('[Image Tools] Canvas capture failed for video (CORS?), trying screenshot fallback...');
        try {
          return await this.captureFrameViaScreenshot(img);
        } catch (screenshotError) {
          console.error('[Image Tools] Screenshot fallback failed:', screenshotError);
          throw new Error('Failed to capture video frame');
        }
      }
      console.log('[Image Tools] Canvas export skipped (cross-origin), using fetch/background fallback');
    }

    // 3. Если Canvas не сработал (например, картинка cross-origin), пробуем fetch или фоновый скрипт
    const fixedSrc = this.fixUrlForOrig(src || '');
    if (fixedSrc.startsWith('blob:')) {
      try {
        const response = await fetch(fixedSrc);
        const blob = await response.blob();
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        throw new Error('Failed to fetch blob');
      }
    }

    // 4. Обычный URL — через background (обход CORS)
    const resp = await browser.runtime.sendMessage({ action: 'fetchImage', url: fixedSrc });
    if (resp?.success) return resp.data;
    throw new Error(resp?.error || 'Failed to fetch image');
  },

  async uploadSearch(serviceId, btnId) {
    const img = this.currentImg;
    if (!img) return;

    ButtonFactory.setState(btnId, 'loading');
    try {
      const imageData = await this.getImageData(img);
      if (imageData) {
        const svc = CONFIG.UPLOAD_SERVICES[serviceId];
        await browser.runtime.sendMessage({
          action: svc.action,
          imageData: imageData,
          shopQuery: svc.shopQuery,
          originalTabId: null
        });
        ButtonFactory.setState(btnId, 'success');
      }
    } catch (err) {
      console.error('[Image Tools] Upload failed:', err);
      ButtonFactory.setState(btnId, 'error');
      this.showError(btnId, 'Upload failed');
    }
    this.autoReset(btnId);
  },

  async copy() {
    const img = this.currentImg;
    if (!img) return;

    ButtonFactory.setState('copy', 'loading');
    try {
      const imageData = await this.getImageData(img);
      if (imageData) {
        await this.copyImageToClipboard(imageData);
        ButtonFactory.setState('copy', 'success');
      }
    } catch (err) {
      console.error('[Image Tools] Copy failed:', err);
      ButtonFactory.setState('copy', 'error');
      this.showError('copy', 'Copy failed');
    }
    this.autoReset('copy');
  },

  async copyLink() {
    const img = this.currentImg;
    const isVideo = img?.tagName === 'VIDEO';
    let src = img?.src;
    if (!src && isVideo) {
      src = img.querySelector('source')?.src;
    }

    if (!img || !src) {
      ButtonFactory.setState('copylink', 'error');
      this.showError('copylink', 'No content to copy');
      this.autoReset('copylink');
      return;
    }
    try {
      const fixedUrl = this.fixUrlForOrig(src);
      await navigator.clipboard.writeText(fixedUrl);
      ButtonFactory.setState('copylink', 'success');
    } catch {
      ButtonFactory.setState('copylink', 'error');
      this.showError('copylink', 'Failed to copy link');
    }
    this.autoReset('copylink');
  },

  async prepareImageForDownload(img) {
    const targetFormat = Settings.get('downloadFormat') || 'original';
    const isVideo = img.tagName === 'VIDEO';
    const originalUrl = img.src || (isVideo ? img.querySelector('source')?.src : null);

    let imageData;
    if (targetFormat === 'original') {
      imageData = await this.getImageData(img);
    } else {
      imageData = await this.convertImageToFormat(img, targetFormat);
    }

    let suggestedFilename = this.getBestFilename(img);
    if (suggestedFilename && targetFormat !== 'original') {
      const newExt = targetFormat === 'jpg' ? 'jpg' : 'png';
      suggestedFilename = suggestedFilename.replace(/\.[a-zA-Z0-9]+$/, '.' + newExt);
    } else if (!suggestedFilename && targetFormat !== 'original') {
      const newExt = targetFormat === 'jpg' ? 'jpg' : 'png';
      suggestedFilename = `image.${newExt}`;
    }

    return { imageData, originalUrl, suggestedFilename };
  },

  async convertImageToFormat(img, format) {
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const isVideo = img.tagName === 'VIDEO';

    try {
      const canvas = document.createElement('canvas');
      canvas.width = isVideo ? img.videoWidth : (img.naturalWidth || img.width);
      canvas.height = isVideo ? img.videoHeight : (img.naturalHeight || img.height);
      const ctx = canvas.getContext('2d');
      if (format === 'jpg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL(mimeType, 0.92);
    } catch (e) {
      const dataUrl = await this.getImageData(img);
      return new Promise((resolve, reject) => {
        const tempImg = new Image();
        tempImg.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = tempImg.naturalWidth || tempImg.width;
          canvas.height = tempImg.naturalHeight || tempImg.height;
          const ctx = canvas.getContext('2d');
          if (format === 'jpg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(tempImg, 0, 0);
          resolve(canvas.toDataURL(mimeType, 0.92));
        };
        tempImg.onerror = reject;
        tempImg.src = dataUrl;
      });
    }
  },

  async save() {
    const img = this.currentImg;
    if (!img) return;

    ButtonFactory.setState('save', 'loading');
    try {
      const { imageData, originalUrl, suggestedFilename } = await this.prepareImageForDownload(img);

      const resp = await browser.runtime.sendMessage({
        action: 'downloadImage',
        url: imageData,
        originalUrl: originalUrl,
        suggestedFilename: suggestedFilename
      });
      if (resp?.success) ButtonFactory.setState('save', 'success');
      else throw new Error(resp?.error);
    } catch (err) {
      console.error('[Image Tools] Save failed:', err);
      ButtonFactory.setState('save', 'error');
      this.showError('save', 'Save failed');
    }
    this.autoReset('save');
  },

  async saveAs() {
    const img = this.currentImg;
    if (!img) return;

    ButtonFactory.setState('saveas', 'loading');
    try {
      const { imageData, originalUrl, suggestedFilename } = await this.prepareImageForDownload(img);

      const resp = await browser.runtime.sendMessage({
        action: 'downloadImageAs',
        url: imageData,
        originalUrl: originalUrl,
        suggestedFilename: suggestedFilename
      });
      if (resp?.success) ButtonFactory.setState('saveas', 'success');
      else throw new Error(resp?.error);
    } catch (err) {
      console.error('[Image Tools] SaveAs failed:', err);
      ButtonFactory.setState('saveas', 'error');
      this.showError('saveas', 'Save failed');
    }
    this.autoReset('saveas');
  },

  async customSave(folderKey, btnId) {
    const img = this.currentImg;
    if (!img) return;

    const folder = Settings.get(folderKey);
    if (!folder) {
      ButtonFactory.setState(btnId, 'error');
      this.showError(btnId, 'No folder configured');
      this.autoReset(btnId);
      return;
    }
    ButtonFactory.setState(btnId, 'loading');
    try {
      const { imageData, originalUrl, suggestedFilename } = await this.prepareImageForDownload(img);

      const resp = await browser.runtime.sendMessage({
        action: 'downloadToFolder',
        url: imageData,
        originalUrl: originalUrl,
        suggestedFilename: suggestedFilename,
        folder: folder
      });
      if (resp?.success) ButtonFactory.setState(btnId, 'success');
      else throw new Error(resp?.error);
    } catch (e) {
      console.error('[Image Tools] Custom save failed:', e);
      ButtonFactory.setState(btnId, 'error');
      this.showError(btnId, 'Save to folder failed');
    }
    this.autoReset(btnId);
  },

  getBestFilename(el) {
    if (!el) return null;

    // 1. Логика для Pikabu
    if (window.location.hostname === 'pikabu.ru') {
      const pikabuName = this.getPikabuFilename();
      if (pikabuName) return pikabuName;
    }

    // 2. Попытка взять из атрибутов
    let name = el.getAttribute('alt') || el.getAttribute('title') || el.getAttribute('aria-label') || '';
    name = name.trim().split('\n')[0].substring(0, 80);

    const isVideo = el.tagName === 'VIDEO';
    const src = el.src || (isVideo ? el.querySelector('source')?.src : null);

    let extension = isVideo ? 'png' : this.getExtensionFromUrl(src || '');
    if (isVideo) extension = 'png';

    if (name) {
      const sanitize = (s) => s.replace(/[\/\\?%*:|"<>]/g, '_').replace(/\s+/g, ' ').trim();
      let sanitizedName = sanitize(name);
      if (sanitizedName) {
        return `${sanitizedName}.${extension}`;
      }
    }

    // 3. Если нет атрибутов, попробуем вытащить из URL сами здесь, чтобы гарантировать чистоту
    if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
      try {
        const urlObj = new URL(src);
        const path = urlObj.pathname;
        let file = path.substring(path.lastIndexOf('/') + 1).split('?')[0].split('#')[0];
        if (file && file.includes('.')) {
          const parts = file.split('.');
          const currentExt = parts.pop().toLowerCase();
          const videoExts = ['webm', 'mp4', 'ogg', 'mov', 'avi', 'mkv'];
          if (videoExts.includes(currentExt)) {
            return parts.join('.') + '.png';
          }
          return file;
        }
      } catch (e) {}
    }

    return null;
  },

  async handleContextMenuAction(message) {
    if (!Settings.isEnabled || !Settings.get('showContextMenu')) return;
    const { menuItemId, srcUrl } = message;
    console.log('[Image Tools] Handling context menu action:', menuItemId, 'for URL:', srcUrl);

    // Пытаемся найти элемент на странице по srcUrl
    let el = null;
    const items = document.querySelectorAll('img, video');
    for (const item of items) {
      const itemSrc = item.src || (item.tagName === 'VIDEO' ? item.querySelector('source')?.src : '');
      if (itemSrc === srcUrl) {
        el = item;
        break;
      }
    }

    // Если не нашли по точному совпадению, используем текущий (если он есть и совпадает визуально)
    if (!el && this.currentImg) {
      const currentSrc = this.currentImg.src || (this.currentImg.tagName === 'VIDEO' ? this.currentImg.querySelector('source')?.src : '');
      if (currentSrc === srcUrl) el = this.currentImg;
    }

    if (!el) {
      console.warn('[Image Tools] Could not find element for context menu action');
      return;
    }

    this.setImage(el);

    const actionMap = {
      'copyImage': () => this.copy(),
      'copyLink': () => this.copyLink(),
      'saveImage': () => this.save(),
      'saveImageAs': () => this.saveAs(),
      'searchGoogle': () => this.uploadSearch('google', 'google'),
      'searchYandex': () => this.uploadSearch('yandex', 'yandex'),
      'searchTinEyeCtx': () => this.uploadSearch('tineye', 'tineye'),
      'searchPimeyesCtx': () => this.uploadSearch('pimeyes', 'pimeyes'),
      'searchFacecheckCtx': () => this.uploadSearch('facecheck', 'facecheck'),
      'searchLensoCtx': () => this.uploadSearch('lenso', 'lenso'),
      'searchIqdb': () => this.uploadSearch('iqdb', 'iqdb'),
      'searchTraceMoeCtx': () => this.uploadSearch('trace_moe', 'trace_moe'),
      'searchSauceNAOCtx': () => this.uploadSearch('saucenao', 'saucenao'),
      'searchAscii2dCtx': () => this.uploadSearch('ascii2d', 'ascii2d'),
      'searchNamethatpornCtx': () => this.uploadSearch('namethatporn', 'namethatporn'),
      'searchNamethatpornstarCtx': () => this.uploadSearch('namethatpornstar', 'namethatpornstar'),
      'searchWildberriesCtx': () => this.urlSearch('wildberries', 'wildberries'),
      'searchOzonCtx': () => this.urlSearch('ozon', 'ozon'),
      'searchAliexpressCtx': () => this.urlSearch('aliexpress', 'aliexpress'),
      'ocrGoogle': () => this.uploadSearch('googleocr', 'googleocr'),
      'ocrYandex': () => this.uploadSearch('yandexocr', 'yandexocr'),
      'ocrYandexReplace': () => this.uploadSearch('yandexocr_replace', 'yandexocr_replace'),
      'ocrGoogleReplace': () => this.uploadSearch('googleocr_replace', 'googleocr_replace')
    };

    const action = actionMap[menuItemId];
    if (action) {
      action();
    } else {
      console.error('[Image Tools] Unknown context menu action:', menuItemId);
    }
  },

  showError(btnId, message) {
    const btn = ButtonFactory.buttons[btnId];
    if (btn) {
      const oldTitle = btn.title;
      btn.title = message;
      setTimeout(() => {
        if (ButtonFactory.buttons[btnId] === btn) {
          btn.title = oldTitle;
        }
      }, 2000);
    }
  },

  autoReset(btnId) {
    clearTimeout(this.stateTimers[btnId]);
    this.stateTimers[btnId] = setTimeout(() => {
      ButtonFactory.reset(btnId);
    }, 1500);
  },

  async copyImageToClipboard(source) {
    let blob;
    if (typeof source === 'string') {
      if (source.startsWith('data:')) {
        // Ручная конвертация без fetch, чтобы обойти CSP Telegram
        blob = this.dataURLToBlob(source);
      } else {
        try {
          const response = await fetch(source);
          blob = await response.blob();
        } catch (e) {
          // Если fetch заблокирован (CSP), пробуем через background
          const resp = await browser.runtime.sendMessage({ action: 'fetchImage', url: source });
          if (resp?.success) {
            blob = this.dataURLToBlob(resp.data);
          } else throw new Error('Failed to fetch image for clipboard');
        }
      }
    } else if (source instanceof Blob) {
      blob = source;
    } else {
      throw new Error('Invalid source');
    }

    if (!['image/png', 'image/svg+xml'].includes(blob.type)) {
      blob = await convertBlobToPng(blob);
    }
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
  },

  async captureFrameViaScreenshot(video) {
    const rect = video.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) throw new Error('Video not visible');

    // Скрываем тулбар, чтобы он не попал на скриншот
    const wasVisible = typeof UI !== 'undefined' && UI.toolbar && UI.toolbar.style.display !== 'none';
    if (wasVisible) UI.toolbar.style.display = 'none';

    try {
      // Даем браузеру время на перерисовку (скрытие панели)
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      const resp = await browser.runtime.sendMessage({ action: 'captureVisibleTab' });
      if (!resp?.success) throw new Error(resp?.error || 'Screenshot failed');

      return await this.cropScreenshot(resp.data, rect);
    } finally {
      // Возвращаем тулбар
      if (wasVisible) UI.toolbar.style.display = 'flex';
    }
  },

  cropScreenshot(dataUrl, rect) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const dpr = window.devicePixelRatio || 1;
        const canvas = document.createElement('canvas');

        // Целевой размер в физических пикселях
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        const ctx = canvas.getContext('2d');

        // Координаты в скриншоте (вьюпорте)
        const sx = Math.round(rect.left * dpr);
        const sy = Math.round(rect.top * dpr);
        const sw = Math.round(rect.width * dpr);
        const sh = Math.round(rect.height * dpr);

        try {
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  },

  // Вспомогательная функция конвертации без использования сетевых запросов
  dataURLToBlob(dataURL) {
    const parts = dataURL.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
};

function convertBlobToPng(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob(resolve, 'image/png');
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('PNG conversion failed')); };
    img.src = url;
  });
}