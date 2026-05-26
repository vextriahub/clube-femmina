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
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, type === 'error' ? 5000 : 3000);
}
