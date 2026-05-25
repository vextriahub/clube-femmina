#!/usr/bin/env node

/**
 * setup-database.js - Script de Setup do Banco de Dados
 * Executa migrações e popula dados iniciais
 * 
 * Uso:
 *   node setup-database.js --init       # Inicializa tabelas
 *   node setup-database.js --seed       # Popula dados de teste
 *   node setup-database.js --full       # Init + seed
 */

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Gera hash de senha
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verifica e cria tabelas necessárias
 */
async function initializeTables() {
  console.log('📋 Inicializando tabelas...');
  
  // Nota: Estas operações precisam ser feitas via Supabase Dashboard SQL Editor
  // por causa de permissões. Este script apenas documenta o que precisa ser feito.
  
  const sqlStatements = `
    -- Tabela de Usuários (crie se não existir)
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      nome VARCHAR(255) NOT NULL,
      cpf VARCHAR(20) UNIQUE NOT NULL,
      telefone VARCHAR(20),
      numero_carteirinha VARCHAR(20) UNIQUE,
      status_pagamento VARCHAR(50) DEFAULT 'pending',
      role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('member', 'admin')),
      asaas_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Tabela de Dependentes
    CREATE TABLE IF NOT EXISTS dependents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      nome VARCHAR(255) NOT NULL,
      cpf VARCHAR(20) UNIQUE,
      parentesco VARCHAR(50),
      data_nascimento DATE,
      numero_carteirinha VARCHAR(20) UNIQUE,
      status_pagamento VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Tabela de Agendamentos
    CREATE TABLE IF NOT EXISTS appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      paciente_nome VARCHAR(255) NOT NULL,
      data_hora TIMESTAMP NOT NULL,
      tipo VARCHAR(100),
      status VARCHAR(50) DEFAULT 'scheduled',
      observacoes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Índices para performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);
    CREATE INDEX IF NOT EXISTS idx_dependents_user_id ON dependents(user_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
  `;

  console.log('⚠️  Execute este SQL no Supabase Dashboard:');
  console.log(sqlStatements);
  console.log('\n✅ Tabelas inicializadas (manual)');
}

/**
 * Popula dados de teste
 */
async function seedTestData() {
  console.log('🌱 Populando dados de teste...');
  
  const testUsers = [
    {
      email: 'demo.joao@femmina.com',
      password: 'demo123456',
      nome: 'Demo - João Silva',
      cpf: '123.456.789-01',
      telefone: '(85) 99999-0001',
      numero_carteirinha: 'CF-000001',
      status_pagamento: 'active',
      role: 'member'
    },
    {
      email: 'demo.maria@femmina.com',
      password: 'demo123456',
      nome: 'Demo - Maria Oliveira',
      cpf: '234.567.890-12',
      telefone: '(85) 98888-0002',
      numero_carteirinha: 'CF-000002',
      status_pagamento: 'pending',
      role: 'member'
    },
    {
      email: 'demo.admin@femmina.com',
      password: 'admin123456',
      nome: 'Demo - Admin',
      cpf: '999.999.999-99',
      role: 'admin'
    }
  ];

  for (const user of testUsers) {
    try {
      // Verifica se já existe
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (existing) {
        console.log(`⏭️  Usuário ${user.email} já existe`);
        continue;
      }

      // Hash da senha
      const password_hash = await hashPassword(user.password);

      // Insere usuário
      const { error } = await supabase
        .from('users')
        .insert([{
          ...user,
          password_hash,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      console.log(`✅ Usuário criado: ${user.email}`);
    } catch (err) {
      console.error(`❌ Erro ao criar ${user.email}:`, err.message);
    }
  }

  console.log('✅ Dados de teste populados');
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--help';

  try {
    switch (command) {
      case '--init':
        await initializeTables();
        break;
      case '--seed':
        await seedTestData();
        break;
      case '--full':
        await initializeTables();
        await seedTestData();
        break;
      default:
        console.log(`
Uso: node setup-database.js [comando]

Comandos:
  --init      Executa migrações do banco de dados
  --seed      Popula dados de teste
  --full      Ambos (init + seed)
  --help      Exibe esta mensagem

Exemplo:
  node setup-database.js --full
        `);
    }
  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
}

main();
