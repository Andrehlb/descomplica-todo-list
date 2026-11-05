(function () {
  const STORAGE_KEY = 'descomplica.tasks';
  const EVENT_NAME = 'tasks:changed';

  const PROTECTED_FIELDS = ['id', 'createdAt', 'completedAt'];

  function generateId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  function readAll() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('TaskStorage: não foi possível ler as tarefas.', error);
      return [];
    }
  }

  function writeAll(tasks) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error('TaskStorage: não foi possível salvar as tarefas.', error);
      return false;
    }
  }

  function emitChange(type, id) {
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, { detail: { type: type, id: id } })
    );
  }

  function isValidTask(task) {
    if (
      window.TaskModel &&
      typeof window.TaskModel.validateTask === 'function'
    ) {
      return window.TaskModel.validateTask(task);
    }
    return true;
  }

  function getTasks() {
    return readAll();
  }

  function getTaskById(id) {
    return (
      readAll().find(function (task) {
        return task.id === id;
      }) || null
    );
  }

  function createTask(taskData) {
    if (
      taskData === null ||
      typeof taskData !== 'object' ||
      Array.isArray(taskData)
    ) {
      return null;
    }

    const completed = taskData.completed === true;
    const now = new Date().toISOString();

    const task = {
      id: generateId(),
      title: taskData.title,
      description: taskData.description == null ? null : taskData.description,
      priority: taskData.priority,
      dueDate: taskData.dueDate === undefined ? null : taskData.dueDate,
      createdAt: now,
      completed: completed,
      completedAt: completed ? now : null,
    };

    if (!isValidTask(task)) {
      return null;
    }

    const tasks = readAll();
    tasks.push(task);

    if (!writeAll(tasks)) {
      return null;
    }

    emitChange('created', task.id);
    return task;
  }

  function updateTask(id, changes) {
    if (
      changes === null ||
      typeof changes !== 'object' ||
      Array.isArray(changes)
    ) {
      return null;
    }

    const tasks = readAll();
    const index = tasks.findIndex(function (task) {
      return task.id === id;
    });

    if (index === -1) {
      return null;
    }

    const current = tasks[index];
    const updated = Object.assign({}, current);

    Object.keys(changes).forEach(function (field) {
      if (!PROTECTED_FIELDS.includes(field)) {
        updated[field] = changes[field];
      }
    });

    if (updated.completed !== current.completed) {
      updated.completedAt =
        updated.completed === true ? new Date().toISOString() : null;
    }

    if (!isValidTask(updated)) {
      return null;
    }

    tasks[index] = updated;

    if (!writeAll(tasks)) {
      return null;
    }

    emitChange('updated', id);
    return updated;
  }

  function deleteTask(id) {
    const tasks = readAll();
    const remaining = tasks.filter(function (task) {
      return task.id !== id;
    });

    if (remaining.length === tasks.length) {
      return false;
    }

    if (!writeAll(remaining)) {
      return false;
    }
    emitChange('deleted', id);
    return true;
  }

  window.TaskStorage = {
    getTasks: getTasks,
    getTaskById: getTaskById,
    createTask: createTask,
    updateTask: updateTask,
    deleteTask: deleteTask,
  };
})();
