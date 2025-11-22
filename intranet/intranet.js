// intranet.js - Sistema Principal da Intranet
class IntranetSystem {
    constructor() {
        this.currentSection = 'dashboard';
        this.searchTerm = '';
        this.notifications = [];
        this.init();
    }

    async init() {
        // Verificar autenticação
        if (authSystem.isLoggedIn()) {
            this.showIntranet();
            await this.loadDashboard();
            await this.loadNotifications();
        } else {
            this.showLogin();
        }

        // Configurar busca global
        this.setupGlobalSearch();
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
            document.getElementById('relatoriosNav').style.display = 'flex';
        }
        
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('intranetPage').style.display = 'flex';
        
        // Inicializar tooltips
        this.initTooltips();
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
        const sectionElement = document.getElementById(sectionName + 'Section');
        if (sectionElement) {
            sectionElement.style.display = 'block';
        }
        
        // Marcar item do menu como active
        const navItem = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
        if (navItem) navItem.classList.add('active');
        
        // Atualizar título da página
        this.updatePageTitle(sectionName);
        
        // Carregar dados da seção
        await this.loadSectionData(sectionName);
        
        this.currentSection = sectionName;
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
            case 'documentos':
                await this.loadDocumentos();
                break;
            case 'advogados':
                if (authSystem.isAdmin()) {
                    await this.loadAdvogados();
                }
                break;
            case 'relatorios':
                if (authSystem.isAdmin()) {
                    await this.loadRelatorios();
                }
                break;
            case 'configuracoes':
                await this.loadConfiguracoes();
                break;
        }
    }

    async loadDashboard() {
        const user = authSystem.getUser();
        const stats = authSystem.isAdmin() ? 
            await database.getEstatisticasGerais() : 
            await database.getEstatisticas(user.username);
        
        // Atualizar badges do menu
        document.getElementById('leadsBadge').textContent = stats.leads.hoje || 0;
        document.getElementById('prazosBadge').textContent = (stats.prazos.proximos || 0) + (stats.prazos.atrasados || 0);
        document.getElementById('processosBadge').textContent = stats.processos.ativos || 0;
        
        // Atualizar estatísticas do dashboard
        await this.renderDashboardStats(stats);
        
        // Carregar prazos urgentes
        await this.loadUrgentPrazos();
        
        // Carregar leads recentes
        await this.loadRecentLeads();
        
        // Carregar atividades recentes
        await this.loadRecentActivities();
    }

    async renderDashboardStats(stats) {
        const statsGrid = document.getElementById('dashboardStats');
        
        if (authSystem.isAdmin()) {
            statsGrid.innerHTML = `
                <div class="card stat-card">
                    <div class="stat-number">${stats.advogados.ativos}</div>
                    <div class="stat-label">Advogados Ativos</div>
                </div>
                <div class="card stat-card">
                    <div class="stat-number">${stats.leads.hoje}</div>
                    <div class="stat-label">Leads Hoje</div>
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
        } else {
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
        }
    }

    async loadUrgentPrazos() {
        const user = authSystem.getUser();
        const prazos = authSystem.isAdmin() ? 
            await database.getTodosPrazos() : 
            await database.getPrazosPorAdvogado(user.username);
            
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
                        ${authSystem.isAdmin() ? `<span class="advogado-tag">${await this.getNomeAdvogado(prazo.advogado)}</span>` : ''}
                    </div>
                </div>
                <div class="prazo-actions">
                    <button class="btn btn-success btn-sm" onclick="concluirPrazo(${prazo.id})" title="Marcar como concluído">
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
                    <strong>${this.getCaseTypeText(lead.caseType)}</strong> - ${lead.clientPhone}
                    ${lead.caseDescription ? `<br>${lead.caseDescription.substring(0, 100)}...` : ''}
                </div>
                <div class="lead-actions">
                    <span class="status-badge status-${lead.status}">${this.getLeadStatusText(lead.status)}</span>
                </div>
            </div>
        `).join('');
    }

    async loadRecentActivities() {
        const atividades = await database.getAtividadesRecentes(10);
        const container = document.getElementById('recentActivitiesList');
        
        if (atividades.length === 0) {
            container.innerHTML = '<p class="text-center py-3">Nenhuma atividade recente</p>';
            return;
        }
        
        container.innerHTML = atividades.map(atividade => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${this.getActivityIcon(atividade.tipo)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-desc">${atividade.descricao}</div>
                    <div class="activity-meta">
                        <span class="activity-user">${await this.getNomeAdvogado(atividade.usuario)}</span>
                        <span class="activity-time">${this.formatRelativeTime(atividade.timestamp)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadLeads() {
        const user = authSystem.getUser();
        const leads = await database.getLeadsPorAdvogado(user.username);
        
        // Preencher campo do advogado no formulário
        document.getElementById('leadAdvogado').value = user.nome;
        
        await this.renderLeads(leads);
    }

    async renderLeads(leads) {
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
                    <strong>${this.getCaseTypeText(lead.caseType)}</strong> - ${lead.clientPhone}
                    ${lead.clientEmail ? `<br>Email: ${lead.clientEmail}` : ''}
                    ${lead.caseDescription ? `<br>${lead.caseDescription}` : ''}
                </div>
                <div class="lead-actions">
                    <span class="status-badge status-${lead.status}">${this.getLeadStatusText(lead.status)}</span>
                    <div class="action-buttons">
                        <button class="btn btn-success btn-sm" onclick="atualizarLeadStatus(${lead.id}, 'contatada')" title="Marcar como contatada">
                            <i class="fas fa-phone"></i>
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="atualizarLeadStatus(${lead.id}, 'em_andamento')" title="Marcar como em andamento">
                            <i class="fas fa-spinner"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="atualizarLeadStatus(${lead.id}, 'perdida')" title="Marcar como perdida">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadPrazos() {
        const user = authSystem.getUser();
        const prazos = await database.getPrazosPorAdvogado(user.username);
        await this.renderPrazos(prazos);
    }

    async renderPrazos(prazos) {
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
                        ${authSystem.isAdmin() ? `<span class="advogado-tag">${await this.getNomeAdvogado(prazo.advogado)}</span>` : ''}
                    </div>
                </div>
                <div class="prazo-actions">
                    ${prazo.status === 'pendente' ? `
                        <button class="btn btn-success btn-sm" onclick="concluirPrazo(${prazo.id})" title="Marcar como concluído">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    <button class="btn btn-danger btn-sm" onclick="excluirPrazo(${prazo.id})" title="Excluir prazo">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadProcessos() {
        const user = authSystem.getUser();
        const processos = await database.getProcessosPorAdvogado(user.username);
        
        // Preencher select de advogados se for admin
        if (authSystem.isAdmin()) {
            await this.carregarAdvogadosSelect('processoAdvogado');
        } else {
            document.getElementById('processoAdvogado').value = user.username;
            document.getElementById('processoAdvogado').style.display = 'none';
            document.querySelector('label[for="processoAdvogado"]').style.display = 'none';
        }
        
        await this.renderProcessos(processos);
    }

    async carregarAdvogadosSelect(selectId) {
        const advogados = await database.getAdvogadosAtivos();
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Selecione...</option>';
        
        advogados.forEach(adv => {
            const option = document.createElement('option');
            option.value = adv.username;
            option.textContent = adv.nome;
            select.appendChild(option);
        });
    }

    async renderProcessos(processos) {
        const container = document.getElementById('processosList');
        
        if (processos.length === 0) {
            container.innerHTML = '<p class="text-center py-3">Nenhum processo cadastrado</p>';
            return;
        }
        
        container.innerHTML = processos.map(processo => `
            <div class="processo-item">
                <div class="processo-header">
                    <div class="processo-info">
                        <h4>${processo.numero}</h4>
                        <span class="processo-cliente">${processo.cliente}</span>
                    </div>
                    <div class="processo-meta">
                        <span class="status-badge status-${processo.status}">
                            ${this.getProcessoStatusText(processo.status)}
                        </span>
                        <span class="processo-data">${this.formatDate(processo.criadoEm)}</span>
                    </div>
                </div>
                <div class="processo-details">
                    <div class="processo-detail">
                        <strong>Advogado:</strong> ${await this.getNomeAdvogado(processo.advogado)}
                    </div>
                    <div class="processo-detail">
                        <strong>Área:</strong> ${this.getAreaText(processo.area)}
                    </div>
                    <div class="processo-detail">
                        <strong>Tribunal:</strong> ${processo.tribunal}
                    </div>
                    ${processo.valor ? `<div class="processo-detail"><strong>Valor:</strong> R$ ${parseFloat(processo.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>` : ''}
                    <div class="processo-descricao">
                        ${processo.descricao}
                    </div>
                </div>
                <div class="processo-actions">
                    <button class="btn btn-outline btn-sm" onclick="editarProcesso(${processo.id})" title="Editar processo">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="excluirProcesso(${processo.id})" title="Excluir processo">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadDocumentos() {
        const user = authSystem.getUser();
        const documentos = await database.getDocumentosPorAdvogado(user.username);
        await this.renderDocumentos(documentos);
    }

    async renderDocumentos(documentos) {
        const container = document.getElementById('documentosList');
        
        if (documentos.length === 0) {
            container.innerHTML = '<p class="text-center py-3">Nenhum documento cadastrado</p>';
            return;
        }
        
        container.innerHTML = documentos.map(documento => `
            <div class="documento-item">
                <div class="documento-header">
                    <div class="documento-info">
                        <h4>${documento.nome}</h4>
                        <span class="documento-tipo">${this.getDocumentoTipoText(documento.tipo)}</span>
                    </div>
                    <div class="documento-meta">
                        <span class="documento-data">${this.formatDate(documento.uploadEm)}</span>
                    </div>
                </div>
                <div class="documento-details">
                    <div class="documento-detail">
                        <strong>Processo:</strong> ${documento.processoNumero || 'N/A'}
                    </div>
                    <div class="documento-descricao">
                        ${documento.descricao || 'Sem descrição'}
                    </div>
                </div>
                <div class="documento-actions">
                    <button class="btn btn-primary btn-sm" onclick="visualizarDocumento(${documento.id})" title="Visualizar documento">
                        <i class="fas fa-eye"></i> Visualizar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="excluirDocumento(${documento.id})" title="Excluir documento">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadAdvogados() {
        if (!authSystem.isAdmin()) return;
        
        const advogados = await database.getAllAdvogados();
        await this.renderAdvogados(advogados);
    }

    async renderAdvogados(advogados) {
        const container = document.getElementById('advogadosList');
        
        if (advogados.length === 0) {
            container.innerHTML = '<p class="text-center py-3">Nenhum advogado cadastrado</p>';
            return;
        }
        
        container.innerHTML = advogados.map(advogado => `
            <div class="advogado-item">
                <div class="advogado-header">
                    <div class="advogado-info">
                        <h4>${advogado.nome}</h4>
                        <span class="advogado-especialidade">${advogado.especialidade}</span>
                    </div>
                    <div class="advogado-meta">
                        <span class="status-badge status-${advogado.status}">
                            ${advogado.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                </div>
                <div class="advogado-details">
                    <div class="advogado-detail">
                        <strong>Email:</strong> ${advogado.email}
                    </div>
                    <div class="advogado-detail">
                        <strong>Telefone:</strong> ${advogado.telefone}
                    </div>
                    <div class="advogado-detail">
                        <strong>Usuário:</strong> ${advogado.username}
                    </div>
                    <div class="advogado-permissoes">
                        <strong>Permissões:</strong> ${advogado.permissoes.join(', ')}
                    </div>
                </div>
                <div class="advogado-actions">
                    <button class="btn btn-outline btn-sm" onclick="editarAdvogado('${advogado.username}')" title="Editar advogado">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    ${advogado.status === 'ativo' ? 
                        `<button class="btn btn-warning btn-sm" onclick="desativarAdvogado('${advogado.username}')" title="Desativar advogado">
                            <i class="fas fa-user-slash"></i> Desativar
                        </button>` :
                        `<button class="btn btn-success btn-sm" onclick="ativarAdvogado('${advogado.username}')" title="Ativar advogado">
                            <i class="fas fa-user-check"></i> Ativar
                        </button>`
                    }
                </div>
            </div>
        `).join('');
    }

    async loadRelatorios() {
        if (!authSystem.isAdmin()) return;
        
        const estatisticas = await database.getEstatisticasGerais();
        await this.renderRelatorios(estatisticas);
    }

    async renderRelatorios(estatisticas) {
        const container = document.getElementById('relatoriosContent');
        
        container.innerHTML = `
            <div class="relatorios-grid">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-users"></i> Advogados</h3>
                    </div>
                    <div class="card-body">
                        <div class="stat-row">
                            <span>Total de Advogados:</span>
                            <strong>${estatisticas.advogados.total}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Advogados Ativos:</span>
                            <strong>${estatisticas.advogados.ativos}</strong>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-bullhorn"></i> Leads</h3>
                    </div>
                    <div class="card-body">
                        <div class="stat-row">
                            <span>Total de Leads:</span>
                            <strong>${estatisticas.leads.total}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Leads Hoje:</span>
                            <strong>${estatisticas.leads.hoje}</strong>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-calendar-alt"></i> Prazos</h3>
                    </div>
                    <div class="card-body">
                        <div class="stat-row">
                            <span>Total de Prazos:</span>
                            <strong>${estatisticas.prazos.total}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Prazos Atrasados:</span>
                            <strong class="text-danger">${estatisticas.prazos.atrasados}</strong>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><i class="fas fa-gavel"></i> Processos</h3>
                    </div>
                    <div class="card-body">
                        <div class="stat-row">
                            <span>Total de Processos:</span>
                            <strong>${estatisticas.processos.total}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Processos Ativos:</span>
                            <strong>${estatisticas.processos.ativos}</strong>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card mt-4">
                <div class="card-header">
                    <h3 class="card-title"><i class="fas fa-download"></i> Exportar Dados</h3>
                </div>
                <div class="card-body">
                    <p>Exporte todos os dados do sistema para backup ou análise.</p>
                    <div class="form-actions">
                        <button class="btn btn-primary" onclick="exportarDados()">
                            <i class="fas fa-file-export"></i> Exportar Dados
                        </button>
                        <button class="btn btn-outline" onclick="importarDados()">
                            <i class="fas fa-file-import"></i> Importar Dados
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async loadConfiguracoes() {
        const user = authSystem.getUser();
        document.getElementById('configUsuario').textContent = user.nome;
        document.getElementById('configEmail').textContent = user.email;
        document.getElementById('configEspecialidade').textContent = user.especialidade;
        document.getElementById('configTelefone').textContent = user.telefone;
        document.getElementById('configSessionTime').textContent = authSystem.getSessionTime();
    }

    async loadNotifications() {
        // Simular notificações - em produção viria do servidor
        this.notifications = [
            { id: 1, type: 'warning', message: '2 prazos próximos do vencimento', timestamp: new Date() },
            { id: 2, type: 'info', message: 'Nova lead recebida', timestamp: new Date(Date.now() - 300000) }
        ];
        
        this.updateNotificationBadge();
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notificationsBadge');
        if (this.notifications.length > 0) {
            badge.textContent = this.notifications.length;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    setupGlobalSearch() {
        const searchInput = document.getElementById('globalSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                if (this.searchTerm.length >= 3) {
                    this.performSearch(this.searchTerm);
                }
            });
        }
    }

    async performSearch(termo) {
        const resultados = await database.buscarGlobal(termo);
        this.displaySearchResults(resultados);
    }

    displaySearchResults(resultados) {
        // Implementar modal de resultados da busca
        console.log('Resultados da busca:', resultados);
    }

    // Métodos auxiliares
    async getNomeAdvogado(username) {
        if (username === authSystem.getUser().username) {
            return authSystem.getUser().nome;
        }
        
        if (authSystem.isAdmin()) {
            const advogado = await database.getAdvogado(username);
            return advogado ? advogado.nome : username;
        }
        return username;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatRelativeTime(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'agora';
        if (diffMins < 60) return `${diffMins} min atrás`;
        if (diffHours < 24) return `${diffHours} h atrás`;
        if (diffDays < 7) return `${diffDays} dias atrás`;
        return this.formatDate(dateString);
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

    getCaseTypeText(caseType) {
        const types = {
            'civil': 'Direito Civil',
            'trabalhista': 'Direito Trabalhista',
            'empresarial': 'Direito Empresarial',
            'familia': 'Direito de Família',
            'inventario': 'Inventário',
            'previdenciario': 'Previdenciário',
            'penal': 'Direito Penal',
            'outros': 'Outros'
        };
        return types[caseType] || caseType;
    }

    getLeadStatusText(status) {
        const statusMap = {
            'nova': 'Nova',
            'contatada': 'Contatada',
            'em_andamento': 'Em Andamento',
            'convertida': 'Convertida',
            'perdida': 'Perdida'
        };
        return statusMap[status] || status;
    }

    getProcessoStatusText(status) {
        const statusMap = {
            'ativo': 'Ativo',
            'arquivado': 'Arquivado',
            'suspenso': 'Suspenso',
            'concluido': 'Concluído'
        };
        return statusMap[status] || status;
    }

    getAreaText(area) {
        const areaMap = {
            'civil': 'Direito Civil',
            'trabalhista': 'Direito Trabalhista',
            'empresarial': 'Direito Empresarial',
            'familia': 'Direito de Família',
            'inventario': 'Inventário',
            'previdenciario': 'Previdenciário',
            'penal': 'Direito Penal',
            'outros': 'Outros'
        };
        return areaMap[area] || area;
    }

    getDocumentoTipoText(tipo) {
        const tipos = {
            'peticao': 'Petição',
            'contestacao': 'Contestação',
            'recurso': 'Recurso',
            'decisao': 'Decisão',
            'sentenca': 'Sentença',
            'outros': 'Outros'
        };
        return tipos[tipo] || tipo;
    }

    getActivityIcon(tipo) {
        const icons = {
            'login': 'fa-sign-in-alt',
            'logout': 'fa-sign-out-alt',
            'lead_adicionada': 'fa-bullhorn',
            'lead_atualizada': 'fa-edit',
            'prazo_adicionado': 'fa-calendar-plus',
            'prazo_atualizado': 'fa-calendar-check',
            'processo_adicionado': 'fa-gavel',
            'processo_atualizado': 'fa-edit',
            'documento_adicionado': 'fa-file-upload',
            'senha_alterada': 'fa-key',
            'sistema_inicializado': 'fa-database',
            'sistema_restaurado': 'fa-history'
        };
        return icons[tipo] || 'fa-circle';
    }

    initTooltips() {
        // Inicializar tooltips para elementos com data-tooltip
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'custom-tooltip';
                tooltip.textContent = e.target.getAttribute('data-tooltip');
                document.body.appendChild(tooltip);
                
                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = rect.left + 'px';
                tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';
                
                e.target._tooltip = tooltip;
            });
            
            element.addEventListener('mouseleave', (e) => {
                if (e.target._tooltip) {
                    e.target._tooltip.remove();
                    e.target._tooltip = null;
                }
            });
        });
    }

    mostrarMensagem(mensagem, tipo = 'info', tempo = 5000) {
        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = `alert alert-${tipo}`;
        mensagemDiv.innerHTML = `
            <div class="alert-content">
                <i class="fas fa-${this.getAlertIcon(tipo)}"></i>
                <span>${mensagem}</span>
                <button class="alert-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.getElementById('alertContainer').appendChild(mensagemDiv);
        
        setTimeout(() => {
            if (mensagemDiv.parentElement) {
                mensagemDiv.remove();
            }
        }, tempo);
    }

    getAlertIcon(tipo) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[tipo] || 'info-circle';
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

async function atualizarLeadStatus(leadId, status) {
    await database.updateLeadStatus(leadId, status);
    await intranetSystem.loadLeads();
    await intranetSystem.loadDashboard();
    intranetSystem.mostrarMensagem('Lead atualizada com sucesso!', 'success');
}

async function editarProcesso(processoId) {
    intranetSystem.mostrarMensagem('Funcionalidade de edição em desenvolvimento', 'info');
}

async function excluirProcesso(processoId) {
    if (confirm('Tem certeza que deseja excluir este processo?')) {
        await database.delete('processos', processoId);
        await intranetSystem.loadProcessos();
        intranetSystem.mostrarMensagem('Processo excluído com sucesso!', 'success');
    }
}

async function visualizarDocumento(documentoId) {
    intranetSystem.mostrarMensagem('Visualização de documento em desenvolvimento', 'info');
}

async function excluirDocumento(documentoId) {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
        await database.delete('documentos', documentoId);
        await intranetSystem.loadDocumentos();
        intranetSystem.mostrarMensagem('Documento excluído com sucesso!', 'success');
    }
}

async function editarAdvogado(username) {
    intranetSystem.mostrarMensagem('Edição de advogado em desenvolvimento', 'info');
}

async function desativarAdvogado(username) {
    if (confirm('Tem certeza que deseja desativar este advogado?')) {
        await database.updateAdvogado(username, { status: 'inativo' });
        await intranetSystem.loadAdvogados();
        intranetSystem.mostrarMensagem('Advogado desativado com sucesso!', 'success');
    }
}

async function ativarAdvogado(username) {
    await database.updateAdvogado(username, { status: 'ativo' });
    await intranetSystem.loadAdvogados();
    intranetSystem.mostrarMensagem('Advogado ativado com sucesso!', 'success');
}

async function exportarDados() {
    try {
        const data = await database.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-mps-advogados-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        intranetSystem.mostrarMensagem('Backup exportado com sucesso!', 'success');
    } catch (error) {
        intranetSystem.mostrarMensagem('Erro ao exportar backup', 'error');
    }
}

async function importarDados() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (confirm('ATENÇÃO: Esta ação substituirá todos os dados atuais. Continuar?')) {
                try {
                    const text = await file.text();
                    await database.importData(text);
                    intranetSystem.mostrarMensagem('Dados importados com sucesso!', 'success');
                    setTimeout(() => window.location.reload(), 2000);
                } catch (error) {
                    intranetSystem.mostrarMensagem('Erro ao importar dados', 'error');
                }
            }
        }
    };
    input.click();
}

async function alterarSenha() {
    const currentPassword = prompt('Digite sua senha atual:');
    if (!currentPassword) return;
    
    const newPassword = prompt('Digite a nova senha:');
    if (!newPassword) return;
    
    const confirmPassword = prompt('Confirme a nova senha:');
    if (newPassword !== confirmPassword) {
        intranetSystem.mostrarMensagem('As senhas não coincidem', 'error');
        return;
    }
    
    const result = await authSystem.changePassword(currentPassword, newPassword);
    intranetSystem.mostrarMensagem(result.message, result.success ? 'success' : 'error');
}

// Inicialização quando a página carregar
document.addEventListener('DOMContentLoaded', async function() {
    // Criar container para alertas
    const alertContainer = document.createElement('div');
    alertContainer.id = 'alertContainer';
    alertContainer.className = 'alert-container';
    document.body.appendChild(alertContainer);

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
        e.preventDefault();
        
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
        
        // Enviar para FormSubmit (mantém funcionalidade original)
        this.submit();
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

    // Configurar formulário de processo
    document.getElementById('processoForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const user = authSystem.getUser();
        if (!user) return;
        
        const processoData = {
            numero: document.getElementById('processoNumero').value,
            cliente: document.getElementById('processoCliente').value,
            advogado: authSystem.isAdmin() ? 
                document.getElementById('processoAdvogado').value : 
                user.username,
            area: document.getElementById('processoArea').value,
            tribunal: document.getElementById('processoTribunal').value,
            valor: document.getElementById('processoValor').value,
            descricao: document.getElementById('processoDescricao').value,
            status: document.getElementById('processoStatus').value,
            dataAbertura: document.getElementById('processoDataAbertura').value
        };
        
        // Verificar se o número do processo já existe
        const processoExistente = await database.getProcessoPorNumero(processoData.numero);
        if (processoExistente) {
            intranetSystem.mostrarMensagem('Já existe um processo com este número!', 'error');
            return;
        }
        
        await database.addProcesso(processoData);
        this.reset();
        
        intranetSystem.mostrarMensagem('Processo cadastrado com sucesso!', 'success');
        await intranetSystem.loadProcessos();
    });

    // Configurar formulário de documento
    document.getElementById('documentoForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const user = authSystem.getUser();
        if (!user) return;
        
        const formData = new FormData(this);
        const documentoData = {
            advogado: user.username,
            nome: formData.get('documentoNome'),
            tipo: formData.get('documentoTipo'),
            descricao: formData.get('documentoDescricao'),
            processoId: formData.get('documentoProcesso') || null,
            processoNumero: formData.get('documentoProcessoNumero') || null
        };
        
        // Em um sistema real, aqui faríamos o upload do arquivo
        // Por enquanto, simulamos o cadastro
        await database.addDocumento(documentoData);
        this.reset();
        
        intranetSystem.mostrarMensagem('Documento cadastrado com sucesso!', 'success');
        await intranetSystem.loadDocumentos();
    });

    // Configurar logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        authSystem.logout();
    });

    // Configurar busca global
    document.getElementById('globalSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            intranetSystem.performSearch(e.target.value);
        }
    });

    // Configurar alteração de senha
    document.getElementById('changePasswordBtn').addEventListener('click', alterarSenha);
});