const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const I18N_MODULE_PATH = path.join(__dirname, 'i18n.js');
const LANGUAGE_STORAGE_KEY = 'descomplica-todo:language';

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

function createFakeElement(key) {
  return {
    textContent: '',
    getAttribute(name) {
      return name === 'data-i18n' ? key : null;
    },
  };
}

function loadI18n({ storedValues, storageThrows } = {}) {
  const source = fs.readFileSync(I18N_MODULE_PATH, 'utf8');
  const dispatchedEvents = [];
  const fakeWindow = {
    localStorage: createFakeLocalStorage(storedValues, storageThrows),
    dispatchEvent(event) {
      dispatchedEvents.push(event);
    },
  };

  new Function('window', source)(fakeWindow);

  return { i18n: fakeWindow.TaskI18n, fakeWindow, dispatchedEvents };
}

describe('constantes', () => {
  it('expõe os idiomas suportados e o idioma padrão', () => {
    const { i18n } = loadI18n();

    assert.deepEqual([...i18n.SUPPORTED_LANGUAGES], ['pt-BR', 'en']);
    assert.equal(i18n.DEFAULT_LANGUAGE, 'pt-BR');
  });
});

describe('getLanguage', () => {
  it('devolve o idioma padrão quando nada foi salvo', () => {
    const { i18n } = loadI18n();

    assert.equal(i18n.getLanguage(), 'pt-BR');
  });

  it('devolve o idioma salvo', () => {
    const { i18n } = loadI18n({ storedValues: { [LANGUAGE_STORAGE_KEY]: 'en' } });

    assert.equal(i18n.getLanguage(), 'en');
  });

  it('devolve o padrão quando o idioma salvo é inválido', () => {
    const { i18n } = loadI18n({ storedValues: { [LANGUAGE_STORAGE_KEY]: 'fr' } });

    assert.equal(i18n.getLanguage(), 'pt-BR');
  });

  it('devolve o padrão quando o localStorage lança erro', () => {
    const { i18n } = loadI18n({ storageThrows: true });

    assert.equal(i18n.getLanguage(), 'pt-BR');
  });
});

describe('setLanguage', () => {
  it('troca o idioma e devolve true', () => {
    const { i18n } = loadI18n();

    assert.equal(i18n.setLanguage('en'), true);
    assert.equal(i18n.getLanguage(), 'en');
  });

  it('persiste o idioma no localStorage', () => {
    const { i18n, fakeWindow } = loadI18n();

    i18n.setLanguage('en');

    assert.equal(fakeWindow.localStorage.values[LANGUAGE_STORAGE_KEY], 'en');
  });

  it('dispara o evento language:changed com o idioma', () => {
    const { i18n, dispatchedEvents } = loadI18n();

    i18n.setLanguage('en');

    assert.equal(dispatchedEvents.length, 1);
    assert.equal(dispatchedEvents[0].type, 'language:changed');
    assert.deepEqual(dispatchedEvents[0].detail, { language: 'en' });
  });

  it('devolve false e não altera nada com idioma inválido', () => {
    const { i18n, fakeWindow, dispatchedEvents } = loadI18n();

    [undefined, null, 42, '', 'fr', 'EN', {}].forEach((invalidCode) => {
      assert.equal(i18n.setLanguage(invalidCode), false);
    });

    assert.deepEqual(fakeWindow.localStorage.values, {});
    assert.equal(dispatchedEvents.length, 0);
    assert.equal(i18n.getLanguage(), 'pt-BR');
  });

  it('devolve false sem quebrar nem disparar evento se o localStorage lançar erro', () => {
    const { i18n, dispatchedEvents } = loadI18n({ storageThrows: true });

    assert.equal(i18n.setLanguage('en'), false);
    assert.equal(dispatchedEvents.length, 0);
  });
});

describe('translate', () => {
  it('traduz no idioma padrão', () => {
    const { i18n } = loadI18n();

    assert.equal(i18n.translate('taskList.completed'), 'Concluída');
  });

  it('traduz no idioma atual depois da troca', () => {
    const { i18n } = loadI18n();

    i18n.setLanguage('en');

    assert.equal(i18n.translate('taskList.completed'), 'Completed');
  });

  it('usa pt-BR quando falta a chave no idioma atual', () => {
    const { i18n } = loadI18n();

    i18n.registerTranslations('pt-BR', { 'extra.onlyPortuguese': 'Só em português' });
    i18n.setLanguage('en');

    assert.equal(i18n.translate('extra.onlyPortuguese'), 'Só em português');
  });

  it('devolve a própria chave quando falta nos dois idiomas', () => {
    const { i18n } = loadI18n();

    assert.equal(i18n.translate('chave.inexistente'), 'chave.inexistente');
  });

  it('não confunde chaves do protótipo com traduções', () => {
    const { i18n } = loadI18n();

    assert.equal(i18n.translate('constructor'), 'constructor');
    assert.equal(i18n.translate('toString'), 'toString');
  });

  it('devolve texto vazio quando a chave não é string', () => {
    const { i18n } = loadI18n();

    assert.equal(i18n.translate(undefined), '');
    assert.equal(i18n.translate(null), '');
    assert.equal(i18n.translate(42), '');
  });

  it('substitui parâmetros no formato {nome}', () => {
    const { i18n } = loadI18n();

    i18n.registerTranslations('pt-BR', {
      'greeting.hello': 'Olá, {nome}! Você tem {total} tarefas.',
    });

    assert.equal(
      i18n.translate('greeting.hello', { nome: 'Paula', total: 3 }),
      'Olá, Paula! Você tem 3 tarefas.'
    );
  });

  it('mantém o marcador quando o parâmetro não foi informado', () => {
    const { i18n } = loadI18n();

    i18n.registerTranslations('pt-BR', { 'greeting.hello': 'Olá, {nome}!' });

    assert.equal(i18n.translate('greeting.hello', {}), 'Olá, {nome}!');
    assert.equal(i18n.translate('greeting.hello'), 'Olá, {nome}!');
    assert.equal(i18n.translate('greeting.hello', null), 'Olá, {nome}!');
  });

  it('devolve a tradução quando o localStorage lança erro', () => {
    const { i18n } = loadI18n({ storageThrows: true });

    assert.equal(i18n.translate('taskList.edit'), 'Editar');
  });
});

