export function trimestreAtual() {
  const agora = new Date();
  const tri   = Math.floor(agora.getMonth() / 3) + 1; // 1..4
  const ano   = agora.getFullYear();
  return { tri, ano };
}

export function labelTrimestre(tri, ano) {
  const nomes = { 1: '1º Trimestre', 2: '2º Trimestre', 3: '3º Trimestre', 4: '4º Trimestre' };
  return `${nomes[tri]} ${ano}`;
}

export function rangeTrimestrre(tri, ano) {
  const mesInicio = (tri - 1) * 3;
  const mesFim    = mesInicio + 2;
  const inicio    = new Date(ano, mesInicio, 1).toISOString();
  const fim       = new Date(ano, mesFim + 1, 0, 23, 59, 59).toISOString();
  return { inicio, fim };
}