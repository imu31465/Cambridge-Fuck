const ui = {
  build: document.getElementById("build"),
  statusLine: document.getElementById("statusLine"),
  logsArea: document.getElementById("logsArea"),
  qaArea: document.getElementById("qaArea"),
  tabLogsBtn: document.getElementById("tabLogsBtn"),
  tabQaBtn: document.getElementById("tabQaBtn"),
  logsPanel: document.getElementById("logsPanel"),
  qaPanel: document.getElementById("qaPanel"),
  scanBtn: document.getElementById("scanBtn"),
  answerNowBtn: document.getElementById("answerNowBtn"),
  toggleAutoAnswerBtn: document.getElementById("toggleAutoAnswerBtn"),
  toggleAutoActivityBtn: document.getElementById("toggleAutoActivityBtn"),
  toggleAutoNextBtn: document.getElementById("toggleAutoNextBtn"),
  toggleAutoWrongStopBtn: document.getElementById("toggleAutoWrongStopBtn"),
  speedLevelRange: document.getElementById("speedLevelRange"),
  speedLevelValue: document.getElementById("speedLevelValue"),
  refreshBtn: document.getElementById("refreshBtn"),
  sendDebugReportBtn: document.getElementById("sendDebugReportBtn"),
};
let activeTabId = null;
let refreshTimer = null;
let activeView = "logs";
let lastLogsKey = "";
let lastQaKey = "";
function setButtonsDisabled(disabled) {
  ui.scanBtn.disabled = disabled;
  ui.answerNowBtn.disabled = disabled;
  ui.toggleAutoAnswerBtn.disabled = disabled;
  ui.toggleAutoActivityBtn.disabled = disabled;
  ui.toggleAutoNextBtn.disabled = disabled;
  ui.toggleAutoWrongStopBtn.disabled = disabled;
  ui.speedLevelRange.disabled = disabled;
  ui.refreshBtn.disabled = disabled;
  ui.sendDebugReportBtn.disabled = disabled;
}
function queryActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!tabs || tabs.length === 0) {
        reject(new Error("Active tab not found"));
        return;
      }
      resolve(tabs[0]);
    });
  });
}
function sendCommand(command, extra = {}) {
  return new Promise((resolve, reject) => {
    if (!activeTabId) {
      reject(new Error("Cambridge タブが見つかりません"));
      return;
    }
    chrome.tabs.sendMessage(
      activeTabId,
      { type: "solverCommand", command, ...extra },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response) {
          reject(new Error("Content script response is empty"));
          return;
        }
        if (response.ok === false) {
          reject(new Error(response.error || "Command failed"));
          return;
        }
        resolve(response);
      },
    );
  });
}
function setActiveView(nextView) {
  activeView = nextView === "qa" ? "qa" : "logs";
  const showLogs = activeView === "logs";
  ui.tabLogsBtn.classList.toggle("is-active", showLogs);
  ui.tabQaBtn.classList.toggle("is-active", !showLogs);
  ui.tabLogsBtn.setAttribute("aria-selected", showLogs ? "true" : "false");
  ui.tabQaBtn.setAttribute("aria-selected", showLogs ? "false" : "true");
  ui.logsPanel.classList.toggle("is-active", showLogs);
  ui.qaPanel.classList.toggle("is-active", !showLogs);
  ui.logsPanel.setAttribute("aria-hidden", showLogs ? "false" : "true");
  ui.qaPanel.setAttribute("aria-hidden", showLogs ? "true" : "false");
}
function getLogTone(tag) {
  if (tag === "Q") return "success";
  if (/^A\d+$/.test(tag)) return "warn";
  const toneByTag = {
    ERROR: "error",
    WARN: "warn",
    SKIP: "warn",
    SUCCESS: "success",
    DONE: "success",
    INFO: "info",
    DEBUG: "info",
    SCANNING: "info",
    NAVIGATED: "info",
    AUTO: "action",
    "AUTO-NEXT": "action",
    "AUTO-WRONG-STOP": "action",
    MOVE: "action",
    CLICK: "action",
    "CLICK-FALLBACK": "action",
    INPUT: "action",
    "BATCH-INPUT": "action",
  };
  return toneByTag[tag] || "";
}
function appendEmptyLine(container, text) {
  if (!container) return;
  const empty = document.createElement("div");
  empty.className = "listEmpty";
  empty.textContent = text;
  container.appendChild(empty);
}
function captureScrollState(container) {
  const maxScrollable = Math.max(
    0,
    container.scrollHeight - container.clientHeight,
  );
  const atBottom =
    maxScrollable <= 0 || container.scrollTop >= maxScrollable - 16;
  return {
    scrollTop: container.scrollTop,
    scrollHeight: container.scrollHeight,
    atBottom,
  };
}
function restoreScrollState(container, state) {
  if (!state) return;
  if (state.atBottom) {
    container.scrollTop = container.scrollHeight;
    return;
  }
  const grownBy = Math.max(0, container.scrollHeight - state.scrollHeight);
  container.scrollTop = Math.max(0, state.scrollTop + grownBy);
}
function renderLogs(logs) {
  if (!ui.logsArea) return;
  const logLines = Array.isArray(logs)
    ? logs.map((line) => String(line || ""))
    : [];
  const nextKey = logLines.join("\n");
  if (nextKey === lastLogsKey) return;
  const scrollState = captureScrollState(ui.logsArea);
  lastLogsKey = nextKey;
  ui.logsArea.textContent = "";
  if (logLines.length === 0) {
    appendEmptyLine(ui.logsArea, "(no logs)");
    restoreScrollState(ui.logsArea, scrollState);
    return;
  }
  logLines.forEach((lineText) => {
    const line = String(lineText || "");
    const match = line.match(/^\s*\[([A-Za-z0-9-]+)\]\s*(.*)$/);
    const tag = match ? match[1].toUpperCase() : "LOG";
    const text = match ? match[2] : line;
    const tone = getLogTone(tag);
    const row = document.createElement("div");
    row.className = `logLine${tone ? ` tone-${tone}` : ""}`;
    const tagEl = document.createElement("span");
    tagEl.className = "logTag";
    tagEl.textContent = `[${tag}]`;
    const textEl = document.createElement("span");
    textEl.className = "logText";
    textEl.textContent = text;
    row.appendChild(tagEl);
    row.appendChild(textEl);
    ui.logsArea.appendChild(row);
  });
  restoreScrollState(ui.logsArea, scrollState);
}
function renderQaEntries(entries) {
  if (!ui.qaArea) return;
  const rows = Array.isArray(entries)
    ? entries.map((entry) => ({
      type: String((entry && entry.type) || ""),
      text: String((entry && entry.text) || ""),
    }))
    : [];
  const nextKey = rows.map((row) => `${row.type}\u0000${row.text}`).join("\n");
  if (nextKey === lastQaKey) return;
  const scrollState = captureScrollState(ui.qaArea);
  lastQaKey = nextKey;
  ui.qaArea.textContent = "";
  if (rows.length === 0) {
    appendEmptyLine(ui.qaArea, "(no Q&A)");
    restoreScrollState(ui.qaArea, scrollState);
    return;
  }
  rows.forEach((entry) => {
    if (!entry.type) return;
    const row = document.createElement("div");
    row.className = "qaLine";
    const badge = document.createElement("span");
    const type = String(entry.type);
    const isQuestion = type.toUpperCase() === "Q";
    badge.className = `qaType ${isQuestion ? "qaTypeQ" : "qaTypeA"}`;
    badge.textContent = `[${type}]`;
    const text = document.createElement("span");
    text.className = "qaText";
    text.textContent = String(entry.text || "");
    row.appendChild(badge);
    row.appendChild(text);
    ui.qaArea.appendChild(row);
  });
  restoreScrollState(ui.qaArea, scrollState);
}
function renderStatus(status) {
  if (!status || status.ok === false) return;
  ui.build.textContent = `Build ${status.buildId || "-"}`;
  ui.statusLine.textContent = "接続済み";
  ui.toggleAutoAnswerBtn.textContent = status.isAutoAnswerActive
    ? "Auto Answer: ON"
    : "Auto Answer: OFF";
  ui.toggleAutoAnswerBtn.style.backgroundColor = status.isAutoAnswerActive
    ? "#1f7a42"
    : "#222a34";
  ui.toggleAutoNextBtn.textContent = status.isAutoNextActive
    ? "Auto Next: ON"
    : "Auto Next: OFF";
  ui.toggleAutoNextBtn.style.backgroundColor = status.isAutoNextActive
    ? "#1f7a42"
    : "#222a34";
  ui.toggleAutoActivityBtn.textContent = status.isAutoActivityActive
    ? "Auto Activity: ON"
    : "Auto Activity: OFF";
  ui.toggleAutoActivityBtn.style.backgroundColor = status.isAutoActivityActive
    ? "#1f7a42"
    : "#222a34";
  ui.toggleAutoWrongStopBtn.textContent = status.isAutoWrongStopActive
    ? "自動誤答停止: ON"
    : "自動誤答停止: OFF";
  ui.toggleAutoWrongStopBtn.style.backgroundColor = status.isAutoWrongStopActive
    ? "#1f7a42"
    : "#222a34";
  const speedLevel = Math.max(1, Math.min(5, Number(status.speedLevel || 3)));
  ui.speedLevelRange.value = String(speedLevel);
  ui.speedLevelValue.textContent = `L${speedLevel}`;
  renderLogs(Array.isArray(status.recentLogs) ? status.recentLogs : []);
  renderQaEntries(Array.isArray(status.qaEntries) ? status.qaEntries : []);
}
function renderError(errorMessage) {
  if (ui.statusLine) ui.statusLine.textContent = errorMessage;
  lastLogsKey = "";
  lastQaKey = "";
  if (ui.logsArea) ui.logsArea.textContent = "";
  if (ui.qaArea) ui.qaArea.textContent = "";
  appendEmptyLine(ui.logsArea, errorMessage || "(content script 未接続)");
  appendEmptyLine(ui.qaArea, "(content script 未接続)");
  setButtonsDisabled(true);
}
async function refreshStatus() {
  try {
    const status = await sendCommand("getStatus");
    setButtonsDisabled(false);
    renderStatus(status);
  } catch (err) {
    renderError(err.message || String(err));
  }
}
async function invoke(command, extra = {}) {
  setButtonsDisabled(true);
  try {
    const status = await sendCommand(command, extra);
    setButtonsDisabled(false);
    renderStatus(status);
  } catch (err) {
    renderError(err.message || String(err));
  }
}
async function initPopup() {
  setButtonsDisabled(true);
  try {
    const tab = await queryActiveTab();
    activeTabId = tab.id;
    await refreshStatus();
  } catch (err) {
    renderError(err.message || String(err));
    return;
  }
  ui.scanBtn.addEventListener("click", () => invoke("scan"));
  ui.answerNowBtn.addEventListener("click", () => invoke("autoAnswerNow"));
  ui.toggleAutoAnswerBtn.addEventListener("click", () =>
    invoke("toggleAutoAnswer"),
  );
  ui.toggleAutoActivityBtn.addEventListener("click", () =>
    invoke("toggleAutoActivity"),
  );
  ui.toggleAutoNextBtn.addEventListener("click", () =>
    invoke("toggleAutoNext"),
  );
  ui.toggleAutoWrongStopBtn.addEventListener("click", () =>
    invoke("toggleAutoWrongStop"),
  );
  ui.speedLevelRange.addEventListener("input", () => {
    const level = Math.max(
      1,
      Math.min(5, Number(ui.speedLevelRange.value || 3)),
    );
    ui.speedLevelValue.textContent = `L${level}`;
  });
  ui.speedLevelRange.addEventListener("change", () => {
    const level = Math.max(
      1,
      Math.min(5, Number(ui.speedLevelRange.value || 3)),
    );
    invoke("setSpeedLevel", { value: level });
  });
  ui.refreshBtn.addEventListener("click", () => refreshStatus());
  ui.sendDebugReportBtn.addEventListener("click", async () => {
    const originalText = ui.sendDebugReportBtn.textContent;
    ui.sendDebugReportBtn.disabled = true;
    ui.sendDebugReportBtn.textContent = "送信中...";
    try {
      const status = await sendCommand("sendDebugReport");
      setButtonsDisabled(false);
      renderStatus(status);
    } catch (err) {
      const message = `送信失敗: ${err.message || String(err)}`;
      if (ui.statusLine) ui.statusLine.textContent = message;
      if (ui.logsArea) ui.logsArea.textContent = "";
      appendEmptyLine(ui.logsArea, message);
      lastLogsKey = "";
      setButtonsDisabled(false);
    } finally {
      ui.sendDebugReportBtn.textContent = originalText;
    }
  });
  ui.tabLogsBtn.addEventListener("click", () => setActiveView("logs"));
  ui.tabQaBtn.addEventListener("click", () => setActiveView("qa"));
  setActiveView(activeView);
  refreshTimer = setInterval(() => {
    refreshStatus();
  }, 1200);
}
window.addEventListener("unload", () => {
  if (refreshTimer) clearInterval(refreshTimer);
});
initPopup();
