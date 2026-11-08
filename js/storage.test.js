const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const STORAGE_MODULE_PATH = path.join(__dirname, 'storage.js');
const STORAGE_KEY = 'descomplica-todo:tasks';
const TASKS_CHANGED_EVENT = 'tasks:changed';
const CORRUPTED_JSON = '{tarefas quebradas';
const VALID_PRIORITIES = ['low', 'medium', 'high'];

const VALID_TASK_DATA = Object.freeze({
  title: 'Estudar JavaScript',
  description: 'Revisar funções',
  priority: 'medium',
  dueDate: '2026-11-10',
});

class FakeCustomEvent extends Event {
  constructor(type, options) {
    super(type);
    this.detail = options?.detail;
  }
}

function createFakeTaskModel() {
  return {
    validateTask(task) {
      const hasValidCompletion = task.completed
        ? task.completedAt !== null
        : task.completedAt === null;

      return (
        Number.isSafeInteger(task.id) &&
        task.id > 0 &&
        typeof task.title === 'string' &&
        task.title.length > 0 &&
        VALID_PRIORITIES.includes(task.priority) &&
        typeof task.completed === 'boolean' &&
        hasValidCompletion
      );
    },
  };
}

function createFakeLocalStorage() {
  const values = new Map();

  const localStorage = {
    shouldFailWrites: false,
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem(key, value) {
      if (localStorage.shouldFailWrites) {
        throw new Error('quota exceeded');
      }

      values.set(key, String(value));
    },
  };

  return localStorage;
}

function loadStorageModule(fakeWindow) {
  const source = fs.readFileSync(STORAGE_MODULE_PATH, 'utf8');
  new Function('window', source)(fakeWindow);
}

function createEnvironment({ taskModel = createFakeTaskModel() } = {}) {
  const localStorage = createFakeLocalStorage();
  const eventTarget = new EventTarget();
  const changeEvents = [];

  const fakeWindow = {
    localStorage,
    CustomEvent: FakeCustomEvent,
    dispatchEvent: (event) => eventTarget.dispatchEvent(event),
    addEventListener: (type, listener) =>
      eventTarget.addEventListener(type, listener),
  };

  if (taskModel) {
    fakeWindow.TaskModel = taskModel;
  }

  loadStorageModule(fakeWindow);
  fakeWindow.addEventListener(TASKS_CHANGED_EVENT, (event) =>
    changeEvents.push(event.detail)
  );

  return { taskStorage: fakeWindow.TaskStorage, localStorage, changeEvents };
}

function createStoredTask(taskStorage) {
  const task = taskStorage.createTask(VALID_TASK_DATA);
  assert.ok(task, 'a tarefa de apoio deveria ter sido criada');
  return task;
}

function assertIsoTimestamp(value) {
  assert.equal(typeof value, 'string');
  assert.equal(new Date(value).toISOString(), value);
}

beforeEach(() => {
  mock.method(console, 'error', () => {});
});

afterEach(() => {
  mock.restoreAll();
});

