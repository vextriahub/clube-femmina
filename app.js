// ── APP INIT ──────────────────────────────────────────
function initApp() {
  const isAdmin = currentUser.role === 'admin';
  initSidebarParticles();

  const mainEl = document.querySelector('.main');
  const SIDEBAR_W = 260;
  function applyMainOffset() {
    if (!mainEl) return;
    if (window.innerWidth <= 960) {
      mainEl.style.marginLeft = '0';
    } else {
      mainEl.style.marginLeft = SIDEBAR_W + 'px';
    }
  }
  applyMainOffset();
  window._resizeHandler && window.removeEventListener('resize', window._resizeHandler);
  window._resizeHandler = applyMainOffset;
  window.addEventListener('resize', window._resizeHandler);

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
  const allPages = document.querySelectorAll('.page');
  allPages.forEach(p => {
    p.style.setProperty('display', 'none', 'important');
    p.classList.remove('active');
  });
  const targetPage = document.getElementById('page-' + page);
  if (!targetPage) { console.warn('Page not found: page-' + page); return; }
  targetPage.style.setProperty('display', 'block', 'important');
  targetPage.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-page') === page);
  });

  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = pageTitles[page] || page;
  closeSidebar();

  const loaders = {
    'dashboard': loadDashboard,
    'socios': loadSocios,
    'agendamentos': loadAgendamentos,
    'minha-conta': loadMinhaConta,
    'carteirinha': loadCarteirinha,
    'agendar': loadAgendar,
    'historico': loadHistorico,
    'verificar': null,
    'relatorios': loadRelatorios,
    'cobrancas': loadCobrancas,
    'configuracoes': loadConfiguracoes,
  };
  if (loaders[page]) await loaders[page]();

  const items = targetPage.querySelectorAll('.card, .stat-card, .revenue-card, .revenue-mini');
  items.forEach((item, i) => {
    item.classList.remove('stagger-item');
    void item.offsetWidth;
    item.classList.add('stagger-item');
    item.style.animationDelay = (i * 0.08) + 's';
  });
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
  if ((e.ctrlKey||e.metaKey) && e.key==='k') {
    e.preventDefault();
    const inp = document.getElementById('global-search-input');
    if (inp) { inp.focus(); inp.select(); }
  }
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
  const badge = document.getElementById('notif-badge');
  const unread = notifications.filter(n=>n.unread).length;
  if (!badge) return;
  badge.style.display = unread > 0 ? 'flex' : 'none';
  badge.textContent = unread;
}

function toggleNotif() {
  const dd = document.getElementById('notif-dropdown');
  if (!dd) return;
  if (dd.style.display === 'none' || !dd.style.display) {
    renderNotifications();
    dd.style.display = 'block';
    setTimeout(() => document.addEventListener('click', closeNotifOutside, {once:true}), 0);
  } else {
    dd.style.display = 'none';
  }
}

function closeNotifOutside(e) {
  const dd = document.getElementById('notif-dropdown'), btn = document.getElementById('notif-btn');
  if (dd && !dd.contains(e.target) && btn && !btn.contains(e.target)) dd.style.display = 'none';
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

function markRead(id) { const n = notifications.find(n=>n.id===id); if(n) n.unread=false; updateNotifBadge(); renderNotifications(); }
function markAllRead() { notifications.forEach(n=>n.unread=false); updateNotifBadge(); renderNotifications(); }

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
