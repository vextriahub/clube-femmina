// ── LOGIN PAGE (nova experiência full-screen) ─────────

function showLoginPage() {
  const page = document.getElementById('login-page');
  page.style.display = 'flex';
  // aguarda repaint para disparar transição CSS
  requestAnimationFrame(() => {
    requestAnimationFrame(() => page.classList.add('lp-visible'));
  });

  // Restaura e-mail lembrado
  const remembered = localStorage.getItem('femmina_email');
  if (remembered) {
    const emailEl = document.getElementById('lp-email');
    if (emailEl) {
      emailEl.value = remembered;
      document.getElementById('lp-remember').checked = true;
    }
  }

  // foco automático após animação
  setTimeout(() => document.getElementById('lp-email')?.focus(), 350);
}

function hideLoginPage() {
  const page = document.getElementById('login-page');
  page.classList.remove('lp-visible');
  setTimeout(() => { page.style.display = 'none'; }, 300);
}

function lpShowLogin() {
  document.getElementById('lp-login-wrap').style.display   = '';
  document.getElementById('lp-register-wrap').style.display = 'none';
  document.getElementById('lp-tab-login').classList.add('active');
  document.getElementById('lp-tab-reg').classList.remove('active');
  clearLoginError();
  setTimeout(() => document.getElementById('lp-email')?.focus(), 80);
}

function lpShowRegister() {
  document.getElementById('lp-login-wrap').style.display   = 'none';
  document.getElementById('lp-register-wrap').style.display = '';
  document.getElementById('lp-tab-login').classList.remove('active');
  document.getElementById('lp-tab-reg').classList.add('active');
  setTimeout(() => document.getElementById('reg-name')?.focus(), 80);
}

// show/hide senha — reutilizável para login e registro
function toggleLpPassword(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon  = document.getElementById(iconId);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  // ícone: olho aberto (visível) ou olho fechado (oculto)
  icon.innerHTML = isHidden
    ? '<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>'
    : '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>';
}

function handleRememberEmail() {
  const checked = document.getElementById('lp-remember').checked;
  const email   = document.getElementById('lp-email').value.trim();
  if (checked && email) localStorage.setItem('femmina_email', email);
  else localStorage.removeItem('femmina_email');
}

