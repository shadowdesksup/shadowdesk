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
  username: string;
  nomeCompleto: string;
  senha: string; // Em produção seria hash
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

// Cores dos lembretes (post-it)
export type CorLembrete = 'amarelo' | 'rosa' | 'azul' | 'verde' | 'laranja' | 'roxo';

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
}

// Tipo de notificação geral do sistema
export type TipoNotificacao = 'lembrete_disparado' | 'lembrete_recebido' | 'lembrete_aceito' | 'lembrete_recusado';

// Notificação
export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  lembreteId?: string;
  remetenteId?: string;
  remetenteNome?: string;
  lida: boolean;
  criadoEm: string;
  userId: string;
}