describe('createTask', () => {
  it('salva a tarefa e devolve os campos gerados', () => {
    const { taskStorage, changeEvents } = createEnvironment();

    const task = taskStorage.createTask(VALID_TASK_DATA);

    assert.ok(Number.isSafeInteger(task.id));
    assert.ok(task.id > 0);
    assertIsoTimestamp(task.createdAt);
    assert.equal(task.completed, false);
    assert.equal(task.completedAt, null);
    assert.equal(task.title, VALID_TASK_DATA.title);
    assert.deepEqual(taskStorage.getTasks(), [task]);
    assert.equal(changeEvents.length, 1);
  });

  it('remove os espaços das pontas do título', () => {
    const { taskStorage } = createEnvironment();

    const task = taskStorage.createTask({
      ...VALID_TASK_DATA,
      title: '  Estudar  ',
    });

    assert.equal(task.title, 'Estudar');
  });

  it('usa null quando descrição e prazo não são informados', () => {
    const { taskStorage } = createEnvironment();

    const task = taskStorage.createTask({ title: 'Estudar', priority: 'low' });

    assert.equal(task.description, null);
    assert.equal(task.dueDate, null);
  });

  it('cria tarefa já concluída com completedAt preenchido', () => {
    const { taskStorage } = createEnvironment();

    const task = taskStorage.createTask({
      ...VALID_TASK_DATA,
      completed: true,
    });

    assert.equal(task.completed, true);
    assert.equal(task.completedAt, task.createdAt);
  });

  it('gera ids inteiros sequenciais começando em 1', () => {
    const { taskStorage } = createEnvironment();

    const firstTask = createStoredTask(taskStorage);
    const secondTask = createStoredTask(taskStorage);
    const thirdTask = createStoredTask(taskStorage);

    assert.deepEqual(
      [firstTask.id, secondTask.id, thirdTask.id],
      [1, 2, 3]
    );
  });

  it('não repete o id de uma tarefa excluída no meio da lista', () => {
    const { taskStorage } = createEnvironment();
    const firstTask = createStoredTask(taskStorage);
    createStoredTask(taskStorage);
    taskStorage.deleteTask(firstTask.id);

    const newTask = createStoredTask(taskStorage);

    assert.equal(newTask.id, 3);
  });

  it('ignora ids salvos que não são inteiros ao gerar o próximo', () => {
    const { taskStorage, localStorage } = createEnvironment();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'texto' }, { id: 2.5 }, { id: 7 }])
    );

    const task = taskStorage.createTask(VALID_TASK_DATA);

    assert.equal(task.id, 8);
  });

  it('devolve null quando os dados não são um objeto', () => {
    const { taskStorage, localStorage } = createEnvironment();

    assert.equal(taskStorage.createTask(null), null);
    assert.equal(taskStorage.createTask('texto'), null);
    assert.equal(taskStorage.createTask(['lista']), null);
    assert.equal(localStorage.getItem(STORAGE_KEY), null);
  });

  it('rejeita título vazio ou só com espaços', () => {
    const { taskStorage } = createEnvironment();

    assert.equal(
      taskStorage.createTask({ ...VALID_TASK_DATA, title: '' }),
      null
    );
    assert.equal(
      taskStorage.createTask({ ...VALID_TASK_DATA, title: '   ' }),
      null
    );
    assert.deepEqual(taskStorage.getTasks(), []);
  });

  it('rejeita prioridade inválida sem gravar nem avisar', () => {
    const { taskStorage, changeEvents } = createEnvironment();

    const task = taskStorage.createTask({
      ...VALID_TASK_DATA,
      priority: 'urgent',
    });

    assert.equal(task, null);
    assert.deepEqual(taskStorage.getTasks(), []);
    assert.deepEqual(changeEvents, []);
  });

  it('dispara tasks:changed com tipo created e o id da tarefa', () => {
    const { taskStorage, changeEvents } = createEnvironment();

    const task = taskStorage.createTask(VALID_TASK_DATA);

    assert.deepEqual(changeEvents, [{ type: 'created', id: task.id }]);
  });

  it('devolve null e não avisa quando a gravação falha', () => {
    const { taskStorage, localStorage, changeEvents } = createEnvironment();
    localStorage.shouldFailWrites = true;

    const task = taskStorage.createTask(VALID_TASK_DATA);

    assert.equal(task, null);
    assert.deepEqual(changeEvents, []);
  });
});

describe('dados salvos ilegíveis', () => {
  it('não sobrescreve JSON corrompido ao criar', () => {
    const { taskStorage, localStorage, changeEvents } = createEnvironment();
    localStorage.setItem(STORAGE_KEY, CORRUPTED_JSON);

    const task = taskStorage.createTask(VALID_TASK_DATA);

    assert.equal(task, null);
    assert.equal(localStorage.getItem(STORAGE_KEY), CORRUPTED_JSON);
    assert.deepEqual(changeEvents, []);
  });

  it('não sobrescreve JSON corrompido ao atualizar', () => {
    const { taskStorage, localStorage } = createEnvironment();
    const task = createStoredTask(taskStorage);
    localStorage.setItem(STORAGE_KEY, CORRUPTED_JSON);

    const updatedTask = taskStorage.updateTask(task.id, {
      title: 'Novo título',
    });

    assert.equal(updatedTask, null);
    assert.equal(localStorage.getItem(STORAGE_KEY), CORRUPTED_JSON);
  });

  it('não sobrescreve JSON corrompido ao excluir', () => {
    const { taskStorage, localStorage } = createEnvironment();
    const task = createStoredTask(taskStorage);
    localStorage.setItem(STORAGE_KEY, CORRUPTED_JSON);

    const wasDeleted = taskStorage.deleteTask(task.id);

    assert.equal(wasDeleted, false);
    assert.equal(localStorage.getItem(STORAGE_KEY), CORRUPTED_JSON);
  });

  it('trata dados que não são uma lista como ilegíveis', () => {
    const { taskStorage, localStorage } = createEnvironment();
    const notAList = JSON.stringify({ titulo: 'não sou uma lista' });
    localStorage.setItem(STORAGE_KEY, notAList);

    assert.equal(taskStorage.createTask(VALID_TASK_DATA), null);
    assert.equal(localStorage.getItem(STORAGE_KEY), notAList);
  });

  it('getTasks devolve lista vazia quando os dados estão ilegíveis', () => {
    const { taskStorage, localStorage } = createEnvironment();
    localStorage.setItem(STORAGE_KEY, CORRUPTED_JSON);

    assert.deepEqual(taskStorage.getTasks(), []);
    assert.equal(taskStorage.getTaskById(999), null);
  });
});

