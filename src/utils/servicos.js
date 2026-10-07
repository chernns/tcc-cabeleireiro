// Agrupa serviços ignorando maiúsculas, acentos e espaços repetidos.
// Recebe os registros (pendentes + concluídos) e devolve os 5 mais frequentes.
export function agruparServicos(registros, limite = 5) {
  const mapa = {};
  (registros || []).forEach(i => {
    const s = (i.nome_procedimento || '').trim();
    if (!s) return;
    const chave = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
    if (!mapa[chave]) {
      const nomeBonito = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      mapa[chave] = { nome: nomeBonito, count: 0, receita: 0 };
    }
    mapa[chave].count++;
    if (i.status === 'concluido') mapa[chave].receita += Number(i.valor || 0);
  });
  return Object.values(mapa).sort((a, b) => b.count - a.count).slice(0, limite);
}