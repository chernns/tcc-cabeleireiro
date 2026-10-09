import { horaDeRegistro } from './slots';
import { normalizarData } from './datas';

// Separa as datas em livres (podem ser bloqueadas) e ignoradas (já têm agendamento
// pendente ou bloqueio na mesma hora cheia).
export function separarDatasBloqueio(datas, hora, registros) {
  const hh = String(hora).padStart(2, '0');
  const ocupadas = new Set(
    (registros || [])
      .filter(r => (r.status === 'pendente' || r.status === 'bloqueado')
        && horaDeRegistro(r.horario_atendimento).slice(0, 2) === hh)
      .map(r => normalizarData(r.horario_atendimento))
  );
  const livres = [], ignoradas = [];
  datas.forEach(d => (ocupadas.has(d) ? ignoradas : livres).push(d));
  return { livres, ignoradas };
}