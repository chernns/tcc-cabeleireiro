export function formatarData(d) {
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth()+1}  ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
}

export function normalizarData(str) {
  return str ? str.replace('T', ' ').substring(0, 10) : '';
}

const pad2 = n => String(n).padStart(2, '0');

// Data local no formato YYYY-MM-DD (sem passar por UTC).
export function dataLocal(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// "2026-10-31" -> "2026-11-01"
export function proximoDia(texto) {
  const [a, m, d] = String(texto).split('-').map(Number);
  return dataLocal(new Date(a, m - 1, d + 1));
}

// Limites do mês em texto: início inclusivo, fim exclusivo. mes: 0 a 11.
export function limitesMes(ano, mes) {
  return { inicio: dataLocal(new Date(ano, mes, 1)), fim: dataLocal(new Date(ano, mes + 1, 1)) };
}