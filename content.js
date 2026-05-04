(async function() {
  await Settings.load();
  UI.build();
  UI.setupMouseEvents();
  
  Settings.setupListener(() => {
    UI.build();
    UI.setupMouseEvents();
    if (Handlers.currentImg) UI.position(Handlers.currentImg);
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'copyImageToClipboard' && message.imageData) {
      Handlers.copyImageToClipboard(message.imageData)
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
    if (message.action === 'copyLinkToClipboard' && message.url) {
      navigator.clipboard.writeText(message.url)
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
    if (message.action === 'replaceImage' && message.imageData) {
      console.log('[Image Tools] Replace image requested, currentImg:', Handlers.currentImg, '_lastImgSrc:', Handlers._lastImgSrc);
      
      // Если нет текущего изображения, ищем по сохранённому src
      if (!Handlers.currentImg && Handlers._lastImgSrc) {
        console.log('[Image Tools] Searching for image by src:', Handlers._lastImgSrc);
        const imgs = document.querySelectorAll('img');
        for (const img of imgs) {
          if (img.src === Handlers._lastImgSrc || img.src === Handlers._originalSrc) {
            Handlers.setImage(img);
            console.log('[Image Tools] Found image by src');
            break;
          }
        }
      }
      
      // Если всё ещё нет, ищем любое изображение на странице (последнее просмотренное)
      if (!Handlers.currentImg) {
        console.log('[Image Tools] Trying to find any visible image...');
        const imgs = document.querySelectorAll('img');
        for (const img of imgs) {
          if (img.naturalWidth > 200 && img.offsetParent !== null) {
            Handlers.setImage(img);
            console.log('[Image Tools] Found large visible image');
            break;
          }
        }
      }
      
      if (Handlers.currentImg) {
        console.log('[Image Tools] Replacing image...');
        Handlers.replaceCurrentImage(message.imageData);
        ButtonFactory.setState('yandexocr_replace', 'success');
        Handlers.autoReset('yandexocr_replace');
      } else {
        console.error('[Image Tools] No image to replace!');
      }
      return false;
    }
  });

  Handlers._lastImgSrc = null;
  Handlers._originalSrc = null; // Сохраняем оригинальный src
  
  const orig = Handlers.setImage;
  Handlers.setImage = function(img) { 
    if (img) {
      Handlers._lastImgSrc = img.src;
      // Сохраняем оригинальный src (может отличаться от текущего после fixUrlForOrig)
      Handlers._originalSrc = img.getAttribute('src') || img.src;
      console.log('[Image Tools] Set image, src:', Handlers._lastImgSrc, 'original:', Handlers._originalSrc);
    }
    orig.call(this, img); 
  };
})();