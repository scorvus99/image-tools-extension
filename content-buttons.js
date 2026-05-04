function getIconUrl(iconName) {
  return chrome.runtime.getURL(CONFIG.ICONS_PATH + iconName);
}

const ButtonFactory = {
  buttons: {},

  create(id) {
    const meta = CONFIG.BUTTONS[id];
    if (!meta) return document.createElement('div');
    
    const btn = document.createElement('div');
    btn.id = `ext-img-${id}`;
    btn.title = meta.tooltip;
    const isEmoji = meta.type === 'emoji';
    
    btn.style.cssText = `
      background: #000000;
      ${isEmoji ? 'color: #ffffff; font-size: 16px; font-family: Arial, sans-serif;' : ''}
      padding: 4px 6px;
      border-radius: 3px;
      cursor: pointer; pointer-events: auto;
      line-height: 1;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      user-select: none;
      transition: background 0.15s ease;
      display: flex; align-items: center; justify-content: center;
      min-width: 24px; min-height: 24px;
    `;
    
    if (isEmoji) {
      btn.textContent = meta.emoji;
    } else {
      const img = document.createElement('img');
      img.src = getIconUrl(meta.icon);
      img.style.cssText = 'width:16px; height:16px; display:block; pointer-events:none;';
      btn.appendChild(img);
    }
    return btn;
  },

  reset(id) {
    const btn = this.buttons[id];
    const meta = CONFIG.BUTTONS[id];
    if (!btn || !meta) return;
    
    btn.style.background = '#000000';
    btn.style.color = meta.type === 'emoji' ? '#ffffff' : '';
    btn.title = meta.tooltip;
    
    if (meta.type === 'emoji') {
      btn.textContent = meta.emoji;
    } else {
      btn.textContent = '';
      const img = document.createElement('img');
      img.src = getIconUrl(meta.icon);
      img.style.cssText = 'width:16px; height:16px; display:block; pointer-events:none;';
      btn.appendChild(img);
    }
  },

  setState(id, state) {
    const btn = this.buttons[id];
    if (!btn) return;
    
    const states = {
      loading: { text: '...', bg: '#666', title: 'Loading...' },
      success: { text: '✓', bg: '#4CAF50', title: 'Success!', color: '#ffffff' },
      error:   { text: '✗', bg: '#f44336', title: 'Error' }
    };
    
    const s = states[state];
    if (!s) return;
    
    btn.textContent = s.text;
    btn.style.background = s.bg;
    btn.title = s.title;
    if (s.color) btn.style.color = s.color;
  }
};