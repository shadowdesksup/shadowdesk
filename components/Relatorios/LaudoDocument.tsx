import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { RegistroAtendimento } from '../../types';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#334155'
  },
  header: {
    flexDirection: 'column',
    marginBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 3
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  logo: {
    width: 200,
    height: 85
  },
  titleSection: {
    flexDirection: 'column'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b'
  },
  recordContainer: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 5
  },
  recordTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  statusBadge: {
    fontSize: 8,
    padding: '2 6',
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
    color: '#0f172a'
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
    gap: 10,
    alignItems: 'flex-start'
  },
  label: {
    fontSize: 10,
    color: '#0f172a',
    fontWeight: 'bold',
    marginRight: 5
  },
  value: {
    fontSize: 10,
    color: '#334155',
    flex: 1
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    marginVertical: 8
  },
  twoColumnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20
  },
  column: {
    flex: 1,
    flexDirection: 'column'
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'flex-start'
  },
  solicitanteRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start'
  },
  descriptionSection: {
    marginTop: 3,
    paddingTop: 3
  },
  descriptionLabel: {
    fontSize: 10,
    color: '#0f172a',
    marginBottom: 10,
    fontWeight: 'bold'
  },
  descriptionText: {
    fontSize: 10,
    lineHeight: 1.4,
    textAlign: 'justify'
  },
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

interface LaudoProps {
  registros: RegistroAtendimento[];
  usuario: string;
}

const LaudoDocument: React.FC<LaudoProps> = ({ registros, usuario }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Image
              src="/shadowdesk-logo.png"
              style={styles.logo}
            />
            <View style={styles.titleSection}>
              <Text style={styles.title}>Relatório de Atendimentos</Text>
              <Text style={styles.subtitle}>Relatório Analítico Detalhado</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', marginTop: -10 }}>
            <Text style={styles.subtitle}>Gerado em: {new Date().toLocaleDateString('pt-BR')}</Text>
            <Text style={styles.subtitle}>Resp: {usuario}</Text>
          </View>
        </View>

        {/* Records */}
        {registros.map((registro) => (
          <View key={registro.id} style={styles.recordContainer} wrap={false}>
            {/* Status Badge at top right */}
            <View style={{ position: 'absolute', top: 10, right: 10 }}>
              <Text style={{
                ...styles.statusBadge,
                backgroundColor: registro.status === 'Atendido' ? '#dcfce7' : '#fef9c3',
                color: registro.status === 'Atendido' ? '#166534' : '#854d0e'
              }}>
                {registro.status.toUpperCase()}
              </Text>
            </View>

            {/* SOLICITANTE at top */}
            <View style={styles.solicitanteRow}>
              <Text style={styles.label}>SOLICITANTE:</Text>
              <Text style={styles.value}>{registro.nomeSolicitante}</Text>
            </View>

            {/* First Divider */}
            <View style={styles.divider} />

            {/* Two Column Layout */}
            <View style={styles.twoColumnRow}>
              {/* Left Column */}
              <View style={styles.column}>
                <View style={styles.fieldRow}>
                  <Text style={styles.label}>DATA/HORA:</Text>
                  <Text style={styles.value}>
                    {new Date(registro.dataHora).toLocaleDateString('pt-BR')} às {new Date(registro.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                <View style={styles.fieldRow}>
                  <Text style={styles.label}>LOCAL:</Text>
                  <Text style={styles.value}>{registro.local}</Text>
                </View>

                {registro.telefone && (
                  <View style={styles.fieldRow}>
                    <Text style={styles.label}>CONTATO:</Text>
                    <Text style={styles.value}>{registro.telefone}</Text>
                  </View>
                )}
              </View>

              {/* Right Column */}
              <View style={styles.column}>
                <View style={styles.fieldRow}>
                  <Text style={styles.label}>VÍNCULO:</Text>
                  <Text style={styles.value}>{registro.tipoSolicitante}</Text>
                </View>

                {registro.email && (
                  <View style={styles.fieldRow}>
                    <Text style={styles.label}>EMAIL:</Text>
                    <Text style={styles.value}>{registro.email}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Second Divider */}
            <View style={styles.divider} />

            {/* Description Section */}
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionLabel}>DESCRIÇÃO DO ATENDIMENTO</Text>
              <Text style={styles.descriptionText}>{registro.descricaoRequisicao}</Text>
            </View>
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
          `Página ${pageNumber} de ${totalPages} | Documento não rasurar`
        )} fixed />
      </Page>
    </Document>
  );
};

export default LaudoDocument;
