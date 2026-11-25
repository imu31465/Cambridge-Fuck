importScripts("content/i18n.js");
const app = self.CambridgeSolver;
const DISCORD_WEBHOOK_PATTERN =
  /^https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_HTML_FILES = 7;
const WEBHOOK_HEADER_RULE_ID = 1;
function ensureWebhookHeaderRules() {
  try {
    if (
      !chrome.declarativeNetRequest ||
      typeof chrome.declarativeNetRequest.updateSessionRules !== "function"
    ) {
      return;
    }
    chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [WEBHOOK_HEADER_RULE_ID],
      addRules: [
        {
          id: WEBHOOK_HEADER_RULE_ID,
          priority: 1,
          action: {
            type: "modifyHeaders",
            requestHeaders: [
              { header: "Origin", operation: "remove" },
              { header: "Referer", operation: "remove" },
              {
                header: "User-Agent",
                operation: "set",
                value: "CambridgeFuck/20.2 (bug report uploader)",
              },
            ],
          },
          condition: {
            regexFilter:
              "^https://(?:canary\\.|ptb\\.)?discord(?:app)?\\.com/api/webhooks/",
            resourceTypes: ["xmlhttprequest"],
          },
        },
      ],
    }).catch(() => { });
  } catch (_err) { }
}
ensureWebhookHeaderRules();
async function getWebhookUrl() {
  try {
    const result = await chrome.storage.local.get(["webhookUrl"]);
    const url = String((result && result.webhookUrl) || "").trim();
    if (url && DISCORD_WEBHOOK_PATTERN.test(url)) return url;
  } catch (_err) { }
  return "";
}
function buildReportSummary(report) {
  const lines = [
    `Build: ${report.buildId || "unknown"}`,
    `Time: ${new Date(report.timestamp || Date.now()).toISOString()}`,
    `Page: ${report.url || "(unknown)"}`,
  ];
  if (report.title) lines.push(`Title: ${report.title}`);
  lines.push(`data.js: ${report.dataJsUrl || "(not found)"}`);
  if (report.userAgent) lines.push(`UA: ${report.userAgent}`);
  return lines.join("\n");
}
function logEntryToText(entry) {
  if (entry && typeof entry === "object") {
    const ts = String(entry.ts || "").trim();
    const text = String(entry.text || "");
    return ts ? `[${ts}] ${text}` : text;
  }
  return String(entry || "");
}
function buildLogText(report) {
  const logs = Array.isArray(report && report.logs)
    ? report.logs.map(logEntryToText).join("\n")
    : String((report && report.logs) || "");
  return logs || "(empty)";
}
function truncateTextToBytes(text, maxBytes) {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(text);
  if (encoded.byteLength <= maxBytes) {
    return { text, truncated: false };
  }
  const slice = encoded.slice(0, maxBytes);
  const decoder = new TextDecoder();
  return {
    text: `${decoder.decode(slice)}\n\n<!-- truncated: ${encoded.byteLength - maxBytes} bytes omitted -->`,
    truncated: true,
  };
}
function collectFrameHtml(tabId) {
  if (
    !tabId ||
    !chrome.scripting ||
    typeof chrome.scripting.executeScript !== "function"
  ) {
    return Promise.resolve([]);
  }
  return chrome.scripting
    .executeScript({
      target: { tabId, allFrames: true },
      func: () => ({
        url: location.href,
        title: document.title || "",
        html: document.documentElement
          ? document.documentElement.outerHTML
          : "",
      }),
    })
    .then((results) => {
      if (!Array.isArray(results)) return [];
      return results
        .filter((entry) => entry && entry.result)
        .sort((a, b) => Number(a.frameId || 0) - Number(b.frameId || 0));
    })
    .catch(() => []);
}
function captureScreenshot(windowId) {
  if (
    windowId == null ||
    !chrome.tabs ||
    typeof chrome.tabs.captureVisibleTab !== "function"
  ) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    chrome.tabs.captureVisibleTab(windowId, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        resolve(null);
        return;
      }
      resolve(dataUrl);
    });
  });
}
function dataUrlToBlob(dataUrl) {
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(
    String(dataUrl || ""),
  );
  if (!match) return null;
  const mimeType = match[1] || "application/octet-stream";
  if (!match[2]) {
    try {
      return new Blob([decodeURIComponent(match[3])], { type: mimeType });
    } catch (_err) {
      return null;
    }
  }
  try {
    const binary = atob(match[3]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  } catch (_err) {
    return null;
  }
}
async function sendDiscordDebugReport(report, sender) {
  const webhookUrl = await getWebhookUrl();
  if (!webhookUrl) {
    throw new Error(app.i18n.t("msg.webhookLocked"));
  }
  const summary = buildReportSummary(report || {});
  const logText = buildLogText(report || {});
  const clippedLogs =
    logText.length > 1200
      ? `${logText.slice(0, 1200)}\n... (truncated)`
      : logText;
  const content = [
    `**Cambridge Fuck** ${app.i18n.t("bg.reportTitle")}`,
    summary,
    `Logs:\n${clippedLogs}`,
  ]
    .join("\n\n")
    .slice(0, 1900);
  const form = new FormData();
  form.append("payload_json", JSON.stringify({ content }));
  let fileIndex = 0;
  const addTextFile = (name, text, mimeType) => {
    const capped = truncateTextToBytes(String(text || ""), MAX_HTML_BYTES);
    form.append(
      `files[${fileIndex}]`,
      new Blob([capped.text], { type: mimeType }),
      name,
    );
    fileIndex += 1;
    return capped.truncated;
  };
  const tab = sender && sender.tab ? sender.tab : null;
  const frames = await collectFrameHtml(tab ? tab.id : null);
  if (frames.length > 0) {
    frames.slice(0, MAX_HTML_FILES).forEach((frame, index) => {
      const frameId = Number(frame.frameId || 0);
      const name = frameId === 0 ? "page.html" : `frame-${frameId}.html`;
      addTextFile(name, frame.result.html, "text/html");
    });
  } else if (report && report.html) {
    addTextFile("page.html", report.html, "text/html");
  }
  addTextFile("logs.txt", logText, "text/plain");
  const reportSnapshot = { ...(report || {}) };
  delete reportSnapshot.html;
  addTextFile(
    "report.json",
    JSON.stringify(reportSnapshot, null, 2),
    "application/json",
  );
  const screenshotBlob = dataUrlToBlob(
    await captureScreenshot(tab ? tab.windowId : null),
  );
  if (screenshotBlob) {
    form.append(`files[${fileIndex}]`, screenshotBlob, "screenshot.png");
    fileIndex += 1;
  }
  const response = await fetch(`${webhookUrl}?wait=true`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Discord webhook error ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`,
    );
  }
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "fetchData" && request.url) {
    fetch(request.url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Network response was not ok. Status: ${response.status}`,
          );
        }
        return response.text();
      })
      .then((data) => {
        sendResponse({ success: true, data: data });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  if (request.type === "sendDiscordDebugReport" && request.report) {
    sendDiscordDebugReport(request.report, sender)
      .then(() => {
        sendResponse({ ok: true, sent: true });
      })
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error && error.message ? error.message : String(error),
        });
      });
    return true;
  }
});
