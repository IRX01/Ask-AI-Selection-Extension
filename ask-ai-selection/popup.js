const languageInputs = document.querySelectorAll('input[name="language"]');
const modelInputs = document.querySelectorAll('input[name="model"]');
const actionInputs = document.querySelectorAll('input[name="action"]');
const customPromptInput = document.getElementById("customPrompt");
const settingsPreview = document.getElementById("settingsPreview");
const statusText = document.getElementById("statusText");

const DEFAULT_SETTINGS = {
  language: "ru",
  model: "chatgpt",
  actions: {
    custom: true,
    translate: true,
    explain: true,
    rewrite: true
  },
  customPrompt: "Объясни этот текст простыми словами."
};

const translations = {
  ru: {
    appTitle: "Ask AI",
    appSubtitle: "Настройки меню выделенного текста",

    languageTitle: "Язык интерфейса",
    languageDescription: "Меняет названия кнопок и стандартные промпты",
    languageRu: "Русский",
    languageEn: "English",

    modelTitle: "Модель",
    modelDescription: "Куда открывать готовый промпт",

    actionsTitle: "Кнопки в меню",
    actionsDescription: "Выбери, какие действия показывать после выделения текста",

    actionCustom: "Кастомный промпт",
    actionTranslate: "Перевести",
    actionExplain: "Объяснить",
    actionRewrite: "Перефразировать",

    customPromptTitle: "Кастомный промпт",
    customPromptDescription: "Будет использоваться для кнопки “Кастомный промпт”",
    customPromptPlaceholder: "Например: объясни этот текст как для начинающего программиста",

    previewTitle: "Текущие настройки",

    statusDefault: "Настройки сохранены",
    statusNoActions: "Лучше оставить хотя бы одну кнопку, а то меню будет пустым",
    statusEmptyCustomPrompt: "Кастомный промпт пустой",

    previewLanguage: "Русский",
    previewButtonsEnabled: "включено кнопок"
  },

  en: {
    appTitle: "Ask AI",
    appSubtitle: "Selected text menu settings",

    languageTitle: "Interface language",
    languageDescription: "Changes action names and default prompts",
    languageRu: "Русский",
    languageEn: "English",

    modelTitle: "Model",
    modelDescription: "Where to open the prepared prompt",

    actionsTitle: "Menu buttons",
    actionsDescription: "Choose which actions to show after selecting text",

    actionCustom: "Custom prompt",
    actionTranslate: "Translate",
    actionExplain: "Explain",
    actionRewrite: "Rewrite",

    customPromptTitle: "Custom prompt",
    customPromptDescription: "Used for the “Custom prompt” button",
    customPromptPlaceholder: "Example: explain this text like I am a beginner programmer",

    previewTitle: "Current settings",

    statusDefault: "Settings saved",
    statusNoActions: "Keep at least one button, otherwise the menu will be empty",
    statusEmptyCustomPrompt: "Custom prompt is empty",

    previewLanguage: "English",
    previewButtonsEnabled: "buttons enabled"
  }
};

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

function getSelectedValue(inputName) {
  const checkedInput = document.querySelector(`input[name="${inputName}"]:checked`);
  return checkedInput.value;
}

function getEnabledActionsCount() {
  let count = 0;

  actionInputs.forEach(function (input) {
    if (input.checked) {
      count += 1;
    }
  });

  return count;
}

function getSettingsFromForm() {
  const actions = {};

  actionInputs.forEach(function (input) {
    actions[input.value] = input.checked;
  });

  return {
    language: getSelectedValue("language"),
    model: getSelectedValue("model"),
    actions: actions,
    customPrompt: customPromptInput.value
  };
}

function applySettingsToForm(settings) {
  languageInputs.forEach(function (input) {
    input.checked = input.value === settings.language;
  });

  modelInputs.forEach(function (input) {
    input.checked = input.value === settings.model;
  });

  actionInputs.forEach(function (input) {
    input.checked = Boolean(settings.actions[input.value]);
  });

  customPromptInput.value = settings.customPrompt;
}

function applyLanguage(language) {
  const dictionary = translations[language];

  const textElements = document.querySelectorAll("[data-i18n]");

  textElements.forEach(function (element) {
    const key = element.dataset.i18n;
    element.textContent = dictionary[key];
  });

  const placeholderElements = document.querySelectorAll("[data-i18n-placeholder]");

  placeholderElements.forEach(function (element) {
    const key = element.dataset.i18nPlaceholder;
    element.placeholder = dictionary[key];
  });

  document.documentElement.lang = language;
}

function updatePreview() {
  const settings = getSettingsFromForm();
  const dictionary = translations[settings.language];

  applyLanguage(settings.language);

  const enabledActionsCount = getEnabledActionsCount();
  const modelLabel = settings.model === "chatgpt" ? "ChatGPT" : "Gemini";

  settingsPreview.textContent =
    `${dictionary.previewLanguage} · ${modelLabel} · ${dictionary.previewButtonsEnabled}: ${enabledActionsCount}`;

  if (enabledActionsCount === 0) {
    statusText.textContent = dictionary.statusNoActions;
    return;
  }

  if (settings.actions.custom && settings.customPrompt.trim() === "") {
    statusText.textContent = dictionary.statusEmptyCustomPrompt;
    return;
  }

  statusText.textContent = dictionary.statusDefault;
}

function saveSettings() {
  const settings = getSettingsFromForm();

  chrome.storage.local.set(settings, function () {
    updatePreview();
  });
}

function loadSettings() {
  chrome.storage.local.get(DEFAULT_SETTINGS, function (savedSettings) {
    const settings = normalizeSettings(savedSettings);

    applySettingsToForm(settings);
    updatePreview();
  });
}

languageInputs.forEach(function (input) {
  input.addEventListener("change", saveSettings);
});

modelInputs.forEach(function (input) {
  input.addEventListener("change", saveSettings);
});

actionInputs.forEach(function (input) {
  input.addEventListener("change", saveSettings);
});

customPromptInput.addEventListener("input", saveSettings);

loadSettings();