// ── FORGOT PASSWORD ───────────────────────────────────
function showForgotPassword() {
  document.getElementById('edit-profile-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'edit-profile-modal';
  modal.className = 'modal-overlay';
  modal.style.cssText = 'display:flex;z-index:10001';
  modal.innerHTML = `
    <div class="modal" style="max-width:380px;width:100%;padding:32px;text-align:center">
      <div style="font-size:40px;margin-bottom:16px">🔑</div>
      <h3 style="font-size:17px;font-weight:700;color:var(--slate-900);margin:0 0 10px">Redefinir senha</h3>
      <p style="font-size:14px;color:var(--slate-500);margin:0 0 20px;line-height:1.5">
        Entre em contato com o administrador do Clube Femmina para redefinir sua senha de acesso.
      </p>
      <div style="background:var(--blue-50);border-radius:8px;padding:12px 16px;margin-bottom:24px;font-size:13px;color:var(--blue-700)">
        📞 Clínica Femmina — Planaltina/DF
      </div>
      <button class="btn btn-primary w-full" onclick="document.getElementById('edit-profile-modal').remove()">Entendido</button>
    </div>
  `;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

// ── ERRO DE LOGIN ─────────────────────────────────────
function showLoginError(msg) {
  const box  = document.getElementById('login-error');
  const text = document.getElementById('login-error-text');
  if (!box) return;
  if (text) text.textContent = msg;
  box.style.display = 'flex';

  // shake no painel de inputs
  const wrap = document.getElementById('lp-login-wrap');
  if (wrap) {
    wrap.classList.remove('lp-shake');
    // força reflow para reiniciar animação
    void wrap.offsetWidth;
    wrap.classList.add('lp-shake');
    wrap.addEventListener('animationend', () => wrap.classList.remove('lp-shake'), { once: true });
  }
}

function clearLoginError() {
  const box = document.getElementById('login-error');
  if (box) box.style.display = 'none';
}

// ── DO LOGIN ──────────────────────────────────────────
async function doLogin() {
  clearLoginError();
  const email    = document.getElementById('lp-email').value.trim().toLowerCase();
  const password = document.getElementById('lp-password').value;

  if (!email || !password) {
    showLoginError('Preencha e-mail e senha para continuar.');
    return;
  }
  if (!email.includes('@')) {
    showLoginError('E-mail inválido.');
    return;
  }

  // Salva e-mail se "lembrar" estiver marcado
  if (document.getElementById('lp-remember')?.checked) {
    localStorage.setItem('femmina_email', email);
  }

  const btn   = document.getElementById('btn-login');
  const label = document.getElementById('btn-login-label');
  if (btn)   btn.disabled = true;
  if (label) label.innerHTML = '<span class="spinner"></span> Entrando…';

  try {
    const result = await window.API.auth.login(email, password);
    loginSuccess(result.user, result.token);
  } catch (err) {
    console.error('Erro no login:', err);
    const message = window.API.handleError(err) || 'Erro ao fazer login. Tente novamente.';
    showLoginError(message);
    showToast(message, 'error');
  } finally {
    if (btn)   btn.disabled = false;
    if (label) label.innerHTML = 'Entrar';
  }
}

// ── DO REGISTER ───────────────────────────────────────
async function doRegister() {
  const name     = document.getElementById('reg-name').value.trim();
  const cpf      = document.getElementById('reg-cpf').value.trim();
  const phone    = document.getElementById('reg-phone').value.trim();
  const email    = document.getElementById('reg-email').value.trim().toLowerCase();
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

  const btn   = document.getElementById('btn-register');
  const label = document.getElementById('btn-register-label');
  if (btn)   btn.disabled = true;
  if (label) label.innerHTML = '<span class="spinner"></span> Criando conta…';

  try {
    const cardNo = genCardNo();
    const result = await window.API.auth.register({
      email,
      password,
      nome: name,
      cpf,
      telefone: phone,
      numero_carteirinha: cardNo,
      status_pagamento: 'pending'
    });
    showWelcomeModal(result.user, result.token);
  } catch (err) {
    console.error('Erro ao registrar:', err);
    const message = window.API.handleError(err) || 'Erro ao criar conta. Tente novamente.';
    showToast(message, 'error');
  } finally {
    if (btn)   btn.disabled = false;
    if (label) label.innerHTML = 'Criar minha conta';
  }
}

// ── LOGIN SUCCESS ─────────────────────────────────────
function loginSuccess(user, token) {
  currentUser = user;
  if (token) sessionStorage.setItem('token', token);
  sessionStorage.setItem('femmina_session', JSON.stringify(user));
  document.body.classList.add('logged-in');

  // Fecha a página de login
  hideLoginPage();

  const auth = document.getElementById('auth-page');
  const app  = document.getElementById('main-app');
  if (auth) auth.style.setProperty('display', 'none', 'important');
  if (app) {
    app.classList.add('app-visible');
    app.style.removeProperty('display');
    app.style.setProperty('display', 'flex', 'important');
  }

  initApp();
}

// ── CONFIRMAÇÃO DE LOGOUT ─────────────────────────────
function confirmLogout() {
  document.getElementById('edit-profile-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'edit-profile-modal';
  modal.className = 'modal-overlay';
  modal.style.cssText = 'display:flex;z-index:10001';
  modal.innerHTML = `
    <div class="modal" style="max-width:360px;width:100%;padding:32px;text-align:center">
      <div style="font-size:36px;margin-bottom:12px">👋</div>
      <h3 style="font-size:17px;font-weight:700;margin:0 0 8px">Sair da conta?</h3>
      <p style="font-size:14px;color:var(--slate-500);margin:0 0 24px">Você precisará fazer login novamente para acessar o painel.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <button class="btn btn-outline" onclick="document.getElementById('edit-profile-modal').remove()">Cancelar</button>
        <button class="btn btn-primary" onclick="document.getElementById('edit-profile-modal').remove();logout()">Sair</button>
      </div>
    </div>
  `;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

// ── LOGOUT ────────────────────────────────────────────
function logout() {
  sessionStorage.removeItem('femmina_session');
  sessionStorage.removeItem('token');
  currentUser = null;
  document.body.classList.remove('logged-in');

  const auth = document.getElementById('auth-page');
  const app  = document.getElementById('main-app');
  if (app) {
    app.classList.remove('app-visible');
    app.style.setProperty('display', 'none', 'important');
  }
  if (auth) auth.style.setProperty('display', 'block', 'important');

  showToast('Saiu com sucesso', 'info');
}

// ── WELCOME MODAL (pós-registro) ──────────────────────
function showWelcomeModal(user, token) {
  // Fecha o login page
  hideLoginPage();

  document.getElementById('welcome-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'welcome-modal';
  modal.className = 'modal-overlay';
  modal.style.cssText = 'display:flex;z-index:10002';

  const primeiroNome = user.nome.split(' ')[0];

  modal.innerHTML = `
    <div class="modal" style="max-width:440px;width:100%;padding:40px;text-align:center">
      <div style="font-size:52px;margin-bottom:16px">🎉</div>
      <h2 style="font-size:22px;font-weight:800;color:var(--slate-900);margin:0 0 8px">
        Bem-vinda, ${primeiroNome}!
      </h2>
      <p style="font-size:14px;color:var(--slate-500);margin:0 0 24px;line-height:1.6">
        Sua conta foi criada com sucesso. Você já tem acesso a todos os benefícios do Clube Femmina.
      </p>

      <div style="background:linear-gradient(135deg,var(--p-600),var(--p-400));border-radius:12px;padding:20px;margin-bottom:24px;color:#fff">
        <div style="font-size:11px;opacity:0.8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px">Número da carteirinha</div>
        <div style="font-size:24px;font-weight:800;letter-spacing:0.08em">${user.numero_carteirinha || '—'}</div>
      </div>

      <div style="text-align:left;background:var(--slate-50);border-radius:10px;padding:16px;margin-bottom:28px">
        <div style="font-size:13px;font-weight:700;color:var(--slate-700);margin-bottom:10px">Próximos passos</div>
        <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;color:var(--slate-600)">
          <div>✅ Regularize o pagamento para ativar o plano</div>
          <div>👨‍👩‍👧 Adicione seus dependentes em "Minha conta"</div>
          <div>📅 Agende sua primeira consulta pela aba "Agendar"</div>
          <div>📱 Acesse sua carteirinha digital a qualquer hora</div>
        </div>
      </div>

      <button class="btn btn-primary w-full" style="font-size:15px;padding:14px" onclick="
        document.getElementById('welcome-modal').remove();
        loginSuccess(${JSON.stringify(user)}, ${JSON.stringify(token)});
      ">Acessar minha conta →</button>
    </div>
  `;

  document.body.appendChild(modal);
}
