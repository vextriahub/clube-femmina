/**
 * EXEMPLO: Atualização do script.js para usar API Backend
 * 
 * Este arquivo mostra como atualizar as funções de autenticação
 * de script.js para usar o novo backend Express.
 * 
 * Copie e adapte estas funções para seu script.js
 */

// ============================================
// VERSÃO ANTIGA (Insegura - Não usar!)
// ============================================
/*
async function doLogin(email, password) {
  try {
    const users = await DB.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      showToast('Email ou senha incorretos', 'error');
      return;
    }
    sessionStorage.setItem('user', JSON.stringify(user));
    window.location.hash = '#home';
  } catch (err) {
    console.error(err);
  }
}
*/

// ============================================
// VERSÃO NOVA (Segura - Use esta!)
// ============================================

/**
 * Login de usuário (usa API backend)
 * @param {string} email - Email do usuário
 * @param {string} password - Senha em texto plano
 */
async function doLogin(email, password) {
  try {
    // Validação básica
    if (!email || !password) {
      showToast('Email e senha são obrigatórios', 'error');
      return;
    }

    console.log('🔑 Iniciando login...');

    // ✨ Usa a nova API
    const result = await window.API.auth.login(email, password);

    showToast(`Bem-vindo, ${result.user.nome}!`, 'success');
    console.log('✅ Login bem-sucedido');

    // Aguarda um pouco e redireciona
    setTimeout(() => {
      window.location.hash = '#home';
    }, 500);

  } catch (err) {
    console.error('❌ Erro de login:', err);
    
    // Trata erro de forma amigável
    const errorMsg = window.API.handleError(err);
    showToast(errorMsg, 'error');
  }
}

/**
 * Registro de novo usuário
 * @param {string} email - Email
 * @param {string} password - Senha (mínimo 8 caracteres)
 * @param {string} nome - Nome completo
 * @param {string} cpf - CPF
 */
async function doRegister(email, password, nome, cpf) {
  try {
    // Validação
    if (!email || !password || !nome || !cpf) {
      showToast('Todos os campos são obrigatórios', 'error');
      return;
    }

    if (password.length < 8) {
      showToast('Senha deve ter pelo menos 8 caracteres', 'error');
      return;
    }

    console.log('📝 Registrando novo usuário...');

    // ✨ Usa a nova API
    const result = await window.API.auth.register({
      email: email.toLowerCase(),
      password,
      nome,
      cpf
    });

    showToast(`Bem-vindo, ${result.user.nome}!`, 'success');
    console.log('✅ Registro bem-sucedido');

    // Aguarda um pouco e redireciona
    setTimeout(() => {
      window.location.hash = '#home';
    }, 500);

  } catch (err) {
    console.error('❌ Erro de registro:', err);
    const errorMsg = window.API.handleError(err);
    showToast(errorMsg, 'error');
  }
}

/**
 * Verifica se usuário está autenticado
 * @returns {boolean}
 */
function isUserLoggedIn() {
  // ✨ Usa a nova API
  return window.API.auth.isAuthenticated();
}

/**
 * Obtém usuário autenticado
 * @returns {object|null}
 */
function getCurrentUser() {
  // ✨ Usa a nova API
  return window.API.auth.getCurrentUser();
}

/**
 * Logout do usuário
 */
function doLogout() {
  try {
    // ✨ Usa a nova API
    window.API.auth.logout();
    showToast('Logout realizado', 'info');
    console.log('✅ Logout bem-sucedido');
    
    window.location.hash = '#login';
  } catch (err) {
    console.error('❌ Erro de logout:', err);
    showToast('Erro ao fazer logout', 'error');
  }
}

/**
 * Carrega dados do usuário autenticado
 */
async function loadUserProfile() {
  try {
    console.log('📊 Carregando perfil...');

    // ✨ Usa a nova API
    const userData = await window.API.user.getProfile();
    
    console.log('✅ Perfil carregado:', userData);
    return userData;

  } catch (err) {
    console.error('❌ Erro ao carregar perfil:', err);
    
    // Se token expirou, redireciona para login
    if (err.status === 401) {
      window.API.auth.logout();
      window.location.hash = '#login';
    }
    
    showToast('Erro ao carregar perfil', 'error');
  }
}

