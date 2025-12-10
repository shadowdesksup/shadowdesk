import React from 'react';

// Tipos de solicitantes
export type TipoSolicitante = 'Docente' | 'Aluno' | 'Aluno - Educação Especial' | 'Aluno - Permanência' | 'Servidor' | 'Estagiário' | 'Visitante' | 'Faxineiro(a)' | 'Médico' | 'Secretário(a)' | 'Terceirizado' | 'Outro';

// Status do atendimento
export type StatusAtendimento = 'Pendente' | 'Atendido';

// Registro de atendimento informal
export interface RegistroAtendimento {
  id: string;
  numeroChamado: string; // ID visual amigável (ex: #12345)
  nomeSolicitante: string;
  tipoSolicitante: TipoSolicitante;
  local: string;
  descricaoRequisicao: string;
  dataHora: string; // ISO 8601 format
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