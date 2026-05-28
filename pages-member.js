// ── MINHA CONTA ───────────────────────────────────────
async function loadMinhaConta() {
  const user = currentUser;
  const allDeps = await getDependents();
  const deps = allDeps.filter(d => d.user_id === user.id || d.usuario_id === user.id);

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
  const deps = allDeps.filter(d => d.user_id === user.id || d.usuario_id === user.id);
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

  document.getElementById('agendar-blocked').style.display = isActive ? 'flex' : 'none';
  document.getElementById('agendar-form').style.display   = isActive ? 'none' : 'block';

  if (!isActive) return;

  // Corrige: form visível, bloco oculto quando pagamento OK
  document.getElementById('agendar-blocked').style.display = 'none';
  document.getElementById('agendar-form').style.display    = 'block';

  // Data mínima = hoje; bloqueia fins de semana via onchange
  const today = new Date().toISOString().split('T')[0];
  const dateEl = document.getElementById('appt-date');
  dateEl.min = today;
  dateEl.value = '';

  // Reset select de horários
  resetTimeSelect();

  // Popula pacientes
  const allDeps = await getDependents();
  const deps = allDeps.filter(d => d.user_id === user.id || d.usuario_id === user.id);
  const select = document.getElementById('appt-patient');
  select.innerHTML = `<option value="titular">Eu mesmo (titular)</option>` +
    deps.map(d => `<option value="${d.id}">${d.nome} (${d.parentesco})</option>`).join('');

  // Seleciona titular por padrão e mostra carteirinha
  select.value = 'titular';
  await updatePatientCard();
}

function resetTimeSelect() {
  const select = document.getElementById('appt-time');
  const slots = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00',
                 '14:00','14:30','15:00','15:30','16:00','16:30','17:00'];
  select.innerHTML = '<option value="">Selecione...</option>' +
    slots.map(t => `<option value="${t}">${t}</option>`).join('');
}

async function onDateChange() {
  const dateEl = document.getElementById('appt-date');
  const date   = dateEl.value;
  if (!date) return;

  // Bloqueia fins de semana (0 = dom, 6 = sáb)
  // Usa T12:00 para evitar bug de fuso horário
  const dayOfWeek = new Date(date + 'T12:00:00').getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    showToast('A clínica não atende aos fins de semana. Escolha outro dia.', 'warning');
    dateEl.value = '';
    resetTimeSelect();
    return;
  }

  // Desabilita horários já ocupados para esta data
  resetTimeSelect();
  try {
    const allAppts = await getAppointments();
    const bookedTimes = allAppts
      .filter(a => a.data_hora && a.data_hora.startsWith(date) && a.status === 'confirmed')
      .map(a => (a.data_hora.split(' ')[1] || '').slice(0, 5));

    const select = document.getElementById('appt-time');
    Array.from(select.options).forEach(opt => {
      if (!opt.value) return;
      const taken = bookedTimes.includes(opt.value);
      opt.disabled = taken;
      opt.textContent = taken ? `${opt.value} — Ocupado` : opt.value;
    });

    if (bookedTimes.length > 0) {
      showToast(`${bookedTimes.length} horário(s) já ocupado(s) nesta data`, 'info');
    }
  } catch (e) {
    console.error(e);
  }
}

