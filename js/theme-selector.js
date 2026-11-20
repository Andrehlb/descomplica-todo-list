(function () {
  const THEMES = Object.freeze([
    'orbit-gravity',
    'sinking-island',
    'celestial-balance',
  ]);
  const DEFAULT_THEME = 'orbit-gravity';
  const THEME_STORAGE_KEY = 'descomplica-todo:theme';
  const THEME_CHANGED_EVENT = 'theme:changed';

  function isSupportedTheme(name) {
    return THEMES.includes(name);
  }

  function readStoredTheme() {
    try {
      return window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function writeStoredTheme(name) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, name);
      return true;
    } catch {
      return false;
    }
  }

  function getTheme() {
    const storedTheme = readStoredTheme();

    return isSupportedTheme(storedTheme) ? storedTheme : DEFAULT_THEME;
  }

  function applyThemeToDocument(name) {
    const rootElement = window.document?.documentElement;

    if (!rootElement || !rootElement.dataset) {
      return false;
    }

    rootElement.dataset.theme = name;

    return true;
  }

  function notifyThemeChanged(theme) {
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGED_EVENT, { detail: { theme } })
    );
  }

  function setTheme(name) {
    if (!isSupportedTheme(name)) {
      return false;
    }

    if (!writeStoredTheme(name)) {
      return false;
    }

    applyThemeToDocument(name);
    notifyThemeChanged(name);

    return true;
  }

  function applyStoredTheme() {
    const theme = getTheme();

    applyThemeToDocument(theme);

    return theme;
  }

  window.TaskThemes = {
    THEMES,
    DEFAULT_THEME,
    getTheme,
    setTheme,
    applyStoredTheme,
  };
})();
