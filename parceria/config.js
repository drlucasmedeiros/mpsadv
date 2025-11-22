// config.js - Configurações do Sistema de Advogados
const SYSTEM_CONFIG = {
    // Credenciais dos advogados credenciados
    AUTHORIZED_USERS: {
        'adv01': { 
            password: 'mps2024', 
            name: 'Dr. Carlos Silva',
            email: 'carlos.silva@mpsadv.com.br',
            specialty: 'Direito Civil'
        },
        'adv02': { 
            password: 'mps2024', 
            name: 'Dra. Ana Costa',
            email: 'ana.costa@mpsadv.com.br', 
            specialty: 'Direito Trabalhista'
        },
        'adv03': { 
            password: 'mps2024', 
            name: 'Dr. Roberto Lima',
            email: 'roberto.lima@mpsadv.com.br',
            specialty: 'Direito Empresarial'
        },
        'adv04': { 
            password: 'mps2024', 
            name: 'Dra. Mariana Santos',
            email: 'mariana.santos@mpsadv.com.br',
            specialty: 'Direito de Família'
        }
    },

    // Configurações do FormSubmit
    FORMSUBMIT_CONFIG: {
        leadEmail: 'leads@mpsadv.com.br',
        subject: '🎯 NOVA LEAD - Advogado Credenciado',
        successUrl: 'https://mpsadv.com.br/lead-sucesso.html'
    },

    // Configurações do Sistema
    SYSTEM_SETTINGS: {
        sessionTimeout: 60, // minutos
        maxLeadsPerDay: 10,
        allowedIPs: [] // deixe vazio para permitir qualquer IP
    }
};

// Não modificar abaixo desta linha
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SYSTEM_CONFIG;
}