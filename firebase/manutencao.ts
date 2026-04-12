/**
 * Gera um ID de ticket de manutenção numérico aleatório.
 * Formato: #XXXXX (5 dígitos)
 * Exemplo: #81543
 */
export const gerarProximoTicketId = async (): Promise<string> => {
  const num = Math.floor(10000 + Math.random() * 90000); // 10000-99999
  return `#${num}`;
};
