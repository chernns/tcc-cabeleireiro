export function normalizarHorario(texto) {
  const m = String(texto || '').trim().match(/^([01]?\d|2[0-3]):([0-5]?\d)$/);
  if (!m) return null;
  return `${m[1].padStart(2, '0')}:${m[2].padStart(2, '0')}`;
}