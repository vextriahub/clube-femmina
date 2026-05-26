/**
 * CONFIGURAÇÕES DE AMBIENTE
 * Este arquivo centraliza todas as variáveis de ambiente e configurações
 * 
 * IMPORTANTE: Não comite credenciais reais aqui!
 * Use variáveis de ambiente ou arquivo .env na produção
 */

const ENV = (typeof process !== 'undefined' && process.env) ? process.env : {};

const CONFIG = {
  // ========== BACKEND ===========
  API_URL: ENV.API_URL || 'http://localhost:3001',
  SUPABASE_URL: ENV.SUPABASE_URL || 'https://sua-url-supabase.supabase.co',

  // NOTE: The browser config does not expose the Supabase anon key.

  // ========== ASAAS PAYMENT ==========
  ASAAS_API_KEY: ENV.ASAAS_API_KEY || '',
  ASAAS_WEBHOOK_SECRET: ENV.ASAAS_WEBHOOK_SECRET || '',
  
  // ========== APP SETTINGS ==========
  APP_NAME: 'Clube Femmina',
  APP_VERSION: '4.0.0',
  APP_ENVIRONMENT: ENV.NODE_ENV || 'development',
  
  // ========== PRICING ==========
  MONTHLY_PRICE: 29.90,
  DISCOUNT_PERCENTAGE: 40,
  MAX_DEPENDENTS: 5,
  
  // ========== CLINIC INFO ==========
  CLINIC_NAME: 'Clínica Femmina',
  CLINIC_ADDRESS: 'Vila Vicentina Avenida do Contorno Quadra 18 Lote 240/245, Planaltina/DF',
  CLINIC_PHONE: '(61) 3333-3333',
  CLINIC_CNPJ: '00.000.000/0000-00',
  
  // ========== DEMO CREDENTIALS (ONLY FOR DEVELOPMENT) ==========
  DEMO_ENABLED: ENV.DEMO_ENABLED === 'true' || false,
  
  // ========== FEATURE FLAGS ==========
  FEATURES: {
    PAYMENT_INTEGRATION: ENV.ENABLE_PAYMENT === 'true' || false,
    APPOINTMENT_SMS_REMINDER: ENV.ENABLE_SMS === 'true' || false,
    ANALYTICS: ENV.ENABLE_ANALYTICS === 'true' || false,
  }
};

// Expose global config in browser and Node
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}

// Validação de configuração
function validateConfig() {
  const errors = [];
  
  if (CONFIG.APP_ENVIRONMENT === 'production') {
    if (!CONFIG.API_URL || CONFIG.API_URL.includes('localhost')) {
      errors.push('❌ API_URL não configurada para produção');
    }
    if (CONFIG.DEMO_ENABLED) {
      console.warn('⚠️  DEMO_ENABLED ativado em produção - desativar para maior segurança');
    }
  }
  
  if (errors.length > 0) {
    console.error('Erros de configuração:', errors);
    if (CONFIG.APP_ENVIRONMENT === 'production') {
      throw new Error('Configuração inválida para produção');
    }
  }
}

if (typeof window !== 'undefined') {
  validateConfig();
}

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
