const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const THEME_SELECTOR_MODULE_PATH = path.join(__dirname, 'theme-selector.js');
const THEME_STORAGE_KEY = 'descomplica-todo:theme';

function createFakeLocalStorage(initialValues = {}, shouldThrow = false) {
  const values = { ...initialValues };

  return {
    values,
    getItem(key) {
      if (shouldThrow) {
        throw new Error('storage indisponível');
      }

      return Object.hasOwn(values, key) ? values[key] : null;
    },
    setItem(key, value) {
      if (shouldThrow) {
        throw new Error('storage indisponível');
      }

      values[key] = String(value);
    },
  };
}

function loadThemes({ storedValues, storageThrows, withDocument = true } = {}) {
  const source = fs.readFileSync(THEME_SELECTOR_MODULE_PATH, 'utf8');
  const dispatchedEvents = [];
  const fakeDocument = { documentElement: { dataset: {} } };
  const fakeWindow = {
    localStorage: createFakeLocalStorage(storedValues, storageThrows),
    dispatchEvent(event) {
      dispatchedEvents.push(event);
    },
  };

  if (withDocument) {
    fakeWindow.document = fakeDocument;
  }

  new Function('window', source)(fakeWindow);

  return {
    themes: fakeWindow.TaskThemes,
    fakeWindow,
    fakeDocument,
    dispatchedEvents,
  };
}

describe('constantes', () => {
  it('expõe a lista de temas e o tema padrão', () => {
    const { themes } = loadThemes();

    assert.deepEqual(
      [...themes.THEMES],
      ['orbit-gravity', 'sinking-island', 'celestial-balance']
    );
    assert.equal(themes.DEFAULT_THEME, 'orbit-gravity');
  });
});

describe('getTheme', () => {
  it('devolve o tema padrão quando nada foi salvo', () => {
    const { themes } = loadThemes();

    assert.equal(themes.getTheme(), 'orbit-gravity');
  });

  it('devolve o tema salvo', () => {
    const { themes } = loadThemes({
      storedValues: { [THEME_STORAGE_KEY]: 'sinking-island' },
    });

    assert.equal(themes.getTheme(), 'sinking-island');
  });

  it('devolve o padrão quando o tema salvo é inválido', () => {
    const { themes } = loadThemes({
      storedValues: { [THEME_STORAGE_KEY]: 'tema-antigo' },
    });

    assert.equal(themes.getTheme(), 'orbit-gravity');
  });

  it('devolve o padrão quando o localStorage lança erro', () => {
    const { themes } = loadThemes({ storageThrows: true });

    assert.equal(themes.getTheme(), 'orbit-gravity');
  });
});

describe('setTheme', () => {
  it('troca o tema e devolve true', () => {
    const { themes } = loadThemes();

    assert.equal(themes.setTheme('celestial-balance'), true);
    assert.equal(themes.getTheme(), 'celestial-balance');
  });

  it('persiste o tema no localStorage', () => {
    const { themes, fakeWindow } = loadThemes();

    themes.setTheme('sinking-island');

    assert.equal(fakeWindow.localStorage.values[THEME_STORAGE_KEY], 'sinking-island');
  });

  it('aplica o tema em document.documentElement.dataset.theme', () => {
    const { themes, fakeDocument } = loadThemes();

    themes.setTheme('sinking-island');

    assert.equal(fakeDocument.documentElement.dataset.theme, 'sinking-island');
  });

  it('dispara o evento theme:changed com o tema', () => {
    const { themes, dispatchedEvents } = loadThemes();

    themes.setTheme('celestial-balance');

    assert.equal(dispatchedEvents.length, 1);
    assert.equal(dispatchedEvents[0].type, 'theme:changed');
    assert.deepEqual(dispatchedEvents[0].detail, { theme: 'celestial-balance' });
  });

  it('devolve false e não altera nada com tema inválido', () => {
    const { themes, fakeWindow, fakeDocument, dispatchedEvents } = loadThemes();

    [undefined, null, 7, '', 'dark', 'Orbit-Gravity', {}].forEach((invalidName) => {
      assert.equal(themes.setTheme(invalidName), false);
    });

    assert.deepEqual(fakeWindow.localStorage.values, {});
    assert.equal(fakeDocument.documentElement.dataset.theme, undefined);
    assert.equal(dispatchedEvents.length, 0);
    assert.equal(themes.getTheme(), 'orbit-gravity');
  });

  it('devolve false sem quebrar nem disparar evento se o localStorage lançar erro', () => {
    const { themes, fakeDocument, dispatchedEvents } = loadThemes({
      storageThrows: true,
    });

    assert.equal(themes.setTheme('sinking-island'), false);
    assert.equal(fakeDocument.documentElement.dataset.theme, undefined);
    assert.equal(dispatchedEvents.length, 0);
  });

  it('funciona sem document, salvando e avisando por evento', () => {
    const { themes, fakeWindow, dispatchedEvents } = loadThemes({
      withDocument: false,
    });

    assert.equal(themes.setTheme('sinking-island'), true);
    assert.equal(fakeWindow.localStorage.values[THEME_STORAGE_KEY], 'sinking-island');
    assert.equal(dispatchedEvents.length, 1);
  });
});

describe('applyStoredTheme', () => {
  it('aplica o tema salvo no documento e devolve o tema', () => {
    const { themes, fakeDocument } = loadThemes({
      storedValues: { [THEME_STORAGE_KEY]: 'celestial-balance' },
    });

    assert.equal(themes.applyStoredTheme(), 'celestial-balance');
    assert.equal(fakeDocument.documentElement.dataset.theme, 'celestial-balance');
  });

  it('aplica o tema padrão quando nada foi salvo', () => {
    const { themes, fakeDocument } = loadThemes();

    themes.applyStoredTheme();

    assert.equal(fakeDocument.documentElement.dataset.theme, 'orbit-gravity');
  });

  it('não dispara evento ao aplicar o tema salvo', () => {
    const { themes, dispatchedEvents } = loadThemes();

    themes.applyStoredTheme();

    assert.equal(dispatchedEvents.length, 0);
  });

  it('aplica o padrão quando o localStorage lança erro', () => {
    const { themes, fakeDocument } = loadThemes({ storageThrows: true });

    assert.equal(themes.applyStoredTheme(), 'orbit-gravity');
    assert.equal(fakeDocument.documentElement.dataset.theme, 'orbit-gravity');
  });

  it('não quebra quando não existe document', () => {
    const { themes } = loadThemes({ withDocument: false });

    assert.equal(themes.applyStoredTheme(), 'orbit-gravity');
  });
});
