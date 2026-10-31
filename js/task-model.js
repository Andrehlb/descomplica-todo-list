function validateTitle(title) {
    return typeof title === "string" && title.trim().length > 0;
}

console.log("\n=== Testes: validateTitle() ===");

console.log(validateTitle ("Estudar Java Script"));
console.log(validateTitle(""));
console.log(validateTitle("  "));
console.log(validateTitle(123));
console.log(validateTitle(null));

function validatePriority(priority) {
    return ["high", "medium", "low"].includes(priority);
}

console.log("\n=== Testes: validatePriority() ===");

console.log(validatePriority("high"));
console.log(validatePriority("medium"));
console.log(validatePriority("low"));
console.log(validatePriority("urgent"));
console.log(validatePriority(null));

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

console.log("\n=== Testes: validateDueDate() ===");

console.log(validateDueDate("2026-10-28"));
console.log(validateDueDate(null));
console.log(validateDueDate("28/10/2026"));
console.log(validateDueDate("2026-1-5"));
console.log(validateDueDate(""));

console.log("\n=== Tetes: datas de calendário ===");

console.log(validateDueDate("2026-02-30"));
console.log(validateDueDate("2028-02-29"));
console.log(validateDueDate("2026-02-29"));
console.log(validateDueDate("2026-12-31"));
console.log(validateDueDate("2027-02-29"));
