import { RegistroAtendimento, Usuario } from '../types';

// Gerar ID único simples
export const gerarId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Formatar data para exibição
export const formatarData = (isoString: string): string => {
  const data = new Date(isoString);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Formatar hora para exibição
export const formatarHora = (isoString: string): string => {
  const data = new Date(isoString);
  return data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Formatar data e hora completa
export const formatarDataHora = (isoString: string): string => {
  return `${formatarData(isoString)} às ${formatarHora(isoString)}`;
};

// Obter data/hora atual no formato ISO
export const obterDataHoraAtual = (): string => {
  return new Date().toISOString();
};

// Converter data ISO para input datetime-local
export const isoParaDatetimeLocal = (isoString: string): string => {
  const data = new Date(isoString);
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const hora = String(data.getHours()).padStart(2, '0');
  const minuto = String(data.getMinutes()).padStart(2, '0');
  return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
};

// Converter datetime-local para ISO
export const datetimeLocalParaISO = (datetimeLocal: string): string => {
  return new Date(datetimeLocal).toISOString();
};

// Calcular tempo relativo (ex: "2h atrás", "1d atrás")
export const tempoRelativo = (isoString: string): string => {
  const agora = new Date();
  const data = new Date(isoString);
  const diffMs = agora.getTime() - data.getTime();
  const diffMinutos = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMs / 3600000);
  const diffDias = Math.floor(diffMs / 86400000);

  if (diffMinutos < 1) return 'Agora';
  if (diffMinutos < 60) return `${diffMinutos}min atrás`;
  if (diffHoras < 24) return `${diffHoras}h atrás`;
  if (diffDias < 7) return `${diffDias}d atrás`;
  if (diffDias < 30) return `${Math.floor(diffDias / 7)}sem atrás`;
  return formatarData(isoString);
};

// Verificar se data está dentro do período
export const estaEntreDatas = (data: string, inicio?: string, fim?: string): boolean => {
  const dataCheck = new Date(data);

  if (inicio) {
    const dataInicio = new Date(inicio);
    dataInicio.setHours(0, 0, 0, 0);
    if (dataCheck < dataInicio) return false;
  }

  if (fim) {
    const dataFim = new Date(fim);
    dataFim.setHours(23, 59, 59, 999);
    if (dataCheck > dataFim) return false;
  }

  return true;
};

// Verificar se data é hoje
export const eHoje = (isoString: string): boolean => {
  const hoje = new Date();
  const data = new Date(isoString);
  return (
    data.getDate() === hoje.getDate() &&
    data.getMonth() === hoje.getMonth() &&
    data.getFullYear() === hoje.getFullYear()
  );
};

// Verificar se data é desta semana
export const eDestaSemana = (isoString: string): boolean => {
  const hoje = new Date();
  const data = new Date(isoString);
  const primeiroDiaSemana = new Date(hoje);
  primeiroDiaSemana.setDate(hoje.getDate() - hoje.getDay());
  primeiroDiaSemana.setHours(0, 0, 0, 0);

  const ultimoDiaSemana = new Date(primeiroDiaSemana);
  ultimoDiaSemana.setDate(primeiroDiaSemana.getDate() + 6);
  ultimoDiaSemana.setHours(23, 59, 59, 999);

  return data >= primeiroDiaSemana && data <= ultimoDiaSemana;
};

// Verificar se data é deste mês
export const eDesteMes = (isoString: string): boolean => {
  const hoje = new Date();
  const data = new Date(isoString);
  return (
    data.getMonth() === hoje.getMonth() &&
    data.getFullYear() === hoje.getFullYear()
  );
};

// Validar campos obrigatórios do registro
export const validarRegistro = (registro: Partial<RegistroAtendimento>): string[] => {
  const erros: string[] = [];

  if (!registro.nomeSolicitante?.trim()) {
    erros.push('Nome do solicitante é obrigatório');
  }

  if (!registro.tipoSolicitante) {
    erros.push('Tipo de solicitante é obrigatório');
  }

  if (!registro.local?.trim()) {
    erros.push('Local é obrigatório');
  }

  if (!registro.descricaoRequisicao?.trim()) {
    erros.push('Descrição da requisição é obrigatória');
  }

  if (!registro.dataHora) {
    erros.push('Data e hora são obrigatórias');
  }

  return erros;
};

/**
 * Calcula o último dia útil do mês atual e quantos dias faltam até lá.
 * Considera apenas dias de semana (Seg-Sex) como úteis.
 */
export const obterDiasRestantesEncerramento = (): { diasRestantes: number; dataEncerramento: Date; progressoMes: number } => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  // Último dia do mês atual
  const ultimoDiaMes = new Date(ano, mes + 1, 0);

  // Encontrar o último dia útil (Segunda a Sexta)
  let dataEncerramento = new Date(ultimoDiaMes);
  while (dataEncerramento.getDay() === 0 || dataEncerramento.getDay() === 6) {
    dataEncerramento.setDate(dataEncerramento.getDate() - 1);
  }

  // Se hoje já passou do encerramento, retornar 0
  if (hoje > dataEncerramento) {
    return { diasRestantes: 0, dataEncerramento, progressoMes: 100 };
  }

  // Calcular dias corridos restantes (simples)
  const diffTime = Math.abs(dataEncerramento.getTime() - hoje.getTime());
  const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Calcular progresso do mês (apenas visual)
  const primeiroDiaMes = new Date(ano, mes, 1);
  const totalDiasMes = (dataEncerramento.getTime() - primeiroDiaMes.getTime());
  const diasPassados = (hoje.getTime() - primeiroDiaMes.getTime());
  const progressoMes = Math.min(100, Math.max(0, (diasPassados / totalDiasMes) * 100));

  return { diasRestantes, dataEncerramento, progressoMes };
};
