(function () {
  "use strict";
  const app = window.CambridgeSolver;
  if (!app) return;
  const { styles } = app;
  if (typeof app.state.isAutoAnswerActive !== "boolean") {
    app.state.isAutoAnswerActive = false;
  }
  if (typeof app.state.isAutoAnswerRunning !== "boolean") {
    app.state.isAutoAnswerRunning = false;
  }
  if (typeof app.state.autoAnswerRunId !== "number") {
    app.state.autoAnswerRunId = 0;
  }
  if (typeof app.state.speedLevel !== "number") {
    app.state.speedLevel = 3;
  }
  if (typeof app.state.autoAnswerPulseInterval === "undefined") {
    app.state.autoAnswerPulseInterval = null;
  }
  if (typeof app.state.isAutoWrongStopActive !== "boolean") {
    app.state.isAutoWrongStopActive = false;
  }
  if (typeof app.state.autoWrongStopInterval === "undefined") {
    app.state.autoWrongStopInterval = null;
  }
  if (typeof app.state.incorrectFeedbackButtonSeen !== "boolean") {
    app.state.incorrectFeedbackButtonSeen = false;
  }
  if (
    !app.state.dropdownGroupCursorByKey ||
    typeof app.state.dropdownGroupCursorByKey !== "object"
  ) {
    app.state.dropdownGroupCursorByKey = {};
  }
  if (
    !app.state.dropdownGroupLastFingerprintByKey ||
    typeof app.state.dropdownGroupLastFingerprintByKey !== "object"
  ) {
    app.state.dropdownGroupLastFingerprintByKey = {};
  }
  if (
    !app.state.dropdownGroupLastUrlByKey ||
    typeof app.state.dropdownGroupLastUrlByKey !== "object"
  ) {
    app.state.dropdownGroupLastUrlByKey = {};
  }
  if (
    !app.state.dropdownGroupLastAttachmentByKey ||
    typeof app.state.dropdownGroupLastAttachmentByKey !== "object"
  ) {
    app.state.dropdownGroupLastAttachmentByKey = {};
  }
  if (
    !app.state.dropdownItemCursorByKey ||
    typeof app.state.dropdownItemCursorByKey !== "object"
  ) {
    app.state.dropdownItemCursorByKey = {};
  }
  if (
    !app.state.dropdownItemLastAdvanceAtByKey ||
    typeof app.state.dropdownItemLastAdvanceAtByKey !== "object"
  ) {
    app.state.dropdownItemLastAdvanceAtByKey = {};
  }
  if (typeof app.state.dropdownAdvanceSequence !== "number") {
    app.state.dropdownAdvanceSequence = 0;
  }
  if (
    !app.state.dropdownConsumedAdvanceSeqByKey ||
    typeof app.state.dropdownConsumedAdvanceSeqByKey !== "object"
  ) {
    app.state.dropdownConsumedAdvanceSeqByKey = {};
  }
  const originalIsVisible = app.isVisible;
  app.isVisible = function (node) {
    if (!node || node.nodeType !== 1) return false;
    if (
      node.closest('.activity--hidden, .slick-cloned, [aria-hidden="true"]')
    ) {
      return false;
    }
    if (typeof originalIsVisible === "function" && !originalIsVisible(node)) {
      return false;
    }
    const rect = node.getBoundingClientRect();
    const win = node.ownerDocument.defaultView || window;
    if (rect.width === 0 || rect.height === 0) return false;
    if (
      rect.bottom <= 0 ||
      rect.top >= win.innerHeight ||
      rect.right <= 0 ||
      rect.left >= win.innerWidth
    ) {
      return false;
    }
    return true;
  };
  function isRendered(node) {
    if (!node || node.nodeType !== 1) return false;
    if (
      node.closest('.activity--hidden, .slick-cloned, [aria-hidden="true"]')
    ) {
      return false;
    }
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    return true;
  }
  function isUnavailableActionButton(button) {
    if (!button) return true;
    if (
      button.hidden ||
      button.hasAttribute("hidden") ||
      button.disabled === true ||
      button.hasAttribute("disabled") ||
      button.getAttribute("aria-disabled") === "true" ||
      button.classList.contains("disabled") ||
      button.classList.contains("inactive_button") ||
      button.classList.contains("button--hidden")
    ) {
      return true;
    }
    try {
      const style = button.ownerDocument.defaultView.getComputedStyle(button);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.pointerEvents === "none"
      ) {
        return true;
      }
    } catch (_err) { }
    return !isRendered(button);
  }
  function isCheckButtonReady(button) {
    if (!button || typeof button.closest !== "function") return false;
    const activityWrapper = button.closest(".activity-renderer-wrapper");
    return (
      !activityWrapper || activityWrapper.classList.contains("button-visible")
    );
  }
  function clickWithoutLinkNavigation(button, viewWin) {
    if (!button) return false;
    const cancelDefaultNavigation = (event) => event.preventDefault();
    button.addEventListener("click", cancelDefaultNavigation, true);
    try {
      if (typeof button.click === "function") {
        button.click();
      } else {
        button.dispatchEvent(
          new MouseEvent("click", {
            view: viewWin || window,
            bubbles: true,
            cancelable: true,
          }),
        );
      }
      return true;
    } finally {
      button.removeEventListener("click", cancelDefaultNavigation, true);
    }
  }
  function getCheckStateSignature(button) {
    if (!button || !button.ownerDocument) return "";
    const docs =
      typeof app.getAccessibleDocuments === "function"
        ? app.getAccessibleDocuments()
        : [button.ownerDocument];
    const activityState = docs
      .map((doc) => {
        const choices = Array.from(
          doc.querySelectorAll(
            '.interaction:not(.pp-present) input[type="checkbox"], .interaction:not(.pp-present) input[type="radio"], .interaction:not(.pp-present) [role="checkbox"], .interaction:not(.pp-present) [role="radio"]',
          ),
        ).filter(
          (choice) =>
            !choice.closest(
              '.activity--hidden, .slick-cloned, [aria-hidden="true"]',
            ),
        );
        const choiceState = choices
          .map((choice) => {
            const owner = choice.matches(
              'input[type="checkbox"], input[type="radio"]',
            )
              ? choice
              : choice.querySelector(
                  'input[type="checkbox"], input[type="radio"]',
                );
            const label = getNodeText(
              choice.closest(".input-checkbox, .input-radio") || choice,
            );
            const checked = owner
              ? owner.checked
              : choice.getAttribute("aria-checked") === "true" ||
                choice.classList.contains("checked");
            return `${normalizeComparableLoose(label)}=${checked ? 1 : 0}`;
          })
          .join("|");
        const questionText = Array.from(
          doc.querySelectorAll(
            ".interaction:not(.pp-present) .contentblock > p",
          ),
        )
          .filter(
            (paragraph) =>
              !paragraph.closest(
                '.activity--hidden, .slick-cloned, [aria-hidden="true"]',
              ),
          )
          .map((paragraph) => normalizeComparableLoose(getNodeText(paragraph)))
          .join("|");
        return `${doc.URL}|${questionText}|${choiceState}`;
      })
      .join("||");
    return `${button.className}|${button.textContent}|${activityState}`;
  }
  const DRAG_SOURCE_SELECTORS =
    ".drag_element, .tap_item, .pool_item, .word, .token, .gap_text, .gapText, .simpleAssociableChoice, .choice, .option, [class*='tap_item'], [class*='drag_item'], [class*='choice'], [class*='associable'], [class*='match'], [class*='source'], [draggable='true'], [role='option'], [role='button'], [tabindex], [identifier], [data-identifier], [data-source], [data-answer], [data-value], [value], [name]";
  const NEXT_BUTTON_TARGETS = [
    {
      selector: ".nextActivityBtn",
      name: "NEXT ACTIVITY",
    },
    {
      selector: 'a.btn.mt-2.btn-primary[qid^="resultScreen-"]',
      name: "Next activity",
    },
    {
      selector: 'a.btn.green-btn[title="Next"]',
      name: "Next",
    },
    {
      selector: '[data-event="forward"]',
      name: "Next",
    },
    {
      selector: 'a.btn.green-btn[title="Check"]',
      name: "Check",
    },
    {
      selector: '[data-event="check"]',
      name: "Check",
    },
  ];
  const AUTO_ANSWER_PULSE_MS = 320;
  const AUTO_ANSWER_INITIAL_PULSE_DELAY_MS = 40;
  const MAYBE_AUTO_ANSWER_DELAY_MS = 20;
  const AUTO_ANSWER_ADVANCE_DELAYS_MS = [40, 140, 320, 760];
  const AUTO_ANSWER_RECENT_FINISH_GUARD_MS = 350;
  const AUTO_ANSWER_PULSE_COOLDOWN_MATCH_MS = 12000;
  const AUTO_ANSWER_PULSE_COOLDOWN_IDLE_MS = 900;
  const AUTO_ANSWER_DEFAULT_COOLDOWN_MS = 1800;
  const AUTO_ANSWER_STUCK_TIMEOUT_MS = 10000;
  const PROCESS_ITEM_DELAY_HIT_MS = 8;
  const PROCESS_ITEM_DELAY_MISS_MS = 0;
  const GAP_PROCESS_ITEM_DELAY_HIT_MS = 12;
  const GAP_PROCESS_ITEM_DELAY_MISS_MS = 2;
  const AUTO_NEXT_POLL_MS = 90;
  const AUTO_NEXT_CLICK_COOLDOWN_MS = 180;
  const SPEED_PROFILES = {
    1: {
      label: "Very Stable",
      pulseMs: 420,
      nextPollMs: 130,
      nextClickCooldownMs: 420,
      nextQueueDelays: [100, 260, 560],
      checkQueueDelays: [55],
    },
    2: {
      label: "Stable",
      pulseMs: 360,
      nextPollMs: 110,
      nextClickCooldownMs: 320,
      nextQueueDelays: [80, 220, 500],
      checkQueueDelays: [45],
    },
    3: {
      label: "Balanced",
      pulseMs: AUTO_ANSWER_PULSE_MS,
      nextPollMs: AUTO_NEXT_POLL_MS,
      nextClickCooldownMs: AUTO_NEXT_CLICK_COOLDOWN_MS,
      nextQueueDelays: [60, 180, 420],
      checkQueueDelays: [40],
    },
    4: {
      label: "Fast",
      pulseMs: 270,
      nextPollMs: 75,
      nextClickCooldownMs: 200,
      nextQueueDelays: [40, 120, 280],
      checkQueueDelays: [24],
    },
    5: {
      label: "Very Fast",
      pulseMs: 220,
      nextPollMs: 60,
      nextClickCooldownMs: 150,
      nextQueueDelays: [28, 90, 210],
      checkQueueDelays: [16],
    },
  };
  const STABLE_NEXT_QUEUE_DELAYS = [90, 240, 560];
  const STABLE_CHECK_QUEUE_DELAYS = [60];
  const STABLE_NEXT_CLICK_COOLDOWN_MS = 220;
  const SPEAKING_PLAY_BUTTON_SELECTOR =
    "button.lrp_record[title='Record'][aria-label='Tap and speak'], button.lrp_record[aria-label*='Tap and speak'], button.lrp_record[title='Record']";
  const INCORRECT_FEEDBACK_BUTTON_SELECTOR =
    'button[aria-label="Incorrect. View Item Specific Feedback"]';
  const AUTO_WRONG_STOP_POLL_MS = 200;
  function getNodeText(node) {
    if (!node) return "";
    return (node.innerText || node.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
  }
  function getAllSearchRoots() {
    if (typeof app.getSearchRoots === "function") {
      const roots = app.getSearchRoots();
      if (Array.isArray(roots) && roots.length > 0) return roots;
    }
    return app.getAccessibleDocuments();
  }
  function getSearchRootsForDocument(doc) {
    const roots = getAllSearchRoots();
    if (!doc) return roots;
    return roots.filter((root) => root === doc || root.ownerDocument === doc);
  }
  function cleanAnswerText(rawText) {
    return (rawText || "")
      .replace(/[\{\}]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  function escapeSelectorValue(value) {
    const raw = String(value || "");
    if (!raw) return "";
    if (typeof CSS !== "undefined" && CSS && typeof CSS.escape === "function") {
      return CSS.escape(raw);
    }
    return raw.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }
  function normalizeComparableText(str) {
    return String(str || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\u00A0\u1680\u2000-\u200D\u202F\u205F\u3000]/g, " ")
      .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, "-")
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u00B4`]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }
  function normalizeComparableLoose(str) {
    return normalizeComparableText(str)
      .replace(/[_\s]+/g, "")
      .replace(/[.,!?;:'"(){}\[\]<>\\/\-]/g, "");
  }
  function isAnswerTextMatch(candidateText, answerText) {
    const candidateNorm = app.normalize(candidateText);
    const answerNorm = app.normalize(answerText);
    if (candidateNorm && answerNorm && candidateNorm === answerNorm)
      return true;
    const candidateComparable = normalizeComparableText(candidateText).replace(
      /\s+/g,
      "",
    );
    const answerComparable = normalizeComparableText(answerText).replace(
      /\s+/g,
      "",
    );
    if (
      candidateComparable &&
      answerComparable &&
      candidateComparable === answerComparable
    ) {
      return true;
    }
    const candidateLoose = normalizeComparableLoose(candidateText);
    const answerLoose = normalizeComparableLoose(answerText);
    return !!candidateLoose && candidateLoose === answerLoose;
  }
  function isSourceTextMatch(candidateText, answerText) {
    if (isAnswerTextMatch(candidateText, answerText)) return true;
    const answer = String(answerText || "").trim();
    if (!/^\d+$/.test(answer)) return false;
    const candidate = String(candidateText || "");
    if (!candidate) return false;
    const candidateNorm = normalizeComparableText(candidate);
    if (!candidateNorm) return false;
    const digitTokens = Array.from(candidateNorm.matchAll(/\d+/g)).map(
      (m) => m[0],
    );
    if (digitTokens.includes(answer)) return true;
    if (candidateNorm === answer) return true;
    if (new RegExp(`(^|\\D)${answer}(\\D|$)`).test(candidateNorm)) return true;
    if (candidateNorm.includes(`sentence ${answer}`)) return true;
    if (candidateNorm.includes(`(${answer})`)) return true;
    return false;
  }
  function matchesSourceIdentifier(element, sourceId) {
    const idText = String(sourceId || "")
      .trim()
      .toLowerCase();
    if (!element || !idText) return false;
    const nodes = [];
    const seen = new Set();
    const addNode = (node) => {
      if (!node || seen.has(node)) return;
      seen.add(node);
      nodes.push(node);
    };
    addNode(element);
    addNode(element.parentElement);
    addNode(
      element.closest(
        "[identifier], [data-identifier], [data-id], [id], [value], [name]",
      ),
    );
    const attrNames = [
      "identifier",
      "data-identifier",
      "data-id",
      "id",
      "value",
      "name",
      "for",
      "aria-label",
      "title",
      "data-value",
      "data-answer",
      "data-source",
    ];
    for (const node of nodes) {
      if (!node) continue;
      for (const attr of attrNames) {
        const raw = String(
          node.getAttribute && node.getAttribute(attr)
            ? node.getAttribute(attr)
            : "",
        )
          .trim()
          .toLowerCase();
        if (!raw) continue;
        if (raw === idText) return true;
        if (raw.includes(idText)) return true;
      }
      const classRaw = String(node.className || "")
        .trim()
        .toLowerCase();
      if (classRaw && classRaw.includes(idText)) return true;
    }
    return false;
  }
  function getInlineChoiceIdentifierCandidates(answerText) {
    const raw = String(answerText || "")
      .trim()
      .toLowerCase();
    if (!raw) return [];
    const candidates = [raw];
    if (/^[a-z]$/.test(raw)) {
      const index = raw.charCodeAt(0) - 97;
      if (index >= 0) candidates.push(String(index));
    } else if (/^\d+$/.test(raw)) {
      const asNumber = Number(raw);
      if (asNumber >= 0 && asNumber < 26) {
        candidates.push(String.fromCharCode(97 + asNumber));
      }
    }
    return Array.from(new Set(candidates));
  }
  function matchesDropdownOption(optionEl, answerText) {
    if (!optionEl) return false;
    if (isAnswerTextMatch(getNodeText(optionEl), answerText)) return true;
    const attrs = [
      optionEl.getAttribute("data-value"),
      optionEl.getAttribute("value"),
      optionEl.getAttribute("data-id"),
      optionEl.getAttribute("data-identifier"),
    ]
      .map((v) =>
        String(v || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean);
    const candidates = getInlineChoiceIdentifierCandidates(answerText);
    if (candidates.length === 0) return false;
    if (attrs.some((attr) => candidates.includes(attr))) return true;
    return false;
  }
  function pickBestDropdownOption(options, answerText) {
    const list = Array.isArray(options) ? options : Array.from(options || []);
    if (list.length === 0) return null;
    const raw = String(answerText || "")
      .trim()
      .toLowerCase();
    const isPlaceholderLike = (option) => {
      const text = normalizeComparableText(getNodeText(option));
      if (!text) return true;
      return /^(select|choose|pick|--)$/.test(text) || /^select /.test(text);
    };
    if (/^[a-z]$/.test(raw)) {
      const prefixRegex = new RegExp(`^${raw}[\\).:\\s]`, "i");
      for (const option of list) {
        const text = String(getNodeText(option) || "").trim();
        if (prefixRegex.test(text)) return option;
      }
      const filtered = list.filter((option) => !isPlaceholderLike(option));
      const index = raw.charCodeAt(0) - 97;
      if (index >= 0 && index < filtered.length) return filtered[index];
    }
    for (const option of list) {
      if (isAnswerTextMatch(getNodeText(option), answerText)) return option;
    }
    for (const option of list) {
      if (matchesDropdownOption(option, answerText)) return option;
    }
    return null;
  }
  function collectVisibleDropdownOptions(container, options = {}) {
    const { allowGlobalFallback = true } = options;
    if (!container || !container.ownerDocument) return [];
    const doc = container.ownerDocument;
    const selectors = [
      "li",
      "[role='option']",
      ".option",
      ".dropdown-item",
      ".popup li",
      ".rich-dropdown li",
      ".wrapper-dropdown li",
    ];
    const results = [];
    const seen = new Set();
    const addNode = (node) => {
      if (!node || seen.has(node)) return;
      seen.add(node);
      if (!isRendered(node)) return;
      if (isSolverUiNode(node)) return;
      if (
        node.classList.contains("disabled") ||
        node.getAttribute("aria-disabled") === "true"
      ) {
        return;
      }
      results.push(node);
    };
    selectors.forEach((selector) => {
      container.querySelectorAll(selector).forEach(addNode);
    });
    if (results.length === 0 && allowGlobalFallback) {
      getSearchRootsForDocument(doc).forEach((root) => {
        selectors.forEach((selector) => {
          root.querySelectorAll(selector).forEach(addNode);
        });
      });
    }
    results.sort(compareDomOrder);
    return results;
  }
  function collectDropdownOptionsAfterOpen(container, trigger) {
    if (!container || !trigger) return [];
    const before = new Set(
      collectVisibleDropdownOptions(container, {
        allowGlobalFallback: false,
      }),
    );
    trigger.click();
    const after = collectVisibleDropdownOptions(container, {
      allowGlobalFallback: false,
    });
    const appeared = after.filter((node) => !before.has(node));
    if (appeared.length > 0) return appeared;
    if (after.length > 0) return after;
    return collectVisibleDropdownOptions(container, {
      allowGlobalFallback: true,
    });
  }
  function collectOrderedDropdownTargets() {
    const targets = [];
    const seen = new Set();
    const addTarget = (node) => {
      if (!node || seen.has(node)) return;
      if (!isRendered(node)) return;
      if (isSolverUiNode(node)) return;
      if (node.matches("select")) {
        if (node.disabled) return;
        if (node.closest(".wrapper-dropdown")) return;
      }
      seen.add(node);
      targets.push(node);
    };
    getAllSearchRoots().forEach((root) => {
      if (!root || typeof root.querySelectorAll !== "function") return;
      root.querySelectorAll(".wrapper-dropdown, select").forEach(addTarget);
    });
    targets.sort(compareDomOrder);
    return targets;
  }
  function getDropdownPageFingerprint(dropdownTargets) {
    const targets = Array.isArray(dropdownTargets) ? dropdownTargets : [];
    return targets
      .map((target) => {
        const root =
          target.closest(
            ".que, fieldset, .question, .prompt, .item, li, p, .contentblock",
          ) ||
          target.parentElement ||
          target;
        return normalizeComparableText(getNodeText(root));
      })
      .filter(Boolean)
      .join("||");
  }
  function setNativeSelectValue(selectEl, answerText) {
    if (!selectEl || !selectEl.options || selectEl.options.length === 0)
      return false;
    const options = Array.from(selectEl.options).filter(
      (option) => !option.disabled,
    );
    if (options.length === 0) return false;
    let matchedOption = null;
    try {
      selectEl.scrollIntoView({ behavior: "instant", block: "nearest" });
    } catch (_e) { }
    for (const option of options) {
      if (matchesDropdownOption(option, answerText)) {
        matchedOption = option;
        break;
      }
    }
    if (!matchedOption) return false;
    const prevValue = String(selectEl.value || "");
    selectEl.value = matchedOption.value;
    if (selectEl.selectedIndex !== matchedOption.index) {
      selectEl.selectedIndex = matchedOption.index;
    }
    if (String(selectEl.value || "") !== String(matchedOption.value || "")) {
      return false;
    }
    if (prevValue !== String(selectEl.value || "")) {
      fireSimpleEvent(selectEl, "input");
      fireSimpleEvent(selectEl, "change");
    } else {
      fireSimpleEvent(selectEl, "change");
    }
    return true;
  }
  function clickDropdownOption(optionEl) {
    if (!optionEl) return false;
    const clickTarget =
      optionEl.querySelector("a,button,[role='option'],span,div") || optionEl;
    try {
      clickTarget.scrollIntoView({ behavior: "instant", block: "nearest" });
    } catch (_e) { }
    try {
      clickTarget.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
      );
      clickTarget.dispatchEvent(
        new MouseEvent("mouseup", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
      );
      clickTarget.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
      );
      return true;
    } catch (_err) {
      try {
        clickTarget.click();
        return true;
      } catch (__err) {
        return false;
      }
    }
  }
  function closeWrapperDropdown(container, trigger, popup) {
    const doc = (container && container.ownerDocument) || document;
    const localCloseBtn = container
      ? container.querySelector(".popup-close")
      : null;
    const allCloseButtons = Array.from(doc.querySelectorAll(".popup-close"));
    const closeButtons = localCloseBtn
      ? [localCloseBtn, ...allCloseButtons]
      : allCloseButtons;
    closeButtons.forEach((btn) => {
      if (!btn) return;
      try {
        btn.click();
      } catch (_err) { }
    });
    const popupCandidates = new Set();
    if (popup) popupCandidates.add(popup);
    if (container) {
      const inside = container.querySelector(".popup");
      if (inside) popupCandidates.add(inside);
    }
    doc
      .querySelectorAll(".popup, .dropdown-menu, [role='listbox']")
      .forEach((node) => {
        if (!node) return;
        if (app.isVisible(node) || node.style.display !== "none")
          popupCandidates.add(node);
      });
    popupCandidates.forEach((popupEl) => {
      if (!popupEl) return;
      popupEl.style.display = "none";
      popupEl.style.visibility = "hidden";
      popupEl.style.opacity = "0";
      popupEl.classList.remove("open", "active", "show", "visible", "expanded");
      popupEl.setAttribute("aria-hidden", "true");
    });
    if (trigger) {
      try {
        trigger.setAttribute("aria-expanded", "false");
        trigger.classList.remove("open", "active", "show", "expanded");
        trigger.blur();
      } catch (_err) { }
    }
    if (container) {
      try {
        container.classList.remove("open", "active", "show", "expanded");
      } catch (_err) { }
    }
    try {
      if (doc && doc.body) {
        doc.body.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window,
          }),
        );
      }
    } catch (_err) { }
  }
  function selectOptionFromWrapperPopup(container, answerText) {
    if (!container) return false;
    const trigger = container.querySelector(".rich-dropdown");
    if (!trigger) return false;
    try {
      trigger.scrollIntoView({ behavior: "instant", block: "nearest" });
    } catch (_e) { }
    trigger.click();
    const popup = container.querySelector(".popup");
    const options = popup
      ? Array.from(popup.querySelectorAll("li"))
      : Array.from(container.querySelectorAll("li"));
    if (options.length === 0) return false;
    const option = pickBestDropdownOption(options, answerText);
    if (!option) return false;
    const selected = clickDropdownOption(option);
    closeWrapperDropdown(container, trigger, popup);
    return selected;
  }
  function isSolverUiNode(node) {
    if (!node || node.nodeType !== 1) return false;
    const refs = [
      app.state.uiContainer,
      app.state.logArea,
      app.state.qaArea,
    ].filter(Boolean);
    return refs.some((ref) => ref === node || ref.contains(node));
  }
  function toElement(node) {
    if (!node) return null;
    if (node.nodeType === 1) return node;
    return node.parentElement || null;
  }
  function isTextInputLike(node) {
    if (!node || node.nodeType !== 1) return false;
    const tag = node.tagName;
    if (tag === "TEXTAREA") return true;
    if (tag === "INPUT") {
      const type = String(node.type || "").toLowerCase();
      return (
        type === "" ||
        type === "text" ||
        type === "email" ||
        type === "number" ||
        type === "search"
      );
    }
    return !!node.isContentEditable;
  }
  function collectVisibleTextTargets() {
    const targets = [];
    const seen = new Set();
    getAllSearchRoots().forEach((root) => {
      if (!root || typeof root.querySelectorAll !== "function") return;
      root
        .querySelectorAll(
          'input[type="text"], input[type="email"], input[type="number"], input[type="search"], input:not([type]), textarea, [contenteditable="true"]',
        )
        .forEach((node) => {
          if (!node || seen.has(node)) return;
          seen.add(node);
          if (!isTextInputLike(node)) return;
          if (node.disabled || node.readOnly) return;
          if (!isRendered(node)) return;
          if (isSolverUiNode(node)) return;
          if (node.tagName === "INPUT") {
            const type = String(node.type || "").toLowerCase();
            if (type === "hidden") return;
            if (node.style && node.style.display === "none") return;
          }
          targets.push(node);
        });
    });
    targets.sort(compareDomOrder);
    return targets;
  }
  function canAssignAnswerToTarget(target, answerText) {
    if (!target || target.tagName !== "INPUT") return true;
    const type = String(target.type || "").toLowerCase();
    if (type !== "number") return true;
    const normalized = String(answerText || "").trim();
    if (!normalized) return false;
    return Number.isFinite(Number(normalized));
  }
  function setInputValueSafely(input, value) {
    if (!input) return false;
    const tag = input.tagName;
    const normalizedValue = String(value == null ? "" : value);
    if (tag === "INPUT" || tag === "TEXTAREA") {
      try {
        const descriptor = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(input),
          "value",
        );
        if (descriptor && typeof descriptor.set === "function") {
          descriptor.set.call(input, normalizedValue);
        } else {
          input.value = normalizedValue;
        }
        return true;
      } catch (_err) {
        try {
          input.value = normalizedValue;
          return true;
        } catch (_err2) {
          return false;
        }
      }
    }
    try {
      input.textContent = normalizedValue;
      return true;
    } catch (_err) {
      return false;
    }
  }
  function getCurrentInputValue(input) {
    if (!input) return "";
    const tag = input.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return String(input.value || "");
    return String(input.textContent || "");
  }
  function shouldOverwriteTextTarget(input, answerText) {
    const current = getCurrentInputValue(input).trim();
    if (!current) return true;
    if (current.length <= 2) return true;
    const currentNorm = app.normalize(current);
    const answerNorm = app.normalize(answerText);
    if (!currentNorm) return true;
    if (!answerNorm) return false;
    return currentNorm !== answerNorm;
  }
  function dispatchPasteLikeInput(target, answerText) {
    if (!target) return false;
    const win = target.ownerDocument.defaultView || window;
    try {
      target.scrollIntoView({ behavior: "instant", block: "nearest" });
    } catch (_e) { }
    try {
      if (typeof target.focus === "function") target.focus();
    } catch (_err) { }
    let clipboardData = null;
    try {
      if (typeof win.DataTransfer === "function") {
        clipboardData = new win.DataTransfer();
        clipboardData.setData("text/plain", answerText);
        clipboardData.setData("text", answerText);
      }
    } catch (_err) {
      clipboardData = null;
    }
    if (typeof win.ClipboardEvent === "function") {
      try {
        target.dispatchEvent(
          new win.ClipboardEvent("paste", {
            bubbles: true,
            cancelable: true,
            clipboardData,
          }),
        );
      } catch (_err) { }
    }
    if (typeof win.InputEvent === "function") {
      try {
        target.dispatchEvent(
          new win.InputEvent("beforeinput", {
            bubbles: true,
            cancelable: true,
            data: answerText,
            inputType: "insertFromPaste",
          }),
        );
      } catch (_err) { }
    }
    const setOk = setInputValueSafely(target, answerText);
    if (!setOk) return false;
    if (typeof win.InputEvent === "function") {
      try {
        target.dispatchEvent(
          new win.InputEvent("input", {
            bubbles: true,
            data: answerText,
            inputType: "insertFromPaste",
          }),
        );
      } catch (_err) {
        target.dispatchEvent(
          new win.Event("input", {
            bubbles: true,
          }),
        );
      }
    } else {
      target.dispatchEvent(
        new win.Event("input", {
          bubbles: true,
        }),
      );
    }
    target.dispatchEvent(
      new win.Event("change", {
        bubbles: true,
      }),
    );
    return true;
  }
  function getPreferredSourceElement(node) {
    if (!node || typeof node.closest !== "function") return node;
    const explicit = node.closest(
      "[draggable='true'], .drag_element, .tap_item, .pool_item, .word, .token, .gap_text, .gapText, .simpleAssociableChoice, .choice, .option, [class*='tap_item'], [class*='drag_item'], [class*='choice'], [class*='associable'], [class*='source'], [identifier], [data-identifier], [data-id], [data-source], [data-answer], [data-value], [value], [name], [role='option'], [role='button'], [tabindex], button, li, label, a",
    );
    if (explicit) return explicit;
    let best = node;
    let bestScore = getInteractiveScore(node);
    let current = node.parentElement;
    while (current) {
      const score = getInteractiveScore(current);
      if (score > bestScore) {
        best = current;
        bestScore = score;
      }
      if (score >= 6) return current;
      current = current.parentElement;
    }
    return best || node;
  }
  function getInteractiveScore(node) {
    if (!node || node.nodeType !== 1) return 0;
    let score = 0;
    const className = (
      (node.className && String(node.className)) ||
      ""
    ).toLowerCase();
    const role = (node.getAttribute("role") || "").toLowerCase();
    const tag = node.tagName;
    if (node.getAttribute("draggable") === "true") score += 8;
    if (
      /(drag|tap|pool|word|choice|item|option|token|match|associable|source|sentence)/.test(
        className,
      )
    )
      score += 5;
    if (role === "option" || role === "button" || role === "listitem")
      score += 4;
    if (tag === "BUTTON" || tag === "LI" || tag === "LABEL" || tag === "A")
      score += 3;
    if (node.hasAttribute("tabindex")) score += 1;
    const datasetKeys = Object.keys(node.dataset || {});
    if (
      datasetKeys.some((key) =>
        /(drag|tap|source|target|token|word|option|choice|item|match|sentence)/i.test(
          key,
        ),
      )
    ) {
      score += 2;
    }
    if (
      node.hasAttribute("identifier") ||
      node.hasAttribute("data-identifier") ||
      node.hasAttribute("data-id") ||
      node.hasAttribute("data-source") ||
      node.hasAttribute("data-answer")
    ) {
      score += 4;
    }
    if (typeof node.onclick === "function" || node.hasAttribute("onclick")) {
      score += 2;
    }
    return score;
  }
  function getGapSnapshot(target) {
    if (!target) {
      return {
        text: "",
        html: "",
        value: "",
        aria: "",
        empty: true,
      };
    }
    return {
      text: getNodeText(target),
      html: target.innerHTML || "",
      value:
        target.getAttribute("data-value") || target.getAttribute("value") || "",
      aria: target.getAttribute("aria-label") || "",
      empty: isLikelyEmptyGap(target),
    };
  }
  function didGapChange(beforeSnapshot, target) {
    const after = getGapSnapshot(target);
    return (
      beforeSnapshot.text !== after.text ||
      beforeSnapshot.html !== after.html ||
      beforeSnapshot.value !== after.value ||
      beforeSnapshot.aria !== after.aria ||
      beforeSnapshot.empty !== after.empty
    );
  }
  function isGapFilledWithAnswer(target, answerText, beforeSnapshot) {
    const answerNorm = app.normalize(answerText);
    const targetTextNorm = app.normalize(getNodeText(target));
    if (answerNorm && targetTextNorm && targetTextNorm.includes(answerNorm))
      return true;
    const ariaNorm = app.normalize(target.getAttribute("aria-label") || "");
    if (answerNorm && ariaNorm && ariaNorm.includes(answerNorm)) return true;
    if (!isLikelyEmptyGap(target) && didGapChange(beforeSnapshot, target))
      return true;
    return false;
  }
  function compareDomOrder(a, b) {
    if (a.ownerDocument !== b.ownerDocument) return 0;
    return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
      ? -1
      : 1;
  }
  function getNextActionTargetFromElement(el) {
    if (!el || typeof el.closest !== "function") return null;
    for (const target of NEXT_BUTTON_TARGETS) {
      const button = el.closest(target.selector);
      if (button)
        return {
          button,
          name: target.name,
        };
    }
    return null;
  }
  function queueAutoAnswerAfterAdvance(trigger) {
    if (!app.state.isAutoAnswerActive) return;
    if (trigger === "manual-next" || trigger === "auto-next") {
      app.state.lastAutoAnswerMatchCount = 0;
      app.state.dropdownAdvanceSequence =
        Number(app.state.dropdownAdvanceSequence || 0) + 1;
    }
    const nextToken = (app.state.advanceAutoAnswerToken || 0) + 1;
    app.state.advanceAutoAnswerToken = nextToken;
    const queuedAt = Date.now();
    const isNextTrigger = trigger === "manual-next" || trigger === "auto-next";
    const timings = getTimingProfile();
    const useStabilityGuard = hasComplexAutoFlowContext();
    const delays = useStabilityGuard
      ? isNextTrigger
        ? STABLE_NEXT_QUEUE_DELAYS
        : STABLE_CHECK_QUEUE_DELAYS
      : isNextTrigger
        ? timings.nextQueueDelays
        : timings.checkQueueDelays;
    delays.forEach((delay, index) => {
      setTimeout(() => {
        if ((app.state.advanceAutoAnswerToken || 0) !== nextToken) return;
        const solvedSinceQueue =
          (app.state.lastAutoAnswerFinishedAt || 0) >= queuedAt &&
          (app.state.lastAutoAnswerMatchCount || 0) > 0;
        if (solvedSinceQueue && !hasPendingAnswerTargets()) return;
        autoAnswer({
          force: true,
          trigger,
          bypassDuplicateGuard: true,
          quietIfRunning: true,
          suppressStartLog: index > 0,
          suppressDuplicateLog: index > 0,
        });
      }, delay);
    });
  }
  function isPlaceholderChoiceText(text) {
    const normalized = normalizeComparableText(text || "");
    if (!normalized) return true;
    return (
      normalized === "select" ||
      normalized === "choose" ||
      normalized === "pick" ||
      normalized === "--" ||
      normalized.startsWith("select ")
    );
  }
  function hasPendingAnswerTargets() {
    const { targets: gapTargets } = getVisibleGapTargets();
    if (
      gapTargets.length > 0 &&
      gapTargets.some((target) => isLikelyEmptyGap(target))
    ) {
      return true;
    }
    const matchTargets = collectVisibleMatchTargets();
    if (matchTargets.length > 0) {
      const pickedMatchPlan = pickMatchInteractionPlan(matchTargets);
      if (pickedMatchPlan && Array.isArray(pickedMatchPlan.plan)) {
        const pendingAnswers = Array.from(
          new Set(
            pickedMatchPlan.plan
              .map((entry) => cleanAnswerText(entry && entry.answer))
              .filter((answer) => answer.length > 0),
          ),
        );
        for (const answer of pendingAnswers) {
          const answerNorm = app.normalize(answer);
          if (!answerNorm) continue;
          const hasSource = getAllSearchRoots().some((root) =>
            getDraggableCandidatesFromRoot(root).some((candidate) =>
              isSourceTextMatch(getNodeText(candidate), answer),
            ),
          );
          if (hasSource) return true;
        }
      }
    }
    const dropdownTargets = collectOrderedDropdownTargets();
    for (const target of dropdownTargets) {
      if (
        target &&
        target.classList &&
        target.classList.contains("wrapper-dropdown")
      ) {
        const labelText = getNodeText(target.querySelector(".drop-label"));
        if (isPlaceholderChoiceText(labelText)) return true;
        continue;
      }
      if (target && target.matches && target.matches("select")) {
        const selected =
          target.options && target.selectedIndex >= 0
            ? target.options[target.selectedIndex]
            : null;
        const selectedText = getNodeText(selected);
        if (isPlaceholderChoiceText(selectedText)) return true;
      }
    }
    const textTargets = collectVisibleTextTargets();
    for (const target of textTargets) {
      const value = String(
        target && (target.value || target.textContent || ""),
      ).trim();
      if (!value) return true;
    }
    return false;
  }
  function hasComplexAutoFlowContext() {
    const dropdownTargets = collectOrderedDropdownTargets();
    if (dropdownTargets.length >= 2) return true;
    if (
      dropdownTargets.some(
        (target) =>
          target &&
          target.classList &&
          target.classList.contains("wrapper-dropdown"),
      )
    ) {
      return true;
    }
    const { targets: gapTargets } = getVisibleGapTargets();
    if (gapTargets.length >= 2) return true;
    const matchTargets = collectVisibleMatchTargets();
    if (matchTargets.length >= 2) return true;
    const textTargets = collectVisibleTextTargets();
    if (textTargets.length >= 2) return true;
    return false;
  }
  function hasSpeakingPlayableInPage() {
    const roots = getAllSearchRoots();
    for (const root of roots) {
      if (!root || typeof root.querySelector !== "function") continue;
      if (root.querySelector(SPEAKING_PLAY_BUTTON_SELECTOR)) return true;
    }
    return false;
  }
  function hasIncorrectFeedbackButton() {
    const roots = getAllSearchRoots();
    for (const root of roots) {
      if (!root || typeof root.querySelector !== "function") continue;
      const button = root.querySelector(INCORRECT_FEEDBACK_BUTTON_SELECTOR);
      if (button && app.isVisible(button)) return true;
    }
    return false;
  }
  function hasAnyAutomationActive() {
    return (
      !!app.state.isAutoAnswerActive ||
      !!app.state.isAutoNextActive ||
      !!app.state.isAutoActivityActive ||
      !!app.state.isAutoAnswerRunning
    );
  }
  function stopAllAutomationDueToIncorrect(options = {}) {
    const { log = true, buttonElement = null } = options;
    let stopped = false;
    if (app.state.isAutoAnswerActive) {
      setAutoAnswerEnabled(false, {
        buttonElement,
        persist: false,
        log: false,
        runImmediate: false,
      });
      stopped = true;
    } else if (app.state.isAutoAnswerRunning) {
      stopAutoAnswer();
      stopped = true;
    }
    if (app.state.isAutoNextActive) {
      setAutoNextEnabled(false, {
        buttonElement,
        persist: false,
        log: false,
      });
      stopped = true;
    }
    if (app.state.isAutoActivityActive) {
      setAutoActivityEnabled(false, {
        buttonElement,
        persist: false,
        log: false,
      });
      stopped = true;
    }
    if (stopped) {
      persistAutoSettings();
      if (log) {
        app.logToUI(
          "%c[AUTO-WRONG-STOP]%c 不正解フィードバックを検出したため、自動系をすべて停止しました。",
          styles.alert,
          "",
        );
      }
    }
    return stopped;
  }
  function checkIncorrectFeedbackStop() {
    if (!app.state.isAutoWrongStopActive) return;
    const present = hasIncorrectFeedbackButton();
    if (!present) {
      app.state.incorrectFeedbackButtonSeen = false;
      return;
    }
    if (app.state.incorrectFeedbackButtonSeen) return;
    app.state.incorrectFeedbackButtonSeen = true;
    if (!hasAnyAutomationActive()) return;
    stopAllAutomationDueToIncorrect({
      log: true,
    });
  }
  function applyAutoWrongStopButtonState(buttonElement) {
    if (!buttonElement) return;
    if (app.state.isAutoWrongStopActive) {
      buttonElement.style.backgroundColor = "#28a745";
      buttonElement.textContent = "自動誤答停止: ON";
      return;
    }
    buttonElement.style.backgroundColor = "#6c757d";
    buttonElement.textContent = "自動誤答停止: OFF";
  }
  function setAutoWrongStopEnabled(nextActive, options = {}) {
    const { buttonElement = null, persist = true, log = true } = options;
    app.state.isAutoWrongStopActive = !!nextActive;
    if (buttonElement) applyAutoWrongStopButtonState(buttonElement);
    if (app.state.autoWrongStopInterval) {
      clearInterval(app.state.autoWrongStopInterval);
      app.state.autoWrongStopInterval = null;
    }
    if (app.state.isAutoWrongStopActive) {
      app.state.incorrectFeedbackButtonSeen = false;
      app.state.autoWrongStopInterval = setInterval(
        checkIncorrectFeedbackStop,
        AUTO_WRONG_STOP_POLL_MS,
      );
      checkIncorrectFeedbackStop();
      if (log) {
        app.logToUI(
          "%c[AUTO-WRONG-STOP]%c 自動誤答停止を ON にしました。",
          styles.info,
          "",
        );
      }
    } else {
      app.state.incorrectFeedbackButtonSeen = false;
      if (log) {
        app.logToUI(
          "%c[AUTO-WRONG-STOP]%c 自動誤答停止を OFF にしました。",
          styles.info,
          "",
        );
      }
    }
    if (persist) persistAutoSettings();
    return app.state.isAutoWrongStopActive;
  }
  function toggleAutoWrongStop(buttonElement) {
    return setAutoWrongStopEnabled(!app.state.isAutoWrongStopActive, {
      buttonElement,
      persist: true,
      log: true,
    });
  }
  function persistAutoSettings() {
    try {
      if (!chrome || !chrome.storage || !chrome.storage.local) return;
      chrome.storage.local.set({
        autoAnswerActive: !!app.state.isAutoAnswerActive,
        autoNextActive: !!app.state.isAutoNextActive,
        autoActivityActive: !!app.state.isAutoActivityActive,
        autoWrongStopActive: !!app.state.isAutoWrongStopActive,
        speedLevel: getSpeedLevel(),
      });
    } catch (_err) { }
  }
  function clampSpeedLevel(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 3;
    return Math.max(1, Math.min(5, Math.round(n)));
  }
  function getSpeedLevel() {
    return clampSpeedLevel(app.state.speedLevel || 3);
  }
  function getTimingProfile() {
    const level = getSpeedLevel();
    return SPEED_PROFILES[level] || SPEED_PROFILES[3];
  }
  function setSpeedLevel(nextLevel, options = {}) {
    const { persist = true, log = true } = options;
    const level = clampSpeedLevel(nextLevel);
    app.state.speedLevel = level;
    if (app.state.isAutoAnswerActive) {
      startAutoAnswerPulse();
    }
    if (app.state.isAutoNextActive) {
      if (app.state.autoNextInterval) clearInterval(app.state.autoNextInterval);
      app.state.autoNextInterval = setInterval(
        checkNextBtn,
        getTimingProfile().nextPollMs,
      );
      checkNextBtn();
    }
    if (persist) persistAutoSettings();
    if (log) {
      const profile = getTimingProfile();
      app.logToUI(
        `%c[INFO]%c 速度設定を変更: L${level} (${profile.label})`,
        styles.info,
        "",
      );
    }
    return level;
  }
  function getInteractionContainers() {
    const containers = [];
    const selectors = [
      ".choice_interaction",
      "div[role='radiogroup']",
      ".gapMatchInteraction",
      ".simpleMatchSet",
      "fieldset",
      ".que",
      ".wrapper-dropdown",
      "select",
    ];
    getAllSearchRoots().forEach((root) => {
      if (!root || typeof root.querySelectorAll !== "function") return;
      root.querySelectorAll(selectors.join(", ")).forEach((node) => {
        if (isRendered(node)) containers.push(node);
      });
    });
    containers.sort(compareDomOrder);
    return containers;
  }
  function getGapGroupRoot(target) {
    return (
      target.closest(".gapMatchInteraction, .simpleMatchSet, .que, fieldset") ||
      target.ownerDocument.body
    );
  }
  function isLikelyEmptyGap(target) {
    const rawText = (target.textContent || "").trim();
    if (!rawText) return true;
    if (/^[_\-.\u2026\s]+$/.test(rawText)) return true;
    return false;
  }
  function getVisibleGapTargets() {
    const allTargets = [];
    getAllSearchRoots().forEach((root) => {
      if (!root || typeof root.querySelectorAll !== "function") return;
      const targets = root.querySelectorAll(
        ".gap_match_gap_view, .drop_area.target, .gapMatchInteraction [data-target], .gapMatchInteraction .target",
      );
      targets.forEach((target) => {
        if (!isRendered(target)) return;
        if (target.closest("[aria-hidden='true']")) return;
        allTargets.push(target);
      });
    });
    if (allTargets.length === 0) {
      return {
        targets: [],
        scopeRoot: null,
      };
    }
    const grouped = new Map();
    allTargets.forEach((target) => {
      const root = getGapGroupRoot(target);
      if (!grouped.has(root)) grouped.set(root, []);
      grouped.get(root).push(target);
    });
    let bestTargets = [];
    let bestRoot = null;
    let bestEmptyCount = 0;
    let bestSourceCount = -1;
    grouped.forEach((targets, root) => {
      const emptyTargets = targets.filter(isLikelyEmptyGap);
      const emptyCount = emptyTargets.length;
      const sourceCount = getDraggableCandidatesFromRoot(root).length;
      const shouldReplace =
        emptyCount > bestEmptyCount ||
        (emptyCount === bestEmptyCount &&
          emptyCount > 0 &&
          sourceCount > bestSourceCount);
      if (shouldReplace) {
        bestTargets = emptyTargets.slice();
        bestRoot = root;
        bestEmptyCount = emptyCount;
        bestSourceCount = sourceCount;
      }
    });
    if (bestEmptyCount === 0) {
      return {
        targets: [],
        scopeRoot: null,
      };
    }
    bestTargets.sort(compareDomOrder);
    return {
      targets: bestTargets,
      scopeRoot: bestRoot,
    };
  }
  function collectVisibleMatchTargets() {
    const targets = [];
    const seen = new Set();
    const selectors = [
      ".drop_area.target",
      ".gap_match_gap_view",
      ".gapMatchInteraction [data-target]",
      ".gapMatchInteraction .target",
      ".matchInteraction .simpleMatchSet .simpleAssociableChoice",
      ".simpleMatchSet .simpleAssociableChoice",
    ];
    const tryAddTarget = (node) => {
      if (!node || seen.has(node)) return;
      seen.add(node);
      if (!isRendered(node)) return;
      if (node.closest("[aria-hidden='true']")) return;
      if (isSolverUiNode(node)) return;
      const text = getNodeText(node);
      if (!text) return;
      if (!/[A-Za-z]/.test(text)) return;
      targets.push(node);
    };
    getAllSearchRoots().forEach((root) => {
      if (!root || typeof root.querySelectorAll !== "function") return;
      root.querySelectorAll(selectors.join(", ")).forEach((node) => {
        tryAddTarget(node);
      });
    });
    if (targets.length === 0) {
      const questionHints = Array.isArray(app.state.extractedItems)
        ? app.state.extractedItems
          .filter(
            (item) =>
              item &&
              item.type === "standard" &&
              Array.isArray(item.questions) &&
              item.questions.length > 0 &&
              Array.isArray(item.answerGroups) &&
              item.answerGroups.some(
                (group) => Array.isArray(group) && group.length > 1,
              ),
          )
          .flatMap((item) => item.questions || [])
          .map((q) =>
            String(q || "")
              .replace(/\s+/g, " ")
              .trim(),
          )
          .filter((q) => q.length >= 6)
        : [];
      if (questionHints.length > 0) {
        const broadSelector = [
          "div",
          "li",
          "p",
          "span",
          "label",
          "button",
          "[role='button']",
          "[role='option']",
          "[class*='target']",
          "[class*='drop']",
          "[class*='column']",
          "[class*='category']",
        ].join(", ");
        const candidates = [];
        getAllSearchRoots().forEach((root) => {
          if (!root || typeof root.querySelectorAll !== "function") return;
          root.querySelectorAll(broadSelector).forEach((node) => {
            if (!node || isSolverUiNode(node)) return;
            if (!isRendered(node)) return;
            if (node.closest("[aria-hidden='true']")) return;
            const text = getNodeText(node);
            if (!text || text.length < 6) return;
            if (!/[A-Za-z]/.test(text)) return;
            candidates.push(node);
          });
        });
        const used = new Set();
        questionHints.forEach((questionText) => {
          let bestNode = null;
          let bestScore = 0;
          candidates.forEach((node) => {
            if (!node || used.has(node)) return;
            const score = getMatchQuestionTargetScore(questionText, node);
            if (score > bestScore) {
              bestScore = score;
              bestNode = node;
            }
          });
          if (bestNode && bestScore >= 12) {
            used.add(bestNode);
            tryAddTarget(bestNode);
          }
        });
      }
    }
    targets.sort(compareDomOrder);
    return targets;
  }
  function getMatchTargetContextText(target) {
    if (!target) return "";
    const chunks = [getNodeText(target)];
    const parent = target.parentElement;
    if (parent) chunks.push(getNodeText(parent));
    const block =
      target.closest(
        ".simpleMatchSet, .matchInteraction, .gapMatchInteraction, .que, fieldset, .question, .item",
      ) || null;
    if (block) chunks.push(getNodeText(block));
    return chunks.join(" ").replace(/\s+/g, " ").trim();
  }
  function getMatchQuestionTargetScore(questionText, target) {
    const questionNorm = normalizeComparableLoose(questionText || "");
    const targetNorm = normalizeComparableLoose(
      getMatchTargetContextText(target),
    );
    if (!questionNorm || !targetNorm) return 0;
    if (questionNorm === targetNorm) return 100;
    if (targetNorm.includes(questionNorm)) return 80;
    if (questionNorm.length >= 10 && questionNorm.includes(targetNorm))
      return 35;
    const qTokens = normalizeComparableText(questionText || "")
      .split(/\s+/)
      .filter((token) => token.length >= 4);
    if (qTokens.length === 0) return 0;
    let tokenHits = 0;
    qTokens.forEach((token) => {
      const normToken = normalizeComparableLoose(token);
      if (normToken && targetNorm.includes(normToken)) tokenHits += 1;
    });
    return tokenHits * 6;
  }
  function pickMatchInteractionPlan(matchTargets) {
    const targets = Array.isArray(matchTargets) ? matchTargets : [];
    if (targets.length === 0) return null;
    const items = Array.isArray(app.state.extractedItems)
      ? app.state.extractedItems
      : [];
    const candidates = items.filter((item) => {
      if (!item || item.type !== "standard") return false;
      if (!Array.isArray(item.answerGroups) || item.answerGroups.length === 0)
        return false;
      if (!Array.isArray(item.questions) || item.questions.length === 0)
        return false;
      if (
        !Array.isArray(item.answerGroupDetails) ||
        item.answerGroupDetails.length === 0
      ) {
        return false;
      }
      return item.answerGroups.some((group, groupIndex) => {
        if (!Array.isArray(group) || group.length === 0) return false;
        const entries = item.answerGroupDetails[groupIndex]?.entries;
        if (!Array.isArray(entries) || entries.length < group.length) {
          return false;
        }
        return group.every((answer) =>
          entries.some(
            (entry) =>
              String(entry && entry.sourceId ? entry.sourceId : "").trim() &&
              isAnswerTextMatch(entry.answer, answer),
          ),
        );
      });
    });
    if (candidates.length === 0) return null;
    let best = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    candidates.forEach((item) => {
      const questions = item.questions
        .map((q) =>
          String(q || "")
            .replace(/\s+/g, " ")
            .trim(),
        )
        .filter(Boolean);
      const groups = item.answerGroups
        .map((group) =>
          (Array.isArray(group) ? group : [])
            .map((answer) => cleanAnswerText(answer))
            .filter((answer) => answer.length > 0),
        )
        .filter((group) => group.length > 0);
      const groupDetails = Array.isArray(item.answerGroupDetails)
        ? item.answerGroupDetails.map((group) => ({
          targetId: String(
            group && group.targetId ? group.targetId : "",
          ).trim(),
          targetText: String(
            group && group.targetText ? group.targetText : "",
          ).trim(),
          entries: (Array.isArray(group && group.entries)
            ? group.entries
            : []
          )
            .map((entry) => ({
              answer: cleanAnswerText(entry && entry.answer),
              sourceId: String(
                entry && entry.sourceId ? entry.sourceId : "",
              ).trim(),
            }))
            .filter((entry) => entry.answer.length > 0),
        }))
        : [];
      if (questions.length === 0 || groups.length === 0) return;
      const targetByIdentifier = new Map();
      targets.forEach((target) => {
        if (!target || typeof target.getAttribute !== "function") return;
        [
          "identifier",
          "data-identifier",
          "data-id",
          "id",
          "name",
          "value",
          "for",
          "aria-label",
          "title",
        ].forEach((attr) => {
          const raw = String(target.getAttribute(attr) || "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
          if (!raw) return;
          targetByIdentifier.set(raw, target);
        });
      });
      const usedTargets = new Set();
      const matchedTargetsByQuestion = [];
      let score = 0;
      for (let i = 0; i < groups.length; i += 1) {
        const detailGroup = groupDetails[i] || null;
        const detailTargetId = String(
          detailGroup && detailGroup.targetId ? detailGroup.targetId : "",
        )
          .trim()
          .toLowerCase();
        const directTarget = detailTargetId
          ? targetByIdentifier.get(detailTargetId) || null
          : null;
        if (directTarget && !usedTargets.has(directTarget)) {
          usedTargets.add(directTarget);
          matchedTargetsByQuestion.push(directTarget);
          score += 120;
          continue;
        }
        if (directTarget) {
          matchedTargetsByQuestion.push(directTarget);
          score += 80;
          continue;
        }
        const questionText = questions[i] || "";
        let bestTarget = null;
        let bestTargetScore = Number.NEGATIVE_INFINITY;
        targets.forEach((target) => {
          if (!target || usedTargets.has(target)) return;
          const targetScore = getMatchQuestionTargetScore(questionText, target);
          if (targetScore > bestTargetScore) {
            bestTarget = target;
            bestTargetScore = targetScore;
          }
        });
        if (!bestTarget) {
          const fallbackTarget =
            targets[Math.min(i, Math.max(0, targets.length - 1))] || null;
          matchedTargetsByQuestion.push(fallbackTarget);
          continue;
        }
        usedTargets.add(bestTarget);
        matchedTargetsByQuestion.push(bestTarget);
        score += bestTargetScore;
      }
      score -= Math.abs(groups.length - targets.length) * 14;
      if (groups.length === targets.length) score += 24;
      const plan = [];
      groups.forEach((group, groupIndex) => {
        const detailGroup = groupDetails[groupIndex] || null;
        const detailTargetId = detailGroup
          ? String(detailGroup.targetId || "").trim()
          : "";
        const target =
          matchedTargetsByQuestion[groupIndex] ||
          targets[Math.min(groupIndex, Math.max(0, targets.length - 1))] ||
          null;
        const questionLabel =
          questions[groupIndex] ||
          (detailGroup ? String(detailGroup.targetText || "").trim() : "") ||
          `Group ${groupIndex + 1}`;
        const detailEntries =
          detailGroup && Array.isArray(detailGroup.entries)
            ? detailGroup.entries
            : [];
        const usedDetailIndexes = new Set();
        group.forEach((answer, answerIndex) => {
          let sourceId = "";
          let matchedDetailIndex = detailEntries.findIndex(
            (entry, idx) =>
              !usedDetailIndexes.has(idx) &&
              isAnswerTextMatch(entry.answer, answer),
          );
          if (
            matchedDetailIndex < 0 &&
            answerIndex < detailEntries.length &&
            !usedDetailIndexes.has(answerIndex)
          ) {
            matchedDetailIndex = answerIndex;
          }
          if (matchedDetailIndex >= 0) {
            usedDetailIndexes.add(matchedDetailIndex);
            sourceId = String(
              detailEntries[matchedDetailIndex] &&
                detailEntries[matchedDetailIndex].sourceId
                ? detailEntries[matchedDetailIndex].sourceId
                : "",
            ).trim();
          }
          plan.push({
            answer,
            target,
            questionLabel,
            sourceId,
            targetId: detailTargetId,
          });
        });
      });
      if (plan.length === 0) return;
      if (score > bestScore) {
        bestScore = score;
        best = {
          sourceKey: item.sourceKey || "",
          groupsCount: groups.length,
          targetCount: targets.length,
          score,
          plan,
        };
      }
    });
    return best;
  }
  function getDraggableCandidatesFromRoot(root) {
    if (!root || typeof root.querySelectorAll !== "function") return [];
    const candidates = [];
    const seen = new Set();
    root.querySelectorAll(DRAG_SOURCE_SELECTORS).forEach((node) => {
      const candidate = getPreferredSourceElement(node);
      if (!candidate || seen.has(candidate)) return;
      seen.add(candidate);
      if (!isRendered(candidate)) return;
      if (candidate.closest("[aria-hidden='true']")) return;
      if (candidate.closest(".gap_match_gap_view, .drop_area.target")) return;
      if (isSolverUiNode(candidate)) return;
      const opacityRaw = candidate.style && candidate.style.opacity;
      const opacity =
        opacityRaw === "" || opacityRaw == null ? 1 : Number(opacityRaw);
      if (
        candidate.classList.contains("used") ||
        candidate.classList.contains("disabled") ||
        candidate.getAttribute("aria-disabled") === "true" ||
        (!Number.isNaN(opacity) && opacity < 0.5)
      ) {
        return;
      }
      const text = getNodeText(candidate);
      const identifierHint = [
        "identifier",
        "data-identifier",
        "data-id",
        "data-source",
        "data-answer",
        "value",
        "id",
      ]
        .map((attr) => String(candidate.getAttribute(attr) || "").trim())
        .some(Boolean);
      if (!text && !identifierHint) return;
      if (getInteractiveScore(candidate) <= 0 && !identifierHint) return;
      candidates.push(candidate);
    });
    return candidates;
  }
  function collectVisibleWordPool(scopeRoot) {
    const pool = [];
    if (scopeRoot) {
      getDraggableCandidatesFromRoot(scopeRoot).forEach((candidate) => {
        pool.push(getNodeText(candidate));
      });
      if (pool.length > 0) return pool;
    }
    getAllSearchRoots().forEach((root) => {
      getDraggableCandidatesFromRoot(root).forEach((candidate) => {
        pool.push(getNodeText(candidate));
      });
    });
    return pool;
  }
  function pickBestAnswerSlice(answers, wordPool, neededCount) {
    if (!Array.isArray(answers) || answers.length === 0) return [];
    if (neededCount <= 0) return answers.slice();
    if (answers.length <= neededCount) return answers.slice();
    if (!Array.isArray(wordPool) || wordPool.length === 0) {
      const start = Math.max(0, answers.length - neededCount);
      return answers.slice(start, start + neededCount);
    }
    const poolCounts = new Map();
    wordPool.forEach((word) => {
      const key = app.normalize(word);
      if (!key) return;
      poolCounts.set(key, (poolCounts.get(key) || 0) + 1);
    });
    let bestStart = Math.max(0, answers.length - neededCount);
    let bestScore = -1;
    let bestLengthScore = -1;
    for (let start = 0; start <= answers.length - neededCount; start += 1) {
      const windowAnswers = answers.slice(start, start + neededCount);
      const remaining = new Map(poolCounts);
      let score = 0;
      let lengthScore = 0;
      windowAnswers.forEach((answer) => {
        const key = app.normalize(answer);
        if (!key) return;
        lengthScore += key.length;
        const count = remaining.get(key) || 0;
        if (count > 0) {
          score += 1;
          remaining.set(key, count - 1);
        }
      });
      const isBetter =
        score > bestScore ||
        (score === bestScore && lengthScore > bestLengthScore);
      if (isBetter) {
        bestStart = start;
        bestScore = score;
        bestLengthScore = lengthScore;
      }
    }
    return answers.slice(bestStart, bestStart + neededCount);
  }
  function normalizeLoose(str) {
    return normalizeComparableLoose(str);
  }
  function getGapContextHints(gapTargets) {
    const hints = [];
    gapTargets.forEach((target) => {
      const contextNode =
        target.closest("p, li, .sentence, .question, .prompt, .stem") ||
        target.parentElement;
      if (!contextNode) return;
      const text = (contextNode.textContent || "").replace(/\s+/g, " ").trim();
      if (text.length < 3) return;
      hints.push(text);
    });
    return Array.from(new Set(hints));
  }
  function collectTextEntryContextHints(textTargets) {
    const hints = [];
    const seen = new Set();
    const pushHint = (rawText) => {
      const text = String(rawText || "")
        .replace(/\s+/g, " ")
        .trim();
      if (text.length < 3) return;
      const key = normalizeLoose(text);
      if (!key || seen.has(key)) return;
      seen.add(key);
      hints.push(text);
    };
    (Array.isArray(textTargets) ? textTargets : []).forEach((target) => {
      if (!target || !target.ownerDocument) return;
      let contextNode =
        target.closest(
          "p, li, .sentence, .question, .prompt, .stem, .que, fieldset",
        ) || target.parentElement;
      if (!contextNode) return;
      let depth = 0;
      while (contextNode && depth < 3) {
        if (!isSolverUiNode(contextNode) && app.isVisible(contextNode)) {
          pushHint(contextNode.textContent || "");
        }
        contextNode = contextNode.parentElement;
        depth += 1;
      }
    });
    return hints;
  }
  function collectNonGapContextHints(interactionContainers) {
    const hints = [];
    const seen = new Set();
    const pushHint = (rawText) => {
      const text = String(rawText || "")
        .replace(/\s+/g, " ")
        .trim();
      if (text.length < 3) return;
      const key = normalizeLoose(text);
      if (!key || seen.has(key)) return;
      seen.add(key);
      hints.push(text);
    };
    const pushFromNode = (node) => {
      if (!node || node.nodeType !== 1) return;
      if (isSolverUiNode(node)) return;
      if (!app.isVisible(node)) return;
      pushHint(node.textContent || "");
    };
    const matchesExtractedQuestion = (text) => {
      const textNorm = normalizeLoose(text);
      if (!textNorm) return false;
      return (
        Array.isArray(app.state.extractedItems) ? app.state.extractedItems : []
      ).some((item) => {
        if (!item || item.type !== "standard") return false;
        const questions = Array.isArray(item.questions)
          ? item.questions
          : [item.question || ""];
        return questions.some((question) => {
          const questionNorm = normalizeLoose(question);
          return (
            questionNorm.length >= 8 &&
            (textNorm.includes(questionNorm) ||
              (textNorm.length >= 12 && questionNorm.includes(textNorm)))
          );
        });
      });
    };
    (Array.isArray(interactionContainers) ? interactionContainers : []).forEach(
      (container) => {
        if (!container) return;
        let cursor = container;
        let depth = 0;
        while (cursor && depth < 3) {
          pushFromNode(cursor);
          cursor = cursor.parentElement;
          depth += 1;
        }
        pushFromNode(container.previousElementSibling);
        pushFromNode(container.nextElementSibling);
        pushFromNode(
          container.closest(
            ".que, fieldset, .question, .prompt, .item, .activity, .contentblock",
          ),
        );
      },
    );
    getAllSearchRoots().forEach((root) => {
      if (!root || typeof root.querySelectorAll !== "function") return;
      root.querySelectorAll("p").forEach((paragraph) => {
        if (
          paragraph.closest(
            ".attachment-wrapper, .attachmentContent, .attachmentContent--showInHeader, .activity--hidden, .slick-cloned, [aria-hidden='true']",
          )
        ) {
          return;
        }
        const paragraphText = getNodeText(paragraph);
        if (!paragraphText || isSolverUiNode(paragraph)) return;
        if (matchesExtractedQuestion(paragraphText)) {
          if (isRendered(paragraph)) pushHint(paragraphText);
          else if (app.isVisible(paragraph)) pushHint(paragraphText);
        } else {
          pushFromNode(paragraph);
        }
      });
    });
    const questionXPath =
      "/html/body/div[1]/div/div/div[7]/div/div/div/div/p[1]";
    const documents = new Set(
      getAllSearchRoots()
        .map((root) => (root && root.nodeType === 9 ? root : root?.ownerDocument))
        .filter(Boolean),
    );
    documents.forEach((doc) => {
      try {
        const paragraph = doc.evaluate(
          questionXPath,
          doc,
          null,
          9,
          null,
        ).singleNodeValue;
        if (!paragraph || paragraph.nodeType !== 1) return;
        if (
          paragraph.closest(
            ".attachment-wrapper, .attachmentContent, .activity--hidden, .slick-cloned, [aria-hidden='true']",
          )
        ) {
          return;
        }
        const text = getNodeText(paragraph);
        if (matchesExtractedQuestion(text)) pushHint(text);
      } catch (_err) { }
    });
    return hints;
  }
  function getCurrentAttachmentText() {
    const roots = getAllSearchRoots();
    for (const root of roots) {
      if (!root || typeof root.querySelectorAll !== "function") continue;
      const showBtns = Array.from(
        root.querySelectorAll(".act_head_button[aria-controls]"),
      );
      for (const btn of showBtns) {
        if (btn.closest(".activity--hidden")) continue;
        const targetId = btn.getAttribute("aria-controls");
        if (!targetId) continue;
        for (const r of roots) {
          if (!r || typeof r.getElementById !== "function") continue;
          const targetAttachment =
            r.getElementById(targetId) || r.querySelector(`[id='${targetId}']`);
          if (targetAttachment) {
            const text = getNodeText(targetAttachment);
            if (text) {
              return text.replace(/\s+/g, " ").trim();
            }
          }
        }
      }
    }
    const visibleTexts = [];
    const fallbackTexts = [];
    roots.forEach((root) => {
      if (!root || typeof root.querySelectorAll !== "function") return;
      root
        .querySelectorAll(
          ".attachment-wrapper, .attachmentContent, .attachmentContent--showInHeader",
        )
        .forEach((node) => {
          if (!node) return;
          if (node.closest(".activity--hidden, .slick-cloned")) return;
          const text = getNodeText(node);
          if (!text) return;
          fallbackTexts.push(text);
          if (app.isVisible(node) && !node.closest("[aria-hidden='true']")) {
            visibleTexts.push(text);
          }
        });
    });
    const target = visibleTexts.length > 0 ? visibleTexts : fallbackTexts;
    return target.join(" ").replace(/\s+/g, " ").trim();
  }
  function getAttachmentSimilarityScore(a, b) {
    const normalize = (value) =>
      normalizeComparableText(value || "")
        .replace(/[^a-z0-9\s]/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
    const left = normalize(a || "");
    const right = normalize(b || "");
    if (!left || !right) return 0;
    if (left === right) return 1;
    if (left.includes(right)) return 1;
    const buildTrigrams = (text) => {
      const compact = text.replace(/\s+/g, " ");
      const grams = new Set();
      for (let i = 0; i <= compact.length - 3; i += 1) {
        grams.add(compact.slice(i, i + 3));
      }
      return grams;
    };
    const aTri = buildTrigrams(left);
    const bTri = buildTrigrams(right);
    if (aTri.size === 0 || bTri.size === 0) return 0;
    let intersection = 0;
    bTri.forEach((g) => {
      if (aTri.has(g)) intersection += 1;
    });
    return intersection / bTri.size;
  }
  function scoreStandardItemByContext(item, contextHints) {
    if (!item || !Array.isArray(contextHints) || contextHints.length === 0) {
      return {
        score: 0,
        matches: 0,
        segments: 0,
      };
    }
    const contextNorms = contextHints
      .map((hint) => normalizeLoose(hint))
      .filter(Boolean);
    if (contextNorms.length === 0)
      return {
        score: 0,
        matches: 0,
        segments: 0,
      };
    const sourceParts =
      Array.isArray(item.questions) && item.questions.length > 0
        ? item.questions
        : String(item.question || "").split("___");
    const segments = sourceParts
      .map((part) =>
        String(part || "")
          .replace(/\s+/g, " ")
          .trim(),
      )
      .filter((part) => part.length >= 3);
    if (segments.length === 0)
      return {
        score: 0,
        matches: 0,
        segments: 0,
      };
    let score = 0;
    let matches = 0;
    segments.forEach((segment) => {
      const segNorm = normalizeLoose(segment);
      if (!segNorm) return;
      if (contextNorms.some((ctx) => ctx.includes(segNorm))) {
        score += 8;
        matches += 1;
        return;
      }
      if (
        segNorm.length >= 12 &&
        contextNorms.some((ctx) => segNorm.includes(ctx))
      ) {
        score += 2;
        matches += 1;
        return;
      }
      score -= 1;
    });
    if (matches === 0) score -= 6;
    return {
      score,
      matches,
      segments: segments.length,
    };
  }
  function pickSingleTextEntryAnswerFromItems(textTargets) {
    const contextHints = collectTextEntryContextHints(textTargets);
    if (contextHints.length === 0) return null;
    const contextNorms = contextHints
      .map((hint) => normalizeLoose(hint))
      .filter(Boolean);
    if (contextNorms.length === 0) return null;
    const items = Array.isArray(app.state.extractedItems)
      ? app.state.extractedItems
      : [];
    let best = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    items.forEach((item) => {
      if (!item || item.type !== "standard") return;
      const answers = (Array.isArray(item.answers) ? item.answers : [])
        .map((answer) => cleanAnswerText(answer))
        .filter((answer) => answer.length > 0);
      if (answers.length !== 1) return;
      const questionParts =
        Array.isArray(item.questions) && item.questions.length > 0
          ? item.questions
          : [item.question || ""];
      const segments = questionParts
        .map((part) =>
          String(part || "")
            .replace(/\s+/g, " ")
            .trim(),
        )
        .filter((part) => part.length >= 2)
        .map((part) => normalizeLoose(part))
        .filter(Boolean);
      if (segments.length === 0) return;
      let score = 0;
      let matches = 0;
      let misses = 0;
      segments.forEach((segmentNorm) => {
        if (!segmentNorm) return;
        if (contextNorms.some((ctx) => ctx.includes(segmentNorm))) {
          score += 8;
          matches += 1;
          return;
        }
        if (
          segmentNorm.length >= 10 &&
          contextNorms.some((ctx) => segmentNorm.includes(ctx))
        ) {
          score += 2;
          matches += 1;
          return;
        }
        score -= 2;
        misses += 1;
      });
      score += matches * 2;
      if (segments.length >= 2 && matches >= 2) score += 6;
      if (misses === segments.length) score -= 6;
      if (score > bestScore) {
        bestScore = score;
        best = {
          answer: answers[0],
          sourceKey: item.sourceKey || "",
          score,
          matches,
          segments: segments.length,
        };
      }
    });
    if (!best) return null;
    if (best.matches <= 0 && best.score < 6) return null;
    return best;
  }
  function scoreQuestionSegments(question, contextHints) {
    if (!question || !contextHints || contextHints.length === 0) return 0;
    const contextNorms = contextHints.map((hint) => normalizeLoose(hint));
    const segments = question
      .split("___")
      .map((part) => part.replace(/\s+/g, " ").trim())
      .filter((part) => part.length >= 3);
    if (segments.length === 0) return 0;
    let score = 0;
    segments.forEach((segment) => {
      const segNorm = normalizeLoose(segment);
      if (!segNorm) return;
      if (contextNorms.some((ctx) => ctx.includes(segNorm))) score += 4;
    });
    return score;
  }
  function pickGapAnswersFromItems(targetCount, wordPool, contextHints) {
    const items = Array.isArray(app.state.extractedItems)
      ? app.state.extractedItems
      : [];
    const allCandidates = items.filter(
      (item) =>
        item &&
        item.type === "gapMatch" &&
        Array.isArray(item.answers) &&
        item.answers.length > 0,
    );
    if (allCandidates.length === 0) return null;
    const exactCandidates = allCandidates.filter(
      (candidate) => candidate.answers.length === targetCount,
    );
    const candidates =
      exactCandidates.length > 0 ? exactCandidates : allCandidates;
    const poolCounts = new Map();
    wordPool.forEach((word) => {
      const key = app.normalize(word);
      if (!key) return;
      poolCounts.set(key, (poolCounts.get(key) || 0) + 1);
    });
    let bestCandidate = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    let bestAnswerMatches = -1;
    let bestLengthScore = -1;
    candidates.forEach((candidate) => {
      const remaining = new Map(poolCounts);
      let answerMatches = 0;
      let lengthScore = 0;
      const answersForScore =
        candidate.answers.length > targetCount
          ? candidate.answers.slice(0, targetCount)
          : candidate.answers;
      answersForScore.forEach((answer) => {
        const key = app.normalize(answer);
        if (!key) return;
        lengthScore += key.length;
        const count = remaining.get(key) || 0;
        if (count > 0) {
          answerMatches += 1;
          remaining.set(key, count - 1);
        }
      });
      const sizePenalty = Math.abs(candidate.answers.length - targetCount) * 6;
      const exactLengthBonus = candidate.answers.length === targetCount ? 8 : 0;
      const questionHintScore = scoreQuestionSegments(
        candidate.question,
        contextHints,
      );
      const score =
        answerMatches * 10 + exactLengthBonus + questionHintScore - sizePenalty;
      const isBetter =
        score > bestScore ||
        (score === bestScore && answerMatches > bestAnswerMatches) ||
        (score === bestScore &&
          answerMatches === bestAnswerMatches &&
          lengthScore > bestLengthScore);
      if (isBetter) {
        bestCandidate = candidate;
        bestScore = score;
        bestAnswerMatches = answerMatches;
        bestLengthScore = lengthScore;
      }
    });
    if (!bestCandidate) return null;
    return {
      answers: bestCandidate.answers.slice(0, targetCount),
      sourceKey: bestCandidate.sourceKey || "",
      score: bestScore,
      matches: bestAnswerMatches,
    };
  }
  function simulateDragDrop(sourceNode, targetNode) {
    if (!sourceNode || !targetNode) return;
    const sourceWindow = sourceNode.ownerDocument.defaultView || window;
    const targetWindow = targetNode.ownerDocument.defaultView || sourceWindow;
    const srcRect = sourceNode.getBoundingClientRect();
    const tgtRect = targetNode.getBoundingClientRect();
    const srcX = srcRect.left + srcRect.width / 2;
    const srcY = srcRect.top + srcRect.height / 2;
    const tgtX = tgtRect.left + tgtRect.width / 2;
    const tgtY = tgtRect.top + tgtRect.height / 2;
    const dataTransfer =
      typeof sourceWindow.DataTransfer === "function"
        ? new sourceWindow.DataTransfer()
        : new DataTransfer();
    dataTransfer.effectAllowed = "all";
    dataTransfer.dropEffect = "move";
    const createMouseEvent = (type, x, y) =>
      new sourceWindow.MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: sourceWindow,
        buttons: 1,
        which: 1,
        clientX: x,
        clientY: y,
      });
    const createDragEvent = (type, x, y) =>
      new (sourceWindow.DragEvent || DragEvent)(type, {
        bubbles: true,
        cancelable: true,
        view: sourceWindow,
        buttons: 1,
        which: 1,
        clientX: x,
        clientY: y,
        dataTransfer,
      });
    sourceNode.dispatchEvent(createMouseEvent("mousedown", srcX, srcY));
    sourceNode.dispatchEvent(createDragEvent("dragstart", srcX, srcY));
    targetNode.dispatchEvent(
      new (targetWindow.DragEvent || DragEvent)("dragenter", {
        bubbles: true,
        cancelable: true,
        view: targetWindow,
        buttons: 1,
        which: 1,
        clientX: tgtX,
        clientY: tgtY,
        dataTransfer,
      }),
    );
    targetNode.dispatchEvent(
      new (targetWindow.DragEvent || DragEvent)("dragover", {
        bubbles: true,
        cancelable: true,
        view: targetWindow,
        buttons: 1,
        which: 1,
        clientX: tgtX,
        clientY: tgtY,
        dataTransfer,
      }),
    );
    targetNode.dispatchEvent(
      new (targetWindow.DragEvent || DragEvent)("drop", {
        bubbles: true,
        cancelable: true,
        view: targetWindow,
        buttons: 1,
        which: 1,
        clientX: tgtX,
        clientY: tgtY,
        dataTransfer,
      }),
    );
    sourceNode.dispatchEvent(createDragEvent("dragend", srcX, srcY));
    sourceNode.dispatchEvent(createMouseEvent("mouseup", srcX, srcY));
    sourceNode.click();
    targetNode.click();
  }
  function stopAutoAnswer() {
    app.state.autoAnswerRunId += 1;
    app.state.isAutoAnswerRunning = false;
    if (app.state.autoAnswerPulseInterval) {
      clearInterval(app.state.autoAnswerPulseInterval);
      app.state.autoAnswerPulseInterval = null;
    }
  }
  function applyAutoAnswerButtonState(buttonElement) {
    if (!buttonElement) return;
    if (app.state.isAutoAnswerActive) {
      buttonElement.style.backgroundColor = "#28a745";
      buttonElement.textContent = "Auto Answer: ON";
      return;
    }
    buttonElement.style.backgroundColor = "#6c757d";
    buttonElement.textContent = "Auto Answer: OFF";
  }
  function setAutoAnswerEnabled(nextActive, options = {}) {
    const {
      buttonElement = null,
      persist = true,
      log = true,
      trigger = "toggle-on",
      runImmediate = true,
    } = options;
    app.state.isAutoAnswerActive = !!nextActive;
    if (buttonElement) applyAutoAnswerButtonState(buttonElement);
    if (app.state.isAutoAnswerActive) {
      if (log)
        app.logToUI(
          "%c[AUTO]%c Auto Answer を ON にしました。",
          styles.info,
          "",
        );
      startAutoAnswerPulse();
      if (runImmediate) maybeAutoAnswer(trigger);
    } else {
      stopAutoAnswer();
      if (log)
        app.logToUI(
          "%c[AUTO]%c Auto Answer を OFF にしました。",
          styles.info,
          "",
        );
    }
    if (persist) persistAutoSettings();
    return app.state.isAutoAnswerActive;
  }
  function toggleAutoAnswer(buttonElement) {
    return setAutoAnswerEnabled(!app.state.isAutoAnswerActive, {
      buttonElement,
      persist: true,
      log: true,
      trigger: "toggle-on",
      runImmediate: true,
    });
  }
  function pulseAutoAnswerTick() {
    if (!app.state.isAutoAnswerActive) return;
    if (app.state.isAutoAnswerRunning) return;
    if (
      !Array.isArray(app.state.extractedAnswers) ||
      app.state.extractedAnswers.length === 0
    )
      return;
    if (
      Date.now() - (app.state.lastAutoAnswerFinishedAt || 0) <
      AUTO_ANSWER_RECENT_FINISH_GUARD_MS
    ) {
      return;
    }
    const pulseCooldownMs =
      (app.state.lastAutoAnswerMatchCount || 0) > 0
        ? AUTO_ANSWER_PULSE_COOLDOWN_MATCH_MS
        : AUTO_ANSWER_PULSE_COOLDOWN_IDLE_MS;
    autoAnswer({
      force: true,
      trigger: "auto-pulse",
      bypassDuplicateGuard: false,
      quietIfRunning: true,
      suppressEmptyWarn: true,
      suppressStartLog: true,
      suppressDuplicateLog: true,
      cooldownMs: pulseCooldownMs,
    });
  }
  function startAutoAnswerPulse() {
    if (app.state.autoAnswerPulseInterval) {
      clearInterval(app.state.autoAnswerPulseInterval);
      app.state.autoAnswerPulseInterval = null;
    }
    app.state.autoAnswerPulseInterval = setInterval(() => {
      pulseAutoAnswerTick();
    }, getTimingProfile().pulseMs);
    setTimeout(() => {
      pulseAutoAnswerTick();
    }, AUTO_ANSWER_INITIAL_PULSE_DELAY_MS);
  }
  function maybeAutoAnswer(trigger = "auto") {
    if (!app.state.isAutoAnswerActive) return;
    setTimeout(() => {
      autoAnswer({
        force: true,
        trigger,
        bypassDuplicateGuard: trigger === "extraction",
      });
    }, MAYBE_AUTO_ANSWER_DELAY_MS);
  }
  function autoAnswer(options = {}) {
    const {
      force = false,
      trigger = "manual",
      bypassDuplicateGuard = false,
      quietIfRunning = false,
      suppressEmptyWarn = false,
      suppressStartLog = false,
      suppressDuplicateLog = false,
      cooldownMs = AUTO_ANSWER_DEFAULT_COOLDOWN_MS,
    } = options;
    if (!force && !app.state.isAutoAnswerActive) return;
    if (app.state.isAutoAnswerRunning) {
      const nowMs = Date.now();
      const elapsed = nowMs - Number(app.state.lastAutoAnswerStartAt || 0);
      if (elapsed > AUTO_ANSWER_STUCK_TIMEOUT_MS) {
        app.state.isAutoAnswerRunning = false;
        app.logToUI(
          "%c[WARN]%c Auto Answer の実行状態が固着していたため復旧しました。",
          styles.alert,
          "",
        );
      } else {
        if (quietIfRunning) return;
        app.logToUI("%c[INFO]%c 自動回答はすでに実行中です。", styles.info, "");
        return;
      }
    }
    if (app.state.extractedAnswers.length === 0) {
      if (!suppressEmptyWarn) {
        app.logToUI(
          "%c[WARN]%c 答えリストが空です。「再取得」を押してください。",
          styles.alert,
          "",
        );
      }
      return;
    }
    const fingerprint = [
      window.location.href,
      app.state.extractedAnswers.length,
      app.state.extractedAnswers[0] || "",
      app.state.extractedAnswers[app.state.extractedAnswers.length - 1] || "",
    ].join("::");
    const now = Date.now();
    if (
      !bypassDuplicateGuard &&
      app.state.lastAutoAnswerFingerprint === fingerprint &&
      now - app.state.lastAutoAnswerStartAt < cooldownMs
    ) {
      if (!suppressDuplicateLog) {
        app.logToUI(
          "%c[INFO]%c 同一データへの重複自動実行をスキップしました。",
          styles.info,
          "",
        );
      }
      return;
    }
    app.state.lastAutoAnswerFingerprint = fingerprint;
    app.state.lastAutoAnswerStartAt = now;
    if (!suppressStartLog) {
      app.logToUI(
        `%c[AUTO]%c 自動回答ロジックを開始します... (${trigger})`,
        styles.info,
        "",
      );
    }
    startAutoAnswer(trigger);
  }
  function expandAllCollapsedItems() {
    const expandSelectors = [
      "[aria-expanded='false']",
      ".collapsed",
      ".collapse-toggle:not(.expanded)",
      ".accordion-toggle.collapsed",
      ".panel-heading.collapsed",
      ".activity-item.collapsed",
      ".item-header[aria-expanded='false']",
      ".expand-icon",
      ".toggle-expand",
      ".chevron-right",
      ".arrow-right",
      "[class*='collapse']:not([class*='show']):not(.show)",
      "[class*='expand'][class*='icon']",
      ".question-number.collapsed",
      ".lrn-accordion-collapsed",
      ".lrn_btn[aria-expanded='false']",
    ];
    let expandedCount = 0;
    getAllSearchRoots().forEach((root) => {
      if (!root || typeof root.querySelectorAll !== "function") return;
      expandSelectors.forEach((selector) => {
        try {
          const elements = root.querySelectorAll(selector);
          elements.forEach((el) => {
            if (!el || isSolverUiNode(el)) return;
            try {
              el.click();
              el.dispatchEvent(
                new MouseEvent("click", {
                  bubbles: true,
                }),
              );
              expandedCount++;
            } catch (_e) { }
          });
        } catch (_e) { }
      });
    });
    if (expandedCount > 0) {
      app.logToUI(
        `%c[EXPAND]%c ${expandedCount}個の折りたたまれた項目を展開しました。`,
        styles.info,
        "",
      );
    }
    return expandedCount;
  }
  function startAutoAnswer(trigger = "manual") {
    const runId = app.state.autoAnswerRunId + 1;
    app.state.autoAnswerRunId = runId;
    app.state.isAutoAnswerRunning = true;
    app.state.newActionCount = 0;
    const matchCount = { value: 0 };
    const isCancelled = () => runId !== app.state.autoAnswerRunId;
    const finalize = () => {
      if (isCancelled()) return;
      app.state.isAutoAnswerRunning = false;
      app.state.lastAutoAnswerFinishedAt = Date.now();
      app.state.lastAutoAnswerMatchCount = matchCount.value;
      if (app.state.isAutoNextActive) {
        setTimeout(() => {
          checkNextBtn();
        }, 0);
      }
    };
    const expanded = expandAllCollapsedItems();
    if (expanded > 0) {
      setTimeout(() => {
        continueAutoAnswer(trigger, runId, isCancelled, finalize, matchCount);
      }, 300);
      return;
    }
    continueAutoAnswer(trigger, runId, isCancelled, finalize, matchCount);
  }
  function continueAutoAnswer(
    trigger,
    runId,
    isCancelled,
    finalize,
    matchCount,
  ) {
    let newActionCount = 0;
    const processedInputs = new Set();
    const usedDragElements = new Set();
    const interactionContainers = getInteractionContainers();
    const { targets: gapTargets, scopeRoot: gapScopeRoot } =
      getVisibleGapTargets();
    const orderedTextTargets = collectVisibleTextTargets();
    const orderedDropdownTargets = collectOrderedDropdownTargets();
    const matchTargets = collectVisibleMatchTargets();
    const searchRoots = getAllSearchRoots();
    orderedTextTargets.forEach((target) => {
      if (target && target.dataset && target.dataset.filledByAuto) {
        delete target.dataset.filledByAuto;
      }
    });
    const preliminaryMatchPlan = pickMatchInteractionPlan(matchTargets);
    const hasMatchInteractionMode =
      !!preliminaryMatchPlan &&
      Array.isArray(preliminaryMatchPlan.plan) &&
      preliminaryMatchPlan.plan.length > 0;
    let nonGapAnswerPlan = null;
    let directDropdownMode = false;
    let directDropdownAnswers = [];
    let matchInteractionPlan = null;
    let bestCandidate = null;
    let dropdownRankedCandidates = [];
    let isGapMode = gapTargets.length > 0 && !hasMatchInteractionMode;
    let gapAssignmentPlan = null;
    app.logToUI(
      `%c[DEBUG]%c ターゲット検出: gaps=${gapTargets.length}, match=${matchTargets.length}, dropdown=${orderedDropdownTargets.length}, text=${orderedTextTargets.length}, containers=${interactionContainers.length}, roots=${searchRoots.length}`,
      styles.info,
      "",
    );
    let answersToProcess = app.state.extractedAnswers.slice();
    if (isGapMode) {
      const groupedGapPlanCandidate = pickMatchInteractionPlan(gapTargets);
      if (
        groupedGapPlanCandidate &&
        Array.isArray(groupedGapPlanCandidate.plan) &&
        groupedGapPlanCandidate.plan.length > gapTargets.length
      ) {
        gapAssignmentPlan = groupedGapPlanCandidate.plan
          .map((entry) => {
            const targetIndex = gapTargets.findIndex(
              (node) => node === entry.target,
            );
            if (targetIndex < 0) return null;
            return {
              answer: cleanAnswerText(entry.answer),
              targetIndex,
              questionLabel: String(entry.questionLabel || "").trim(),
              sourceId: String(entry.sourceId || "").trim(),
            };
          })
          .filter(
            (entry) =>
              !!entry &&
              entry.answer.length > 0 &&
              Number.isInteger(entry.targetIndex),
          );
        if (gapAssignmentPlan.length > 0) {
          answersToProcess = gapAssignmentPlan.map((entry) => entry.answer);
          app.logToUI(
            `%c[INFO]%c Gap分類モード: ${groupedGapPlanCandidate.sourceKey} / groups=${groupedGapPlanCandidate.groupsCount} / targets=${groupedGapPlanCandidate.targetCount} / answers=${answersToProcess.length}`,
            styles.info,
            "",
          );
        }
      }
      if (!gapAssignmentPlan || gapAssignmentPlan.length === 0) {
        const wordPool = collectVisibleWordPool(gapScopeRoot);
        const contextHints = getGapContextHints(gapTargets);
        app.logToUI(
          `%c[DEBUG]%c 空所候補語数: ${wordPool.length}`,
          styles.info,
          "",
        );
        const selectedFromItems = pickGapAnswersFromItems(
          gapTargets.length,
          wordPool,
          contextHints,
        );
        if (selectedFromItems && selectedFromItems.answers.length > 0) {
          answersToProcess = selectedFromItems.answers.slice(
            0,
            gapTargets.length,
          );
          app.logToUI(
            `%c[INFO]%c 問題一致: ${selectedFromItems.sourceKey} (score=${selectedFromItems.score}, match=${selectedFromItems.matches})`,
            styles.info,
            "",
          );
        } else {
          const selectedAnswers = pickBestAnswerSlice(
            app.state.extractedAnswers,
            wordPool,
            gapTargets.length,
          );
          answersToProcess = selectedAnswers.slice(0, gapTargets.length);
        }
      }
      if (answersToProcess.length === 0) {
        app.logToUI(
          "%c[INFO]%c 空所の候補回答が見つからなかったため停止します。",
          styles.info,
          "",
        );
        finalize();
        return;
      }
      app.logToUI(
        `%c[INFO]%c 空所ターゲット: ${gapTargets.length}件 / 回答候補: ${answersToProcess.length}件`,
        styles.info,
        "",
      );
      app.logToUI(
        `%c[INFO]%c 選択回答: ${answersToProcess.join(" | ")}`,
        styles.info,
        "",
      );
    }
    if (hasMatchInteractionMode) {
      matchInteractionPlan = preliminaryMatchPlan.plan.slice();
      answersToProcess = matchInteractionPlan.map((entry) =>
        cleanAnswerText(entry && entry.answer),
      );
      nonGapAnswerPlan = null;
      directDropdownMode = false;
      isGapMode = false;
      app.logToUI(
        `%c[INFO]%c Match直接モード: ${preliminaryMatchPlan.sourceKey} / groups=${preliminaryMatchPlan.groupsCount} / targets=${preliminaryMatchPlan.targetCount} / answers=${answersToProcess.length}`,
        styles.info,
        "",
      );
    }
    const currentAttachmentNormForProgress = normalizeComparableLoose(
      getCurrentAttachmentText(),
    );
    if (
      !isGapMode &&
      !matchInteractionPlan &&
      interactionContainers.length > 0 &&
      orderedTextTargets.length === 0
    ) {
      const containerNormTexts = interactionContainers.map((container) =>
        normalizeComparableLoose(getNodeText(container)),
      );
      const nonGapContextHints = collectNonGapContextHints(
        interactionContainers,
      );
      const currentAttachmentNorm = normalizeComparableLoose(
        getCurrentAttachmentText(),
      );
      const currentAttachmentText = getCurrentAttachmentText();
      const candidateItems = Array.isArray(app.state.extractedItems)
        ? app.state.extractedItems.filter(
          (item) =>
            item &&
            item.type === "standard" &&
            Array.isArray(item.answerGroups) &&
            item.answerGroups.length > 0,
        )
        : [];
      const candidateScoreDebug = [];
      let bestScore = Number.NEGATIVE_INFINITY;
      candidateItems.forEach((item) => {
        const groups = item.answerGroups
          .map((group) =>
            (Array.isArray(group) ? group : [])
              .map((answer) => cleanAnswerText(answer))
              .filter((answer) => answer.length > 0),
          )
          .filter((group) => group.length > 0);
        if (groups.length === 0) return;
        let score = 0;
        const sizeDiff = Math.abs(groups.length - interactionContainers.length);
        score -= sizeDiff * 14;
        if (groups.length === interactionContainers.length) score += 32;
        const contextScore = scoreStandardItemByContext(
          item,
          nonGapContextHints,
        );
        score += contextScore.score * 1000;
        if (nonGapContextHints.length > 0) {
          if (contextScore.matches > 0) score += 300;
          else score -= 50;
        }
        const itemAttachmentNorm = normalizeComparableLoose(
          item.attachmentText || "",
        );
        const attachmentSimilarity = getAttachmentSimilarityScore(
          currentAttachmentText,
          item.attachmentText || "",
        );
        if (currentAttachmentNorm && itemAttachmentNorm) {
          score += Math.round(attachmentSimilarity * 400);
          if (attachmentSimilarity >= 0.85) score += 2000;
          if (attachmentSimilarity < 0.4) score -= 150;
        }
        let visibleAnswerCount = 0;
        groups.forEach((group, idx) => {
          const ownContainerText =
            containerNormTexts[Math.min(idx, containerNormTexts.length - 1)] ||
            "";
          group.forEach((answer) => {
            const ansNorm = normalizeComparableLoose(answer);
            if (!ansNorm) return;
            if (ownContainerText && ownContainerText.includes(ansNorm)) {
              score += 300;
              visibleAnswerCount += 1;
              return;
            }
            if (containerNormTexts.some((text) => text.includes(ansNorm))) {
              score += 150;
              visibleAnswerCount += 1;
            }
          });
        });
        if (visibleAnswerCount === 0) {
          score -= 500;
        }
        const plan = [];
        groups.forEach((group, idx) => {
          const containerIndex = Math.min(
            idx,
            Math.max(0, interactionContainers.length - 1),
          );
          group.forEach((answer) => {
            plan.push({
              answer,
              containerIndex,
            });
          });
        });
        if (plan.length === 0) return;
        candidateScoreDebug.push({
          sourceKey: item.sourceKey || "",
          groupsCount: groups.length,
          score,
          attachmentMatched: attachmentSimilarity >= 0.55,
          attachmentSimilarity: Number(attachmentSimilarity.toFixed(3)),
          attachmentPreview: String(item.attachmentText || "").slice(0, 140),
          contextMatches: contextScore.matches,
        });
        if (score > bestScore) {
          bestScore = score;
          const answersFlat = groups
            .reduce((acc, group) => acc.concat(group), [])
            .map((answer) => cleanAnswerText(answer))
            .filter((answer) => answer.length > 0);
          bestCandidate = {
            sourceKey: item.sourceKey || "",
            groupsCount: groups.length,
            groups,
            answersFlat,
            plan,
          };
        }
      });
      const tiedContextlessItems = candidateScoreDebug.filter(
        (row) =>
          row.score === bestScore &&
          row.contextMatches === 0 &&
          row.attachmentSimilarity >= 0.85,
      );
      const tiedSourceKeys = Array.from(
        new Set(tiedContextlessItems.map((row) => row.sourceKey).filter(Boolean)),
      );
      if (tiedSourceKeys.length > 1 && orderedDropdownTargets.length < 2) {
        app.logToUI(
          `%c[WARN]%c 問題文を照合できず候補が曖昧なため回答を停止します: ${tiedSourceKeys.join(" / ")} / context=${nonGapContextHints.join(" | ").slice(0, 120) || "-"}`,
          styles.alert,
          "",
        );
        finalize();
        return;
      }
      dropdownRankedCandidates = candidateScoreDebug
        .map((row) => ({
          sourceKey: row.sourceKey,
          score: row.score,
        }))
        .sort((a, b) => b.score - a.score)
        .map((row) =>
          candidateItems.find(
            (item) => (item.sourceKey || "") === row.sourceKey,
          ),
        )
        .filter(Boolean);
      if (bestCandidate && bestCandidate.plan.length > 0) {
        nonGapAnswerPlan = bestCandidate.plan;
        answersToProcess = nonGapAnswerPlan.map((entry) => entry.answer);
        app.logToUI(
          `%c[INFO]%c 問題一致(複数回答): ${bestCandidate.sourceKey} / groups=${bestCandidate.groupsCount}`,
          styles.info,
          "",
        );
      }
      if (candidateScoreDebug.length > 0) {
        const sortedDebug = candidateScoreDebug
          .slice()
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
        const summary = sortedDebug
          .map(
            (row) =>
              `${row.sourceKey}:score=${row.score},groups=${row.groupsCount},ctx=${row.contextMatches},att=${row.attachmentMatched ? "Y" : "N"},sim=${row.attachmentSimilarity}`,
          )
          .join(" | ");
        app.logToUI(`%c[DEBUG]%c 候補スコア上位: ${summary}`, styles.info, "");
        app.logToUI(
          `%c[DEBUG]%c currentAttachment=${String(currentAttachmentText || "").slice(0, 180)}`,
          styles.info,
          "",
        );
        sortedDebug.forEach((row) => {
          app.logToUI(
            `%c[DEBUG]%c itemAttachment(${row.sourceKey})=${String(row.attachmentPreview || "").slice(0, 180)}`,
            styles.info,
            "",
          );
        });
      }
    }
    if (
      !isGapMode &&
      !matchInteractionPlan &&
      orderedDropdownTargets.length >= 2 &&
      app.state.extractedAnswers.length >= orderedDropdownTargets.length
    ) {
      directDropdownMode = true;
      const canCycleByItem =
        Array.isArray(dropdownRankedCandidates) &&
        dropdownRankedCandidates.length > 1 &&
        dropdownRankedCandidates.every((item) => {
          const groups = (item.answerGroups || []).filter(
            (g) => Array.isArray(g) && g.length > 0,
          );
          const flatLen = groups.reduce((n, g) => n + g.length, 0);
          return flatLen === orderedDropdownTargets.length;
        });
      if (canCycleByItem) {
        const cycleKey =
          dropdownRankedCandidates
            .map((item) => item.sourceKey || "")
            .join("|") + `::${orderedDropdownTargets.length}`;
        let itemCursor = Number(
          app.state.dropdownItemCursorByKey[cycleKey] || 0,
        );
        const advanceSeq = Number(app.state.dropdownAdvanceSequence || 0);
        const consumedAdvanceSeq = Number(
          app.state.dropdownConsumedAdvanceSeqByKey[cycleKey] || 0,
        );
        if (advanceSeq > consumedAdvanceSeq) {
          itemCursor = (itemCursor + 1) % dropdownRankedCandidates.length;
          app.state.dropdownConsumedAdvanceSeqByKey[cycleKey] = advanceSeq;
        }
        app.state.dropdownItemCursorByKey[cycleKey] = itemCursor;
        const selectedItem = dropdownRankedCandidates[itemCursor];
        const selectedGroups = (selectedItem.answerGroups || []).filter(
          (g) => Array.isArray(g) && g.length > 0,
        );
        directDropdownAnswers = selectedGroups
          .reduce((acc, group) => acc.concat(group), [])
          .map((answer) => cleanAnswerText(answer))
          .filter((answer) => answer.length > 0)
          .slice(0, orderedDropdownTargets.length);
        app.logToUI(
          `%c[INFO]%c Dropdownアイテム進行: ${selectedItem.sourceKey} (${itemCursor + 1}/${dropdownRankedCandidates.length}) trigger=${trigger}`,
          styles.info,
          "",
        );
      } else if (
        bestCandidate &&
        bestCandidate.groupsCount === 1 &&
        Array.isArray(bestCandidate.answersFlat) &&
        bestCandidate.answersFlat.length === orderedDropdownTargets.length
      ) {
        directDropdownAnswers = bestCandidate.answersFlat.slice();
        app.logToUI(
          `%c[INFO]%c Dropdownページ一致: ${bestCandidate.sourceKey}`,
          styles.info,
          "",
        );
      } else if (
        bestCandidate &&
        Array.isArray(bestCandidate.groups) &&
        bestCandidate.groups.length > 1 &&
        bestCandidate.groups.every(
          (group) => group.length === orderedDropdownTargets.length,
        )
      ) {
        const sourceKey = bestCandidate.sourceKey || "__dropdown-group__";
        const progressKey = `${sourceKey}::${orderedDropdownTargets.length}`;
        const currentFingerprint = getDropdownPageFingerprint(
          orderedDropdownTargets,
        );
        const lastFingerprint =
          app.state.dropdownGroupLastFingerprintByKey[progressKey];
        const currentUrl = String(window.location.href || "");
        const lastUrl = String(
          app.state.dropdownGroupLastUrlByKey[progressKey] || "",
        );
        const lastAttachmentNorm = String(
          app.state.dropdownGroupLastAttachmentByKey[progressKey] || "",
        );
        let cursor = Number(
          app.state.dropdownGroupCursorByKey[progressKey] || 0,
        );
        let cursorReason = "stay";
        if (lastUrl && currentUrl && lastUrl !== currentUrl) {
          cursor = (cursor + 1) % bestCandidate.groups.length;
          cursorReason = "url-change";
        } else if (
          lastAttachmentNorm &&
          currentAttachmentNormForProgress &&
          lastAttachmentNorm !== currentAttachmentNormForProgress
        ) {
          cursor = (cursor + 1) % bestCandidate.groups.length;
          cursorReason = "attachment-change";
        } else if (
          lastFingerprint &&
          currentFingerprint &&
          lastFingerprint !== currentFingerprint
        ) {
          cursor = (cursor + 1) % bestCandidate.groups.length;
          cursorReason = "fingerprint-change";
        }
        app.state.dropdownGroupCursorByKey[progressKey] = cursor;
        app.state.dropdownGroupLastFingerprintByKey[progressKey] =
          currentFingerprint;
        app.state.dropdownGroupLastUrlByKey[progressKey] = currentUrl;
        app.state.dropdownGroupLastAttachmentByKey[progressKey] =
          currentAttachmentNormForProgress;
        directDropdownAnswers = bestCandidate.groups[cursor].slice();
        app.logToUI(
          `%c[INFO]%c Dropdownグループ: ${sourceKey} (${cursor + 1}/${bestCandidate.groups.length})`,
          styles.info,
          "",
        );
        app.logToUI(
          `%c[DEBUG]%c progressKey=${progressKey} reason=${cursorReason} lastAtt=${lastAttachmentNorm.slice(0, 80)} currAtt=${String(
            currentAttachmentNormForProgress || "",
          ).slice(0, 80)}`,
          styles.info,
          "",
        );
      } else {
        directDropdownAnswers = app.state.extractedAnswers
          .map((answer) => cleanAnswerText(answer))
          .filter((answer) => answer.length > 0)
          .slice(0, orderedDropdownTargets.length);
      }
      if (directDropdownAnswers.length > 0) {
        answersToProcess = directDropdownAnswers.slice();
        nonGapAnswerPlan = null;
        app.logToUI(
          `%c[INFO]%c Dropdown直接モード: ターゲット=${orderedDropdownTargets.length} / 回答=${answersToProcess.length}`,
          styles.info,
          "",
        );
      }
    }
    if (!hasMatchInteractionMode && !isGapMode && matchTargets.length > 0) {
      const pickedMatchPlan = pickMatchInteractionPlan(matchTargets);
      if (
        pickedMatchPlan &&
        Array.isArray(pickedMatchPlan.plan) &&
        pickedMatchPlan.plan.length > 0
      ) {
        matchInteractionPlan = pickedMatchPlan.plan.slice();
        answersToProcess = matchInteractionPlan.map((entry) =>
          cleanAnswerText(entry && entry.answer),
        );
        nonGapAnswerPlan = null;
        directDropdownMode = false;
        app.logToUI(
          `%c[INFO]%c Match直接モード: ${pickedMatchPlan.sourceKey} / groups=${pickedMatchPlan.groupsCount} / targets=${pickedMatchPlan.targetCount} / answers=${answersToProcess.length}`,
          styles.info,
          "",
        );
      }
    }
    if (
      !isGapMode &&
      !matchInteractionPlan &&
      !nonGapAnswerPlan &&
      orderedTextTargets.length > 0
    ) {
      try {
        const items = Array.isArray(app.state.extractedItems)
          ? app.state.extractedItems
          : [];
        const currentAttachmentText = getCurrentAttachmentText();
        const currentAttachmentNorm = normalizeComparableLoose(
          currentAttachmentText,
        );
        const alreadyCollected = new Set(orderedTextTargets);
        const offScreenTargets = [];
        getAllSearchRoots().forEach((root) => {
          if (!root || typeof root.querySelectorAll !== "function") return;
          root
            .querySelectorAll(
              'input[type="text"], input[type="email"], input[type="number"],' +
              'input[type="search"], input:not([type]), textarea, [contenteditable="true"]',
            )
            .forEach((node) => {
              if (!node || alreadyCollected.has(node)) return;
              if (!isTextInputLike(node)) return;
              if (node.disabled || node.readOnly) return;
              if (isSolverUiNode(node)) return;
              if (
                node.closest(
                  '.activity--hidden, .slick-cloned, [aria-hidden="true"]',
                )
              )
                return;
              if (node.tagName === "INPUT") {
                const t = String(node.type || "").toLowerCase();
                if (t === "hidden") return;
              }
              try {
                const win = node.ownerDocument.defaultView || window;
                const style = win.getComputedStyle(node);
                if (style.display === "none" || style.visibility === "hidden")
                  return;
                if (parseFloat(style.opacity) === 0) return;
              } catch (_e) {
                return;
              }
              alreadyCollected.add(node);
              offScreenTargets.push(node);
            });
        });
        const allTextTargets = orderedTextTargets.concat(offScreenTargets);
        allTextTargets.sort(compareDomOrder);
        if (offScreenTargets.length > 0) {
          app.logToUI(
            `%c[INFO]%c ビューポート外の入力欄を追加検出: ${offScreenTargets.length}件`,
            styles.info,
            "",
          );
        }
        const groupMap = new Map();
        allTextTargets.forEach((target) => {
          const container =
            target.closest(
              ".activity, .que, fieldset, .question, [data-reference], .contentblock, .activity-item",
            ) || target.ownerDocument.body;
          if (!groupMap.has(container)) groupMap.set(container, []);
          groupMap.get(container).push(target);
        });
        let totalFilled = 0;
        for (const [groupContainer, groupTargets] of groupMap.entries()) {
          let groupPageText = groupContainer.textContent || "";
          getAllSearchRoots()
            .filter(
              (r) =>
                r.ownerDocument === groupContainer.ownerDocument ||
                r === groupContainer.ownerDocument,
            )
            .forEach((r) => {
              if (r && r.textContent) groupPageText += " " + r.textContent;
            });
          const pageTextNorm = normalizeLoose(groupPageText);
          let bestItem = null;
          let bestScore = Number.NEGATIVE_INFINITY;
          items.forEach((item) => {
            if (!item || item.type !== "standard") return;
            const ans = (item.answers || [])
              .map(cleanAnswerText)
              .filter(Boolean);
            if (ans.length === 0) return;
            let score = 0;
            if (ans.length === groupTargets.length) {
              score += 100;
            } else {
              score -= Math.abs(ans.length - groupTargets.length) * 20;
            }
            const itemAttachmentNorm = normalizeComparableLoose(
              item.attachmentText || "",
            );
            if (currentAttachmentNorm && itemAttachmentNorm) {
              const sim = getAttachmentSimilarityScore(
                currentAttachmentText,
                item.attachmentText || "",
              );
              score += Math.round(sim * 400);
              if (sim < 0.4) score -= 200;
            }
            const questions = item.questions || [item.question || ""];
            questions.forEach((q) => {
              const qNorm = normalizeLoose(q);
              if (qNorm && qNorm.length >= 4 && pageTextNorm.includes(qNorm)) {
                score += 30;
              }
            });
            if (item.question) {
              const fullQNorm = normalizeLoose(item.question);
              if (
                fullQNorm &&
                fullQNorm.length > 10 &&
                pageTextNorm.includes(fullQNorm)
              ) {
                score += 50;
              }
            }
            if (score > bestScore && score > 0) {
              bestScore = score;
              bestItem = item;
            }
          });
          let answersToApply = [];
          if (bestItem) {
            answersToApply = (bestItem.answers || [])
              .map(cleanAnswerText)
              .filter(Boolean);
            app.logToUI(
              `%c[INFO]%c ページ特定成功: ${bestItem.sourceKey} (score=${bestScore})`,
              styles.info,
              "",
            );
          } else {
            answersToApply = app.state.extractedAnswers;
          }
          let filledCount = 0;
          groupTargets.forEach((target, index) => {
            const finalAnswer = answersToApply[index];
            if (!finalAnswer) return;
            const currentVal = String(
              target.value || target.textContent || "",
            ).trim();
            const normCur = normalizeComparableText(currentVal);
            const normAns = normalizeComparableText(finalAnswer);
            if (normCur && normAns && normCur === normAns) {
              processedInputs.add(target);
              return;
            }
            try {
              target.scrollIntoView({ behavior: "instant", block: "nearest" });
            } catch (_e) {
              try {
                target.scrollIntoView(false);
              } catch (__e) { }
            }
            if (
              canAssignAnswerToTarget(target, finalAnswer) &&
              dispatchPasteLikeInput(target, finalAnswer)
            ) {
              processedInputs.add(target);
              app.logToUI(
                `  %c[INPUT]%c Q${index + 1}: ${finalAnswer}`,
                styles.good,
                "",
              );
              filledCount++;
              matchCount.value += 1;
            }
          });
          totalFilled += filledCount;
        }
        if (totalFilled > 0) {
          app.logToUI(
            `%c[DONE]%c ${totalFilled}件のアクションを実行しました。`,
            styles.good,
            "",
          );
        }
      } catch (err) {
        app.logToUI(
          `%c[ERROR]%c Text Entry 処理中にエラー: ${err.message}`,
          styles.bad,
          "",
        );
      }
      finalize();
      return;
    }
    if (
      !isGapMode &&
      !matchInteractionPlan &&
      orderedDropdownTargets.length === 0 &&
      orderedTextTargets.length === 0 &&
      interactionContainers.length === 0
    ) {
      app.logToUI(
        "%c[INFO]%c 操作対象が見つからなかったため、この実行を終了します。",
        styles.info,
        "",
      );
      finalize();
      return;
    }
    const isAlreadySelected = (element, input) => {
      if (input && (input.type === "radio" || input.type === "checkbox")) {
        return input.checked;
      }
      if (element) {
        if (element.classList.contains("drop-label")) return false;
        if (
          element.classList.contains("active") ||
          element.classList.contains("selected") ||
          element.classList.contains("checked") ||
          element.getAttribute("aria-checked") === "true"
        ) {
          return true;
        }
        if (element.querySelector(".active, .selected, .checked")) return true;
      }
      return false;
    };
    const safeClick = (element, input, logMessage) => {
      if (!element) return false;
      if (input && processedInputs.has(input)) return false;
      if (isAlreadySelected(element, input)) {
        if (input) processedInputs.add(input);
        return true;
      }
      try {
        element.scrollIntoView({ behavior: "instant", block: "nearest" });
      } catch (_e) { }
      element.click();
      if (input) processedInputs.add(input);
      if (logMessage) app.logToUI(logMessage, styles.good, "");
      app.state.newActionCount = (app.state.newActionCount || 0) + 1;
      return true;
    };
    const tryFillSpecificTextTarget = (target, answerText) => {
      if (!target) return false;
      if (processedInputs.has(target)) return false;
      const currentVal = String(
        target.value || target.textContent || "",
      ).trim();
      const currentNorm = normalizeComparableText(currentVal);
      const answerNorm = normalizeComparableText(answerText);
      if (currentNorm && answerNorm && currentNorm === answerNorm) {
        processedInputs.add(target);
        return true;
      }
      if (!canAssignAnswerToTarget(target, answerText)) return false;
      if (!dispatchPasteLikeInput(target, answerText)) return false;
      processedInputs.add(target);
      app.state.newActionCount = (app.state.newActionCount || 0) + 1;
      return true;
    };
    const getAllDragCandidates = (preferRoot) => {
      const merged = [];
      const seen = new Set();
      const addCandidates = (root) => {
        getDraggableCandidatesFromRoot(root).forEach((candidate) => {
          if (seen.has(candidate)) return;
          seen.add(candidate);
          merged.push(candidate);
        });
      };
      if (preferRoot) addCandidates(preferRoot);
      getAllSearchRoots().forEach((root) => addCandidates(root));
      return merged;
    };
    const getLooseSourceCandidates = (
      answerText,
      preferRoot,
      target,
      sourceId = "",
    ) => {
      const answerNorm = app.normalize(answerText);
      const sourceIdText = String(sourceId || "").trim();
      if (!answerNorm && !sourceIdText) return [];
      const roots = [];
      if (preferRoot) roots.push(preferRoot);
      getAllSearchRoots().forEach((root) => {
        if (!roots.includes(root)) roots.push(root);
      });
      const results = [];
      const seen = new Set();
      let hasIdentifierHit = false;
      const escapedSourceId = escapeSelectorValue(sourceIdText);
      const addCandidate = (node, forceIdentifier = false) => {
        const el = getPreferredSourceElement(node);
        if (!el || seen.has(el)) return;
        seen.add(el);
        if (!isRendered(el)) return;
        if (usedDragElements.has(el)) return;
        if (
          target &&
          (el === target ||
            target.contains(el) ||
            (typeof el.contains === "function" && el.contains(target)))
        ) {
          return;
        }
        if (el.closest("[aria-hidden='true']")) return;
        if (
          !sourceIdText &&
          el.closest(".gap_match_gap_view, .drop_area.target")
        ) {
          return;
        }
        if (isSolverUiNode(el)) return;
        const textValue = getNodeText(el);
        const byText = !!textValue && isSourceTextMatch(textValue, answerText);
        const byIdentifier = matchesSourceIdentifier(el, sourceIdText);
        if (byIdentifier) hasIdentifierHit = true;
        if (!byText && !byIdentifier && !forceIdentifier) return;
        const normalizedText = app.normalize(textValue);
        const score =
          getInteractiveScore(el) + (byIdentifier ? 8 : 0) + (byText ? 3 : 0);
        if (!forceIdentifier && !byIdentifier && score < 1) {
          const shortToken = normalizedText.length <= 3;
          const numericAnswer = /^\d+$/.test(String(answerText || "").trim());
          const numericTokenLike =
            numericAnswer &&
            byText &&
            normalizedText.length > 0 &&
            normalizedText.length <= 24;
          const hasClickableHint =
            typeof el.onclick === "function" ||
            el.hasAttribute("onclick") ||
            el.hasAttribute("tabindex") ||
            /(click|select|tap|choice|item|option|word|token|source|match|sentence)/i.test(
              String(el.className || ""),
            );
          if (!(shortToken && hasClickableHint) && !numericTokenLike) return;
        }
        results.push({
          el,
          score,
        });
      };
      roots.forEach((root) => {
        if (!root || typeof root.querySelectorAll !== "function") return;
        if (sourceIdText && escapedSourceId) {
          const idSelector = [
            `[identifier='${escapedSourceId}']`,
            `[data-identifier='${escapedSourceId}']`,
            `[data-id='${escapedSourceId}']`,
            `[id='${escapedSourceId}']`,
            `[name='${escapedSourceId}']`,
            `[value='${escapedSourceId}']`,
            `[for='${escapedSourceId}']`,
            `[identifier*='${escapedSourceId}']`,
            `[data-identifier*='${escapedSourceId}']`,
            `[data-id*='${escapedSourceId}']`,
            `[id*='${escapedSourceId}']`,
            `[name*='${escapedSourceId}']`,
            `[for*='${escapedSourceId}']`,
          ].join(", ");
          try {
            root
              .querySelectorAll(idSelector)
              .forEach((node) => addCandidate(node, true));
          } catch (_err) { }
        }
        root
          .querySelectorAll(
            "div,span,li,button,label,a,p,input,[class],[id],[role='option'],[role='button'],[tabindex],[draggable='true'],[identifier],[data-identifier],[data-id],[data-source],[data-answer],[data-value],[value],[name]",
          )
          .forEach((node) => {
            addCandidate(node, false);
          });
      });
      if (sourceIdText && !hasIdentifierHit && results.length > 0) {
        results.sort((a, b) => {
          const aText = getNodeText(a.el);
          const bText = getNodeText(b.el);
          const aStrong = isSourceTextMatch(aText, answerText) ? 1 : 0;
          const bStrong = isSourceTextMatch(bText, answerText) ? 1 : 0;
          if (aStrong !== bStrong) return bStrong - aStrong;
          return b.score - a.score;
        });
        return results.map((r) => r.el);
      }
      results.sort((a, b) => b.score - a.score);
      return results.map((r) => r.el);
    };
    const tryClickWord = (index, answerText) => {
      const strictCandidates = getAllDragCandidates(gapScopeRoot);
      const candidates = strictCandidates.concat(
        getLooseSourceCandidates(answerText, gapScopeRoot, null),
      );
      for (const candidate of candidates) {
        if (usedDragElements.has(candidate)) continue;
        if (!isSourceTextMatch(getNodeText(candidate), answerText)) continue;
        app.logToUI(
          `  %c[CLICK-WORD]%c Q${index + 1}: ${answerText}`,
          styles.good,
          "",
        );
        const docWindow = candidate.ownerDocument.defaultView || window;
        try {
          candidate.scrollIntoView({ behavior: "instant", block: "nearest" });
        } catch (_e) { }
        candidate.dispatchEvent(
          new docWindow.MouseEvent("mousedown", {
            bubbles: true,
          }),
        );
        candidate.click();
        candidate.dispatchEvent(
          new docWindow.MouseEvent("mouseup", {
            bubbles: true,
          }),
        );
        usedDragElements.add(candidate);
        return true;
      }
      return false;
    };
    const tryMoveToGap = (index, answerText, sourceId = "") => {
      if (index >= gapTargets.length) return false;
      const target = gapTargets[index];
      const targetDoc = target.ownerDocument;
      const preferredRoot =
        gapScopeRoot && gapScopeRoot.ownerDocument === targetDoc
          ? gapScopeRoot
          : targetDoc;
      const strictCandidates = getAllDragCandidates(preferredRoot);
      const looseCandidates = getLooseSourceCandidates(
        answerText,
        preferredRoot,
        target,
        sourceId,
      );
      const candidates = strictCandidates.concat(looseCandidates);
      let moveCandidates = candidates.filter((candidate) => {
        if (usedDragElements.has(candidate)) return false;
        if (
          candidate === target ||
          target.contains(candidate) ||
          (typeof candidate.contains === "function" &&
            candidate.contains(target))
        ) {
          return false;
        }
        if (candidate.closest(".width-measure")) return false;
        if (!isRendered(candidate)) return false;
        return (
          isSourceTextMatch(getNodeText(candidate), answerText) ||
          matchesSourceIdentifier(candidate, sourceId)
        );
      });
      if (moveCandidates.length === 0) {
        const emergency = [];
        const seenEmergency = new Set();
        getAllSearchRoots().forEach((root) => {
          if (!root || typeof root.querySelectorAll !== "function") return;
          root
            .querySelectorAll(
              "div,span,li,button,label,a,p,[class],[id],[role='button'],[role='option'],[tabindex]",
            )
            .forEach((node) => {
              const preferred = getPreferredSourceElement(node);
              if (!preferred || seenEmergency.has(preferred)) return;
              seenEmergency.add(preferred);
              if (!isRendered(preferred)) return;
              if (
                preferred === target ||
                target.contains(preferred) ||
                (typeof preferred.contains === "function" &&
                  preferred.contains(target))
              ) {
                return;
              }
              if (usedDragElements.has(preferred)) return;
              if (isSolverUiNode(preferred)) return;
              if (
                !isSourceTextMatch(getNodeText(preferred), answerText) &&
                !matchesSourceIdentifier(preferred, sourceId)
              ) {
                return;
              }
              emergency.push(preferred);
            });
        });
        if (emergency.length > 0) {
          moveCandidates = emergency;
        }
      }
      moveCandidates.sort(
        (a, b) =>
          getSourceCandidatePriority(b, answerText, sourceId) -
          getSourceCandidatePriority(a, answerText, sourceId),
      );
      for (const source of moveCandidates) {
        const sourceWindow = source.ownerDocument.defaultView || window;
        const targetWindow = target.ownerDocument.defaultView || sourceWindow;
        const beforeTap = getGapSnapshot(target);
        try {
          source.scrollIntoView({ behavior: "instant", block: "nearest" });
        } catch (_e) { }
        try {
          target.scrollIntoView({ behavior: "instant", block: "nearest" });
        } catch (_e) { }
        source.dispatchEvent(
          new sourceWindow.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            buttons: 1,
          }),
        );
        source.click();
        source.dispatchEvent(
          new sourceWindow.MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            buttons: 1,
          }),
        );
        target.dispatchEvent(
          new targetWindow.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            buttons: 1,
          }),
        );
        target.click();
        target.dispatchEvent(
          new targetWindow.MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            buttons: 1,
          }),
        );
        if (isGapFilledWithAnswer(target, answerText, beforeTap)) {
          app.logToUI(
            `  %c[MOVE]%c Q${index + 1}: ${answerText}`,
            styles.good,
            "",
          );
          usedDragElements.add(source);
          return true;
        }
        const beforeDrag = getGapSnapshot(target);
        try {
          simulateDragDrop(source, target);
        } catch (_err) { }
        if (isGapFilledWithAnswer(target, answerText, beforeDrag)) {
          app.logToUI(
            `  %c[MOVE]%c Q${index + 1}: ${answerText}`,
            styles.good,
            "",
          );
          usedDragElements.add(source);
          return true;
        }
      }
      return false;
    };
    const getSourceCandidatePriority = (
      candidate,
      answerText,
      sourceId = "",
    ) => {
      if (!candidate) return Number.NEGATIVE_INFINITY;
      const text = getNodeText(candidate);
      const norm = normalizeComparableText(text);
      const answer = String(answerText || "").trim();
      const numericAnswer = /^\d+$/.test(answer);
      const byIdentifier = matchesSourceIdentifier(candidate, sourceId);
      let score = getInteractiveScore(candidate);
      if (byIdentifier) score += 220;
      if (numericAnswer) {
        const exactNumeric = norm === answer;
        const boundaryNumeric = new RegExp(`(^|\\D)${answer}(\\D|$)`).test(
          norm,
        );
        const sentenceNumeric = norm.includes(`sentence ${answer}`);
        const tokenNumeric = Array.from(norm.matchAll(/\d+/g))
          .map((m) => m[0])
          .includes(answer);
        if (exactNumeric) score += 180;
        else if (boundaryNumeric) score += 110;
        else if (sentenceNumeric || tokenNumeric) score += 70;
        if (/[a-z]/i.test(norm) && !exactNumeric && !boundaryNumeric) {
          score -= 35;
        }
      } else if (isAnswerTextMatch(text, answerText)) {
        score += 130;
      }
      return score;
    };
    const getMatchTargetClickCandidates = (target) => {
      if (!target) return [];
      const candidates = [];
      const seen = new Set();
      const add = (node) => {
        if (!node || seen.has(node)) return;
        seen.add(node);
        if (!isRendered(node)) return;
        if (isSolverUiNode(node)) return;
        candidates.push(node);
      };
      add(target);
      add(target.parentElement);
      add(target.previousElementSibling);
      add(target.nextElementSibling);
      const columnLike = target.closest(
        "[data-target], .drop_area.target, .gap_match_gap_view, .target, [class*='target'], [class*='drop'], [class*='column']",
      );
      add(columnLike);
      const block = target.closest(
        ".simpleMatchSet, .matchInteraction, .gapMatchInteraction, .que, fieldset",
      );
      if (block && typeof block.querySelectorAll === "function") {
        block
          .querySelectorAll(
            "[data-target], .drop_area.target, .gap_match_gap_view, .target, [class*='target'], [class*='drop']",
          )
          .forEach((node) => add(node));
      }
      return candidates;
    };
    const tryMoveToMatchTarget = (
      index,
      answerText,
      target,
      questionLabel,
      sourceId = "",
    ) => {
      if (!target) return false;
      const dispatchClickSequence = (node, nodeWindow) => {
        if (!node) return;
        const win = nodeWindow || node.ownerDocument.defaultView || window;
        try {
          node.scrollIntoView({ behavior: "instant", block: "nearest" });
        } catch (_e) { }
        node.dispatchEvent(
          new win.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            buttons: 1,
          }),
        );
        node.click();
        node.dispatchEvent(
          new win.MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            buttons: 1,
          }),
        );
      };
      const targetDoc = target.ownerDocument;
      const preferredRoot =
        target.closest(
          ".matchInteraction, .simpleMatchSet, .gapMatchInteraction, .que, fieldset",
        ) ||
        (gapScopeRoot && gapScopeRoot.ownerDocument === targetDoc
          ? gapScopeRoot
          : targetDoc);
      const strictCandidates = getAllDragCandidates(preferredRoot);
      const looseCandidates = getLooseSourceCandidates(
        answerText,
        preferredRoot,
        target,
        sourceId,
      );
      const candidates = strictCandidates.concat(looseCandidates);
      const targetClickCandidates = getMatchTargetClickCandidates(target);
      const moveCandidates = candidates.filter((candidate) => {
        if (usedDragElements.has(candidate)) return false;
        if (
          candidate === target ||
          target.contains(candidate) ||
          (typeof candidate.contains === "function" &&
            candidate.contains(target))
        ) {
          return false;
        }
        if (candidate.closest(".width-measure")) return false;
        if (!isRendered(candidate)) return false;
        return (
          isSourceTextMatch(getNodeText(candidate), answerText) ||
          matchesSourceIdentifier(candidate, sourceId)
        );
      });
      moveCandidates.sort(
        (a, b) =>
          getSourceCandidatePriority(b, answerText, sourceId) -
          getSourceCandidatePriority(a, answerText, sourceId),
      );
      app.logToUI(
        `  %c[DEBUG]%c Match候補 ${questionLabel || `Q${index + 1}`}: sources=${moveCandidates.length}, strict=${strictCandidates.length}, loose=${looseCandidates.length}, clickTargets=${targetClickCandidates.length}, sourceId=${String(sourceId || "-")}`,
        styles.info,
        "",
      );
      for (const source of moveCandidates) {
        const sourceWindow = source.ownerDocument.defaultView || window;
        const clickTargets =
          targetClickCandidates.length > 0 ? targetClickCandidates : [target];
        for (const clickTarget of clickTargets) {
          const targetWindow =
            (clickTarget && clickTarget.ownerDocument
              ? clickTarget.ownerDocument.defaultView
              : null) || sourceWindow;
          const beforeTarget = getGapSnapshot(clickTarget);
          const beforeMainTarget = getGapSnapshot(target);
          dispatchClickSequence(clickTarget, targetWindow);
          dispatchClickSequence(source, sourceWindow);
          if (
            isGapFilledWithAnswer(clickTarget, answerText, beforeTarget) ||
            didGapChange(beforeTarget, clickTarget) ||
            isGapFilledWithAnswer(target, answerText, beforeMainTarget) ||
            didGapChange(beforeMainTarget, target)
          ) {
            app.logToUI(
              `  %c[MOVE-MATCH]%c ${questionLabel || `Q${index + 1}`}: ${answerText}`,
              styles.good,
              "",
            );
            usedDragElements.add(source);
            return true;
          }
          const beforeSourceFirst = getGapSnapshot(clickTarget);
          const beforeSourceFirstMain = getGapSnapshot(target);
          dispatchClickSequence(source, sourceWindow);
          dispatchClickSequence(clickTarget, targetWindow);
          if (
            isGapFilledWithAnswer(clickTarget, answerText, beforeSourceFirst) ||
            didGapChange(beforeSourceFirst, clickTarget) ||
            isGapFilledWithAnswer(target, answerText, beforeSourceFirstMain) ||
            didGapChange(beforeSourceFirstMain, target)
          ) {
            app.logToUI(
              `  %c[MOVE-MATCH]%c ${questionLabel || `Q${index + 1}`}: ${answerText}`,
              styles.good,
              "",
            );
            usedDragElements.add(source);
            return true;
          }
          const beforeDrag = getGapSnapshot(clickTarget);
          const beforeDragMain = getGapSnapshot(target);
          try {
            simulateDragDrop(source, clickTarget);
          } catch (_err) { }
          if (
            isGapFilledWithAnswer(clickTarget, answerText, beforeDrag) ||
            didGapChange(beforeDrag, clickTarget) ||
            isGapFilledWithAnswer(target, answerText, beforeDragMain) ||
            didGapChange(beforeDragMain, target)
          ) {
            app.logToUI(
              `  %c[MOVE-MATCH]%c ${questionLabel || `Q${index + 1}`}: ${answerText}`,
              styles.good,
              "",
            );
            usedDragElements.add(source);
            return true;
          }
        }
      }
      return false;
    };
    const tryFallbackLabels = (questionNumber, answerText) => {
      const roots = getAllSearchRoots();
      for (const root of roots) {
        if (!root || typeof root.querySelectorAll !== "function") continue;
        const allLabels = Array.from(root.querySelectorAll("label"));
        const matches = allLabels.filter((label) =>
          isAnswerTextMatch(label.textContent, answerText),
        );
        for (const label of matches) {
          const forId = label.getAttribute("for");
          const ownerDoc = label.ownerDocument || document;
          const input = forId
            ? ownerDoc.getElementById(forId)
            : label.querySelector("input");
          if (
            safeClick(
              label,
              input,
              `  %c[CLICK-FALLBACK]%c Q${questionNumber}: ${answerText}`,
            )
          ) {
            return true;
          }
        }
      }
      return false;
    };
    const likelyTextEntryMode =
      !isGapMode &&
      orderedTextTargets.length >= answersToProcess.length &&
      orderedTextTargets.length <= answersToProcess.length + 2;
    const tryTextInputs = (index, answerText) => {
      if (likelyTextEntryMode) {
        const target = orderedTextTargets[index] || null;
        if (tryFillSpecificTextTarget(target, answerText)) {
          app.logToUI(`  %c[INPUT]%c Field: ${answerText}`, styles.good, "");
          return true;
        }
      }
      for (const target of orderedTextTargets) {
        if (tryFillSpecificTextTarget(target, answerText)) {
          app.logToUI(`  %c[INPUT]%c Field: ${answerText}`, styles.good, "");
          return true;
        }
      }
      return false;
    };
    const fillTextInputsBatch = (startIndex = 0) => {
      let filled = 0;
      for (let i = startIndex; i < answersToProcess.length; i += 1) {
        const answerText = cleanAnswerText(answersToProcess[i]);
        if (!answerText) continue;
        if (tryTextInputs(i, answerText)) {
          matchCount.value += 1;
          filled += 1;
        }
      }
      return filled;
    };
    const processItem = (index) => {
      try {
        if (isCancelled()) return;
        if (index >= answersToProcess.length) {
          app.logToUI(
            `%c[DONE]%c ${matchCount.value}件のアクションを実行しました。`,
            styles.good,
            "",
          );
          finalize();
          return;
        }
        const planEntry =
          !isGapMode && Array.isArray(nonGapAnswerPlan)
            ? nonGapAnswerPlan[index] || null
            : null;
        const plannedContainerIndex =
          planEntry && Number.isInteger(planEntry.containerIndex)
            ? planEntry.containerIndex
            : index;
        const answerText = cleanAnswerText(
          planEntry ? planEntry.answer : answersToProcess[index],
        );
        if (!answerText) {
          setTimeout(() => processItem(index + 1), PROCESS_ITEM_DELAY_MISS_MS);
          return;
        }
        if (
          Array.isArray(matchInteractionPlan) &&
          matchInteractionPlan.length > 0
        ) {
          const matchEntry = matchInteractionPlan[index] || null;
          const target = matchEntry ? matchEntry.target || null : null;
          const questionLabel = matchEntry
            ? String(matchEntry.questionLabel || "").trim()
            : `Q${index + 1}`;
          const sourceId = matchEntry
            ? String(matchEntry.sourceId || "").trim()
            : "";
          let answeredMatch = false;
          if (target) {
            answeredMatch = tryMoveToMatchTarget(
              index,
              answerText,
              target,
              questionLabel,
              sourceId,
            );
          }
          if (answeredMatch) {
            matchCount.value += 1;
          } else {
            app.logToUI(
              `  %c[SKIP]%c ${questionLabel}: ${answerText}`,
              styles.alert,
              "",
            );
          }
          setTimeout(
            () => processItem(index + 1),
            answeredMatch
              ? GAP_PROCESS_ITEM_DELAY_HIT_MS
              : GAP_PROCESS_ITEM_DELAY_MISS_MS,
          );
          return;
        }
        if (directDropdownMode) {
          const target = orderedDropdownTargets[index] || null;
          let answeredDirectDropdown = false;
          if (
            target &&
            target.classList &&
            target.classList.contains("wrapper-dropdown")
          ) {
            const currentLabel = target.querySelector(".drop-label");
            if (
              currentLabel &&
              isAnswerTextMatch(currentLabel.textContent, answerText)
            ) {
              answeredDirectDropdown = true;
            } else {
              answeredDirectDropdown = selectOptionFromWrapperPopup(
                target,
                answerText,
              );
            }
          } else if (target && target.matches && target.matches("select")) {
            answeredDirectDropdown = setNativeSelectValue(target, answerText);
          }
          if (answeredDirectDropdown) {
            app.logToUI(
              `  %c[CLICK]%c Q${index + 1} (Dropdown): ${answerText}`,
              styles.good,
              "",
            );
            matchCount.value += 1;
          } else {
            app.logToUI(
              `  %c[SKIP]%c Q${index + 1}: ${answerText}`,
              styles.alert,
              "",
            );
          }
          setTimeout(
            () => processItem(index + 1),
            answeredDirectDropdown
              ? PROCESS_ITEM_DELAY_HIT_MS
              : PROCESS_ITEM_DELAY_MISS_MS,
          );
          return;
        }
        if (isGapMode) {
          let answeredGap = false;
          const gapPlanEntry =
            Array.isArray(gapAssignmentPlan) && gapAssignmentPlan.length > 0
              ? gapAssignmentPlan[index] || null
              : null;
          const gapTargetIndex =
            gapPlanEntry && Number.isInteger(gapPlanEntry.targetIndex)
              ? gapPlanEntry.targetIndex
              : index;
          const gapDisplayLabel =
            gapPlanEntry && gapPlanEntry.questionLabel
              ? gapPlanEntry.questionLabel
              : `Q${index + 1}`;
          const gapSourceId =
            gapPlanEntry && gapPlanEntry.sourceId
              ? String(gapPlanEntry.sourceId).trim()
              : "";
          if (tryMoveToGap(gapTargetIndex, answerText, gapSourceId)) {
            answeredGap = true;
            matchCount.value += 1;
          } else {
            app.logToUI(
              `  %c[SKIP]%c ${gapDisplayLabel}: ${answerText}`,
              styles.alert,
              "",
            );
          }
          setTimeout(
            () => processItem(index + 1),
            answeredGap
              ? GAP_PROCESS_ITEM_DELAY_HIT_MS
              : GAP_PROCESS_ITEM_DELAY_MISS_MS,
          );
          return;
        }
        let answered = false;
        const container =
          interactionContainers[plannedContainerIndex] ||
          interactionContainers[interactionContainers.length - 1] ||
          null;
        const displayQuestionNumber = plannedContainerIndex + 1;
        if (likelyTextEntryMode) {
          const batchFilled = fillTextInputsBatch(index);
          app.logToUI(
            `%c[BATCH-INPUT]%c ${batchFilled}件を一括入力しました。`,
            styles.info,
            "",
          );
          app.logToUI(
            `%c[DONE]%c ${matchCount.value}件のアクションを実行しました。`,
            styles.good,
            "",
          );
          finalize();
          return;
        }
        if (container && container.classList.contains("wrapper-dropdown")) {
          const currentLabel = container.querySelector(".drop-label");
          if (
            currentLabel &&
            isAnswerTextMatch(currentLabel.textContent, answerText)
          ) {
            answered = true;
            matchCount.value += 1;
          } else if (selectOptionFromWrapperPopup(container, answerText)) {
            app.logToUI(
              `  %c[CLICK]%c Q${displayQuestionNumber} (Dropdown): ${answerText}`,
              styles.good,
              "",
            );
            answered = true;
            matchCount.value += 1;
          }
        }
        if (!answered && container) {
          const nativeSelect = container.matches("select")
            ? container
            : container.querySelector("select");
          if (nativeSelect && isRendered(nativeSelect)) {
            if (setNativeSelectValue(nativeSelect, answerText)) {
              app.logToUI(
                `  %c[SELECT]%c Q${displayQuestionNumber}: ${answerText}`,
                styles.good,
                "",
              );
              answered = true;
              matchCount.value += 1;
            }
          }
        }
        if (!answered && container) {
          const labels = container.querySelectorAll("label");
          for (const label of labels) {
            if (!isAnswerTextMatch(label.textContent, answerText)) continue;
            const forId = label.getAttribute("for");
            const input = forId
              ? container.querySelector(`#${forId}`)
              : label.querySelector("input");
            const parentClickable = label.closest(
              ".input-radio, .simpleChoice, .choice, .checkbox",
            );
            const targetElement = parentClickable || label;
            if (
              safeClick(
                targetElement,
                input,
                `  %c[CLICK]%c Q${displayQuestionNumber} (Container): ${answerText}`,
              )
            ) {
              answered = true;
              matchCount.value += 1;
              break;
            }
          }
        }
        if (!answered && container) {
          const inputDivs = container.querySelectorAll(
            ".input-radio, .input-checkbox, .simpleChoice, .choice, [role='checkbox'], [role='radio']",
          );
          for (const div of inputDivs) {
            if (!isAnswerTextMatch(div.textContent, answerText)) continue;
            const input = div.querySelector("input");
            if (
              safeClick(
                div,
                input,
                `  %c[CLICK]%c Q${displayQuestionNumber} (Div): ${answerText}`,
              )
            ) {
              answered = true;
              matchCount.value += 1;
              break;
            }
          }
        }
        if (!answered && tryFallbackLabels(displayQuestionNumber, answerText)) {
          answered = true;
          matchCount.value += 1;
        }
        if (!answered && tryTextInputs(index, answerText)) {
          answered = true;
          matchCount.value += 1;
        }
        if (!answered) {
          app.logToUI(
            `  %c[SKIP]%c Q${displayQuestionNumber}: ${answerText}`,
            styles.alert,
            "",
          );
        }
        setTimeout(
          () => processItem(index + 1),
          answered ? PROCESS_ITEM_DELAY_HIT_MS : PROCESS_ITEM_DELAY_MISS_MS,
        );
      } catch (err) {
        app.logToUI(
          `%c[ERROR]%c 自動回答中に例外が発生: ${err && err.message ? err.message : err}`,
          styles.bad,
          "",
        );
        finalize();
      }
    };
    processItem(0);
  }
  function checkNextBtn() {
    if (app.state.isAutoAnswerRunning) return;
    const now = Date.now();
    const lastAutoAnswerFinishedAt = Number(
      app.state.lastAutoAnswerFinishedAt || 0,
    );
    const hasRecentSuccessfulAutoAnswer =
      app.state.isAutoAnswerActive &&
      Number(app.state.lastAutoAnswerMatchCount || 0) > 0 &&
      now - lastAutoAnswerFinishedAt < AUTO_ANSWER_PULSE_COOLDOWN_MATCH_MS;
    const lastAutoNextClickAt = Number(app.state.lastAutoNextClickAt || 0);
    const clickCooldownMs = hasComplexAutoFlowContext()
      ? Math.max(
        getTimingProfile().nextClickCooldownMs,
        STABLE_NEXT_CLICK_COOLDOWN_MS,
      )
      : getTimingProfile().nextClickCooldownMs;
    if (now - lastAutoNextClickAt < clickCooldownMs) return;
    if (
      app.state.isAutoAnswerActive &&
      hasPendingAnswerTargets() &&
      !hasRecentSuccessfulAutoAnswer
    ) {
      autoAnswer({
        force: true,
        trigger: "auto-next-wait",
        quietIfRunning: true,
        suppressStartLog: true,
        suppressDuplicateLog: true,
        suppressEmptyWarn: true,
        cooldownMs: 250,
      });
      return;
    }
    if (hasSpeakingPlayableInPage()) {
      if (app.state.isAutoNextActive || app.state.autoNextInterval) {
        app.logToUI(
          "%c[AUTO-NEXT]%c スピーキング課題を検出したため Auto Next を停止しました。",
          styles.alert,
          "",
        );
        setAutoNextEnabled(false, {
          persist: true,
          log: false,
        });
      }
      return;
    }
    const tryClick = (root) => {
      if (!root || typeof root.querySelector !== "function") return false;
      const viewWin =
        root.defaultView ||
        (root.ownerDocument && root.ownerDocument.defaultView) ||
        window;
      for (const target of NEXT_BUTTON_TARGETS) {
        if (/next activity/i.test(target.name)) continue;
        const buttons = Array.from(root.querySelectorAll(target.selector));
        for (const button of buttons) {
          if (isUnavailableActionButton(button)) continue;
          const isCheckButton = /check/i.test(target.name);
          if (isCheckButton && !isCheckButtonReady(button)) continue;
          const checkStateSignature = isCheckButton
            ? getCheckStateSignature(button)
            : "";
          const sameCheckState =
            isCheckButton &&
            app.state.lastAutoCheckButton === button &&
            app.state.lastAutoCheckSignature === checkStateSignature;
          if (
            sameCheckState &&
            (now - Number(app.state.lastAutoCheckAttemptAt || 0) < 800 ||
              Number(app.state.lastAutoCheckAttemptCount || 0) >= 2)
          ) {
            continue;
          }
          app.logToUI(
            `%c[AUTO-NEXT]%c ${target.name}ボタンをクリックします...`,
            styles.info,
            "",
          );
          clickWithoutLinkNavigation(button, viewWin);
          app.state.lastAutoNextClickAt = Date.now();
          const nextTrigger = isCheckButton ? "auto-check" : "auto-next";
          if (isCheckButton) {
            app.state.lastAutoCheckAttemptCount = sameCheckState
              ? Number(app.state.lastAutoCheckAttemptCount || 0) + 1
              : 1;
            app.state.lastAutoCheckAttemptAt = Date.now();
            app.state.lastAutoCheckButton = button;
            app.state.lastAutoCheckSignature = checkStateSignature;
          } else {
            app.state.lastAutoCheckButton = null;
            app.state.lastAutoCheckSignature = "";
            app.state.lastAutoCheckAttemptCount = 0;
            app.state.lastAutoCheckAttemptAt = 0;
            queueAutoAnswerAfterAdvance(nextTrigger);
          }
          return true;
        }
      }
      return false;
    };
    const roots = getAllSearchRoots();
    for (const root of roots) {
      if (tryClick(root)) return;
    }
  }
  function initManualAdvanceAutoAnswerHook() {
    if (app.state.manualAdvanceHookInitialized) return;
    app.state.manualAdvanceHookInitialized = true;
    const hookedDocs = new WeakSet();
    const handleClick = (event) => {
      if (!app.state.isAutoAnswerActive) return;
      if (event && event.isTrusted === false) return;
      const element = toElement(event.target);
      const matched = getNextActionTargetFromElement(element);
      if (!matched || !matched.button) return;
      if (isUnavailableActionButton(matched.button)) return;
      if (/check/i.test(matched.name)) return;
      app.state.lastAutoCheckButton = null;
      app.state.lastAutoCheckSignature = "";
      app.state.lastAutoCheckAttemptCount = 0;
      app.state.lastAutoCheckAttemptAt = 0;
      app.logToUI(
        `%c[INFO]%c ${matched.name} のクリックを検出。Auto Answer を再実行します。`,
        styles.info,
        "",
      );
      queueAutoAnswerAfterAdvance("manual-next");
    };
    const attachToDoc = (doc) => {
      if (!doc || hookedDocs.has(doc)) return;
      hookedDocs.add(doc);
      doc.addEventListener("click", handleClick, true);
    };
    const refreshHooks = () => {
      app.getAccessibleDocuments().forEach((doc) => attachToDoc(doc));
    };
    refreshHooks();
    const observerRoot = document.documentElement || document.body;
    if (!observerRoot) return;
    const observer = new MutationObserver(() => refreshHooks());
    observer.observe(observerRoot, {
      childList: true,
      subtree: true,
    });
    app.state.manualAdvanceObserver = observer;
  }
  function setAutoNextEnabled(nextActive, options = {}) {
    const { buttonElement = null, persist = true, log = true } = options;
    const next = !!nextActive;
    if (next && hasSpeakingPlayableInPage()) {
      app.state.isAutoNextActive = false;
      if (app.state.autoNextInterval) clearInterval(app.state.autoNextInterval);
      app.state.autoNextInterval = null;
      if (buttonElement) {
        buttonElement.style.backgroundColor = "#6c757d";
        buttonElement.textContent = "Auto Next: OFF";
      }
      if (log) {
        app.logToUI(
          "%c[AUTO-NEXT]%c スピーキング課題を検出したため Auto Next を停止しました。",
          styles.alert,
          "",
        );
      }
      if (persist) persistAutoSettings();
      return app.state.isAutoNextActive;
    }
    app.state.isAutoNextActive = next;
    if (app.state.isAutoNextActive) {
      if (buttonElement) {
        buttonElement.style.backgroundColor = "#28a745";
        buttonElement.textContent = "Auto Next: ON";
      }
      if (app.state.autoNextInterval) clearInterval(app.state.autoNextInterval);
      app.state.autoNextInterval = setInterval(
        checkNextBtn,
        getTimingProfile().nextPollMs,
      );
      checkNextBtn();
      if (persist) persistAutoSettings();
      return app.state.isAutoNextActive;
    }
    if (buttonElement) {
      buttonElement.style.backgroundColor = "#6c757d";
      buttonElement.textContent = "Auto Next: OFF";
    }
    if (app.state.autoNextInterval) clearInterval(app.state.autoNextInterval);
    app.state.autoNextInterval = null;
    if (persist) persistAutoSettings();
    return app.state.isAutoNextActive;
  }
  function toggleAutoNext(buttonElement) {
    return setAutoNextEnabled(!app.state.isAutoNextActive, {
      buttonElement,
      persist: true,
      log: true,
    });
  }
  function restoreAutoSettings() {
    try {
      if (!chrome || !chrome.storage || !chrome.storage.local) return;
      chrome.storage.local.get(
        [
          "autoAnswerActive",
          "autoNextActive",
          "autoActivityActive",
          "autoWrongStopActive",
          "speedLevel",
        ],
        (result) => {
          const wantAutoAnswer = !!(result && result.autoAnswerActive);
          const wantAutoNext = !!(result && result.autoNextActive);
          const speedLevel = clampSpeedLevel(result && result.speedLevel);
          setSpeedLevel(speedLevel, {
            persist: false,
            log: false,
          });
          setAutoAnswerEnabled(wantAutoAnswer, {
            persist: false,
            log: false,
            trigger: "restore",
            runImmediate: false,
          });
          setAutoNextEnabled(wantAutoNext, {
            persist: false,
            log: false,
          });
          const wantAutoActivity = !!(result && result.autoActivityActive);
          setAutoActivityEnabled(wantAutoActivity, {
            persist: false,
            log: false,
          });
          const wantAutoWrongStop = !!(result && result.autoWrongStopActive);
          setAutoWrongStopEnabled(wantAutoWrongStop, {
            persist: false,
            log: false,
          });
        },
      );
    } catch (_err) { }
  }
  app.autoAnswer = () =>
    autoAnswer({
      force: true,
      trigger: "manual",
    });
  app.startAutoAnswer = startAutoAnswer;
  app.stopAutoAnswer = stopAutoAnswer;
  app.toggleAutoAnswer = toggleAutoAnswer;
  app.applyAutoAnswerButtonState = applyAutoAnswerButtonState;
  app.maybeAutoAnswer = maybeAutoAnswer;
  app.checkNextBtn = checkNextBtn;
  app.toggleAutoNext = toggleAutoNext;
  app.setSpeedLevel = setSpeedLevel;
  app.getSpeedLevel = getSpeedLevel;
  app.checkActivityBtn = checkActivityBtn;
  app.toggleAutoActivity = toggleAutoActivity;
  app.toggleAutoWrongStop = toggleAutoWrongStop;
  app.applyAutoWrongStopButtonState = applyAutoWrongStopButtonState;
  app.checkIncorrectFeedbackStop = checkIncorrectFeedbackStop;
  function checkActivityBtn() {
    if (app.state.isAutoAnswerRunning) return;
    const now = Date.now();
    const lastClick = Number(app.state.lastAutoActivityClickAt || 0);
    const clickCooldownMs = getTimingProfile().nextClickCooldownMs;
    if (now - lastClick < clickCooldownMs) return;
    if (app.state.isAutoAnswerActive && hasPendingAnswerTargets()) {
      autoAnswer({
        force: true,
        trigger: "auto-next-wait",
        quietIfRunning: true,
        suppressStartLog: true,
        suppressDuplicateLog: true,
        suppressEmptyWarn: true,
        cooldownMs: 250,
      });
      return;
    }
    if (hasSpeakingPlayableInPage()) {
      if (app.state.isAutoActivityActive || app.state.autoActivityInterval) {
        app.logToUI(
          "%c[AUTO-ACTIVITY]%c スピーキング課題を検出したため Auto Activity を停止しました。",
          styles.alert,
          "",
        );
        setAutoActivityEnabled(false, {
          persist: true,
          log: false,
        });
      }
      return;
    }
    const tryClick = (root) => {
      if (!root || typeof root.querySelector !== "function") return false;
      const viewWin =
        root.defaultView ||
        (root.ownerDocument && root.ownerDocument.defaultView) ||
        window;
      for (const target of NEXT_BUTTON_TARGETS) {
        if (!/next activity/i.test(target.name)) continue;
        const buttons = Array.from(root.querySelectorAll(target.selector));
        for (const button of buttons) {
          if (isUnavailableActionButton(button)) continue;
          app.logToUI(
            `%c[AUTO-ACTIVITY]%c ${target.name}ボタンをクリックします...`,
            styles.info,
            "",
          );
          clickWithoutLinkNavigation(button, viewWin);
          app.state.lastAutoActivityClickAt = Date.now();
          app.state.lastAutoCheckButton = null;
          app.state.lastAutoCheckSignature = "";
          app.state.lastAutoCheckAttemptCount = 0;
          app.state.lastAutoCheckAttemptAt = 0;
          queueAutoAnswerAfterAdvance("auto-next");
          return true;
        }
      }
      return false;
    };
    const roots = getAllSearchRoots();
    for (const root of roots) {
      if (tryClick(root)) return;
    }
  }
  function setAutoActivityEnabled(active, options = {}) {
    const { buttonElement = null, persist = true, log = true } = options;
    const next = !!active;
    if (next && hasSpeakingPlayableInPage()) {
      app.state.isAutoActivityActive = false;
      if (app.state.autoActivityInterval)
        clearInterval(app.state.autoActivityInterval);
      app.state.autoActivityInterval = null;
      if (buttonElement) {
        buttonElement.style.backgroundColor = "#6c757d";
        buttonElement.textContent = "Auto Activity: OFF";
      }
      if (log) {
        app.logToUI(
          "%c[AUTO-ACTIVITY]%c スピーキング課題を検出したため Auto Activity を停止しました。",
          styles.alert,
          "",
        );
      }
      if (persist) persistAutoSettings();
      return app.state.isAutoActivityActive;
    }
    app.state.isAutoActivityActive = next;
    if (app.state.isAutoActivityActive) {
      if (buttonElement) {
        buttonElement.style.backgroundColor = "#28a745";
        buttonElement.textContent = "Auto Activity: ON";
      }
      if (app.state.autoActivityInterval)
        clearInterval(app.state.autoActivityInterval);
      app.state.autoActivityInterval = setInterval(
        checkActivityBtn,
        getTimingProfile().nextPollMs,
      );
      checkActivityBtn();
      if (persist) persistAutoSettings();
      return app.state.isAutoActivityActive;
    }
    if (buttonElement) {
      buttonElement.style.backgroundColor = "#6c757d";
      buttonElement.textContent = "Auto Activity: OFF";
    }
    if (app.state.autoActivityInterval)
      clearInterval(app.state.autoActivityInterval);
    app.state.autoActivityInterval = null;
    if (persist) persistAutoSettings();
    return app.state.isAutoActivityActive;
  }
  function toggleAutoActivity(buttonElement) {
    return setAutoActivityEnabled(!app.state.isAutoActivityActive, {
      buttonElement,
      persist: true,
      log: true,
    });
  }
  initManualAdvanceAutoAnswerHook();
  restoreAutoSettings();
})();
