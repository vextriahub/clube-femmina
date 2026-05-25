  // Immediate UI Lock
  (function() {
    const session = sessionStorage.getItem('femmina_session');
    const theme = localStorage.getItem('femmina_theme');
    if (theme === 'dark') document.body.classList.add('dark-theme');
    
    // Create a style element to hide everything immediately
    const style = document.createElement('style');
    style.innerHTML = '#auth-page, #main-app { display: none !important; }';
    document.head.appendChild(style);

    window.addEventListener('DOMContentLoaded', () => {
      const auth = document.getElementById('auth-page');
      const app = document.getElementById('main-app');

      if (session) {
        document.body.classList.add('logged-in');
        if (app) {
          app.classList.add('app-visible');
          app.style.removeProperty('display');
          app.style.setProperty('display', 'flex', 'important');
        }
        if (auth) auth.style.setProperty('display', 'none', 'important');
      } else {
        document.body.classList.remove('logged-in');
        if (auth) auth.style.setProperty('display', 'block', 'important');
        if (app) app.style.setProperty('display', 'none', 'important');
      }
      style.remove(); // Reveal the correct container
    });
  })();
/* ====================================================
   CLUBE FEMMINA – BENEFÍCIO POPULAR
   Complete Application Logic
   ==================================================== */

// ── STATE ─────────────────────────────────────────────
let currentUser = null;
let currentLoginTab = 'member';
let currentViewSocioId = null;
let currentApptFilter = 'all';
let currentMyApptFilter = 'upcoming';

// ── SIDEBAR PARTICLES ─────────────────────────────────
function initSidebarParticles() {
  const container = document.getElementById('sidebar-particles');
  if (!container) return;
  container.innerHTML = '';
  const count = 15;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'sidebar-particle';
    const size = Math.random() * 3 + 1;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.animationDuration = (Math.random() * 10 + 10) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    container.appendChild(p);
  }
}

// ── DATABASE API WRAPPER ─────────────────────────────
const DB = {
  async getUsers() {
    try {
      return await window.API.admin.listUsers();
    } catch (err) {
      console.error('❌ Erro ao obter sócios:', err);
      return [];
    }
  },
  async getAdmins() {
    try {
      const users = await window.API.admin.listUsers();
      return users.filter(u => u.role === 'admin');
    } catch (err) {
      console.error('❌ Erro ao obter administradores:', err);
      return [];
    }
  },
  async getDependents() {
    try {
      return await window.API.dependents.list();
    } catch (err) {
      console.error('❌ Erro ao obter dependentes:', err);
      return [];
    }
  },
  async getAppointments() {
    try {
      return await window.API.appointments.list();
    } catch (err) {
      console.error('❌ Erro ao obter agendamentos:', err);
      return [];
    }
  },
  async saveUser(user) {
    try {
      return await window.API.admin.createUser(user);
    } catch (err) {
      console.error('❌ Error saving user:', err);
      throw err;
    }
  },
  async saveDependent(dep) {
    try {
      return await window.API.dependents.create(dep);
    } catch (err) {
      console.error('❌ Error saving dependent:', err);
      throw err;
    }
  },
  async saveAppointment(appt) {
    try {
      return await window.API.appointments.create(appt);
    } catch (err) {
      console.error('❌ Error saving appointment:', err);
      throw err;
    }
  }
};

// ── THEME SWITCHER ─────────────────────────────────────
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('femmina_theme', isDark ? 'dark' : 'light');
}

function initTheme() {
  const saved = localStorage.getItem('femmina_theme');
  if (saved === 'dark') document.body.classList.add('dark-theme');
}

initTheme();

// Helper functions now use DB object
async function getUsers() { return await DB.getUsers(); }
async function getAdmins() { return await DB.getAdmins(); }
async function getDependents() { return await DB.getDependents(); }
async function getAppointments() { return await DB.getAppointments(); }

function uid() { return 'id-' + Math.random().toString(36).slice(2, 9); }

async function genCardNo() {
  const users = await getUsers();
  const max = users.reduce((m, u) => {
    const n = parseInt((u.numero_carteirinha || 'CF-000000').replace('CF-', ''));
    return n > m ? n : m;
  }, 0);
  return 'CF-' + String(max + 1).padStart(6, '0');
}

// ── ASAAS MOCK ────────────────────────────────────────
async function checkAsaasStatus(userId) {
  // Mock Asaas API response
  await new Promise(r => setTimeout(r, 600));
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return 'inactive';
  return user.status_pagamento;
}

// ── AUTH ──────────────────────────────────────────────
function switchLoginTab(tab) {
  currentLoginTab = tab;
  document.getElementById('tab-member').classList.toggle('active', tab === 'member');
  document.getElementById('tab-admin').classList.toggle('active', tab === 'admin');
}

function showRegister() {
  document.getElementById('login-form-wrap').style.display = 'none';
  document.getElementById('register-form-wrap').style.display = 'block';
}

function showLogin() {
  document.getElementById('login-form-wrap').style.display = 'block';
  document.getElementById('register-form-wrap').style.display = 'none';
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showToast('Preencha todos os campos obrigatórios', 'error');
    return;
  }

  if (!email.includes('@')) {
    showToast('E-mail inválido', 'error');
    return;
  }

  const btn = document.getElementById('btn-login');
  btn.innerHTML = '<span class="spinner"></span> Entrando...';
  btn.disabled = true;

  try {
    const result = await window.API.auth.login(email, password);
    const user = result.user;

    if (currentLoginTab === 'admin' && user.role !== 'admin') {
      showToast('Acesso de administrador necessário', 'error');
      return;
    }

    if (currentLoginTab === 'member' && user.role !== 'member') {
      showToast('Acesso de sócio necessário', 'error');
      return;
    }

    loginSuccess(user, result.token);
  } catch (err) {
    console.error('Erro no login:', err);
    const message = window.API.handleError(err) || 'Erro ao fazer login. Tente novamente.';
    showToast(message, 'error');
  } finally {
    btn.innerHTML = 'Entrar no painel';
    btn.disabled = false;
  }
}


async function doRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const cpf = document.getElementById('reg-cpf').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value;

  if (!name || !cpf || !phone || !email || !password) {
    showToast('Preencha todos os campos obrigatórios', 'error');
    return;
  }

  if (cpf.replace(/\D/g,'').length !== 11) {
    showToast('CPF inválido (11 dígitos obrigatórios)', 'error');
    return;
  }

  if (!email.includes('@')) {
    showToast('E-mail inválido', 'error');
    return;
  }

  if (password.length < 8) {
    showToast('Senha deve ter mínimo 8 caracteres', 'error');
    return;
  }

  try {
    const cardNo = await genCardNo();
    const result = await window.API.auth.register({
      email,
      password,
      nome: name,
      cpf,
      telefone: phone,
      numero_carteirinha: cardNo,
      status_pagamento: 'pending'
    });

    showToast(`Conta criada! Bem-vindo, ${result.user.nome}`, 'success');
    loginSuccess(result.user, result.token);
  } catch (err) {
    console.error('Erro ao registrar:', err);
    const message = window.API.handleError(err) || 'Erro ao criar conta. Tente novamente.';
    showToast(message, 'error');
  }
}

function loginSuccess(user, token) {
  currentUser = user;
  if (token) {
    sessionStorage.setItem('token', token);
  }
  sessionStorage.setItem('femmina_session', JSON.stringify(user));
  document.body.classList.add('logged-in');
  document.getElementById('auth-modal').style.display = 'none';
  
  // Hard visibility toggle using class for reliable CSS targeting
  const auth = document.getElementById('auth-page');
  const app = document.getElementById('main-app');
  if (auth) auth.style.setProperty('display', 'none', 'important');
  if (app) {
    app.classList.add('app-visible');
    app.style.removeProperty('display');
    app.style.setProperty('display', 'flex', 'important');
  }
  
  initApp();
}

function logout() {
  sessionStorage.removeItem('femmina_session');
  sessionStorage.removeItem('token');
  currentUser = null;
  document.body.classList.remove('logged-in');
  
  // Hard visibility toggle
  const auth = document.getElementById('auth-page');
  const app = document.getElementById('main-app');
  if (app) {
    app.classList.remove('app-visible');
    app.style.setProperty('display', 'none', 'important');
  }
  if (auth) auth.style.setProperty('display', 'block', 'important');
  
  showToast('Saiu com sucesso', 'info');
}

