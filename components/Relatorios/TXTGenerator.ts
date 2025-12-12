import { RegistroAtendimento } from '../../types';
import { formatarTelefone } from '../../utils/helpers';

export const generateTXTContent = (registros: RegistroAtendimento[]) => {
  const content = registros.map(r => {
    const date = new Date(r.dataHora);
    const diaSemana = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    const diaSemanaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
    const dataFormatada = `${diaSemanaCap}, ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    // Helper para formatar linha com TABs (Mapeamento Manual Solicitado)
    const formatLine = (label: string, value: string) => {
      const prefix = `- ${label}`;

      const tabMap: Record<string, number> = {
        'SOLICITANTE': 1,
        'VÍNCULO': 1,
        'EMAIL': 2,
        'CONTATO': 1,
        'LOCAL': 2,
        'STATUS': 2,
        'DATA': 2,
        'DESCRIÇÃO': 1
      };

      const tabsNeeded = tabMap[label] || 1;
      const tabs = '\t'.repeat(tabsNeeded);

      return `${prefix}${tabs}:   ${value}`;
    };

    const emailLine = r.email ? `${formatLine('EMAIL', r.email)}\n` : '';
    const contatoLine = r.telefone ? `${formatLine('CONTATO', formatarTelefone(r.telefone))}\n` : '';

    return `--------------------------------------------------------------------------------
${formatLine('SOLICITANTE', r.nomeSolicitante)}
${formatLine('VÍNCULO', r.tipoSolicitante)}
${emailLine}${contatoLine}${formatLine('LOCAL', r.local)}
${formatLine('STATUS', r.status)}
${formatLine('DATA', dataFormatada)}
${formatLine('DESCRIÇÃO', r.descricaoRequisicao)}
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
