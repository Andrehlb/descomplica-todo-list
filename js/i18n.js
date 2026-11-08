(function () {
  const SUPPORTED_LANGUAGES = Object.freeze(['pt-BR', 'en']);
  const DEFAULT_LANGUAGE = 'pt-BR';
  const LANGUAGE_STORAGE_KEY = 'descomplica-todo:language';
  const LANGUAGE_CHANGED_EVENT = 'language:changed';
  const TRANSLATION_ATTRIBUTE = 'data-i18n';
  const TRANSLATION_SELECTOR = `[${TRANSLATION_ATTRIBUTE}]`;
  const PARAMETER_PATTERN = /\{(\w+)\}/g;

  const dictionaries = {
    'pt-BR': {
      'taskList.completed': 'Concluída',
      'taskList.priority': 'Prioridade',
      'taskList.dueDate': 'Prazo',
      'taskList.completedAt': 'Concluída em',
      'taskList.edit': 'Editar',
      'taskList.delete': 'Excluir',
      'taskList.low': 'Baixa',
      'taskList.medium': 'Média',
      'taskList.high': 'Alta',
    },
    en: {
      'taskList.completed': 'Completed',
      'taskList.priority': 'Priority',
      'taskList.dueDate': 'Due date',
      'taskList.completedAt': 'Completed on',
      'taskList.edit': 'Edit',
      'taskList.delete': 'Delete',
      'taskList.low': 'Low',
      'taskList.medium': 'Medium',
      'taskList.high': 'High',
    },
  };

  function isSupportedLanguage(code) {
    return SUPPORTED_LANGUAGES.includes(code);
  }

  function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  function readStoredLanguage() {
    try {
      return window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function writeStoredLanguage(code) {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      return true;
    } catch {
      return false;
    }
  }

  function getLanguage() {
    const storedLanguage = readStoredLanguage();

    return isSupportedLanguage(storedLanguage)
      ? storedLanguage
      : DEFAULT_LANGUAGE;
  }

  function notifyLanguageChanged(language) {
    window.dispatchEvent(
      new CustomEvent(LANGUAGE_CHANGED_EVENT, { detail: { language } })
    );
  }

  function setLanguage(code) {
    if (!isSupportedLanguage(code)) {
      return false;
    }

    if (!writeStoredLanguage(code)) {
      return false;
    }

    notifyLanguageChanged(code);

    return true;
  }

  function findTranslation(language, key) {
    const dictionary = dictionaries[language];

    return Object.hasOwn(dictionary, key) ? dictionary[key] : null;
  }

  function fillParameters(text, params) {
    if (!isPlainObject(params)) {
      return text;
    }

    return text.replace(PARAMETER_PATTERN, (placeholder, name) =>
      Object.hasOwn(params, name) ? String(params[name]) : placeholder
    );
  }

  function translate(key, params) {
    if (typeof key !== 'string') {
      return '';
    }

    const text =
      findTranslation(getLanguage(), key) ??
      findTranslation(DEFAULT_LANGUAGE, key) ??
      key;

    return fillParameters(text, params);
  }

  function registerTranslations(language, entries) {
    if (!isSupportedLanguage(language) || !isPlainObject(entries)) {
      return false;
    }

    Object.entries(entries).forEach(([key, text]) => {
      if (typeof text === 'string') {
        dictionaries[language][key] = text;
      }
    });

    return true;
  }

  function applyTranslations(root) {
    const scope = root ?? window.document;

    if (!scope || typeof scope.querySelectorAll !== 'function') {
      return 0;
    }

    const elements = Array.from(scope.querySelectorAll(TRANSLATION_SELECTOR));

    elements.forEach((element) => {
      const key = element.getAttribute(TRANSLATION_ATTRIBUTE);

      if (key) {
        element.textContent = translate(key);
      }
    });

    return elements.length;
  }

  window.TaskI18n = {
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE,
    getLanguage,
    setLanguage,
    translate,
    registerTranslations,
    applyTranslations,
  };
})();
