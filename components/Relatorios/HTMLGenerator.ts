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
          <td style="padding: 5px 0; font-weight: bold; width: 120px;">DATA/HORA:</td>
          <td style="padding: 5px 0;">${new Date(r.dataHora).toLocaleString('pt-BR')}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; font-weight: bold;">SOLICITANTE:</td>
          <td style="padding: 5px 0;">${r.nomeSolicitante}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; font-weight: bold;">VÍNCULO:</td>
          <td style="padding: 5px 0;">${r.tipoSolicitante}</td>
        </tr>
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
