(function () {
  "use strict";
  const app = window.CambridgeSolver;
  if (!app) return;
  function cleanQuestionText(rawText) {
    if (!rawText) return null;
    let text = rawText
      .replace(/#feedback[\s\S]*?#endfeedbacktext#/gi, "")
      .replace(/#feedback[\s\S]*/gi, "")
      .replace(/Correct Answer:[\s\S]*/gi, "")
      .replace(/Incorrect![\s\S]*/gi, "")
      .replace(/^\s*[\.,;]\s*/, "")
      .trim();
    if (!text) return null;
    const lowerText = text.toLowerCase();
    const ignorePrefixes = [
      "#",
      "correct!",
      "incorrect!",
      "correct answer",
      "you have scored",
      "you have finished",
    ];
    if (ignorePrefixes.some((prefix) => lowerText.startsWith(prefix))) {
      return null;
    }
    text = text.replace(/\s+/g, " ").trim();
    text = text.replace(/\s+([.,!?;:])/g, "$1");
    if (text.length <= 1 || text.match(/^[0-9]+$/)) return null;
    return text;
  }
  function createQuestionWorkDiv(parent) {
    const workDiv = parent.cloneNode(true);
    workDiv.querySelectorAll("img").forEach((img) => {
      const altText = ` Image: ${img.getAttribute("alt") || "Image"} `;
      img.parentNode.replaceChild(document.createTextNode(altText), img);
    });
    return workDiv;
  }
  function extractGapMatchQuestions(soup) {
    const parent = soup.querySelector("div#contentblock");
    if (!parent) return [];
    const workDiv = createQuestionWorkDiv(parent);
    workDiv.querySelectorAll("gap").forEach((gap) => {
      gap.parentNode.replaceChild(document.createTextNode(" ___ "), gap);
    });
    const text = cleanQuestionText(workDiv.textContent);
    return text ? [text] : [];
  }
  function extractQuestionsFromSoup(soup) {
    const questions = [];
    const parent = soup.querySelector("div#contentblock");
    if (!parent) return questions;
    const workDiv = createQuestionWorkDiv(parent);
    const interactionSelectors = [
      "choiceInteraction",
      "inlineChoiceInteraction",
      "gapMatchInteraction",
      "simpleMatchSet",
      "textEntryInteraction",
      "extendedTextInteraction",
    ];
    workDiv
      .querySelectorAll(interactionSelectors.join(", "))
      .forEach((el) => {
        el.parentNode.replaceChild(
          document.createTextNode("___QUESTION_SPLIT___"),
          el
        );
      });
    const rawText = workDiv.textContent;
    const parts = rawText.split("___QUESTION_SPLIT___");
    parts.forEach((part) => {
      const text = cleanQuestionText(part);
      if (text) questions.push(text);
    });
    return questions;
  }
  function extractMatchInteractionQuestions(soup) {
    const questions = [];
    soup.querySelectorAll("matchInteraction").forEach((interaction) => {
      const sets = interaction.querySelectorAll("simpleMatchSet");
      if (sets.length < 2) return;
      sets[1].querySelectorAll("simpleAssociableChoice").forEach((choice) => {
        const text = cleanQuestionText(choice.textContent || "");
        if (text) questions.push(text);
      });
    });
    return questions;
  }
  function parseDragAndDropAnswers(soup, processAnswer) {
    const gapTextMap = {};
    soup.querySelectorAll("gapText").forEach((el) => {
      gapTextMap[el.getAttribute("identifier")] = el.textContent.trim();
    });
    const correctResp = soup.querySelector("correctResponse");
    if (!correctResp) return;
    const values = [];
    correctResp
      .querySelectorAll("value")
      .forEach((v) => values.push(v.textContent.trim()));
    const pairs = [];
    values.forEach((val) => {
      const parts = val.split(" ");
      if (parts.length === 2) {
        pairs.push({ source: parts[0], target: parts[1] });
      }
    });
    pairs.sort((a, b) =>
      a.target.localeCompare(b.target, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
    pairs.forEach((pair) => {
      const answer = gapTextMap[pair.source];
      if (answer) processAnswer(answer);
    });
  }
  function parseInlineChoiceAnswers(soup, processAnswer) {
    soup.querySelectorAll("responseDeclaration").forEach((declaration) => {
      const correctValueEl = declaration.querySelector("correctResponse > value");
      const responseId = declaration.getAttribute("identifier");
      if (!responseId || !correctValueEl) return;
      const correctAnswerId = correctValueEl.textContent.trim();
      const interaction = soup.querySelector(
        `inlineChoiceInteraction[responseIdentifier="${responseId}"]`
      );
      if (!interaction) return;
      const answerEl = interaction.querySelector(
        `inlineChoice[identifier="${correctAnswerId}"]`
      );
      if (answerEl) processAnswer(answerEl.textContent.trim());
    });
  }
  function buildMatchInteractionAnswerGroupDetails(interaction, declaration) {
    if (!interaction || !declaration) return [];
    const correctResp = declaration.querySelector("correctResponse");
    if (!correctResp) return [];
    const rawPairs = Array.from(correctResp.querySelectorAll("value"))
      .map((valueEl) => String(valueEl.textContent || "").trim())
      .filter(Boolean);
    if (rawPairs.length === 0) return [];
    const matchSets = interaction.querySelectorAll("simpleMatchSet");
    const sourceSet = matchSets.length > 0 ? matchSets[0] : null;
    const targetSet = matchSets.length > 1 ? matchSets[1] : null;
    const sourceChoices = sourceSet
      ? Array.from(sourceSet.querySelectorAll("simpleAssociableChoice"))
      : [];
    const targetChoices = targetSet
      ? Array.from(targetSet.querySelectorAll("simpleAssociableChoice"))
      : [];
    const targetTextById = {};
    targetChoices.forEach((choice) => {
      const id = choice.getAttribute("identifier");
      if (!id) return;
      targetTextById[id] = String(choice.textContent || "").trim() || id;
    });
    const sourceIds = new Set(
      sourceChoices
        .map((choice) => choice.getAttribute("identifier"))
        .filter(Boolean)
    );
    const targetIds = new Set(
      targetChoices
        .map((choice) => choice.getAttribute("identifier"))
        .filter(Boolean)
    );
    const choiceTextById = {};
    interaction.querySelectorAll("simpleAssociableChoice").forEach((choice) => {
      const id = choice.getAttribute("identifier");
      if (!id) return;
      const text = String(choice.textContent || "").trim();
      choiceTextById[id] = text || id;
    });
    const grouped = {};
    const ensureGroup = (key) => {
      const groupKey = key || "__default__";
      if (!grouped[groupKey]) grouped[groupKey] = [];
      return grouped[groupKey];
    };
    rawPairs.forEach((pairText) => {
      const tokens = pairText.split(/\s+/).filter(Boolean);
      if (tokens.length < 2) return;
      const left = tokens[0];
      const right = tokens[1];
      let answerId = "";
      let groupKey = "__default__";
      if (sourceIds.has(left) && targetIds.has(right)) {
        answerId = left;
        groupKey = right;
      } else if (sourceIds.has(right) && targetIds.has(left)) {
        answerId = right;
        groupKey = left;
      } else if (sourceIds.has(left)) {
        answerId = left;
        if (targetIds.has(right)) groupKey = right;
      } else if (sourceIds.has(right)) {
        answerId = right;
        if (targetIds.has(left)) groupKey = left;
      } else if (targetIds.has(left)) {
        answerId = right;
        groupKey = left;
      } else if (targetIds.has(right)) {
        answerId = left;
        groupKey = right;
      } else {
        answerId = right;
      }
      const resolved = String(choiceTextById[answerId] || answerId || "").trim();
      if (!resolved) return;
      ensureGroup(groupKey).push({
        answer: resolved,
        sourceId: String(answerId || "").trim(),
        targetId: String(groupKey || "").trim(),
        pairText,
      });
    });
    const orderedGroups = [];
    targetChoices.forEach((choice) => {
      const id = choice.getAttribute("identifier");
      if (!id || !grouped[id] || grouped[id].length === 0) return;
      orderedGroups.push({
        targetId: id,
        targetText: targetTextById[id] || id,
        entries: grouped[id],
      });
      delete grouped[id];
    });
    Object.keys(grouped).forEach((key) => {
      if (!Array.isArray(grouped[key]) || grouped[key].length === 0) return;
      orderedGroups.push({
        targetId: key,
        targetText: targetTextById[key] || key,
        entries: grouped[key],
      });
    });
    return orderedGroups;
  }
  function parseMatchInteractionAnswerGroups(interaction, declaration) {
    const details = buildMatchInteractionAnswerGroupDetails(interaction, declaration);
    return details
      .map((group) =>
        (Array.isArray(group.entries) ? group.entries : [])
          .map((entry) => String(entry && entry.answer ? entry.answer : "").trim())
          .filter(Boolean)
      )
      .filter((group) => group.length > 0);
  }
  function parseMatchInteractionAnswerGroupDetails(soup) {
    const details = [];
    if (!soup) return details;
    const declarations = Array.from(soup.querySelectorAll("responseDeclaration"));
    soup.querySelectorAll("matchInteraction").forEach((interaction) => {
      const responseId = interaction.getAttribute("responseIdentifier");
      if (!responseId) return;
      const declaration = declarations.find(
        (node) => node.getAttribute("identifier") === responseId
      );
      if (!declaration) return;
      const groups = buildMatchInteractionAnswerGroupDetails(interaction, declaration);
      groups.forEach((group) => {
        const entries = Array.isArray(group.entries) ? group.entries : [];
        if (entries.length === 0) return;
        details.push({
          targetId: String(group.targetId || "").trim(),
          targetText: String(group.targetText || "").trim(),
          entries: entries.map((entry) => ({
            answer: String(entry && entry.answer ? entry.answer : "").trim(),
            sourceId: String(entry && entry.sourceId ? entry.sourceId : "").trim(),
            targetId: String(entry && entry.targetId ? entry.targetId : "").trim(),
            pairText: String(entry && entry.pairText ? entry.pairText : "").trim(),
          })),
        });
      });
    });
    return details;
  }
  function buildImageChoiceSignature(img) {
    if (!img) return "";
    const id = String(img.getAttribute("id") || img.getAttribute("data-id") || "").trim();
    if (id) return id;
    const src = String(img.getAttribute("src") || img.getAttribute("data-src") || "");
    const file = src.split("?")[0].split("/").pop() || "";
    const stem = file.replace(/\.[a-zA-Z0-9]+$/, "").trim();
    return stem;
  }
  function findSimpleChoiceText(scope, answerId) {
    if (!scope || !answerId) return "";
    const choices = Array.from(scope.querySelectorAll("simpleChoice"));
    const found = choices.find((choice) => choice.getAttribute("identifier") === answerId);
    if (!found) return "";
    const text = String(found.textContent || "").trim();
    if (text) return text;
    const img = found.querySelector("img");
    const signature = buildImageChoiceSignature(img);
    return signature ? `img:${signature}` : "";
  }
  function stripAnswerDecorators(rawValue) {
    return String(rawValue || "").replace(/^\*+/, "").trim();
  }
  function isDecoratedPoolValue(rawValue) {
    return /^\*+/.test(String(rawValue || "").trim());
  }
  function selectTextEntryAnswerValues(rawValues, declaration) {
    const cleaned = rawValues.map((value) => String(value || "").trim()).filter(Boolean);
    if (cleaned.length === 0) return [];
    const baseType = String(declaration.getAttribute("baseType") || "").toLowerCase();
    const isTextEntryLikeBaseType =
      baseType === "string" ||
      baseType === "integer" ||
      baseType === "float" ||
      baseType === "decimal";
    if (!isTextEntryLikeBaseType) return [];
    const nonDecorated = cleaned.filter((value) => !isDecoratedPoolValue(value));
    const candidates = nonDecorated.length > 0 ? nonDecorated : cleaned;
    const normalized = candidates.map((value) => stripAnswerDecorators(value)).filter(Boolean);
    if (normalized.length === 0) return [];
    const cardinality = String(declaration.getAttribute("cardinality") || "").toLowerCase();
    if (cardinality === "single") {
      return [normalized[0]];
    }
    return normalized;
  }
  function parseStandardAnswerGroups(soup) {
    const groups = [];
    const interactions = soup.querySelectorAll(
      "choiceInteraction, matchInteraction, textEntryInteraction, extendedTextInteraction"
    );
    if (interactions.length > 0) {
      interactions.forEach((interaction) => {
        const responseId = interaction.getAttribute("responseIdentifier");
        if (!responseId) return;
        const declaration = Array.from(soup.querySelectorAll("responseDeclaration")).find(
          (node) => node.getAttribute("identifier") === responseId
        );
        if (!declaration) return;
        const correctResp = declaration.querySelector("correctResponse");
        if (!correctResp) return;
        const rawValues = Array.from(correctResp.querySelectorAll("value")).map((valueEl) =>
          (valueEl.textContent || "").trim()
        );
        if (rawValues.length === 0) return;
        const group = [];
        if (interaction.tagName === "choiceInteraction") {
          rawValues.forEach((answerId) => {
            if (!answerId) return;
            const resolved =
              findSimpleChoiceText(interaction, answerId) ||
              findSimpleChoiceText(soup, answerId) ||
              answerId;
            group.push(resolved);
          });
        } else if (interaction.tagName === "matchInteraction") {
          const matchGroups = parseMatchInteractionAnswerGroups(
            interaction,
            declaration
          );
          matchGroups.forEach((matchGroup) => {
            if (matchGroup.length > 0) groups.push(matchGroup);
          });
          return;
        } else {
          selectTextEntryAnswerValues(rawValues, declaration).forEach((value) => {
            group.push(value);
          });
        }
        if (group.length > 0) groups.push(group);
      });
      return groups;
    }
    soup.querySelectorAll("responseDeclaration").forEach((declaration) => {
      const correctResp = declaration.querySelector("correctResponse");
      if (!correctResp) return;
      const rawValues = Array.from(correctResp.querySelectorAll("value")).map((valueEl) =>
        (valueEl.textContent || "").trim()
      );
      if (rawValues.length === 0) return;
      const textEntryValues = selectTextEntryAnswerValues(rawValues, declaration);
      if (textEntryValues.length > 0) {
        groups.push(textEntryValues);
        return;
      }
      const group = [];
      rawValues.forEach((answerId) => {
        if (!answerId) return;
        const resolved = findSimpleChoiceText(soup, answerId) || answerId;
        group.push(resolved);
      });
      if (group.length > 0) groups.push(group);
    });
    return groups;
  }
  function parseStandardAnswers(soup, processAnswer) {
    const groups = parseStandardAnswerGroups(soup);
    groups.forEach((group) => {
      group.forEach((answer) => processAnswer(answer));
    });
  }
  app.questionFormats = {
    extractGapMatchQuestions,
    extractMatchInteractionQuestions,
    extractQuestionsFromSoup,
    parseDragAndDropAnswers,
    parseInlineChoiceAnswers,
    parseMatchInteractionAnswerGroupDetails,
    parseStandardAnswerGroups,
    parseStandardAnswers,
  };
})();
