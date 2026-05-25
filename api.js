/**
 * api.js - Cliente HTTP para API Backend
 * Fornece funções para comunicação segura com o backend Express
 */

const API_BASE_URL = window.CONFIG?.API_URL || 'http://localhost:3001';

/**
 * Classe para gerenciar requisições HTTP com token JWT
 */
class APIClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Obtém o token JWT do sessionStorage
   * @returns {string|null} Token JWT ou null
   */
  getToken() {
    return sessionStorage.getItem('token');
  }

  /**
   * Configura headers padrão com autenticação
   * @param {object} headers - Headers adicionais
   * @returns {object} Headers configurados
   */
  getHeaders(headers = {}) {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...headers
    };
  }

  /**
   * Faz requisição HTTP
   * @param {string} endpoint - Endpoint da API
   * @param {object} options - Opções do fetch
   * @returns {Promise<object>} Resposta da API
   */
  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        headers: this.getHeaders(options.headers),
        ...options
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.error || 'Erro na requisição');
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`❌ Erro em ${endpoint}:`, err.message);
      throw err;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  /**
   * POST request
   */
  async post(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }

  /**
   * Verifica se API está online
   * @returns {Promise<boolean>}
   */
  async checkHealth() {
    try {
      const data = await this.get('/health');
      console.log('✅ API online:', data);
      return true;
    } catch (err) {
      console.warn('⚠️ API offline:', err.message);
      return false;
    }
  }
}

/**
 * Endpoints de Autenticação
 */
const auth = {
  /**
   * Login de usuário
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{token, user}>}
   */
  async login(email, password) {
    try {
      const data = await apiClient.post('/auth/login', { email, password });
      
      // Armazena token e usuário
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      
      console.log(`✅ Login bem-sucedido: ${data.user.email}`);
      return data;
    } catch (err) {
      console.error('❌ Erro de login:', err.message);
      throw err;
    }
  },

  /**
   * Registro de novo usuário
   * @param {object} userData - { email, password, nome, cpf }
   * @returns {Promise<{token, user}>}
   */
  async register(userData) {
    try {
      const data = await apiClient.post('/auth/register', userData);
      
      // Armazena token e usuário
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      
      console.log(`✅ Registro bem-sucedido: ${data.user.email}`);
      return data;
    } catch (err) {
      console.error('❌ Erro de registro:', err.message);
      throw err;
    }
  },

  /**
   * Verifica validade do token
   * @returns {Promise<{user}>}
   */
  async verify() {
    try {
      const data = await apiClient.post('/auth/verify');
      console.log('✅ Token válido');
      return data;
    } catch (err) {
      console.warn('⚠️ Token inválido:', err.message);
      return null;
    }
  },

  /**
   * Logout (cliente)
   */
  logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    console.log('✅ Logout realizado');
  },

  /**
   * Obtém usuário autenticado
   * @returns {object|null}
   */
  getCurrentUser() {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Verifica se usuário está autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!sessionStorage.getItem('token');
  }
};

/**
 * Endpoints de Usuário
 */
const dependents = {
  async list(userId) {
    try {
      const query = userId ? `/dependents?user_id=${encodeURIComponent(userId)}` : '/dependents';
      const data = await apiClient.get(query);
      return data.dependents || [];
    } catch (err) {
      console.error('❌ Erro ao listar dependentes:', err.message);
      throw err;
    }
  },

  async create(dependent) {
    try {
      const data = await apiClient.post('/dependents', dependent);
      return data.dependent;
    } catch (err) {
      console.error('❌ Erro ao criar dependente:', err.message);
      throw err;
    }
  },

  async delete(id) {
    try {
      const data = await apiClient.delete(`/dependents/${encodeURIComponent(id)}`);
      return data;
    } catch (err) {
      console.error('❌ Erro ao remover dependente:', err.message);
      throw err;
    }
  }
};

const appointments = {
  async list(userId) {
    try {
      const query = userId ? `/appointments?user_id=${encodeURIComponent(userId)}` : '/appointments';
      const data = await apiClient.get(query);
      return data.appointments || [];
    } catch (err) {
      console.error('❌ Erro ao listar agendamentos:', err.message);
      throw err;
    }
  },

  async create(appointment) {
    try {
      const data = await apiClient.post('/appointments', appointment);
      return data.appointment;
    } catch (err) {
      console.error('❌ Erro ao criar agendamento:', err.message);
      throw err;
    }
  },

  async cancel(id) {
    try {
      const data = await apiClient.put(`/appointments/${encodeURIComponent(id)}/cancel`);
      return data.appointment;
    } catch (err) {
      console.error('❌ Erro ao cancelar agendamento:', err.message);
      throw err;
    }
  }
};

const user = {
  /**
   * Obtém perfil do usuário autenticado
   * @returns {Promise<{user}>}
   */
  async getProfile() {
    try {
      const data = await apiClient.get('/user/profile');
      console.log('✅ Perfil carregado');
      return data.user;
    } catch (err) {
      console.error('❌ Erro ao carregar perfil:', err.message);
      throw err;
    }
  },

  /**
   * Altera senha do usuário
   * @param {string} senhaAtual
   * @param {string} novaSenha
   * @returns {Promise}
   */
  async changePassword(senhaAtual, novaSenha) {
    try {
      const data = await apiClient.put('/user/password', {
        senhaAtual,
        novaSenha
      });
      console.log('✅ Senha alterada');
      return data;
    } catch (err) {
      console.error('❌ Erro ao alterar senha:', err.message);
      throw err;
    }
  }
};

/**
 * Endpoints de Admin
 */
const admin = {
  /**
   * Lista todos os usuários (requer role admin)
   * @returns {Promise<{users}>}
   */
  async listUsers() {
    try {
      const data = await apiClient.get('/users');
      console.log(`✅ Listados ${data.count} usuários`);
      return data.users;
    } catch (err) {
      console.error('❌ Erro ao listar usuários:', err.message);
      throw err;
    }
  },

  /**
   * Cria um novo sócio
   * @param {object} userData
   */
  async createUser(userData) {
    try {
      const data = await apiClient.post('/users', userData);
      console.log(`✅ Sócio criado: ${data.user.email}`);
      return data.user;
    } catch (err) {
      console.error('❌ Erro ao criar usuário:', err.message);
      throw err;
    }
  }
};

/**
 * Instância global do cliente API
 */
const apiClient = new APIClient(API_BASE_URL);

// Exporta para uso em script.js
window.API = {
  client: apiClient,
  auth,
  user,
  dependents,
  appointments,
  admin,
  
  // Funções auxiliares
  async checkConnection() {
    return await apiClient.checkHealth();
  },

  // Tratamento de erros HTTP
  handleError(err) {
    if (err.status === 401) {
      console.warn('⚠️ Sessão expirada');
      auth.logout();
      window.location.href = '#login';
      return 'Sessão expirada, faça login novamente';
    }
    if (err.status === 403) {
      return 'Acesso negado';
    }
    if (err.status === 409) {
      return 'Recurso já existe';
    }
    return err.message || 'Erro na comunicação com servidor';
  }
};

console.log('✅ API Client carregado');
