(function () {
  const LIST_ID = 'tasks-list';
  const EMPTY_MESSAGE_ID = 'tasks-empty';
  const TOGGLE_COMPLETION_ACTION = 'toggle-complete';
  const COMPLETED_CARD_CLASS = 'task-card--completed';
  const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
  const PRIORITY_LABELS = Object.freeze({
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
  });

  function sortTasksByNewest(tasks) {
    return [...tasks].sort(
      (first, second) => new Date(second.createdAt) - new Date(first.createdAt)
    );
  }

  function parseTaskId(value) {
    const text = String(value);

    if (!POSITIVE_INTEGER_PATTERN.test(text)) {
      return null;
    }

    const taskId = Number(text);

    return Number.isSafeInteger(taskId) ? taskId : null;
  }

  function getPriorityLabel(priority) {
    return PRIORITY_LABELS[priority] ?? '';
  }

  function formatDueDate(dueDate) {
    if (typeof dueDate !== 'string') {
      return '';
    }

    const [year, month, day] = dueDate.split('-');

    return year && month && day ? `${day}/${month}/${year}` : '';
  }

  function formatCompletedAt(completedAt) {
    if (typeof completedAt !== 'string') {
      return '';
    }

    const completionDate = new Date(completedAt);

    return Number.isNaN(completionDate.getTime())
      ? ''
      : completionDate.toLocaleDateString('pt-BR');
  }

  function createTextElement(tagName, text, className) {
    const element = window.document.createElement(tagName);
    element.textContent = text;

    if (className) {
      element.className = className;
    }

    return element;
  }

  function createCompletionControl(task) {
    const checkboxId = `task-complete-${task.id}`;
    const wrapper = window.document.createElement('div');
    const checkbox = window.document.createElement('input');
    const label = createTextElement('label', 'Concluída');

    checkbox.type = 'checkbox';
    checkbox.id = checkboxId;
    checkbox.checked = task.completed;
    checkbox.dataset.action = TOGGLE_COMPLETION_ACTION;
    checkbox.dataset.taskId = task.id;
    label.htmlFor = checkboxId;

    wrapper.append(checkbox, label);
    return wrapper;
  }

  function createActionButton(action, text, taskId) {
    const button = createTextElement('button', text);

    button.type = 'button';
    button.dataset.action = action;
    button.dataset.taskId = taskId;

    return button;
  }

  function createDetails(task) {
    const details = window.document.createElement('p');
    const dueDate = formatDueDate(task.dueDate);
    const completedAt = formatCompletedAt(task.completedAt);
    const parts = [`Prioridade: ${getPriorityLabel(task.priority)}`];

    if (dueDate) {
      parts.push(`Prazo: ${dueDate}`);
    }

    if (completedAt) {
      parts.push(`Concluída em: ${completedAt}`);
    }

    details.textContent = parts.join(' · ');
    return details;
  }

  function createTaskCard(task) {
    const card = window.document.createElement('li');

    card.className = 'task-card';
    card.dataset.taskId = task.id;
    card.classList.toggle(COMPLETED_CARD_CLASS, task.completed);

    card.append(createTextElement('h3', task.title));

    if (task.description) {
      card.append(createTextElement('p', task.description));
    }

    card.append(
      createDetails(task),
      createCompletionControl(task),
      createActionButton('edit', 'Editar', task.id),
      createActionButton('delete', 'Excluir', task.id)
    );

    return card;
  }

  function renderTasks() {
    const list = window.document.getElementById(LIST_ID);
    const emptyMessage = window.document.getElementById(EMPTY_MESSAGE_ID);
    const tasks = sortTasksByNewest(window.TaskStorage.getTasks());

    list.replaceChildren(...tasks.map(createTaskCard));
    emptyMessage.hidden = tasks.length > 0;
  }

  function handleCompletionChange(event) {
    const { target } = event;

    if (target.dataset.action !== TOGGLE_COMPLETION_ACTION) {
      return;
    }

    const taskId = parseTaskId(target.dataset.taskId);

    if (taskId === null) {
      return;
    }

    const updatedTask = window.TaskStorage.updateTask(taskId, {
      completed: target.checked,
    });

    if (updatedTask === null) {
      renderTasks();
    }
  }

  function initialize() {
    const list = window.document.getElementById(LIST_ID);

    list.addEventListener('change', handleCompletionChange);
    window.TaskEvents.subscribe(renderTasks);
    renderTasks();
  }

  function initializeWhenPageIsReady() {
    if (!window.document) {
      return;
    }

    if (window.document.readyState === 'loading') {
      window.document.addEventListener('DOMContentLoaded', initialize);
      return;
    }

    initialize();
  }

  window.TaskList = {
    sortTasksByNewest,
    parseTaskId,
    getPriorityLabel,
    formatDueDate,
    formatCompletedAt,
    renderTasks,
  };

  initializeWhenPageIsReady();
})();
