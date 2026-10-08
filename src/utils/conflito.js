import { horaDeRegistro } from './slots';

// Agendamento: conflita só no mesmo horário exato. Bloqueio: vale para a hora inteira.
// `registros` já devem ser do mesmo dia (a consulta ao banco filtra a data).
export function encontrarConflito(registros, dataHora) {
  const hora = horaDeRegistro(dataHora);
  if (!hora) return null;
  const horaCheia = hora.slice(0, 2);
  return (registros || []).find(r => {
    const h = horaDeRegistro(r.horario_atendimento);
    if (!h) return false;
    return r.status === 'bloqueado' ? h.slice(0, 2) === horaCheia : h === hora;
  }) || null;
}