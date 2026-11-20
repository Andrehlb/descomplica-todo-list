const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const STORAGE_KEY = "descomplica-todo:tasks";

const TASK_MODEL_SOURCE = fs.readFileSync(
    path.join(__dirname, "task-model.js"),
    "utf8",
);

const STORAGE_SOURCE = fs.readFileSync(
    path.join(__dirname, "storage.js"),
    "utf8",
);

const EVENTS_SOURCE = fs.readFileSync(
    path.join(__dirname, "eventos.js"),
    "utf8",
);

const SCRIPT_SOURCE = fs.readFileSync(
    path.join(__dirname, "script.js"),
    "utf8",
);

// Simula os eventos CustomEvent do navegador.
class FakeCustomEvent extends Event {
    constructor(type, options) {
        super(type);
        this.detail = options?.detail;
    }
}

// Simula o localStorage sem alterar dados reais.
function createFakeLocalStorage(initialTasks = null) {
    const values = new Map();

    if (initialTasks !== null) {
        values.set(STORAGE_KEY, JSON.stringify(initialTasks));
    }

    const localStorage = {
        shouldFailWrites: false,

        getItem(key) {
            return values.has(key) ? values.get(key) : null;
        },

        setItem(key, value) {
            if (this.shouldFailWrites) {
                throw new Error("Falha simulada de gravação");
            }

            values.set(key, String(value));
        },
    };

    return localStorage;
}

// Prepara um ambiente isolado para cada teste.
function createEnvironment({ initialTasks = null } = {}) {
    const localStorage = createFakeLocalStorage(initialTasks);
    const eventTarget = new EventTarget();

    const tasksSummary = { textContent: "" };
    const fakeForm = { addEventListener: () => {} };

    const fakeDocument = {
        getElementById(id) {
            if (id === "tasks-summary") return tasksSummary;
            if (id === "task-form") return fakeForm;
            return null;
        },
    };

    const fakeWindow = {
        document: fakeDocument,
        localStorage,
        CustomEvent: FakeCustomEvent,

        dispatchEvent(event) {
            return eventTarget.dispatchEvent(event);
        },

        addEventListener(type, listener) {
            eventTarget.addEventListener(type, listener);
        },

        setTimeout: () => 1,
        clearTimeout: () => {},

        TaskDeadlines: {
            getTaskUrgency: () => 0,
        },
    };

    new Function("window", TASK_MODEL_SOURCE)(fakeWindow);
    new Function("window", STORAGE_SOURCE)(fakeWindow);
    new Function("window", EVENTS_SOURCE)(fakeWindow);

    const scriptFunctions = new Function(
        "window",
        "document",
        "CustomEvent",
        "TaskModel",
        "TaskStorage",
        "TaskEvents",
        `${SCRIPT_SOURCE}
        return { calculateTaskStats, updateTaskProgress };`,
    )(
        fakeWindow,
        fakeDocument,
        FakeCustomEvent,
        fakeWindow.TaskModel,
        fakeWindow.TaskStorage,
        fakeWindow.TaskEvents,
    );

    return {
        localStorage,
        tasksSummary,
        taskStorage: fakeWindow.TaskStorage,
        ...scriptFunctions,
    };
}

// TESTES DOS CÁLCULOS

describe("calculateTaskStats", () => {
    it("retorna zero quando não há tarefas", () => {
        const { calculateTaskStats } = createEnvironment();

        assert.deepEqual(calculateTaskStats([]), {
            total: 0,
            completed: 0,
            pending: 0,
            percentage: 0,
        });
    });

    it("calcula uma tarefa pendente", () => {
        const { calculateTaskStats } = createEnvironment();

        assert.deepEqual(calculateTaskStats([{ completed: false }]), {
            total: 1,
            completed: 0,
            pending: 1,
            percentage: 0,
        });
    });

    it("calcula uma tarefa concluída", () => {
        const { calculateTaskStats } = createEnvironment();

        assert.deepEqual(calculateTaskStats([{ completed: true }]), {
            total: 1,
            completed: 1,
            pending: 0,
            percentage: 100,
        });
    });

    it("calcula e arredonda percentuais parciais", () => {
        const { calculateTaskStats } = createEnvironment();

        const tasks = [
            { completed: true },
            { completed: false },
            { completed: false },
        ];

        assert.equal(calculateTaskStats(tasks).percentage, 33);

        tasks[1].completed = true;

        assert.equal(calculateTaskStats(tasks).percentage, 67);
    });

    it("rejeita entradas que não são arrays", () => {
        const { calculateTaskStats } = createEnvironment();

        assert.throws(() => calculateTaskStats(null), TypeError);

        assert.throws(() => calculateTaskStats({}), TypeError);
    });
});

