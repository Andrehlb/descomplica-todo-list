(function () {
  const FILTER_ALL = 'all';
  const STATUS_PENDING = 'pending';
  const STATUS_COMPLETED = 'completed';
  const VALID_PRIORITIES = Object.freeze(['low', 'medium', 'high']);
  const VALID_STATUSES = Object.freeze([STATUS_PENDING, STATUS_COMPLETED]);
  const ACCENT_MARKS_PATTERN = /[̀-ͯ]/g;

  function normalizeSearchText(text) {
    if (typeof text !== 'string') {
      return '';
    }

    return text
      .normalize('NFD')
      .replace(ACCENT_MARKS_PATTERN, '')
      .toLowerCase()
      .trim();
  }

  function isValidTask(task) {
    return typeof task === 'object' && task !== null;
  }

  function normalizeOption(value, validValues) {
    return validValues.includes(value) ? value : FILTER_ALL;
  }

  function normalizeCriteria(criteria) {
    const safeCriteria =
      typeof criteria === 'object' && criteria !== null ? criteria : {};

    return {
      searchText: normalizeSearchText(safeCriteria.searchText),
      priority: normalizeOption(safeCriteria.priority, VALID_PRIORITIES),
      status: normalizeOption(safeCriteria.status, VALID_STATUSES),
    };
  }

  function matchesSearchText(task, normalizedSearchText) {
    if (normalizedSearchText === '') {
      return true;
    }

    const searchableText = normalizeSearchText(
      `${normalizeSearchText(task.title)} ${normalizeSearchText(task.description)}`
    );

    return searchableText.includes(normalizedSearchText);
  }

  function matchesPriority(task, priority) {
    return priority === FILTER_ALL || task.priority === priority;
  }

  function matchesStatus(task, status) {
    if (status === FILTER_ALL) {
      return true;
    }

    const isCompleted = task.completed === true;

    return status === STATUS_COMPLETED ? isCompleted : !isCompleted;
  }

  function filterTasks(tasks, criteria) {
    if (!Array.isArray(tasks)) {
      return [];
    }

    const { searchText, priority, status } = normalizeCriteria(criteria);

    return tasks.filter(
      (task) =>
        isValidTask(task) &&
        matchesSearchText(task, searchText) &&
        matchesPriority(task, priority) &&
        matchesStatus(task, status)
    );
  }

  function countByStatus(tasks) {
    const validTasks = Array.isArray(tasks) ? tasks.filter(isValidTask) : [];
    const completed = validTasks.filter((task) => task.completed === true).length;

    return {
      total: validTasks.length,
      pending: validTasks.length - completed,
      completed,
    };
  }

  window.TaskFilters = {
    normalizeSearchText,
    filterTasks,
    countByStatus,
  };
})();