describe('textos da listagem registrados', () => {
  it('tem todos os textos em pt-BR', () => {
    const { i18n } = loadI18n();
    const expectedTexts = {
      'taskList.completed': 'Concluída',
      'taskList.priority': 'Prioridade',
      'taskList.dueDate': 'Prazo',
      'taskList.completedAt': 'Concluída em',
      'taskList.edit': 'Editar',
      'taskList.delete': 'Excluir',
      'taskList.low': 'Baixa',
      'taskList.medium': 'Média',
      'taskList.high': 'Alta',
    };

    Object.entries(expectedTexts).forEach(([key, text]) => {
      assert.equal(i18n.translate(key), text);
    });
  });

  it('tem todos os textos em inglês', () => {
    const { i18n } = loadI18n({ storedValues: { [LANGUAGE_STORAGE_KEY]: 'en' } });
    const expectedTexts = {
      'taskList.completed': 'Completed',
      'taskList.priority': 'Priority',
      'taskList.dueDate': 'Due date',
      'taskList.completedAt': 'Completed on',
      'taskList.edit': 'Edit',
      'taskList.delete': 'Delete',
      'taskList.low': 'Low',
      'taskList.medium': 'Medium',
      'taskList.high': 'High',
    };

    Object.entries(expectedTexts).forEach(([key, text]) => {
      assert.equal(i18n.translate(key), text);
    });
  });
});

describe('registerTranslations', () => {
  it('registra textos novos e devolve true', () => {
    const { i18n } = loadI18n();

    assert.equal(
      i18n.registerTranslations('en', { 'filters.search': 'Search' }),
      true
    );

    i18n.setLanguage('en');

    assert.equal(i18n.translate('filters.search'), 'Search');
  });

  it('permite sobrescrever um texto existente', () => {
    const { i18n } = loadI18n();

    i18n.registerTranslations('pt-BR', { 'taskList.edit': 'Alterar' });

    assert.equal(i18n.translate('taskList.edit'), 'Alterar');
  });

  it('rejeita idioma inválido e entradas que não são objeto', () => {
    const { i18n } = loadI18n();

    assert.equal(i18n.registerTranslations('fr', { a: 'b' }), false);
    assert.equal(i18n.registerTranslations('en', null), false);
    assert.equal(i18n.registerTranslations('en', undefined), false);
    assert.equal(i18n.registerTranslations('en', 'texto'), false);
    assert.equal(i18n.registerTranslations('en', ['a']), false);
  });

  it('ignora valores que não são texto', () => {
    const { i18n } = loadI18n();

    i18n.registerTranslations('pt-BR', { 'bad.number': 42, 'good.text': 'ok' });

    assert.equal(i18n.translate('bad.number'), 'bad.number');
    assert.equal(i18n.translate('good.text'), 'ok');
  });
});

describe('applyTranslations', () => {
  it('define o textContent dos elementos com data-i18n', () => {
    const { i18n } = loadI18n();
    const completedElement = createFakeElement('taskList.completed');
    const editElement = createFakeElement('taskList.edit');
    const fakeRoot = {
      querySelectorAll(selector) {
        assert.equal(selector, '[data-i18n]');
        return [completedElement, editElement];
      },
    };

    const translatedCount = i18n.applyTranslations(fakeRoot);

    assert.equal(translatedCount, 2);
    assert.equal(completedElement.textContent, 'Concluída');
    assert.equal(editElement.textContent, 'Editar');
  });

  it('usa o idioma atual', () => {
    const { i18n } = loadI18n();
    const element = createFakeElement('taskList.delete');
    const fakeRoot = { querySelectorAll: () => [element] };

    i18n.setLanguage('en');
    i18n.applyTranslations(fakeRoot);

    assert.equal(element.textContent, 'Delete');
  });

  it('usa document da janela quando nenhuma raiz é informada', () => {
    const { i18n, fakeWindow } = loadI18n();
    const element = createFakeElement('taskList.priority');
    fakeWindow.document = { querySelectorAll: () => [element] };

    i18n.applyTranslations();

    assert.equal(element.textContent, 'Prioridade');
  });

  it('mostra a própria chave quando não há tradução', () => {
    const { i18n } = loadI18n();
    const element = createFakeElement('chave.inexistente');

    i18n.applyTranslations({ querySelectorAll: () => [element] });

    assert.equal(element.textContent, 'chave.inexistente');
  });

  it('não quebra sem raiz válida nem document', () => {
    const { i18n } = loadI18n();

    assert.equal(i18n.applyTranslations(), 0);
    assert.equal(i18n.applyTranslations(null), 0);
    assert.equal(i18n.applyTranslations({}), 0);
    assert.equal(i18n.applyTranslations('texto'), 0);
  });

  it('ignora elementos com data-i18n vazio', () => {
    const { i18n } = loadI18n();
    const element = createFakeElement('');
    element.textContent = 'original';

    i18n.applyTranslations({ querySelectorAll: () => [element] });

    assert.equal(element.textContent, 'original');
  });
});