// TESTES DE INTEGRAÇÃO DOS INDICADORES

describe("Integração de conclusão e progresso", () => {
    it("inicializa o painel com indicadores zerados", () => {
        const { tasksSummary } = createEnvironment();

        assert.equal(
            tasksSummary.textContent,
            "Total: 0 | Concluídas: 0 | Pendentes: 0 | Progresso: 0%",
        );
    });

    it("carrega corretamente tarefas já armazenadas", () => {
        const initialTasks = [
            {
                id: 1,
                title: "Estudar JavaScript",
                description: null,
                priority: "high",
                dueDate: null,
                createdAt: "2026-11-10T10:00:00.000Z",
                completed: true,
                completedAt: "2026-11-11T10:00:00.000Z",
            },
            {
                id: 2,
                title: "Revisar arrays",
                description: null,
                priority: "medium",
                dueDate: null,
                createdAt: "2026-11-10T11:00:00.000Z",
                completed: false,
                completedAt: null,
            },
        ];

        const { tasksSummary } = createEnvironment({
            initialTasks,
        });

        assert.equal(
            tasksSummary.textContent,
            "Total: 2 | Concluídas: 1 | Pendentes: 1 | Progresso: 50%",
        );
    });

    it("atualiza os indicadores ao concluir e reabrir", () => {
        const { taskStorage, tasksSummary } = createEnvironment();

        const task1 = taskStorage.createTask({
            title: "Tarefa 1",
            priority: "high",
        });

        const task2 = taskStorage.createTask({
            title: "Tarefa 2",
            priority: "low",
        });

        assert.ok(task1);
        assert.ok(task2);

        assert.equal(
            tasksSummary.textContent,
            "Total: 2 | Concluídas: 0 | Pendentes: 2 | Progresso: 0%",
        );

        taskStorage.updateTask(task1.id, { completed: true });

        assert.equal(
            tasksSummary.textContent,
            "Total: 2 | Concluídas: 1 | Pendentes: 1 | Progresso: 50%",
        );

        const completedTask = taskStorage.getTaskById(task1.id);

        assert.equal(completedTask.completed, true);
        assert.equal(typeof completedTask.completedAt, "string");

        taskStorage.updateTask(task2.id, { completed: true });

        assert.equal(
            tasksSummary.textContent,
            "Total: 2 | Concluídas: 2 | Pendentes: 0 | Progresso: 100%",
        );

        taskStorage.updateTask(task1.id, { completed: false });

        const reopenedTask = taskStorage.getTaskById(task1.id);

        assert.equal(reopenedTask.completed, false);
        assert.equal(reopenedTask.completedAt, null);

        assert.equal(
            tasksSummary.textContent,
            "Total: 2 | Concluídas: 1 | Pendentes: 1 | Progresso: 50%",
        );
    });

    it("não altera os indicadores quando a gravação falha", () => {
        const { taskStorage, localStorage, tasksSummary } = createEnvironment();

        const task = taskStorage.createTask({
            title: "Testar falha",
            priority: "medium",
        });

        assert.ok(task);

        const previousSummary = tasksSummary.textContent;

        localStorage.shouldFailWrites = true;

        const result = taskStorage.updateTask(task.id, {
            completed: true,
        });

        assert.equal(result, null);
        assert.equal(taskStorage.getTaskById(task.id).completed, false);
        assert.equal(tasksSummary.textContent, previousSummary);
    });
});
