// database.js - Sistema de Banco de Dados com IndexedDB
class Database {
    constructor() {
        this.dbName = 'MPSAdvogadosDB';
        this.version = 4; // Incrementado para nova estrutura
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                this.migrateData();
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const oldVersion = event.oldVersion;
                
                // Tabela de usuários/advogados
                if (!db.objectStoreNames.contains('advogados')) {
                    const advogadosStore = db.createObjectStore('advogados', { keyPath: 'username' });
                    advogadosStore.createIndex('email', 'email', { unique: true });
                    advogadosStore.createIndex('nome', 'nome', { unique: false });
                    advogadosStore.createIndex('status', 'status', { unique: false });
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
                    processosStore.createIndex('area', 'area', { unique: false });
                }

                // Nova tabela de documentos
                if (!db.objectStoreNames.contains('documentos')) {
                    const documentosStore = db.createObjectStore('documentos', { keyPath: 'id', autoIncrement: true });
                    documentosStore.createIndex('processo', 'processoId', { unique: false });
                    documentosStore.createIndex('advogado', 'advogado', { unique: false });
                    documentosStore.createIndex('tipo', 'tipo', { unique: false });
                }

                // Nova tabela de atividades
                if (!db.objectStoreNames.contains('atividades')) {
                    const atividadesStore = db.createObjectStore('atividades', { keyPath: 'id', autoIncrement: true });
                    atividadesStore.createIndex('usuario', 'usuario', { unique: false });
                    atividadesStore.createIndex('data', 'timestamp', { unique: false });
                    atividadesStore.createIndex('tipo', 'tipo', { unique: false });
                }
            };
        });
    }

    async migrateData() {
        // Migração de dados se necessário
        console.log('Verificando migrações...');
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

    async getAdvogadosAtivos() {
        const advogados = await this.getAll('advogados');
        return advogados.filter(adv => adv.status === 'ativo');
    }

    async addAdvogado(advogado) {
        return this.add('advogados', advogado);
    }

    async updateAdvogado(username, data) {
        return this.update('advogados', username, data);
    }

    // Métodos específicos para leads
    async addLead(lead) {
        const leadData = {
            ...lead,
            timestamp: new Date().toISOString(),
            status: 'nova'
        };
        
        const result = await this.add('leads', leadData);
        await this.registrarAtividade('lead_adicionada', `Nova lead: ${lead.clientName}`, lead.advogado);
        return result;
    }

    async getLeadsPorAdvogado(username) {
        if (username === 'admin') {
            const leads = await this.getAll('leads');
            return leads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
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

    async updateLeadStatus(leadId, status) {
        const lead = await this.get('leads', leadId);
        if (lead) {
            lead.status = status;
            lead.atualizadoEm = new Date().toISOString();
            await this.registrarAtividade('lead_atualizada', `Lead ${lead.clientName} - ${status}`, lead.advogado);
            return this.update('leads', leadId, lead);
        }
        return null;
    }

    // Métodos específicos para prazos
    async addPrazo(prazo) {
        const prazoData = {
            ...prazo,
            status: 'pendente',
            criadoEm: new Date().toISOString()
        };
        
        const result = await this.add('prazos', prazoData);
        await this.registrarAtividade('prazo_adicionado', `Novo prazo: ${prazo.descricao}`, prazo.advogado);
        return result;
    }

    async getPrazosPorAdvogado(username) {
        if (username === 'admin') {
            const prazos = await this.getAll('prazos');
            return prazos.sort((a, b) => new Date(a.data) - new Date(b.data));
        }
        const prazos = await this.getAll('prazos', 'advogado', username);
        return prazos.sort((a, b) => new Date(a.data) - new Date(b.data));
    }

    async getTodosPrazos() {
        const prazos = await this.getAll('prazos');
        return prazos.sort((a, b) => new Date(a.data) - new Date(b.data));
    }

    async updatePrazoStatus(prazoId, status) {
        const prazo = await this.get('prazos', prazoId);
        if (prazo) {
            prazo.status = status;
            prazo.concluidoEm = status === 'concluido' ? new Date().toISOString() : null;
            await this.registrarAtividade('prazo_atualizado', `Prazo ${prazo.descricao} - ${status}`, prazo.advogado);
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
        const processoData = {
            ...processo,
            criadoEm: new Date().toISOString(),
            status: 'ativo'
        };
        
        const result = await this.add('processos', processoData);
        await this.registrarAtividade('processo_adicionado', `Novo processo: ${processo.numero}`, processo.advogado);
        return result;
    }

    async getProcessosPorAdvogado(username) {
        if (username === 'admin') {
            const processos = await this.getAll('processos');
            return processos.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
        }
        const processos = await this.getAll('processos', 'advogado', username);
        return processos.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
    }

    async updateProcessoStatus(processoId, status) {
        const processo = await this.get('processos', processoId);
        if (processo) {
            processo.status = status;
            processo.atualizadoEm = new Date().toISOString();
            await this.registrarAtividade('processo_atualizado', `Processo ${processo.numero} - ${status}`, processo.advogado);
            return this.update('processos', processoId, processo);
        }
        return null;
    }

    async getProcessosPorStatus(status) {
        const processos = await this.getAll('processos');
        return processos.filter(p => p.status === status);
    }

    async getProcessoPorNumero(numero) {
        const processos = await this.getAll('processos', 'numero', numero);
        return processos.length > 0 ? processos[0] : null;
    }

    // Métodos para documentos
    async addDocumento(documento) {
        const docData = {
            ...documento,
            uploadEm: new Date().toISOString()
        };
        
        const result = await this.add('documentos', docData);
        await this.registrarAtividade('documento_adicionado', `Novo documento: ${documento.nome}`, documento.advogado);
        return result;
    }

    async getDocumentosPorProcesso(processoId) {
        return this.getAll('documentos', 'processo', processoId);
    }

    async getDocumentosPorAdvogado(username) {
        if (username === 'admin') {
            return this.getAll('documentos');
        }
        return this.getAll('documentos', 'advogado', username);
    }

    // Métodos para atividades
    async registrarAtividade(tipo, descricao, usuario) {
        const atividade = {
            tipo,
            descricao,
            usuario,
            timestamp: new Date().toISOString()
        };
        return this.add('atividades', atividade);
    }

    async getAtividadesRecentes(limite = 50) {
        const atividades = await this.getAll('atividades');
        return atividades
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limite);
    }

    async getAtividadesPorUsuario(username) {
        const atividades = await this.getAll('atividades', 'usuario', username);
        return atividades.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Estatísticas
    async getEstatisticas(username) {
        const [leads, prazos, processos, atividades] = await Promise.all([
            this.getLeadsPorAdvogado(username),
            this.getPrazosPorAdvogado(username),
            this.getProcessosPorAdvogado(username),
            this.getAtividadesPorUsuario(username)
        ]);

        const hoje = new Date();
        const prazosPendentes = prazos.filter(p => p.status === 'pendente');
        const prazosAtrasados = prazosPendentes.filter(p => new Date(p.data) < hoje);
        const prazosProximos = prazosPendentes.filter(p => {
            const dias = (new Date(p.data) - hoje) / (1000 * 60 * 60 * 24);
            return dias <= 7 && dias >= 0;
        });

        const atividadesHoje = atividades.filter(a => 
            new Date(a.timestamp).toDateString() === hoje.toDateString()
        );

        return {
            leads: {
                total: leads.length,
                hoje: leads.filter(l => new Date(l.timestamp).toDateString() === hoje.toDateString()).length,
                novas: leads.filter(l => l.status === 'nova').length
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
                ativos: processos.filter(p => p.status === 'ativo').length,
                arquivados: processos.filter(p => p.status === 'arquivado').length,
                concluidos: processos.filter(p => p.status === 'concluido').length
            },
            atividades: {
                total: atividades.length,
                hoje: atividadesHoje.length
            }
        };
    }

    async getEstatisticasGerais() {
        const [advogados, leads, prazos, processos] = await Promise.all([
            this.getAllAdvogados(),
            this.getAll('leads'),
            this.getAll('prazos'),
            this.getAll('processos')
        ]);

        const hoje = new Date();
        const prazosAtrasados = prazos.filter(p => 
            new Date(p.data) < hoje && p.status === 'pendente'
        );

        return {
            advogados: {
                total: advogados.length,
                ativos: advogados.filter(a => a.status === 'ativo').length
            },
            leads: {
                total: leads.length,
                hoje: leads.filter(l => new Date(l.timestamp).toDateString() === hoje.toDateString()).length
            },
            prazos: {
                total: prazos.length,
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
            documentos: await this.getAll('documentos'),
            atividades: await this.getAll('atividades'),
            exportDate: new Date().toISOString(),
            version: this.version
        };
        return JSON.stringify(data, null, 2);
    }

    async importData(jsonData) {
        const data = JSON.parse(jsonData);
        const stores = ['advogados', 'leads', 'prazos', 'processos', 'documentos', 'atividades'];
        
        // Limpar dados existentes
        for (const store of stores) {
            const transaction = this.db.transaction([store], 'readwrite');
            const objectStore = transaction.objectStore(store);
            await new Promise((resolve, reject) => {
                const request = objectStore.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
        
        // Adicionar novos dados
        for (const store of stores) {
            if (data[store]) {
                for (const item of data[store]) {
                    await this.add(store, item);
                }
            }
        }
        
        await this.registrarAtividade('sistema_restaurado', 'Backup do sistema restaurado', 'admin');
    }

    // Busca global
    async buscarGlobal(termo) {
        const [leads, prazos, processos] = await Promise.all([
            this.getAll('leads'),
            this.getAll('prazos'),
            this.getAll('processos')
        ]);

        termo = termo.toLowerCase();
        
        const resultados = {
            leads: leads.filter(lead => 
                lead.clientName.toLowerCase().includes(termo) ||
                lead.caseType.toLowerCase().includes(termo) ||
                (lead.caseDescription && lead.caseDescription.toLowerCase().includes(termo))
            ),
            prazos: prazos.filter(prazo =>
                prazo.cliente.toLowerCase().includes(termo) ||
                prazo.descricao.toLowerCase().includes(termo) ||
                prazo.processo.toLowerCase().includes(termo)
            ),
            processos: processos.filter(processo =>
                processo.numero.toLowerCase().includes(termo) ||
                processo.cliente.toLowerCase().includes(termo) ||
                processo.descricao.toLowerCase().includes(termo)
            )
        };

        return resultados;
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
                    permissoes: ['leads', 'prazos', 'processos', 'documentos'],
                    criadoEm: new Date().toISOString()
                },
                {
                    username: 'adv02',
                    password: 'mps2024',
                    nome: 'Dra. Ana Costa',
                    email: 'ana.costa@mpsadv.com.br',
                    especialidade: 'Direito Trabalhista',
                    telefone: '(65) 3321-5002',
                    status: 'ativo',
                    permissoes: ['leads', 'prazos', 'processos', 'documentos'],
                    criadoEm: new Date().toISOString()
                },
                {
                    username: 'admin',
                    password: 'admin123',
                    nome: 'Administrador',
                    email: 'admin@mpsadv.com.br',
                    especialidade: 'Gestão',
                    telefone: '(65) 3321-5000',
                    status: 'ativo',
                    permissoes: ['leads', 'prazos', 'processos', 'documentos', 'admin'],
                    criadoEm: new Date().toISOString()
                }
            ];

            for (const advogado of advogadosPadrao) {
                await database.addAdvogado(advogado);
            }

            // Adicionar atividade inicial
            await database.registrarAtividade('sistema_inicializado', 'Sistema iniciado com dados padrão', 'admin');

            console.log('Banco de dados inicializado com dados padrão');
        }
    } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
    }
}

// Inicializar quando o script carregar
initializeDatabase();