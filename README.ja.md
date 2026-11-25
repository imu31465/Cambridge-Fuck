# Cambridge Fuck

[English](README.md) | 日本語

CambridgeOne のクイズの答えを抽出して、自動入力できる Chrome 拡張機能（Manifest V3）です。

> 本プロジェクトは教育・個人利用を目的としています。Cambridge University Press および関連製品とは一切関係ありません。自己責任でご利用ください。

## 主な機能

- **答えの抽出** — クイズコンテンツ（`data.js`）を取得し、問題と正解を抽出
- **対応している問題形式** — 単一 / 複数選択（画像のみの選択肢を含む）、インライン選択、ドロップダウン & select、テキスト入力、ドラッグ & ドロップ（穴埋め）、マッチング（match interaction）、カテゴリへの仕分け（osSorting）
- **Auto Answer** — 抽出した答えを自動入力
- **Auto Next** — Check / Next ボタンを自動クリック
- **Auto Activity** — NEXT ACTIVITY ボタンを自動クリックして先へ進む
- **自動誤答停止** — 「不正解」フィードバックを検出すると全自動機能を即停止
- **スピーキング課題ガード** — スピーキング課題を検出すると Auto Next / Auto Activity を停止
- **速度設定** — 5段階（L1 Very Stable 〜 L5 Very Fast）。設定は次回起動時にも引き継がれます
- **UI言語切替** — **自動**（ブラウザ言語に追従）/ **English** / **日本語** / **中文** をポップアップから切替可能。ラベルもログも選択した言語で表示されます
- **見やすいログ** — ポップアップの ログ / Q&A タブに時刻・レベルタグ・連続重複カウンターを表示
- **ポップアップUI** — 状態・ログ・Q&A一覧・速度スライダー・ワンクリック操作

## インストール

1. このリポジトリをダウンロード、または clone する
2. Chrome（Edge / Brave などの Chromium 系ブラウザでも可）で `chrome://extensions` を開く
3. **デベロッパーモード**をONにする
4. **パッケージ化されていない拡張機能を読み込む** をクリックし、clone したフォルダを選択する
5. CambridgeOne のクイズページを開く

## 使い方

1. CambridgeOne のアクティビティページを開くと、自動でクイズデータのスキャンが始まります
2. 拡張機能のアイコンをクリックしてポップアップを開く
3. **言語** セレクターで UI の言語を選択（**自動** = ブラウザ言語に追従 / **English** / **日本語** / **中文**）
4. ボタン操作:

| ボタン（日本語 / English） | 説明 |
| --- | --- |
| 再スキャン / Re-scan | 現在のページの答えを再抽出 |
| 今すぐ自動回答 / Answer Now | 自動回答を1回だけ実行 |
| 自動回答 / Auto Answer | 答えの自動入力を継続実行 |
| 自動次へ / Auto Next | Check / Next を自動クリック |
| 自動アクティビティ / Auto Activity | NEXT ACTIVITY を自動クリック |
| 自動誤答停止 / Auto Wrong Stop | 不正解を検出したら全自動機能を停止 |
| 状態更新 / Refresh | ポップアップの状態を更新 |
| バグ報告 / Bug Report | デバッグレポート（ログ＋ページ全体のHTML）を Discord Webhook へ送信（下記参照） |

5. 速度は L1〜L5 のスライダーで調整
6. ログと抽出した Q&A は **ログ** / **Q&A** タブで確認できます

## バグ報告 Webhook（パスワード制）

**バグ報告** ボタンは、デバッグレポートを Discord Webhook へ送信します。レポートには次の内容が含まれます:

- 直近のログとセッションの JSON サマリー
- ページ全体と各フレームの HTML（`page.html`, `frame-*.html`）
- 表示中のタブのスクリーンショット（`screenshot.png`）

Webhook URL は、このリポジトリに平文では保存されていません。AES-GCM で暗号化したデータとして同梱されており、復号鍵はロック解除パスワードから PBKDF2-SHA-256 で導出します。ポップアップの **Webhook** セクションで:

1. ロック解除パスワードを入力して **ロック解除** をクリック
2. 解除されるとバグ報告が有効になります。**リセット** を押すと保存した Webhook を削除できます

ロック解除パスワードは配布者から別途入手してください。このリポジトリには意図的に含めていません。ロックされたままの場合、バグ報告ボタンはエラーを表示するだけで何も送信しません。

## 構成

```
.
├── manifest.json        # Manifest V3
├── background.js        # Service Worker: data.js 取得プロキシ & バグレポート送信
├── popup.html           # ポップアップのマークアップ
├── popup.css            # ポップアップのスタイル
├── popup.js             # ポップアップのロジック
├── content/
│   ├── i18n.js              # 翻訳辞書（EN/JA/ZH）と言語切替
│   ├── state.js             # 共有状態とログ出力ヘルパー
│   ├── question_formats.js  # 形式ごとの問題・答え解析
│   ├── extraction.js        # data.js の解析と答え抽出
│   ├── auto_answer.js       # 自動回答 / 自動次へ / 自動アクティビティ / 自動誤答停止
│   └── ui.js                # ポップアップとのコマンド中継と状態通知
├── _locales/            # 拡張機能説明文のローカライズ（en, ja, zh）
└── icons/               # 拡張機能アイコン（16〜128 px）
```

## メモ

- 設定（自動機能のON/OFF・速度・UI言語）は `chrome.storage.local` に保存されます
- コンテンツスクリプトは `cambridgeone.org` とその全サブフレームに注入されます
- `data.js` はバックグラウンドの Service Worker 経由で取得します（ホスト権限: `https://content.cambridgeone.org/*`）

## クレジット

オリジナルの CambridgeOne 答え取得プロジェクト [EverStarck/cambridgeFuck](https://github.com/EverStarck/cambridgeFuck)（Python 製・現在はアーカイブ済み）を参考に開発しました。
