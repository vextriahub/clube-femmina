# 🔗 Integração Backend - Clube Femmina API

Guia de integração do frontend com o novo backend Node.js/Express implementado.

## 📋 Checklist de Implementação

### Fase 1: Setup do Backend ✅
- [x] Criar server.js com Express
- [x] Implementar rotas de autenticação
- [x] Adicionar bcrypt para hash de senhas
- [x] Implementar JWT tokens
- [x] Criar configuração de rate limiting
- [x] Documentar variáveis de ambiente

### Fase 2: Setup do Banco de Dados
- [ ] Executar migração SQL no Supabase
- [ ] Adicionar coluna `password_hash` na tabela `users`
- [ ] Adicionar coluna `role` na tabela `users`
- [ ] Criar trigger para `updated_at`
- [ ] Fazer backup do banco de dados

### Fase 3: Integração Frontend
- [x] Atualizar script.js para usar API
- [x] Remover cliente Supabase do frontend
- [x] Implementar token storage
- [x] Adicionar refresh token logic
- [x] Testar fluxo completo
- [x] Mover `SUPABASE_ANON_KEY` para backend apenas

### Fase 4: Deploy
- [ ] Deploy backend (Vercel, Heroku, Railway)
- [ ] Configurar variáveis de ambiente
- [ ] Testar endpoints em produção
- [ ] Configurar HTTPS/SSL

## 🚀 Passos de Instalação

### 1. Backend Local (Desenvolvimento)

```bash
# Instale as dependências
npm install

# Crie o arquivo .env
cp .env.backend.example .env

# Configure as variáveis:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - JWT_SECRET (pode usar uma chave aleatória)

# Inicie o servidor
npm run dev
# Ou produção: npm start
```

### 2. Teste os Endpoints

```bash
# Verificar se API está online
curl http://localhost:3001/health

# Registrar novo usuário
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@femmina.com",
    "password": "senha123456",
    "nome": "Teste User",
    "cpf": "123.456.789-00"
  }'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@femmina.com",
    "password": "senha123456"
  }'

# Verificar token (use o token retornado)
curl -X POST http://localhost:3001/auth/verify \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Obter perfil
curl -X GET http://localhost:3001/user/profile \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 🔄 Integração Frontend - Exemplo

### Antes (Cliente)
```javascript
// ❌ INSEGURO - Validação no cliente
async function doLogin(email, password) {
  const users = await DB.getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  // ... lógica
}
```

### Depois (API Backend)
```javascript
// ✅ SEGURO - Validação no servidor
async function doLogin(email, password) {
  try {
    const response = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Login falhou');
    }

    const data = await response.json();
    
    // Armazena token no sessionStorage
    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } catch (err) {
    console.error('❌ Erro de login:', err);
    showToast('Email ou senha incorretos', 'error');
  }
}
```

## 📡 Headers de Autenticação

Todas as requisições autenticadas devem incluir:

```
Authorization: Bearer SEU_TOKEN_JWT_AQUI
```

Exemplo com fetch:
```javascript
const response = await fetch('http://localhost:3001/user/profile', {
  headers: {
    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
  }
});
```

## 🔒 Segurança

### Implementado
✅ Bcrypt (10 rounds) para hash de senhas  
✅ JWT com expiração (7 dias por padrão)  
✅ Rate limiting (5 tentativas de login/15min)  
✅ Helmet para headers de segurança  
✅ CORS configurado  
✅ Limites de payload (10KB)  

### Próximas Etapas
🔲 Refresh tokens  
🔲 Two-factor authentication  
🔲 Audit logging  
🔲 LGPD compliance  

## 🚀 Deploy

### Vercel (Recomendado)
```bash
# Instale Vercel CLI
npm i -g vercel

# Faça login
vercel login

# Deploy
vercel --prod

# Configure variáveis de ambiente no painel Vercel
```

### Heroku
```bash
# Instale Heroku CLI
# Configure git remote
heroku create seu-app
heroku config:set JWT_SECRET=sua_chave_aqui
git push heroku main
```

### Railway
```bash
# Via railway.app
# Conecte seu repo GitHub
# Configure variáveis de ambiente
# Deploy automático
```

## 🐛 Troubleshooting

### "SUPABASE_URL não configurada"
```bash
# Certifique-se que .env tem:
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_aqui
```

### "Token inválido"
```javascript
// Token pode estar expirado, refaça login
sessionStorage.removeItem('token');
sessionStorage.removeItem('user');
// Redirecione para login
```

### "CORS error"
```javascript
// Certifique-se que FRONTEND_URL está correto em .env
// Se local: FRONTEND_URL=http://localhost:5000
```

### "Senha não funciona"
```bash
# Certifique-se que executou a migração SQL
# password_hash deve estar na tabela users
# Verifique: SELECT * FROM users LIMIT 1;
```

## 📊 Monitoramento

### Logs
```bash
# Desenvolvimento
npm run dev
# Mostra logs com emojis

# Produção
npm start
# Revise logs em ./logs ou painel de host
```

### Health Check
```bash
# Verifique se API está online
curl https://seu-api.com/health
```

## 📚 Referências

- [Express Docs](https://expressjs.com)
- [JWT.io](https://jwt.io)
- [Bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- [Supabase Docs](https://supabase.com/docs)

## ⚠️ Importante

1. **Nunca commite .env** - Use .env.example como template
2. **JWT_SECRET deve ser complexo** - Use chave aleatória em produção
3. **Sempre use HTTPS** - Em produção, configure SSL
4. **Backup do banco** - Antes de executar migrações
5. **Rate limiting** - Protege contra brute force

---

**Status**: Backend implementado e pronto para integração  
**Próximo passo**: Atualizar frontend script.js  
**Tempo estimado**: 4-6 horas
