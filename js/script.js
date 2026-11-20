function calculateTaskStats(tasks) {
    if (!Array.isArray(tasks)) {
        throw new TypeError("A lista de tarefas deve ser um array.");
    }

    const total = tasks.length;

    const completed = tasks.filter(function (task) {
        return (
            task !== null && typeof task === "object" && task.completed === true
        );
    }).length;

    const pending = total - completed;

    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
        total,
        completed,
        pending,
        percentage,
    };
}

function getCurrentTaskStats() {
    const tasks = TaskStorage.getTasks();

    return calculateTaskStats(tasks);
}

function renderTasksSummary(stats) {
    const summaryElement = document.getElementById("tasks-summary");

    if (!summaryElement) {
        return;
    }

    summaryElement.textContent =
        `Total: ${stats.total} | ` +
        `Concluídas: ${stats.completed} | ` +
        `Pendentes: ${stats.pending} | ` +
        `Progresso: ${stats.percentage}%`;
}

function updateTaskProgress() {
    const stats = getCurrentTaskStats();

    renderTasksSummary(stats);

    return stats;
}

function initTaskStatistics() {
    TaskEvents.subscribe(updateTaskProgress);

    updateTaskProgress();
}

initTaskStatistics();
