// leads.js - Sistema de Gestão e Envio de Leads
class LeadsSystem {
    constructor() {
        this.todayLeads = this.getTodayLeads();
    }

    getTodayLeads() {
        const today = new Date().toDateString();
        const stored = localStorage.getItem(`mps_leads_${today}`);
        return stored ? JSON.parse(stored) : [];
    }

    saveTodayLeads() {
        const today = new Date().toDateString();
        localStorage.setItem(`mps_leads_${today}`, JSON.stringify(this.todayLeads));
    }

    canSubmitLead(username) {
        const userLeads = this.todayLeads.filter(lead => lead.advogado === username);
        return userLeads.length < SYSTEM_CONFIG.SYSTEM_SETTINGS.maxLeadsPerDay;
    }

    addLead(leadData) {
        const lead = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...leadData
        };
        
        this.todayLeads.push(lead);
        this.saveTodayLeads();
        
        return lead;
    }

    getUserLeads(username) {
        return this.todayLeads
            .filter(lead => lead.advogado === username)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5); // últimas 5 leads
    }

    getLeadStats(username) {
        const userLeads = this.todayLeads.filter(lead => lead.advogado === username);
        const today = new Date().toDateString();
        
        return {
            totalToday: userLeads.length,
            remaining: SYSTEM_CONFIG.SYSTEM_SETTINGS.maxLeadsPerDay - userLeads.length,
            lastSubmission: userLeads.length > 0 ? userLeads[userLeads.length - 1].timestamp : null
        };
    }
}

// Instância global do sistema de leads
const leadsSystem = new LeadsSystem();