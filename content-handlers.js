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
      console.error('[Image Tools] No current image to replace');
      return;
    }
    
    const img = this.currentImg;
    console.log('[Image Tools] Replacing image:', img.src, 'with new data');
    
    const originalStyles = {
      cssText: img.style.cssText
    };
    
    const newImg = new Image();
    newImg.onload = () => {
      console.log('[Image Tools] New image loaded, size:', newImg.width, 'x', newImg.height);
      
      img.src = dataUrl;
      img.srcset = '';
      
      if (originalStyles.cssText) {
        img.style.cssText = originalStyles.cssText;
      }
      
      if (UI.toolbar && UI.toolbar.style.display !== 'none') {
        UI.position(img);
      }
      
      console.log('[Image Tools] Image replaced successfully');
    };
    
    newImg.onerror = () => {
      console.error('[Image Tools] Failed to load new image');
      img.src = dataUrl;
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
      await chrome.runtime.sendMessage({ action: svc.action, url: src });
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
      await chrome.runtime.sendMessage({ action: 'openTab', url, active: false });
      ButtonFactory.setState(btnId, 'success');
    } catch (error) {
      console.error('[Image Tools] Search failed:', error);
      ButtonFactory.setState(btnId, 'error');
      this.showError(btnId, 'Search failed');
    }
    this.autoReset(btnId);
  },

  async uploadSearch(serviceId, btnId) {
    const img = this.currentImg;
    if (!img) return;
    const src = this.fixUrlForOrig(img.src);
    if (!src || src.startsWith('blob:')) {
      ButtonFactory.setState(btnId, 'error');
      this.showError(btnId, 'Cannot upload this image');
      this.autoReset(btnId);
      return;
    }
    ButtonFactory.setState(btnId, 'loading');
    try {
      const resp = await chrome.runtime.sendMessage({ action: 'fetchImage', url: src });
      if (resp?.success) {
        const svc = CONFIG.UPLOAD_SERVICES[serviceId];
        await chrome.runtime.sendMessage({ 
          action: svc.action, 
          imageData: resp.data,
          originalTabId: null
        });
        ButtonFactory.setState(btnId, 'success');
      } else throw new Error(resp?.error);
    } catch {
      ButtonFactory.setState(btnId, 'error');
      this.showError(btnId, 'Upload failed');
    }
    this.autoReset(btnId);
  },

  async copy() {
    const img = this.currentImg;
    if (!img) return;
    const src = this.fixUrlForOrig(img.src);
    if (!src || src.startsWith('blob:')) {
      ButtonFactory.setState('copy', 'error');
      this.showError('copy', 'Cannot copy this image');
      this.autoReset('copy');
      return;
    }
    ButtonFactory.setState('copy', 'loading');
    try {
      const resp = await chrome.runtime.sendMessage({ action: 'fetchImage', url: src });
      if (resp?.success) {
        await this.copyImageToClipboard(resp.data);
        ButtonFactory.setState('copy', 'success');
      } else throw new Error(resp?.error);
    } catch {
      ButtonFactory.setState('copy', 'error');
      this.showError('copy', 'Copy failed');
    }
    this.autoReset('copy');
  },

  async copyLink() {
    const img = this.currentImg;
    if (!img || !img.src) {
      ButtonFactory.setState('copylink', 'error');
      this.showError('copylink', 'No image to copy');
      this.autoReset('copylink');
      return;
    }
    try {
      const fixedUrl = this.fixUrlForOrig(img.src);
      await navigator.clipboard.writeText(fixedUrl);
      ButtonFactory.setState('copylink', 'success');
    } catch {
      ButtonFactory.setState('copylink', 'error');
      this.showError('copylink', 'Failed to copy link');
    }
    this.autoReset('copylink');
  },

  async save() {
    const img = this.currentImg;
    if (!img || !img.src || img.src.startsWith('blob:')) {
      ButtonFactory.setState('save', 'error');
      this.showError('save', 'Cannot save this image');
      this.autoReset('save');
      return;
    }
    ButtonFactory.setState('save', 'loading');
    try {
      const fixedUrl = this.fixUrlForOrig(img.src);
      let suggestedFilename = undefined;
      if (window.location.hostname === 'pikabu.ru') {
        suggestedFilename = this.getPikabuFilename();
      }
      const resp = await chrome.runtime.sendMessage({
        action: 'downloadImage',
        url: fixedUrl,
        suggestedFilename: suggestedFilename
      });
      if (resp?.success) ButtonFactory.setState('save', 'success');
      else throw new Error(resp?.error);
    } catch {
      ButtonFactory.setState('save', 'error');
      this.showError('save', 'Save failed');
    }
    this.autoReset('save');
  },

  async saveAs() {
    const img = this.currentImg;
    if (!img || !img.src || img.src.startsWith('blob:')) {
      ButtonFactory.setState('saveas', 'error');
      this.showError('saveas', 'Cannot save this image');
      this.autoReset('saveas');
      return;
    }
    ButtonFactory.setState('saveas', 'loading');
    try {
      const fixedUrl = this.fixUrlForOrig(img.src);
      let suggestedFilename = undefined;
      if (window.location.hostname === 'pikabu.ru') {
        suggestedFilename = this.getPikabuFilename();
      }
      const resp = await chrome.runtime.sendMessage({
        action: 'downloadImageAs',
        url: fixedUrl,
        suggestedFilename: suggestedFilename
      });
      if (resp?.success) ButtonFactory.setState('saveas', 'success');
      else throw new Error(resp?.error);
    } catch {
      ButtonFactory.setState('saveas', 'error');
      this.showError('saveas', 'Save failed');
    }
    this.autoReset('saveas');
  },

  async customSave(folderKey, btnId) {
    const img = this.currentImg;
    if (!img || !img.src) {
      ButtonFactory.setState(btnId, 'error');
      this.showError(btnId, 'No image to save');
      this.autoReset(btnId);
      return;
    }
    const folder = Settings.get(folderKey);
    if (!folder) {
      ButtonFactory.setState(btnId, 'error');
      this.showError(btnId, 'No folder configured');
      this.autoReset(btnId);
      return;
    }
    ButtonFactory.setState(btnId, 'loading');
    try {
      let urlToSend = this.fixUrlForOrig(img.src);
      
      if (urlToSend.startsWith('blob:')) {
        const response = await fetch(urlToSend);
        const blob = await response.blob();
        urlToSend = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      
      const resp = await chrome.runtime.sendMessage({
        action: 'downloadToFolder',
        url: urlToSend,
        folder: folder
      });
      if (resp?.success) ButtonFactory.setState(btnId, 'success');
      else throw new Error(resp?.error);
    } catch (e) {
      ButtonFactory.setState(btnId, 'error');
      this.showError(btnId, 'Save to folder failed');
    }
    this.autoReset(btnId);
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
        const response = await fetch(source);
        blob = await response.blob();
      } else {
        const response = await fetch(source);
        blob = await response.blob();
      }
    } else if (source instanceof Blob) blob = source;
    else throw new Error('Invalid source');
    if (!['image/png', 'image/svg+xml'].includes(blob.type)) {
      blob = await convertBlobToPng(blob);
    }
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
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