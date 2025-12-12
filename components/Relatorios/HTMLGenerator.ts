import { RegistroAtendimento } from '../../types';

export const generateHTMLContent = (registros: RegistroAtendimento[]) => {
  const header = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Relatório de Atendimentos - ShadowDesk</h2>
      <p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      <p><strong>Total de Registros:</strong> ${registros.length}</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
  `;

  const items = registros.map(r => `
    <div style="background-color: #f9f9f9; border-left: 5px solid ${r.status === 'Atendido' || r.status === 'Concluído' ? '#27ae60' : '#f39c12'}; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 5px 0; font-weight: bold; width: 120px;">SOLICITANTE:</td>
          <td style="padding: 5px 0;">${r.nomeSolicitante}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; font-weight: bold;">VÍNCULO:</td>
          <td style="padding: 5px 0;">${r.tipoSolicitante}</td>
        </tr>
        ${r.email ? `
        <tr>
          <td style="padding: 5px 0; font-weight: bold;">EMAIL:</td>
          <td style="padding: 5px 0;">${r.email}</td>
        </tr>` : ''}
        ${r.telefone ? `
        <tr>
          <td style="padding: 5px 0; font-weight: bold;">CONTATO:</td>
          <td style="padding: 5px 0;">${r.telefone}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 5px 0; font-weight: bold;">LOCAL:</td>
          <td style="padding: 5px 0;">${r.local}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; font-weight: bold;">STATUS:</td>
          <td style="padding: 5px 0;">
            <span style="background-color: ${r.status === 'Atendido' || r.status === 'Concluído' ? '#dcfce7' : '#fef9c3'}; color: ${r.status === 'Atendido' || r.status === 'Concluído' ? '#166534' : '#854d0e'}; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
              ${r.status}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 5px 0; font-weight: bold;">DATA:</td>
          <td style="padding: 5px 0;">${(() => {
      const date = new Date(r.dataHora);
      const diaSemana = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const diaSemanaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
      return `${diaSemanaCap}, ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    })()}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; font-weight: bold; vertical-align: top;">DESCRIÇÃO:</td>
          <td style="padding: 5px 0;">${r.descricaoRequisicao}</td>
        </tr>
      </table>
    </div>
  `).join('');

  const footer = `
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #7f8c8d; text-align: center;">Enviado automaticamente pelo sistema ShadowDesk.</p>
    </div>
  `;

  return header + items + footer;
};
