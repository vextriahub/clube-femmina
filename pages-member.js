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

  document.getElementById('my-card-section').innerHTML = renderCard(user, null);
  generateCardQRCode(user.numero_carteirinha);

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

  container.innerHTML = `
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-family:'Playfair Display',serif;font-size:22px;font-weight:500;color:var(--slate-900);margin-bottom:4px">Carteirinhas digitais</div>
      <div style="font-size:14px;color:var(--slate-500)">Apresente ao atendente no momento da consulta</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:20px">
      ${renderCard(user, null)}
      ${deps.map(d => renderCard(user, d)).join('')}
    </div>
  `;

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
          <canvas id="qr-${cardNo}" style="width:80px;height:80px"></canvas>
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

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('appt-date').min = today;

  const allDeps = await getDependents();
  const deps = allDeps.filter(d => d.usuario_id === user.id);
  const select = document.getElementById('appt-patient');
  select.innerHTML = `<option value="titular">Eu mesmo (titular)</option>` +
    deps.map(d => `<option value="${d.id}">${d.nome} (${d.parentesco})</option>`).join('');

  await updatePatientCard();
}

async function updatePatientCard() {
  const val = document.getElementById('appt-patient').value;
  const preview = document.getElementById('patient-card-preview');
  const user = currentUser;

  if (!val) { preview.style.display = 'none'; return; }
  preview.style.display = 'block';

  if (val === 'titular') {
    preview.innerHTML = renderCard(user, null);
    generateCardQRCode(user.numero_carteirinha);
  } else {
    const allDeps = await getDependents();
    const dep = allDeps.find(d => d.id === val);
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