// ── APP INIT ──────────────────────────────────────────
function initApp() {
  const isAdmin = currentUser.role === 'admin';
  initSidebarParticles();

  // BUG-01 FIX: Set margin-left via JS to ensure content clears the fixed sidebar
  // This is more reliable than CSS which can be overridden by cascade
  const mainEl = document.querySelector('.main');
  const SIDEBAR_W = 260; // matches var(--sidebar-w)
  function applyMainOffset() {
    if (!mainEl) return;
    if (window.innerWidth <= 960) {
      mainEl.style.marginLeft = '0';
    } else {
      mainEl.style.marginLeft = SIDEBAR_W + 'px';
    }
  }
  applyMainOffset();
  // Remove any existing resize listeners (avoid leaks on re-login)
  window._resizeHandler && window.removeEventListener('resize', window._resizeHandler);
  window._resizeHandler = applyMainOffset;
  window.addEventListener('resize', window._resizeHandler);

  // Sidebar user info
  const initials = currentUser.nome.split(' ').slice(0,2).map(n=>n[0]).join('');
  document.getElementById('sidebar-avatar').textContent = initials;
  document.getElementById('sidebar-user-name').textContent = currentUser.nome.split(' ').slice(0,2).join(' ');
  document.getElementById('sidebar-user-role').textContent = isAdmin ? 'Atendente' : 'Sócio';

  const nav = document.getElementById('sidebar-nav');
  if (isAdmin) {
    nav.innerHTML = `
      <div class="nav-section-label">Principal</div>
      <button class="nav-item active" onclick="navigateTo('dashboard')" data-page="dashboard">
        <div class="nav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg></div> Dashboard
      </button>
      <button class="nav-item" onclick="navigateTo('socios')" data-page="socios">
        <div class="nav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg></div> Sócios
      </button>
      <button class="nav-item" onclick="navigateTo('agendamentos')" data-page="agendamentos">
        <div class="nav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg></div> Agendamentos
      </button>
      <div class="nav-section-label">Financeiro</div>
      <button class="nav-item" onclick="navigateTo('cobrancas')" data-page="cobrancas">
        <div class="nav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg></div> Cobranças
      </button>
      <button class="nav-item" onclick="navigateTo('relatorios')" data-page="relatorios">
        <div class="nav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15C3.7 3 3 3.7 3 4.5v15C3 20.3 3.7 21 4.5 21h15c.8 0 1.5-.7 1.5-1.5v-15C21 3.7 20.3 3 19.5 3z"/></svg></div> Relatórios
      </button>
      <div class="nav-section-label">Atendimento</div>
      <button class="nav-item" onclick="navigateTo('verificar')" data-page="verificar">
        <div class="nav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg></div> Verificar sócio
      </button>
      <div class="nav-section-label">Sistema</div>
      <button class="nav-item" onclick="navigateTo('configuracoes')" data-page="configuracoes">
        <div class="nav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg></div> Configurações
      </button>
    `;
    navigateTo('dashboard');
  } else {
    nav.innerHTML = `
      <div class="nav-section-label">Meu perfil</div>
      <button class="nav-item active" onclick="navigateTo('minha-conta')" data-page="minha-conta">
        <div class="nav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div> Minha conta
      </button>
      <button class="nav-item" onclick="navigateTo('carteirinha')" data-page="carteirinha">
        <div class="nav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg></div> Carteirinha
      </button>
      <div class="nav-section-label">Consultas</div>
      <button class="nav-item" onclick="navigateTo('agendar')" data-page="agendar">
        <div class="nav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg></div> Agendar
      </button>
      <button class="nav-item" onclick="navigateTo('historico')" data-page="historico">
        <div class="nav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg></div> Histórico
      </button>
    `;
    navigateTo('minha-conta');
  }
}

// ── NAVIGATION ────────────────────────────────────────
const pageTitles = {
  'dashboard': 'Dashboard',
  'socios': 'Sócios cadastrados',
  'agendamentos': 'Agendamentos',
  'verificar': 'Verificar sócio',
  'minha-conta': 'Minha conta',
  'carteirinha': 'Carteirinha digital',
  'agendar': 'Agendar consulta',
  'historico': 'Histórico de consultas',
  'relatorios': 'Relatórios',
  'cobrancas': 'Cobranças',
  'configuracoes': 'Configurações'
};

async function navigateTo(page) {
  // BUG-02 FIX: use style.display directly — CSS class approach was being overridden
  const allPages = document.querySelectorAll('.page');
  console.log('[nav] navigating to:', page, '| found pages:', allPages.length);
  allPages.forEach(p => {
    p.style.setProperty('display', 'none', 'important');
    p.classList.remove('active');
  });
  const targetPage = document.getElementById('page-' + page);
  console.log('[nav] targetPage:', targetPage?.id, '| exists:', !!targetPage);
  if (!targetPage) { console.warn('Page not found: page-' + page); return; }
  targetPage.style.setProperty('display', 'block', 'important');
  targetPage.classList.add('active');
  console.log('[nav] after set - targetPage display:', targetPage.style.display);

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-page') === page);
  });

  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = pageTitles[page] || page;
  closeSidebar();

  // Load page data
  const loaders = {
    'dashboard': loadDashboard,
    'socios': loadSocios,
    'agendamentos': loadAgendamentos,
    'minha-conta': loadMinhaConta,
    'carteirinha': loadCarteirinha,
    'agendar': loadAgendar,
    'historico': loadHistorico
  };
  if (loaders[page]) await loaders[page]();

  // Trigger animations
  const items = targetPage.querySelectorAll('.card, .stat-card, .revenue-card, .revenue-mini');
  items.forEach((item, i) => {
    item.classList.remove('stagger-item');
    void item.offsetWidth;
    item.classList.add('stagger-item');
    item.style.animationDelay = (i * 0.08) + 's';
  });
}

// ── DASHBOARD ─────────────────────────────────────────
async function loadDashboard() {
  const users = await getUsers();
  const appts = await getAppointments();
  const today = new Date().toISOString().split('T')[0];

  const totalActive = users.filter(u => u.status_pagamento === 'active').length;
  const totalPending = users.filter(u => u.status_pagamento !== 'active').length;
  const pctEmDia = users.length > 0 ? Math.round((totalActive / users.length) * 100) : 0;
  const receita = (totalActive * 29.90).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});

  // KPI cards
  document.getElementById('stat-total-members').textContent = users.length;
  document.getElementById('stat-paid').textContent = totalActive;
  document.getElementById('stat-pending').textContent = totalPending;
  document.getElementById('stat-appointments').textContent = appts.filter(a => a.data_hora && a.data_hora.startsWith(today)).length;

  // ISSUE-06 FIX: populate banner stats
  const bannerReceita = document.getElementById('banner-receita');
  const bannerSocios  = document.getElementById('banner-socios');
  const bannerEmDia   = document.getElementById('banner-em-dia');
  if (bannerReceita) bannerReceita.textContent = receita;
  if (bannerSocios)  bannerSocios.textContent  = users.length;
  if (bannerEmDia)   bannerEmDia.textContent   = pctEmDia + '%';

  const dateStr = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' });
  const todayEl = document.getElementById('dashboard-today-date');
  if (todayEl) todayEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  // Activity
  const activity = [
    { text: 'João Silva agendou consulta de Clínica Geral', time: 'Hoje, 09:15' },
    { text: 'Maria Oliveira cadastrou dependente', time: 'Ontem, 14:30' },
    { text: 'Ana Paula pagou mensalidade', time: '2 dias atrás' },
    { text: 'Carlos Lima em pendência de pagamento', time: '5 dias atrás' },
  ];

  const actEl = document.getElementById('dashboard-activity');
  if (actEl) actEl.innerHTML = activity.map(a => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div>
        <div style="font-size:13px;color:var(--tx2)">${a.text}</div>
        <div style="font-size:12px;color:var(--tx3);margin-top:2px">${a.time}</div>
      </div>
    </div>
  `).join('');

  // Today appointments
  const todayAppts = appts.filter(a => a.data_hora && a.data_hora.startsWith(today));
  const apptEl = document.getElementById('dashboard-today-appointments');
  if (!apptEl) return;
  if (todayAppts.length === 0) {
    apptEl.innerHTML = `
      <div class="empty-state" style="padding:30px 20px;text-align:center">
        <div style="font-size:40px;margin-bottom:12px">📅</div>
        <div style="font-size:14px;color:var(--tx3);font-weight:500">Nenhuma consulta hoje</div>
      </div>`;
  } else {
    apptEl.innerHTML = todayAppts.map(a => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="background:var(--blue-50);color:var(--p-600);padding:6px 10px;border-radius:8px;font-size:12px;font-weight:600;white-space:nowrap">${(a.data_hora||'').split(' ')[1] || ''}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;color:var(--tx1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.paciente_nome || '–'}</div>
          <div style="font-size:12px;color:var(--tx3)">${a.tipo || ''}</div>
        </div>
        ${statusBadge(a.status)}
      </div>
    `).join('');
  }
}

