const taskForm = document.getElementById("task-form");

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();
    console.log("Formulário envaido!");
    const taskTitle = document.getElementById("task-title").value;
    const taskDescription = document.getElementById("task-description").value;
    const taskPriority = document.getElementById("task-priority").value;
    const taskDueDate = document.getElementById("task-due-date").value;

    console.log({
        taskTitle,
        taskDescription,
        taskPriority,
        taskDueDate,
    });

    const taskData = TaskModel.createTaskData(
        taskTitle,
        taskDescription,
        taskPriority,
        taskDueDate || null,
    );

    if (!taskData) {
        console.error("Dados inválidos. Tarefa não cadastrada.");
        return;
    }

    const createdTask = TaskStorage.createTask(taskData);

    if (!createdTask) {
        console.error("Não foi possível salvar a tarefa.");
        return;
    }

    console.log("Tarefa cadastrada:", createdTask);
});

/* ISSUE #12: ATUALIZAÇÃO DE PRAZOS E URGÊNCIA */

(function () {
    "use strict";

    const EVENT_NAME = "tasks:urgency-changed";

    if (window.TaskUrgencyUpdates) {
        return;
    }

    let currentSnapshot = null;
    let midnightTimeoutId = null;

    // Calcula as urgências das tarefas armazenadas.
    function refreshTaskUrgencies() {
        try {
            const referenceDate = new Date();
            const tasks = window.TaskStorage.getTasks();

            const urgencies = tasks.map(function (task) {
                return {
                    id: task.id,
                    urgency: window.TaskDeadlines.getTaskUrgency(
                        task,
                        referenceDate,
                    ),
                };
            });

            const nextSnapshot = {
                calculatedAt: referenceDate.toISOString(),
                urgencies,
            };

            currentSnapshot = nextSnapshot;

            // Avisa os temas que os valores foram atualizados.
            window.dispatchEvent(
                new CustomEvent(EVENT_NAME, {
                    detail: nextSnapshot,
                }),
            );

            return nextSnapshot;
        } catch (error) {
            console.error("Não foi possível atualizar as urgências.", error);

            return null;
        }
    }

    // Agenda a atualização para a próxima meia-noite local.
    function scheduleNextLocalMidnight() {
        window.clearTimeout(midnightTimeoutId);

        const now = new Date();
        const nextMidnight = new Date(now);

        nextMidnight.setHours(24, 0, 0, 0);

        const delay = nextMidnight.getTime() - now.getTime();

        midnightTimeoutId = window.setTimeout(function () {
            refreshTaskUrgencies();
            scheduleNextLocalMidnight();
        }, delay);
    }

    // Disponibiliza o último resultado aos três temas.
    window.TaskUrgencyUpdates = {
        EVENT_NAME,

        getSnapshot() {
            return currentSnapshot;
        },
    };

    // Atualiza quando uma tarefa é criada, editada ou excluída.
    window.TaskEvents.subscribe(refreshTaskUrgencies);

    // Executa o cálculo inicial.
    refreshTaskUrgencies();

    // Inicia o monitoramento da virada do dia.
    scheduleNextLocalMidnight();
})();
