# Cambridge Fuck

[英語](README.md) | 日本語 | [中文](README.zh.md)

CambridgeOne のクイズの答えを抽出して自動入力する Chrome 拡張機能（Manifest V3）。

> 教育・個人利用を想定。Cambridge University Press とは無関係。自己責任で利用すること。

## 機能

- 答えの自動入力: 単一/複数選択（画像のみの選択肢を含む）、インライン選択、ドロップダウン、テキスト入力、穴埋め、マッチング、カテゴリ仕分け
- 自動回答 / 自動次へ / 自動アクティビティ のトグル
- 不正解フィードバックで全自動停止（自動誤答停止）
- スピーキング課題では一時停止
- 速度 5 段階
- UI は English / 日本語 / 中文（初期値は自動判定）
- ポップアップに時刻・重複まとめ付きのログと Q&A 表示

## インストール

1. リポジトリをダウンロードまたは clone
2. `chrome://extensions` を開く
3. デベロッパーモードを ON
4. 「パッケージ化されていない拡張機能を読み込む」でフォルダを選択

## 使い方

CambridgeOne のアクティビティを開くと自動でスキャンが始まる。操作はポップアップから:

| ボタン | 動作 |
| --- | --- |
| 再スキャン | 答えを再抽出 |
| 今すぐ自動回答 | 自動回答を 1 回実行 |
| 自動回答 | 答えを継続的に自動入力 |
| 自動次へ | Check / Next を自動クリック |
| 自動アクティビティ | NEXT ACTIVITY を自動クリック |
| 自動誤答停止 | 不正解検出時に全自動停止 |
| 状態更新 | ポップアップの状態を更新 |
| バグ報告 | デバッグレポートを Discord へ送信 |

速度スライダーは L1（安定重視）〜 L5（最速）。ログと Q&A は **ログ** / **Q&A** タブ。

## バグ報告 Webhook

バグ報告ボタンはデバッグレポート（ログ、全フレームの HTML、スクリーンショット）を Discord Webhook に送信する。Webhook URL は暗号化して同梱（AES-GCM、復号鍵はロック解除パスワードから PBKDF2 で導出）。ポップアップの **Webhook** セクションにパスワードを入力して **ロック解除**。**リセット** で削除。パスワードは配布者が別途配布する。

## 構成

```
.
├── manifest.json
├── background.js        # Service Worker: data.js 取得、Webhook 送信
├── popup.html/.css/.js  # ポップアップ UI
├── content/
│   ├── i18n.js              # 翻訳（EN/JA/ZH）
│   ├── state.js             # 共有状態・ログ
│   ├── question_formats.js  # QTI 形式パーサー
│   ├── extraction.js        # data.js 解析
│   ├── auto_answer.js       # 自動回答エンジン
│   └── ui.js                # ポップアップ連携
├── _locales/            # en, ja, zh
└── icons/
```

設定は `chrome.storage.local` に保存。コンテンツスクリプトは `cambridgeone.org` とそのサブフレームで動作し、`data.js` は Service Worker 経由で取得。

## クレジット

オリジナルの CambridgeOne 答え取得ツール [EverStarck/cambridgeFuck](https://github.com/EverStarck/cambridgeFuck)（Python・アーカイブ済み）を参考に開発。
