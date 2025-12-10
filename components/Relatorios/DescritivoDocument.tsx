import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { DescricaoEquipamento } from '../../types';

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    lineHeight: 1.3,
    position: 'relative'
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 0
  },
  headerImage: {
    width: 271.59,
    height: 36.85,
    marginBottom: 0
  },
  listingTitle: {
    fontSize: 21.48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 5,
    color: '#000'
  },
  dateLocation: {
    fontSize: 14.04,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 0,
    color: '#000'
  },
  sectionHeader: {
    fontSize: 15.48,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 40,
    color: '#000'
  },
  firstSectionHeader: {
    fontSize: 15.48,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 30,
    color: '#000'
  },
  techInfoContainer: {
    marginLeft: 15,
    marginBottom: 40
  },
  techInfoRow: {
    flexDirection: 'row',
    marginBottom: 5
  },
  bullet: {
    width: 15,
    fontSize: 15.48
  },
  techText: {
    fontSize: 15.48
  },
  techLabel: {
    fontWeight: 'bold'
  },
  paragraph: {
    fontSize: 15.48,
    textAlign: 'justify',
    marginBottom: 10,
    textIndent: 19.84,
    lineHeight: 1.4
  },
  introListText: {
    fontSize: 15.48,
    marginTop: 10,
    marginBottom: 15
  },
  componentsContainer: {
    marginTop: 40,
    marginBottom: 10,
    marginLeft: 15
  },
  componentRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start'
  },
  componentBullet: {
    width: 15,
    fontWeight: 'bold',
    fontSize: 15.48
  },
  componentContent: {
    flex: 1,
    fontSize: 15.48,
    textAlign: 'justify'
  },
});

interface DescritivoProps {
  descritivo: DescricaoEquipamento;
}

const DescritivoDocument: React.FC<DescritivoProps> = ({ descritivo }) => {

  const formatDateFull = (isoDate: string) => {
    try {
      if (!isoDate) return "Data inválida";
      // Se já vier com T, usa direto, senão adiciona meio dia para evitar fuso
      const dateStr = isoDate.includes('T') ? isoDate : isoDate + 'T12:00:00';
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch { return isoDate; }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>

        {/* HEADER */}
        <View style={styles.headerContainer}>
          <Image src="/header_unesp_new.png" style={styles.headerImage} />
        </View>

        <Text style={styles.listingTitle}>Descrição de Equipamento</Text>
        <Text style={styles.dateLocation}>Marília, {formatDateFull(descritivo.dataLaudo)}</Text>

        {/* INFORMAÇÕES TÉCNICAS */}
        <Text style={styles.firstSectionHeader}>Informações técnicas:</Text>

        <View style={styles.techInfoContainer}>
          <View style={styles.techInfoRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.techText}><Text style={styles.techLabel}>Equipamento:</Text> {descritivo.equipamento}</Text>
          </View>
          <View style={styles.techInfoRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.techText}><Text style={styles.techLabel}>Marca:</Text> {descritivo.marca}</Text>
          </View>
          <View style={styles.techInfoRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.techText}><Text style={styles.techLabel}>Modelo:</Text> {descritivo.modelo}</Text>
          </View>
          <View style={styles.techInfoRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.techText}><Text style={styles.techLabel}>Patrimônio:</Text> {descritivo.patrimonio}</Text>
          </View>
          <View style={styles.techInfoRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.techText}><Text style={styles.techLabel}>NS:</Text> {descritivo.ns}</Text>
          </View>
        </View>

        <Text style={styles.paragraph}>
          Este laudo atesta as condições e o estado de conservação do <Text style={{ fontWeight: 'bold', fontStyle: 'italic' }}>{descritivo.equipamento} {descritivo.marca} {descritivo.modelo}</Text>, de patrimônio <Text style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Nº {descritivo.patrimonio}</Text>, e confirma que o equipamento passou por inspeção e vistoria técnica.
        </Text>

        <Text style={styles.paragraph}>
          Os testes de bancada, visam verificar as condições dos componentes internos e externos, bem como dos acessórios que acompanham o equipamento e também a possibilidade de atualizações de hardware/ firmware e quando possível a troca/substituição de componentes.
        </Text>

        <Text style={styles.sectionHeader}>Descrição da Avaliação Técnica:</Text>
        <Text style={styles.paragraph}>
          {descritivo.descricaoAvaliacao}
        </Text>

        <Text style={styles.introListText}>
          Abaixo estão listados todos os itens avaliados durante o processo:
        </Text>

        <View style={styles.componentsContainer}>
          {descritivo.componentes.map((comp, index) => (
            <View key={index} style={styles.componentRow} wrap={false}>
              <Text style={styles.componentBullet}>•</Text>
              <Text style={styles.componentContent}>
                <Text style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{comp.item}:</Text> {comp.status} {comp.observacao}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionHeader}>Acessórios do equipamento:</Text>
        <View style={{ marginTop: 0, marginBottom: 10, marginLeft: 15 }}>
          {descritivo.acessorios.map((acc, index) => (
            <View key={index} style={styles.componentRow} wrap={false}>
              <Text style={styles.componentBullet}>•</Text>
              <Text style={styles.componentContent}>
                <Text style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{acc.item}:</Text> {acc.status}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionHeader}>Conclusão:</Text>
        <Text style={styles.paragraph}>
          {descritivo.conclusao}
        </Text>

        {/* Imagens do Equipamento */}
        {descritivo.imagensEquipamento && descritivo.imagensEquipamento.length > 0 && (
          <View style={{ marginTop: 30 }}>
            {descritivo.imagensEquipamento.map((img, index) => (
              <View key={index} style={{ marginBottom: 20, alignItems: 'center' }} wrap={false}>
                <Image
                  src={img}
                  style={{
                    maxWidth: 500,
                    maxHeight: 600,
                    objectFit: 'contain'
                  }}
                />
              </View>
            ))}
          </View>
        )}

        {/* FOOTER IMAGE - Aparece apenas na última página */}
        <View fixed style={{
          position: 'absolute',
          bottom: 30,
          left: 0,
          right: 0,
          alignItems: 'center'
        }} render={({ pageNumber, totalPages }) => (
          pageNumber === totalPages ? (
            <Image
              src="/footer_unesp.png"
              style={{
                width: 271.59,
                height: 31.85
              }}
            />
          ) : null
        )} />

      </Page>
    </Document>
  );
};

export default DescritivoDocument;
