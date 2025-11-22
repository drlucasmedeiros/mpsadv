// database.js - Sistema de Banco de Dados com IndexedDB
class Database {
    constructor() {
        this.dbName = 'MPSAdvogadosDB';
        this.version = 3;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Tabela de usuários/advogados
                if (!db.objectStoreNames.contains('advogados')) {
                    const advogadosStore = db.createObjectStore('advogados', { keyPath: 'username' });
                    advogadosStore.createIndex('email', 'email', { unique: true });
                    advogadosStore.createIndex('nome', 'nome', { unique: false });
                }

                // Tabela de leads
                if (!db.objectStoreNames.contains('leads')) {
                    const leadsStore = db.createObjectStore('leads', { keyPath: 'id', autoIncrement: true });
                    leadsStore.createIndex('advogado', 'advogado', { unique: false });
                    leadsStore.createIndex('data', 'timestamp', { unique: false });
                    leadsStore.createIndex('status', 'status', { unique: false });
                }

                // Tabela de prazos
                if (!db.objectStoreNames.contains('prazos')) {
                    const prazosStore = db.createObjectStore('prazos', { keyPath: 'id', autoIncrement: true });
                    prazosStore.createIndex('advogado', 'advogado', { unique: false });
                    prazosStore.createIndex('data', 'data', { unique: false });
                    prazosStore.createIndex('status', 'status', { unique: false });
                    prazosStore.createIndex('prioridade', 'prioridade', { unique: false });
                }

                // Tabela de processos
                if (!db.objectStoreNames.contains('processos')) {
                    const processosStore = db.createObjectStore('processos', { keyPath: 'id', autoIncrement: true });
                    processosStore.createIndex('numero', 'numero', { unique: true });
                    processosStore.createIndex('advogado', 'advogado', { unique: false });
                    processosStore.createIndex('cliente', 'cliente', { unique: false });
                    processosStore.createIndex('status', 'status', { unique: false });
                }
            };
        });
    }

    // Métodos genéricos CRUD
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName, indexName = null, query = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const target = indexName ? store.index(indexName) : store;
            const request = query ? target.getAll(query) : target.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, key, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put({ ...data, id: key });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // Métodos específicos para advogados
    async getAdvogado(username) {
        return this.get('advogados', username);
    }

    async getAllAdvogados() {
        return this.getAll('advogados');
    }

    async addAdvogado(advogado) {
        return this.add('advogados', advogado);
    }

    // Métodos específicos para leads
    async addLead(lead) {
        return this.add('leads', {
            ...lead,
            timestamp: new Date().toISOString(),
            status: 'nova'
        });
    }

    async getLeadsPorAdvogado(username) {
        const leads = await this.getAll('leads', 'advogado', username);
        return leads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    async getLeadsHoje(username) {
        const hoje = new Date().toDateString();
        const leads = await this.getLeadsPorAdvogado(username);
        return leads.filter(lead => 
            new Date(lead.timestamp).toDateString() === hoje
        );
    }

    // Métodos específicos para prazos
    async addPrazo(prazo) {
        return this.add('prazos', {
            ...prazo,
            status: 'pendente',
            criadoEm: new Date().toISOString()
        });
    }

    async getPrazosPorAdvogado(username) {
        const prazos = await this.getAll('prazos', 'advogado', username);
        return prazos.sort((a, b) => new Date(a.data) - new Date(b.data));
    }

    async updatePrazoStatus(prazoId, status) {
        const prazo = await this.get('prazos', prazoId);
        if (prazo) {
            prazo.status = status;
            prazo.concluidoEm = status === 'concluido' ? new Date().toISOString() : null;
            return this.update('prazos', prazoId, prazo);
        }
        return null;
    }

    async getPrazosProximos(username, dias = 7) {
        const hoje = new Date();
        const limite = new Date(hoje.getTime() + dias * 24 * 60 * 60 * 1000);
        const prazos = await this.getPrazosPorAdvogado(username);
        
        return prazos.filter(prazo => {
            const dataPrazo = new Date(prazo.data);
            return dataPrazo >= hoje && dataPrazo <= limite && prazo.status === 'pendente';
        });
    }

    async getPrazosAtrasados(username) {
        const hoje = new Date();
        const prazos = await this.getPrazosPorAdvogado(username);
        return prazos.filter(prazo => 
            new Date(prazo.data) < hoje && prazo.status === 'pendente'
        );
    }

    // Métodos específicos para processos
    async addProcesso(processo) {
        return this.add('processos', {
            ...processo,
            criadoEm: new Date().toISOString(),
            status: 'ativo'
        });
    }

    async getProcessosPorAdvogado(username) {
        return this.getAll('processos', 'advogado', username);
    }

    // Estatísticas
    async getEstatisticas(username) {
        const [leads, prazos, processos] = await Promise.all([
            this.getLeadsPorAdvogado(username),
            this.getPrazosPorAdvogado(username),
            this.getProcessosPorAdvogado(username)
        ]);

        const hoje = new Date();
        const prazosPendentes = prazos.filter(p => p.status === 'pendente');
        const prazosAtrasados = prazosPendentes.filter(p => new Date(p.data) < hoje);
        const prazosProximos = prazosPendentes.filter(p => {
            const dias = (new Date(p.data) - hoje) / (1000 * 60 * 60 * 24);
            return dias <= 7 && dias >= 0;
        });

        return {
            leads: {
                total: leads.length,
                hoje: leads.filter(l => new Date(l.timestamp).toDateString() === hoje.toDateString()).length
            },
            prazos: {
                total: prazos.length,
                pendentes: prazosPendentes.length,
                concluidos: prazos.filter(p => p.status === 'concluido').length,
                proximos: prazosProximos.length,
                atrasados: prazosAtrasados.length
            },
            processos: {
                total: processos.length,
                ativos: processos.filter(p => p.status === 'ativo').length
            }
        };
    }

    // Backup e restore
    async exportData() {
        const data = {
            advogados: await this.getAll('advogados'),
            leads: await this.getAll('leads'),
            prazos: await this.getAll('prazos'),
            processos: await this.getAll('processos'),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }

    async importData(jsonData) {
        const data = JSON.parse(jsonData);
        const stores = ['advogados', 'leads', 'prazos', 'processos'];
        
        for (const store of stores) {
            if (data[store]) {
                for (const item of data[store]) {
                    await this.add(store, item);
                }
            }
        }
    }
}

// Instância global do banco de dados
const database = new Database();

// Inicializar dados padrão
async function initializeDatabase() {
    try {
        await database.init();
        
        // Verificar se já existem advogados cadastrados
        const advogados = await database.getAllAdvogados();
        if (advogados.length === 0) {
            // Cadastrar advogados padrão
            const advogadosPadrao = [
                {
                    username: 'adv01',
                    password: 'mps2024',
                    nome: 'Dr. Carlos Silva',
                    email: 'carlos.silva@mpsadv.com.br',
                    especialidade: 'Direito Civil',
                    telefone: '(65) 3321-5001',
                    status: 'ativo',
                    permissoes: ['leads', 'prazos', 'processos']
                },
                {
                    username: 'adv02',
                    password: 'mps2024',
                    nome: 'Dra. Ana Costa',
                    email: 'ana.costa@mpsadv.com.br',
                    especialidade: 'Direito Trabalhista',
                    telefone: '(65) 3321-5002',
                    status: 'ativo',
                    permissoes: ['leads', 'prazos', 'processos']
                },
                {
                    username: 'admin',
                    password: 'admin123',
                    nome: 'Administrador',
                    email: 'admin@mpsadv.com.br',
                    especialidade: 'Gestão',
                    telefone: '(65) 3321-5000',
                    status: 'ativo',
                    permissoes: ['leads', 'prazos', 'processos', 'admin']
                }
            ];

            for (const advogado of advogadosPadrao) {
                await database.addAdvogado(advogado);
            }

            console.log('Banco de dados inicializado com dados padrão');
        }
    } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
    }
}

// Inicializar quando o script carregar
initializeDatabase();