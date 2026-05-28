// ── AUTH ──────────────────────────────────────────────
function showRegister() {
  document.getElementById('login-form-wrap').style.display = 'none';
  document.getElementById('register-form-wrap').style.display = 'block';
}

function showLogin() {
  document.getElementById('login-form-wrap').style.display = 'block';
  document.getElementById('register-form-wrap').style.display = 'none';
}

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

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function clearLoginError() {
  const el = document.getElementById('login-error');
  if (el) el.style.display = 'none';
}

async function doLogin() {
  clearLoginError();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showLoginError('Preencha e-mail e senha para continuar.');
    return;
  }

  if (!email.includes('@')) {
    showLoginError('E-mail inválido.');
    return;
  }

  const btn = document.getElementById('btn-login');
  btn.innerHTML = '<span class="spinner"></span> Entrando...';
  btn.disabled = true;

  try {
    const result = await window.API.auth.login(email, password);
    loginSuccess(result.user, result.token);
  } catch (err) {
    console.error('Erro no login:', err);
    const message = window.API.handleError(err) || 'Erro ao fazer login. Tente novamente.';
    showLoginError(message);
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

  const auth = document.getElementById('auth-page');
  const app = document.getElementById('main-app');
  if (app) {
    app.classList.remove('app-visible');
    app.style.setProperty('display', 'none', 'important');
  }
  if (auth) auth.style.setProperty('display', 'block', 'important');

  showToast('Saiu com sucesso', 'info');
}
