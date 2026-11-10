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
    id: 1,
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
// Testa a rejeição de título vazio.
console.log(createTaskData("", "Descrição", "medium", null));
// Testa a rejeição de prazo inválido.
console.log(createTaskData("Estudar", "Descrição", "medium", "null"));
console.log(createTaskData("Estudar", "Descrição", "invalid", null));
console.log(createTaskData("Estudar", "Descrição", "high", "2026-02-30"));
// Verifica a remoção de espaços extras no título.
console.log(createTaskData(" Estudar JavaScript ", null, "medium", null));
// Verifica a remoção de espaços extras na descrição.
console.log(createTaskData("Estudar JavaScript", "   Revisar funções   ", "medium", null));
console.log(createTaskData("Estudar JavaScript", "   ", "medium", null));
console.log(createTaskData("Estudar JavaScript", null, "medium", null));
console.log(createTaskData("Estudar JavaScript", undefined, "medium", null));
// Verifica o prazo não informado.
console.log(createTaskData("Estudar JavaScript", null, "medium", undefined));

console.log("\n=== Testes: campos obrigatórios ===");

console.log(validateTask({ ...validTask, id: "" }));
console.log(validateTask({ ...validTask, id: null }));
console.log(validateTask({ ...validTask, createdAt: null }));
console.log(validateTask({ ...validTask, createdAt: "data inválida" }));
console.log(validateTask({ ...validTask, createdAt: 123 }));

// Asserções complementares: comparar explicitamente preserva false, null e 0.
function checkExpected(label, actual, expected) {
    console.log(label, { actual, expected });
    console.assert(actual === expected, label, { actual, expected });
}

const validationCases = [
    ["Título", validateTitle, ["Tarefa"], ["", "   ", null, undefined, false, 0, 123, {}, []]],
    ["ID", validateId, [1, 123], ["abc123", "123", "", "   ", null, undefined, false, 0, {}, []]],
    ["Criação ISO", validateCreatedAt, ["2026-11-01T15:30:00.000Z"],
        [null, undefined, false, 0, "", "2026-02-30T15:30:00.000Z", "2026-11-01", "2026-11-01T15:30:00Z"]],
    ["Prioridade", validatePriority, ["high", "medium", "low"],
        [null, undefined, false, 0, "", "urgent", "HIGH", " medium "]],
    ["Prazo", validateDueDate, [null, "2028-02-29", "2026-12-31", "0099-01-01"],
        [undefined, false, 0, "", "2026-02-30", "2026-02-29", "2027-02-29", "2026-00-01", "2026-13-01", "2026-01-00", "2026-1-5"]],
    ["Descrição", validateDescription, ["Descrição", "", "   ", null, undefined],
        [false, true, 0, 123, NaN, {}, []]],
    ["Conclusão booleana", validateCompleted, [true, false],
        [null, undefined, 0, 1, "true", "false", {}, []]],
    ["Conclusão ISO", validateCompletedAt, [null, "2026-10-30T18:30:00.000Z"],
        [undefined, false, 0, "", "2026-10-30", "data inválida", "2026-02-30T18:30:00.000Z"]],
];

validationCases.forEach(function ([label, validate, accepted, rejected]) {
    accepted.forEach(function (input) {
        console.log(label, { input });
        checkExpected(label + ": aceitar entrada", validate(input), true);
    });
    rejected.forEach(function (input) {
        console.log(label, { input });
        checkExpected(label + ": rejeitar entrada", validate(input), false);
    });
});

[
    [true, "2026-10-30T18:30:00.000Z", true],
    [false, null, true],
    [true, null, false],
    [false, "2026-10-30T18:30:00.000Z", false],
    ["true", null, false],
    [0, null, false],
    [true, "data inválida", false],
    [false, undefined, false],
].forEach(function ([completed, completedAt, expected]) {
    console.log("Coerência da conclusão", { completed, completedAt });
    checkExpected("Coerência da conclusão", validateCompletion(completed, completedAt), expected);
});

checkExpected("Objeto de tarefa válido", validateTask(validTask), true);
[null, undefined, false, 0, "", [], {}].forEach(function (input) {
    checkExpected("Objeto de tarefa inválido", validateTask(input), false);
});
[
    { title: "" },
    { id: "" },
    { id: null },
    { description: 0 },
    { priority: "urgent" },
    { dueDate: "2026-02-30" },
    { createdAt: null },
    { createdAt: "data inválida" },
    { createdAt: 123 },
    { completed: true },
    { completed: 0 },
    { completedAt: "2026-10-30T18:30:00.000Z" },
].forEach(function (changes) {
    console.log("Campos inválidos", changes);
    checkExpected("Rejeitar tarefa com campo inválido", validateTask({ ...validTask, ...changes }), false);
});

const expectedTaskData = {
    title: "Estudar JavaScript",
    description: "Revisar funções",
    priority: "medium",
    dueDate: "2026-11-02",
    completed: false,
    completedAt: null,
};
checkExpected("Quantidade de campos criados", Object.keys(newTask).length, Object.keys(expectedTaskData).length);
Object.keys(expectedTaskData).forEach(function (field) {
    checkExpected("Criação: " + field, newTask[field], expectedTaskData[field]);
});

["", "   ", null, undefined, false, 0, {}, []].forEach(function (title) {
    checkExpected("Título inválido impede criação", createTaskData(title, null, "medium", null), null);
});
[false, 0, NaN, {}, []].forEach(function (description) {
    checkExpected("Descrição inválida impede criação", createTaskData("Tarefa", description, "medium", null), null);
});
["invalid", "", null, false, 0].forEach(function (priority) {
    checkExpected("Prioridade inválida impede criação", createTaskData("Tarefa", null, priority, null), null);
});

checkExpected("Prioridade omitida recebe medium", createTaskData("Tarefa", null, undefined, null).priority, "medium");

["null", "", "2026-02-30", false, 0].forEach(function (dueDate) {
    checkExpected("Prazo inválido impede criação", createTaskData("Tarefa", null, "medium", dueDate), null);
});

const trimmedTask = createTaskData(" Estudar JavaScript ", "   Revisar funções   ", "medium", null);
checkExpected("Título normalizado", trimmedTask.title, "Estudar JavaScript");
checkExpected("Descrição normalizada", trimmedTask.description, "Revisar funções");
[null, undefined, "", "   "].forEach(function (description) {
    const task = createTaskData("Tarefa", description, "medium");
    checkExpected("Descrição opcional normalizada", task.description, description == null ? null : "");
    checkExpected("Prazo omitido normalizado", task.dueDate, null);
    checkExpected("Tarefa começa pendente", task.completed, false);
    checkExpected("Tarefa começa sem data de conclusão", task.completedAt, null);
    checkExpected("Descrição vazia tem comprimento zero", (task.description ?? "").length, 0);
});
