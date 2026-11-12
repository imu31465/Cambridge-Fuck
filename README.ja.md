# Cambridge Fuck

[English](README.md) | 日本語

CambridgeOne のクイズの答えを抽出して、自動入力できる Chrome 拡張機能（Manifest V3）です。

> 本プロジェクトは教育・個人利用を目的としています。Cambridge University Press および関連製品とは一切関係ありません。自己責任でご利用ください。

## 主な機能

- **答えの抽出** — クイズコンテンツ（`data.js`）を取得し、問題と正解を抽出
- **対応している問題形式** — 単一 / 複数選択、インライン選択、ドロップダウン & select、テキスト入力、ドラッグ & ドロップ（穴埋め）、マッチング（match interaction）
- **Auto Answer** — 抽出した答えを自動入力
- **Auto Next** — Check / Next ボタンを自動クリック
- **Auto Activity** — NEXT ACTIVITY ボタンを自動クリックして先へ進む
- **自動誤答停止** — 「不正解」フィードバックを検出すると全自動機能を即停止
- **スピーキング課題ガード** — スピーキング課題を検出すると Auto Next / Auto Activity を停止
- **速度設定** — 5段階（L1 Very Stable 〜 L5 Very Fast）。設定は次回起動時にも引き継がれます
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
3. ボタン操作:

| ボタン | 説明 |
| --- | --- |
| 再スキャン | 現在のページの答えを再抽出 |
| 今すぐ自動回答 | Auto Answer を1回だけ実行 |
| Auto Answer | 答えの自動入力を継続実行 |
| Auto Next | Check / Next を自動クリック |
| Auto Activity | NEXT ACTIVITY を自動クリック |
| 自動誤答停止 | 不正解を検出したら全自動機能を停止 |
| 状態更新 | ポップアップの状態を更新 |
| バグ報告 | ログを Discord Webhook へ送信（下記参照） |

4. 速度は L1〜L5 のスライダーで調整
5. ログと抽出した Q&A は **Logs** / **Q&A** タブで確認できます

## バグ報告 Webhook（任意設定）

**バグ報告** ボタンは、直近のログを Discord Webhook へ送信します。
このリポジトリでは Webhook URL がプレースホルダーになっているため、設定するまでボタンは機能しません。

1. Discord で **サーバー設定 → 連携 → Webhook → 新しい Webhook** を作成し、Webhook URL をコピーする
2. `background.js` を開き、プレースホルダーを自分の Webhook URL に置き換える

```js
const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN";
```

プレースホルダーのままの場合は、エラーメッセージが表示されるだけで何も送信されません。

## 構成

```
.
├── manifest.json        # Manifest V3
├── background.js        # Service Worker: data.js 取得プロキシ & バグ報告フォーム生成
├── popup.html           # ポップアップのマークアップ
├── popup.css            # ポップアップのスタイル
├── popup.js             # ポップアップのロジック
├── content/
│   ├── state.js             # 共有状態とログ出力ヘルパー
│   ├── question_formats.js  # 形式ごとの問題・答え解析
│   ├── extraction.js        # data.js の解析と答え抽出
│   ├── auto_answer.js       # Auto Answer / Auto Next / Auto Activity / 自動誤答停止
│   └── ui.js                # ポップアップとのコマンド中継と状態通知
└── icons/               # 拡張機能アイコン（16〜128 px）
```

## メモ

- 設定（自動機能のON/OFF・速度）は `chrome.storage.local` に保存されます
- コンテンツスクリプトは `cambridgeone.org` とその全サブフレームに注入されます
- `data.js` はバックグラウンドの Service Worker 経由で取得します（ホスト権限: `https://content.cambridgeone.org/*`）

## クレジット

オリジナルの CambridgeOne 答え取得プロジェクト [EverStarck/cambridgeFuck](https://github.com/EverStarck/cambridgeFuck)（Python 製・現在はアーカイブ済み）を参考に開発しました。
