import React, { useState, useRef, useEffect } from 'react';
import { X, Printer, FileText, ClipboardCheck, CheckSquare, Square, Loader2 } from 'lucide-react';
import { EquipamentoEstoque, RegistroManutencao } from '../types';

interface ManutencaoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmar: () => Promise<void>;
  dadosEquipamento: Partial<EquipamentoEstoque>;
  dadosManutencao: RegistroManutencao;
  theme?: 'dark' | 'light';
}

export const formatarTelefone = (tel: string | undefined) => {
  if (!tel) return '-';
  const clean = tel.replace(/\D/g, '');
  if (clean.length === 11) return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  if (clean.length === 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  return tel;
};

// Gera o HTML da Ficha de Manutenção (dados técnicos + equipamento)
export const gerarHtmlFichaManutencao = (equip: Partial<EquipamentoEstoque>, m: RegistroManutencao): string => {
  return `
    <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', Arial, sans-serif; color: #333; padding: 30px; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .header img { max-height: 55px; }
          .title { text-align: right; }
          h1 { margin: 0; font-size: 20px; color: #000; letter-spacing: -0.5px; }
          .subtitle { margin: 5px 0 0; font-size: 12px; color: #555; text-transform: uppercase; font-weight: 600; }
          .ticket-id { font-size: 14px; font-weight: 700; color: #003366; margin-top: 4px; font-family: monospace; }
          .section { margin-bottom: 24px; border: 1px solid #999; padding: 15px; border-radius: 4px; }
          .section-title { font-weight: bold; font-size: 11px; background: #f4f4f4; padding: 5px 10px; margin: -15px -15px 15px -15px; border-bottom: 1px solid #999; text-transform: uppercase; letter-spacing: 1px; color: #333; }
          table { border-collapse: collapse; width: 100%; }
          td { padding: 7px 5px; vertical-align: top; border-bottom: 1px solid #bbb; }
          .label { font-weight: 700; width: 140px; font-size: 10px; color: #666; }
          .value { font-size: 12px; color: #000; font-weight: 600; }
          .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
          .badge-temp { background: #fff3cd; color: #856404; border: 1px solid #ffc107; }
          .badge-estoque { background: #d1ecf1; color: #0c5460; border: 1px solid #17a2b8; }
          .footer { margin-top: auto; border-top: 1px solid #ccc; padding-top: 10px; text-align: center; font-family: 'Arial', sans-serif; margin-bottom: 20px; }
          .cut-line { width: 100%; border-bottom: 1px dashed #666; position: absolute; bottom: 0; left: 0; }
          .cut-line::after { content: "✂--------------------------------------------------------------------------------------------------------------------------------------"; position: absolute; bottom: -8px; left: 0; font-size: 14px; color: #666; letter-spacing: 2px; overflow: hidden; white-space: nowrap; width: 100%; }
          @media print {
            @page { size: A4 portrait; margin: 0; }
            body { padding: 10mm !important; }
            .ficha-container { min-height: 135mm; } 
          }
          .ficha-container { display: flex; flex-direction: column; position: relative; max-width: 210mm; min-height: 135mm; margin: 0 auto; box-sizing: border-box; padding-bottom: 30px; }
          .etiqueta-box { border: 2px solid #000; padding: 25px; flex-grow: 1; display: flex; flex-direction: column; background: #fff; }
        </style>
      </head>
      <body>
        <div class="ficha-container">
          <div class="etiqueta-box">
          <div class="header">
            <img src="/header_unesp_new.png" alt="UNESP" />
          <div class="title">
            <h1>FICHA DE MANUTENÇÃO</h1>
            <p class="subtitle">Controle de Ativos</p>
            <p class="ticket-id">${m.ticketId}</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Identificação do Equipamento</div>
          <table>
            <tr>
              <td class="label">EQUIPAMENTO:</td><td class="value">${equip.tipo || '-'}</td>
              <td class="label">MARCA / MODELO:</td><td class="value">${equip.marca || '-'} - ${equip.modelo || '-'}</td>
            </tr>
            <tr>
              <td class="label">Nº PATRIMÔNIO:</td><td class="value">${equip.patrimonio || 'S/N'}</td>
              <td class="label">Nº DE SÉRIE:</td><td class="value">${equip.numeroSerie || 'S/N'}</td>
            </tr>
            <tr>
              <td class="label">CONDIÇÃO RECEBIDA:</td><td class="value">${m.condicaoBem || 'Não informada'}</td>
              <td class="label">DATA DE ENTRADA:</td><td class="value">${new Date(m.dataInicio).toLocaleDateString('pt-BR')}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Dados do Proprietário</div>
          <table>
            <tr>
              <td class="label">NOME:</td><td class="value">${m.solicitante}</td>
              <td class="label">VÍNCULO:</td><td class="value">${m.vinculo || 'Não informado'}</td>
            </tr>
            <tr>
              <td class="label">CELULAR / RAMAL:</td><td class="value">${formatarTelefone(m.celular)}</td>
              <td class="label">E-MAIL:</td><td class="value">${m.email || '-'}</td>
            </tr>
            <tr>
              <td class="label">LOCAL:</td><td class="value" colspan="3">${m.origem || '-'}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Defeito / Ocorrência Relatada</div>
          <div style="padding: 10px; background: #fcfcfc; border: 1px solid #ccc; min-height: 60px; font-size: 12px; line-height: 1.5; color: #222;">
            ${(m.problema || 'Sem descrição.').replace(/\n/g, '<br />')}
          </div>
        </div>
        </div> <!-- FECHA ETIQUETA BOX -->
        <div class="cut-line"></div>
      </div>
      </body>
    </html>
  `;
};

// Gera o HTML do Termo de Recebimento (ficha que o solicitante assina)
export const gerarHtmlTermo = (equip: Partial<EquipamentoEstoque>, m: RegistroManutencao): string => {
  return `
    <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', Arial, sans-serif; color: #333; padding: 30px; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .header img { max-height: 55px; }
          .title { text-align: right; }
          h1 { margin: 0; font-size: 20px; color: #000; letter-spacing: -0.5px; }
          .subtitle { margin: 5px 0 0; font-size: 12px; color: #555; text-transform: uppercase; font-weight: 600; }
          .ticket-id { font-size: 14px; font-weight: 700; color: #003366; margin-top: 4px; font-family: monospace; }
          .section { margin-bottom: 24px; border: 1px solid #999; padding: 15px; border-radius: 4px; }
          .section-title { font-weight: bold; font-size: 11px; background: #f4f4f4; padding: 5px 10px; margin: -15px -15px 15px -15px; border-bottom: 1px solid #999; text-transform: uppercase; letter-spacing: 1px; color: #333; }
          table { border-collapse: collapse; width: 100%; }
          td { padding: 7px 5px; vertical-align: top; border-bottom: 1px solid #bbb; }
          .label { font-weight: 700; width: 140px; font-size: 10px; color: #666; }
          .value { font-size: 12px; color: #000; font-weight: 600; }
          .termo { margin-top: 30px; font-size: 11px; line-height: 1.6; text-align: justify; color: #444; border: 1px solid #999; padding: 15px; background: #fafafa; border-radius: 4px; }
          .assinaturas { margin-top: 60px; display: flex; justify-content: space-around; text-align: center; }
          .assinatura-box { width: 40%; border-top: 1px solid #000; padding-top: 10px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/header_unesp_new.png" alt="UNESP" />
          <div class="title">
            <h1>ORDEM DE SERVIÇO</h1>
            <p class="subtitle">Avaliação e Manutenção Técnica</p>
            <p class="ticket-id">${m.ticketId}</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Identificação</div>
          <table>
            <tr>
              <td class="label">SOLICITANTE:</td><td class="value">${m.solicitante}</td>
              <td class="label">VÍNCULO:</td><td class="value">${m.vinculo || '-'}</td>
            </tr>
            <tr>
              <td class="label">E-MAIL:</td><td class="value">${m.email || '-'}</td>
              <td class="label">CEL/RAMAL:</td><td class="value">${formatarTelefone(m.celular)}</td>
            </tr>
            <tr>
              <td class="label">LOCAL:</td><td class="value">${m.origem || '-'}</td>
              <td class="label">DATA ENTRADA:</td><td class="value">${new Date(m.dataInicio).toLocaleDateString('pt-BR')}</td>
            </tr>
            <tr>
              <td class="label">EQUIPAMENTO:</td><td class="value">${equip.tipo || '-'} — ${equip.marca || ''} ${equip.modelo || ''}</td>
              <td class="label">${equip.patrimonio ? 'PATRIMÔNIO:' : 'Nº DE SÉRIE:'}</td><td class="value">${equip.patrimonio || equip.numeroSerie || 'S/N'}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Motivo da Ocorrência</div>
          <div style="padding: 10px; background: #fcfcfc; border: 1px solid #ccc; min-height: 60px; font-size: 12px; line-height: 1.5; color: #222;">
            ${(m.problema || 'Sem descrição.').replace(/\\n/g, '<br />')}
          </div>
        </div>

        <div class="termo">
          <strong style="font-size: 12px; color: #000; text-transform: uppercase;">Serviço de Avaliação e Manutenção Técnica</strong><br/><br/>
          Declaramos o recebimento do equipamento listado acima para fins de avaliação técnica e manutenção pela Diretoria Técnica de Informática (DTI) - UNESP Câmpus de Marília. O diagnóstico preliminar e a conclusão do serviço possuem prazos variáveis de acordo com a disponibilidade de componentes e fila de atendimento.<br/><br/>
          Considerando a baixa capacidade para armazenamento de equipamentos de informática na área do suporte. Todo equipamento aqui depositado que permanecer além de <strong>30 (trinta) dias</strong> a partir da notificação de conclusão do serviço sem sua devida retirada por parte do solicitante caracterizará estado de <strong>abandono</strong> e poderá ser devolvido de forma iminente à unidade de lotação do responsável. A retirada do bem por terceiros, somente se dará mediante apresentação de documento ou aprovação via registro formal (envio de email) do solicitante.<br/><br/>
          <div style="display: flex; gap: 0; font-size: 11px; color: #333; margin-top: 8px; border-top: 1px solid #ccc; padding-top: 10px;">
            <div style="flex: 1; padding-right: 15px; border-right: 1px solid #ddd;">
              <div style="font-weight: 700; font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 4px;">✉ E-mail</div>
              <div>suporte.marilia@unesp.br</div>
              <div style="margin-top: 2px;">dti.marilia@unesp.br</div>
            </div>
            <div style="flex: 1; padding: 0 15px; border-right: 1px solid #ddd;">
              <div style="font-weight: 700; font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 4px;">☎ Ramais</div>
              <div>Suporte I — (14) 3402-1349</div>
              <div style="margin-top: 2px;">Suporte II — (14) 3402-1399</div>
            </div>
            <div style="flex: 1; padding-left: 15px;">
              <div style="font-weight: 700; font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 4px;">◷ Horário</div>
              <div>Segunda a Sexta-feira</div>
              <div style="margin-top: 2px;">08:00–12:00 e 14:00–18:00</div>
            </div>
          </div>
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

        <div style="position: fixed; bottom: 0; left: 0; right: 0; border-top: 1px solid #ccc; padding: 10px 30px 8px; background: #fff; text-align: center; font-family: 'Arial', sans-serif;">
          <div style="font-size: 14px; font-weight: 600; color: #000;">Diretoria Técnica de Informática</div>
          <div style="font-size: 11px; color: #333; margin-top: 2px;">UNESP – Campus de Marília Faculdade de Filosofia e Ciências</div>
          <div style="margin-top: 4px; font-size: 9px; color: #999;">Gerado por ShadowDesk • ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </body>
    </html>
  `;
};

// Imprime um HTML na mesma janela usando um iframe oculto
export const imprimirHtml = (html: string) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      
      // Limpeza do iframe após a impressão
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 500);
  }
};

