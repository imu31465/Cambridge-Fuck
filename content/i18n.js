(function () {
  "use strict";
  const root = typeof window !== "undefined" ? window : self;
  const app = (root.CambridgeSolver = root.CambridgeSolver || {});
  const SUPPORTED = ["auto", "en", "ja", "zh"];
  const dictionaries = {
    en: {
      "manifest.desc": "Extracts and auto-fills CambridgeOne quiz answers.",
      "ui.language": "Language",
      "ui.auto": "Auto",
      "ui.english": "English",
      "ui.japanese": "日本語",
      "ui.chinese": "中文",
      "btn.scan": "Re-scan",
      "btn.answerNow": "Answer Now",
      "btn.autoAnswer": "Auto Answer",
      "btn.autoNext": "Auto Next",
      "btn.autoActivity": "Auto Activity",
      "btn.autoWrongStop": "Auto Wrong Stop",
      "btn.refresh": "Refresh",
      "btn.bugReport": "Bug Report",
      "btn.unlock": "Unlock",
      "btn.webhookReset": "Reset",
      "tabs.activity": "Activity",
      "tabs.logs": "Logs",
      "tabs.qa": "Q&A",
      "labels.speed": "Speed",
      "labels.speedLevel": "Speed level L{0}",
      "labels.status": "Status",
      "labels.webhook": "Webhook",
      "webhook.locked": "Bug reports are locked. Enter the unlock password.",
      "webhook.unlocked": "Unlocked — bug reports are enabled.",
      "webhook.passwordPlaceholder": "Password",
      "webhook.unlocking": "Unlocking...",
      "webhook.unlockFailed": "Incorrect password.",
      "webhook.unlockOk": "Webhook unlocked.",
      "webhook.resetOk": "Webhook reset.",
      "popup.buildLabel": "Build {0}",
      "popup.connecting": "Connecting...",
      "popup.connected": "Connected",
      "popup.sending": "Sending...",
      "popup.sendFailed": "Send failed: {0}",
      "popup.noLogs": "(no logs)",
      "popup.noQA": "(no Q&A)",
      "popup.contentScriptDisconnected": "(content script not connected)",
      "msg.cambridgeTabNotFound": "Cambridge tab not found.",
      "msg.activeTabNotFound": "Active tab not found.",
      "msg.emptyResponse": "Content script response is empty.",
      "msg.commandFailed": "Command failed.",
      "msg.unknownCommand": "Unknown command: {0}",
      "msg.webhookLocked": "Bug reports are locked. Unlock the webhook in the extension popup first.",
      "msg.discordSent": "Sent the debug report (page HTML, logs, report, screenshot) to Discord.",
      "msg.discordSendFailed": "Failed to send the bug report: {0}",
      "bg.reportTitle": "Bug report",
      "log.officialPrefix": "[official] ",
      "log.attach": "Attachment",
      "log.attachEmpty": "(empty)",
      "log.ajaxNotFound": "ajaxData not found.",
      "log.jsonParseFailed": "Failed to parse JSON: {0}",
      "log.extractedCount": "Extracted {0} answers.",
      "log.answersNotFound": "No answers were found.",
      "log.dataJsDetected": "data.js URL detected: {0}",
      "log.parsingStarted": "Starting analysis...",
      "log.fetchFailed": "Failed to fetch the data.",
      "log.scanning": "Searching for data.js...",
      "log.scanTimeout": "Timeout: data.js not found.",
      "log.navigated": "URL change detected ({0}). Re-scanning...",
      "log.statusSnapshot": "Status snapshot:\n{0}",
      "log.bridgeReady": "Message bridge initialized.",
      "log.autoWrongStopStoppedAll": "Incorrect feedback detected. All automation was stopped.",
      "log.autoWrongStopOn": "Auto Wrong Stop turned ON.",
      "log.autoWrongStopOff": "Auto Wrong Stop turned OFF.",
      "log.autoWrongStopSeen": "Incorrect feedback detected.",
      "log.speedChanged": "Speed changed: L{0} ({1})",
      "log.autoAnswerOn": "Auto Answer turned ON.",
      "log.autoAnswerOff": "Auto Answer turned OFF.",
      "log.autoAnswerStuckRecovered": "Auto Answer was stuck, so its state was reset.",
      "log.autoAnswerAlreadyRunning": "Auto Answer is already running.",
      "log.autoAnswerNoAnswers": "The answer list is empty. Press \"Re-scan\" first.",
      "log.autoAnswerDuplicateSkip": "Skipped duplicate auto-run for the same data.",
      "log.autoAnswerStarted": "Starting auto-answer logic... ({0})",
      "log.expandedItems": "Expanded {0} collapsed item(s).",
      "log.targetDetection": "Targets detected: gaps={0}, match={1}, dropdown={2}, text={3}, containers={4}, roots={5}",
      "log.gapGroupMode": "Gap grouping mode: {0} / groups={1} / targets={2} / answers={3}",
      "log.wordPoolCount": "Candidate words for gaps: {0}",
      "log.answerMatch": "Question matched: {0} (score={1}, match={2})",
      "log.noCandidateAnswers": "No candidate answers for the gaps were found, so answering stopped.",
      "log.gapTargets": "Gap targets: {0} / answer candidates: {1}",
      "log.answerSelection": "Selected answers: {0}",
      "log.matchDirectMode": "Match direct mode: {0} / groups={1} / targets={2} / answers={3}",
      "log.ambiguousStop": "Could not match the question text; candidates are ambiguous, so answering stopped: {0} / context={1}",
      "log.answerMatchMultiple": "Question matched (multiple answers): {0} / groups={1}",
      "log.topCandidates": "Top candidate scores: {0}",
      "log.debugCurrentAttachment": "currentAttachment={0}",
      "log.debugItemAttachment": "itemAttachment({0})={1}",
      "log.dropdownItemProgress": "Dropdown item: {0} ({1}/{2}) trigger={3}",
      "log.dropdownPageMatch": "Dropdown page matched: {0}",
      "log.dropdownGroup": "Dropdown group: {0} ({1}/{2})",
      "log.dropdownGroupProgress": "progressKey={0} reason={1} lastAtt={2} currAtt={3}",
      "log.dropdownDirectMode": "Dropdown direct mode: targets={0} / answers={1}",
      "log.offScreenInputs": "Detected {0} off-screen input field(s).",
      "log.pageMatched": "Page matched: {0} (score={1})",
      "log.doneActions": "Completed {0} action(s).",
      "log.textEntryError": "Error while processing text entry: {0}",
      "log.noTargets": "No operable elements were found, so this run was stopped.",
      "log.matchCandidates": "Match candidates {0}: sources={1}, strict={2}, loose={3}, clickTargets={4}, sourceId={5}",
      "log.moveDrop": "Q{0}: {1}",
      "log.moveMatch": "{0}: {1}",
      "log.clickWord": "Q{0}: {1}",
      "log.inputField": "Field: {0}",
      "log.dropdownClick": "Q{0} (Dropdown): {1}",
      "log.containerClick": "Q{0} (Container): {1}",
      "log.divClick": "Q{0} (Div): {1}",
      "log.batchInput": "Filled {0} fields in a batch.",
      "log.autoAnswerError": "Exception during auto-answer: {0}",
      "log.speakingStopAutoNext": "Speaking task detected, so Auto Next was stopped.",
      "log.speakingStopAutoActivity": "Speaking task detected, so Auto Activity was stopped.",
      "log.nextButtonClick": "Clicking the {0} button...",
      "log.navigationClickDetected": "Detected a click on {0}. Re-running Auto Answer.",
      "speed.1": "Very Stable",
      "speed.2": "Stable",
      "speed.3": "Balanced",
      "speed.4": "Fast",
      "speed.5": "Very Fast",
      "snap.answersCount": "Extracted answers: {0}",
      "snap.autoAnswer": "Auto Answer: {0}",
      "snap.autoNext": "Auto Next: {0}",
      "snap.autoActivity": "Auto Activity: {0}",
      "snap.autoWrongStop": "Auto Wrong Stop: {0}",
      "snap.speed": "Speed level: L{0}",
      "snap.running": "Running: {0}",
      "snap.yes": "yes",
      "snap.no": "no",
    },
    ja: {
      "manifest.desc": "CambridgeOne のクイズの答えを抽出して自動入力します。",
      "ui.language": "言語",
      "ui.auto": "自動",
      "ui.english": "English",
      "ui.japanese": "日本語",
      "ui.chinese": "中文",
      "btn.scan": "再スキャン",
      "btn.answerNow": "今すぐ自動回答",
      "btn.autoAnswer": "自動回答",
      "btn.autoNext": "自動次へ",
      "btn.autoActivity": "自動アクティビティ",
      "btn.autoWrongStop": "自動誤答停止",
      "btn.refresh": "状態更新",
      "btn.bugReport": "バグ報告",
      "btn.unlock": "ロック解除",
      "btn.webhookReset": "リセット",
      "tabs.activity": "アクティビティ",
      "tabs.logs": "ログ",
      "tabs.qa": "Q&A",
      "labels.speed": "速度",
      "labels.speedLevel": "速度 L{0}",
      "labels.status": "状態",
      "labels.webhook": "Webhook",
      "webhook.locked": "バグ報告はロックされています。ロック解除パスワードを入力してください。",
      "webhook.unlocked": "ロック解除済み — バグ報告を送信できます。",
      "webhook.passwordPlaceholder": "パスワード",
      "webhook.unlocking": "解除中...",
      "webhook.unlockFailed": "パスワードが違います。",
      "webhook.unlockOk": "Webhook をロック解除しました。",
      "webhook.resetOk": "Webhook をリセットしました。",
      "popup.buildLabel": "ビルド {0}",
      "popup.connecting": "接続中...",
      "popup.connected": "接続済み",
      "popup.sending": "送信中...",
      "popup.sendFailed": "送信失敗: {0}",
      "popup.noLogs": "(ログなし)",
      "popup.noQA": "(Q&A なし)",
      "popup.contentScriptDisconnected": "(コンテンツスクリプト未接続)",
      "msg.cambridgeTabNotFound": "Cambridge のタブが見つかりません。",
      "msg.activeTabNotFound": "アクティブなタブが見つかりません。",
      "msg.emptyResponse": "コンテンツスクリプトからの応答が空です。",
      "msg.commandFailed": "コマンドの実行に失敗しました。",
      "msg.unknownCommand": "不明なコマンド: {0}",
      "msg.webhookLocked": "バグ報告はロックされています。先に拡張ポップアップで Webhook をロック解除してください。",
      "msg.discordSent": "デバッグレポート（ページHTML・ログ・レポート・スクリーンショット）を Discord に送信しました。",
      "msg.discordSendFailed": "バグ報告の送信に失敗: {0}",
      "bg.reportTitle": "バグ報告",
      "log.officialPrefix": "[公式] ",
      "log.attach": "添付テキスト",
      "log.attachEmpty": "(空)",
      "log.ajaxNotFound": "ajaxData が見つかりません。",
      "log.jsonParseFailed": "JSON の解析に失敗しました: {0}",
      "log.extractedCount": "{0}個の答えを抽出しました。",
      "log.answersNotFound": "答えが見つかりませんでした。",
      "log.dataJsDetected": "data.js URL を検出: {0}",
      "log.parsingStarted": "解析を開始します...",
      "log.fetchFailed": "データの取得に失敗しました。",
      "log.scanning": "data.js を検索中...",
      "log.scanTimeout": "タイムアウト: data.js が見つかりません。",
      "log.navigated": "URL の変化を検出({0})。再スキャンします。",
      "log.statusSnapshot": "状態スナップショット:\n{0}",
      "log.bridgeReady": "メッセージブリッジを初期化しました。",
      "log.autoWrongStopStoppedAll": "不正解フィードバックを検出したため、自動系をすべて停止しました。",
      "log.autoWrongStopOn": "自動誤答停止を ON にしました。",
      "log.autoWrongStopOff": "自動誤答停止を OFF にしました。",
      "log.autoWrongStopSeen": "不正解フィードバックを検出しました。",
      "log.speedChanged": "速度設定を変更: L{0} ({1})",
      "log.autoAnswerOn": "自動回答を ON にしました。",
      "log.autoAnswerOff": "自動回答を OFF にしました。",
      "log.autoAnswerStuckRecovered": "自動回答の実行状態が固着していたため復旧しました。",
      "log.autoAnswerAlreadyRunning": "自動回答はすでに実行中です。",
      "log.autoAnswerNoAnswers": "答えリストが空です。「再スキャン」を押してください。",
      "log.autoAnswerDuplicateSkip": "同一データへの重複自動実行をスキップしました。",
      "log.autoAnswerStarted": "自動回答ロジックを開始します... ({0})",
      "log.expandedItems": "折りたたまれた項目を {0}件展開しました。",
      "log.targetDetection": "ターゲット検出: gaps={0}, match={1}, dropdown={2}, text={3}, containers={4}, roots={5}",
      "log.gapGroupMode": "Gap 分類モード: {0} / groups={1} / targets={2} / answers={3}",
      "log.wordPoolCount": "空所の候補語数: {0}",
      "log.answerMatch": "問題一致: {0} (score={1}, match={2})",
      "log.noCandidateAnswers": "空所の候補回答が見つからなかったため停止します。",
      "log.gapTargets": "空所ターゲット: {0}件 / 回答候補: {1}件",
      "log.answerSelection": "選択回答: {0}",
      "log.matchDirectMode": "Match 直接モード: {0} / groups={1} / targets={2} / answers={3}",
      "log.ambiguousStop": "問題文を照合できず候補が曖昧なため回答を停止します: {0} / context={1}",
      "log.answerMatchMultiple": "問題一致(複数回答): {0} / groups={1}",
      "log.topCandidates": "候補スコア上位: {0}",
      "log.debugCurrentAttachment": "currentAttachment={0}",
      "log.debugItemAttachment": "itemAttachment({0})={1}",
      "log.dropdownItemProgress": "ドロップダウン項目を進行: {0} ({1}/{2}) trigger={3}",
      "log.dropdownPageMatch": "ドロップダウンのページ一致: {0}",
      "log.dropdownGroup": "ドロップダウングループ: {0} ({1}/{2})",
      "log.dropdownGroupProgress": "progressKey={0} reason={1} lastAtt={2} currAtt={3}",
      "log.dropdownDirectMode": "ドロップダウン直接モード: ターゲット={0} / 回答={1}",
      "log.offScreenInputs": "ビューポート外の入力欄を追加検出: {0}件",
      "log.pageMatched": "ページ特定成功: {0} (score={1})",
      "log.doneActions": "{0}件のアクションを実行しました。",
      "log.textEntryError": "テキスト入力の処理中にエラー: {0}",
      "log.noTargets": "操作対象が見つからなかったため、この実行を終了します。",
      "log.matchCandidates": "Match候補 {0}: sources={1}, strict={2}, loose={3}, clickTargets={4}, sourceId={5}",
      "log.moveDrop": "Q{0}: {1}",
      "log.moveMatch": "{0}: {1}",
      "log.clickWord": "Q{0}: {1}",
      "log.inputField": "入力欄: {0}",
      "log.dropdownClick": "Q{0} (ドロップダウン): {1}",
      "log.containerClick": "Q{0} (コンテナ): {1}",
      "log.divClick": "Q{0} (Div): {1}",
      "log.batchInput": "{0}件を一括入力しました。",
      "log.autoAnswerError": "自動回答中に例外が発生: {0}",
      "log.speakingStopAutoNext": "スピーキング課題を検出したため、自動次へを停止しました。",
      "log.speakingStopAutoActivity": "スピーキング課題を検出したため、自動アクティビティを停止しました。",
      "log.nextButtonClick": "{0}ボタンをクリックします...",
      "log.navigationClickDetected": "{0} のクリックを検出。自動回答を再実行します。",
      "speed.1": "とても安定",
      "speed.2": "安定",
      "speed.3": "標準",
      "speed.4": "高速",
      "speed.5": "とても高速",
      "snap.answersCount": "抽出済みの答え: {0}件",
      "snap.autoAnswer": "自動回答: {0}",
      "snap.autoNext": "自動次へ: {0}",
      "snap.autoActivity": "自動アクティビティ: {0}",
      "snap.autoWrongStop": "自動誤答停止: {0}",
      "snap.speed": "速度: L{0}",
      "snap.running": "実行中: {0}",
      "snap.yes": "はい",
      "snap.no": "いいえ",
    },
    zh: {
      "manifest.desc": "提取 CambridgeOne 测验答案并自动填入。",
      "ui.language": "语言",
      "ui.auto": "自动",
      "ui.english": "English",
      "ui.japanese": "日本語",
      "ui.chinese": "中文",
      "btn.scan": "重新扫描",
      "btn.answerNow": "立即答题",
      "btn.autoAnswer": "自动答题",
      "btn.autoNext": "自动下一题",
      "btn.autoActivity": "自动活动",
      "btn.autoWrongStop": "答错自动停止",
      "btn.refresh": "刷新状态",
      "btn.bugReport": "错误报告",
      "btn.unlock": "解锁",
      "btn.webhookReset": "重置",
      "tabs.activity": "活动",
      "tabs.logs": "日志",
      "tabs.qa": "问答",
      "labels.speed": "速度",
      "labels.speedLevel": "速度 L{0}",
      "labels.status": "状态",
      "labels.webhook": "Webhook",
      "webhook.locked": "错误报告已锁定。请输入解锁密码。",
      "webhook.unlocked": "已解锁 — 可发送错误报告。",
      "webhook.passwordPlaceholder": "密码",
      "webhook.unlocking": "解锁中...",
      "webhook.unlockFailed": "密码不正确。",
      "webhook.unlockOk": "Webhook 已解锁。",
      "webhook.resetOk": "Webhook 已重置。",
      "popup.buildLabel": "版本 {0}",
      "popup.connecting": "连接中...",
      "popup.connected": "已连接",
      "popup.sending": "发送中...",
      "popup.sendFailed": "发送失败：{0}",
      "popup.noLogs": "（暂无日志）",
      "popup.noQA": "（暂无问答）",
      "popup.contentScriptDisconnected": "（内容脚本未连接）",
      "msg.cambridgeTabNotFound": "未找到 Cambridge 标签页。",
      "msg.activeTabNotFound": "未找到活动标签页。",
      "msg.emptyResponse": "内容脚本响应为空。",
      "msg.commandFailed": "命令执行失败。",
      "msg.unknownCommand": "未知命令：{0}",
      "msg.webhookLocked": "错误报告已锁定。请先在扩展弹窗中解锁 Webhook。",
      "msg.discordSent": "已将调试报告（页面 HTML、日志、报告、截图）发送到 Discord。",
      "msg.discordSendFailed": "错误报告发送失败：{0}",
      "bg.reportTitle": "错误报告",
      "log.officialPrefix": "[官方] ",
      "log.attach": "附件文本",
      "log.attachEmpty": "（空）",
      "log.ajaxNotFound": "未找到 ajaxData。",
      "log.jsonParseFailed": "JSON 解析失败：{0}",
      "log.extractedCount": "已提取 {0} 个答案。",
      "log.answersNotFound": "未找到答案。",
      "log.dataJsDetected": "检测到 data.js URL：{0}",
      "log.parsingStarted": "开始解析...",
      "log.fetchFailed": "数据获取失败。",
      "log.scanning": "正在搜索 data.js...",
      "log.scanTimeout": "超时：未找到 data.js。",
      "log.navigated": "检测到 URL 变化（{0}）。重新扫描中...",
      "log.statusSnapshot": "状态快照：\n{0}",
      "log.bridgeReady": "消息桥接已初始化。",
      "log.autoWrongStopStoppedAll": "检测到答错反馈，已停止所有自动化。",
      "log.autoWrongStopOn": "答错自动停止已开启。",
      "log.autoWrongStopOff": "答错自动停止已关闭。",
      "log.autoWrongStopSeen": "检测到答错反馈。",
      "log.speedChanged": "速度已更改：L{0}（{1}）",
      "log.autoAnswerOn": "自动答题已开启。",
      "log.autoAnswerOff": "自动答题已关闭。",
      "log.autoAnswerStuckRecovered": "自动答题曾卡住，已重置其状态。",
      "log.autoAnswerAlreadyRunning": "自动答题已在运行中。",
      "log.autoAnswerNoAnswers": "答案列表为空。请先点击“重新扫描”。",
      "log.autoAnswerDuplicateSkip": "已跳过对相同数据的重复自动运行。",
      "log.autoAnswerStarted": "开始自动答题逻辑...（{0}）",
      "log.expandedItems": "已展开 {0} 个折叠项。",
      "log.targetDetection": "目标检测：gaps={0}，match={1}，dropdown={2}，text={3}，containers={4}，roots={5}",
      "log.gapGroupMode": "填空分组模式：{0} / groups={1} / targets={2} / answers={3}",
      "log.wordPoolCount": "填空候选词数量：{0}",
      "log.answerMatch": "题目匹配：{0}（score={1}，match={2}）",
      "log.noCandidateAnswers": "未找到填空的候选答案，因此停止作答。",
      "log.gapTargets": "填空目标：{0} 个 / 答案候选：{1} 个",
      "log.answerSelection": "已选答案：{0}",
      "log.matchDirectMode": "匹配直接模式：{0} / groups={1} / targets={2} / answers={3}",
      "log.ambiguousStop": "无法匹配题干且候选含糊，因此停止作答：{0} / context={1}",
      "log.answerMatchMultiple": "题目匹配（多答案）：{0} / groups={1}",
      "log.topCandidates": "候选得分前列：{0}",
      "log.debugCurrentAttachment": "currentAttachment={0}",
      "log.debugItemAttachment": "itemAttachment({0})={1}",
      "log.dropdownItemProgress": "下拉项推进：{0}（{1}/{2}）trigger={3}",
      "log.dropdownPageMatch": "下拉页面匹配：{0}",
      "log.dropdownGroup": "下拉组：{0}（{1}/{2}）",
      "log.dropdownGroupProgress": "progressKey={0} reason={1} lastAtt={2} currAtt={3}",
      "log.dropdownDirectMode": "下拉直接模式：目标={0} / 答案={1}",
      "log.offScreenInputs": "额外检测到 {0} 个视口外的输入框。",
      "log.pageMatched": "页面识别成功：{0}（score={1}）",
      "log.doneActions": "已完成 {0} 项操作。",
      "log.textEntryError": "处理文本输入时出错：{0}",
      "log.noTargets": "未找到可操作元素，本次运行结束。",
      "log.matchCandidates": "匹配候选 {0}：sources={1}，strict={2}，loose={3}，clickTargets={4}，sourceId={5}",
      "log.moveDrop": "Q{0}：{1}",
      "log.moveMatch": "{0}：{1}",
      "log.clickWord": "Q{0}：{1}",
      "log.inputField": "输入框：{0}",
      "log.dropdownClick": "Q{0}（下拉）：{1}",
      "log.containerClick": "Q{0}（容器）：{1}",
      "log.divClick": "Q{0}（Div）：{1}",
      "log.batchInput": "已批量填写 {0} 个字段。",
      "log.autoAnswerError": "自动答题时发生异常：{0}",
      "log.speakingStopAutoNext": "检测到口语任务，已停止自动下一题。",
      "log.speakingStopAutoActivity": "检测到口语任务，已停止自动活动。",
      "log.nextButtonClick": "正在点击 {0} 按钮...",
      "log.navigationClickDetected": "检测到 {0} 的点击。重新运行自动答题。",
      "speed.1": "非常稳定",
      "speed.2": "稳定",
      "speed.3": "均衡",
      "speed.4": "快速",
      "speed.5": "极速",
      "snap.answersCount": "已提取答案：{0} 个",
      "snap.autoAnswer": "自动答题：{0}",
      "snap.autoNext": "自动下一题：{0}",
      "snap.autoActivity": "自动活动：{0}",
      "snap.autoWrongStop": "答错自动停止：{0}",
      "snap.speed": "速度：L{0}",
      "snap.running": "运行中：{0}",
      "snap.yes": "是",
      "snap.no": "否",
    },
  };
  const listeners = [];
  let currentLocale = "en";
  let languagePref = "auto";

  function resolveLocale(pref) {
    if (pref === "en" || pref === "ja" || pref === "zh") return pref;
    try {
      const uiLang = String(chrome.i18n.getUILanguage() || "").toLowerCase();
      if (uiLang.startsWith("ja")) return "ja";
      if (uiLang.startsWith("zh")) return "zh";
      return "en";
    } catch (err) {
      return "en";
    }
  }

  function updateLanguageState(pref) {
    const nextPref = SUPPORTED.includes(pref) ? pref : "auto";
    const nextLocale = resolveLocale(nextPref);
    const changed = nextLocale !== currentLocale || nextPref !== languagePref;
    languagePref = nextPref;
    currentLocale = nextLocale;
    if (!changed) return;
    listeners.forEach((callback) => {
      try {
        callback(currentLocale);
      } catch (err) { }
    });
  }

  function t(key, ...args) {
    const dict = dictionaries[currentLocale] || dictionaries.en;
    let text = dict[key];
    if (typeof text !== "string") text = dictionaries.en[key];
    if (typeof text !== "string") text = key;
    if (args.length > 0) {
      text = text.replace(/\{(\d+)\}/g, (match, index) => {
        const value = args[Number(index)];
        return value == null ? "" : String(value);
      });
    }
    return text;
  }

  function readPrefFromStorage() {
    try {
      if (!chrome || !chrome.storage || !chrome.storage.local) return;
      chrome.storage.local.get(["uiLanguage"], (result) => {
        updateLanguageState(result && result.uiLanguage);
      });
    } catch (err) { }
  }

  function watchPrefChanges() {
    try {
      if (!chrome || !chrome.storage || !chrome.storage.onChanged) return;
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local" || !changes.uiLanguage) return;
        updateLanguageState(changes.uiLanguage.newValue);
      });
    } catch (err) { }
  }

  function setLanguage(pref) {
    updateLanguageState(pref);
    try {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ uiLanguage: languagePref });
      }
    } catch (err) { }
  }

  function onChange(callback) {
    if (typeof callback !== "function") return () => { };
    listeners.push(callback);
    return () => {
      const index = listeners.indexOf(callback);
      if (index >= 0) listeners.splice(index, 1);
    };
  }

  currentLocale = resolveLocale("auto");
  readPrefFromStorage();
  watchPrefChanges();

  app.i18n = {
    t,
    setLanguage,
    onChange,
    getLocale: () => currentLocale,
    getPref: () => languagePref,
    dicts: dictionaries,
  };
})();
