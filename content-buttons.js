function getIconUrl(iconName) {
  return chrome.runtime.getURL(CONFIG.ICONS_PATH + iconName);
}

function getLocalizedStateText(state) {
  const map = {
    loading: 'loading',
    success: 'success',
    error: 'error'
  };
  const key = map[state];
  if (key && typeof i18n !== 'undefined' && i18n[getCurrentLang?.() || 'en']) {
    const lang = getCurrentLang ? getCurrentLang() : 'en';
    const strings = i18n[lang] || i18n.en;
    return strings[key] || state;
  }
  return state;
}

const ButtonFactory = {
  buttons: {},

  getOpacity() {
    const val = Settings.get('buttonOpacity') ?? 100;
    return Math.min(100, Math.max(0, val)) / 100;
  },

  create(id) {
    const meta = CONFIG.BUTTONS[id];
    if (!meta) return document.createElement('div');
    
    const btn = document.createElement('div');
    btn.id = `ext-img-${id}`;
    btn.title = meta.tooltip;
    const isEmoji = meta.type === 'emoji';
    
    const buttonSize = Settings.get('buttonSize') || 22;
    const padding = Math.max(1, Math.floor(buttonSize / 11));
    const iconSize = Math.max(12, buttonSize - padding * 2 - 2);
    const fontSize = Math.max(10, Math.floor(buttonSize * 0.65));
    const borderRadius = Math.max(1, Math.floor(buttonSize / 11));
    const opacity = this.getOpacity();
    
    btn.style.cssText = `
      background: #000000;
      padding: ${padding}px;
      border-radius: ${borderRadius}px;
      cursor: pointer;
      pointer-events: auto;
      line-height: 1;
      box-shadow: 0 1px 2px rgba(0,0,0,0.3);
      user-select: none;
      transition: background 0.15s ease, opacity 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${buttonSize}px;
      height: ${buttonSize}px;
      min-width: ${buttonSize}px;
      min-height: ${buttonSize}px;
      flex-shrink: 0;
      overflow: hidden;
      box-sizing: border-box;
      position: relative;
      margin: 0;
      opacity: ${opacity};
    `;
    
    if (isEmoji) {
      const span = document.createElement('span');
      span.textContent = meta.emoji;
      span.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #ffffff;
        font-size: ${fontSize}px;
        font-family: Arial, sans-serif;
        line-height: 1;
        pointer-events: none;
        user-select: none;
      `;
      btn.appendChild(span);
    } else {
      const iconContainer = document.createElement('div');
      iconContainer.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${iconSize}px;
        height: ${iconSize}px;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      `;
      
      const img = document.createElement('img');
      img.style.cssText = `
        width: ${iconSize}px;
        height: ${iconSize}px;
        display: block;
        pointer-events: none;
        flex-shrink: 0;
        object-fit: contain;
      `;
      img.alt = meta.tooltip;
      
      img.onerror = () => {
        iconContainer.innerHTML = '';
        const span = document.createElement('span');
        span.textContent = meta.tooltip.charAt(0).toUpperCase();
        span.style.cssText = `
          color: #fff;
          font-size: ${Math.max(8, fontSize - 2)}px;
          font-weight: bold;
          line-height: 1;
          pointer-events: none;
          user-select: none;
        `;
        iconContainer.appendChild(span);
      };
      
      const fallbackTimer = setTimeout(() => {
        if (!img.complete || img.naturalWidth === 0) {
          img.dispatchEvent(new ErrorEvent('error'));
        }
      }, 3000);
      img.addEventListener('load', () => clearTimeout(fallbackTimer));
      img.addEventListener('error', () => clearTimeout(fallbackTimer));
      
      img.src = getIconUrl(meta.icon);
      iconContainer.appendChild(img);
      btn.appendChild(iconContainer);
    }
    
    return btn;
  },

  reset(id) {
    const btn = this.buttons[id];
    const meta = CONFIG.BUTTONS[id];
    if (!btn || !meta) return;
    
    const buttonSize = Settings.get('buttonSize') || 22;
    const padding = Math.max(1, Math.floor(buttonSize / 11));
    const iconSize = Math.max(12, buttonSize - padding * 2 - 2);
    const fontSize = Math.max(10, Math.floor(buttonSize * 0.65));
    const borderRadius = Math.max(1, Math.floor(buttonSize / 11));
    const opacity = this.getOpacity();
    
    btn.style.background = '#000000';
    btn.title = meta.tooltip;
    btn.style.width = `${buttonSize}px`;
    btn.style.height = `${buttonSize}px`;
    btn.style.minWidth = `${buttonSize}px`;
    btn.style.minHeight = `${buttonSize}px`;
    btn.style.padding = `${padding}px`;
    btn.style.borderRadius = `${borderRadius}px`;
    btn.style.opacity = opacity;
    
    while (btn.firstChild) btn.removeChild(btn.firstChild);
    
    if (meta.type === 'emoji') {
      const span = document.createElement('span');
      span.textContent = meta.emoji;
      span.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #ffffff;
        font-size: ${fontSize}px;
        font-family: Arial, sans-serif;
        line-height: 1;
        pointer-events: none;
        user-select: none;
      `;
      btn.appendChild(span);
    } else {
      const iconContainer = document.createElement('div');
      iconContainer.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${iconSize}px;
        height: ${iconSize}px;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      `;
      
      const img = document.createElement('img');
      img.style.cssText = `
        width: ${iconSize}px;
        height: ${iconSize}px;
        display: block;
        pointer-events: none;
        flex-shrink: 0;
        object-fit: contain;
      `;
      img.alt = meta.tooltip;
      
      img.onerror = () => {
        iconContainer.innerHTML = '';
        const span = document.createElement('span');
        span.textContent = meta.tooltip.charAt(0).toUpperCase();
        span.style.cssText = `
          color: #fff;
          font-size: ${Math.max(8, fontSize - 2)}px;
          font-weight: bold;
          line-height: 1;
          pointer-events: none;
          user-select: none;
        `;
        iconContainer.appendChild(span);
      };
      
      img.src = getIconUrl(meta.icon);
      iconContainer.appendChild(img);
      btn.appendChild(iconContainer);
    }
  },

  setState(id, state) {
    const btn = this.buttons[id];
    if (!btn) return;
    
    while (btn.firstChild) btn.removeChild(btn.firstChild);
    
    const stateText = getLocalizedStateText(state);
    const stateTitles = {
      loading: stateText,
      success: stateText,
      error: stateText
    };
    
    const states = {
      loading: { text: '...', bg: '#666', title: stateTitles.loading || 'Loading...', color: '#ffffff' },
      success: { text: '✓', bg: '#4CAF50', title: stateTitles.success || 'Success!', color: '#ffffff' },
      error:   { text: '✗', bg: '#f44336', title: stateTitles.error || 'Error', color: '#ffffff' }
    };
    
    const s = states[state];
    if (!s) return;
    
    const buttonSize = Settings.get('buttonSize') || 22;
    const fontSize = Math.max(10, Math.floor(buttonSize * 0.65));
    const opacity = this.getOpacity();
    
    btn.style.background = s.bg;
    btn.title = s.title;
    btn.style.opacity = opacity;
    
    const span = document.createElement('span');
    span.textContent = s.text;
    span.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: ${s.color || '#ffffff'};
      font-size: ${fontSize}px;
      font-weight: bold;
      line-height: 1;
      pointer-events: none;
      user-select: none;
    `;
    btn.appendChild(span);
  }
};