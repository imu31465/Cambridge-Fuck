# Cambridge Fuck

English | [日本語](README.ja.md)

A Chrome extension (Manifest V3) that extracts quiz answers from CambridgeOne and fills them in automatically.

> For educational and personal use only. This project is not affiliated with Cambridge University Press or any of its products. Use at your own risk.

## Features

- **Answer extraction** — fetches quiz content (`data.js`) and extracts questions with their correct answers
- **Supported question formats** — single / multiple choice, inline choice, dropdown & native select, text entry, drag & drop (gap match), matching (match interaction)
- **Auto Answer** — fills in the extracted answers automatically
- **Auto Next** — automatically clicks the Check / Next buttons
- **Auto Activity** — automatically clicks "NEXT ACTIVITY" to keep progressing
- **Auto Wrong Stop (自動誤答停止)** — stops all automations as soon as an "Incorrect" feedback is detected
- **Speaking activity guard** — pauses Auto Next / Auto Activity on speaking tasks
- **Speed control** — 5 levels (L1 Very Stable … L5 Very Fast), saved between sessions
- **UI language** — **Auto** (follows the browser), **English**, or **日本語**, switchable from the popup; labels and log messages are localized
- **Popup UI** — status, logs, Q&A list, speed slider and one-click controls

## Installation

1. Download or clone this repository
2. Open `chrome://extensions` (Chrome, Edge, Brave, or any Chromium-based browser)
3. Turn on **Developer mode**
4. Click **Load unpacked** and select the cloned folder
5. Open a CambridgeOne quiz page

## Usage

1. Open any CambridgeOne activity page — the extension scans for quiz data automatically
2. Click the extension icon to open the popup
3. Pick the UI language from the **Language** selector: **Auto** (follows the browser), **English**, or **日本語**
4. Use the buttons:

| Button (EN / JA) | Description |
| --- | --- |
| Re-scan / 再スキャン | Extract answers again for the current page |
| Answer Now / 今すぐ自動回答 | Run Auto Answer once |
| Auto Answer / 自動回答 | Continuously fill answers automatically |
| Auto Next / 自動次へ | Auto-click Check / Next |
| Auto Activity / 自動アクティビティ | Auto-click NEXT ACTIVITY |
| Auto Wrong Stop / 自動誤答停止 | Stop everything when an incorrect answer is detected |
| Refresh / 状態更新 | Refresh the popup status |
| Bug Report / バグ報告 | Send logs to a Discord webhook (see below) |

5. Adjust the speed with the L1–L5 slider
6. Logs and extracted Q&A can be viewed in the **Logs** / **Q&A** tabs

## Bug report webhook (optional)

The **バグ報告 (Bug report)** button sends recent logs to a Discord webhook.
This repository ships with a placeholder URL, so the button does nothing until you configure your own:

1. In Discord: **Server Settings → Integrations → Webhooks → New Webhook**, then copy the webhook URL
2. Edit `background.js` and replace the placeholder:

```js
const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN";
```

If the placeholder is left as-is, the popup shows an error and nothing is sent.

## Project structure

```
.
├── manifest.json        # Manifest V3
├── background.js        # Service worker: data.js fetch proxy & bug-report form
├── popup.html           # Popup markup
├── popup.css            # Popup styles
├── popup.js             # Popup logic
├── content/
│   ├── i18n.js              # Translations (EN/JA) and language switching
│   ├── state.js             # Shared state and logging helpers
│   ├── question_formats.js  # Question / answer parsing per format
│   ├── extraction.js        # data.js parsing and answer extraction
│   ├── auto_answer.js       # Auto Answer / Auto Next / Auto Activity / Auto Wrong Stop
│   └── ui.js                # Popup command bridge and status reporting
├── _locales/            # Localized extension description (en, ja)
└── icons/               # Extension icons (16–128 px)
```

## Notes

- Settings (auto toggles, speed level, UI language) are saved in `chrome.storage.local`
- The content script is injected into `cambridgeone.org` and all of its subframes
- `data.js` is fetched through the background service worker (host permission: `https://content.cambridgeone.org/*`)

## Credits

Developed with reference to [EverStarck/cambridgeFuck](https://github.com/EverStarck/cambridgeFuck) — the original CambridgeOne answer extractor (Python, now archived).
