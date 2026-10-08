import { dataLocal } from './datas';

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

// Limites em texto: início inclusivo, fim exclusivo.
export function limitesTrimestre(tri, ano) {
  const mesInicio = (tri - 1) * 3;
  return {
    inicio: dataLocal(new Date(ano, mesInicio, 1)),
    fim: dataLocal(new Date(ano, mesInicio + 3, 1)),
  };
}