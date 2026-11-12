const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN";
const DISCORD_WEBHOOK_PATTERN =
  /^https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/;
function isDiscordWebhookConfigured() {
  return DISCORD_WEBHOOK_PATTERN.test(DISCORD_WEBHOOK_URL);
}
function buildReportSummary(report) {
  const lines = [
    `Build: ${report.buildId || "unknown"}`,
    `Time: ${new Date(report.timestamp || Date.now()).toISOString()}`,
    `Page: ${report.url || "(unknown)"}`,
    `data.js: ${report.dataJsUrl || "(not found)"}`,
  ];
  if (report.userAgent) lines.push(`UA: ${report.userAgent}`);
  return lines.join("\n");
}
function buildDiscordDebugReportForm(report) {
  const summary = buildReportSummary(report || {});
  const logs = Array.isArray(report && report.logs)
    ? report.logs.map((line) => String(line || "")).join("\n")
    : String((report && report.logs) || "");
  const maxLogLength = 1200;
  const logText = logs || "(empty)";
  const clippedLogs =
    logText.length > maxLogLength
      ? `${logText.slice(0, maxLogLength)}\n... (truncated)`
      : logText;
  const content = [
    "**Cambridge Fuck** バグ報告",
    summary,
    `Logs:\n${clippedLogs}`,
  ].join("\n\n").slice(0, 1900);
  const formPayload = new URLSearchParams({ content });
  return {
    action: DISCORD_WEBHOOK_URL,
    fields: Object.fromEntries(formPayload.entries()),
  };
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
  if (request.type === "getDiscordDebugReportForm" && request.report) {
    if (!isDiscordWebhookConfigured()) {
      sendResponse({
        ok: false,
        error:
          "Discord Webhook URL が設定されていません。background.js の DISCORD_WEBHOOK_URL を自分の Webhook URL に変更してください。",
      });
      return;
    }
    sendResponse(buildDiscordDebugReportForm(request.report));
  }
});