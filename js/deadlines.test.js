const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const MODEL_SOURCE = fs.readFileSync(
  path.join(__dirname, 'task-model.js'),
  'utf8'
);

const DEADLINES_SOURCE = fs.readFileSync(
  path.join(__dirname, 'deadlines.js'),
  'utf8'
);

function createEnvironment(DateConstructor = Date) {
  const fakeWindow = {};

  new Function('window', 'Date', MODEL_SOURCE)(
    fakeWindow,
    DateConstructor
  );

  new Function('window', 'Date', DEADLINES_SOURCE)(
    fakeWindow,
    DateConstructor
  );

  return fakeWindow;
}

// O mês é informado de 1 a 12.
// setFullYear preserva corretamente os anos 0000 a 0099.
function localDate(
  year,
  month,
  day,
  hour = 12,
  minute = 0,
  second = 0,
  millisecond = 0
) {
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(hour, minute, second, millisecond);
  return date;
}

function createTask(changes = {}) {
  return {
    id: 1,
    title: 'Estudar JavaScript',
    description: null,
    priority: 'medium',
    dueDate: '2026-11-20',
    createdAt: '2026-11-01T12:00:00.000Z',
    completed: false,
    completedAt:
      changes.completed === true
        ? '2026-11-18T12:00:00.000Z'
        : null,
    ...changes,
  };
}

describe('TaskDeadlines: API', () => {
  it('expõe getTaskUrgency em window.TaskDeadlines', () => {
    const window = createEnvironment();

    assert.equal(
      typeof window.TaskDeadlines.getTaskUrgency,
      'function'
    );
  });

  it('usa a data atual quando referenceDate é omitido ou undefined', () => {
    const timestamp = localDate(2026, 11, 19, 23, 59).getTime();

    class FixedDate extends Date {
      constructor(...args) {
        super(...(args.length === 0 ? [timestamp] : args));
      }
    }

    const { TaskDeadlines } = createEnvironment(FixedDate);
    const task = createTask({ dueDate: '2026-11-19' });

    assert.equal(TaskDeadlines.getTaskUrgency(task), 1);
    assert.equal(TaskDeadlines.getTaskUrgency(task, undefined), 1);
  });
});

describe('getTaskUrgency: regras e limites', () => {
  for (const dueDate of [
    '2026-11-18',
    '2026-11-19',
    '2026-11-20',
    null,
  ]) {
    it(`retorna 0 para tarefa concluída com prazo ${dueDate}`, () => {
      const { TaskDeadlines } = createEnvironment();

      const task = createTask({
        completed: true,
        dueDate,
      });

      assert.equal(
        TaskDeadlines.getTaskUrgency(
          task,
          localDate(2026, 11, 19)
        ),
        0
      );
    });
  }

  it('retorna 0 para tarefa pendente sem prazo', () => {
    const { TaskDeadlines } = createEnvironment();

    assert.equal(
      TaskDeadlines.getTaskUrgency(
        createTask({ dueDate: null }),
        localDate(2026, 11, 19)
      ),
      0
    );
  });

  const cases = [
    ['vencida', '2026-11-18', 1],
    ['vence hoje: 0 dias', '2026-11-19', 1],
    ['falta 1 dia', '2026-11-20', 6 / 7],
    ['faltam 2 dias', '2026-11-21', 5 / 7],
    ['faltam 3 dias', '2026-11-22', 4 / 7],
    ['faltam 4 dias', '2026-11-23', 3 / 7],
    ['faltam 5 dias', '2026-11-24', 2 / 7],
    ['faltam 6 dias', '2026-11-25', 1 / 7],
    ['faltam 7 dias', '2026-11-26', 0],
    ['faltam 8 dias', '2026-11-27', 0],
    ['prazo distante', '2027-11-19', 0],
  ];

  for (const [label, dueDate, expected] of cases) {
    it(`calcula a urgência quando ${label}`, () => {
      const { TaskDeadlines } = createEnvironment();

      assert.equal(
        TaskDeadlines.getTaskUrgency(
          createTask({ dueDate }),
          localDate(2026, 11, 19)
        ),
        expected
      );
    });
  }
});

