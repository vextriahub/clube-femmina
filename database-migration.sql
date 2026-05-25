-- ==========================================
-- Clube Femmina - Migração do Banco de Dados
-- Para: Adição de Hash de Senha e JWT
-- ==========================================

-- Adiciona coluna password_hash à tabela users (se não existir)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Adiciona coluna role à tabela users (se não existir)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('member', 'admin'));

-- Atualiza usuários de teste com senhas hashadas (opcional - para teste)
-- Estas são as senhas: demo123456 e admin123456 hashadas com bcrypt
-- Hash de 'demo123456': $2a$10$YOu... (exemplo - gerar com bcrypt.hash())
-- Hash de 'admin123456': $2a$10$XYZ... (exemplo - gerar com bcrypt.hash())

-- Cria função para atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adiciona trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- IMPORTANTE: Manual Actions Required
-- ==========================================
-- 1. Acesse o Supabase Dashboard
-- 2. Vá para SQL Editor
-- 3. Cole este script e execute
-- 4. Certifique-se que a tabela 'users' existe com as colunas:
--    - id (uuid, pk)
--    - email (varchar, unique)
--    - nome (varchar)
--    - cpf (varchar)
--    - password_hash (varchar, adicionado por este script)
--    - role (varchar, adicionado por este script)
--    - status_pagamento (varchar)
--    - created_at (timestamp)
--    - updated_at (timestamp)
