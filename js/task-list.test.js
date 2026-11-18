const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const TASK_LIST_MODULE_PATH = path.join(__dirname, 'task-list.js');
const TASK_LIST_SOURCE = fs.readFileSync(TASK_LIST_MODULE_PATH, 'utf8');
const COMPLETED_CARD_CLASS = 'task-card--completed';
const TOGGLE_COMPLETION_ACTION = 'toggle-complete';

const OLDER_TASK = Object.freeze({
  id: 1,
  title: 'Estudar JavaScript',
  description: 'Revisar funções',
  completed: false,
  completedAt: null,
  priority: 'high',
  dueDate: '2026-11-02',
  createdAt: '2026-10-01T10:00:00.000Z',
});

const NEWER_TASK = Object.freeze({
  id: 2,
  title: 'Revisar testes',
  description: null,
  completed: true,
  completedAt: '2026-11-03T15:00:00.000Z',
  priority: 'low',
  dueDate: null,
  createdAt: '2026-11-01T10:00:00.000Z',
});

function loadTaskList() {
  const fakeWindow = {};

  new Function('window', TASK_LIST_SOURCE)(fakeWindow);

  return fakeWindow.TaskList;
}

function createFakeElement(tagName) {
  const classNames = new Set();

  const element = {
    tagName: tagName.toUpperCase(),
    children: [],
    dataset: {},
    listeners: {},
    textContent: '',
    hidden: false,
    get className() {
      return [...classNames].join(' ');
    },
    set className(value) {
      classNames.clear();
      value.split(' ').filter(Boolean).forEach((name) => classNames.add(name));
    },
    classList: {
      toggle: (name, shouldAdd) =>
        shouldAdd ? classNames.add(name) : classNames.delete(name),
      contains: (name) => classNames.has(name),
    },
    append: (...nodes) => element.children.push(...nodes),
    replaceChildren: (...nodes) => {
      element.children = nodes;
    },
    addEventListener: (type, listener) => {
      element.listeners[type] = listener;
    },
  };

  return element;
}

function findDescendants(element, predicate) {
  return element.children.flatMap((child) => [
    ...(predicate(child) ? [child] : []),
    ...findDescendants(child, predicate),
  ]);
}

function createPageEnvironment({ tasks = [], acceptsUpdates = true } = {}) {
  const list = createFakeElement('ul');
  const emptyMessage = createFakeElement('p');
  const elementsById = { 'tasks-list': list, 'tasks-empty': emptyMessage };
  const state = { tasks, readCount: 0, updates: [], subscribers: [] };

  const fakeWindow = {
    document: {
      readyState: 'complete',
      getElementById: (id) => elementsById[id] ?? null,
      createElement: createFakeElement,
    },
    TaskStorage: {
      getTasks: () => {
        state.readCount += 1;
        return state.tasks;
      },
      updateTask: (id, changes) => {
        state.updates.push({ id, changes });
        return acceptsUpdates ? { id, ...changes } : null;
      },
    },
    TaskEvents: {
      subscribe: (callback) => state.subscribers.push(callback),
    },
  };

  new Function('window', TASK_LIST_SOURCE)(fakeWindow);

  return { list, emptyMessage, state };
}

function getCardIds(list) {
  return list.children.map((card) => card.dataset.taskId);
}

function findCard(list, taskId) {
  return list.children.find((card) => card.dataset.taskId === taskId);
}

function createCompletionChange(taskId, checked) {
  return {
    target: {
      dataset: { action: TOGGLE_COMPLETION_ACTION, taskId: String(taskId) },
      checked,
    },
  };
}

const taskList = loadTaskList();

describe('sortTasksByNewest', () => {
  it('ordena da tarefa mais recente para a mais antiga', () => {
    const oldest = { id: 1, createdAt: '2026-10-01T10:00:00.000Z' };
    const middle = { id: 2, createdAt: '2026-10-15T10:00:00.000Z' };
    const newest = { id: 3, createdAt: '2026-11-01T10:00:00.000Z' };

    const sortedTasks = taskList.sortTasksByNewest([middle, oldest, newest]);

    assert.deepEqual(sortedTasks, [newest, middle, oldest]);
  });

  it('não altera a lista original', () => {
    const tasks = [
      { id: 1, createdAt: '2026-10-01T10:00:00.000Z' },
      { id: 2, createdAt: '2026-11-01T10:00:00.000Z' },
    ];

    taskList.sortTasksByNewest(tasks);

    assert.deepEqual(
      tasks.map((task) => task.id),
      [1, 2]
    );
  });

  it('devolve lista vazia quando não há tarefas', () => {
    assert.deepEqual(taskList.sortTasksByNewest([]), []);
  });
});

