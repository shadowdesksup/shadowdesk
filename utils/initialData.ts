import { RegistroAtendimento, Usuario } from '../types';
import {
  salvarUsuarios,
  carregarUsuarios,
  salvarRegistros,
  carregarRegistros,
} from '../utils/storage';
import { gerarId } from '../utils/helpers';

// Dados iniciais do sistema

const USUARIO_PADRAO: Usuario = {
  username: 'admin',
  nomeCompleto: 'Administrador',
  senha: 'admin123', // Em produção seria hash
};

const REGISTROS_EXEMPLO: Omit<RegistroAtendimento, 'id' | 'criadoPor' | 'criadoEm'>[] = [
  {
    numeroChamado: '45821',
    nomeSolicitante: 'Prof. João Silva',
    tipoSolicitante: 'Docente',
    local: 'Sala 205 - Bloco A',
    descricaoRequisicao: 'Instalação do Office 365 e configuração de email institucional',
    dataHora: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h atrás
    status: 'Atendido',
    email: 'joao.silva@unesp.br',
    telefone: 'Ramal 4567',
    atualizadoEm: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    numeroChamado: '98234',
    nomeSolicitante: 'Maria Oliveira',
    tipoSolicitante: 'Aluno',
    local: 'Laboratório de Informática 3',
    descricaoRequisicao: 'Computador não está ligando, possível problema na fonte',
    dataHora: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4h atrás
    status: 'Pendente',
  },
  {
    numeroChamado: '12745',
    nomeSolicitante: 'Carlos Santos',
    tipoSolicitante: 'Funcionário',
    local: 'Secretaria Acadêmica',
    descricaoRequisicao: 'Impressora travando papel constantemente',
    dataHora: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
    status: 'Atendido',
    email: 'carlos.santos@unesp.br',
    telefone: '(11) 99999-8888',
    atualizadoEm: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  },
  {
    numeroChamado: '33456',
    nomeSolicitante: 'Ana Pereira',
    tipoSolicitante: 'Estagiário',
    local: 'Biblioteca',
    descricaoRequisicao: 'Sem acesso à rede Wi-Fi Eduroam',
    dataHora: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // 1 dia e 2h atrás
    status: 'Pendente',
    email: 'ana.pereira@unesp.br',
    telefone: 'Ramal 2233',
  },
  {
    numeroChamado: '77890',
    nomeSolicitante: 'Dr. Roberto Costa',
    tipoSolicitante: 'Docente',
    local: 'Departamento de Física',
    descricaoRequisicao: 'Solicitação de software específico para análise de dados (Matlab)',
    dataHora: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
    status: 'Atendido',
    email: 'roberto.costa@unesp.br',
    atualizadoEm: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
  },
  {
    numeroChamado: '55612',
    nomeSolicitante: 'Visitante Externo',
    tipoSolicitante: 'Visitante',
    local: 'Auditório Principal',
    descricaoRequisicao: 'Auxílio com conexão do projetor para palestra',
    dataHora: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias atrás
    status: 'Atendido',
    email: 'palestrante@email.com',
    atualizadoEm: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
  },
  {
    numeroChamado: '22334',
    nomeSolicitante: 'Lucas Mendes',
    tipoSolicitante: 'Aluno',
    local: 'Cantina',
    descricaoRequisicao: 'Esqueci minha senha do portal do aluno',
    dataHora: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dias atrás
    status: 'Atendido',
    email: 'lucas.mendes@unesp.br',
    telefone: '(11) 97777-6666',
    atualizadoEm: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
  },
];

export const inicializarDadosPadroes = (): void => {
  // Verificar se já existem usuários
  const usuarios = carregarUsuarios();
  if (usuarios.length === 0) {
    console.log('Criando usuário padrão...');
    salvarUsuarios([USUARIO_PADRAO]);
  }

  // Verificar se já existem registros
  const registros = carregarRegistros();
  if (registros.length === 0) {
    console.log('Criando registros de exemplo...');
    const registrosComId = REGISTROS_EXEMPLO.map(reg => ({
      ...reg,
      id: gerarId(),
      criadoPor: 'admin',
      criadoEm: reg.dataHora,
    }));
    salvarRegistros(registrosComId);
  }
};

// Verificar se é primeira execução
export const ePrimeiraExecucao = (): boolean => {
  const usuarios = carregarUsuarios();
  const registros = carregarRegistros();
  return usuarios.length === 0 && registros.length === 0;
};
