(function () {
  "use strict";
  const app = window.CambridgeSolver;
  if (!app || !app.questionFormats) return;
  const { styles } = app;
  function decodeHtmlEntitiesRepeatedly(value) {
    let decoded = value;
    const textarea = document.createElement("textarea");
    while (true) {
      textarea.innerHTML = decoded;
      const nextDecoded = textarea.value;
      if (nextDecoded === decoded) break;
      decoded = nextDecoded;
    }
    return decoded;
  }
  function parseAjaxData(dataJsContent) {
    const match = dataJsContent.match(/ajaxData\s*=\s*(\{[\s\S]+?\});/);
    if (!match || !match[1]) {
      app.logToUI(`%c[ERROR]%c ${app.i18n.t("log.ajaxNotFound")}`, styles.bad, "");
      return null;
    }
    try {
      return JSON.parse(match[1]);
    } catch (_err) {
      const decodedString = decodeHtmlEntitiesRepeatedly(match[1]);
      try {
        return JSON.parse(decodedString);
      } catch (err) {
        app.logToUI(
          `%c[ERROR]%c ${app.i18n.t("log.jsonParseFailed", err.message)}`,
          styles.bad,
          ""
        );
        return null;
      }
    }
  }
  function parseXmlEntry(xmlText) {
    const xml = xmlText
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, "\\");
    const parser = new DOMParser();
    const soup = parser.parseFromString(xml, "application/xml");
    if (soup.querySelector("parsererror")) return null;
    return { xml, soup };
  }
  function normalizeAttachmentText(rawText) {
    return String(rawText || "").replace(/\s+/g, " ").trim();
  }
  function decodeHtmlToText(rawHtml) {
    const html = decodeHtmlEntitiesRepeatedly(String(rawHtml || ""));
    const div = document.createElement("div");
    div.innerHTML = html;
    return normalizeAttachmentText(div.textContent || div.innerText || "");
  }
  function extractAttachmentTextFromSoup(soup, xmlRaw = "") {
    const texts = [];
    const nodes = soup.querySelectorAll("div#attachments div[label='Text']");
    nodes.forEach((node) => {
      const raw = String(node.textContent || "").trim();
      if (!raw) return;
      const decoded = decodeHtmlEntitiesRepeatedly(raw);
      const match = decoded.match(/<text>([\s\S]*?)<\/text>/i);
      const payload = match ? match[1] : decoded;
      const plain = decodeHtmlToText(payload);
      if (plain) texts.push(plain);
    });
    let merged = normalizeAttachmentText(texts.join(" "));
    if (merged) return merged;
    const decodedXml = decodeHtmlEntitiesRepeatedly(String(xmlRaw || ""));
    const regex = /<text>([\s\S]*?)<\/text>/gi;
    let match = null;
    while ((match = regex.exec(decodedXml))) {
      const plain = decodeHtmlToText(match[1]);
      if (plain) texts.push(plain);
    }
    merged = normalizeAttachmentText(texts.join(" "));
    return merged;
  }
  function mainParser(dataJsContent) {
    const xmlDict = parseAjaxData(dataJsContent);
    if (!xmlDict) return;
    app.state.extractedAnswers = [];
    app.state.extractedItems = [];
    app.state.dropdownGroupCursorByKey = {};
    app.state.dropdownGroupLastFingerprintByKey = {};
    app.state.dropdownGroupLastUrlByKey = {};
    app.state.dropdownGroupLastAttachmentByKey = {};
    app.state.dropdownItemCursorByKey = {};
    app.state.dropdownItemLastAdvanceAtByKey = {};
    app.state.dropdownAdvanceSequence = 0;
    app.state.dropdownConsumedAdvanceSeqByKey = {};
    Object.keys(xmlDict).forEach((key) => {
      if (key === "LearningObjectInfo.xml") return;
      const parsed = parseXmlEntry(xmlDict[key]);
      if (!parsed) return;
      const { xml, soup } = parsed;
      const isGapMatch = xml.includes("gapMatchInteraction");
      const isInlineChoice = xml.includes("inlineChoiceInteraction");
      const isMatchInteraction = xml.includes("matchInteraction");
      const currentQuestions = isGapMatch
        ? app.questionFormats.extractGapMatchQuestions(soup)
        : isMatchInteraction &&
          typeof app.questionFormats.extractMatchInteractionQuestions ===
          "function"
          ? app.questionFormats.extractMatchInteractionQuestions(soup)
          : app.questionFormats.extractQuestionsFromSoup(soup);
      const currentAnswers = [];
      const currentAnswerGroups = [];
      const currentAnswerGroupDetails = [];
      const sanitizeExtractedAnswer = (rawText) => {
        if (!rawText) return "";
        let cleanText = String(rawText).includes("|")
          ? String(rawText).split("|")[0]
          : String(rawText);
        cleanText = cleanText
          .replace(/^\*+/, "")
          .replace(/[\{\}]/g, "")
          .trim();
        return cleanText;
      };
      const processAnswer = (extractedText) => {
        if (!extractedText) return;
        const cleanText = sanitizeExtractedAnswer(extractedText);
        if (!cleanText) return;
        currentAnswers.push(cleanText);
        app.state.extractedAnswers.push(cleanText);
      };
      const appendAnswerGroup = (groupValues) => {
        if (!Array.isArray(groupValues) || groupValues.length === 0) return;
        const cleanedGroup = [];
        groupValues.forEach((value) => {
          const beforeLen = currentAnswers.length;
          processAnswer(value);
          if (currentAnswers.length > beforeLen) {
            cleanedGroup.push(currentAnswers[currentAnswers.length - 1]);
          }
        });
        if (cleanedGroup.length > 0) currentAnswerGroups.push(cleanedGroup);
      };
      if (isGapMatch) {
        app.questionFormats.parseDragAndDropAnswers(soup, processAnswer);
        if (currentAnswers.length > 0) {
          currentAnswerGroups.push(currentAnswers.slice());
        }
      } else if (isInlineChoice) {
        app.questionFormats.parseInlineChoiceAnswers(soup, processAnswer);
        currentAnswers.forEach((answer) => {
          currentAnswerGroups.push([answer]);
        });
      } else {
        if (typeof app.questionFormats.parseStandardAnswerGroups === "function") {
          const rawGroups = app.questionFormats.parseStandardAnswerGroups(soup);
          if (rawGroups.length > 0) {
            rawGroups.forEach((group) => appendAnswerGroup(group));
          } else {
            app.questionFormats.parseStandardAnswers(soup, processAnswer);
          }
        } else {
          app.questionFormats.parseStandardAnswers(soup, processAnswer);
        }
      }
      if (
        isMatchInteraction &&
        typeof app.questionFormats.parseMatchInteractionAnswerGroupDetails ===
        "function"
      ) {
        const detailGroups =
          app.questionFormats.parseMatchInteractionAnswerGroupDetails(soup);
        detailGroups.forEach((group) => {
          const entries = Array.isArray(group.entries) ? group.entries : [];
          const cleanedEntries = entries
            .map((entry) => {
              const answer = sanitizeExtractedAnswer(entry && entry.answer);
              if (!answer) return null;
              return {
                answer,
                sourceId: String(entry && entry.sourceId ? entry.sourceId : "").trim(),
                targetId: String(entry && entry.targetId ? entry.targetId : "").trim(),
                pairText: String(entry && entry.pairText ? entry.pairText : "").trim(),
              };
            })
            .filter(Boolean);
          if (cleanedEntries.length === 0) return;
          currentAnswerGroupDetails.push({
            targetId: String(group.targetId || "").trim(),
            targetText: String(group.targetText || "").trim(),
            entries: cleanedEntries,
          });
        });
      }
      if (currentAnswerGroups.length === 0 && currentAnswers.length > 0) {
        if (currentQuestions.length === currentAnswers.length) {
          currentAnswers.forEach((answer) => currentAnswerGroups.push([answer]));
        } else if (currentQuestions.length <= 1) {
          currentAnswerGroups.push(currentAnswers.slice());
        } else {
          let cursor = 0;
          for (let i = 0; i < currentQuestions.length; i += 1) {
            if (cursor < currentAnswers.length) {
              currentAnswerGroups.push([currentAnswers[cursor]]);
              cursor += 1;
            } else {
              currentAnswerGroups.push([]);
            }
          }
          if (cursor < currentAnswers.length && currentAnswerGroups.length > 0) {
            currentAnswerGroups[currentAnswerGroups.length - 1] =
              currentAnswerGroups[currentAnswerGroups.length - 1].concat(
                currentAnswers.slice(cursor)
              );
          }
        }
      }
      const maxCount = Math.max(currentQuestions.length, currentAnswers.length);
      const startAnswerIndex =
        app.state.extractedAnswers.length - currentAnswers.length;
      const attachmentText = extractAttachmentTextFromSoup(soup, xml);
      if (attachmentText) {
        app.logToUI(
          `%c[ATTACH]%c ${app.i18n.t("log.attach")}: ${key}: ${attachmentText.slice(0, 220)}`,
          styles.info,
          ""
        );
      } else {
        app.logToUI(`%c[ATTACH]%c ${app.i18n.t("log.attach")}: ${key}: ${app.i18n.t("log.attachEmpty")}`, styles.info, "");
      }
      if (currentAnswers.length > 0) {
        app.state.extractedItems.push({
          type: isGapMatch ? "gapMatch" : "standard",
          question: currentQuestions.join(" ").trim(),
          questions: currentQuestions.slice(),
          answers: currentAnswers.slice(),
          answerGroups: currentAnswerGroups.map((group) => group.slice()),
          answerGroupDetails: currentAnswerGroupDetails.map((group) => ({
            targetId: group.targetId,
            targetText: group.targetText,
            entries: group.entries.map((entry) => ({ ...entry })),
          })),
          attachmentText,
          sourceKey: key,
        });
      }
      let answerNumber = startAnswerIndex;
      const canGroupLogByQuestion =
        currentQuestions.length > 0 &&
        currentAnswerGroups.length === currentQuestions.length;
      if (canGroupLogByQuestion) {
        for (let i = 0; i < currentQuestions.length; i += 1) {
          app.logToUI(`%c[Q]%c ${currentQuestions[i]}`, styles.good, "");
          app.logToQA("Q", currentQuestions[i]);
          const groupedAnswers = currentAnswerGroups[i] || [];
          groupedAnswers.forEach((answer) => {
            answerNumber += 1;
            app.logToUI(
              `  %c[A${answerNumber}]%c ${answer}`,
              styles.alert,
              ""
            );
            app.logToQA(`A${answerNumber}`, answer);
          });
        }
      } else {
        for (let i = 0; i < maxCount; i += 1) {
          if (i < currentQuestions.length) {
            app.logToUI(`%c[Q]%c ${currentQuestions[i]}`, styles.good, "");
            app.logToQA("Q", currentQuestions[i]);
          }
          if (i < currentAnswers.length) {
            const numbered = startAnswerIndex + i + 1;
            app.logToUI(
              `  %c[A${numbered}]%c ${currentAnswers[i]}`,
              styles.alert,
              ""
            );
            app.logToQA(`A${numbered}`, currentAnswers[i]);
          }
        }
      }
      app.logToUI("");
    });
    if (app.state.extractedAnswers.length > 0) {
      app.logToUI(
        `%c[SUCCESS]%c ${app.i18n.t("log.extractedCount", app.state.extractedAnswers.length)}`,
        styles.success,
        ""
      );
      if (typeof app.maybeAutoAnswer === "function") {
        app.maybeAutoAnswer("extraction");
      }
    } else {
      app.logToUI(`%c[WARN]%c ${app.i18n.t("log.answersNotFound")}`, styles.bad, "");
    }
  }
  function findDataJsUrlInDocument(doc) {
    const scripts = doc.querySelectorAll("script");
    for (const script of scripts) {
      if (script.src && script.src.endsWith("/data.js")) return script.src;
    }
    return null;
  }
  function getDataJsUrl() {
    const docs = app.getAccessibleDocuments();
    for (const doc of docs) {
      const url = findDataJsUrlInDocument(doc);
      if (url) {
        app.state.lastDataJsUrl = url;
        return url;
      }
    }
    return app.state.lastDataJsUrl || "";
  }
  function processQuizData(url) {
    app.state.lastDataJsUrl = url;
    app.logToUI(
      `%c[SUCCESS]%c ${app.i18n.t("log.officialPrefix")}${app.i18n.t("log.dataJsDetected", url)}`,
      "color: green; font-weight: bold;",
      ""
    );
    app.logToUI(`%c[INFO]%c ${app.i18n.t("log.parsingStarted")}`, styles.info, "");
    chrome.runtime.sendMessage({ type: "fetchData", url }, (response) => {
      if (response && response.success) {
        mainParser(response.data);
      } else {
        app.logToUI(`%c[ERROR]%c ${app.i18n.t("log.fetchFailed")}`, styles.bad, "");
      }
    });
  }
  function runExtractionLogic() {
    app.clearAllLogs();
    app.logToUI(
      `%c[SCANNING]%c ${app.i18n.t("log.scanning")}`,
      "color: magenta; font-weight: bold;",
      ""
    );
    if (app.state.currentObserver) app.state.currentObserver.disconnect();
    let found = false;
    const checkForQuiz = () => {
      if (found) return;
      const docs = app.getAccessibleDocuments();
      for (const doc of docs) {
        const url = findDataJsUrlInDocument(doc);
        if (!url) continue;
        found = true;
        processQuizData(url);
        return;
      }
    };
    app.state.currentObserver = new MutationObserver(checkForQuiz);
    app.state.currentObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
    checkForQuiz();
    setTimeout(() => {
      if (!found && app.state.currentObserver) {
        app.logToUI(
          `%c[INFO]%c ${app.i18n.t("log.scanTimeout")}`,
          styles.info,
          ""
        );
        app.state.currentObserver.disconnect();
      }
    }, 15000);
  }
  function observeUrlChanges() {
    if (app.state.urlObserverInitialized) return;
    app.state.urlObserverInitialized = true;
    app.state.lastUrl = window.location.href;
    const scheduleUrlCheck = (reason, delay = 250) => {
      if (app.state.urlChangeTimer) {
        clearTimeout(app.state.urlChangeTimer);
      }
      app.state.urlChangeTimer = setTimeout(() => {
        const currentUrl = window.location.href;
        if (currentUrl === app.state.lastUrl) return;
        app.state.lastUrl = currentUrl;
        app.logToUI(
          `%c[NAVIGATED]%c ${app.i18n.t("log.navigated", reason)}`,
          styles.nav,
          ""
        );
        runExtractionLogic();
      }, delay);
    };
    window.addEventListener("popstate", () => scheduleUrlCheck("popstate", 80));
    window.addEventListener("hashchange", () => scheduleUrlCheck("hashchange", 80));
    if (!app.state.historyPatched) {
      app.state.historyPatched = true;
      const wrapHistoryMethod = (methodName) => {
        const original = history[methodName];
        if (typeof original !== "function") return;
        history[methodName] = function wrappedHistoryMethod(...args) {
          const result = original.apply(this, args);
          scheduleUrlCheck(`history.${methodName}`, 50);
          return result;
        };
      };
      wrapHistoryMethod("pushState");
      wrapHistoryMethod("replaceState");
    }
    if (!app.state.urlPollInterval) {
      app.state.urlPollInterval = setInterval(() => {
        if (window.location.href !== app.state.lastUrl) {
          scheduleUrlCheck("poll", 0);
        }
      }, 500);
    }
  }
  app.mainParser = mainParser;
  app.runExtractionLogic = runExtractionLogic;
  app.observeUrlChanges = observeUrlChanges;
  app.getDataJsUrl = getDataJsUrl;
})();