describe('validação indisponível', () => {
  it('não grava quando o TaskModel não está carregado', () => {
    const { taskStorage, localStorage, changeEvents } = createEnvironment({
      taskModel: null,
    });

    const task = taskStorage.createTask(VALID_TASK_DATA);

    assert.equal(task, null);
    assert.equal(localStorage.getItem(STORAGE_KEY), null);
    assert.deepEqual(changeEvents, []);
  });

  it('não atualiza quando o TaskModel deixa de estar disponível', () => {
    const environment = createEnvironment();
    const task = createStoredTask(environment.taskStorage);
    const storageWithoutModel = createEnvironment({ taskModel: null });
    storageWithoutModel.localStorage.setItem(
      STORAGE_KEY,
      environment.localStorage.getItem(STORAGE_KEY)
    );

    const updatedTask = storageWithoutModel.taskStorage.updateTask(task.id, {
      title: 'Novo',
    });

    assert.equal(updatedTask, null);
    assert.equal(
      storageWithoutModel.taskStorage.getTaskById(task.id).title,
      task.title
    );
  });
});

describe('getTasks e getTaskById', () => {
  it('devolvem lista vazia e null quando não há tarefas', () => {
    const { taskStorage } = createEnvironment();

    assert.deepEqual(taskStorage.getTasks(), []);
    assert.equal(taskStorage.getTaskById(999), null);
  });

  it('não encontram a tarefa quando o id vem como texto', () => {
    const { taskStorage } = createEnvironment();
    const task = createStoredTask(taskStorage);

    assert.equal(taskStorage.getTaskById(String(task.id)), null);
  });

  it('encontram a tarefa pelo id', () => {
    const { taskStorage } = createEnvironment();
    const task = createStoredTask(taskStorage);

    assert.deepEqual(taskStorage.getTaskById(task.id), task);
  });

  it('não deixam alterar os dados salvos pelo objeto devolvido', () => {
    const { taskStorage } = createEnvironment();
    const task = createStoredTask(taskStorage);

    taskStorage.getTasks()[0].title = 'alterado por fora';

    assert.equal(taskStorage.getTaskById(task.id).title, task.title);
  });
});

