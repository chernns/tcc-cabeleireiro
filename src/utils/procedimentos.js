export const OPCOES_SERVICO = ['Cabelo', 'Barba', 'Cabelo + barba'];

const TEXTO = { 'Cabelo': 'cabelo', 'Barba': 'barba', 'Cabelo + barba': 'cabelo e barba' };
const PREFIXO = { corte: 'Corte de ', pintura: 'Pintura de ' };

// { corte: 'Cabelo', pintura: 'Barba' } -> "Corte de cabelo + Pintura de barba".
// `outros` guarda textos antigos (digitados antes dos botões) para não perdê-los ao editar.
export function montarProcedimento({ corte = '', pintura = '', outros = [] } = {}) {
  const partes = [];
  if (TEXTO[corte]) partes.push(PREFIXO.corte + TEXTO[corte]);
  if (TEXTO[pintura]) partes.push(PREFIXO.pintura + TEXTO[pintura]);
  return [...partes, ...outros].join(' + ');
}

// Faz o caminho inverso: texto salvo -> opções marcadas + partes não reconhecidas.
export function lerProcedimento(texto) {
  const resultado = { corte: '', pintura: '', outros: [] };
  String(texto || '').split(' + ').map(p => p.trim()).filter(Boolean).forEach(parte => {
    for (const grupo of ['corte', 'pintura']) {
      for (const rotulo of OPCOES_SERVICO) {
        if (!resultado[grupo] && parte === PREFIXO[grupo] + TEXTO[rotulo]) {
          resultado[grupo] = rotulo;
          return;
        }
      }
    }
    resultado.outros.push(parte);
  });
  return resultado;
}