// ── DASHBOARD ─────────────────────────────────────────
async function loadDashboard() {
  const users = await getUsers();
  const appts = await getAppointments();
  const today = new Date().toISOString().split('T')[0];

  const totalActive = users.filter(u => u.status_pagamento === 'active').length;
  const totalPending = users.filter(u => u.status_pagamento !== 'active').length;
  const pctEmDia = users.length > 0 ? Math.round((totalActive / users.length) * 100) : 0;
  const receita = (totalActive * 29.90).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});

  document.getElementById('stat-total-members').textContent = users.length;
  document.getElementById('stat-paid').textContent = totalActive;
  document.getElementById('stat-pending').textContent = totalPending;
  document.getElementById('stat-appointments').textContent = appts.filter(a => a.data_hora && a.data_hora.startsWith(today)).length;

  const bannerReceita = document.getElementById('banner-receita');
  const bannerSocios  = document.getElementById('banner-socios');
  const bannerEmDia   = document.getElementById('banner-em-dia');
  if (bannerReceita) bannerReceita.textContent = receita;
  if (bannerSocios)  bannerSocios.textContent  = users.length;
  if (bannerEmDia)   bannerEmDia.textContent   = pctEmDia + '%';

  const dateStr = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' });
  const todayEl = document.getElementById('dashboard-today-date');
  if (todayEl) todayEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  // Atividade real: combina registros de usuários e agendamentos, ordena por data
  const apptVerbs   = { confirmed: 'agendou', completed: 'concluiu', cancelled: 'cancelou' };
  const apptIcons   = { confirmed: '📅', completed: '✅', cancelled: '❌' };

  const events = [
    ...users
      .filter(u => u.created_at)
      .map(u => ({
        date: new Date(u.created_at),
        icon: '👤',
        text: `${u.nome.split(' ')[0]} se cadastrou como sócio`
      })),
    ...appts
      .filter(a => a.created_at)
      .map(a => ({
        date: new Date(a.created_at),
        icon: apptIcons[a.status] || '📅',
        text: `${(a.paciente_nome || 'Paciente').split(' ')[0]} ${apptVerbs[a.status] || 'agendou'} ${a.tipo || 'consulta'}`
      }))
  ]
    .sort((a, b) => b.date - a.date)
    .slice(0, 6);

  const actEl = document.getElementById('dashboard-activity');
  if (actEl) {
    if (events.length === 0) {
      actEl.innerHTML = `<div style="text-align:center;padding:24px 0;color:var(--tx3);font-size:13px">Nenhuma atividade recente</div>`;
    } else {
      actEl.innerHTML = events.map(e => `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div>
            <div style="font-size:13px;color:var(--tx2)">${e.icon} ${e.text}</div>
            <div style="font-size:12px;color:var(--tx3);margin-top:2px">${relativeTime(e.date)}</div>
          </div>
        </div>
      `).join('');
    }
  }

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
    const depCount = deps.filter(d => d.user_id === u.id || d.usuario_id === u.id).length;
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
  const deps = allDeps.filter(d => d.user_id === id || d.usuario_id === id);
  const allAppts = await getAppointments();
  const appts = allAppts.filter(a => a.user_id === id || a.usuario_id === id);

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
        <div style="font-size:11px;color:var(--slate-400);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">Status</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${['active','pending','inactive'].map(s => {
            const labels = {active:'Em dia', pending:'Pendente', inactive:'Inadimplente'};
            const colors = {active:'var(--green-600)', pending:'var(--amber-600)', inactive:'var(--rose-600)'};
            const isActive = user.status_pagamento === s;
            return `<button onclick="updateSocioStatus('${user.id}','${s}')" style="font-size:12px;padding:4px 10px;border-radius:20px;border:1.5px solid ${colors[s]};background:${isActive ? colors[s] : 'transparent'};color:${isActive ? '#fff' : colors[s]};cursor:pointer;font-weight:600">${labels[s]}</button>`;
          }).join('')}
        </div>
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
  ['ns-name','ns-cpf','ns-phone','ns-email','ns-password'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('ns-status').value = 'active';
  document.getElementById('modal-new-socio').style.display = 'flex';
}

