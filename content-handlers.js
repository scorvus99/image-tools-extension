const Handlers = {
  stateTimers: {},
  currentImg: null,

  setImage(img) { this.currentImg = img; },
  clearImage() { this.currentImg = null; },

  isValidUrl(src) {
    return src && !src.startsWith('blob:') && !src.startsWith('data:');
  },

  async urlSearch(serviceId, btnId) {
    const img = this.currentImg;
    if (!img) return;
    const src = img.src;
    if (!this.isValidUrl(src)) {
      ButtonFactory.setState(btnId, 'error');
      this.autoReset(btnId);
      return;
    }
    ButtonFactory.setState(btnId, 'loading');
    try {
      const template = CONFIG.URL_SERVICES[serviceId];
      const url = template.replace('{url}', encodeURIComponent(src));
      await chrome.runtime.sendMessage({ action: 'openTab', url, active: false });
      ButtonFactory.setState(btnId, 'success');
    } catch { ButtonFactory.setState(btnId, 'error'); }
    this.autoReset(btnId);
  },

  async uploadSearch(serviceId, btnId) {
    const img = this.currentImg;
    if (!img) return;
    const src = img.src;
    if (!src || src.startsWith('blob:')) {
      ButtonFactory.setState(btnId, 'error');
      this.autoReset(btnId);
      return;
    }
    ButtonFactory.setState(btnId, 'loading');
    try {
      const resp = await chrome.runtime.sendMessage({ action: 'fetchImage', url: src });
      if (resp?.success) {
        const svc = CONFIG.UPLOAD_SERVICES[serviceId];
        await chrome.runtime.sendMessage({ action: svc.action, imageData: resp.data });
        ButtonFactory.setState(btnId, 'success');
      } else throw new Error(resp?.error);
    } catch { ButtonFactory.setState(btnId, 'error'); }
    this.autoReset(btnId);
  },

  async copy() {
    const img = this.currentImg;
    if (!img) return;
    const src = img.src;
    if (!src || src.startsWith('blob:')) {
      ButtonFactory.setState('copy', 'error');
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
    } catch { ButtonFactory.setState('copy', 'error'); }
    this.autoReset('copy');
  },

  async copyLink() {
    const img = this.currentImg;
    if (!img || !img.src) {
      ButtonFactory.setState('copylink', 'error');
      this.autoReset('copylink');
      return;
    }
    try {
      await navigator.clipboard.writeText(img.src);
      ButtonFactory.setState('copylink', 'success');
    } catch { ButtonFactory.setState('copylink', 'error'); }
    this.autoReset('copylink');
  },

  async save() {
    const img = this.currentImg;
    if (!img || !img.src || img.src.startsWith('blob:')) {
      ButtonFactory.setState('save', 'error');
      this.autoReset('save');
      return;
    }
    ButtonFactory.setState('save', 'loading');
    try {
      const resp = await chrome.runtime.sendMessage({ action: 'downloadImage', url: img.src });
      if (resp?.success) ButtonFactory.setState('save', 'success');
      else throw new Error(resp?.error);
    } catch { ButtonFactory.setState('save', 'error'); }
    this.autoReset('save');
  },

  async saveAs() {
    const img = this.currentImg;
    if (!img || !img.src || img.src.startsWith('blob:')) {
      ButtonFactory.setState('saveas', 'error');
      this.autoReset('saveas');
      return;
    }
    ButtonFactory.setState('saveas', 'loading');
    try {
      const resp = await chrome.runtime.sendMessage({ action: 'downloadImageAs', url: img.src });
      if (resp?.success) ButtonFactory.setState('saveas', 'success');
      else throw new Error(resp?.error);
    } catch { ButtonFactory.setState('saveas', 'error'); }
    this.autoReset('saveas');
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
      const response = await fetch(source);
      blob = await response.blob();
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