async function updatePatientCard() {
  const val     = document.getElementById('appt-patient').value;
  const preview = document.getElementById('patient-card-preview');
  const user    = currentUser;

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

// Chamado ao clicar em "Confirmar agendamento" — abre modal de confirmação
async function confirmSchedule() {
  const patient = document.getElementById('appt-patient').value;
  const date    = document.getElementById('appt-date').value;
  const time    = document.getElementById('appt-time').value;
  const type    = document.getElementById('appt-type').value;
  const notes   = document.getElementById('appt-notes').value.trim();

  if (!patient || !date || !time || !type) {
    showToast('Preencha todos os campos obrigatórios', 'error');
    return;
  }

  const user    = currentUser;
  const allDeps = await getDependents();
  const dep     = patient !== 'titular' ? allDeps.find(d => d.id === patient) : null;
  const patientName = dep ? dep.nome : user.nome;

  // Formata data para exibição
  const [y, m, d] = date.split('-');
  const dateFormatted = `${d}/${m}/${y}`;
  const weekdays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const weekday  = weekdays[new Date(date + 'T12:00:00').getDay()];

  document.getElementById('edit-profile-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'edit-profile-modal';
  modal.className = 'modal-overlay';
  modal.style.cssText = 'display:flex;z-index:10001';
  modal.innerHTML = `
    <div class="modal" style="max-width:420px;width:100%;padding:32px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:44px;margin-bottom:8px">📅</div>
        <h3 style="font-size:18px;font-weight:700;color:var(--tx1);margin:0 0 4px">Confirmar agendamento</h3>
        <p style="font-size:13px;color:var(--tx3);margin:0">Verifique os dados antes de confirmar</p>
      </div>

      <div style="background:var(--surface2);border-radius:12px;padding:16px;margin-bottom:20px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;color:var(--tx3)">Paciente</span>
          <span style="font-size:14px;font-weight:600;color:var(--tx1)">${patientName}</span>
        </div>
        <div style="height:1px;background:var(--border)"></div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;color:var(--tx3)">Consulta</span>
          <span class="badge badge-blue">${type}</span>
        </div>
        <div style="height:1px;background:var(--border)"></div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;color:var(--tx3)">Data</span>
          <span style="font-size:14px;font-weight:600;color:var(--tx1)">${weekday}, ${dateFormatted}</span>
        </div>
        <div style="height:1px;background:var(--border)"></div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;color:var(--tx3)">Horário</span>
          <span style="font-size:14px;font-weight:600;color:var(--p-600)">${time}</span>
        </div>
        ${notes ? `<div style="height:1px;background:var(--border)"></div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
          <span style="font-size:13px;color:var(--tx3);flex-shrink:0">Obs.</span>
          <span style="font-size:13px;color:var(--tx2);text-align:right">${notes}</span>
        </div>` : ''}
      </div>

      <div style="background:var(--blue-50);border-radius:8px;padding:10px 14px;margin-bottom:20px;font-size:12px;color:var(--blue-700)">
        ℹ️ O pagamento da consulta é realizado presencialmente no dia do atendimento.
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <button class="btn btn-outline" onclick="document.getElementById('edit-profile-modal').remove()">Editar</button>
        <button class="btn btn-primary" id="btn-confirm-appt" onclick="scheduleAppointment()">Confirmar</button>
      </div>
    </div>
  `;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

async function scheduleAppointment() {
  const patient = document.getElementById('appt-patient').value;
  const date    = document.getElementById('appt-date').value;
  const time    = document.getElementById('appt-time').value;
  const type    = document.getElementById('appt-type').value;
  const notes   = document.getElementById('appt-notes').value.trim();

  if (!patient || !date || !time || !type) {
    showToast('Preencha todos os campos obrigatórios', 'error');
    return;
  }

  const btn = document.getElementById('btn-confirm-appt');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Agendando…'; }

  const user    = currentUser;
  const allDeps = await getDependents();
  const dep     = patient !== 'titular' ? allDeps.find(d => d.id === patient) : null;
  const patientName = dep ? dep.nome : user.nome;

  const payload = {
    usuario_id:    user.id,
    user_id:       user.id,
    dependente_id: dep ? dep.id : null,
    dependent_id:  dep ? dep.id : null,
    data_hora:     date + ' ' + time,
    tipo:          type,
    status:        'confirmed',
    notas:         notes,
    observacoes:   notes,
    paciente_nome: patientName
  };

  try {
    await DB.saveAppointment(payload);

    // Fecha o modal de confirmação
    document.getElementById('edit-profile-modal')?.remove();

    // Limpa formulário
    document.getElementById('appt-date').value  = '';
    document.getElementById('appt-time').value  = '';
    document.getElementById('appt-type').value  = '';
    document.getElementById('appt-notes').value = '';
    document.getElementById('patient-card-preview').style.display = 'none';
    resetTimeSelect();

    showToast('Consulta agendada com sucesso! ✓', 'success');
    window._apptJustBooked = true;
    await navigateTo('historico');
  } catch (e) {
    console.error(e);
    showToast(window.API.handleError(e) || 'Erro ao agendar consulta', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Confirmar'; }
  }
}

// ── HISTORICO ─────────────────────────────────────────
async function loadHistorico() {
  // Banner de sucesso pós-agendamento
  const container = document.getElementById('historico-list');
  if (window._apptJustBooked) {
    window._apptJustBooked = false;
    container.innerHTML = `
      <div style="background:var(--g-50);border:1px solid var(--g-200);border-radius:12px;padding:16px 20px;display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <div style="font-size:28px">✅</div>
        <div>
          <div style="font-weight:600;color:var(--g-700);font-size:14px">Consulta agendada com sucesso!</div>
          <div style="font-size:13px;color:var(--g-600)">Você receberá confirmação em breve. Apareça no horário marcado.</div>
        </div>
      </div>`;
  } else {
    container.innerHTML = '';
  }
  await filterMyAppts('upcoming');
}

async function filterMyAppts(filter) {
  currentMyApptFilter = filter;
  document.getElementById('my-appt-tab-upcoming').classList.toggle('active', filter === 'upcoming');
  document.getElementById('my-appt-tab-past').classList.toggle('active', filter === 'past');

  const user = currentUser;
  const now  = new Date().toISOString().replace('T',' ').slice(0, 16);
  const allAppts = await getAppointments();
  // Aceita tanto user_id quanto usuario_id (normalizado no servidor)
  const appts = allAppts.filter(a =>
    (a.usuario_id || a.user_id) === user.id
  );

  const filtered = appts.filter(a =>
    filter === 'upcoming' ? a.data_hora >= now : a.data_hora < now
  ).sort((a, b) =>
    filter === 'upcoming'
      ? a.data_hora.localeCompare(b.data_hora)
      : b.data_hora.localeCompare(a.data_hora)
  );

  const container = document.getElementById('historico-list');
  // Preserva o banner de sucesso se presente
  const banner = container.querySelector('[style*="border-radius:12px"]');
  const bannerHTML = banner ? banner.outerHTML : '';

  if (filtered.length === 0) {
    container.innerHTML = bannerHTML + `
      <div class="card">
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <div class="empty-title">${filter === 'upcoming' ? 'Nenhuma consulta agendada' : 'Nenhum histórico'}</div>
          <div class="empty-text">${filter === 'upcoming' ? 'Agende sua próxima consulta' : 'Suas consultas anteriores aparecerão aqui'}</div>
          ${filter === 'upcoming' ? '<button class="btn btn-primary" onclick="navigateTo(\'agendar\')">Agendar agora</button>' : ''}
        </div>
      </div>`;
    return;
  }

  const cardsHTML = filtered.map(a => {
    const [datePart, timePart] = (a.data_hora || '').split(' ');
    const [ay, am, ad] = (datePart || '').split('-');
    const obs = a.notas || a.observacoes || '';
    return `
    <div class="card mb-3">
      <div style="padding:18px 22px;display:flex;align-items:center;gap:16px">
        <div style="background:var(--blue-50);border-radius:12px;padding:12px 14px;text-align:center;min-width:58px;flex-shrink:0">
          <div style="font-size:20px;font-weight:700;color:var(--blue-700);line-height:1">${ad || '–'}</div>
          <div style="font-size:11px;color:var(--blue-500);font-weight:500;text-transform:uppercase">${am ? getMonthShort(datePart) : ''}</div>
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
            <span style="font-weight:600;font-size:15px;color:var(--tx1)">${a.tipo || '–'}</span>
            ${statusBadge(a.status)}
          </div>
          <div style="font-size:13px;color:var(--tx3)">Paciente: <strong style="color:var(--tx2)">${a.paciente_nome || '–'}</strong></div>
          <div style="font-size:13px;color:var(--tx3)">Horário: <strong style="color:var(--tx2)">${timePart || '–'}</strong></div>
          ${obs ? `<div style="font-size:12px;color:var(--tx4);margin-top:4px;font-style:italic">📝 ${obs}</div>` : ''}
        </div>
        ${a.status === 'confirmed' ? `
          <button class="btn btn-ghost btn-sm" style="flex-shrink:0;color:var(--r-600)" onclick="cancelMyAppt('${a.id}')">Cancelar</button>
        ` : ''}
      </div>
    </div>`;
  }).join('');

  container.innerHTML = bannerHTML + cardsHTML;
}

async function cancelMyAppt(id) {
  // Modal de confirmação em vez de confirm() nativo
  document.getElementById('edit-profile-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'edit-profile-modal';
  modal.className = 'modal-overlay';
  modal.style.cssText = 'display:flex;z-index:10001';
  modal.innerHTML = `
    <div class="modal" style="max-width:360px;width:100%;padding:32px;text-align:center">
      <div style="font-size:36px;margin-bottom:12px">⚠️</div>
      <h3 style="font-size:17px;font-weight:700;margin:0 0 8px">Cancelar consulta?</h3>
      <p style="font-size:14px;color:var(--tx3);margin:0 0 24px">Esta ação não pode ser desfeita.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <button class="btn btn-outline" onclick="document.getElementById('edit-profile-modal').remove()">Manter</button>
        <button class="btn btn-primary" style="background:var(--r-600)" id="btn-confirm-cancel" onclick="doCancel('${id}')">Cancelar</button>
      </div>
    </div>
  `;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

async function doCancel(id) {
  const btn = document.getElementById('btn-confirm-cancel');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>'; }
  try {
    await window.API.appointments.cancel(id);
    _bust('appointments');
    document.getElementById('edit-profile-modal')?.remove();
    showToast('Consulta cancelada', 'info');
    await loadHistorico();
  } catch (e) {
    console.error(e);
    showToast(window.API.handleError(e) || 'Erro ao cancelar', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Cancelar'; }
  }
}
