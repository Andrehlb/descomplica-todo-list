const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const TASK_FILTERS_MODULE_PATH = path.join(__dirname, 'task-filters.js');

function loadTaskFilters() {
  const source = fs.readFileSync(TASK_FILTERS_MODULE_PATH, 'utf8');
  const fakeWindow = {};

  new Function('window', source)(fakeWindow);

  return fakeWindow.TaskFilters;
}

const taskFilters = loadTaskFilters();

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

describe('normalizeSearchText', () => {
  it('converte para minúsculas', () => {
    assert.equal(taskFilters.normalizeSearchText('ESTUDAR'), 'estudar');
  });

  it('remove acentos', () => {
    assert.equal(taskFilters.normalizeSearchText('Ação Média'), 'acao media');
  });

  it('remove espaços nas pontas', () => {
    assert.equal(taskFilters.normalizeSearchText('  café  '), 'cafe');
  });

  it('devolve texto vazio para entrada inválida', () => {
    assert.equal(taskFilters.normalizeSearchText(undefined), '');
    assert.equal(taskFilters.normalizeSearchText(null), '');
    assert.equal(taskFilters.normalizeSearchText(42), '');
    assert.equal(taskFilters.normalizeSearchText({}), '');
  });
});

describe('filterTasks', () => {
  const tasks = [
    buildTask({ id: '1', title: 'Estudar JavaScript', priority: 'high' }),
    buildTask({
      id: '2',
      title: 'Comprar pão',
      description: 'Padaria da esquina',
      priority: 'low',
      completed: true,
    }),
    buildTask({
      id: '3',
      title: 'Revisão',
      description: 'Ler a AÇÃO do módulo',
      priority: 'medium',
    }),
  ];

  function idsOf(filteredTasks) {
    return filteredTasks.map((task) => task.id);
  }

  it('encontra tarefas ignorando maiúsculas', () => {
    const result = taskFilters.filterTasks(tasks, { searchText: 'JAVASCRIPT' });

    assert.deepEqual(idsOf(result), ['1']);
  });

  it('encontra tarefas ignorando acentos', () => {
    const result = taskFilters.filterTasks(tasks, { searchText: 'pao' });

    assert.deepEqual(idsOf(result), ['2']);
  });

  it('encontra texto digitado com acento em título sem acento', () => {
    const result = taskFilters.filterTasks(tasks, { searchText: 'revisão' });

    assert.deepEqual(idsOf(result), ['3']);
  });

  it('procura também na descrição', () => {
    const result = taskFilters.filterTasks(tasks, { searchText: 'acao' });

    assert.deepEqual(idsOf(result), ['3']);
  });

  it('aceita description null sem quebrar', () => {
    const result = taskFilters.filterTasks(tasks, { searchText: 'padaria' });

    assert.deepEqual(idsOf(result), ['2']);
  });

  it('não filtra com busca vazia ou só com espaços', () => {
    assert.deepEqual(
      idsOf(taskFilters.filterTasks(tasks, { searchText: '' })),
      ['1', '2', '3']
    );
    assert.deepEqual(
      idsOf(taskFilters.filterTasks(tasks, { searchText: '   ' })),
      ['1', '2', '3']
    );
  });

  it('filtra por prioridade', () => {
    const result = taskFilters.filterTasks(tasks, { priority: 'low' });

    assert.deepEqual(idsOf(result), ['2']);
  });

  it('filtra por situação pendente', () => {
    const result = taskFilters.filterTasks(tasks, { status: 'pending' });

    assert.deepEqual(idsOf(result), ['1', '3']);
  });

  it('filtra por situação concluída', () => {
    const result = taskFilters.filterTasks(tasks, { status: 'completed' });

    assert.deepEqual(idsOf(result), ['2']);
  });

  it('combina busca, prioridade e situação', () => {
    const result = taskFilters.filterTasks(tasks, {
      searchText: 'estudar',
      priority: 'high',
      status: 'pending',
    });

    assert.deepEqual(idsOf(result), ['1']);
  });

  it('devolve lista vazia quando a combinação não encontra nada', () => {
    const result = taskFilters.filterTasks(tasks, {
      searchText: 'estudar',
      priority: 'low',
    });

    assert.deepEqual(result, []);
  });

  it('trata o valor all como sem filtro', () => {
    const result = taskFilters.filterTasks(tasks, {
      priority: 'all',
      status: 'all',
    });

    assert.deepEqual(idsOf(result), ['1', '2', '3']);
  });

  it('trata critério ausente, inválido ou desconhecido como sem filtro', () => {
    const everyId = ['1', '2', '3'];

    assert.deepEqual(idsOf(taskFilters.filterTasks(tasks)), everyId);
    assert.deepEqual(idsOf(taskFilters.filterTasks(tasks, null)), everyId);
    assert.deepEqual(idsOf(taskFilters.filterTasks(tasks, 'texto')), everyId);
    assert.deepEqual(
      idsOf(
        taskFilters.filterTasks(tasks, {
          searchText: 42,
          priority: 'urgent',
          status: 7,
        })
      ),
      everyId
    );
  });

  it('devolve lista vazia quando tasks não é array', () => {
    assert.deepEqual(taskFilters.filterTasks(undefined, {}), []);
    assert.deepEqual(taskFilters.filterTasks(null, {}), []);
    assert.deepEqual(taskFilters.filterTasks('tarefas', {}), []);
    assert.deepEqual(taskFilters.filterTasks({}, {}), []);
  });

  it('ignora itens inválidos dentro da lista', () => {
    const result = taskFilters.filterTasks([null, 5, tasks[0]], {});

    assert.deepEqual(idsOf(result), ['1']);
  });

  it('devolve uma nova lista e não altera a original', () => {
    const original = [...tasks];

    const result = taskFilters.filterTasks(tasks, { priority: 'high' });

    assert.notEqual(result, tasks);
    assert.deepEqual(tasks, original);
    assert.equal(tasks.length, 3);
  });

  it('devolve uma nova lista mesmo sem filtro', () => {
    const result = taskFilters.filterTasks(tasks, {});

    assert.notEqual(result, tasks);
    assert.deepEqual(result, tasks);
  });
});

describe('countByStatus', () => {
  it('conta total, pendentes e concluídas', () => {
    const tasks = [
      buildTask({ id: '1' }),
      buildTask({ id: '2', completed: true }),
      buildTask({ id: '3', completed: true }),
    ];

    assert.deepEqual(taskFilters.countByStatus(tasks), {
      total: 3,
      pending: 1,
      completed: 2,
    });
  });

  it('devolve zeros para lista vazia', () => {
    assert.deepEqual(taskFilters.countByStatus([]), {
      total: 0,
      pending: 0,
      completed: 0,
    });
  });

  it('devolve zeros quando tasks não é array', () => {
    const emptyCount = { total: 0, pending: 0, completed: 0 };

    assert.deepEqual(taskFilters.countByStatus(undefined), emptyCount);
    assert.deepEqual(taskFilters.countByStatus(null), emptyCount);
    assert.deepEqual(taskFilters.countByStatus('tarefas'), emptyCount);
  });

  it('ignora itens inválidos', () => {
    const tasks = [null, 3, buildTask({ completed: true })];

    assert.deepEqual(taskFilters.countByStatus(tasks), {
      total: 1,
      pending: 0,
      completed: 1,
    });
  });
});
