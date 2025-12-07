import * as XLSX from 'xlsx';
import { RegistroAtendimento } from '../../types';

export const exportToExcel = (registros: RegistroAtendimento[], filename: string) => {
  // Format data for Excel
  const data = registros.map(r => ({
    'Data/Hora': new Date(r.dataHora).toLocaleString('pt-BR'),
    'Nome Solicitante': r.nomeSolicitante,
    'Vínculo': r.tipoSolicitante,
    'Local': r.local,
    'Descrição': r.descricaoRequisicao,
    'Status': r.status
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths (optional but good)
  const colWidths = [
    { wch: 20 }, // Data/Hora
    { wch: 30 }, // Nome
    { wch: 15 }, // Vínculo
    { wch: 15 }, // Local
    { wch: 50 }, // Descricao
    { wch: 10 }  // Status
  ];
  worksheet['!cols'] = colWidths;

  // Add AutoFilter
  if (worksheet['!ref']) {
    worksheet['!autofilter'] = { ref: worksheet['!ref'] };
  }

  // Freeze top row
  worksheet['!views'] = [
    { state: 'frozen', xSplit: 0, ySplit: 1 }
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatorio');

  // Trigger download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
