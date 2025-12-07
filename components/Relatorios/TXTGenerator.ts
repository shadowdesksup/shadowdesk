import { RegistroAtendimento } from '../../types';

export const generateTXTContent = (registros: RegistroAtendimento[]) => {
  const content = registros.map(r => {
    return `--------------------------------------------------------------------------------
  DATA/HORA   :   ${new Date(r.dataHora).toLocaleString('pt-BR')}
  SOLICITANTE   :   ${r.nomeSolicitante}
  VÍNCULO   :   ${r.tipoSolicitante}
  LOCAL   :   ${r.local}
  STATUS   :   ${r.status}
  DESCRIÇÃO   :   ${r.descricaoRequisicao}
--------------------------------------------------------------------------------`;
  }).join('\n\n');

  const header = `RELATÓRIO DE ATENDIMENTOS - SHADOWDESK
GERADO EM: ${new Date().toLocaleString('pt-BR')}
TOTAL DE REGISTROS: ${registros.length}
\n`;

  return header + content;
};

export const exportToTXT = (registros: RegistroAtendimento[], filename: string) => {
  const finalContent = generateTXTContent(registros);

  // Create blob and download
  const blob = new Blob([finalContent], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
