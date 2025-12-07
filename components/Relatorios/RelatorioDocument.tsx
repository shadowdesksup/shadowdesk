import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { RegistroAtendimento } from '../../types';

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#334155' // slate-700
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1', // slate-300
    paddingBottom: 10
  },
  titleSection: {
    flexDirection: 'column'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a', // slate-900
    marginBottom: 4
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b' // slate-500
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20
  },
  statCard: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f8fafc', // slate-50
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0' // slate-200
  },
  statTitle: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRightWidth: 0,
    borderBottomWidth: 0
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row'
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#e2e8f0',
    padding: 5
  },
  tableHeader: {
    backgroundColor: '#f1f5f9', // slate-100
    fontWeight: 'bold',
    color: '#1e293b' // slate-800
  },
  // Column Widths
  colDate: { width: '15%' },
  colName: { width: '20%' },
  colType: { width: '15%' },
  colLoc: { width: '10%' },
  colDesc: { width: '30%' },
  colStatus: { width: '10%' },

  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10
  }
});

interface RelatorioProps {
  registros: RegistroAtendimento[];
  periodo: string;
  usuario: string;
}

const RelatorioDocument: React.FC<RelatorioProps> = ({ registros, periodo, usuario }) => {
  const total = registros.length;
  const atendidos = registros.filter(r => r.status === 'Atendido').length;
  const pendentes = registros.filter(r => r.status === 'Pendente').length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>ShadowDesk</Text>
            <Text style={styles.subtitle}>Relatório de Atendimentos</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.subtitle}>Gerado em: {new Date().toLocaleDateString('pt-BR')}</Text>
            <Text style={styles.subtitle}>Por: {usuario}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Total</Text>
            <Text style={styles.statValue}>{total}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Atendidos</Text>
            <Text style={{ ...styles.statValue, color: '#10b981' }}>{atendidos}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Pendentes</Text>
            <Text style={{ ...styles.statValue, color: '#eab308' }}>{pendentes}</Text>
          </View>
        </View>

        {/* Table Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={[styles.tableCol, styles.colDate]}><Text>Data</Text></View>
          <View style={[styles.tableCol, styles.colName]}><Text>Solicitante</Text></View>
          <View style={[styles.tableCol, styles.colType]}><Text>Tipo</Text></View>
          <View style={[styles.tableCol, styles.colLoc]}><Text>Local</Text></View>
          <View style={[styles.tableCol, styles.colDesc]}><Text>Descrição</Text></View>
          <View style={[styles.tableCol, styles.colStatus]}><Text>Status</Text></View>
        </View>

        {/* Table Rows */}
        {registros.map((row, i) => (
          <View key={row.id} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc' }]}>
            <View style={[styles.tableCol, styles.colDate]}>
              <Text>{new Date(row.dataHora).toLocaleDateString('pt-BR')} {new Date(row.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View style={[styles.tableCol, styles.colName]}><Text>{row.nomeSolicitante}</Text></View>
            <View style={[styles.tableCol, styles.colType]}><Text>{row.tipoSolicitante}</Text></View>
            <View style={[styles.tableCol, styles.colLoc]}><Text>{row.local}</Text></View>
            <View style={[styles.tableCol, styles.colDesc]}>
              <Text>{row.descricaoRequisicao.length > 50 ? row.descricaoRequisicao.substring(0, 50) + '...' : row.descricaoRequisicao}</Text>
            </View>
            <View style={[styles.tableCol, styles.colStatus]}>
              <Text style={{ color: row.status === 'Pendente' ? '#eab308' : '#10b981' }}>{row.status}</Text>
            </View>
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
          `Página ${pageNumber} de ${totalPages} | ShadowDesk - Relatório Oficial | Periodo: ${periodo}`
        )} fixed />
      </Page>
    </Document>
  );
};

export default RelatorioDocument;
