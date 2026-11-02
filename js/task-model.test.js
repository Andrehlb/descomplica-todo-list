var {
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
} = window.TaskModel;

// === Testes ===

console.log("\n=== Testes: validateTitle() ===");

console.log(validateTitle("Estudar Java Script"));
console.log(validateTitle(""));
console.log(validateTitle("  "));
console.log(validateTitle(123));
console.log(validateTitle(null));

console.log("\n=== Testes: validateId() ===");

console.log(validateId("abc123"));
console.log(validateId(""));
console.log(validateId("  "));
console.log(validateId(123));
console.log(validateId(null));
console.log(validateId("123"));

console.log("\n=== Testes: validateCreatedAt() ===");

console.log(validateCreatedAt("2026-11-01T15:30:00.000Z"));
console.log(validateCreatedAt("2026-01-01T00:00:00.000Z"));
console.log(validateCreatedAt("2026-02-30T15:30:00.000Z"));
console.log(validateCreatedAt("2026-11-01"));
console.log(validateCreatedAt("data inválida"));
console.log(validateCreatedAt(null));
console.log(validateCreatedAt(123));

console.log("\n=== Testes: validatePriority() ===");

console.log(validatePriority("high"));
console.log(validatePriority("medium"));
console.log(validatePriority("low"));
console.log(validatePriority("urgent"));
console.log(validatePriority(null));

console.log("\n=== Testes: validateDueDate() ===");

console.log(validateDueDate("2026-10-28"));
console.log(validateDueDate(null));
console.log(validateDueDate("28/10/2026"));
console.log(validateDueDate("2026-1-5"));
console.log(validateDueDate(""));

console.log("\n=== Testes: datas de calendário ===");

console.log(validateDueDate("2026-02-30"));
console.log(validateDueDate("2028-02-29"));
console.log(validateDueDate("2026-02-29"));
console.log(validateDueDate("2026-12-31"));
console.log(validateDueDate("2027-02-29"));

console.log("\n=== Testes: validateDescription() ===");

console.log(validateDescription("Estudar JavaScript"));
console.log(validateDescription(""));
console.log(validateDescription(null));
console.log(validateDescription(undefined));
console.log(validateDescription(123));

console.log("\n=== Testes: validateCompleted() ===");

console.log(validateCompleted(true));
console.log(validateCompleted(false));
console.log(validateCompleted("true"));
console.log(validateCompleted(1));
console.log(validateCompleted(null));

console.log("\n=== Testes: validateCompletedAt() ===");

console.log(validateCompletedAt(null));
console.log(validateCompletedAt("2026-10-30T18:30:00.000Z"));
console.log(validateCompletedAt("2026-10-30"));
console.log(validateCompletedAt("data inválida"));
console.log(validateCompletedAt(123));
console.log(validateCompletedAt("2026-02-30T18:30:00.000Z"));

console.log("\n=== Testes: validateCompletion() ===");

console.log(validateCompletion(true, "2026-10-30T18:30:00.000Z"));
console.log(validateCompletion(false, null));
console.log(validateCompletion(true, null));
console.log(validateCompletion(false, "2026-10-30T18:30:00.000Z"));
console.log(validateCompletion("true", null));
console.log(validateCompletion(true, "data inválida"));

console.log("\n=== Testes: validate(task) ===");

const validTask = {
    title: "Estudar JavaScript",
    id: "abc123",
    description: "Revisar funções",
    priority: "medium",
    dueDate: "2026-11-02",
    createdAt: "2026-11-01T15:30:00.000Z",
    completed: false,
    completedAt: null
};

console.log(validateTask(validTask));

console.log(validateTask({
    ...validTask,
    title: ""
}));

console.log(validateTask({
    ...validTask,
    completed: true
}));

console.log(validateTask(null));

console.log("\n=== Testes: createTaskData() ===");

const newTask = createTaskData(
    "Estudar JavaScript",
    "Revisar funções",
    "medium",
    "2026-11-02"
);

console.log(newTask);
console.log(createTaskData("", "Descrição", "medium", "null"));
console.log(createTaskData("Estudar", "Descrição", "invalid", null));
console.log(createTaskData("Estudar", "Descrição", "high", "2026-02-30"));

console.log("\n=== Testes: campos obrigatórios ===");

console.log(validateTask({ ...validTask, id: "" }));
console.log(validateTask({ ...validTask, id: null }));
console.log(validateTask({ ...validTask, createdAt: null }));
console.log(validateTask({ ...validTask, createdAt: "data inválida" }));
console.log(validateTask({ ...validTask, createdAt: 123 }));