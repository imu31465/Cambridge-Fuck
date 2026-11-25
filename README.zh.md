# Cambridge Fuck

[English](README.md) | [日本語](README.ja.md) | 中文

自动提取 CambridgeOne 测验答案并填入的 Chrome 扩展（Manifest V3）。

> 仅供教育和个人使用。与 Cambridge University Press 无关。请自行承担使用风险。

## 功能

- 自动填入答案：单选/多选（包括纯图片选项）、内联选择、下拉框、文本输入、拖拽填空、匹配题、分类排序
- 自动答题 / 自动下一题 / 自动活动 开关
- 检测到答错反馈时停止全部自动化（答错自动停止）
- 口语任务时自动暂停
- 5 档速度
- 界面语言：English / 日本語 / 中文（默认自动检测）
- 弹窗内带时间戳、重复合并计数的日志和问答视图

## 安装

1. 下载或 clone 本仓库
2. 打开 `chrome://extensions`
3. 开启「开发者模式」
4. 点击「加载已解压的扩展程序」并选择文件夹

## 使用

打开 CambridgeOne 活动页面后会自动开始扫描，其余操作都在弹窗中：

| 按钮 | 操作 |
| --- | --- |
| 重新扫描 | 重新提取答案 |
| 立即答题 | 执行一次自动答题 |
| 自动答题 | 持续自动填入答案 |
| 自动下一题 | 自动点击 Check / Next |
| 自动活动 | 自动点击 NEXT ACTIVITY |
| 答错自动停止 | 检测到答错时停止全部自动化 |
| 刷新状态 | 刷新弹窗状态 |
| 错误报告 | 向 Discord 发送调试报告 |

速度滑块：L1（最稳）〜 L5（最快）。日志和问答在 **日志** / **问答** 标签页。

## 错误报告 Webhook

错误报告按钮会把调试报告（日志、所有 frame 的页面 HTML、截图）发送到 Discord Webhook。Webhook URL 以加密形式内置（AES-GCM，密钥由解锁密码经 PBKDF2 派生）。在弹窗的 **Webhook** 区域输入密码并点击 **解锁**；**重置** 可清除。解锁密码由维护者单独分发。

## 结构

```
.
├── manifest.json
├── background.js        # Service Worker：data.js 代理、Webhook 上传
├── popup.html/.css/.js  # 弹窗 UI
├── content/
│   ├── i18n.js              # 翻译（EN/JA/ZH）
│   ├── state.js             # 共享状态、日志
│   ├── question_formats.js  # QTI 格式解析
│   ├── extraction.js        # data.js 解析
│   ├── auto_answer.js       # 自动答题引擎
│   └── ui.js                # 弹窗桥接
├── _locales/            # en, ja, zh
└── icons/
```

设置保存在 `chrome.storage.local`。内容脚本运行在 `cambridgeone.org` 及其全部子 frame；`data.js` 通过 Service Worker 获取。

## 致谢

基于 [EverStarck/cambridgeFuck](https://github.com/EverStarck/cambridgeFuck)（原始的 CambridgeOne 答案提取工具，Python，已归档）开发。
