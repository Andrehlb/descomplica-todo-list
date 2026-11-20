(function () {
  const PRIORITY_LEVELS = Object.freeze(['high', 'medium', 'low']);
  const PRIORITY_CSS_CLASS_PREFIX = 'task-card--priority-';
  const UNKNOWN_TIMESTAMP = 0;

  function isValidTask(task) {
    return typeof task === 'object' && task !== null;
  }

  function getPriorityRank(priority) {
    const rank = PRIORITY_LEVELS.indexOf(priority);

    return rank === -1 ? PRIORITY_LEVELS.length : rank;
  }

  function getCreationTimestamp(task) {
    const timestamp = new Date(task.createdAt).getTime();

    return Number.isNaN(timestamp) ? UNKNOWN_TIMESTAMP : timestamp;
  }

  function compareByPriorityThenNewest(first, second) {
    const rankDifference =
      getPriorityRank(first.priority) - getPriorityRank(second.priority);

    if (rankDifference !== 0) {
      return rankDifference;
    }

    return getCreationTimestamp(second) - getCreationTimestamp(first);
  }

  function sortByPriority(tasks) {
    if (!Array.isArray(tasks)) {
      return [];
    }

    return tasks.filter(isValidTask).sort(compareByPriorityThenNewest);
  }

  function countByPriority(tasks) {
    const counts = { high: 0, medium: 0, low: 0 };

    if (!Array.isArray(tasks)) {
      return counts;
    }

    tasks.forEach((task) => {
      if (
        isValidTask(task) &&
        task.completed === false &&
        PRIORITY_LEVELS.includes(task.priority)
      ) {
        counts[task.priority] += 1;
      }
    });

    return counts;
  }

  function getPriorityCssClass(priority) {
    return PRIORITY_LEVELS.includes(priority)
      ? `${PRIORITY_CSS_CLASS_PREFIX}${priority}`
      : '';
  }

  window.TaskPriority = {
    PRIORITY_LEVELS,
    getPriorityRank,
    sortByPriority,
    countByPriority,
    getPriorityCssClass,
  };
})();
