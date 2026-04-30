let aiMenu = null;
let selectedText = "";
if (window.location.hostname === "gemini.google.com") {
  tryInsertPendingGeminiPrompt();
}

const DEFAULT_SETTINGS = {
  language: "ru",
  model: "chatgpt",
  actions: {
    custom: true,
    translate: true,
    explain: true,
    rewrite: true
  },
  customPrompt: "Here you can write your own custom prompt"
};

document.addEventListener("mouseup", function () {

    if (isBlockedSite()) {
    return;
  }
    if (isEditableElement(document.activeElement)) {
    return;
  }

  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (!text) 
    {
      removeMenu();
      return;
    }

    selectedText = text;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    getSettings(function (settings) 
    {
      if (getEnabledActionsCount(settings) === 0) {
        removeMenu();
        return;
      }

      showActionMenu(rect, settings);
    });
  }, 10);
});

document.addEventListener("mousedown", function (event) {
  if (aiMenu && !aiMenu.contains(event.target)) {
    removeMenu();
  }
});

window.addEventListener("scroll", function () {
  removeMenu();
});

function getSettings(callback) {
  chrome.storage.local.get(DEFAULT_SETTINGS, function (savedSettings) {
    const settings = normalizeSettings(savedSettings);
    callback(settings);
  });
}

function normalizeSettings(savedSettings) {
  return {
    language: savedSettings.language || DEFAULT_SETTINGS.language,
    model: savedSettings.model || DEFAULT_SETTINGS.model,
    actions: {
      ...DEFAULT_SETTINGS.actions,
      ...(savedSettings.actions || {})
    },
    customPrompt: savedSettings.customPrompt ?? DEFAULT_SETTINGS.customPrompt
  };
}

function getEnabledActionsCount(settings) {
  let count = 0;

  Object.values(settings.actions).forEach(function (isEnabled) {
    if (isEnabled) {
      count += 1;
    }
  });

  return count;
}

function showActionMenu(rect, settings) {
  removeMenu();

  aiMenu = document.createElement("div");

  aiMenu.style.position = "absolute";
  aiMenu.style.zIndex = "999999";
  aiMenu.style.minWidth = "190px";
  aiMenu.style.padding = "8px";
  aiMenu.style.borderRadius = "16px";
  aiMenu.style.background = "#111827";
  aiMenu.style.color = "white";
  aiMenu.style.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.35)";
  aiMenu.style.fontFamily = "Arial, sans-serif";
  aiMenu.style.border = "1px solid rgba(255, 255, 255, 0.12)";

  const title = document.createElement("div");
  title.textContent = "Ask AI";
  title.style.padding = "6px 8px 8px";
  title.style.fontSize = "13px";
  title.style.fontWeight = "700";
  title.style.color = "#d1d5db";

  aiMenu.appendChild(title);

  addActionButtonIfEnabled("custom", settings);
  addActionButtonIfEnabled("translate", settings);
  addActionButtonIfEnabled("explain", settings);
  addActionButtonIfEnabled("rewrite", settings);

  aiMenu.addEventListener("mousedown", function (event) {
    event.preventDefault();
    event.stopPropagation();
  });

  document.body.appendChild(aiMenu);

  placeMenuNearSelection(rect);
}

function addActionButtonIfEnabled(action, settings) {
  if (!settings.actions[action]) {
    return;
  }

  const button = createMenuButton(getActionLabel(action, settings.language));

  button.addEventListener("click", function () {
    handleAction(action, settings);
  });

  aiMenu.appendChild(button);
}

function createMenuButton(text) {
  const button = document.createElement("button");

  button.textContent = text;
  button.style.width = "100%";
  button.style.display = "block";
  button.style.padding = "10px 12px";
  button.style.margin = "2px 0";
  button.style.border = "none";
  button.style.borderRadius = "10px";
  button.style.background = "transparent";
  button.style.color = "white";
  button.style.fontSize = "14px";
  button.style.textAlign = "left";
  button.style.cursor = "pointer";

  button.addEventListener("mouseenter", function () {
    button.style.background = "rgba(255, 255, 255, 0.12)";
  });

  button.addEventListener("mouseleave", function () {
    button.style.background = "transparent";
  });

  return button;
}

function placeMenuNearSelection(rect) {
  const menuRect = aiMenu.getBoundingClientRect();

  const gap = 8;
  const pagePadding = 12;

  let left = rect.left + window.scrollX;
  let top = rect.bottom + window.scrollY + gap;

  const viewportBottom = window.innerHeight;
  const spaceBelow = viewportBottom - rect.bottom;
  const spaceAbove = rect.top;

  if (spaceBelow < menuRect.height + gap && spaceAbove > menuRect.height + gap) {
    top = rect.top + window.scrollY - menuRect.height - gap;
  }

  const viewportRight = window.innerWidth;
  const menuRight = rect.left + menuRect.width;

  if (menuRight > viewportRight - pagePadding) {
    left = window.scrollX + viewportRight - menuRect.width - pagePadding;
  }

  if (left < window.scrollX + pagePadding) {
    left = window.scrollX + pagePadding;
  }

  aiMenu.style.left = `${left}px`;
  aiMenu.style.top = `${top}px`;
}

