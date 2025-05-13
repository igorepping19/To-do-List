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

            request.onerror = (event) => reject(event.target.error); 
        });
    }

    addItem(item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName); 
            const request = store.add(item); 
            request.onsuccess = () => resolve(request.result); 
            request.onerror = () => reject(request.error); 
        });
    }

    getAllItems() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, 'readonly'); 
            const store = transaction.objectStore(this.storeName); 
            const request = store.getAll(); 

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error); 
        });
    }

    deleteItem(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, 'readwrite'); 
            const store = transaction.objectStore(this.storeName); 
            const request = store.delete(id); 

            request.onsuccess = () => resolve(); 
            request.onerror = () => reject(request.error); 
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

dbHelper.openDB().then(() => {
    console.log("Banco de dados pronto!"); 
});

function adicionarTarefa() {
    const titulo = document.getElementById('titulo').value; 
    const prioridade = document.getElementById('prioridade').value; 
    
    const tarefa = new Tarefa(titulo, prioridade); 
    dbHelper.addItem(tarefa).then(() => { 
        console.log("Tarefa adicionada!"); 
        listarTarefas(); 
    });
}

function listarTarefas() {
    dbHelper.getAllItems().then(tarefas => {
        const lista = document.getElementById('listaTarefas'); 
        lista.innerHTML = ''; 
        tarefas.forEach(tarefa => { 
            const li = document.createElement('li'); 
            li.textContent = `${tarefa.titulo} - Prioridade: ${tarefa.prioridade}`; 

            const btnExcluir = document.createElement('button');
            btnExcluir.textContent = "Excluir";
            btnExcluir.onclick = () => excluirTarefa(tarefa.id);

            li.appendChild(btnExcluir);
            lista.appendChild(li);
        });
    });
}

function excluirTarefa(id) {
    dbHelper.deleteItem(id).then(() => { 
        console.log("Tarefa excluída!");
        listarTarefas();
    });
}