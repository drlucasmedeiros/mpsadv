// intranet.js - Sistema Principal da Intranet
class IntranetSystem {
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }

    async init() {
        // Verificar autenticação
        if (authSystem.isLoggedIn()) {
            this.showIntranet();
            await this.loadDashboard();
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('intranetPage').style.display = 'none';
    }

    showIntranet() {
        const user = authSystem.getUser();
        
        // Atualizar informações do usuário
        document.getElementById('userName').textContent = user.nome;
        document.getElementById('userRole').textContent = user.especialidade;
        
        // Mostrar/ocultar menu admin
        if (authSystem.isAdmin()) {
            document.getElementById('adminNav').style.display = 'flex';
        }
        
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('intranetPage').style.display = 'flex';
    }

    async showSection(sectionName) {
        // Ocultar todas as seções
        document.querySelectorAll('.page-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Remover active de todos os itens do menu
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Mostrar seção selecionada
        document.getElementById(sectionName + 'Section').style.display = 'block';
        
        // Marcar item do menu como active
        const navItem = document.querySelector(`.nav-item:nth-child(${this.getNavIndex(sectionName)})`);
        if (navItem) navItem.classList.add('active');
        
        // Atualizar título da página
        this.updatePageTitle(sectionName);
        
        // Carregar dados da seção
        await this.loadSectionData(sectionName);
    }

    getNavIndex(sectionName) {
        const sections = ['dashboard', 'leads', 'prazos', 'processos', 'documentos', 'advogados', 'relatorios', 'configuracoes'];
        return sections.indexOf(sectionName) + 1;
    }

    updatePageTitle(sectionName) {
        const titles = {
            'dashboard': 'Dashboard',
            'leads': 'Indicações',
            'prazos': 'Controle de Prazos',
            'processos': 'Processos',
            'documentos': 'Documentos',
            'advogados': 'Advogados',
            'relatorios': 'Relatórios',
            'configuracoes': 'Configurações'
        };
        
        document.getElementById('pageTitle').textContent = titles[sectionName] || 'Intranet';
    }

    async loadSectionData(sectionName) {
        const user = authSystem.getUser();
        
        switch(sectionName) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'leads':
                await this.loadLeads();
                break;
            case 'prazos':
                await this.loadPrazos();
                break;
            case 'processos':
                await this.loadProcessos();
                break;
            case 'advogados':
                if (authSystem.isAdmin()) {
                    await this.loadAdvogados();
                }
                break;
        }
    }

    async loadDashboard() {
        const user = authSystem.getUser();
        const stats = await database.getEstatisticas(user.username);
        
        // Atualizar badges do menu
        document.getElementById('leadsBadge').textContent = stats.leads.hoje;
        document.getElementById('prazosBadge').textContent = stats.prazos.proximos + stats.prazos.atrasados;
        document.getElementById('processosBadge').textContent = stats.processos.ativos;
        
        // Atualizar estatísticas do dashboard
        const statsGrid = document.getElementById('dashboardStats');
        statsGrid.innerHTML = `
            <div class="card stat-card">
                <div class="stat-number">${stats.leads.hoje}</div>
                <div class="stat-label">Leads Hoje</div>
            </div>
            <div class="card stat-card">
                <div class="stat-number">${stats.prazos.proximos}</div>
                <div class="stat-label">Prazos Próximos</div>
            </div>
            <div class="card stat-card">
                <div class="stat-number">${stats.prazos.atrasados}</div>
                <div class="stat-label">Prazos Atrasados</div>
            </div>
            <div class="card stat-card">
                <div class="stat-number">${stats.processos.ativos}</div>
                <div class="stat-label">Processos Ativos</div>
            </div>
        `;
        
        // Carregar prazos urgentes
        await this.loadUrgentPrazos();
        
        // Carregar leads recentes
        await this.loadRecentLeads();
    }

    async loadUrgentPrazos() {
        const user = authSystem.getUser();
        const prazos = await database.getPrazosPorAdvogado(user.username);
        const urgentes = prazos.filter(p => {
            const dias = (new Date(p.data) - new Date()) / (1000 * 60 * 60 * 24);
            return dias <= 3 && p.status === 'pendente';
        }).slice(0, 5);
        
        const container = document.getElementById('urgentPrazosList');
        if (urgentes.length === 0) {
            container.innerHTML = '<p class="text-center py-3">Nenhum prazo urgente</p>';
            return;
        }
        
        container.innerHTML = urgentes.map(prazo => `
            <div class="prazo-item">
                <div class="prazo-info">
                    <h4>${prazo.processo} - ${prazo.cliente}</h4>
                    <p>${prazo.descricao}</p>
                    <div class="prazo-meta">
                        <span>${this.formatDate(prazo.data)}</span>
                        <span class="dias-restantes ${this.getDiasClass(prazo.data)}">
                            ${this.getDiasText(prazo.data)}
                        </span>
                    </div>
                </div>
                <div class="prazo-actions">
                    <button class="btn btn-success btn-sm" onclick="concluirPrazo(${prazo.id})">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadRecentLeads() {
        const user = authSystem.getUser();
        const leads = await database.getLeadsPorAdvogado(user.username);
        const recentes = leads.slice(0, 5);
        
        const container = document.getElementById('recentLeadsList');
        if (recentes.length === 0) {
            container.innerHTML = '<p class="text-center py-3">Nenhuma indicação recente</p>';
            return;
        }
        
        container.innerHTML = recentes.map(lead => `
            <div class="lead-item">
                <div class="lead-header">
                    <span class="lead-client">${lead.clientName}</span>
                    <span class="lead-date">${this.formatDate(lead.timestamp)}</span>
                </div>
                <div class="lead-details">
                    <strong>${lead.caseType}</strong> - ${lead.clientPhone}
                    ${lead.caseDescription ? `<br>${lead.caseDescription.substring(0, 100)}...` : ''}
                </div>
            </div>
        `).join('');
    }

    async loadLeads() {
        const user = authSystem.getUser();
        const leads = await database.getLeadsPorAdvogado(user.username);
        
        // Preencher campo do advogado no formulário
        document.getElementById('leadAdvogado').value = user.nome;
        
        // Carregar histórico de leads
        const container = document.getElementById('leadsHistoryList');
        if (leads.length === 0) {
            container.innerHTML = '<p class="text-center py-3">Nenhuma indicação cadastrada</p>';
            return;
        }
        
        container.innerHTML = leads.map(lead => `
            <div class="lead-item">
                <div class="lead-header">
                    <span class="lead-client">${lead.clientName}</span>
                    <span class="lead-date">${this.formatDate(lead.timestamp)}</span>
                </div>
                <div class="lead-details">
                    <strong>${lead.caseType}</strong> - ${lead.clientPhone}
                    ${lead.clientEmail ? `<br>Email: ${lead.clientEmail}` : ''}
                    ${lead.caseDescription ? `<br>${lead.caseDescription}` : ''}
                </div>
            </div>
        `).join('');
    }

    async loadPrazos() {
        const user = authSystem.getUser();
        const prazos = await database.getPrazosPorAdvogado(user.username);
        
        const container = document.getElementById('prazosList');
        if (prazos.length === 0) {
            container.innerHTML = '<p class="text-center py-3">Nenhum prazo cadastrado</p>';
            return;
        }
        
        container.innerHTML = prazos.map(prazo => `
            <div class="prazo-item">
                <div class="prazo-info">
                    <h4>${prazo.processo} - ${prazo.cliente}</h4>
                    <p>${prazo.descricao} (${prazo.tipo})</p>
                    <div class="prazo-meta">
                        <span>${this.formatDate(prazo.data)}</span>
                        <span class="dias-restantes ${this.getDiasClass(prazo.data)}">
                            ${this.getDiasText(prazo.data)}
                        </span>
                        <span class="status-badge status-${prazo.status}">
                            ${prazo.status === 'pendente' ? 'Pendente' : 'Concluído'}
                        </span>
                    </div>
                </div>
                <div class="prazo-actions">
                    ${prazo.status === 'pendente' ? `
                        <button class="btn btn-success btn-sm" onclick="concluirPrazo(${prazo.id})">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    <button class="btn btn-danger btn-sm" onclick="excluirPrazo(${prazo.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadProcessos() {
        // Em desenvolvimento
        console.log('Carregando processos...');
    }

    async loadAdvogados() {
        // Em desenvolvimento
        console.log('Carregando advogados...');
    }

    // Métodos auxiliares
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getDiasClass(dataPrazo) {
        const dias = this.calcularDiasRestantes(dataPrazo);
        if (dias < 0) return 'dias-urgente';
        if (dias <= 3) return 'dias-atencao';
        return 'dias-normal';
    }

    getDiasText(dataPrazo) {
        const dias = this.calcularDiasRestantes(dataPrazo);
        if (dias < 0) return `${Math.abs(dias)} dias atrasado`;
        if (dias === 0) return 'Vence hoje';
        if (dias === 1) return '1 dia restante';
        return `${dias} dias restantes`;
    }

    calcularDiasRestantes(dataPrazo) {
        const hoje = new Date();
        const prazo = new Date(dataPrazo);
        const diffTime = prazo - hoje;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    mostrarMensagem(mensagem, tipo = 'info') {
        // Implementar sistema de notificações
        console.log(`${tipo.toUpperCase()}: ${mensagem}`);
    }
}

// Instância global do sistema de intranet
const intranetSystem = new IntranetSystem();

// Funções globais
function showSection(sectionName) {
    intranetSystem.showSection(sectionName);
}

async function concluirPrazo(prazoId) {
    if (confirm('Deseja marcar este prazo como concluído?')) {
        await database.updatePrazoStatus(prazoId, 'concluido');
        await intranetSystem.loadPrazos();
        await intranetSystem.loadDashboard();
        intranetSystem.mostrarMensagem('Prazo marcado como concluído!', 'success');
    }
}

async function excluirPrazo(prazoId) {
    if (confirm('Tem certeza que deseja excluir este prazo?')) {
        await database.delete('prazos', prazoId);
        await intranetSystem.loadPrazos();
        await intranetSystem.loadDashboard();
        intranetSystem.mostrarMensagem('Prazo excluído com sucesso!', 'success');
    }
}

// Inicialização quando a página carregar
document.addEventListener('DOMContentLoaded', async function() {
    // Configurar formulário de login
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const message = document.getElementById('loginMessage');
        const button = document.getElementById('loginBtn');
        
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
        button.disabled = true;
        
        const result = await authSystem.login(username, password);
        
        if (result.success) {
            intranetSystem.showIntranet();
            await intranetSystem.loadDashboard();
        } else {
            message.textContent = result.message;
            message.style.display = 'block';
            message.className = 'form-message error';
            
            button.innerHTML = '<i class="fas fa-sign-in-alt"></i> Acessar Sistema';
            button.disabled = false;
        }
    });

    // Configurar formulário de lead
    document.getElementById('leadForm').addEventListener('submit', async function(e) {
        const user = authSystem.getUser();
        if (!user) return;
        
        // Adicionar lead localmente
        const formData = new FormData(this);
        const leadData = {
            advogado: user.username,
            clientName: formData.get('clientName'),
            clientPhone: formData.get('clientPhone'),
            clientEmail: formData.get('clientEmail'),
            caseType: formData.get('caseType'),
            caseDescription: formData.get('caseDescription')
        };
        
        await database.addLead(leadData);
        intranetSystem.mostrarMensagem('Indicação enviada com sucesso!', 'success');
        
        // Recarregar a seção de leads
        await intranetSystem.loadLeads();
        await intranetSystem.loadDashboard();
    });

    // Configurar formulário de prazo
    document.getElementById('prazoForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const user = authSystem.getUser();
        if (!user) return;
        
        const prazoData = {
            advogado: user.username,
            processo: document.getElementById('prazoProcesso').value,
            cliente: document.getElementById('prazoCliente').value,
            tipo: document.getElementById('prazoTipo').value,
            data: document.getElementById('prazoData').value,
            descricao: document.getElementById('prazoDescricao').value,
            prioridade: document.getElementById('prazoPrioridade').value
        };
        
        await database.addPrazo(prazoData);
        this.reset();
        
        intranetSystem.mostrarMensagem('Prazo cadastrado com sucesso!', 'success');
        
        // Recarregar a seção de prazos
        await intranetSystem.loadPrazos();
        await intranetSystem.loadDashboard();
    });
});