// config.js - Configurações Atualizadas
const SYSTEM_CONFIG = {
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
        }
    },

    FORMSUBMIT_CONFIG: {
        leadEmail: 'leads@mpsadv.com.br',
        subject: '🎯 NOVA LEAD - Advogado Credenciado',
        successUrl: 'https://mpsadv.com.br/lead-sucesso.html'
    },

    SYSTEM_SETTINGS: {
        sessionTimeout: 60,
        maxLeadsPerDay: 10
    },

    // Novas configurações para prazos
    PRAZOS_CONFIG: {
        tipos: [
            { value: 'audiência', label: 'Audiência' },
            { value: 'prazo', label: 'Prazo Processual' },
            { value: 'protocolo', label: 'Protocolo' },
            { value: 'sentença', label: 'Sentença' },
            { value: 'recurso', label: 'Recurso' },
            { value: 'outros', label: 'Outros' }
        ],
        prioridades: [
            { value: 'baixa', label: 'Baixa' },
            { value: 'normal', label: 'Normal' },
            { value: 'alta', label: 'Alta' },
            { value: 'urgente', label: 'Urgente' }
        ],
        alertas: {
            diasAntes: 3,
            corUrgente: '#F44336',
            corAtencao: '#FF9800',
            corNormal: '#4CAF50'
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SYSTEM_CONFIG;
}