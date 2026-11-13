const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const TASK_PRIORITY_MODULE_PATH = path.join(__dirname, 'task-priority.js');

function loadTaskPriority() {
  const source = fs.readFileSync(TASK_PRIORITY_MODULE_PATH, 'utf8');
  const fakeWindow = {};

  new Function('window', source)(fakeWindow);

  return fakeWindow.TaskPriority;
}

const taskPriority = loadTaskPriority();

function buildTask(overrides) {
  return {
    id: 'a',
    title: 'Tarefa',
    description: null,
    completed: false,
    completedAt: null,
    priority: 'medium',
    dueDate: null,
    createdAt: '2026-11-01T10:00:00.000Z',
    ...overrides,
  };
}

function idsOf(tasks) {
  return tasks.map((task) => task.id);
}

describe('PRIORITY_LEVELS', () => {
  it('lista da prioridade mais alta para a mais baixa', () => {
    assert.deepEqual([...taskPriority.PRIORITY_LEVELS], ['high', 'medium', 'low']);
  });
});

describe('getPriorityRank', () => {
  it('devolve 0, 1 e 2 para high, medium e low', () => {
    assert.equal(taskPriority.getPriorityRank('high'), 0);
    assert.equal(taskPriority.getPriorityRank('medium'), 1);
    assert.equal(taskPriority.getPriorityRank('low'), 2);
  });

  it('devolve o tamanho da lista para valor desconhecido', () => {
    const unknownRank = taskPriority.PRIORITY_LEVELS.length;

    assert.equal(taskPriority.getPriorityRank('urgent'), unknownRank);
    assert.equal(taskPriority.getPriorityRank(undefined), unknownRank);
    assert.equal(taskPriority.getPriorityRank(null), unknownRank);
    assert.equal(taskPriority.getPriorityRank(1), unknownRank);
    assert.equal(taskPriority.getPriorityRank(''), unknownRank);
  });
});

describe('sortByPriority', () => {
  it('ordena da prioridade mais alta para a mais baixa', () => {
    const tasks = [
      buildTask({ id: 'low', priority: 'low' }),
      buildTask({ id: 'high', priority: 'high' }),
      buildTask({ id: 'medium', priority: 'medium' }),
    ];

    assert.deepEqual(idsOf(taskPriority.sortByPriority(tasks)), [
      'high',
      'medium',
      'low',
    ]);
  });

  it('desempata pela data de criação mais recente primeiro', () => {
    const tasks = [
      buildTask({ id: 'old', priority: 'high', createdAt: '2026-10-01T10:00:00.000Z' }),
      buildTask({ id: 'new', priority: 'high', createdAt: '2026-11-05T10:00:00.000Z' }),
      buildTask({ id: 'mid', priority: 'high', createdAt: '2026-10-20T10:00:00.000Z' }),
    ];

    assert.deepEqual(idsOf(taskPriority.sortByPriority(tasks)), ['new', 'mid', 'old']);
  });

  it('manda prioridade desconhecida para o fim', () => {
    const tasks = [
      buildTask({ id: 'unknown', priority: 'urgent' }),
      buildTask({ id: 'low', priority: 'low' }),
    ];

    assert.deepEqual(idsOf(taskPriority.sortByPriority(tasks)), ['low', 'unknown']);
  });

  it('manda createdAt inválido para o fim do desempate', () => {
    const tasks = [
      buildTask({ id: 'broken', createdAt: 'não é data' }),
      buildTask({ id: 'valid', createdAt: '2026-10-01T10:00:00.000Z' }),
    ];

    assert.deepEqual(idsOf(taskPriority.sortByPriority(tasks)), ['valid', 'broken']);
  });

  it('devolve lista vazia quando tasks não é array', () => {
    assert.deepEqual(taskPriority.sortByPriority(undefined), []);
    assert.deepEqual(taskPriority.sortByPriority(null), []);
    assert.deepEqual(taskPriority.sortByPriority('tarefas'), []);
    assert.deepEqual(taskPriority.sortByPriority({}), []);
  });

  it('ignora itens inválidos dentro da lista', () => {
    const tasks = [null, 7, buildTask({ id: 'valid' })];

    assert.deepEqual(idsOf(taskPriority.sortByPriority(tasks)), ['valid']);
  });

  it('devolve uma nova lista e não altera a original', () => {
    const tasks = [
      buildTask({ id: 'low', priority: 'low' }),
      buildTask({ id: 'high', priority: 'high' }),
    ];
    const originalOrder = idsOf(tasks);

    const sortedTasks = taskPriority.sortByPriority(tasks);

    assert.notEqual(sortedTasks, tasks);
    assert.deepEqual(idsOf(tasks), originalOrder);
  });
});

describe('countByPriority', () => {
  it('conta só tarefas pendentes por prioridade', () => {
    const tasks = [
      buildTask({ priority: 'high' }),
      buildTask({ priority: 'high' }),
      buildTask({ priority: 'high', completed: true }),
      buildTask({ priority: 'medium' }),
      buildTask({ priority: 'low', completed: true }),
    ];

    assert.deepEqual(taskPriority.countByPriority(tasks), {
      high: 2,
      medium: 1,
      low: 0,
    });
  });

  it('ignora itens inválidos e prioridades desconhecidas', () => {
    const tasks = [
      null,
      undefined,
      12,
      'texto',
      buildTask({ priority: 'urgent' }),
      buildTask({ priority: 'low' }),
    ];

    assert.deepEqual(taskPriority.countByPriority(tasks), {
      high: 0,
      medium: 0,
      low: 1,
    });
  });

  it('devolve zeros para lista vazia ou entrada que não é array', () => {
    const emptyCounts = { high: 0, medium: 0, low: 0 };

    assert.deepEqual(taskPriority.countByPriority([]), emptyCounts);
    assert.deepEqual(taskPriority.countByPriority(undefined), emptyCounts);
    assert.deepEqual(taskPriority.countByPriority(null), emptyCounts);
    assert.deepEqual(taskPriority.countByPriority('tarefas'), emptyCounts);
  });
});

describe('getPriorityCssClass', () => {
  it('devolve a classe de cada prioridade', () => {
    assert.equal(taskPriority.getPriorityCssClass('high'), 'task-card--priority-high');
    assert.equal(
      taskPriority.getPriorityCssClass('medium'),
      'task-card--priority-medium'
    );
    assert.equal(taskPriority.getPriorityCssClass('low'), 'task-card--priority-low');
  });

  it('devolve texto vazio para prioridade desconhecida', () => {
    assert.equal(taskPriority.getPriorityCssClass('urgent'), '');
    assert.equal(taskPriority.getPriorityCssClass(undefined), '');
    assert.equal(taskPriority.getPriorityCssClass(null), '');
    assert.equal(taskPriority.getPriorityCssClass(0), '');
  });
});
