// auth.js - Sistema de Autenticação
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.sessionStart = null;
        this.init();
    }

    async init() {
        await database.init();
        
        // Verificar se há sessão salva
        const savedSession = localStorage.getItem('mps_adv_session');
        if (savedSession) {
            this.restoreSession(JSON.parse(savedSession));
        }
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
                    permissoes: user.permissoes || ['leads', 'prazos', 'processos'],
                    loginTime: new Date().toISOString()
                };
                
                this.sessionStart = new Date();
                this.saveSession();
                
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
            return {
                success: false,
                message: 'Erro ao fazer login'
            };
        }
    }

    logout() {
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
        const sessionAge = (new Date() - new Date(sessionData.sessionStart)) / (1000 * 60);
        
        if (sessionAge < 60) { // 60 minutos
            this.currentUser = sessionData.user;
            this.sessionStart = new Date(sessionData.sessionStart);
        } else {
            localStorage.removeItem('mps_adv_session');
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
        return `${minutes} min`;
    }
}

// Instância global do sistema de auth
const authSystem = new AuthSystem();