describe('parseTaskId', () => {
  it('converte texto de número inteiro positivo em número', () => {
    assert.equal(taskList.parseTaskId('1'), 1);
    assert.equal(taskList.parseTaskId('42'), 42);
    assert.equal(taskList.parseTaskId(7), 7);
  });

  it('devolve null para valores que não são inteiros positivos', () => {
    assert.equal(taskList.parseTaskId(''), null);
    assert.equal(taskList.parseTaskId('0'), null);
    assert.equal(taskList.parseTaskId('-3'), null);
    assert.equal(taskList.parseTaskId('2.5'), null);
    assert.equal(taskList.parseTaskId('abc'), null);
    assert.equal(taskList.parseTaskId('1e3'), null);
    assert.equal(taskList.parseTaskId(undefined), null);
    assert.equal(taskList.parseTaskId(null), null);
  });

  it('devolve null para número grande demais para ser exato', () => {
    assert.equal(taskList.parseTaskId('9007199254740993'), null);
  });
});

describe('getPriorityLabel', () => {
  it('traduz cada prioridade para o texto exibido', () => {
    assert.equal(taskList.getPriorityLabel('low'), 'Baixa');
    assert.equal(taskList.getPriorityLabel('medium'), 'Média');
    assert.equal(taskList.getPriorityLabel('high'), 'Alta');
  });

  it('devolve texto vazio para prioridade desconhecida', () => {
    assert.equal(taskList.getPriorityLabel('urgent'), '');
    assert.equal(taskList.getPriorityLabel(undefined), '');
  });
});

describe('formatDueDate', () => {
  it('converte AAAA-MM-DD para DD/MM/AAAA', () => {
    assert.equal(taskList.formatDueDate('2026-11-02'), '02/11/2026');
  });

  it('devolve texto vazio quando não há prazo', () => {
    assert.equal(taskList.formatDueDate(null), '');
    assert.equal(taskList.formatDueDate(undefined), '');
  });

  it('devolve texto vazio para formato inválido', () => {
    assert.equal(taskList.formatDueDate('02/11/2026'), '');
    assert.equal(taskList.formatDueDate(''), '');
  });
});

