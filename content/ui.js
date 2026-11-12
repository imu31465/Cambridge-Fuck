(function () {
  "use strict";
  const app = window.CambridgeSolver;
  if (!app) return;
  function getStatus() {
    return {
      ok: true,
      buildId: app.buildId || "unknown",
      url: window.location.href,
      extractedAnswersCount: app.state.extractedAnswers.length,
      isAutoAnswerActive: !!app.state.isAutoAnswerActive,
      isAutoAnswerRunning: !!app.state.isAutoAnswerRunning,
      isAutoNextActive: !!app.state.isAutoNextActive,
      isAutoActivityActive: !!app.state.isAutoActivityActive,
      isAutoWrongStopActive: !!app.state.isAutoWrongStopActive,
      speedLevel:
        typeof app.getSpeedLevel === "function"
          ? app.getSpeedLevel()
          : Number(app.state.speedLevel || 3),
      recentLogs: (app.state.recentLogs || []).slice(-80),
      qaEntries: (app.state.qaEntries || []).slice(-80),
      lastDataJsUrl:
        typeof app.getDataJsUrl === "function"
          ? app.getDataJsUrl()
          : app.state.lastDataJsUrl || "",
      timestamp: Date.now(),
    };
  }
  function collectDebugReport() {
    const dataJsUrl =
      typeof app.getDataJsUrl === "function"
        ? app.getDataJsUrl()
        : app.state.lastDataJsUrl || "";
    return {
      buildId: app.buildId || "unknown",
      url: window.location.href,
      dataJsUrl,
      logs: (app.state.recentLogs || []).slice(-200),
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    };
  }
  function sendDebugReportToDiscord() {
    return new Promise((resolve, reject) => {
      const report = collectDebugReport();
      chrome.runtime.sendMessage(
        { type: "getDiscordDebugReportForm", report },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!response || !response.action || !response.fields) {
            reject(
              new Error(
                (response && response.error) ||
                  app.i18n.t("msg.discordFormFailed"),
              ),
            );
            return;
          }
          const frame = document.createElement("iframe");
          const form = document.createElement("form");
          const frameName = `discord-report-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;
          frame.name = frameName;
          frame.hidden = true;
          frame.setAttribute("aria-hidden", "true");
          form.method = "POST";
          form.action = response.action;
          form.target = frameName;
          form.enctype = "application/x-www-form-urlencoded";
          for (const [name, value] of Object.entries(response.fields)) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            input.value = String(value);
            form.appendChild(input);
          }
          document.documentElement.append(frame, form);
          try {
            form.submit();
            form.remove();
            window.setTimeout(() => frame.remove(), 60000);
            resolve({ ok: true, dispatched: true });
          } catch (error) {
            frame.remove();
            form.remove();
            reject(error);
          }
        },
      );
    });
  }
  function shouldDeferToEmbeddedActivityFrame() {
    try {
      if (window !== window.top) return false;
      const host = String(window.location.hostname || "").toLowerCase();
      if (host !== "www.cambridgeone.org") return false;
      const frames = Array.from(document.querySelectorAll("iframe, frame"));
      return frames.some((frame) => {
        const src = String(frame.src || frame.getAttribute("src") || "");
        return /content\.cambridgeone\.org/i.test(src);
      });
    } catch (_err) {
      return false;
    }
  }
  function setAutoAnswerActive(nextValue) {
    const desired = !!nextValue;
    if (!!app.state.isAutoAnswerActive === desired)
      return app.state.isAutoAnswerActive;
    return app.toggleAutoAnswer();
  }
  function setAutoNextActive(nextValue) {
    const desired = !!nextValue;
    if (!!app.state.isAutoNextActive === desired)
      return app.state.isAutoNextActive;
    return app.toggleAutoNext();
  }
  function setAutoActivityActive(nextValue) {
    const desired = !!nextValue;
    if (!!app.state.isAutoActivityActive === desired)
      return app.state.isAutoActivityActive;
    return app.toggleAutoActivity();
  }
  function setAutoWrongStopActive(nextValue) {
    const desired = !!nextValue;
    if (!!app.state.isAutoWrongStopActive === desired)
      return app.state.isAutoWrongStopActive;
    if (typeof app.toggleAutoWrongStop === "function")
      return app.toggleAutoWrongStop();
    return app.state.isAutoWrongStopActive;
  }
  function handleSolverCommand(request, sendResponse) {
    const command = request.command;
    switch (command) {
      case "getStatus":
        sendResponse(getStatus());
        return;
      case "scan":
        app.runExtractionLogic();
        sendResponse(getStatus());
        return;
      case "autoAnswerNow":
        app.autoAnswer();
        sendResponse(getStatus());
        return;
      case "toggleAutoAnswer":
        app.toggleAutoAnswer();
        sendResponse(getStatus());
        return;
      case "toggleAutoNext":
        app.toggleAutoNext();
        sendResponse(getStatus());
        return;
      case "toggleAutoActivity":
        if (typeof app.toggleAutoActivity === "function")
          app.toggleAutoActivity();
        sendResponse(getStatus());
        return;
      case "toggleAutoWrongStop":
        if (typeof app.toggleAutoWrongStop === "function")
          app.toggleAutoWrongStop();
        sendResponse(getStatus());
        return;
      case "setAutoAnswer":
        setAutoAnswerActive(request.value);
        sendResponse(getStatus());
        return;
      case "setAutoNext":
        setAutoNextActive(request.value);
        sendResponse(getStatus());
        return;
      case "setAutoActivity":
        setAutoActivityActive(request.value);
        sendResponse(getStatus());
        return;
      case "setAutoWrongStop":
        setAutoWrongStopActive(request.value);
        sendResponse(getStatus());
        return;
      case "setSpeedLevel":
        if (typeof app.setSpeedLevel === "function") {
          app.setSpeedLevel(request.value, { persist: true, log: true });
        }
        sendResponse(getStatus());
        return;
      case "sendDebugReport":
        sendDebugReportToDiscord()
          .then(() => {
            app.logToUI(
              `%c[INFO]%c ${app.i18n.t("msg.discordQueued")}`,
              app.styles.success,
              "",
            );
            sendResponse({ ...getStatus(), ok: true, sent: true });
          })
          .catch((err) => {
            app.logToUI(
              `%c[ERROR]%c ${app.i18n.t("msg.discordSendFailed", err && err.message ? err.message : err)}`,
              app.styles.bad,
              "",
            );
            sendResponse({
              ok: false,
              error: err && err.message ? err.message : String(err),
            });
          });
        return true;
      default:
        sendResponse({
          ok: false,
          error: app.i18n.t("msg.unknownCommand", command || "-"),
        });
    }
  }
  function initMessageBridge() {
    if (app.state.messageBridgeInitialized) return;
    app.state.messageBridgeInitialized = true;
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (!request || request.type !== "solverCommand") return;
      if (shouldDeferToEmbeddedActivityFrame()) return;
      try {
        return handleSolverCommand(request, sendResponse);
      } catch (err) {
        sendResponse({
          ok: false,
          error: err && err.message ? err.message : String(err),
        });
      }
    });
  }
  initMessageBridge();
  if (!shouldDeferToEmbeddedActivityFrame()) {
    app.runExtractionLogic();
    app.observeUrlChanges();
  }
})();
