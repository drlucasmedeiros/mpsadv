// auth.js - Sistema de Autenticação
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.sessionStart = null;
        this.sessionTimeout = 8 * 60 * 60 * 1000; // 8 horas
        this.init();
    }

    async init() {
        await database.init();
        
        // Verificar se há sessão salva
        const savedSession = localStorage.getItem('mps_adv_session');
        if (savedSession) {
            this.restoreSession(JSON.parse(savedSession));
        }

        // Verificar timeout da sessão a cada minuto
        setInterval(() => this.checkSessionTimeout(), 60000);
    }

    async login(username, password) {
        try {
            const user = await database.getAdvogado(username);
            
            if (user && user.password === password && user.status === 'ativo') {
                this.currentUser = {
                    username: user.username,
                    nome: user.nome,
                    email: user.email,
                    especialidade: user.especialidade,
                    telefone: user.telefone,
                    permissoes: user.permissoes || ['leads', 'prazos', 'processos', 'documentos'],
                    loginTime: new Date().toISOString(),
                    lastActivity: new Date().toISOString()
                };
                
                this.sessionStart = new Date();
                this.saveSession();
                
                // Registrar atividade de login
                await database.registrarAtividade('login', 'Usuário fez login no sistema', username);
                
                return {
                    success: true,
                    user: this.currentUser
                };
            } else {
                return {
                    success: false,
                    message: 'Usuário ou senha incorretos'
                };
            }
        } catch (error) {
            console.error('Erro no login:', error);
            return {
                success: false,
                message: 'Erro ao fazer login. Tente novamente.'
            };
        }
    }

    logout() {
        if (this.currentUser) {
            database.registrarAtividade('logout', 'Usuário saiu do sistema', this.currentUser.username);
        }
        
        this.currentUser = null;
        this.sessionStart = null;
        localStorage.removeItem('mps_adv_session');
        window.location.reload();
    }

    saveSession() {
        const sessionData = {
            user: this.currentUser,
            sessionStart: this.sessionStart
        };
        localStorage.setItem('mps_adv_session', JSON.stringify(sessionData));
    }

    restoreSession(sessionData) {
        const sessionAge = new Date() - new Date(sessionData.sessionStart);
        
        if (sessionAge < this.sessionTimeout) {
            this.currentUser = sessionData.user;
            this.sessionStart = new Date(sessionData.sessionStart);
            this.updateActivity();
        } else {
            this.logout();
        }
    }

    updateActivity() {
        if (this.currentUser) {
            this.currentUser.lastActivity = new Date().toISOString();
            this.saveSession();
        }
    }

    checkSessionTimeout() {
        if (this.currentUser && this.sessionStart) {
            const sessionAge = new Date() - this.sessionStart;
            if (sessionAge >= this.sessionTimeout) {
                this.logout();
            }
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getUser() {
        return this.currentUser;
    }

    hasPermission(permission) {
        return this.currentUser?.permissoes?.includes(permission) || false;
    }

    isAdmin() {
        return this.hasPermission('admin');
    }

    getSessionTime() {
        if (!this.sessionStart) return '0 min';
        const minutes = Math.floor((new Date() - this.sessionStart) / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${remainingMinutes}min`;
        }
        return `${minutes} min`;
    }

    async changePassword(currentPassword, newPassword) {
        if (!this.currentUser) {
            return { success: false, message: 'Usuário não logado' };
        }

        const user = await database.getAdvogado(this.currentUser.username);
        if (user.password !== currentPassword) {
            return { success: false, message: 'Senha atual incorreta' };
        }

        user.password = newPassword;
        await database.updateAdvogado(this.currentUser.username, user);
        
        await database.registrarAtividade('senha_alterada', 'Senha alterada com sucesso', this.currentUser.username);
        
        return { success: true, message: 'Senha alterada com sucesso' };
    }

    // Verificar permissões específicas
    canManageLeads() {
        return this.hasPermission('leads') || this.isAdmin();
    }

    canManagePrazos() {
        return this.hasPermission('prazos') || this.isAdmin();
    }

    canManageProcessos() {
        return this.hasPermission('processos') || this.isAdmin();
    }

    canManageDocumentos() {
        return this.hasPermission('documentos') || this.isAdmin();
    }
}

// Instância global do sistema de auth
const authSystem = new AuthSystem();

// Atualizar atividade do usuário em interações
document.addEventListener('click', () => authSystem.updateActivity());
document.addEventListener('keypress', () => authSystem.updateActivity());