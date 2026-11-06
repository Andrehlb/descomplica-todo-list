(function () {
    const TASKS_CHANGED = "tasks:changed";

    // Armazena as funções inscritas para receber notificações.
    const subscribers = new Set();

    // Recebe o evento e notifia os inscritos.
    function handleTasksChanged(event) {
      subscribers.forEach(function (callback) {
        callback(event.detail);
      });
    }

    // Inscreve uma função para receber notificações.
    function subscribe(callback) {
      if (typeof callback !== "function") {
        throw new TypeError("O callback deve ser um função.");
      }

      subscribers.add(callback);

      // Cancela a inscrição quando for necessário.
      return function unsubscribe() {
        subscribers.delete(callback);
      };
    }

    // Escuta o evento de alteração de tarefas.
    window.addEventListener(TASKS_CHANGED, handleTasksChanged);

    // Dsiponibiliza o módulo para outros arquivos JavaScript.
    window.TaskEvents = {
      TASKS_CHANGED,
      subscribe,
    };
})(); // Estrutura IIFE (Immediately Invoked Function Expression) para encapsular o código e evitar poluição do escopo global.
