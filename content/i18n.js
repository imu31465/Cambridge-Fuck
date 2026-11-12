(function () {
  "use strict";
  const root = typeof window !== "undefined" ? window : self;
  const app = (root.CambridgeSolver = root.CambridgeSolver || {});
  const SUPPORTED = ["auto", "en", "ja"];
  const dictionaries = {
    en: {
      "manifest.desc": "Extracts and auto-fills CambridgeOne quiz answers.",
      "ui.language": "Language",
      "ui.auto": "Auto",
      "ui.english": "English",
      "ui.japanese": "日本語",
      "btn.scan": "Re-scan",
      "btn.answerNow": "Answer Now",
      "btn.autoAnswer": "Auto Answer",
      "btn.autoNext": "Auto Next",
      "btn.autoActivity": "Auto Activity",
      "btn.autoWrongStop": "Auto Wrong Stop",
      "btn.refresh": "Refresh",
      "btn.bugReport": "Bug Report",
      "tabs.activity": "Activity",
      "tabs.logs": "Logs",
      "tabs.qa": "Q&A",
      "labels.speed": "Speed",
      "labels.speedLevel": "Speed level L{0}",
      "labels.status": "Status",
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
      "msg.discordNotConfigured": "Discord Webhook URL is not configured. Set DISCORD_WEBHOOK_URL in background.js to your own webhook URL.",
      "msg.discordFormFailed": "Failed to build the Discord payload.",
      "msg.discordQueued": "Requested to send to Discord. Please check arrival on Discord.",
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
      "btn.scan": "再スキャン",
      "btn.answerNow": "今すぐ自動回答",
      "btn.autoAnswer": "自動回答",
      "btn.autoNext": "自動次へ",
      "btn.autoActivity": "自動アクティビティ",
      "btn.autoWrongStop": "自動誤答停止",
      "btn.refresh": "状態更新",
      "btn.bugReport": "バグ報告",
      "tabs.activity": "アクティビティ",
      "tabs.logs": "ログ",
      "tabs.qa": "Q&A",
      "labels.speed": "速度",
      "labels.speedLevel": "速度 L{0}",
      "labels.status": "状態",
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
      "msg.discordNotConfigured": "Discord Webhook URL が設定されていません。background.js の DISCORD_WEBHOOK_URL を自分の Webhook URL に変更してください。",
      "msg.discordFormFailed": "Discord 送信用データを作成できませんでした。",
      "msg.discordQueued": "Discord へ送信要求を出しました。到着は Discord 側で確認してください。",
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
  };
  const listeners = [];
  let currentLocale = "en";
  let languagePref = "auto";

  function resolveLocale(pref) {
    if (pref === "en" || pref === "ja") return pref;
    try {
      const uiLang = String(chrome.i18n.getUILanguage() || "").toLowerCase();
      return uiLang.startsWith("ja") ? "ja" : "en";
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