const ManutencaoPreviewModal: React.FC<ManutencaoPreviewModalProps> = ({
  isOpen, onClose, onConfirmar, dadosEquipamento, dadosManutencao, theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [abaAtiva, setAbaAtiva] = useState<'ficha' | 'termo'>('ficha');
  const [salvando, setSalvando] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const htmlFicha = gerarHtmlFichaManutencao(dadosEquipamento, dadosManutencao);
  const htmlTermo = gerarHtmlTermo(dadosEquipamento, dadosManutencao);

  // Atualiza o iframe quando muda a aba
  useEffect(() => {
    if (iframeRef.current && isOpen) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(abaAtiva === 'ficha' ? htmlFicha : htmlTermo);
        doc.close();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abaAtiva, isOpen]);

  const handleConfirmar = async () => {
    setSalvando(true);
    try {
      await onConfirmar();
    } catch (err) {
      console.error('Erro ao confirmar manutenção:', err);
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-5xl h-[95vh] rounded-3xl overflow-hidden shadow-2xl border flex flex-col ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>

        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <h3 className={`text-xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              <FileText className="text-amber-500" size={24} />
              Revisão e Impressão — {dadosManutencao.ticketId}
            </h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Revise as fichas antes de confirmar o registro da manutenção.
            </p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X size={22} />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={() => setAbaAtiva('ficha')}
            className={`flex-1 py-3 px-4 text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              abaAtiva === 'ficha'
                ? (isDark ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5' : 'text-amber-600 border-b-2 border-amber-500 bg-amber-50')
                : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')
            }`}
          >
            <FileText size={16} /> Ficha de Manutenção
          </button>
          <button
            onClick={() => setAbaAtiva('termo')}
            className={`flex-1 py-3 px-4 text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              abaAtiva === 'termo'
                ? (isDark ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5' : 'text-cyan-600 border-b-2 border-cyan-500 bg-cyan-50')
                : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')
            }`}
          >
            <ClipboardCheck size={16} /> Ordem de Serviço
          </button>
        </div>

        {/* Preview iframe */}
        <div className="flex-1 overflow-hidden bg-white min-h-[350px]">
          <iframe
            ref={iframeRef}
            title="Preview da Ficha"
            className="w-full h-full min-h-[350px] border-none"
            sandbox="allow-same-origin"
          />
        </div>

        {/* Footer com Checkboxes e Botões */}
        <div className={`p-5 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50'}`}>
          {/* Links de impressão diretos */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Printer className={isDark ? 'text-amber-500' : 'text-amber-600'} size={18} />
              <button
                onClick={() => imprimirHtml(htmlFicha)}
                className={`text-sm font-medium transition-colors underline underline-offset-2 hover:opacity-80 ${isDark ? 'text-cyan-400 decoration-cyan-400/40' : 'text-cyan-600 decoration-cyan-600/40'}`}
                title="Clique para imprimir a Ficha de Manutenção"
              >
                Imprimir Ficha de Manutenção
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Printer className={isDark ? 'text-cyan-500' : 'text-cyan-600'} size={18} />
              <button
                onClick={() => imprimirHtml(htmlTermo)}
                className={`text-sm font-medium transition-colors underline underline-offset-2 hover:opacity-80 ${isDark ? 'text-cyan-400 decoration-cyan-400/40' : 'text-cyan-600 decoration-cyan-600/40'}`}
                title="Clique para imprimir a Ordem de Serviço"
              >
                Imprimir Ordem de Serviço
              </button>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={salvando}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={salvando}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
            >
              {salvando ? (
                <><Loader2 size={18} className="animate-spin" /> Registrando...</>
              ) : (
                <><ClipboardCheck size={18} /> Registrar Serviço</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManutencaoPreviewModal;
