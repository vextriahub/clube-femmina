import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// ====== CONFIGURAÇÃO ======
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-longa-e-segura-aqui';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ====== INICIALIZAÇÃO SUPABASE ======
const supabaseUrl = process.env.SUPABASE_URL;
// Prefer service role key (bypasses RLS) for server-side operations;
// fall back to anon key if service role key is not configured.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_ANON_KEY) não configuradas!');
  if (!process.env.VERCEL) process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ====== MIDDLEWARE DE SEGURANÇA ======
app.use(helmet()); // Headers de segurança
app.use(cors({
  origin: process.env.FRONTEND_URL || (process.env.VERCEL ? true : ['http://localhost:5000', 'http://localhost:3000']),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP
  message: 'Muitas requisições deste IP, tente novamente mais tarde',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentativas de login por IP
  message: 'Muitas tentativas de login, tente novamente mais tarde',
  skipSuccessfulRequests: true,
});

app.use(limiter);
app.use(express.json({ limit: '10kb' })); // Limita tamanho do payload

// ====== MIDDLEWARE DE AUTENTICAÇÃO ======
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ Erro ao verificar token:', err.message);
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
};

// ====== FUNÇÕES AUXILIARES ======

/**
 * Gera hash de senha usando bcrypt
 * @param {string} senha - Senha em texto plano
 * @returns {Promise<string>} Hash da senha
 */
const hashSenha = async (senha) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(senha, salt);
  } catch (err) {
    console.error('❌ Erro ao gerar hash:', err);
    throw err;
  }
};

/**
 * Compara senha com hash
 * @param {string} senha - Senha em texto plano
 * @param {string} hash - Hash da senha
 * @returns {Promise<boolean>}
 */
const compararSenha = async (senha, hash) => {
  try {
    return await bcrypt.compare(senha, hash);
  } catch (err) {
    console.error('❌ Erro ao comparar senha:', err);
    return false;
  }
};

/**
 * Gera token JWT
 * @param {object} payload - Dados a incluir no token
 * @returns {string} Token JWT
 */
const gerarToken = (payload) => {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  } catch (err) {
    console.error('❌ Erro ao gerar token:', err);
    throw err;
  }
};

// ====== ROTAS ======

/**
 * GET /health - Verifica se a API está online
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    supabase: supabaseUrl ? '✅' : '❌'
  });
});

/**
 * POST /auth/login - Autenticação de usuário
 * Corpo: { email: string, password: string }
 * Retorno: { token: string, user: object }
 */