function getActionLabel(action, language) {
  const labels = {
    ru: {
      custom: "Кастомный промпт",
      translate: "Перевести",
      explain: "Объяснить",
      rewrite: "Перефразировать"
    },
    en: {
      custom: "Custom prompt",
      translate: "Translate",
      explain: "Explain",
      rewrite: "Rewrite"
    }
  };

  return labels[language][action];
}

function handleAction(action, settings) {
  const prompt = buildPrompt(action, selectedText, settings);
  openModel(prompt, settings.model);
  removeMenu();
}

function buildPrompt(action, text, settings) {
  if (action === "custom") {
    return `${settings.customPrompt}\n\nText:\n${text}`;
  }

  if (settings.language === "ru") {
    if (action === "translate") {
      return `Переведи этот текст на русский язык:\n\n${text}`;
    }

    if (action === "explain") {
      return `Объясни этот текст простыми словами:\n\n${text}`;
    }

    if (action === "rewrite") {
      return `Перефразируй этот текст, сохранив смысл:\n\n${text}`;
    }
  }

  if (settings.language === "en") {
    if (action === "translate") {
      return `Translate this text into English:\n\n${text}`;
    }

    if (action === "explain") {
      return `Explain this text in simple words:\n\n${text}`;
    }

    if (action === "rewrite") {
      return `Rewrite this text while keeping the original meaning:\n\n${text}`;
    }
  }

  return text;
}

function openModel(prompt, model) {
  const encodedPrompt = encodeURIComponent(prompt);

  if (model === "chatgpt") {
    window.open(`https://chatgpt.com/?q=${encodedPrompt}`, "_blank");
    return;
  }

  if (model === "gemini") {
    chrome.storage.local.set(
      {
        pendingGeminiPrompt: prompt,
        pendingGeminiPromptCreatedAt: Date.now()
      },
      function () {
        window.open("https://gemini.google.com/app", "_blank");
      }
    );

    return;
  }
}

function removeMenu() {
  if (aiMenu) {
    aiMenu.remove();
    aiMenu = null;
  }
}

function tryInsertPendingGeminiPrompt() {
  chrome.storage.local.get(
    ["pendingGeminiPrompt", "pendingGeminiPromptCreatedAt"],
    function (data) {
      const prompt = data.pendingGeminiPrompt;
      const createdAt = data.pendingGeminiPromptCreatedAt;

      if (!prompt) {
        return;
      }

      const maxPromptAge = 60 * 1000;
      const isPromptTooOld = createdAt && Date.now() - createdAt > maxPromptAge;

      if (isPromptTooOld) {
        clearPendingGeminiPrompt();
        return;
      }

      waitForGeminiInput(function (inputElement) {
        insertTextIntoGeminiInput(inputElement, prompt);
        clearPendingGeminiPrompt();
      });
    }
  );
}

function waitForGeminiInput(callback) {
  let attempts = 0;
  const maxAttempts = 40;

  const intervalId = setInterval(function () {
    attempts += 1;

    const inputElement = findGeminiInput();

    if (inputElement) {
      clearInterval(intervalId);
      callback(inputElement);
      return;
    }

    if (attempts >= maxAttempts) {
      clearInterval(intervalId);
      console.warn("Gemini input was not found.");
    }
  }, 250);
}

function findGeminiInput() {
  const selectors = [
    'div[contenteditable="true"]',
    'textarea',
    '[role="textbox"]'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);

    if (element) {
      return element;
    }
  }

  return null;
}

function insertTextIntoGeminiInput(inputElement, text) {
  inputElement.focus();

  if (inputElement.tagName.toLowerCase() === "textarea") {
    inputElement.value = text;

    inputElement.dispatchEvent(
      new Event("input", {
        bubbles: true
      })
    );

    return;
  }

  inputElement.textContent = text;

  inputElement.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: text
    })
  );
}

function clearPendingGeminiPrompt() {
  chrome.storage.local.remove([
    "pendingGeminiPrompt",
    "pendingGeminiPromptCreatedAt"
  ]);
}

function isBlockedSite() {
  const blockedHosts = [
    "gemini.google.com",
    "chatgpt.com"
  ];

  return blockedHosts.includes(window.location.hostname);
}


function isEditableElement(element) {
  if (!element) {
    return false;
  }

  const tagName = element.tagName.toLowerCase();

  if (tagName === "input") {
    return true;
  }

  if (tagName === "textarea") {
    return true;
  }

  if (element.isContentEditable) {
    return true;
  }

  return false;
}