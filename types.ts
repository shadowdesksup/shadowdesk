import React from 'react';

// Tipos de solicitantes
export type TipoSolicitante = 'Docente' | 'Aluno' | 'Aluno - Educação Especial' | 'Aluno - Permanência' | 'Servidor' | 'Estagiário' | 'Visitante' | 'Faxineiro(a)' | 'Médico' | 'Secretário(a)' | 'Terceirizado' | 'Outro';

// Status do atendimento
export type StatusAtendimento = 'Pendente' | 'Atendido' | 'Registrado';

// Registro de atendimento informal
export interface RegistroAtendimento {
  id: string;
  numeroChamado: string; // ID visual amigável (ex: #12345)
  nomeSolicitante: string;
  tipoSolicitante: TipoSolicitante;
  local: string;
  descricaoRequisicao: string;
  dataHora: string; // ISO 8601 format - Data de Criação do Card (Automático)
  dataAtendimento?: string; // ISO 8601 format - Data do Atendimento (Manual)
  status: StatusAtendimento;
  email?: string;
  telefone?: string; // Celular ou Ramal
  criadoPor: string; // username do técnico
  criadoEm: string; // timestamp de criação
  atualizadoEm?: string; // timestamp de última atualização
}

// Usuário do sistema
export interface Usuario {
  uid: string; // ID do Firebase Auth
  email: string;
  nomeCompleto: string;
  photoURL?: string;
  friendRequestsSent: string[]; // UIDs
  friendRequestsReceived: string[]; // UIDs
  friends: string[]; // UIDs
  username?: string; // Legacy support
  senha?: string; // Legacy support
}

export interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  fromEmail: string;
  toId: string;
  toEmail: string; // Facilita busca
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Friend {
  id: string; // UID
  email: string;
  name: string;
  photoURL?: string;
  addedAt: string;
}

// Item de navegação
export interface NavItem {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  path?: string;
}

// Filtros para relatórios
export interface FiltrosRelatorio {
  dataInicial?: string;
  dataFinal?: string;
  status?: StatusAtendimento | 'Todos';
  tipoSolicitante?: TipoSolicitante | 'Todos';
}

// Estatísticas do dashboard
export interface Estatisticas {
  total: number;
  pendentes: number;
  atendidos: number;
  hoje: {
    total: number;
    pendentes: number;
    atendidos: number;
  };
  semana: {
    total: number;
    pendentes: number;
    atendidos: number;
  };
  mes: {
    total: number;
    pendentes: number;
    atendidos: number;
  };
}

// Descrição de Equipamento (Laudo Técnico)
export interface DescricaoEquipamento {
  id: string;

  // Header info
  dataLaudo: string; // ISO 8601 format

  // Informações Técnicas
  equipamento: string;
  marca: string;
  modelo: string;
  patrimonio: string;
  ns: string; // Número de Série

  // Dados do Projeto
  temProjeto?: boolean;
  agencia?: 'CNPq' | 'Fapesp' | 'Outro';
  outraAgencia?: string;
  processo?: string;
  termo?: string;

  // Descrição da Avaliação Técnica Geral
  descricaoAvaliacao: string;

  // Avaliações detalhadas por componente (Lista Dinâmica)
  componentes: Array<{
    item: string;
    status: string; // "Boas condições", "Danificado", etc.
    observacao: string; // Detalhes extras
  }>;

  // Acessórios
  acessorios: Array<{
    item: string;
    status: string;
    observacao: string;
  }>;

  // Conclusão
  conclusao: string;

  // Imagens do Equipamento (base64)
  imagensEquipamento?: string[]; // Array de imagens em base64

  // Metadata
  criadoPor: string; // user ID
  criadoEm: string; // timestamp de criação
  atualizadoEm?: string; // timestamp de última atualização
}

// ==========================================
// SISTEMA DE LEMBRETES
// ==========================================

// Status do lembrete
export type StatusLembrete = 'pendente' | 'disparado' | 'expirado' | 'finalizado';

// Som de notificação
export type SomNotificacao = 'sino' | 'campainha' | 'alerta' | 'gentil' | 'urgente';

// Cores dos lembretes (Nova Paleta Pastel)
export type CorLembrete =
  | 'rose'       // Rosinha suave
  | 'blush'      // Pêssego rosado
  | 'peach'      // Pêssego
  | 'sand'       // Areia/Bege
  | 'mint'       // Menta suave
  | 'sage'       // Verde sálvia
  | 'sky'        // Azul céu
  | 'periwinkle' // Azul arroxeado
  | 'lavender'   // Lavanda
  | 'mist';      // Cinza neblina

// Lembrete
export interface Lembrete {
  id: string;
  titulo: string;
  descricao: string;
  dataHora: string; // ISO 8601 - quando deve disparar
  cor: CorLembrete;
  somNotificacao: SomNotificacao;
  status: StatusLembrete;
  criadoPor: string; // userId
  criadoPorNome?: string; // nome do criador
  compartilhadoCom?: string; // userId (se enviado para outro)
  compartilhadoComNome?: string; // nome do destinatário
  remetenteId?: string; // userId de quem enviou (se recebido)
  remetenteNome?: string;
  aceito?: boolean | null; // null = pendente, true = aceito, false = recusado
  criadoEm: string;
  atualizadoEm?: string;
  finalizadoEm?: string; // Data de conclusão
  telefone?: string; // WhatsApp de destino
  dataHoraEnvio?: any; // Timestamp Firestore (usado pelo Worker)
}

// Tipo de notificação geral do sistema
export type TipoNotificacao = 'lembrete_disparado' | 'lembrete_recebido' | 'lembrete_aceito' | 'lembrete_recusado' | 'solicitacao_amizade';

// Notificação
export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  lembreteId?: string;
  friendRequestId?: string;
  remetenteId?: string;
  remetenteNome?: string;
  lida: boolean;
  criadoEm: string;
  userId: string;
}