describe('getTaskUrgency: transições de calendário', () => {
  const cases = [
    ['janeiro para fevereiro', [2026, 1, 31], '2026-02-01', 6 / 7],
    ['abril para maio', [2026, 4, 30], '2026-05-01', 6 / 7],
    ['novembro para dezembro', [2026, 11, 30], '2026-12-01', 6 / 7],
    ['virada do ano', [2026, 12, 31], '2027-01-01', 6 / 7],
    ['fevereiro comum', [2026, 2, 28], '2026-03-01', 6 / 7],
    ['fevereiro bissexto', [2028, 2, 28], '2028-03-01', 5 / 7],
    ['prazo em 29 de fevereiro', [2028, 2, 28], '2028-02-29', 6 / 7],
  ];

  for (const [label, reference, dueDate, expected] of cases) {
    it(`considera corretamente ${label}`, () => {
      const { TaskDeadlines } = createEnvironment();

      assert.equal(
        TaskDeadlines.getTaskUrgency(
          createTask({ dueDate }),
          localDate(...reference)
        ),
        expected
      );
    });
  }
});

describe('getTaskUrgency: horário no mesmo dia local', () => {
  it('ignora horas, minutos, segundos e milissegundos', () => {
    const { TaskDeadlines } = createEnvironment();

    const references = [
      localDate(2026, 11, 19, 0, 0, 0, 0),
      localDate(2026, 11, 19, 12, 30, 15, 500),
      localDate(2026, 11, 19, 23, 59, 59, 999),
    ];

    for (const reference of references) {
      assert.equal(
        TaskDeadlines.getTaskUrgency(
          createTask({ dueDate: '2026-11-20' }),
          reference
        ),
        6 / 7
      );

      assert.equal(
        TaskDeadlines.getTaskUrgency(
          createTask({ dueDate: '2026-11-19' }),
          reference
        ),
        1
      );
    }
  });
});

describe('getTaskUrgency: anos 0000 a 0099', () => {
  for (let year = 0; year <= 99; year += 1) {
    const formattedYear = String(year).padStart(4, '0');

    it(`preserva o ano ${formattedYear} no cálculo`, () => {
      const { TaskDeadlines } = createEnvironment();

      assert.equal(
        TaskDeadlines.getTaskUrgency(
          createTask({ dueDate: `${formattedYear}-01-02` }),
          localDate(year, 1, 1)
        ),
        6 / 7
      );
    });
  }

  it('considera o ano 0000 bissexto', () => {
    const { TaskDeadlines } = createEnvironment();

    assert.equal(
      TaskDeadlines.getTaskUrgency(
        createTask({ dueDate: '0000-03-01' }),
        localDate(0, 2, 28)
      ),
      5 / 7
    );
  });

  it('calcula a passagem de 0099 para 0100', () => {
    const { TaskDeadlines } = createEnvironment();

    assert.equal(
      TaskDeadlines.getTaskUrgency(
        createTask({ dueDate: '0100-01-01' }),
        localDate(99, 12, 31)
      ),
      6 / 7
    );
  });
});

