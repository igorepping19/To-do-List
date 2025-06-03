// app.js

class IndexedDBHelper {
    constructor(dbName, storeName) {
        this.dbName = dbName;
        this.storeName = storeName;
        this.db = null;
    }

    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onupgradeneeded = (event) => {
                let db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error("Erro ao abrir o banco de dados:", event.target.error);
                reject(event.target.error);
            };
        });
    }

    addItem(item) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return reject(new Error("Banco de dados não aberto. Chame openDB() primeiro."));
            }
            const transaction = this.db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(item);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                console.error("Erro ao adicionar item:", request.error);
                reject(request.error);
            };
        });
    }

    updateItem(item) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return reject(new Error("Banco de dados não aberto. Chame openDB() primeiro."));
            }
            const transaction = this.db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(item); // 'put' é usado para atualizar (se o 'id' existir) ou adicionar

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                console.error("Erro ao atualizar item:", request.error);
                reject(request.error);
            };
        });
    }

    getAllItems() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return reject(new Error("Banco de dados não aberto. Chame openDB() primeiro."));
            }
            const transaction = this.db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                console.error("Erro ao obter todos os itens:", request.error);
                reject(request.error);
            };
        });
    }

    deleteItem(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return reject(new Error("Banco de dados não aberto. Chame openDB() primeiro."));
            }
            const transaction = this.db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => {
                console.error("Erro ao excluir item:", request.error);
                reject(request.error);
            };
        });
    }
}

class Tarefa {
    constructor(titulo, prioridade, concluida = false) {
        this.titulo = titulo;
        this.prioridade = prioridade;
        this.concluida = concluida;
    }
}

const dbHelper = new IndexedDBHelper('TarefasDB', 'tarefas');

// --- Funções de Manipulação da UI e do Banco de Dados ---

function adicionarTarefa() {
    const tituloInput = document.getElementById('titulo');
    const prioridadeInput = document.getElementById('prioridade');

    const titulo = tituloInput.value.trim();
    const prioridade = prioridadeInput.value;

    if (!titulo) {
        alert("O título da tarefa não pode ser vazio!");
        return;
    }

    const tarefa = new Tarefa(titulo, prioridade);
    dbHelper.addItem(tarefa)
        .then(() => {
            console.log("Tarefa adicionada!");
            tituloInput.value = ''; // Limpa o campo de título
            prioridadeInput.value = 'Baixa'; // Reseta a prioridade para o padrão
            listarTarefas();
        })
        .catch(error => {
            console.error("Erro ao adicionar tarefa:", error);
            alert("Não foi possível adicionar a tarefa. Verifique o console para detalhes.");
        });
}

function listarTarefas() {
    dbHelper.getAllItems()
        .then(tarefas => {
            const lista = document.getElementById('listaTarefas');
            lista.innerHTML = ''; // Limpa a lista existente

            if (tarefas.length === 0) {
                const li = document.createElement('li');
                li.textContent = "Nenhuma tarefa adicionada ainda!";
                li.style.fontStyle = 'italic';
                li.style.color = '#777';
                li.style.justifyContent = 'center';
                li.style.backgroundColor = '#f0f0f0'; // Cor de fundo para a mensagem
                lista.appendChild(li);
                return;
            }

            tarefas.forEach(tarefa => {
                const li = document.createElement('li');
                // Aplica a classe CSS 'concluida' se a tarefa estiver marcada
                if (tarefa.concluida) {
                    li.classList.add('concluida');
                }

                // Span para o título e prioridade
                const spanTitulo = document.createElement('span');
                spanTitulo.textContent = `${tarefa.titulo} (Prioridade: ${tarefa.prioridade})`;
                spanTitulo.style.flexGrow = '1';
                spanTitulo.style.textAlign = 'left';

                // Container para os botões
                const divBotoes = document.createElement('div');

                // Botão "Concluído" ou "Desfazer"
                const btnConcluir = document.createElement('button');
                btnConcluir.classList.add('btn-concluir'); // Adiciona classe para estilização

                if (tarefa.concluida) {
                    btnConcluir.textContent = "Desfazer";
                    btnConcluir.onclick = () => marcarConcluida(tarefa.id, false); // Passa 'false' para desfazer
                } else {
                    btnConcluir.textContent = "Concluído";
                    btnConcluir.onclick = () => marcarConcluida(tarefa.id, true); // Passa 'true' para marcar
                }

                // Botão Excluir
                const btnExcluir = document.createElement('button');
                btnExcluir.textContent = "Excluir";
                btnExcluir.onclick = () => excluirTarefa(tarefa.id);

                divBotoes.appendChild(btnConcluir);
                divBotoes.appendChild(btnExcluir);

                li.appendChild(spanTitulo);
                li.appendChild(divBotoes);
                lista.appendChild(li);
            });
        })
        .catch(error => {
            console.error("Erro ao listar tarefas:", error);
            alert("Erro ao carregar as tarefas. Por favor, recarregue a página.");
        });
}

function marcarConcluida(id, status) { // Agora recebe o status desejado (true/false)
    dbHelper.getAllItems()
        .then(tarefas => {
            const tarefaParaAtualizar = tarefas.find(t => t.id === id);

            if (tarefaParaAtualizar) {
                tarefaParaAtualizar.concluida = status; // Define o status diretamente

                dbHelper.updateItem(tarefaParaAtualizar)
                    .then(() => {
                        console.log(`Tarefa '${tarefaParaAtualizar.titulo}' status atualizado para: ${tarefaParaAtualizar.concluida}`);
                        listarTarefas(); // Recarrega a lista para mostrar a mudança
                    })
                    .catch(error => {
                        alert("Erro ao atualizar o status da tarefa.");
                        console.error("Erro ao atualizar status:", error);
                    });
            }
        })
        .catch(error => {
            console.error("Erro ao buscar tarefa para atualização:", error);
        });
}


function excluirTarefa(id) {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) { // Confirmação para evitar exclusões acidentais
        return;
    }
    dbHelper.deleteItem(id)
        .then(() => {
            console.log("Tarefa excluída!");
            listarTarefas();
        })
        .catch(error => {
            console.error("Erro ao excluir tarefa:", error);
            alert("Não foi possível excluir a tarefa. Verifique o console para detalhes.");
        });
}

document.addEventListener('DOMContentLoaded', () => {
    dbHelper.openDB()
        .then(() => {
            console.log("Banco de dados pronto! Carregando tarefas...");
            listarTarefas(); // Garante que as tarefas salvas sejam exibidas ao carregar a página
        })
        .catch(error => {
            console.error("Erro ao inicializar o banco de dados:", error);
            alert("Não foi possível inicializar o banco de dados. As tarefas podem não ser salvas ou carregadas.");
        });
});