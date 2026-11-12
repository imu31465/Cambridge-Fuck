(function () {
  "use strict";
  const app = (window.CambridgeSolver = window.CambridgeSolver || {});
  app.buildId = "19.8";
  console.info(`[CambridgeSolver] build ${app.buildId}`);
  app.styles = {
    bad: "color: red; font-weight: bold;",
    good: "color: limegreen; font-weight: bold;",
    alert: "color: orange; font-weight: bold;",
    info: "color: cyan; font-weight: bold;",
    nav: "color: yellow; font-weight: bold;",
    success: "color: #28a745; font-weight: bold;",
  };
  app.state = {
    extractedAnswers: [],
    extractedItems: [],
    recentLogs: [],
    qaEntries: [],
    logArea: null,
    qaArea: null,
    lastUrl: "",
    lastDataJsUrl: "",
    uiContainer: null,
    currentObserver: null,
    autoNextInterval: null,
    isAutoNextActive: false,
    autoActivityInterval: null,
    isAutoActivityActive: false,
    isAutoWrongStopActive: false,
    autoWrongStopInterval: null,
    incorrectFeedbackButtonSeen: false,
    isAutoAnswerActive: false,
    isAutoAnswerRunning: false,
    autoAnswerRunId: 0,
    autoAnswerPulseInterval: null,
    speedLevel: 3,
    lastAutoAnswerFinishedAt: 0,
    lastAutoAnswerMatchCount: 0,
    lastAutoAnswerFingerprint: "",
    lastAutoAnswerStartAt: 0,
    urlObserverInitialized: false,
    urlChangeTimer: null,
    urlPollInterval: null,
    historyPatched: false,
    messageBridgeInitialized: false,
  };
  app.logToUI = function logToUI(format, ...styles) {
    const rawText = format.split("%c").join("");
    if (rawText) {
      app.state.recentLogs.push(rawText);
      if (app.state.recentLogs.length > 300) app.state.recentLogs.shift();
    }
    const { logArea } = app.state;
    if (!logArea) return;
    const parts = format.split("%c");
    const logLine = document.createElement("div");
    logLine.style.whiteSpace = "pre-wrap";
    logLine.style.wordBreak = "break-all";
    if (parts[0]) logLine.appendChild(document.createTextNode(parts[0]));
    let styleIndex = 0;
    for (let i = 1; i < parts.length; i += 1) {
      const span = document.createElement("span");
      span.textContent = parts[i];
      if (styles[styleIndex]) span.style.cssText = styles[styleIndex];
      logLine.appendChild(span);
      styleIndex += 1;
    }
    logArea.appendChild(logLine);
    logArea.scrollTop = logArea.scrollHeight;
  };
  app.logToQA = function logToQA(type, text) {
    app.state.qaEntries.push({ type, text });
    if (app.state.qaEntries.length > 300) app.state.qaEntries.shift();
    const { qaArea } = app.state;
    if (!qaArea) return;
    const line = document.createElement("div");
    const typeSpan = document.createElement("span");
    typeSpan.textContent = `[${type}] `;
    typeSpan.style.fontWeight = "bold";
    typeSpan.style.color = type === "Q" ? "limegreen" : "orange";
    line.appendChild(typeSpan);
    line.appendChild(document.createTextNode(text));
    line.style.marginBottom = "8px";
    line.style.lineHeight = "1.4";
    qaArea.appendChild(line);
  };
  app.clearAllLogs = function clearAllLogs() {
    app.state.recentLogs = [];
    app.state.qaEntries = [];
    if (app.state.logArea) app.state.logArea.innerHTML = "";
    if (app.state.qaArea) app.state.qaArea.innerHTML = "";
  };
  app.normalize = function normalize(str) {
    return str ? str.replace(/\s+/g, "").trim().toLowerCase() : "";
  };
  app.isVisible = function isVisible(el) {
    if (!el) return false;
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  };
  app.getAccessibleDocuments = function getAccessibleDocuments() {
    const docs = [];
    const seen = new Set();
    const visitDoc = (doc) => {
      if (!doc || seen.has(doc)) return;
      seen.add(doc);
      docs.push(doc);
      try {
        doc.querySelectorAll("iframe, frame").forEach((frame) => {
          try {
            const childDoc =
              frame.contentDocument ||
              (frame.contentWindow && frame.contentWindow.document);
            if (childDoc) visitDoc(childDoc);
          } catch (_err) {
          }
        });
      } catch (_err) {
      }
    };
    visitDoc(document);
    return docs;
  };
  function collectOpenShadowRoots(root, roots, seenShadowRoots) {
    if (!root || typeof root.querySelectorAll !== "function") return;
    let hosts = [];
    try {
      hosts = Array.from(root.querySelectorAll("*"));
    } catch (_err) {
      hosts = [];
    }
    hosts.forEach((host) => {
      try {
        const shadow = host.shadowRoot;
        if (!shadow || shadow.mode !== "open" || seenShadowRoots.has(shadow)) {
          return;
        }
        seenShadowRoots.add(shadow);
        roots.push(shadow);
        collectOpenShadowRoots(shadow, roots, seenShadowRoots);
      } catch (_err) {
      }
    });
  }
  app.getSearchRoots = function getSearchRoots() {
    const roots = [];
    const seenShadowRoots = new Set();
    const docs = app.getAccessibleDocuments();
    docs.forEach((doc) => {
      roots.push(doc);
      collectOpenShadowRoots(doc, roots, seenShadowRoots);
    });
    return roots;
  };
})();
