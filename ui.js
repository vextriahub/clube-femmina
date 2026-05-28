// ── STATUS BADGE & DATE HELPERS ───────────────────────
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

function relativeTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d)) return '–';
  const diffMs  = Date.now() - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);
  const diffD   = Math.floor(diffMs / 86400000);
  if (diffMin <  2) return 'Agora mesmo';
  if (diffMin < 60) return `Há ${diffMin} min`;
  if (diffH   <  2) return 'Há 1 hora';
  if (diffH   < 24) return `Há ${diffH} horas`;
  if (diffD   ===1) return 'Ontem';
  if (diffD   <  7) return `Há ${diffD} dias`;
  if (diffD   < 30) return `Há ${Math.floor(diffD / 7)} sem.`;
  return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' });
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
  const user = currentUser;
  if (!user) return;

  // Remove modal anterior se existir
  document.getElementById('edit-profile-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'edit-profile-modal';
  modal.className = 'modal-overlay';
  modal.style.cssText = 'display:flex;z-index:10001';
  modal.innerHTML = `
    <div class="modal" style="max-width:420px;width:100%;padding:32px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
        <h3 style="font-size:18px;font-weight:700;color:var(--slate-900);margin:0">Editar dados</h3>
        <button class="btn btn-ghost btn-icon" onclick="document.getElementById('edit-profile-modal').remove()">✕</button>
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label style="font-size:13px;font-weight:600;color:var(--slate-600);display:block;margin-bottom:6px">Nome completo</label>
        <input type="text" id="edit-nome" class="form-input" value="${user.nome || ''}" placeholder="Seu nome completo">
      </div>
      <div class="form-group" style="margin-bottom:24px">
        <label style="font-size:13px;font-weight:600;color:var(--slate-600);display:block;margin-bottom:6px">Telefone</label>
        <input type="text" id="edit-telefone" class="form-input" value="${user.telefone || ''}" placeholder="(00) 00000-0000" maxlength="15" oninput="maskPhone(this)">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <button class="btn btn-outline" onclick="document.getElementById('edit-profile-modal').remove()">Cancelar</button>
        <button class="btn btn-primary" id="btn-save-profile" onclick="saveProfile()">Salvar</button>
      </div>
    </div>
  `;

  // Fecha ao clicar fora
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
  document.getElementById('edit-nome').focus();
}

async function saveProfile() {
  const nome = document.getElementById('edit-nome').value.trim();
  const telefone = document.getElementById('edit-telefone').value.trim();

  if (!nome || nome.length < 2) {
    showToast('Nome inválido', 'error');
    return;
  }

  const btn = document.getElementById('btn-save-profile');
  btn.textContent = 'Salvando…';
  btn.disabled = true;

  try {
    const updated = await window.API.user.updateProfile({ nome, telefone });

    // Atualiza estado local e sessão
    currentUser = { ...currentUser, ...updated };
    sessionStorage.setItem('femmina_session', JSON.stringify(currentUser));
    sessionStorage.setItem('user', JSON.stringify(currentUser));

    document.getElementById('edit-profile-modal').remove();
    showToast('Dados atualizados com sucesso', 'success');

    // Recarrega a página de perfil se estiver visível
    if (document.getElementById('page-minha-conta')?.classList.contains('active')) {
      await loadMinhaConta();
    }
  } catch (err) {
    showToast(window.API.handleError(err) || 'Erro ao salvar', 'error');
    btn.textContent = 'Salvar';
    btn.disabled = false;
  }
}

// ── PAGE LOADING BAR ──────────────────────────────────
function showPageLoading() {
  let bar = document.getElementById('page-load-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'page-load-bar';
    bar.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'height:3px',
      'background:var(--p-500)', 'z-index:99999',
      'transition:width 0.25s ease, opacity 0.3s ease',
      'width:0', 'opacity:1', 'pointer-events:none'
    ].join(';');
    document.body.appendChild(bar);
  }
  bar.style.opacity = '1';
  bar.style.width = '0';
  requestAnimationFrame(() => { bar.style.width = '70%'; });
}

function hidePageLoading() {
  const bar = document.getElementById('page-load-bar');
  if (!bar) return;
  bar.style.width = '100%';
  setTimeout(() => {
    bar.style.opacity = '0';
    setTimeout(() => { bar.style.width = '0'; }, 300);
  }, 200);
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
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, type === 'error' ? 5000 : 3000);
}
