// Immediate UI Lock
(function() {
  const session = sessionStorage.getItem('femmina_session');
  const theme = localStorage.getItem('femmina_theme');
  if (theme === 'dark') document.body.classList.add('dark-theme');

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
    style.remove();
  });
})();

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

// ── THEME ─────────────────────────────────────────────
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('femmina_theme', isDark ? 'dark' : 'light');
}

function initTheme() {
  const saved = localStorage.getItem('femmina_theme');
  if (saved === 'dark') document.body.classList.add('dark-theme');
}

initTheme();

// ── HELPERS ───────────────────────────────────────────
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
  await new Promise(r => setTimeout(r, 600));
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return 'inactive';
  return user.status_pagamento;
}
