
(function () {
    "use strict";

    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const URGENCY_WINDOW_DAYS = 7;

    // Converte uma data de calendário para meia-noite UTC.
    function toUtcCalendarTimestamp(year, monthIndex, day) {
        const date = new Date(0);
        date.setUTCFullYear(year, monthIndex, day);
        return date.getTime();
    }

    // Calcula a diferença entre dois dias do calendário local.
    function getCalendarDaysDifference(dueDate, referenceDate) {
        const [year, month, day] = dueDate.split("-").map(Number);

        const dueTimestamp = toUtcCalendarTimestamp(
            year,
            month - 1,
            day
        );

        const referenceTimestamp = toUtcCalendarTimestamp(
            referenceDate.getFullYear(),
            referenceDate.getMonth(),
            referenceDate.getDate()
        );

        return (dueTimestamp - referenceTimestamp) / MS_PER_DAY;
    }

    // Retorna a urgência de uma tarefa entre 0 e 1.
    function getTaskUrgency(task, referenceDate = new Date()) {
        if (
            task === null ||
            typeof task !== "object" ||
            Array.isArray(task)
        ) {
            throw new TypeError("A tarefa deve ser um objeto válido.");
        }

        if (!window.TaskModel.validateCompleted(task.completed)) {
            throw new TypeError("O estado de conclusão é inválido.");
        }

        if (!window.TaskModel.validateDueDate(task.dueDate)) {
            throw new TypeError("O prazo da tarefa é inválido.");
        }

        if (
            !(referenceDate instanceof Date) ||
            Number.isNaN(referenceDate.getTime())
        ) {
            throw new TypeError("A data de referência é inválida.");
        }

        if (task.completed || task.dueDate === null) {
            return 0;
        }

        const daysRemaining = getCalendarDaysDifference(
            task.dueDate,
            referenceDate
        );

        if (daysRemaining <= 0) {
            return 1;
        }

        if (daysRemaining >= URGENCY_WINDOW_DAYS) {
            return 0;
        }

        return (URGENCY_WINDOW_DAYS - daysRemaining) /
            URGENCY_WINDOW_DAYS;
    }

    window.TaskDeadlines = {
        getTaskUrgency,
    };
})();
