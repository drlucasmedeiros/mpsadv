// prazos.js - Sistema de Controle de Prazos e Audiências
class PrazosSystem {
    constructor() {
        this.prazos = this.loadPrazos();
        this.initSampleData();
    }

    loadPrazos() {
        const stored = localStorage.getItem('mps_prazos');
        return stored ? JSON.parse(stored) : [];
    }

    savePrazos() {
        localStorage.setItem('mps_prazos', JSON.stringify(this.prazos));
    }

    initSampleData() {
        // Dados de exemplo se não houver prazos
        if (this.prazos.length === 0) {
            const samplePrazos = [
                {
                    id: 1,
                    processo: '0012345-56.2023.8.11.0001',
                    cliente: 'João Silva',
                    tipo: 'audiência',
                    descricao: 'Audiência de Conciliação',
                    data: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // +5 dias
                    advogado: 'adv01',
                    status: 'pendente',
                    prioridade: 'alta',
                    criadoEm: new Date().toISOString()
                },
                {
                    id: 2,
                    processo: '0023456-78.2023.8.11.0001',
                    cliente: 'Maria Santos',
                    tipo: 'prazo',
                    descricao: 'Prazo para Contestação',
                    data: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // +2 dias
                    advogado: 'adv02',
                    status: 'pendente',
                    prioridade: 'urgente',
                    criadoEm: new Date().toISOString()
                }
            ];
            this.prazos = samplePrazos;
            this.savePrazos();
        }
    }

    adicionarPrazo(prazoData) {
        const prazo = {
            id: Date.now(),
            status: 'pendente',
            criadoEm: new Date().toISOString(),
            ...prazoData
        };
        
        this.prazos.push(prazo);
        this.savePrazos();
        return prazo;
    }

    getPrazosPorAdvogado(username) {
        return this.prazos
            .filter(prazo => prazo.advogado === username)
            .sort((a, b) => new Date(a.data) - new Date(b.data));
    }

    getPrazosProximos(username, dias = 7) {
        const hoje = new Date();
        const limite = new Date(hoje.getTime() + dias * 24 * 60 * 60 * 1000);
        
        return this.getPrazosPorAdvogado(username)
            .filter(prazo => {
                const dataPrazo = new Date(prazo.data);
                return dataPrazo >= hoje && dataPrazo <= limite && prazo.status === 'pendente';
            });
    }

    getPrazosAtrasados(username) {
        const hoje = new Date();
        return this.getPrazosPorAdvogado(username)
            .filter(prazo => new Date(prazo.data) < hoje && prazo.status === 'pendente');
    }

    marcarConcluido(prazoId) {
        const prazo = this.prazos.find(p => p.id === prazoId);
        if (prazo) {
            prazo.status = 'concluido';
            prazo.concluidoEm = new Date().toISOString();
            this.savePrazos();
            return true;
        }
        return false;
    }

    editarPrazo(prazoId, novosDados) {
        const prazoIndex = this.prazos.findIndex(p => p.id === prazoId);
        if (prazoIndex !== -1) {
            this.prazos[prazoIndex] = { ...this.prazos[prazoIndex], ...novosDados };
            this.savePrazos();
            return true;
        }
        return false;
    }

    excluirPrazo(prazoId) {
        const prazoIndex = this.prazos.findIndex(p => p.id === prazoId);
        if (prazoIndex !== -1) {
            this.prazos.splice(prazoIndex, 1);
            this.savePrazos();
            return true;
        }
        return false;
    }

    getEstatisticas(username) {
        const prazosAdvogado = this.getPrazosPorAdvogado(username);
        const hoje = new Date();
        
        return {
            total: prazosAdvogado.length,
            pendentes: prazosAdvogado.filter(p => p.status === 'pendente').length,
            concluidos: prazosAdvogado.filter(p => p.status === 'concluido').length,
            proximos: prazosAdvogado.filter(p => 
                new Date(p.data) >= hoje && 
                new Date(p.data) <= new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000) &&
                p.status === 'pendente'
            ).length,
            atrasados: prazosAdvogado.filter(p => 
                new Date(p.data) < hoje && p.status === 'pendente'
            ).length
        };
    }

    calcularDiasRestantes(dataPrazo) {
        const hoje = new Date();
        const prazo = new Date(dataPrazo);
        const diffTime = prazo - hoje;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    getPrioridadeColor(prioridade) {
        const colors = {
            'baixa': '#4CAF50',
            'normal': '#2196F3',
            'alta': '#FF9800',
            'urgente': '#F44336'
        };
        return colors[prioridade] || '#666';
    }

    getTipoIcon(tipo) {
        const icons = {
            'audiência': 'fas fa-gavel',
            'prazo': 'fas fa-clock',
            'protocolo': 'fas fa-file-contract',
            'sentença': 'fas fa-balance-scale',
            'recurso': 'fas fa-redo'
        };
        return icons[tipo] || 'fas fa-calendar';
    }
}

// Instância global do sistema de prazos
const prazosSystem = new PrazosSystem();