app.post('/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação de entrada
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email e senha devem ser strings' });
    }

    // Busca usuário no Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, password_hash, role, nome, status_pagamento')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      console.warn(`⚠️ Erro ao buscar usuário ${email}:`, JSON.stringify(error));
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Verifica senha
    const senhaValida = await compararSenha(password, users.password_hash);
    if (!senhaValida) {
      console.warn(`⚠️ Tentativa de login com senha incorreta: ${email}`);
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Gera token
    const token = gerarToken({
      id: users.id,
      email: users.email,
      role: users.role
    });

    console.log(`✅ Login bem-sucedido: ${email}`);

    res.json({
      success: true,
      token,
      user: {
        id: users.id,
        email: users.email,
        nome: users.nome,
        role: users.role,
        status_pagamento: users.status_pagamento
      }
    });

  } catch (err) {
    console.error('❌ Erro no login:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /auth/register - Registro de novo usuário
 * Corpo: { email: string, password: string, nome: string, cpf: string }
 * Retorno: { token: string, user: object }
 */
app.post('/auth/register', authLimiter, async (req, res) => {
  try {
    const { email, password, nome, cpf, telefone, numero_carteirinha } = req.body;

    // Validação
    if (!email || !password || !nome || !cpf) {
      return res.status(400).json({ error: 'Email, senha, nome e CPF são obrigatórios' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 8 caracteres' });
    }

    // Verifica se email já existe
    const { data: existente, error: existsError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existsError) {
      console.error('❌ Erro ao verificar usuário existente:', existsError);
      return res.status(500).json({ error: 'Erro ao registrar usuário' });
    }

    if (existente) {
      return res.status(409).json({ error: 'Email já registrado' });
    }

    // Hash da senha
    const passwordHash = await hashSenha(password);
    const cardNo = numero_carteirinha || `CF-${Math.floor(Math.random() * 900000 + 100000)}`;

    // Cria novo usuário
    const { data: novoUsuario, error } = await supabase
      .from('users')
      .insert([{
        email: email.toLowerCase(),
        password_hash: passwordHash,
        nome,
        cpf,
        telefone: telefone || null,
        numero_carteirinha: cardNo,
        role: 'member',
        status_pagamento: 'pending',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar usuário (Supabase):', JSON.stringify(error));
      return res.status(500).json({ error: 'Erro ao registrar usuário', detail: error.message || error.code });
    }

    // Gera token
    const token = gerarToken({
      id: novoUsuario.id,
      email: novoUsuario.email,
      role: novoUsuario.role
    });

    console.log(`✅ Novo registro: ${email}`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: novoUsuario.id,
        email: novoUsuario.email,
        nome: novoUsuario.nome,
        role: novoUsuario.role,
        telefone: novoUsuario.telefone,
        numero_carteirinha: novoUsuario.numero_carteirinha,
        status_pagamento: novoUsuario.status_pagamento
      }
    });

  } catch (err) {
    console.error('❌ Erro no registro:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /auth/verify - Verifica validade do token
 */
app.post('/auth/verify', verifyToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

/**
 * GET /user/profile - Obtém perfil do usuário autenticado
 */
app.get('/user/profile', verifyToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Remove senha do retorno
    const { password_hash, ...userData } = user;

    res.json({
      success: true,
      user: userData
    });

  } catch (err) {
    console.error('❌ Erro ao buscar perfil:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /user/profile - Atualiza dados do perfil (nome e telefone)
 */
app.put('/user/profile', verifyToken, async (req, res) => {
  try {
    const { nome, telefone } = req.body;

    if (!nome || typeof nome !== 'string' || nome.trim().length < 2) {
      return res.status(400).json({ error: 'Nome inválido' });
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update({ nome: nome.trim(), telefone: telefone?.trim() || null })
      .eq('id', req.user.id)
      .select('id, email, nome, telefone, role, status_pagamento, numero_carteirinha, created_at')
      .single();

    if (error) throw error;

    console.log(`✅ Perfil atualizado: ${req.user.email}`);
    res.json({ success: true, user: updated });
  } catch (err) {
    console.error('❌ Erro ao atualizar perfil:', err);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

/**
 * PUT /user/password - Altera senha do usuário
 * Corpo: { senhaAtual: string, novaSenha: string }
 */
app.put('/user/password', verifyToken, async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (novaSenha.length < 8) {
      return res.status(400).json({ error: 'Nova senha deve ter pelo menos 8 caracteres' });
    }

    // Busca usuário
    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verifica senha atual
    const senhaValida = await compararSenha(senhaAtual, user.password_hash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Hash da nova senha
    const novoHash = await hashSenha(novaSenha);

    // Atualiza
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: novoHash })
      .eq('id', req.user.id);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Senha alterada para usuário: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });

  } catch (err) {
    console.error('❌ Erro ao alterar senha:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /users - Lista todos os usuários (apenas para ADMIN)
 */
app.get('/users', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, nome, role, status_pagamento, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      count: users.length,
      users
    });

  } catch (err) {
    console.error('❌ Erro ao listar usuários:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /dependents - Lista dependentes do usuário autenticado ou todos para admin
 */
app.get('/dependents', verifyToken, async (req, res) => {
  try {
    let query = supabase.from('dependents').select('*');
    if (req.user.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    } else if (req.query.user_id) {
      query = query.eq('user_id', req.query.user_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, dependents: data || [] });
  } catch (err) {
    console.error('❌ Erro ao listar dependentes:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /dependents - Cria um dependente
 */
app.post('/dependents', verifyToken, async (req, res) => {
  try {
    const { usuario_id, user_id, nome, cpf, parentesco, data_nascimento, numero_carteirinha } = req.body;
    const ownerId = user_id || usuario_id || req.user.id;

    if (!nome || !data_nascimento) {
      return res.status(400).json({ error: 'Nome e data de nascimento são obrigatórios' });
    }

    if (req.user.role !== 'admin' && ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const payload = {
      user_id: ownerId,
      nome,
      cpf: cpf || null,
      parentesco: parentesco || 'Dependente',
      data_nascimento,
      numero_carteirinha: numero_carteirinha || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('dependents').insert([payload]).select().single();
    if (error) throw error;

    res.status(201).json({ success: true, dependent: data });
  } catch (err) {
    console.error('❌ Erro ao criar dependente:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /dependents/:id - Remove um dependente
 */
app.delete('/dependents/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: existing, error: fetchError } = await supabase.from('dependents').select('*').eq('id', id).single();
    if (fetchError) {
      return res.status(404).json({ error: 'Dependente não encontrado' });
    }

    if (req.user.role !== 'admin' && existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { error } = await supabase.from('dependents').delete().eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: 'Dependente removido' });
  } catch (err) {
    console.error('❌ Erro ao remover dependente:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /appointments - Lista agendamentos do usuário ou todos para admin
 */
app.get('/appointments', verifyToken, async (req, res) => {
  try {
    let query = supabase.from('appointments').select('*');
    if (req.user.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    } else if (req.query.user_id) {
      query = query.eq('user_id', req.query.user_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, appointments: data || [] });
  } catch (err) {
    console.error('❌ Erro ao listar agendamentos:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /appointments - Cria um agendamento
 */
app.post('/appointments', verifyToken, async (req, res) => {
  try {
    const {
      usuario_id,
      user_id,
      dependente_id,
      paciente_nome,
      data_hora,
      tipo,
      status = 'confirmed',
      notas,
      pacienteNome
    } = req.body;

    const ownerId = user_id || usuario_id || req.user.id;

    if (!data_hora || !tipo || !paciente_nome) {
      return res.status(400).json({ error: 'Data/hora, tipo e paciente são obrigatórios' });
    }

    if (req.user.role !== 'admin' && ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const payload = {
      user_id: ownerId,
      dependent_id: dependente_id || null,
      paciente_nome: paciente_nome || pacienteNome,
      data_hora,
      tipo,
      status,
      observacoes: notas || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('appointments').insert([payload]).select().single();
    if (error) throw error;

    res.status(201).json({ success: true, appointment: data });
  } catch (err) {
    console.error('❌ Erro ao criar agendamento:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /appointments/:id/cancel - Cancela um agendamento
 */
app.put('/appointments/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: existing, error: fetchError } = await supabase.from('appointments').select('*').eq('id', id).single();
    if (fetchError) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    if (req.user.role !== 'admin' && existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { data, error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id).select().single();
    if (error) throw error;

    res.json({ success: true, appointment: data });
  } catch (err) {
    console.error('❌ Erro ao cancelar agendamento:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /users/:id - Atualiza dados de um sócio (admin only)
 * Corpo: { nome?, telefone?, status_pagamento? }
 */
app.put('/users/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { id } = req.params;
    const { nome, telefone, status_pagamento } = req.body;

    const allowedStatus = ['active', 'pending', 'inactive'];
    if (status_pagamento && !allowedStatus.includes(status_pagamento)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const payload = {};
    if (nome !== undefined) payload.nome = nome.trim();
    if (telefone !== undefined) payload.telefone = telefone?.trim() || null;
    if (status_pagamento !== undefined) payload.status_pagamento = status_pagamento;

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', id)
      .select('id, email, nome, telefone, role, status_pagamento, numero_carteirinha, created_at')
      .single();

    if (error) throw error;

    console.log(`✅ Admin atualizou usuário ${id}`);
    res.json({ success: true, user: data });
  } catch (err) {
    console.error('❌ Erro ao atualizar usuário:', err);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

/**
 * PUT /appointments/:id/complete - Conclui um agendamento (admin only)
 */
app.put('/appointments/:id/complete', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { id } = req.params;
    const { data: existing, error: fetchError } = await supabase.from('appointments').select('*').eq('id', id).single();
    if (fetchError) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    const { data, error } = await supabase.from('appointments').update({ status: 'completed' }).eq('id', id).select().single();
    if (error) throw error;

    res.json({ success: true, appointment: data });
  } catch (err) {
    console.error('❌ Erro ao concluir agendamento:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /users - Cria um novo sócio (admin only)
 */
app.post('/users', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { email, password, nome, cpf, telefone, numero_carteirinha, status_pagamento = 'pending', role = 'member' } = req.body;
    if (!email || !password || !nome || !cpf) {
      return res.status(400).json({ error: 'Email, senha, nome e CPF são obrigatórios' });
    }

    const { data: existing, error: existsError } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle();
    if (existsError) {
      console.error('❌ Erro ao verificar usuário existente:', existsError);
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }

    if (existing) {
      return res.status(409).json({ error: 'Email já registrado' });
    }

    const passwordHash = await hashSenha(password);
    const payload = {
      email: email.toLowerCase(),
      password_hash: passwordHash,
      nome,
      cpf,
      telefone: telefone || null,
      numero_carteirinha: numero_carteirinha || null,
      role,
      status_pagamento,
      created_at: new Date().toISOString()
    };

    const { data: newUser, error } = await supabase.from('users').insert([payload]).select().single();
    if (error) {
      console.error('❌ Erro ao criar usuário admin:', error);
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }

    res.status(201).json({ success: true, user: newUser });
  } catch (err) {
    console.error('❌ Erro ao criar usuário admin:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ====== ERROR HANDLER ======
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    ...(NODE_ENV === 'development' && { details: err.message })
  });
});

// ====== INICIALIZAÇÃO ======
if (!process.env.VERCEL) app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🏥 Clube Femmina API - v1.0.0       ║
╚════════════════════════════════════════╝

✅ Servidor iniciado em http://localhost:${PORT}
🔒 JWT Secret configurado
🗄️  Supabase conectado
🌍 Environment: ${NODE_ENV}

📍 Endpoints disponíveis:
  GET  /health
  POST /auth/login
  POST /auth/register
  POST /auth/verify
  GET  /user/profile
  PUT  /user/password
  GET  /users (admin)
  GET  /dependents
  POST /dependents
  DELETE /dependents/:id
  GET  /appointments
  POST /appointments
  PUT  /appointments/:id/cancel
  POST /users (admin)
  `);
});

export default app;
