const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const TASK_LIST_MODULE_PATH = path.join(__dirname, 'task-list.js');

function loadTaskList() {
  const source = fs.readFileSync(TASK_LIST_MODULE_PATH, 'utf8');
  const fakeWindow = {};

  new Function('window', source)(fakeWindow);

  return fakeWindow.TaskList;
}

const taskList = loadTaskList();

describe('sortTasksByNewest', () => {
  it('ordena da tarefa mais recente para a mais antiga', () => {
    const oldest = { id: 'a', createdAt: '2026-10-01T10:00:00.000Z' };
    const middle = { id: 'b', createdAt: '2026-10-15T10:00:00.000Z' };
    const newest = { id: 'c', createdAt: '2026-11-01T10:00:00.000Z' };

    const sortedTasks = taskList.sortTasksByNewest([middle, oldest, newest]);

    assert.deepEqual(sortedTasks, [newest, middle, oldest]);
  });

  it('não altera a lista original', () => {
    const tasks = [
      { id: 'a', createdAt: '2026-10-01T10:00:00.000Z' },
      { id: 'b', createdAt: '2026-11-01T10:00:00.000Z' },
    ];

    taskList.sortTasksByNewest(tasks);

    assert.deepEqual(
      tasks.map((task) => task.id),
      ['a', 'b']
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
