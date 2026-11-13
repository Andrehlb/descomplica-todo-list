// Constantes de prioridade e valor padrão
const PRIORITIES = ["high", "medium", "low"];
const DEFAULT_PRIORITY = "medium";

// Funções de validação para cada campo do modelo de tarefa
function validateTitle(title) {
    return typeof title === "string" && title.trim().length > 0;
}

function validateId(id) {
    return Number.isSafeInteger(id) && id > 0;
}

// Vai validar data e hora no formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
function validateIsoDateTime(value) {
    if (typeof value !== "string") {
        return false;
    }

    const date = new Date(value);

    return (
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
        !Number.isNaN(date.getTime()) &&
        date.toISOString() === value
    );
}

//Valida a data de criação usando a função validateIsoDateTime
function validateCreatedAt(createdAt) {
    return validateIsoDateTime(createdAt);
}

function validatePriority(priority) {
    return PRIORITIES.includes(priority);
}

function validateDueDate(dueDate) {
    if (dueDate === null) {
        return true;
    }

    if (typeof dueDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        return false;
    }

    const [year, month, day] = dueDate.split("-").map(Number);
    const date = new Date(0);
    date.setFullYear(year, month - 1, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

function validateDescription(description) {
    return description == null || typeof description === "string";
}

function validateCompleted(completed) {
    return typeof completed === "boolean";
}

function validateCompletedAt(completedAt) {
    return completedAt === null || validateIsoDateTime(completedAt);
}

function validateCompletion(completed, completedAt) {
    if (!validateCompleted(completed) || !validateCompletedAt(completedAt)) {
        return false;
    }

    return completed ? completedAt !== null : completedAt === null;
}

function validateTask(task) {
    if (task === null || typeof task !== "object" || Array.isArray(task)) {
        return false;
    }

    return (
        validateTitle(task.title) &&
        validateId(task.id) &&
        validateDescription(task.description) &&
        validatePriority(task.priority) &&
        validateDueDate(task.dueDate) &&
        validateCreatedAt(task.createdAt) &&
        validateCompletion(task.completed, task.completedAt)
    );
}

function createTaskData(title, description, priority, dueDate) {
    const normalizedDescription =
        description == null
            ? null
            : typeof description === "string"
                ? description.trim()
                : description;

    const task = {
        title: typeof title === "string" ? title.trim() : title,
        description: normalizedDescription,
        priority: priority === undefined ? DEFAULT_PRIORITY : priority,
        dueDate: dueDate === undefined ? null : dueDate,
        completed: false,
        completedAt: null,
    };

    if (
        !validateTitle(task.title) ||
        !validateDescription(task.description) ||
        !validatePriority(task.priority) ||
        !validateDueDate(task.dueDate)
    ) {
        return null;
    }

    return task;
}

window.TaskModel = {
    validateTitle,
    validateId,
    validateCreatedAt,
    validatePriority,
    validateDueDate,
    validateDescription,
    validateCompleted,
    validateCompletedAt,
    validateCompletion,
    validateTask,
    createTaskData,
};
