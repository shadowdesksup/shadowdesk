import { EquipamentoEstoque } from '../../types';

export const imprimirFichaManutencao = (item: EquipamentoEstoque) => {
  const m = item.manutencaoAtual;
  if (!m) return;

  const html = `
    <html>
      <head>
        <title>Ficha de Manutenção - ${item.patrimonio || 'S/N'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { font-family: 'Inter', Arial, sans-serif; color: #333; margin: 40px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .header img { max-height: 55px; }
          .title { text-align: right; }
          h1 { margin: 0; font-size: 22px; color: #000; letter-spacing: -0.5px; }
          .subtitle { margin: 5px 0 0; font-size: 13px; color: #555; text-transform: uppercase; font-weight: 600; }
          
          .section { margin-bottom: 30px; border: 1px solid #ccc; padding: 15px; border-radius: 4px; }
          .section-title { font-weight: bold; font-size: 12px; background: #f4f4f4; padding: 5px 10px; margin: -15px -15px 15px -15px; border-bottom: 1px solid #ccc; text-transform: uppercase; letter-spacing: 1px; color: #333; }
          
          table { border-collapse: collapse; width: 100%; }
          td { padding: 8px 5px; vertical-align: top; border-bottom: 1px dotted #eaeaea; }
          .label { font-weight: 700; width: 150px; font-size: 10px; color: #666; }
          .value { font-size: 13px; color: #000; font-weight: 600; }
          
          .termo { margin-top: 50px; font-size: 11px; line-height: 1.6; text-align: justify; color: #444; border: 1px solid #ddd; padding: 15px; background: #fafafa; border-radius: 4px; }
          .assinaturas { margin-top: 80px; display: flex; justify-content: space-around; text-align: center; }
          .assinatura-box { width: 40%; border-top: 1px solid #000; padding-top: 10px; font-size: 12px; }
          .print-btn { text-align: center; margin: 30px 0; }
          @media print { .print-btn { display: none; } body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="print-btn">
          <button onclick="window.print()" style="padding: 10px 20px; cursor: pointer; background: #003366; color: white; border: none; border-radius: 4px; font-weight: bold; font-size: 14px;">IMPRIMIR FICHA DE MANUTENÇÃO</button>
        </div>
        
        <div class="header">
          <img src="/header_unesp_new.png" alt="UNESP" />
          <div class="title">
            <h1>FICHA DE ATENDIMENTO</h1>
            <p class="subtitle">Controle de Ativos - DTI</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">1. Dados do Solicitante</div>
          <table>
            <tr>
              <td class="label">NOME / SETOR:</td><td class="value" colspan="3">${m.solicitante}</td>
            </tr>
            <tr>
              <td class="label">VÍNCULO:</td><td class="value">${m.vinculo || 'Não informado'}</td>
              <td class="label">CELULAR / RAMAL:</td><td class="value">${m.celular || '-'}</td>
            </tr>
            <tr>
              <td class="label">E-MAIL:</td><td class="value" colspan="3">${m.email || '-'}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">2. Identificação do Equipamento</div>
          <table>
            <tr>
              <td class="label">EQUIPAMENTO:</td><td class="value">${item.tipo}</td>
              <td class="label">MARCA / MODELO:</td><td class="value">${item.marca} - ${item.modelo}</td>
            </tr>
            <tr>
              <td class="label">Nº PATRIMÔNIO:</td><td class="value">${item.patrimonio || 'S/N'}</td>
              <td class="label">Nº DE SÉRIE:</td><td class="value">${item.numeroSerie || 'S/N'}</td>
            </tr>
            <tr>
              <td class="label">CONDIÇÃO RECEBIDA:</td><td class="value">${m.condicaoBem || 'Não informada'}</td>
              <td class="label">DATA DE ENTRADA:</td><td class="value">${new Date(m.dataInicio).toLocaleDateString('pt-BR')}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">3. Defeito / Ocorrência Relatada</div>
          <div style="padding: 10px; background: #fcfcfc; border: 1px solid #eee; min-height: 80px; font-size: 13px; line-height: 1.5; color: #222;">
            ${m.problema.replace(/\n/g, '<br />') || 'Sem descrição.'}
          </div>
        </div>

        <div class="termo">
          <strong style="font-size: 12px; color: #000; text-transform: uppercase;">Termo de Recebimento para Avaliação e Manutenção Técnica</strong><br/><br/>
          Declaramos o recebimento do equipamento listado acima para fins de avaliação técnica e manutenção pela Diretoria Técnica de Informática (DTI) - UNESP Câmpus de Marília. O diagnóstico preliminar e a conclusão do serviço possuem prazos variáveis de acordo com a disponibilidade de componentes e fila de atendimento.<br/><br/>
          O equipamento aqui depositado que permanecer além de <strong>90 (noventa) dias</strong> a partir da notificação de conclusão (seja por conserto, orçamento ou devolução no seu estado original) sem sua devida retirada por parte do solicitante caracterizará estado de <strong>abandono</strong>. A Instituição exime-se de qualquer responsabilidade patrimonial podendo efetuar o descarte eletrônico ou destinação secundária sem aviso prévio. A retirada do bem somente se dará mediante apresentação de documento ou solicitação via ramal/setor registrado do solicitante.
        </div>

        <div class="assinaturas">
          <div class="assinatura-box">
            <strong>${m.solicitante}</strong><br/>
            Ciente / Solicitante
          </div>
          <div class="assinatura-box">
             <strong>${m.tecnicoResponsavelNome}</strong><br/>
             Técnico DTI Responsável (Recebimento)
          </div>
        </div>
      </body>
    </html>
  `;
  
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
};
