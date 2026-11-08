(function () {
  const STORAGE_KEY = 'descomplica-todo:tasks';
  const TASKS_CHANGED_EVENT = 'tasks:changed';
  const EDITABLE_FIELDS = [
    'title',
    'description',
    'priority',
    'dueDate',
    'completed',
  ];
  const CHANGE_TYPES = Object.freeze({
    created: 'created',
    updated: 'updated',
    deleted: 'deleted',
  });

  function logError(message, ...details) {
    console.error(`TaskStorage: ${message}`, ...details);
  }

  function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function currentTimestamp() {
    return new Date().toISOString();
  }

  function generateId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  function normalizeTitle(title) {
    return typeof title === 'string' ? title.trim() : title;
  }

  function normalizeOptionalField(value) {
    return value ?? null;
  }

  function readStoredTasks() {
    try {
      const rawTasks = window.localStorage.getItem(STORAGE_KEY);

      if (rawTasks === null) {
        return [];
      }

      const storedTasks = JSON.parse(rawTasks);

      if (!Array.isArray(storedTasks)) {
        logError('os dados salvos não são uma lista de tarefas.');
        return null;
      }

      return storedTasks;
    } catch (error) {
      logError('não foi possível ler as tarefas.', error);
      return null;
    }
  }

  function writeStoredTasks(tasks) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      logError('não foi possível salvar as tarefas.', error);
      return false;
    }
  }

  function emitTasksChanged(type, id) {
    window.dispatchEvent(
      new window.CustomEvent(TASKS_CHANGED_EVENT, { detail: { type, id } })
    );
  }

  function isValidTask(task) {
    const taskModel = window.TaskModel;

    if (!taskModel || typeof taskModel.validateTask !== 'function') {
      logError(
        'o TaskModel não está carregado, então a tarefa não pôde ser validada.'
      );
      return false;
    }

    return taskModel.validateTask(task);
  }

  function buildNewTask(taskData) {
    const timestamp = currentTimestamp();
    const completed = taskData.completed === true;

    return {
      id: generateId(),
      title: normalizeTitle(taskData.title),
      description: normalizeOptionalField(taskData.description),
      priority: taskData.priority,
      dueDate: normalizeOptionalField(taskData.dueDate),
      createdAt: timestamp,
      completed,
      completedAt: completed ? timestamp : null,
    };
  }

  function pickEditableChanges(changes) {
    const editableChanges = {};

    EDITABLE_FIELDS.forEach((field) => {
      if (Object.hasOwn(changes, field)) {
        editableChanges[field] = changes[field];
      }
    });

    return editableChanges;
  }

  function applyChanges(task, changes) {
    const updatedTask = { ...task, ...pickEditableChanges(changes) };

    updatedTask.title = normalizeTitle(updatedTask.title);
    updatedTask.description = normalizeOptionalField(updatedTask.description);
    updatedTask.dueDate = normalizeOptionalField(updatedTask.dueDate);

    if (updatedTask.completed !== task.completed) {
      updatedTask.completedAt =
        updatedTask.completed === true ? currentTimestamp() : null;
    }

    return updatedTask;
  }

  function getTasks() {
    const storedTasks = readStoredTasks();

    return storedTasks === null ? [] : storedTasks;
  }

  function getTaskById(id) {
    return getTasks().find((task) => task.id === id) ?? null;
  }

  function createTask(taskData) {
    if (!isPlainObject(taskData)) {
      return null;
    }

    const storedTasks = readStoredTasks();

    if (storedTasks === null) {
      return null;
    }

    const newTask = buildNewTask(taskData);

    if (!isValidTask(newTask)) {
      return null;
    }

    if (!writeStoredTasks([...storedTasks, newTask])) {
      return null;
    }

    emitTasksChanged(CHANGE_TYPES.created, newTask.id);
    return newTask;
  }

  function updateTask(id, changes) {
    if (!isPlainObject(changes)) {
      return null;
    }

    const storedTasks = readStoredTasks();

    if (storedTasks === null) {
      return null;
    }

    const taskIndex = storedTasks.findIndex((task) => task.id === id);

    if (taskIndex === -1) {
      return null;
    }

    const updatedTask = applyChanges(storedTasks[taskIndex], changes);

    if (!isValidTask(updatedTask)) {
      return null;
    }

    const updatedTasks = storedTasks.map((task, index) =>
      index === taskIndex ? updatedTask : task
    );

    if (!writeStoredTasks(updatedTasks)) {
      return null;
    }

    emitTasksChanged(CHANGE_TYPES.updated, id);
    return updatedTask;
  }

  function deleteTask(id) {
    const storedTasks = readStoredTasks();

    if (storedTasks === null) {
      return false;
    }

    const remainingTasks = storedTasks.filter((task) => task.id !== id);

    if (remainingTasks.length === storedTasks.length) {
      return false;
    }

    if (!writeStoredTasks(remainingTasks)) {
      return false;
    }

    emitTasksChanged(CHANGE_TYPES.deleted, id);
    return true;
  }

  window.TaskStorage = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
  };
})();
