// Точка входа расширения
(async function() {
  await Settings.load();
  UI.build();
  UI.setupMouseEvents();
  
  // Слушаем изменения настроек
  Settings.setupListener(() => {
    UI.build();
    UI.setupMouseEvents();
    if (Handlers.currentImg) UI.position(Handlers.currentImg);
  });

  // Обработка сообщений от background (для контекстного меню)
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
  });
})();