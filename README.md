# Cambridge Fuck

English | [日本語](README.ja.md) | [中文](README.zh.md)

A Chrome extension (Manifest V3) that extracts quiz answers from CambridgeOne and fills them in automatically.

> For educational and personal use only. Not affiliated with Cambridge University Press. Use at your own risk.

## Features

- Auto-fills answers: single/multiple choice (including image-only choices), inline choice, dropdowns, text entry, gap match, match interaction, category sorting
- Auto Answer / Auto Next / Auto Activity toggles
- Stops everything on incorrect-answer feedback (Auto Wrong Stop)
- Pauses on speaking tasks
- 5 speed levels
- UI language: English, Japanese, or Chinese (auto-detected by default)
- Popup with logs (timestamped, deduplicated) and a Q&A view

## Install

1. Download or clone this repository
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the folder

## Usage

Open a CambridgeOne activity — scanning starts automatically. The popup controls the rest:

| Button | Action |
| --- | --- |
| Re-scan | Extract answers again |
| Answer Now | Run Auto Answer once |
| Auto Answer | Keep filling answers automatically |
| Auto Next | Auto-click Check / Next |
| Auto Activity | Auto-click NEXT ACTIVITY |
| Auto Wrong Stop | Stop all automation on an incorrect answer |
| Refresh | Refresh popup status |
| Bug Report | Send a debug report to Discord |

Speed slider: L1 (very stable) … L5 (very fast). Logs and extracted Q&A are under the **Logs** / **Q&A** tabs.

## Bug report webhook

The Bug Report button posts a debug report (logs, page HTML of every frame, screenshot) to a Discord webhook. The webhook URL ships encrypted (AES-GCM, key derived from the unlock password via PBKDF2). Enter the password in the popup's **Webhook** section and press **Unlock**; **Reset** removes it. The password is distributed separately by the maintainer.

## Structure

```
.
├── manifest.json
├── background.js        # Service worker: data.js proxy, webhook uploader
├── popup.html/.css/.js  # Popup UI
├── content/
│   ├── i18n.js              # Translations (EN/JA/ZH)
│   ├── state.js             # Shared state, logging
│   ├── question_formats.js  # QTI format parsers
│   ├── extraction.js        # data.js parsing
│   ├── auto_answer.js       # Answering engine
│   └── ui.js                # Popup bridge
├── _locales/            # en, ja, zh
└── icons/
```

Settings are stored in `chrome.storage.local`. Content scripts run on `cambridgeone.org` and all its subframes; `data.js` is fetched through the service worker.

## Credits

Based on [EverStarck/cambridgeFuck](https://github.com/EverStarck/cambridgeFuck), the original CambridgeOne answer extractor (Python, archived).