describe('updateTask', () => {
  it('atualiza os campos editáveis e salva', () => {
    const { taskStorage } = createEnvironment();
    const task = createStoredTask(taskStorage);

    const updatedTask = taskStorage.updateTask(task.id, {
      title: 'Revisar testes',
      description: null,
      priority: 'high',
      dueDate: '2026-12-01',
    });

    assert.equal(updatedTask.title, 'Revisar testes');
    assert.equal(updatedTask.description, null);
    assert.equal(updatedTask.priority, 'high');
    assert.equal(updatedTask.dueDate, '2026-12-01');
    assert.deepEqual(taskStorage.getTaskById(task.id), updatedTask);
  });

  it('remove os espaços das pontas do título atualizado', () => {
    const { taskStorage } = createEnvironment();
    const task = createStoredTask(taskStorage);

    const updatedTask = taskStorage.updateTask(task.id, {
      title: '  Novo título  ',
    });

    assert.equal(updatedTask.title, 'Novo título');
  });

  it('ignora campos protegidos e campos desconhecidos', () => {
    const { taskStorage } = createEnvironment();
    const task = createStoredTask(taskStorage);

    const updatedTask = taskStorage.updateTask(task.id, {
      id: 999,
      createdAt: '2000-01-01T00:00:00.000Z',
      completedAt: '2000-01-01T00:00:00.000Z',
      campoInventado: 'valor',
      title: 'Título novo',
    });

    assert.equal(updatedTask.id, task.id);
    assert.equal(updatedTask.createdAt, task.createdAt);
    assert.equal(updatedTask.completedAt, null);
    assert.equal(Object.hasOwn(updatedTask, 'campoInventado'), false);
    assert.equal(updatedTask.title, 'Título novo');
  });

  it('preenche completedAt ao concluir e limpa ao reabrir', () => {
    const { taskStorage } = createEnvironment();
    const task = createStoredTask(taskStorage);

    const completedTask = taskStorage.updateTask(task.id, { completed: true });
    assert.equal(completedTask.completed, true);
    assertIsoTimestamp(completedTask.completedAt);

    const reopenedTask = taskStorage.updateTask(task.id, { completed: false });
    assert.equal(reopenedTask.completed, false);
    assert.equal(reopenedTask.completedAt, null);
  });

  it('mantém completedAt quando a conclusão não muda', () => {
    const { taskStorage } = createEnvironment();
    const task = createStoredTask(taskStorage);
    const completedTask = taskStorage.updateTask(task.id, { completed: true });

    const renamedTask = taskStorage.updateTask(task.id, {
      title: 'Outro nome',
    });

    assert.equal(renamedTask.completedAt, completedTask.completedAt);
  });

  it('devolve null para id inexistente', () => {
    const { taskStorage, changeEvents } = createEnvironment();

    assert.equal(
      taskStorage.updateTask(999, { title: 'Novo' }),
      null
    );
    assert.deepEqual(changeEvents, []);
  });

  it('devolve null quando as mudanças não são um objeto', () => {
    const { taskStorage } = createEnvironment();
    const task = createStoredTask(taskStorage);

    assert.equal(taskStorage.updateTask(task.id, null), null);
    assert.equal(taskStorage.updateTask(task.id, 'texto'), null);
    assert.equal(taskStorage.updateTask(task.id, ['lista']), null);
  });

  it('não salva uma mudança reprovada pela validação', () => {
    const { taskStorage, changeEvents } = createEnvironment();
    const task = createStoredTask(taskStorage);
    changeEvents.length = 0;

    assert.equal(taskStorage.updateTask(task.id, { title: '   ' }), null);
    assert.equal(taskStorage.updateTask(task.id, { priority: 'urgent' }), null);
    assert.equal(taskStorage.updateTask(task.id, { completed: 'true' }), null);
    assert.deepEqual(taskStorage.getTaskById(task.id), task);
    assert.deepEqual(changeEvents, []);
  });

  it('dispara tasks:changed com tipo updated e o id da tarefa', () => {
    const { taskStorage, changeEvents } = createEnvironment();
    const task = createStoredTask(taskStorage);
    changeEvents.length = 0;

    taskStorage.updateTask(task.id, { title: 'Novo título' });

    assert.deepEqual(changeEvents, [{ type: 'updated', id: task.id }]);
  });

  it('devolve null e não avisa quando a gravação falha', () => {
    const { taskStorage, localStorage, changeEvents } = createEnvironment();
    const task = createStoredTask(taskStorage);
    changeEvents.length = 0;
    localStorage.shouldFailWrites = true;

    assert.equal(
      taskStorage.updateTask(task.id, { title: 'Novo título' }),
      null
    );
    assert.deepEqual(changeEvents, []);
    assert.equal(taskStorage.getTaskById(task.id).title, task.title);
  });
});

describe('deleteTask', () => {
  it('remove a tarefa, devolve true e dispara tasks:changed com tipo deleted', () => {
    const { taskStorage, changeEvents } = createEnvironment();
    const task = createStoredTask(taskStorage);
    changeEvents.length = 0;

    const wasDeleted = taskStorage.deleteTask(task.id);

    assert.equal(wasDeleted, true);
    assert.deepEqual(taskStorage.getTasks(), []);
    assert.deepEqual(changeEvents, [{ type: 'deleted', id: task.id }]);
  });

  it('mantém as outras tarefas', () => {
    const { taskStorage } = createEnvironment();
    const firstTask = createStoredTask(taskStorage);
    const secondTask = createStoredTask(taskStorage);

    taskStorage.deleteTask(firstTask.id);

    assert.deepEqual(taskStorage.getTasks(), [secondTask]);
  });

  it('devolve false e não avisa para id inexistente', () => {
    const { taskStorage, changeEvents } = createEnvironment();
    createStoredTask(taskStorage);
    changeEvents.length = 0;

    assert.equal(taskStorage.deleteTask(999), false);
    assert.equal(taskStorage.getTasks().length, 1);
    assert.deepEqual(changeEvents, []);
  });

  it('devolve false e mantém a tarefa quando a gravação falha', () => {
    const { taskStorage, localStorage, changeEvents } = createEnvironment();
    const task = createStoredTask(taskStorage);
    changeEvents.length = 0;
    localStorage.shouldFailWrites = true;

    assert.equal(taskStorage.deleteTask(task.id), false);
    assert.deepEqual(changeEvents, []);
    assert.deepEqual(taskStorage.getTaskById(task.id), task);
  });
});
