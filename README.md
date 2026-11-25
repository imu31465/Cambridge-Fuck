# Cambridge Fuck

English | [日本語](README.ja.md)

A Chrome extension (Manifest V3) that extracts quiz answers from CambridgeOne and fills them in automatically.

> For educational and personal use only. This project is not affiliated with Cambridge University Press or any of its products. Use at your own risk.

## Features

- **Answer extraction** — fetches quiz content (`data.js`) and extracts questions with their correct answers
- **Supported question formats** — single / multiple choice (including image-only choices), inline choice, dropdown & native select, text entry, drag & drop (gap match), matching (match interaction), sorting into categories (osSorting)
- **Auto Answer** — fills in the extracted answers automatically
- **Auto Next** — automatically clicks the Check / Next buttons
- **Auto Activity** — automatically clicks "NEXT ACTIVITY" to keep progressing
- **Auto Wrong Stop (自動誤答停止)** — stops all automations as soon as an "Incorrect" feedback is detected
- **Speaking activity guard** — pauses Auto Next / Auto Activity on speaking tasks
- **Speed control** — 5 levels (L1 Very Stable … L5 Very Fast), saved between sessions
- **UI language** — **Auto** (follows the browser), **English**, **日本語**, or **中文**, switchable from the popup; labels and log messages are localized
- **Readable logs** — timestamps, log-level tags and consecutive-duplicate counters in the popup Logs / Q&A tabs
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
3. Pick the UI language from the **Language** selector: **Auto** (follows the browser), **English**, **日本語**, or **中文**
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
| Bug Report / バグ報告 | Send a debug report (logs + full page HTML) to a Discord webhook (see below) |

5. Adjust the speed with the L1–L5 slider
6. Logs and extracted Q&A can be viewed in the **Logs** / **Q&A** tabs

## Bug report webhook (password-locked)

The **Bug report / バグ報告** button sends a debug report to a Discord webhook. The report includes:

- recent logs and a JSON summary of the session
- the full HTML of the page and each frame (`page.html`, `frame-*.html`)
- a screenshot of the visible tab (`screenshot.png`)

The webhook URL is **not stored in this repository in plain text**. It ships as an encrypted blob (AES-GCM, key derived from the unlock password with PBKDF2-SHA-256), and the popup shows a **Webhook** section:

1. Enter the unlock password in the popup's **Webhook** section and click **Unlock**
2. When unlocked, bug reports are enabled; click **Reset** to remove the stored webhook again

The unlock password is distributed separately by the maintainer and is intentionally not included in this repository. If the webhook is locked, the Bug Report button shows an error and nothing is sent.

## Project structure

```
.
├── manifest.json        # Manifest V3
├── background.js        # Service worker: data.js fetch proxy & bug-report uploader
├── popup.html           # Popup markup
├── popup.css            # Popup styles
├── popup.js             # Popup logic
├── content/
│   ├── i18n.js              # Translations (EN/JA/ZH) and language switching
│   ├── state.js             # Shared state and logging helpers
│   ├── question_formats.js  # Question / answer parsing per format
│   ├── extraction.js        # data.js parsing and answer extraction
│   ├── auto_answer.js       # Auto Answer / Auto Next / Auto Activity / Auto Wrong Stop
│   └── ui.js                # Popup command bridge and status reporting
├── _locales/            # Localized extension description (en, ja, zh)
└── icons/               # Extension icons (16–128 px)
```

## Notes

- Settings (auto toggles, speed level, UI language) are saved in `chrome.storage.local`
- The content script is injected into `cambridgeone.org` and all of its subframes
- `data.js` is fetched through the background service worker (host permission: `https://content.cambridgeone.org/*`)

## Credits

Developed with reference to [EverStarck/cambridgeFuck](https://github.com/EverStarck/cambridgeFuck) — the original CambridgeOne answer extractor (Python, now archived).
