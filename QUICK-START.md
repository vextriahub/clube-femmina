# 🚀 Quick Start - Clube Femmina v4.0+

Guia rápido para colocar a aplicação funcionando com o novo backend.

## ⚡ Instalação Rápida (5 minutos)

### 1️⃣ Backend Setup

```bash
# Instale as dependências Node.js
npm install

# Crie arquivo de configuração
cp .env.backend.example .env

# Configure as variáveis:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - JWT_SECRET (gere uma chave aleatória)

# Inicie o servidor
npm run dev
# Saída esperada: ✅ Servidor iniciado em http://localhost:3001
```

### 2️⃣ Banco de Dados Setup

```bash
# Acesse Supabase Dashboard → SQL Editor
# Cole e execute o conteúdo de: database-migration.sql

# Ou use o script (node 18+):
node setup-database.js --full
```

### 3️⃣ Frontend Configuration

```bash
# Edite config.js e adicione:
CONFIG.API_URL = 'http://localhost:3001'; // desenvolvimento
// ou 'https://sua-api.vercel.app'; // produção
```

### 4️⃣ Teste a Integração

Abra index.html no navegador:
```bash
# Abra em browser
# URL: file:///path/to/index.html
# Ou use live-server:
npx live-server
```

Login com credenciais de teste:
```
Email:  demo.joao@femmina.com
Senha:  demo123456
```

## 📁 Arquivos Criados na Fase 2

```
✅ server.js                    # Backend Express (325 linhas)
✅ package.json                 # Dependências Node
✅ api.js                       # Cliente HTTP no frontend (290 linhas)
✅ .env.backend.example         # Template backend
✅ database-migration.sql       # Migrações Supabase
✅ setup-database.js            # Script de setup
✅ BACKEND-INTEGRATION.md       # Guia detalhado
✅ QUICK-START.md               # Este arquivo
```

## 🔍 Verificação de Status

### Backend Online?
```bash
curl http://localhost:3001/health
# Retorna: {"status":"ok","environment":"development","supabase":"✅"}
```

### Token Válido?
```bash
# Faça login primeiro, obtenha o token
curl -X POST http://localhost:3001/auth/verify \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Banco de Dados OK?
```bash
# No Supabase Dashboard
# Verifique se as tabelas têm:
SELECT * FROM users LIMIT 1;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users';
```

## 🔄 Endpoints Disponíveis

| Método | Endpoint | Autenticado | Descrição |
|--------|----------|-------------|-----------|
| GET | `/health` | ❌ | Verifica se API está online |
| POST | `/auth/login` | ❌ | Login (email + senha) |
| POST | `/auth/register` | ❌ | Registra novo usuário |
| POST | `/auth/verify` | ✅ | Verifica token |
| GET | `/user/profile` | ✅ | Perfil do usuário |
| PUT | `/user/password` | ✅ | Altera senha |
| GET | `/users` | ✅ Admin | Lista todos usuários |

## ⚙️ Variáveis de Ambiente

### Frontend (.env)
```
SUPABASE_URL=https://...supabase.co
SUPABASE_ANON_KEY=...
API_URL=http://localhost:3001
NODE_ENV=development
DEMO_ENABLED=true
```

### Backend (.env)
```
SUPABASE_URL=https://...supabase.co
SUPABASE_ANON_KEY=...
JWT_SECRET=sua-chave-muito-segura-aqui
JWT_EXPIRES=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5000
```

## 🐛 Troubleshooting

### ❌ "Cannot find module 'express'"
```bash
npm install
```

### ❌ "SUPABASE_URL not configured"
Edite .env com suas credenciais Supabase

### ❌ "CORS error"
```javascript
// Certifique-se que FRONTEND_URL está em .env do backend
// Se local: FRONTEND_URL=http://localhost:5000
// Se remoto: FRONTEND_URL=https://seu-site.com
```

### ❌ "Login button doesn't work"
1. Verifique se backend está rodando: `npm run dev`
2. Abra DevTools (F12) e verifique console
3. Verifique se banco de dados tem usuários: `SELECT * FROM users;`

## 📚 Próximas Etapas

- [ ] Atualizar script.js para usar `API.auth.login()` em vez de autenticação local
- [ ] Implementar refresh tokens
- [ ] Configurar SSL/HTTPS
- [ ] Deploy em produção
- [ ] Integrar pagamentos Asaas
- [ ] Adicionar autenticação com 2FA

## 🔐 Segurança (Antes de Produção)

```bash
# 1. Defina DEMO_ENABLED=false em .env
DEMO_ENABLED=false

# 2. Defina NODE_ENV=production
NODE_ENV=production

# 3. Gere JWT_SECRET seguro (32+ caracteres aleatórios)
JWT_SECRET=$(openssl rand -hex 32)

# 4. Configure HTTPS obrigatório
# 5. Configure CORS corretamente
# 6. Faça backup do banco de dados
```

## 📞 Suporte

- Consulte [BACKEND-INTEGRATION.md](BACKEND-INTEGRATION.md) para detalhes
- Revise [SECURITY.md](SECURITY.md) para guia de segurança
- Veja [README.md](README.md) para documentação geral

---

**Versão**: 4.0.0  
**Status**: Backend pronto, Frontend em integração  
**Tempo de setup**: ~5 minutos (local), ~30 minutos (produção)