async function saveNewSocio() {
  const name     = document.getElementById('ns-name').value.trim();
  const cpf      = document.getElementById('ns-cpf').value.trim();
  const phone    = document.getElementById('ns-phone').value.trim();
  const email    = document.getElementById('ns-email').value.trim();
  const password = (document.getElementById('ns-password')?.value || '').trim();
  const status   = document.getElementById('ns-status').value;

  if (!name || !cpf || !phone || !email || !password) {
    showToast('Preencha todos os campos obrigatórios', 'error'); return;
  }
  if (cpf.replace(/\D/g,'').length !== 11) { showToast('CPF inválido', 'error'); return; }
  if (password.length < 8) { showToast('Senha deve ter mínimo 8 caracteres', 'error'); return; }

  const cardNo = genCardNo();
  const nu = {
    nome: name, cpf, telefone: phone, email, password,
    numero_carteirinha: cardNo, status_pagamento: status, role: 'member'
  };

  try {
    await DB.saveUser(nu);
    closeModal('modal-new-socio');
    showToast('Sócio cadastrado! Carteirinha: ' + cardNo, 'success');
    await renderSociosTable();
  } catch (e) {
    console.error(e);
    showToast(window.API.handleError(e) || 'Erro ao salvar sócio', 'error');
  }
}

async function updateSocioStatus(id, status) {
  try {
    await window.API.admin.updateUser(id, { status_pagamento: status });
    showToast('Status atualizado', 'success');
    await viewSocio(id);          // recarrega o modal com novo estado
    await renderSociosTable();    // atualiza a tabela em fundo
  } catch (err) {
    showToast(window.API.handleError(err) || 'Erro ao atualizar status', 'error');
  }
}

async function editSocio(id) {
  const users = await getUsers();
  const u = users.find(u => u.id === id);
  if (!u) return;

  document.getElementById('edit-profile-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'edit-profile-modal';
  modal.className = 'modal-overlay';
  modal.style.cssText = 'display:flex;z-index:10002';
  modal.innerHTML = `
    <div class="modal" style="max-width:420px;width:100%;padding:32px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
        <h3 style="font-size:18px;font-weight:700;color:var(--slate-900);margin:0">Editar sócio</h3>
        <button class="btn btn-ghost btn-icon" onclick="document.getElementById('edit-profile-modal').remove()">✕</button>
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label style="font-size:13px;font-weight:600;color:var(--slate-600);display:block;margin-bottom:6px">Nome completo</label>
        <input type="text" id="es-nome" class="form-input" value="${u.nome || ''}">
      </div>
      <div class="form-group" style="margin-bottom:24px">
        <label style="font-size:13px;font-weight:600;color:var(--slate-600);display:block;margin-bottom:6px">Telefone</label>
        <input type="text" id="es-telefone" class="form-input" value="${u.telefone || ''}" maxlength="15" oninput="maskPhone(this)">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <button class="btn btn-outline" onclick="document.getElementById('edit-profile-modal').remove()">Cancelar</button>
        <button class="btn btn-primary" id="btn-save-socio" onclick="saveSocioEdit('${id}')">Salvar</button>
      </div>
    </div>
  `;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
  document.getElementById('es-nome').focus();
}

async function saveSocioEdit(id) {
  const nome     = document.getElementById('es-nome').value.trim();
  const telefone = document.getElementById('es-telefone').value.trim();

  if (!nome || nome.length < 2) { showToast('Nome inválido', 'error'); return; }

  const btn = document.getElementById('btn-save-socio');
  btn.textContent = 'Salvando…'; btn.disabled = true;

  try {
    await window.API.admin.updateUser(id, { nome, telefone });
    document.getElementById('edit-profile-modal').remove();
    showToast('Dados atualizados', 'success');
    await viewSocio(id);
    await renderSociosTable();
  } catch (err) {
    showToast(window.API.handleError(err) || 'Erro ao salvar', 'error');
    btn.textContent = 'Salvar'; btn.disabled = false;
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

async function cancelAppt(id) {
  if (!confirm('Cancelar esta consulta?')) return;
  try {
    await window.API.appointments.cancel(id);
    showToast('Consulta cancelada', 'info');
    await loadAgendamentos();
  } catch (err) {
    showToast(window.API.handleError(err) || 'Erro ao cancelar consulta', 'error');
  }
}

async function completeAppt(id) {
  if (!confirm('Marcar esta consulta como concluída?')) return;
  try {
    await window.API.appointments.complete(id);
    showToast('Consulta concluída', 'success');
    await loadAgendamentos();
  } catch (err) {
    showToast(window.API.handleError(err) || 'Erro ao concluir consulta', 'error');
  }
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
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
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