describe('getTaskUrgency: argumentos inválidos', () => {
  const invalidTasks = [
    ['undefined', undefined],
    ['null', null],
    ['array', []],
    ['número', 0],
    ['string', 'tarefa'],
    ['booleano', true],
    ['objeto sem os campos necessários', {}],
  ];

  for (const [label, task] of invalidTasks) {
    it(`lança TypeError para tarefa: ${label}`, () => {
      const { TaskDeadlines } = createEnvironment();

      assert.throws(
        () => TaskDeadlines.getTaskUrgency(
          task,
          localDate(2026, 11, 19)
        ),
        TypeError
      );
    });
  }

  const invalidCompleted = [
    ['undefined', undefined],
    ['null', null],
    ['zero', 0],
    ['um', 1],
    ['string false', 'false'],
    ['string true', 'true'],
    ['objeto', {}],
    ['array', []],
  ];

  for (const [label, completed] of invalidCompleted) {
    it(`lança TypeError para completed: ${label}`, () => {
      const { TaskDeadlines } = createEnvironment();

      assert.throws(
        () => TaskDeadlines.getTaskUrgency(
          createTask({ completed }),
          localDate(2026, 11, 19)
        ),
        TypeError
      );
    });
  }

  const invalidDueDates = [
    ['undefined', undefined],
    ['string vazia', ''],
    ['formato brasileiro', '19/11/2026'],
    ['mês sem dois dígitos', '2026-1-19'],
    ['timestamp', '2026-11-19T12:00:00.000Z'],
    ['dia inexistente', '2026-02-30'],
    ['ano comum', '2026-02-29'],
    ['ano 0001 não bissexto', '0001-02-29'],
    ['ano 0099 não bissexto', '0099-02-29'],
    ['ano 0100 não bissexto', '0100-02-29'],
    ['mês zero', '2026-00-01'],
    ['mês 13', '2026-13-01'],
    ['dia zero', '2026-11-00'],
    ['número', 0],
    ['objeto', {}],
    ['array', []],
  ];

  for (const [label, dueDate] of invalidDueDates) {
    it(`lança TypeError para prazo: ${label}`, () => {
      const { TaskDeadlines } = createEnvironment();

      assert.throws(
        () => TaskDeadlines.getTaskUrgency(
          createTask({ dueDate }),
          localDate(2026, 11, 19)
        ),
        TypeError
      );
    });
  }

  const invalidReferences = [
    ['null', null],
    ['número', 0],
    ['NaN', NaN],
    ['string', '2026-11-19'],
    ['objeto', {}],
    ['array', []],
    ['Invalid Date', new Date(NaN)],
  ];

  for (const [label, reference] of invalidReferences) {
    it(`lança TypeError para referência: ${label}`, () => {
      const { TaskDeadlines } = createEnvironment();

      assert.throws(
        () => TaskDeadlines.getTaskUrgency(
          createTask(),
          reference
        ),
        TypeError
      );
    });
  }

  it('valida o prazo mesmo quando a tarefa está concluída', () => {
    const { TaskDeadlines } = createEnvironment();

    assert.throws(
      () => TaskDeadlines.getTaskUrgency(
        createTask({
          completed: true,
          dueDate: 'data inválida',
        }),
        localDate(2026, 11, 19)
      ),
      TypeError
    );
  });

  it('valida a referência mesmo quando a tarefa não tem prazo', () => {
    const { TaskDeadlines } = createEnvironment();

    assert.throws(
      () => TaskDeadlines.getTaskUrgency(
        createTask({ dueDate: null }),
        new Date(NaN)
      ),
      TypeError
    );
  });
});

describe('getTaskUrgency: ausência de mutações', () => {
  it('preserva todos os campos da tarefa e o instante da referência', () => {
    const { TaskDeadlines } = createEnvironment();
    const task = createTask();
    const taskBefore = { ...task };
    const reference = localDate(2026, 11, 19, 23, 59, 59, 999);
    const timestampBefore = reference.getTime();

    assert.equal(
      TaskDeadlines.getTaskUrgency(task, reference),
      6 / 7
    );

    assert.deepEqual(task, taskBefore);
    assert.equal(reference.getTime(), timestampBefore);
  });

  it('aceita uma tarefa congelada sem tentar modificá-la', () => {
    const { TaskDeadlines } = createEnvironment();
    const task = Object.freeze(createTask());

    assert.equal(
      TaskDeadlines.getTaskUrgency(
        task,
        localDate(2026, 11, 19)
      ),
      6 / 7
    );
  });
});
