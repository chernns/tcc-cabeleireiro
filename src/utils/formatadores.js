export function formatarContagem(ms) {
  if (ms <= 0) return 'Agora!';
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2,'0')}m ${String(ss).padStart(2,'0')}s`;
  return `${String(m).padStart(2,'0')}m ${String(ss).padStart(2,'0')}s`;
}