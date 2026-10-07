export function formatarData(d) {
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth()+1}  ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
}

export function normalizarData(str) {
  return str ? str.replace('T', ' ').substring(0, 10) : '';
}