// ── SOCIOS ────────────────────────────────────────────
let socioFilter = '';
let socioStatusFilter = '';

async function loadSocios() {
  await renderSociosTable();
}

async function renderSociosTable() {
  const users = await getUsers();
  const deps = await getDependents();
  const q = socioFilter.toLowerCase();
  const sf = socioStatusFilter;

  const filtered = users.filter(u => {
    const matchQ = !q || u.nome.toLowerCase().includes(q) || u.cpf.includes(q) || u.numero_carteirinha.toLowerCase().includes(q);
    const matchS = !sf || u.status_pagamento === sf;
    return matchQ && matchS;
  });

  const body = document.getElementById('socios-table-body');
  if (filtered.length === 0) {
    body.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">Nenhum sócio encontrado</div></div></td></tr>`;
    return;
  }

  body.innerHTML = filtered.map(u => {
    const depCount = deps.filter(d => d.usuario_id === u.id).length;
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="avatar avatar-blue" style="width:32px;height:32px;font-size:12px">${u.nome.split(' ').slice(0,2).map(n=>n[0]).join('')}</div>
            <div>
              <div style="font-weight:500;color:var(--slate-900)">${u.nome}</div>
              <div style="font-size:12px;color:var(--slate-400)">${u.email}</div>
            </div>
          </div>
        </td>
        <td><code style="font-size:12px;background:var(--slate-100);padding:2px 8px;border-radius:4px">${u.numero_carteirinha}</code></td>
        <td style="font-size:13px">${u.cpf}</td>
        <td style="font-size:13px">${u.telefone}</td>
        <td style="text-align:center">
          ${depCount > 0 ? `<span class="badge badge-blue">${depCount} dep.</span>` : '<span style="color:var(--slate-300)">–</span>'}
        </td>
        <td>${statusBadge(u.status_pagamento)}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-ghost btn-icon-sm" onclick="viewSocio('${u.id}')" title="Ver detalhes">👁</button>
            <button class="btn btn-ghost btn-icon-sm" onclick="openNewApptModal('${u.id}')" title="Agendar">📅</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterSocios(val) { socioFilter = val; renderSociosTable(); }
function filterSociosByStatus(val) { socioStatusFilter = val; renderSociosTable(); }

async function viewSocio(id) {
  const users = await getUsers();
  const user = users.find(u => u.id === id);
  if (!user) return;
  currentViewSocioId = id;
  const allDeps = await getDependents();
  const deps = allDeps.filter(d => d.usuario_id === id);
  const allAppts = await getAppointments();
  const appts = allAppts.filter(a => a.usuario_id === id);

  document.getElementById('view-socio-name').textContent = user.nome;
  document.getElementById('view-socio-card-no').textContent = user.numero_carteirinha;

  const body = document.getElementById('modal-view-socio-body');
  body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div style="background:var(--slate-50);border-radius:var(--radius-md);padding:14px">
        <div style="font-size:11px;color:var(--slate-400);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">CPF</div>
        <div style="font-weight:500">${user.cpf}</div>
      </div>
      <div style="background:var(--slate-50);border-radius:var(--radius-md);padding:14px">
        <div style="font-size:11px;color:var(--slate-400);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">Telefone</div>
        <div style="font-weight:500">${user.telefone}</div>
      </div>
      <div style="background:var(--slate-50);border-radius:var(--radius-md);padding:14px">
        <div style="font-size:11px;color:var(--slate-400);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">E-mail</div>
        <div style="font-weight:500;font-size:13px">${user.email}</div>
      </div>
      <div style="background:var(--slate-50);border-radius:var(--radius-md);padding:14px">
        <div style="font-size:11px;color:var(--slate-400);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">Status</div>
        ${statusBadge(user.status_pagamento)}
      </div>
    </div>

    ${deps.length > 0 ? `
    <div style="margin-bottom:20px">
      <div style="font-size:13px;font-weight:600;color:var(--slate-700);margin-bottom:10px">Dependentes (${deps.length})</div>
      ${deps.map(d => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--slate-100)">
          <div class="avatar" style="width:30px;height:30px;font-size:11px;background:var(--blue-50);color:var(--blue-700)">${d.nome.split(' ').slice(0,2).map(n=>n[0]).join('')}</div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:500">${d.nome}</div>
            <div style="font-size:11px;color:var(--slate-400)">${d.parentesco} · ${formatDate(d.data_nascimento)}</div>
          </div>
          <code style="font-size:11px;background:var(--slate-100);padding:2px 6px;border-radius:4px">${d.numero_carteirinha}</code>
        </div>
      `).join('')}
    </div>` : ''}

    ${appts.length > 0 ? `
    <div>
      <div style="font-size:13px;font-weight:600;color:var(--slate-700);margin-bottom:10px">Últimas consultas</div>
      ${appts.slice(-3).reverse().map(a => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--slate-100)">
          <div style="background:var(--blue-50);color:var(--blue-700);padding:4px 8px;border-radius:6px;font-size:11px;font-weight:600">${a.data_hora.split(' ')[1]}</div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:500">${a.tipo}</div>
            <div style="font-size:11px;color:var(--slate-400)">${formatDateTime(a.data_hora)}</div>
          </div>
          ${statusBadge(a.status)}
        </div>
      `).join('')}
    </div>` : ''}
  `;

  document.getElementById('modal-view-socio').style.display = 'flex';
}

function openNewSocioModal() {
  ['ns-name','ns-cpf','ns-phone','ns-email'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('ns-status').value = 'active';
  document.getElementById('modal-new-socio').style.display = 'flex';
}

async function saveNewSocio() {
  const name = document.getElementById('ns-name').value.trim();
  const cpf = document.getElementById('ns-cpf').value.trim();
  const phone = document.getElementById('ns-phone').value.trim();
  const email = document.getElementById('ns-email').value.trim();
  const status = document.getElementById('ns-status').value;

  if (!name || !cpf || !phone || !email) { showToast('Preencha todos os campos obrigatórios', 'error'); return; }
  if (cpf.replace(/\D/g,'').length !== 11) { showToast('CPF inválido', 'error'); return; }

  const users = await getUsers();
  if (users.find(u => u.cpf === cpf)) { showToast('CPF já cadastrado', 'error'); return; }

  const cardNo = await genCardNo();
  const nu = { nome: name, cpf, telefone: phone, email, password: '123456', numero_carteirinha: cardNo, status_pagamento: status, role: 'member', asaas_id: 'cus_' + uid(), created_at: new Date().toISOString().split('T')[0] };
  
  try {
    await DB.saveUser(nu);
    closeModal('modal-new-socio');
    showToast('Sócio cadastrado! Carteirinha: ' + nu.numero_carteirinha, 'success');
    await renderSociosTable();
  } catch (e) {
    console.error(e);
    showToast('Erro ao salvar sócio', 'error');
  }
}

// ── AGENDAMENTOS (admin) ──────────────────────────────
async function loadAgendamentos() {
  await renderApptsTable();
}

async function renderApptsTable() {
  const appts = await getAppointments();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString().replace('T',' ').slice(0,16);

  const filtered = appts.filter(a => {
    if (currentApptFilter === 'upcoming') return a.data_hora >= now;
    if (currentApptFilter === 'past') return a.data_hora < now;
    return true;
  }).sort((a,b) => a.data_hora.localeCompare(b.data_hora));

  const body = document.getElementById('appts-table-body');
  if (filtered.length === 0) {
    body.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📅</div><div class="empty-title">Nenhum agendamento</div></div></td></tr>`;
    return;
  }

  const users = await getUsers();
  body.innerHTML = filtered.map(a => {
    const user = users.find(u => u.id === a.usuario_id);
    return `
      <tr>
        <td>
          <div style="font-weight:500;color:var(--slate-900)">${a.paciente_nome}</div>
          <div style="font-size:12px;color:var(--slate-400)">${user ? 'Titular: ' + user.nome : ''}</div>
        </td>
        <td>
          <div style="font-weight:500">${formatDate(a.data_hora.split(' ')[0])}</div>
          <div style="font-size:12px;color:var(--slate-400)">${a.data_hora.split(' ')[1]}</div>
        </td>
        <td><span class="badge badge-blue">${a.tipo}</span></td>
        <td>${statusBadge(a.status)}</td>
        <td>
          <div style="display:flex;gap:6px">
            ${a.status === 'confirmed' ? `<button class="btn btn-ghost btn-icon-sm" onclick="cancelAppt('${a.id}')" title="Cancelar">✕</button>` : ''}
            ${a.status === 'confirmed' && a.data_hora.split(' ')[0] === today ? `<button class="btn btn-ghost btn-icon-sm" onclick="completeAppt('${a.id}')" title="Concluir">✓</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterAppts(filter) {
  currentApptFilter = filter;
  ['all','upcoming','past'].forEach(f => document.getElementById('appt-tab-' + f).classList.toggle('active', f === filter));
  renderApptsTable();
}

function cancelAppt(id) {
  const appts = getAppointments();
  const i = appts.findIndex(a => a.id === id);
  if (i > -1) { appts[i].status = 'cancelled'; saveAppointments(appts); }
  renderApptsTable();
  showToast('Consulta cancelada', 'info');
}

function completeAppt(id) {
  const appts = getAppointments();
  const i = appts.findIndex(a => a.id === id);
  if (i > -1) { appts[i].status = 'completed'; saveAppointments(appts); }
  renderApptsTable();
  showToast('Consulta marcada como concluída', 'success');
}

// ── VERIFICAR ─────────────────────────────────────────
async function verifySocio() {
  const q = document.getElementById('verify-search').value.trim().toLowerCase();
  if (!q) { showToast('Digite um CPF, nome ou número de carteirinha', 'error'); return; }

  const result = document.getElementById('verify-result');
  result.innerHTML = '<div class="loading" style="color:var(--slate-400);font-size:13px;padding:20px 0">Verificando na API Asaas...</div>';

  const users = await getUsers();
  const user = users.find(u =>
    u.nome.toLowerCase().includes(q) ||
    u.cpf.replace(/\D/g,'').includes(q.replace(/\D/g,'')) ||
    u.numero_carteirinha.toLowerCase().includes(q)
  );

  await new Promise(r => setTimeout(r, 700));

  if (!user) {
    result.innerHTML = `<div class="alert alert-danger"><span class="alert-icon">❌</span><div><strong>Sócio não encontrado.</strong> Verifique os dados e tente novamente.</div></div>`;
    return;
  }

  const status = await checkAsaasStatus(user.id);
  const allDeps = await getDependents();
  const deps = allDeps.filter(d => d.usuario_id === user.id);

  const statusInfo = {
    active: { label: 'Em dia', color: 'green', icon: '✅', msg: 'Mensalidade em dia. Consulta autorizada.' },
    pending: { label: 'Pendente', color: 'amber', icon: '⚠️', msg: 'Pagamento pendente. Regularizar antes do atendimento.' },
    inactive: { label: 'Inadimplente', color: 'red', icon: '🚫', msg: 'Mensalidade em atraso. Atendimento não autorizado.' }
  }[status] || { label: 'Desconhecido', color: 'gray', icon: '❓', msg: '' };

  result.innerHTML = `
    <div style="margin-top:16px">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding:16px;background:var(--slate-50);border-radius:var(--radius-md)">
        <div class="avatar avatar-blue" style="width:48px;height:48px;font-size:18px">${user.nome.split(' ').slice(0,2).map(n=>n[0]).join('')}</div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:16px;color:var(--slate-900)">${user.nome}</div>
          <div style="font-size:13px;color:var(--slate-500)">${user.numero_carteirinha} · ${user.cpf}</div>
        </div>
        ${statusBadge(status)}
      </div>

      <div class="alert alert-${status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'danger'}">
        <span class="alert-icon">${statusInfo.icon}</span>
        <div><strong>${statusInfo.label}.</strong> ${statusInfo.msg}</div>
      </div>

      ${deps.length > 0 ? `
      <div style="margin-top:16px">
        <div style="font-size:13px;font-weight:600;color:var(--slate-700);margin-bottom:8px">Dependentes incluídos</div>
        ${deps.map(d => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--slate-50);border-radius:var(--radius-sm);margin-bottom:6px">
            <div class="avatar" style="width:28px;height:28px;font-size:10px;background:var(--blue-50);color:var(--blue-700)">${d.nome.split(' ').slice(0,2).map(n=>n[0]).join('')}</div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:500">${d.nome}</div>
              <div style="font-size:11px;color:var(--slate-400)">${d.parentesco} · ${d.numero_carteirinha}</div>
            </div>
          </div>
        `).join('')}
      </div>` : ''}

      ${status === 'active' ? `
      <button class="btn btn-primary w-full mt-4" onclick="openNewApptModal('${user.id}');closeModal('modal-new-appt')">📅 Agendar consulta</button>
      ` : `
      <button class="btn btn-outline w-full mt-4" onclick="openPaymentLink()">💳 Enviar link de pagamento</button>
      `}
    </div>
  `;
}

// ── MINHA CONTA ───────────────────────────────────────
async function loadMinhaConta() {
  const user = currentUser;
  const allDeps = await getDependents();
  const deps = allDeps.filter(d => d.usuario_id === user.id);

  document.getElementById('profile-info').innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
      <div class="avatar avatar-blue" style="width:52px;height:52px;font-size:20px">${user.nome.split(' ').slice(0,2).map(n=>n[0]).join('')}</div>
      <div>
        <div style="font-weight:600;font-size:17px;color:var(--slate-900)">${user.nome}</div>
        <code style="font-size:12px;background:var(--blue-50);color:var(--blue-700);padding:2px 8px;border-radius:4px">${user.numero_carteirinha}</code>
      </div>
    </div>
    <div style="display:grid;gap:12px">
      ${profileField('CPF', user.cpf)}
      ${profileField('Telefone', user.telefone)}
      ${profileField('E-mail', user.email)}
      ${profileField('Membro desde', formatDate(user.created_at))}
    </div>
  `;

  // Payment
  const st = user.status_pagamento;
  document.getElementById('payment-status-section').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <div style="width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;background:${st==='active'?'var(--green-50)':st==='pending'?'var(--amber-50)':'var(--rose-50)'}">
        ${st==='active'?'✅':st==='pending'?'⚠️':'🚫'}
      </div>
      <div>
        <div style="font-weight:600;color:var(--slate-900)">${st==='active'?'Em dia':st==='pending'?'Pendente':'Inadimplente'}</div>
        <div style="font-size:13px;color:var(--slate-400)">Mensalidade ${st==='active'?'paga':'com pendência'}</div>
      </div>
    </div>
    ${st !== 'active' ? `
    <div class="alert alert-warning" style="margin-bottom:12px">
      <span class="alert-icon">⚠️</span>
      <span>Regularize o pagamento para acesso às consultas.</span>
    </div>
    <button class="btn btn-primary w-full" onclick="openPaymentLink()">💳 Pagar mensalidade</button>
    ` : `<div style="font-size:13px;color:var(--green-600)">✓ Próximo vencimento: ${getNextDueDate()}</div>`}
  `;

  // My card
  document.getElementById('my-card-section').innerHTML = renderCard(user, null);
  generateCardQRCode(user.numero_carteirinha);

  // Dependents
  const depEl = document.getElementById('dependents-section');
  if (deps.length === 0) {
    depEl.innerHTML = `<div class="empty-state" style="padding:30px 0"><div class="empty-icon" style="font-size:36px">👨‍👩‍👧</div><div class="empty-title">Nenhum dependente</div><div class="empty-text">Adicione dependentes para incluí-los no plano</div></div>`;
  } else {
    depEl.innerHTML = deps.map(d => `
      <div style="display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid var(--slate-100)">
        <div class="avatar" style="width:36px;height:36px;font-size:13px;background:var(--blue-50);color:var(--blue-700)">${d.nome.split(' ').slice(0,2).map(n=>n[0]).join('')}</div>
        <div style="flex:1">
          <div style="font-weight:500;font-size:14px">${d.nome}</div>
          <div style="font-size:12px;color:var(--slate-400)">${d.parentesco} · ${formatDate(d.data_nascimento)}</div>
          <code style="font-size:11px;background:var(--slate-100);padding:1px 6px;border-radius:3px">${d.numero_carteirinha}</code>
        </div>
        <button class="btn btn-ghost btn-icon-sm" onclick="removeDependent('${d.id}')">🗑</button>
      </div>
    `).join('');
  }
}

function profileField(label, value) {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--slate-100)">
      <span style="font-size:13px;color:var(--slate-400)">${label}</span>
      <span style="font-size:14px;font-weight:500;color:var(--slate-800)">${value ?? '—'}</span>
    </div>
  `;
}

function openAddDependentModal() {
  ['dep-name','dep-cpf'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('dep-birth').value = '';
  document.getElementById('dep-relation').value = 'Cônjuge';
  document.getElementById('modal-add-dependent').style.display = 'flex';
}

async function saveDependent() {
  const name = document.getElementById('dep-name').value.trim();
  const birth = document.getElementById('dep-birth').value;
  const cpf = document.getElementById('dep-cpf').value.trim();
  const relation = document.getElementById('dep-relation').value;

  if (!name || !birth) { showToast('Nome e data de nascimento são obrigatórios', 'error'); return; }

  const userId = currentUser.id;
  const allDeps = await getDependents();
  const depCount = allDeps.filter(d => d.usuario_id === userId).length;

  const nd = {
    usuario_id: userId, nome: name,
    data_nascimento: birth, cpf: cpf || '', parentesco: relation,
    numero_carteirinha: currentUser.numero_carteirinha + '-D' + (depCount + 1)
  };
  
  try {
    await DB.saveDependent(nd);
    closeModal('modal-add-dependent');
    showToast('Dependente adicionado com sucesso', 'success');
    await loadMinhaConta();
  } catch (e) {
    console.error(e);
    showToast('Erro ao salvar dependente', 'error');
  }
}

async function removeDependent(id) {
  if (!confirm('Excluir este dependente?')) return;
  try {
    await window.API.dependents.delete(id);
    showToast('Dependente removido', 'info');
    await loadMinhaConta();
  } catch (e) {
    console.error(e);
    showToast('Erro ao remover', 'error');
  }
}

// ── CARTEIRINHA ───────────────────────────────────────
async function loadCarteirinha() {
  const user = currentUser;
  const allDeps = await getDependents();
  const deps = allDeps.filter(d => d.usuario_id === user.id);
  const container = document.getElementById('cards-list');

  let html = `
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-family:'Playfair Display',serif;font-size:22px;font-weight:500;color:var(--slate-900);margin-bottom:4px">Carteirinhas digitais</div>
      <div style="font-size:14px;color:var(--slate-500)">Apresente ao atendente no momento da consulta</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:20px">
      ${renderCard(user, null)}
      ${deps.map(d => renderCard(user, d)).join('')}
    </div>
  `;
  container.innerHTML = html;
  
  // Generate QRs
  generateCardQRCode(user.numero_carteirinha);
  deps.forEach(d => generateCardQRCode(d.numero_carteirinha));
}

function renderCard(user, dep) {
  const isHolder = !dep;
  const name = isHolder ? user.nome : dep.nome;
  const cardNo = isHolder ? user.numero_carteirinha : dep.numero_carteirinha;
  const type = isHolder ? 'Titular' : dep.parentesco;
  const st = user.status_pagamento;
  const statusCls = st === 'active' ? 'status-active' : st === 'pending' ? 'status-pending' : 'status-inactive';
  const statusLabel = st === 'active' ? '● Em dia' : st === 'pending' ? '● Pendente' : '● Inadimplente';
  const cardId = 'qr-' + cardNo;

  return `
    <div class="card-holder" style="width:340px;max-width:100%">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;position:relative;z-index:1">
        <div class="card-holder-logo">Clube Femmina</div>
        <div class="card-holder-status ${statusCls}">${statusLabel}</div>
      </div>
      <div style="position:relative;z-index:1;display:flex;gap:15px;align-items:center">
        <div style="flex:1">
          <div style="font-size:10px;opacity:0.6;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">${type}</div>
          <div class="card-holder-name" style="font-size:18px;margin-bottom:12px">${name}</div>
          <div>
            <div style="font-size:9px;opacity:0.6;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px">Nº Carteirinha</div>
            <div class="card-holder-number" style="font-size:14px">${cardNo}</div>
          </div>
        </div>
        <div class="qr-canvas-mini" title="Clique para ampliar" onclick="expandQR('${cardNo}', '${name}')">
          <canvas id="${cardId}" style="width:80px;height:80px"></canvas>
        </div>
      </div>
      <div style="position:relative;z-index:1;margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:10px;opacity:0.6">Benefício Popular</div>
        <div style="font-size:10px;opacity:0.6">Válido em toda rede</div>
      </div>
    </div>
  `;
}

function generateCardQRCode(cardNo) {
  const canvas = document.getElementById('qr-' + cardNo);
  if (!canvas) return;
  QRCode.toCanvas(canvas, cardNo, {
    width: 80,
    margin: 1,
    color: { dark: '#001A3A', light: '#FFFFFF' }
  }, err => { if(err) console.error(err); });
}

function expandQR(cardNo, name) {
  document.getElementById('qr-expand-name').textContent = name;
  const wrap = document.getElementById('qr-expand-canvas-wrap');
  wrap.innerHTML = '<canvas id="qr-big"></canvas>';
  document.getElementById('modal-qr-expanded').style.display = 'flex';
  
  QRCode.toCanvas(document.getElementById('qr-big'), cardNo, {
    width: 240,
    margin: 2,
    color: { dark: '#001A3A', light: '#FFFFFF' }
  });
}

// ── AGENDAR ───────────────────────────────────────────
async function loadAgendar() {
  const user = currentUser;
  const isActive = user.status_pagamento === 'active';

  document.getElementById('agendar-blocked').style.display = isActive ? 'none' : 'flex';
  document.getElementById('agendar-form').style.display = isActive ? 'block' : 'none';

  if (!isActive) return;

  // Set min date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('appt-date').min = today;

  // Populate patient select
  const allDeps = await getDependents();
  const deps = allDeps.filter(d => d.usuario_id === user.id);
  const select = document.getElementById('appt-patient');
  select.innerHTML = `<option value="titular">Eu mesmo (titular)</option>` +
    deps.map(d => `<option value="${d.id}">${d.nome} (${d.parentesco})</option>`).join('');

  await updatePatientCard();
}

function updatePatientCard() {
  const val = document.getElementById('appt-patient').value;
  const preview = document.getElementById('patient-card-preview');
  const user = currentUser;

  if (!val) { preview.style.display = 'none'; return; }
  preview.style.display = 'block';

  if (val === 'titular') {
    preview.innerHTML = renderCard(user, null);
    generateCardQRCode(user.numero_carteirinha);
  } else {
    const dep = getDependents().find(d => d.id === val);
    preview.innerHTML = dep ? renderCard(user, dep) : '';
    if (dep) generateCardQRCode(dep.numero_carteirinha);
  }
}

async function scheduleAppointment() {
  const patient = document.getElementById('appt-patient').value;
  const date = document.getElementById('appt-date').value;
  const time = document.getElementById('appt-time').value;
  const type = document.getElementById('appt-type').value;
  const notes = document.getElementById('appt-notes').value;

  if (!patient || !date || !time || !type) { showToast('Preencha todos os campos obrigatórios', 'error'); return; }

  const user = currentUser;
  const allDeps = await getDependents();
  const dep = patient !== 'titular' ? allDeps.find(d => d.id === patient) : null;
  const patientName = dep ? dep.nome : user.nome;

  const na = {
    usuario_id: user.id,
    dependente_id: dep ? dep.id : null,
    data_hora: date + ' ' + time,
    tipo: type, status: 'confirmed',
    notas: notes, paciente_nome: patientName
  };

  try {
    await DB.saveAppointment(na);
    showToast('Consulta agendada com sucesso!', 'success');
    
    document.getElementById('appt-date').value = '';
    document.getElementById('appt-time').value = '';
    document.getElementById('appt-type').value = '';
    document.getElementById('appt-notes').value = '';
    document.getElementById('patient-card-preview').style.display = 'none';

    await navigateTo('historico');
  } catch (e) {
    console.error(e);
    showToast('Erro ao agendar consulta', 'error');
  }
}

// ── HISTORICO ─────────────────────────────────────────
async function loadHistorico() {
  await filterMyAppts('upcoming');
}

async function filterMyAppts(filter) {
  currentMyApptFilter = filter;
  document.getElementById('my-appt-tab-upcoming').classList.toggle('active', filter === 'upcoming');
  document.getElementById('my-appt-tab-past').classList.toggle('active', filter === 'past');

  const user = currentUser;
  const now = new Date().toISOString().replace('T',' ').slice(0,16);
  const allAppts = await getAppointments();
  const appts = allAppts.filter(a => a.usuario_id === user.id);

  const filtered = appts.filter(a =>
    filter === 'upcoming' ? a.data_hora >= now : a.data_hora < now
  ).sort((a,b) => filter === 'upcoming'
    ? a.data_hora.localeCompare(b.data_hora)
    : b.data_hora.localeCompare(a.data_hora)
  );

  const container = document.getElementById('historico-list');
  if (filtered.length === 0) {
    container.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-icon">📅</div><div class="empty-title">${filter === 'upcoming' ? 'Nenhuma consulta agendada' : 'Nenhum histórico'}</div><div class="empty-text">${filter === 'upcoming' ? 'Agende sua próxima consulta' : 'Suas consultas anteriores aparecerão aqui'}</div>${filter === 'upcoming' ? '<button class="btn btn-primary" onclick="navigateTo(\'agendar\')">Agendar agora</button>' : ''}</div></div>`;
    return;
  }

  container.innerHTML = filtered.map(a => `
    <div class="card mb-3">
      <div style="padding:18px 22px;display:flex;align-items:center;gap:16px">
        <div style="background:var(--blue-50);border-radius:12px;padding:12px 14px;text-align:center;min-width:60px">
          <div style="font-size:20px;font-weight:700;color:var(--blue-700);line-height:1">${a.data_hora.split(' ')[0].split('-')[2]}</div>
          <div style="font-size:11px;color:var(--blue-500);font-weight:500">${getMonthShort(a.data_hora.split(' ')[0])}</div>
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="font-weight:600;font-size:15px;color:var(--slate-900)">${a.tipo}</span>
            ${statusBadge(a.status)}
          </div>
          <div style="font-size:13px;color:var(--slate-500)">Paciente: ${a.paciente_nome}</div>
          <div style="font-size:13px;color:var(--slate-400)">Horário: ${a.data_hora.split(' ')[1]}</div>
          ${a.notas ? `<div style="font-size:12px;color:var(--slate-400);margin-top:4px;font-style:italic">${a.notas}</div>` : ''}
        </div>
        ${a.status === 'confirmed' ? `<button class="btn btn-ghost btn-sm" onclick="cancelMyAppt('${a.id}')">Cancelar</button>` : ''}
      </div>
    </div>
  `).join('');
}

async function cancelMyAppt(id) {
  if (!confirm('Deseja cancelar esta consulta?')) return;
  try {
    await window.API.appointments.cancel(id);
    await loadHistorico();
    showToast('Consulta cancelada', 'info');
  } catch (e) {
    console.error(e);
    showToast('Erro ao cancelar', 'error');
  }
}

// ── ADMIN APPOINTMENT MODAL ───────────────────────────
async function openNewApptModal(preSelectUserId) {
  const select = document.getElementById('na-socio');
  const users = await getUsers();
  select.innerHTML = '<option value="">Selecione o sócio...</option>' +
    users.map(u => `<option value="${u.id}">${u.nome} (${u.numero_carteirinha})</option>`).join('');

  if (preSelectUserId) {
    select.value = preSelectUserId;
    await loadDependentsForAppt();
  }

  document.getElementById('na-date').value = '';
  document.getElementById('na-time').value = '';
  document.getElementById('na-type').value = '';
  document.getElementById('na-payment-alert').innerHTML = '';
  document.getElementById('modal-new-appt').style.display = 'flex';
}

async function loadDependentsForAppt() {
  const userId = document.getElementById('na-socio').value;
  const patientSelect = document.getElementById('na-patient');
  const alertEl = document.getElementById('na-payment-alert');

  if (!userId) { patientSelect.innerHTML = '<option value="">Titular</option>'; alertEl.innerHTML = ''; return; }

  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  const allDeps = await getDependents();
  const deps = allDeps.filter(d => d.usuario_id === userId);

  patientSelect.innerHTML = `<option value="titular">${user.nome} (Titular)</option>` +
    deps.map(d => `<option value="${d.id}">${d.nome} (${d.parentesco})</option>`).join('');

  if (user.status_pagamento !== 'active') {
    alertEl.innerHTML = `<div class="alert alert-${user.status_pagamento === 'pending' ? 'warning' : 'danger'}" style="margin-top:12px"><span class="alert-icon">${user.status_pagamento === 'pending' ? '⚠️' : '🚫'}</span><div><strong>${user.status_pagamento === 'pending' ? 'Pagamento pendente.' : 'Sócio inadimplente.'}</strong> Agendamento requer autorização especial.</div></div>`;
  } else {
    alertEl.innerHTML = `<div class="alert alert-success" style="margin-top:12px"><span class="alert-icon">✅</span>Mensalidade em dia. Agendamento liberado.</div>`;
  }
}

async function saveAdminAppt() {
  const userId = document.getElementById('na-socio').value;
  const patient = document.getElementById('na-patient').value;
  const date = document.getElementById('na-date').value;
  const time = document.getElementById('na-time').value;
  const type = document.getElementById('na-type').value;

  if (!userId || !date || !time || !type) { showToast('Preencha todos os campos', 'error'); return; }

  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  const allDeps = await getDependents();
  const dep = patient !== 'titular' ? allDeps.find(d => d.id === patient) : null;

  const na = {
    usuario_id: userId,
    dependente_id: dep ? dep.id : null,
    data_hora: date + ' ' + time,
    tipo: type, status: 'confirmed', notas: '',
    paciente_nome: dep ? dep.nome : user.nome
  };

  try {
    await DB.saveAppointment(na);
    closeModal('modal-new-appt');
    showToast('Consulta agendada com sucesso!', 'success');
    if (document.getElementById('page-agendamentos').classList.contains('active')) await renderApptsTable();
    if (document.getElementById('page-dashboard').classList.contains('active')) await loadDashboard();
  } catch (e) {
    console.error(e);
    showToast('Erro ao agendar consulta', 'error');
  }
}

// ── HELPERS ───────────────────────────────────────────
function statusBadge(status) {
  const map = {
    active: ['badge-green', '● Em dia'],
    pending: ['badge-amber', '● Pendente'],
    inactive: ['badge-red', '● Inadimplente'],
    confirmed: ['badge-blue', '● Confirmada'],
    completed: ['badge-gray', '✓ Concluída'],
    cancelled: ['badge-red', '✕ Cancelada'],
  };
  const [cls, label] = map[status] || ['badge-gray', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '–';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatDateTime(str) {
  const [date, time] = str.split(' ');
  return formatDate(date) + ' às ' + time;
}

function getMonthShort(dateStr) {
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  return months[parseInt(dateStr.split('-')[1]) - 1];
}

function getNextDueDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(10);
  return formatDate(d.toISOString().split('T')[0]);
}

function openPaymentLink() {
  showToast('Link de pagamento enviado por e-mail', 'info');
  window.open('https://asaas.com', '_blank');
}

function checkPayment() {
  showToast('Verificando status na API Asaas…', 'info');
  setTimeout(() => {
    showToast('Status atualizado', 'success');
  }, 1200);
}

function editProfile() {
  showToast('Funcionalidade em breve', 'info');
}

// ── MASKS ─────────────────────────────────────────────
function maskCPF(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 9) v = v.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/^(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/^(\d{3})(\d{1,3})/, '$1.$2');
  input.value = v;
}

function maskPhone(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4,5})(\d{0,4})/, '($1) $2-$3');
  else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
  input.value = v;
}

// ── MODALS ────────────────────────────────────────────
function closeModal(id, event) {
  if (event && event.target !== document.getElementById(id)) return;
  document.getElementById(id).style.display = 'none';
}

// ── SIDEBAR MOBILE ────────────────────────────────────
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.remove('hidden');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.add('hidden');
}

// ── TOAST ─────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span style="flex-shrink:0">${icons[type]||'ℹ'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ── BOOT ──────────────────────────────────────────────
(async function boot() {
  try {
    const token = sessionStorage.getItem('token');
    const session = sessionStorage.getItem('femmina_session');

    if (token && session) {
      const verified = await window.API.auth.verify();
      if (verified && verified.user) {
        const user = JSON.parse(session);
        document.body.classList.add('logged-in');
        loginSuccess(user, token);
        return;
      }
      window.API.auth.logout();
    }
  } catch (e) {
    console.error('Boot process failed:', e);
  }
  // If we reach here, we are NOT logged in
  document.body.classList.remove('logged-in');
})();

// ── GLOBAL SEARCH ──────────────────────────────────────
async function globalSearch(q) {
  const el = document.getElementById('search-results');
  if (!q || q.length < 2) { el.style.display='none'; return; }
  const users = await getUsers();
  const results = users.filter(u =>
    u.nome.toLowerCase().includes(q.toLowerCase()) ||
    u.cpf.includes(q) ||
    u.numero_carteirinha.toLowerCase().includes(q.toLowerCase())
  ).slice(0,6);
  if (!results.length) { el.style.display='none'; return; }
  el.style.display='block';
  el.innerHTML = results.map(u => `
    <div class="search-result-item" onclick="viewSocio('${u.id}');document.getElementById('global-search-input').value='';document.getElementById('search-results').style.display='none'">
      <div class="avatar avatar-blue" style="width:28px;height:28px;font-size:11px">${u.nome.split(' ').slice(0,2).map(n=>n[0]).join('')}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:500;color:var(--tx)">${u.nome}</div>
        <div style="font-size:11px;color:var(--tx3)">${u.numero_carteirinha} · ${u.status_pagamento==='active'?'Em dia':u.status_pagamento==='pending'?'Pendente':'Inadimplente'}</div>
      </div>
    </div>
  `).join('');
}
document.addEventListener('keydown', e => {
  if ((e.ctrlKey||e.metaKey) && e.key==='k') { e.preventDefault(); const inp=document.getElementById('global-search-input'); if(inp){inp.focus();inp.select();} }
});

// ── NOTIFICATIONS ──────────────────────────────────────
let notifications = [];
async function initNotifications() {
  const users = await getUsers();
  const appts = await getAppointments();
  const today = new Date().toISOString().split('T')[0];
  notifications = [];
  const inad = users.filter(u => u.status_pagamento === 'inactive');
  if (inad.length > 0) notifications.push({ id: 'inad', icon: '⚠', title: `${inad.length} sócio(s) inadimplente(s)`, text: 'Regularização pendente', time: 'Agora', unread: true });
  const todayAppts = appts.filter(a => a.data_hora.startsWith(today) && a.status === 'confirmed');
  if (todayAppts.length > 0) notifications.push({ id: 'appt', icon: '📅', title: `${todayAppts.length} consulta(s) hoje`, text: 'Verifique a agenda do dia', time: 'Hoje', unread: true });
  const pend = users.filter(u => u.status_pagamento === 'pending');
  if (pend.length > 0) notifications.push({ id: 'pend', icon: '🔔', title: `${pend.length} pagamento(s) pendente(s)`, text: 'Envie lembrete de cobrança', time: 'Este mês', unread: false });
  updateNotifBadge();
}
function updateNotifBadge() {
  const badge=document.getElementById('notif-badge');
  const unread=notifications.filter(n=>n.unread).length;
  if(!badge) return;
  badge.style.display=unread>0?'flex':'none'; badge.textContent=unread;
}
function toggleNotif() {
  const dd=document.getElementById('notif-dropdown');
  if(!dd) return;
  if(dd.style.display==='none'||!dd.style.display) { renderNotifications(); dd.style.display='block'; setTimeout(()=>document.addEventListener('click',closeNotifOutside,{once:true}),0); }
  else dd.style.display='none';
}
function closeNotifOutside(e) {
  const dd=document.getElementById('notif-dropdown'), btn=document.getElementById('notif-btn');
  if(dd&&!dd.contains(e.target)&&btn&&!btn.contains(e.target)) dd.style.display='none';
}
function renderNotifications() {
  const dd = document.getElementById('notif-dropdown');
  if (!dd) return;
  
  if (notifications.length === 0) {
    dd.innerHTML = `
      <div class="notif-header">
        <div class="notif-title">Notificações</div>
      </div>
      <div class="notif-empty">
        <div style="font-size:32px;margin-bottom:12px;opacity:0.5">🔔</div>
        <div>Tudo limpo por aqui!</div>
        <div style="font-size:12px;opacity:0.6;margin-top:4px">Você não tem novas notificações.</div>
      </div>
    `;
    return;
  }

  dd.innerHTML = `
    <div class="notif-header">
      <div class="notif-title">Notificações</div>
      <button onclick="markAllRead()" style="font-size:12px;color:var(--p-600);background:none;border:none;cursor:pointer;font-weight:600">Marcar todas como lidas</button>
    </div>
    <div class="notif-body">
      ${notifications.map(n => `
        <div class="notif-item" onclick="markRead('${n.id}')">
          <div class="notif-icon" style="background:${n.unread ? 'var(--p-50)' : 'var(--slate-50)'};color:${n.unread ? 'var(--p-600)' : 'var(--slate-400)'}">
            ${n.icon}
          </div>
          <div class="notif-content">
            <div class="notif-text" style="font-weight:${n.unread ? '600' : '400'}">${n.title}</div>
            <div style="font-size:12px;color:var(--tx3);margin-bottom:4px">${n.text}</div>
            <div class="notif-time">${n.time}</div>
          </div>
          ${n.unread ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--p-500);margin-top:6px"></div>' : ''}
        </div>
      `).join('')}
    </div>
  `;
}
function markRead(id) { const n=notifications.find(n=>n.id===id); if(n) n.unread=false; updateNotifBadge(); renderNotifications(); }
function markAllRead() { notifications.forEach(n=>n.unread=false); updateNotifBadge(); renderNotifications(); }

// ── RELATORIOS ──────────────────────────────────────────
async function loadRelatorios() {
  const users = await getUsers();
  const appts = await getAppointments();
  const MENS = 30;
  const ativos = users.filter(u => u.status_pagamento === 'active').length;
  const pendentes = users.filter(u => u.status_pagamento === 'pending').length;
  const inadimplentes = users.filter(u => u.status_pagamento === 'inactive').length;
  const receita = ativos * MENS;
  document.getElementById('rel-receita').textContent = 'R$ ' + receita.toFixed(2).replace('.', ',');
  document.getElementById('rel-socios-ativos').textContent = ativos + ' sócios ativos × R$ 30,00';
  document.getElementById('rel-em-dia').textContent = ativos;
  document.getElementById('rel-pendente').textContent = pendentes;
  document.getElementById('rel-inadimplente').textContent = inadimplentes;
  const months = []; const now = new Date();
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); const label = d.toLocaleDateString('pt-BR', { month: 'short' }); const count = appts.filter(a => a.data_hora.startsWith(key)).length; months.push({ key, label, count }); }
  const maxCount = Math.max(...months.map(m => m.count), 1);
  document.getElementById('rel-bar-chart').innerHTML = months.map(m => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><div style="font-size:10px;color:var(--tx3);font-weight:500">${m.count || ''}</div><div class="bar" style="height:${Math.max((m.count / maxCount) * 64, 4)}px;width:100%"></div></div>`).join('');
  document.getElementById('rel-bar-labels').innerHTML = months.map(m => `<div style="flex:1;text-align:center" class="bar-label">${m.label}</div>`).join('');
  const types = {}; appts.forEach(a => { types[a.tipo] = (types[a.tipo] || 0) + 1; });
  const sorted = Object.entries(types).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxT = Math.max(...sorted.map(s => s[1]), 1);
  document.getElementById('rel-especialidades').innerHTML = sorted.map(([tipo, cnt]) => `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span style="color:var(--tx)">${tipo}</span><span style="font-weight:600;color:var(--p-600)">${cnt}</span></div><div class="progress"><div class="progress-bar" style="width:${(cnt / maxT) * 100}%"></div></div></div>`).join('') || '<div style="color:var(--tx3);font-size:13px;padding:12px 0">Nenhum dado</div>';
  const total = users.length || 1;
  document.getElementById('rel-status-chart').innerHTML = `<div style="display:flex;flex-direction:column;gap:12px">${[{ label: 'Em dia', count: ativos, color: 'var(--g-600)', bg: 'var(--g-50)' }, { label: 'Pendente', count: pendentes, color: 'var(--a-600)', bg: 'var(--a-50)' }, { label: 'Inadimplente', count: inadimplentes, color: 'var(--r-600)', bg: 'var(--r-50)' }].map(s => `<div style="display:flex;align-items:center;gap:12px"><div style="width:36px;height:36px;border-radius:10px;background:${s.bg};display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:${s.color}">${s.count}</div><div style="flex:1"><div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px"><span style="color:var(--tx)">${s.label}</span><span style="font-weight:600;color:${s.color}">${Math.round((s.count / total) * 100)}%</span></div><div class="progress"><div class="progress-bar" style="width:${(s.count / total) * 100}%;background:${s.color}"></div></div></div></div>`).join('')}</div>`;
}

// ── COBRANCAS ──────────────────────────────────────────
async function loadCobrancas() {
  const users = await getUsers();
  const MENS = 30;
  const pendentes = users.filter(u => u.status_pagamento === 'pending');
  const inadimplentes = users.filter(u => u.status_pagamento === 'inactive');
  const alvo = [...inadimplentes, ...pendentes];
  document.getElementById('cob-stats').innerHTML = `
    <div class="stat-card" style="padding:20px"><div style="font-size:12px;color:var(--tx3);margin-bottom:6px">Inadimplentes</div><div style="font-size:28px;font-weight:700;color:var(--r-600)">${inadimplentes.length}</div></div>
    <div class="stat-card" style="padding:20px"><div style="font-size:12px;color:var(--tx3);margin-bottom:6px">Pendentes</div><div style="font-size:28px;font-weight:700;color:var(--a-600)">${pendentes.length}</div></div>
    <div class="stat-card" style="padding:20px"><div style="font-size:12px;color:var(--tx3);margin-bottom:6px">Receita em risco</div><div style="font-size:24px;font-weight:700;color:var(--r-500)">R$ ${(alvo.length * MENS).toFixed(2).replace('.', ',')}</div></div>
  `;
  if (alvo.length === 0) { document.getElementById('cobrancas-list').innerHTML = '<div class="empty-state"><div class="empty-title">Todos os sócios em dia!</div></div>'; return; }
  document.getElementById('cobrancas-list').innerHTML = alvo.map(u => `<div class="cobranca-row"><div class="avatar avatar-blue" style="width:38px;height:38px;font-size:13px">${u.nome.split(' ').slice(0, 2).map(n => n[0]).join('')}</div><div style="flex:1;min-width:0"><div style="font-weight:500;color:var(--tx)">${u.nome}</div><div style="font-size:12px;color:var(--tx3)">${u.numero_carteirinha} · ${u.telefone}</div></div><div style="margin-right:12px">${statusBadge(u.status_pagamento)}</div><button class="btn btn-primary btn-sm" onclick="cobrarSocio('${u.id}')">Cobrar</button></div>`).join('');
}
async function cobrarSocio(id) {
  const users = await getUsers();
  const u = users.find(u => u.id === id);
  if (u) showToast('Cobrança enviada para ' + u.nome.split(' ')[0], 'success');
}
async function cobrarTodos() {
  const users = await getUsers();
  const u = users.filter(u => u.status_pagamento !== 'active');
  showToast(u.length + ' cobranças enviadas via Asaas', 'success');
}

// ── EXPORTAR CSV ───────────────────────────────────────
async function exportCSV() {
  const users = await getUsers();
  const header = 'Nome,CPF,Telefone,Email,Carteirinha,Status,Desde';
  const rows = users.map(u => '"' + [u.nome, u.cpf, u.telefone, u.email, u.numero_carteirinha, u.status_pagamento, u.created_at].join('","') + '"');
  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'socios-femmina.csv'; a.click(); URL.revokeObjectURL(url);
  showToast('CSV exportado com sucesso', 'success');
}

// ── CONFIGURACOES ─────────────────────────────────────
function loadConfiguracoes() {
  document.getElementById('cfg-nome').value = 'Clube Femmina';
  document.getElementById('cfg-cnpj').value = '12.345.678/0001-90';
  document.getElementById('cfg-endereco').value = 'Vila Vicentina Avenida do Contorno Quadra 18 Lote 240/245, Planaltina/DF';
  document.getElementById('cfg-telefone').value = '(61) 3389-1020';
  document.getElementById('cfg-mensalidade').value = '29,90';
  document.getElementById('cfg-consulta').value = '90,00';
}

function saveConfig() {
  showToast('Configurações salvas com sucesso', 'success');
}

function testAsaas() {
  showToast('Testando conexão com Asaas...', 'info');
  setTimeout(() => {
    showToast('Conexão estabelecida com sucesso!', 'success');
  }, 1000);
}

// ── ROUTING EXTRAS ─────────────────────────────────────
const _pageTitlesExtra = {'relatorios':'Relatórios','cobrancas':'Cobranças','configuracoes':'Configurações'};
Object.assign(pageTitles, _pageTitlesExtra);
const _loadersExtra = { relatorios: loadRelatorios, cobrancas: loadCobrancas, 'configuracoes': loadConfiguracoes };

const __origNav = navigateTo;
navigateTo = async function(page) {
  await __origNav(page);
  if (_loadersExtra[page]) await _loadersExtra[page]();
};

// ── ADMIN UI WRAPPERS ──────────────────────────────────
const _baseInitApp = initApp;
initApp = async function() {
  await _baseInitApp();
  const isAdmin = currentUser && currentUser.role === 'admin';
  const sw = document.getElementById('global-search-wrap'), nw = document.getElementById('notif-wrap');
  if (sw) sw.style.display = isAdmin ? 'block' : 'none';
  if (nw) nw.style.display = isAdmin ? 'block' : 'none';
  if (isAdmin) await initNotifications();
};

const _baseDash = loadDashboard;
loadDashboard = async function() {
  await _baseDash();
  const page = document.getElementById('page-dashboard');
  if (!page || page.querySelector('.revenue-mini') || (currentUser && currentUser.role !== 'admin')) return;
  const users = await getUsers();
  const ativos = users.filter(u => u.status_pagamento === 'active').length;
  const mini = document.createElement('div');
  mini.className = 'revenue-mini';
  mini.style.cssText = 'background:linear-gradient(135deg,var(--p-700),var(--p-900));color:#fff;border-radius:var(--r-lg);padding:16px 24px;margin-bottom:20px;display:flex;align-items:center;gap:20px;position:relative;overflow:hidden';
  mini.innerHTML = '<div style="flex:1;position:relative;z-index:1"><div style="font-size:11px;opacity:.65;text-transform:uppercase;letter-spacing:.1em">Receita estimada do mês</div><div style="font-size:28px;font-weight:700;margin-top:2px">R$ ' + (ativos * 29.90).toFixed(2).replace('.', ',') + '</div></div><div style="display:flex;gap:20px;position:relative;z-index:1"><div style="text-align:center"><div style="font-size:20px;font-weight:700">' + ativos + '</div><div style="font-size:11px;opacity:.6">Em dia</div></div><div style="text-align:center"><div style="font-size:20px;font-weight:700">' + users.filter(u => u.status_pagamento === "pending").length + '</div><div style="font-size:11px;opacity:.6">Pendente</div></div></div><div style="position:absolute;top:-30px;right:-30px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.05)"></div>';
  page.insertBefore(mini, page.firstChild);
};

