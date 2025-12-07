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