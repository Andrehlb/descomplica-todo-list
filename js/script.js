const taskForm = document.getElementById("task-form");

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();
    console.log("Formulário envaido!");
    const taskTitle = document.getElementById("task-title").value;
    const taskDescription = document.getElementById("task-description").value;
    const taskPriority = document.getElementById("task-priority").value;
    const taskDueDate = document.getElementById("task-due-date").value;

    console.log({
        taskTitle,
        taskDescription,
        taskPriority,
        taskDueDate,
    });

    const taskData = TaskModel.createTaskData(
        taskTitle,
        taskDescription,
        taskPriority,
        taskDueDate || null,
    );

    if (!taskData) {
        console.error("Dados inválidos. Tarefa não cadastrada.");
        return;
    }

    const createdTask = TaskStorage.createTask(taskData);

    if (!createdTask) {
        console.error("Não foi possível salvar a tarefa.");
        return;
    }

    console.log("Tarefa cadastrada:", createdTask);
});