/**
 * Altera senha do usuário
 * @param {string} senhaAtual - Senha atual
 * @param {string} novaSenha - Nova senha
 */
async function changePassword(senhaAtual, novaSenha) {
  try {
    if (!senhaAtual || !novaSenha) {
      showToast('Preencha todos os campos', 'error');
      return;
    }

    if (novaSenha.length < 8) {
      showToast('Senha deve ter no mínimo 8 caracteres', 'error');
      return;
    }

    console.log('🔒 Alterando senha...');

    // ✨ Usa a nova API
    await window.API.user.changePassword(senhaAtual, novaSenha);

    showToast('Senha alterada com sucesso!', 'success');
    console.log('✅ Senha alterada');

  } catch (err) {
    console.error('❌ Erro ao alterar senha:', err);
    const errorMsg = window.API.handleError(err);
    showToast(errorMsg, 'error');
  }
}

/**
 * Lista todos os usuários (admin only)
 */
async function listAllUsers() {
  try {
    const currentUser = getCurrentUser();
    
    if (currentUser?.role !== 'admin') {
      showToast('Apenas administradores podem acessar', 'error');
      return;
    }

    console.log('📋 Listando usuários...');

    // ✨ Usa a nova API
    const users = await window.API.admin.listUsers();

    console.log('✅ Usuários carregados:', users);
    return users;

  } catch (err) {
    console.error('❌ Erro ao listar usuários:', err);
    const errorMsg = window.API.handleError(err);
    showToast(errorMsg, 'error');
  }
}

/**
 * Verifica conexão com API na inicialização
 */
async function checkAPIConnection() {
  try {
    const isOnline = await window.API.checkConnection();
    
    if (isOnline) {
      console.log('✅ API conectada');
      
      // Se usuário está logado, verifica token
      if (window.API.auth.isAuthenticated()) {
        const verified = await window.API.auth.verify();
        if (!verified) {
          console.warn('⚠️ Token inválido, fazendo logout...');
          window.API.auth.logout();
          window.location.hash = '#login';
        }
      }
    } else {
      console.warn('⚠️ API offline - modo fallback (dados locais)');
      showToast('Erro na conexão com servidor', 'warning');
    }
  } catch (err) {
    console.error('❌ Erro ao verificar API:', err);
  }
}

/**
 * Inicialização da aplicação (call no início de script.js)
 */
async function initializeApp() {
  try {
    console.log('🚀 Inicializando aplicação...');

    // Verifica conexão com API
    await checkAPIConnection();

    // Se usuário estava logado, verifica autenticação
    if (window.API.auth.isAuthenticated()) {
      console.log('✅ Usuário autenticado');
    } else {
      console.log('ℹ️ Usuário não autenticado');
    }

    console.log('✅ Aplicação iniciada');
  } catch (err) {
    console.error('❌ Erro na inicialização:', err);
  }
}

// ============================================
// Chame isso no final de script.js:
// ============================================
// document.addEventListener('DOMContentLoaded', initializeApp);

// ============================================
// RESUMO DE MUDANÇAS
// ============================================
/*
ANTES (Inseguro):
  function doLogin(email, password) {
    const users = await DB.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
  }

DEPOIS (Seguro):
  function doLogin(email, password) {
    const result = await window.API.auth.login(email, password);
  }

BENEFÍCIOS:
  ✅ Validação de senha no servidor (não no cliente)
  ✅ Senhas com hash bcrypt (não armazenadas em texto plano)
  ✅ JWT tokens para sessão segura
  ✅ Rate limiting contra brute force
  ✅ Auditoria de login no servidor
  ✅ Melhor controle de segurança

NÃO ESQUEÇA:
  1. Manter api.js carregado antes de script.js em index.html ✅
  2. Configurar API_URL em config.js para produção
  3. Remover chamadas diretas ao banco de dados de script.js
  4. Testar login/registro antes de deploy
*/
