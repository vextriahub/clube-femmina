# 🏥 Clube Femmina - Benefício Popular

Plataforma SPA (Single Page Application) para gerenciar membros de clube de benefícios de saúde com carteirinha digital, agendamento de consultas e gestão de pagamentos.

## 📋 Estrutura do Projeto

```
Clube Femmina/
├── index.html           # HTML puro (estrutura da aplicação)
├── style.css            # Estilos centralizados
├── config.js            # Configuração e variáveis de ambiente
├── script.js            # Lógica da aplicação (1400+ linhas)
├── .env.example         # Template de variáveis de ambiente
├── vercel.json          # Configuração de deploy
├── SECURITY.md          # Guia de segurança
├── README.md            # Este arquivo
```

## 🎯 Funcionalidades

### Para Membros
- ✅ Autenticação segura
- ✅ Dashboard pessoal
- ✅ Carteirinha digital com QR code
- ✅ Agendamento de consultas
- ✅ Gerenciamento de dependentes
- ✅ Histórico de consultas
- ✅ Verificação de status de pagamento

### Para Administradores
- ✅ Gestão de sócios (CRUD)
- ✅ Agendamento administrativo
- ✅ Verificação de sócios
- ✅ Relatórios e analytics
- ✅ Gestão de cobranças
- ✅ Configurações do sistema

## 🚀 Como Começar

### Instalação

1. Clone/baixe o projeto
2. Instale dependências:
```bash
npm install
```

3. Configure variáveis de ambiente:
```bash
cp .env.example .env
# Edite .env com suas credenciais
```

4. Inicie o servidor local:
```bash
npm start
# Ou abra index.html no navegador
```

### Credenciais de Teste (Demo Mode)
```
👤 Usuário: demo.joao@femmina.com
   Senha:   demo123456

👨‍💼 Admin: demo.admin@femmina.com
   Senha:   demo123456
```

## 🛠 Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JS |
| **Backend** | Supabase (PostgreSQL) |
| **Autenticação** | Supabase Auth + JWT |
| **Pagamentos** | Asaas API |
| **QR Code** | qrcode@1.5.3 |
| **UI** | Font Awesome 6.4.0 |
| **Deploy** | Vercel |

## 📱 Features

### Responsividade
- Desktop, Tablet, Mobile
- Dark/Light mode
- Sidebar móvel

### Segurança
- Validação de entrada
- Error handling robusto
- Demo mode separado
- Configuração por ambiente

### Performance
- CSS otimizado
- JS modular
- Sem build tools (executa direto no browser)

## 🔄 Fluxo de Autenticação

```
Login → Validação → SessionStorage → Dashboard
   ↓
   └─→ Erro → Toast notification
```

## 📊 Estrutura de Dados

### Usuários (users)
```json
{
  "id": "uuid",
  "nome": "string",
  "email": "string",
  "cpf": "string",
  "telefone": "string",
  "numero_carteirinha": "string",
  "status_pagamento": "active|pending|inactive",
  "role": "member|admin"
}
```

### Agendamentos (appointments)
```json
{
  "id": "uuid",
  "usuario_id": "uuid",
  "paciente_nome": "string",
  "data_hora": "datetime",
  "tipo": "string",
  "status": "scheduled|completed|cancelled"
}
```

## 🔧 Configuração

### Variáveis de Ambiente
```bash
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=chave_anonima_aqui
ASAAS_API_KEY=chave_asaas_aqui
API_URL=http://localhost:3001
NODE_ENV=development|production
DEMO_ENABLED=true|false
```

### config.js
Centraliza toda a configuração do cliente:
- URL da API backend
- Dados de demo
- Feature flags

> O `SUPABASE_ANON_KEY` é usado apenas no backend. A autenticação do frontend é feita através da API Express.

## 📈 Desenvolvimento

### Adicionar Nova Feature
1. Criar função em `script.js`
2. Adicionar estilos em `style.css`
3. Adicionar HTML em `index.html`
4. Testar em dev mode

### Estrutura de Funções
```javascript
// Padrão usado
async function nomeDataAction(params) {
  try {
    // Validação
    if (!params) {
      showToast('Mensagem de erro', 'error');
      return;
    }
    
    // Lógica principal
    const result = await DB.operation(params);
    
    // Feedback
    showToast('Sucesso', 'success');
    return result;
  } catch (err) {
    console.error('Erro:', err);
    showToast('Erro na operação', 'error');
  }
}
```

## 🧪 Testing

### Testar Autenticação
1. Abra DevTools (F12)
2. Teste login com credenciais de demo
3. Verifique sessionStorage

### Testar API Backend
```javascript
// No console
await window.API.auth.verify().then(console.log);
await window.API.dependents.list().then(console.log);
```
## 📦 Deploy

### Vercel
```bash
vercel deploy
```

### Heroku
```bash
heroku create seu-app
git push heroku main
```

### Configuração Necessária
1. Variáveis de ambiente no painel
2. SSL/HTTPS automático
3. Build command: nenhum (SPA estática)
4. Public directory: `/`

## 🐛 Troubleshooting

### Login não funciona
- Verificar console (F12) para erros
- Verificar se Supabase está configurado
- Checar credenciais em .env

### Dados não aparecem
- Verificar conexão com Supabase
- Checar permissões de tabelas no Supabase
- Verificar CORS

### Estilo quebrado
- Hard refresh (Ctrl+Shift+R)
- Limpar cache do navegador
- Verificar style.css

## 📞 Suporte

- **Issues**: Documentar em SECURITY.md
- **Bugs**: Arquivo em console/logs
- **Perguntas**: Consultar documentação

## 📝 Changelog

### v4.0.0 - PREMIUM RESET
- ✅ CSS separado em style.css
- ✅ JS em script.js
- ✅ Config centralizado
- ✅ Error handling melhorado
- ✅ SECURITY.md adicionado

### v3.9.0
- Corrigido dark theme
- Melhorado layout responsive

## 📄 Licença

Clube Femmina - Todos os direitos reservados 2024

---

**Última atualização**: May 9, 2026
**Versão**: 4.0.0
**Status**: Em desenvolvimento