describe('formatCompletedAt', () => {
  it('formata a data de conclusão como DD/MM/AAAA', () => {
    const formattedDate = taskList.formatCompletedAt(
      '2026-11-02T15:00:00.000Z'
    );

    assert.match(formattedDate, /^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('devolve texto vazio quando a tarefa não foi concluída', () => {
    assert.equal(taskList.formatCompletedAt(null), '');
  });

  it('devolve texto vazio para data inválida', () => {
    assert.equal(taskList.formatCompletedAt('data inválida'), '');
  });
});

describe('renderização da lista', () => {
  it('mostra um card por tarefa, da mais recente para a mais antiga', () => {
    const { list } = createPageEnvironment({ tasks: [OLDER_TASK, NEWER_TASK] });

    assert.deepEqual(getCardIds(list), [NEWER_TASK.id, OLDER_TASK.id]);
  });

  it('mostra a mensagem de lista vazia quando não há tarefas', () => {
    const { list, emptyMessage } = createPageEnvironment();

    assert.equal(list.children.length, 0);
    assert.equal(emptyMessage.hidden, false);
  });

  it('esconde a mensagem de lista vazia quando há tarefas', () => {
    const { emptyMessage } = createPageEnvironment({ tasks: [OLDER_TASK] });

    assert.equal(emptyMessage.hidden, true);
  });

  it('mostra título, descrição, prioridade e prazo da tarefa', () => {
    const { list } = createPageEnvironment({ tasks: [OLDER_TASK] });
    const card = findCard(list, OLDER_TASK.id);
    const texts = findDescendants(card, () => true).map(
      (element) => element.textContent
    );

    assert.ok(texts.includes(OLDER_TASK.title));
    assert.ok(texts.includes(OLDER_TASK.description));
    assert.ok(texts.includes('Prioridade: Alta · Prazo: 02/11/2026'));
  });

  it('não cria o parágrafo de descrição quando ela é null', () => {
    const { list } = createPageEnvironment({ tasks: [NEWER_TASK] });
    const card = findCard(list, NEWER_TASK.id);

    assert.deepEqual(
      card.children.map((element) => element.tagName),
      ['H3', 'P', 'DIV', 'BUTTON', 'BUTTON']
    );
  });

  it('destaca a tarefa concluída e mostra a data de conclusão', () => {
    const { list } = createPageEnvironment({ tasks: [OLDER_TASK, NEWER_TASK] });
    const completedCard = findCard(list, NEWER_TASK.id);
    const pendingCard = findCard(list, OLDER_TASK.id);
    const [completedDetails] = findDescendants(completedCard, (element) =>
      element.textContent.startsWith('Prioridade')
    );

    assert.equal(completedCard.classList.contains(COMPLETED_CARD_CLASS), true);
    assert.equal(pendingCard.classList.contains(COMPLETED_CARD_CLASS), false);
    assert.match(completedDetails.textContent, /Concluída em: \d{2}\/\d{2}\/\d{4}/);
  });

  it('expõe os botões de editar e excluir com data-action e data-task-id', () => {
    const { list } = createPageEnvironment({ tasks: [OLDER_TASK] });
    const buttons = findDescendants(
      findCard(list, OLDER_TASK.id),
      (element) => element.tagName === 'BUTTON'
    );

    assert.deepEqual(
      buttons.map((button) => [button.dataset.action, button.dataset.taskId]),
      [
        ['edit', OLDER_TASK.id],
        ['delete', OLDER_TASK.id],
      ]
    );
  });

  it('coloca o texto digitado pelo usuário apenas como texto', () => {
    const unsafeTitle = '<img src="x" onerror="alert(1)">';
    const { list } = createPageEnvironment({
      tasks: [{ ...OLDER_TASK, title: unsafeTitle }],
    });
    const [title] = findDescendants(
      findCard(list, OLDER_TASK.id),
      (element) => element.tagName === 'H3'
    );

    assert.equal(title.textContent, unsafeTitle);
    assert.equal(Object.hasOwn(title, 'innerHTML'), false);
  });
});

describe('atualização e conclusão', () => {
  it('redesenha a lista ao receber tasks:changed', () => {
    const { list, state } = createPageEnvironment({ tasks: [OLDER_TASK] });
    state.tasks = [OLDER_TASK, NEWER_TASK];

    state.subscribers.forEach((callback) => callback());

    assert.deepEqual(getCardIds(list), [NEWER_TASK.id, OLDER_TASK.id]);
  });

  it('conclui e reabre a tarefa pelo storage', () => {
    const { list, state } = createPageEnvironment({ tasks: [OLDER_TASK] });

    list.listeners.change(createCompletionChange(OLDER_TASK.id, true));
    list.listeners.change(createCompletionChange(OLDER_TASK.id, false));

    assert.deepEqual(state.updates, [
      { id: OLDER_TASK.id, changes: { completed: true } },
      { id: OLDER_TASK.id, changes: { completed: false } },
    ]);
  });

  it('redesenha a lista quando o storage recusa a conclusão', () => {
    const { list, state } = createPageEnvironment({
      tasks: [OLDER_TASK],
      acceptsUpdates: false,
    });
    const readsBeforeChange = state.readCount;

    list.listeners.change(createCompletionChange(OLDER_TASK.id, true));

    assert.equal(state.readCount, readsBeforeChange + 1);
  });

  it('ignora mudanças que não vêm da caixa de conclusão', () => {
    const { list, state } = createPageEnvironment({ tasks: [OLDER_TASK] });

    list.listeners.change({ target: { dataset: { action: 'edit' } } });

    assert.deepEqual(state.updates, []);
  });

  it('ignora a caixa de conclusão com id inválido', () => {
    const { list, state } = createPageEnvironment({ tasks: [OLDER_TASK] });

    list.listeners.change(createCompletionChange('abc', true));

    assert.deepEqual(state.updates, []);
  });
});
