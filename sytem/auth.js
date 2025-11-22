// auth.js - Sistema de Autenticação e Sessão
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.sessionStart = null;
        this.init();
    }

    init() {
        // Verificar se há sessão salva
        const savedSession = localStorage.getItem('mps_adv_session');
        if (savedSession) {
            this.restoreSession(JSON.parse(savedSession));
        }
    }

    login(username, password) {
        return new Promise((resolve, reject) => {
            // Simular delay de rede
            setTimeout(() => {
                const user = SYSTEM_CONFIG.AUTHORIZED_USERS[username];
                
                if (user && user.password === password) {
                    this.currentUser = {
                        username: username,
                        name: user.name,
                        email: user.email,
                        specialty: user.specialty,
                        loginTime: new Date().toISOString()
                    };
                    
                    this.sessionStart = new Date();
                    this.saveSession();
                    
                    resolve({
                        success: true,
                        user: this.currentUser
                    });
                } else {
                    reject({
                        success: false,
                        message: 'Usuário ou senha incorretos'
                    });
                }
            }, 1000);
        });
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
        const sessionAge = (new Date() - new Date(sessionData.sessionStart)) / (1000 * 60); // idade em minutos
        
        if (sessionAge < SYSTEM_CONFIG.SYSTEM_SETTINGS.sessionTimeout) {
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

    getSessionTime() {
        if (!this.sessionStart) return '0 min';
        const minutes = Math.floor((new Date() - this.sessionStart) / (1000 * 60));
        return `${minutes} min`;
    }
}

// Instância global do sistema de auth
const authSystem = new AuthSystem();