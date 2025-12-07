# ShadowDesk 👻

Sistema de Registro de Atendimentos Informais para Suporte Técnico da UNESP

## 🎯 Sobre o Projeto

O **ShadowDesk** é um sistema web desenvolvido para registrar atendimentos técnicos informais realizados presencialmente ou por telefone, que posteriormente precisam ser formalizados no Service Desk.

### Problema que Resolve

Muitas vezes, técnicos de suporte atendem solicitações presenciais ou telefônicas e esquecem de registrá-las no sistema oficial. O ShadowDesk funciona como um "bloco de notas inteligente" para anotar esses atendimentos e depois gerar relatórios para formalização.

## ✨ Funcionalidades

✅ **Sistema de Login com Firebase** - Autenticação segura com email/senha  
✅ **Registro de Usuários** - Cada técnico pode criar sua própria conta  
✅ **Registro de Atendimentos** - Formulário completo com todos os dados necessários  
✅ **Dashboard** - Estatísticas e visão geral dos atendimentos  
✅ **Histórico** - Listagem completa de todos os registros  
✅ **Filtros e Busca** - Encontre registros rapidamente  
✅ **Sincronização em Nuvem** - Dados salvos no Firebase Firestore  
✅ **Multi-usuário** - Cada usuário vê apenas seus próprios registros  
🚧 **Relatórios em PDF** - Em desenvolvimento  

## 📋 Campos de Registro

- **Nome do Solicitante** - Nome completo da pessoa que solicitou
- **Tipo de Solicitante** - Docente, Aluno, Funcionário, Estagiário, Visitante ou Outro
- **Local/Setor** - Onde ocorreu o atendimento
- **Descrição da Requisição** - Detalhes do problema ou solicitação
- **Data e Hora** - Quando ocorreu (padrão: agora)
- **Status** - Pendente ou Atendido
- **Observações** - Informações adicionais (opcional)

---

## 🚀 Como Usar

### Pré-requisitos

- Node.js instalado (versão 18 ou superior)
- Conta Google (para Firebase)

### 1. Instalação

```bash
# Clone ou baixe este repositório
cd shadowdesk

# Instale as dependências
npm install
```

### 2. Configurar Firebase

#### Passo 1: Criar Projeto no Firebase

1. Acesse https://console.firebase.google.com
2. Clique em "Adicionar projeto"
3. Nome do projeto: `shadowdesk-unesp`
4. Desabilite Google Analytics (opcional)
5. Clique em "Criar projeto"

#### Passo 2: Ativar Authentication

1. No menu lateral, clique em **Authentication**
2. Clique em "Começar"
3. Ative o provedor **Email/senha**
4. Clique em "Salvar"

#### Passo 3: Ativar Firestore Database

1. No menu lateral, clique em **Firestore Database**
2. Clique em "Criar banco de dados"
3. Modo: **Produção**
4. Localização: `southamerica-east1` (São Paulo)
5. Clique em "Ativar"

#### Passo 4: Configurar Regras de Segurança

No Firestore, vá em **Regras** e cole:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem ler/escrever apenas seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Registros: usuário só vê os próprios
    match /registros/{registroId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && 
                               resource.data.userId == request.auth.uid;
    }
  }
}
```

Clique em "Publicar".

#### Passo 5: Obter Credenciais

1. Clique no ícone de **engrenagem** → **Configurações do projeto**
2. Role até "Seus apps"
3. Clique no ícone **Web** `</>`
4. Apelido do app: `ShadowDesk Web`
5. **NÃO** marque "Configurar Firebase Hosting"
6. Clique em "Registrar app"
7. **Copie as credenciais** que aparecem

#### Passo 6: Colar Credenciais no Projeto

Abra o arquivo `firebase/config.ts` e cole suas credenciais:

```typescript
const firebaseConfig = {
  apiKey: "AIza...",  // Cole aqui
  authDomain: "shadowdesk-unesp.firebaseapp.com",
  projectId: "shadowdesk-unesp",
  storageBucket: "shadowdesk-unesp.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 3. Executar

```bash
npm run dev
```

O sistema abrirá automaticamente no navegador em `http://localhost:3000`

### 4. Primeiro Acesso

1. Clique em "Criar conta"
2. Preencha: Email, Senha, Nome Completo
3. Faça login
4. Comece a registrar atendimentos!

---

## 📁 Estrutura do Projeto

```
shadowdesk/
├── components/          # Componentes React
│   ├── LoginPage.tsx   # Tela de login
│   ├── RegisterPage.tsx # Tela de registro (em desenvolvimento)
│   ├── Dashboard.tsx   # Dashboard com estatísticas
│   ├── FormularioRegistro.tsx  # Formulário de novo registro
│   ├── ListaRegistros.tsx      # Listagem de registros
│   ├── Header.tsx      # Cabeçalho com logout
│   └── Sidebar.tsx     # Menu lateral de navegação
├── firebase/           # Configuração Firebase
│   ├── config.ts       # Credenciais Firebase
│   ├── auth.ts         # Serviços de autenticação
│   └── firestore.ts    # Serviços Firestore
├── hooks/              # Hooks customizados
│   ├── useAuth.ts      # Gerenciamento de autenticação
│   └── useRegistros.ts # CRUD de registros
├── utils/              # Utilitários
│   ├── helpers.ts      # Funções auxiliares
│   └── initialData.ts  # Dados iniciais
├── types.ts            # Tipos TypeScript
└── App.tsx             # Componente principal
```

---

## 🔐 Segurança

- ✅ Senhas criptografadas pelo Firebase
- ✅ Autenticação segura com JWT
- ✅ Regras de segurança no Firestore
- ✅ Cada usuário vê apenas seus dados
- ✅ HTTPS automático no deploy

---

## 🌐 Deploy (Opcional)

### Opção 1: Firebase Hosting (Recomendado)

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar hosting
firebase init hosting

# Build de produção
npm run build

# Deploy
firebase deploy
```

Sua URL será: `https://shadowdesk-unesp.web.app`

### Opção 2: Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Opção 3: Netlify

1. Build: `npm run build`
2. Acesse https://app.netlify.com/drop
3. Arraste a pasta `dist/`

---

## 🛠️ Tecnologias Utilizadas

- **React 18** - Framework JavaScript
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Framer Motion** - Animações
- **Lucide React** - Ícones
- **Firebase** - Backend as a Service
  - Authentication - Login/registro
  - Firestore - Banco de dados
  - Hosting - Deploy (opcional)

---

## 📝 Próximas Funcionalidades

- [ ] Geração de relatórios em PDF
- [ ] Exportação para Excel
- [ ] Filtros avançados por período
- [ ] Anexar arquivos aos registros
- [ ] Notificações por email
- [ ] Integração com Service Desk

---

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique se o Firebase está configurado corretamente
2. Confira as regras de segurança do Firestore
3. Veja o console do navegador (F12) para erros

---

## 📄 Licença

Desenvolvido para uso interno da UNESP.

---

**ShadowDesk v1.0.0** - Sistema de Registro de Atendimentos Informais  
Desenvolvido com ❤️ para a equipe de Suporte Técnico da UNESP
