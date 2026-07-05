# Image Tools

Extension for Firefox and Chrome with a floating toolbar and context menu for images: copy, save, reverse image search, OCR translation, product search, and face search.

![Version](https://img.shields.io/badge/version-2026.7.5-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)
![Firefox](https://img.shields.io/badge/Firefox-supported-orange)
![Chrome](https://img.shields.io/badge/Chrome-supported-green)

## Features

### Image Actions

- 📋 Copy image to clipboard
- 💾 Quick image save
- 📁 Save image using “Save As”
- 🔗 Copy direct image URL
- 1️⃣2️⃣3️⃣4️⃣ — Quick save to Downloads / Custom folder

### Reverse Image Search

- Google Lens
- Yandex Images
- IQDB
- trace.moe
- ascii2d
- TinEye
- SauceNAO
- PimEyes
- FaceCheck.id
- Lenso.ai
- namethatporn
- namethatpornstar

### Product Search

Search via Google Lens with automatic site filtering:

- Wildberries
- Ozon
- AliExpress

### OCR / Image Text Translation

- Google Translate OCR
- Yandex Translate OCR
- Google Translate OCR with automatic replacement of the original image
- Yandex Translate OCR with automatic replacement of the original image

### Interface

- Floating toolbar over images
- Customizable button size
- Adjustable transparency
- Toolbar position selection:
  - top-left
  - top-right
  - bottom-left
  - bottom-right
- Browser context menu
- Global settings
- Per-site settings
- Russian and English language support

## Installation

### Firefox

<a href="https://addons.mozilla.org/en-US/firefox/addon/image-tools/">
    <picture>
      <source srcset="https://i.imgur.com/ZluoP7T.png" media="(prefers-color-scheme: dark)">
      <img height="58" src="https://i.imgur.com/4PobQqE.png" alt="Firefox add-ons"></picture></a>

### Chrome / Chromium

1. Download and extract the release archive.
2. Open: `chrome://extensions/`
3. Enable: `Developer mode`
4. Click: `Load unpacked`
5. Select the extension folder.

---

## Project Structure

```text
.
├── icons/                         # Service and extension icons
├── manifest.json                  # Manifest V3
├── background.js                  # Service Worker and background handlers
├── config.js                      # Buttons and services configuration
├── content-core.js                # Settings loading and tracking
├── content-buttons.js             # Toolbar button creation
├── content-handlers.js            # Actions: search, copy, OCR
├── content-ui.js                  # Toolbar UI and event handling
├── content.js                     # Content script entry point
├── search-inject.js               # Upload automation for search services
├── popup.html                     # Popup interface
├── popup.js                       # Popup logic
├── i18n.js                        # Localization
├── make_full_tree.bat             # Project tree generator
├── README.md
└── LICENSE
```

## Trademarks

All service names, logos, and icons belong to their respective owners:

- Google / Google Lens — Google LLC
- Yandex — Yandex LLC
- Wildberries — Wildberries LLC
- Ozon — Internet Solutions LLC
- AliExpress — Alibaba Group
- PimEyes — PimEyes s.r.o.
- FaceCheck.id — FaceCheck
- Lenso.ai — Lenso
- IQDB — IQDB.org
- SauceNAO — SauceNAO
- TinEye — Idée Inc.

Icons are used solely for service identification within the extension interface.

If you are a copyright owner and object to the use of your materials, please open an issue or contact the author.

## Security

The extension:

- does not send data to its own servers;
- contains no analytics;
- contains no ads;
- does not use remote code;
- works locally inside the browser.

All requests are sent directly between the user's browser and the selected service.

## License

MIT License

See: `LICENSE`
