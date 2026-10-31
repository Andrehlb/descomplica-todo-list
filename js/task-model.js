function validateTitle(title) {
  return typeof title === "string" && title.trim().length > 0;
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
    validateDescription(task.description) &&
    validatePriority(task.priority) &&
    validateDueDate(task.dueDate) &&
    validateCompletion(task.completed, task.completedAt)
  );
}

module.exports = {
  validateTitle,
  validatePriority,
  validateDueDate,
  validateDescription,
  validateCompleted,
  validateCompletedAt,
  validateCompletion,
  validateTask,
};
