function validateTitle(title) {
  return typeof title === "string" && title.trim().length > 0;
}

function validateId(id) {
  return typeof id === "string" && id.trim().length > 0;
}

function validateCreatedAt(createdAt) {
  if (typeof createdAt !== "string") {
    return false;
  }

  const date = new Date(createdAt);

  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(createdAt) &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString() === createdAt
  )
}

function validatePriority(priority) {
  return ["high", "medium", "low"].includes(priority);
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
  if (completedAt === null) {
    return true;
  }

  if (typeof completedAt !== "string") {
    return false;
  }

  const date = new Date(completedAt);

  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(completedAt) &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString() === completedAt
  );
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
  const task = {
    title: title,
    description: description || null,
    priority: priority,
    dueDate: dueDate,
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
