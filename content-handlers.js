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

  getOriginalUrl(img) {
    if (!img) return null;
    const isVideo = img.tagName === 'VIDEO';
    if (isVideo) {
      return img.src || img.querySelector('source')?.src || null;
    }

    const isMediaUrl = (u) => {
      if (!u || typeof u !== 'string' || u.length < 10) return false;
      if (u.includes('avatar') || u.includes('favicon') || u.includes('/a/') || u.includes('icons/')) return false;
      return true;
    };

    const isGifOrOriginal = (u) => {
      if (!isMediaUrl(u)) return false;
      if (/\.gif($|\?|#)/i.test(u) || u.includes('format=gif') || u.includes('ext=gif')) return true;
      if (u.includes('s.sankakucomplex.com/o/') || u.includes('sankakucomplex.com/o/') || u.includes('/o/')) return true;
      return false;
    };

    // 1. First priority: Check for explicit GIF or Original link on Sankaku or booru pages
    const pageGifOrOrigLink = document.querySelector('a[href*="s.sankakucomplex.com/o/"], a[href*="sankakucomplex.com/o/"], a[href*="/o/"], a[href*=".gif"], a#highres, a.stats-size, a.sidebar-download');
    if (pageGifOrOrigLink && pageGifOrOrigLink.href && isMediaUrl(pageGifOrOrigLink.href)) {
      return pageGifOrOrigLink.href;
    }

    // 2. Check parent <a> tag of the image
    let parent = img.parentElement;
    for (let i = 0; i < 3 && parent; i++) {
      if (parent.tagName === 'A' && parent.href && isMediaUrl(parent.href)) {
        if (isGifOrOriginal(parent.href) || /\.(gif|jpg|jpeg|png|webp|bmp)($|\?|#)/i.test(parent.href)) {
          return parent.href;
        }
      }
      parent = parent.parentElement;
    }

    // 3. Check dataset attributes on img
    if (img.dataset) {
      const keys = ['originalSrc', 'original', 'fullSrc', 'fullSizeUrl', 'fileUrl', 'highres', 'src'];
      for (const key of keys) {
        const val = img.dataset[key];
        if (val && isMediaUrl(val)) {
          return val.startsWith('//') ? window.location.protocol + val : val;
        }
      }
    }

    // 4. Check data- attributes on img
    const attrs = ['data-original-src', 'data-original', 'data-src', 'data-full-src', 'data-file-url', 'data-highres'];
    for (const attr of attrs) {
      const val = img.getAttribute(attr);
      if (val && isMediaUrl(val)) {
        return val.startsWith('//') ? window.location.protocol + val : val;
      }
    }

    // 5. Check window.__PRELOADED_STATE__ or meta tags if on Sankaku
    if (window.location.hostname.includes('sankakucomplex.com')) {
      try {
        const state = window.__PRELOADED_STATE__;
        if (state?.post?.file_url) return state.post.file_url;
        if (state?.post?.sample_url && isGifOrOriginal(state.post.sample_url)) return state.post.sample_url;
      } catch(e) {}

      const ogImage = document.querySelector('meta[property="og:image"]')?.content;
      if (ogImage && isGifOrOriginal(ogImage)) return ogImage;
      const ogVideo = document.querySelector('meta[property="og:video"]')?.content;
      if (ogVideo && isMediaUrl(ogVideo)) return ogVideo;
    }

    // 6. Check all <a> links on the page that end with .gif
    const allGifLinks = document.querySelectorAll('a[href*=".gif"]');
    for (const link of allGifLinks) {
      if (link.href && isMediaUrl(link.href)) return link.href;
    }

    return img.src || img.currentSrc || null;
  },

  getExtensionFromUrl(url) {
    if (!url || typeof url !== 'string') return 'jpg';
    if (url.startsWith('data:image/gif')) return 'gif';
    if (url.startsWith('data:image/png')) return 'png';
    if (url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg')) return 'jpg';
    if (url.startsWith('data:image/webp')) return 'webp';
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const match = pathname.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
      if (match) return match[1].toLowerCase();
      const format = urlObj.searchParams.get('format');
      if (format) return format.toLowerCase();
      const ext = urlObj.searchParams.get('ext');
      if (ext) return ext.toLowerCase();
    } catch(e) {
      if (/\.gif($|\?|#)/i.test(url)) return 'gif';
    }
    return 'jpg';
  },

  isGif(img, url) {
    const checkString = (s) => {
      if (!s || typeof s !== 'string') return false;
      if (s.startsWith('data:image/gif')) return true;
      if (/\.gif($|\?|#)/i.test(s)) return true;
      if (s.includes('s.sankakucomplex.com/o/') && (s.includes('.gif') || !s.includes('.'))) return true;
      try {
        const u = new URL(s, window.location.href);
        if (u.pathname.toLowerCase().endsWith('.gif')) return true;
        if (u.searchParams.get('format')?.toLowerCase() === 'gif') return true;
        if (u.searchParams.get('ext')?.toLowerCase() === 'gif') return true;
      } catch(e) {}
      return false;
    };

    if (url && checkString(url)) return true;

    const origUrl = this.getOriginalUrl(img);
    if (origUrl && checkString(origUrl)) return true;

    if (img) {
      if (img.tagName === 'VIDEO') {
        const vSrc = img.src || img.querySelector('source')?.src;
        if (vSrc && checkString(vSrc)) return true;
      }
      if (checkString(img.src)) return true;
      if (checkString(img.currentSrc)) return true;
      if (checkString(img.getAttribute('src'))) return true;

      const parentA = img.closest('a');
      if (parentA && checkString(parentA.href)) return true;

      if (img.dataset) {
        for (const key in img.dataset) {
          if (checkString(img.dataset[key])) return true;
        }
      }

      const attrs = ['data-src', 'data-original', 'data-original-src', 'data-full-src', 'data-file-url', 'data-highres'];
      for (const attr of attrs) {
        if (checkString(img.getAttribute(attr))) return true;
      }
    }
    return false;
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

  async getGifImageData(img, originalUrl) {
    let src = originalUrl || this.getOriginalUrl(img) || img?.src;
    if (!src && img?.tagName === 'VIDEO') return null;
    if (!src) return null;

    if (src.startsWith('data:')) return src;

    const fixedSrc = this.fixUrlForOrig(src);

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
      } catch (e) {
        console.warn('[Image Tools] Failed to fetch blob for GIF:', e);
      }
    }

    try {
      const response = await fetch(fixedSrc, { mode: 'cors', credentials: 'omit' });
      if (response.ok) {
        const blob = await response.blob();
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {
      console.log('[Image Tools] Direct fetch for GIF failed, using background fallback');
    }

    try {
      const resp = await browser.runtime.sendMessage({ action: 'fetchImage', url: fixedSrc });
      if (resp?.success && resp.data) {
        return resp.data;
      }
    } catch (e) {
      console.warn('[Image Tools] Background fetch for GIF failed:', e);
    }

    return fixedSrc;
  },

  async getImageData(img) {
    const isVideo = img.tagName === 'VIDEO';
    let src = img.src;
    if (!src && isVideo) {
      src = img.querySelector('source')?.src;
    }

    // 1. Если это уже data:, просто возвращаем
    if (src && src.startsWith('data:')) return src;

    // 2. Попытка через Canvas (для обычных картинок, кроме GIF и видео)
    if (!isVideo && !this.isGif(img, src)) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL('image/png');
      } catch (e) {
        console.log('[Image Tools] Canvas export skipped (cross-origin), using fetch/background fallback');
      }
    } else if (isVideo) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.videoWidth;
        canvas.height = img.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL('image/png');
      } catch (e) {
        console.warn('[Image Tools] Canvas capture failed for video (CORS?), trying screenshot fallback...');
        try {
          return await this.captureFrameViaScreenshot(img);
        } catch (screenshotError) {
          console.error('[Image Tools] Screenshot fallback failed:', screenshotError);
          throw new Error('Failed to capture video frame');
        }
      }
    }

    // 3. Если Canvas не сработал или это GIF
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
    const isVideo = img.tagName === 'VIDEO';
    const originalUrl = this.getOriginalUrl(img) || img.src || (isVideo ? img.querySelector('source')?.src : null);

    let isGif = !isVideo && this.isGif(img, originalUrl);

    // GIF файлы скачиваются как оригинальный GIF (без конвертации в JPG/PNG), независимо от настроек downloadFormat
    const targetFormat = isGif ? 'original' : (Settings.get('downloadFormat') || 'original');

    let imageData;
    if (isGif) {
      imageData = await this.getGifImageData(img, originalUrl);
      if (imageData && typeof imageData === 'string' && imageData.startsWith('data:image/gif')) {
        isGif = true;
      }
    } else if (targetFormat === 'original') {
      imageData = await this.getImageData(img);
      if (imageData && typeof imageData === 'string' && imageData.startsWith('data:image/gif')) {
        isGif = true;
      }
    } else {
      imageData = await this.convertImageToFormat(img, targetFormat);
    }

    let suggestedFilename = this.getBestFilename(img);

    if (isGif) {
      if (suggestedFilename) {
        suggestedFilename = suggestedFilename.replace(/\.[a-zA-Z0-9]+$/, '.gif');
        if (!suggestedFilename.toLowerCase().endsWith('.gif')) {
          suggestedFilename += '.gif';
        }
      } else {
        suggestedFilename = 'image.gif';
      }
    } else if (suggestedFilename && targetFormat !== 'original') {
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

    const isVideo = el.tagName === 'VIDEO';
    const originalUrl = this.getOriginalUrl(el);
    const src = originalUrl || el.src || (isVideo ? el.querySelector('source')?.src : null);
    const isGif = !isVideo && this.isGif(el, src);

    // 1. Логика для Pikabu
    if (window.location.hostname === 'pikabu.ru') {
      const pikabuName = this.getPikabuFilename();
      if (pikabuName) {
        if (isGif) {
          return pikabuName.replace(/\.[a-zA-Z0-9]+$/, '.gif');
        }
        return pikabuName;
      }
    }

    // 2. Попытка взять из атрибутов
    let name = el.getAttribute('alt') || el.getAttribute('title') || el.getAttribute('aria-label') || '';
    name = name.trim().split('\n')[0].substring(0, 80);

    let extension = isVideo ? 'png' : this.getExtensionFromUrl(src || '');
    if (isVideo) extension = 'png';
    if (isGif) extension = 'gif';

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
          if (isGif) {
            return parts.join('.') + '.gif';
          }
          return file;
        }
      } catch (e) {}
    }

    if (isGif) return 'image.gif';

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