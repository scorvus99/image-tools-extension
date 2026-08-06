(async function() {
  await Settings.load();
  UI.build();
  UI.setupMouseEvents();

  Settings.setupListener(() => {
    UI.rebuild();
  });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const handleMessage = async () => {
      if (message.action === 'copyImageToClipboard' && message.imageData) {
        try {
          await Handlers.copyImageToClipboard(message.imageData);
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      if (message.action === 'copyLinkToClipboard' && message.url) {
        try {
          await navigator.clipboard.writeText(message.url);
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      if (message.action === 'showError' && message.message) {
        console.error('[Image Tools] Error:', message.message);
        return;
      }
      if (message.action === 'replaceImage' && message.imageData) {
        console.log('[Image Tools] Replace requested, currentImg:', Handlers.currentImg, '_lastImgSrc:', Handlers._lastImgSrc);

        if (!Handlers.currentImg && Handlers._lastImgSrc) {
          console.log('[Image Tools] Searching for element by src:', Handlers._lastImgSrc);
          const els = document.querySelectorAll('img, video');
          for (const el of els) {
            const elSrc = el.src || (el.tagName === 'VIDEO' ? el.querySelector('source')?.src : '');
            if (elSrc === Handlers._lastImgSrc || elSrc === Handlers._originalSrc) {
              Handlers.setImage(el);
              console.log('[Image Tools] Found element by src');
              break;
            }
          }
        }

        if (!Handlers.currentImg) {
          console.log('[Image Tools] Trying to find any visible large element...');
          const els = document.querySelectorAll('img, video');
          for (const el of els) {
            const isVideo = el.tagName === 'VIDEO';
            const w = isVideo ? el.videoWidth : el.naturalWidth;
            if (w > 200 && el.offsetParent !== null) {
              Handlers.setImage(el);
              console.log('[Image Tools] Found large visible element');
              break;
            }
          }
        }

        if (Handlers.currentImg) {
          console.log('[Image Tools] Replacing content...');
          Handlers.replaceCurrentImage(message.imageData);
          ButtonFactory.setState('yandexocr_replace', 'success');
          Handlers.autoReset('yandexocr_replace');
        } else {
          console.error('[Image Tools] No element to replace!');
        }
        return;
      }

      if (message.action === 'contextMenuAction') {
        Handlers.handleContextMenuAction(message);
        return;
      }
    };

    handleMessage().then(sendResponse);
    return true;
  });

  Handlers._lastImgSrc = null;
  Handlers._originalSrc = null;

  const orig = Handlers.setImage;
  Handlers.setImage = function(img) {
    if (img && img !== Handlers.currentImg) {
      const isVideo = img.tagName === 'VIDEO';
      const newSrc = img.src || (isVideo ? img.querySelector('source')?.src : null);
      if (newSrc !== Handlers._lastImgSrc) {
        Handlers._lastImgSrc = newSrc;
        Handlers._originalSrc = img.getAttribute('src') || Handlers._lastImgSrc;
        console.log('[Image Tools] Set content, src:', Handlers._lastImgSrc, 'original:', Handlers._originalSrc);
      }
    }
    orig.call(this, img);
  };
})();