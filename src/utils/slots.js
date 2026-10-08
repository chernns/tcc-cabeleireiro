import { normalizarData } from './datas';


function pad(n) { return String(n).padStart(2, '0'); }

// Gera os horários do dia: da abertura até antes do fechamento, de `intervalo` em `intervalo` minutos.
export function gerarSlots(horaInicio, horaFim, intervalo) {
  const passo = Number(intervalo);
  if (!(passo > 0)) return [];
  const slots = [];
  for (let min = horaInicio * 60; min < horaFim * 60; min += passo) {
    slots.push(`${pad(Math.floor(min / 60))}:${pad(min % 60)}`);
  }
  return slots;
}

// "2026-10-07 14:30" ou "2026-10-07T09:00:00" -> "14:30" / "09:00". Vazio se inválido.
export function horaDeRegistro(texto) {
  const t = String(texto || '').replace('T', ' ').split(' ')[1] || '';
  const [h, m] = t.split(':');
  if (h === undefined || m === undefined) return '';
  const hh = Number(h), mm = Number(m);
  if (isNaN(hh) || isNaN(mm)) return '';
  return `${pad(hh)}:${pad(mm)}`;
}

// Horários que não podem ser escolhidos em uma data: ocupados, bloqueados e (se for hoje) já passados.
// `ignorarId` libera o horário do agendamento que está sendo reagendado.
export function calcularDesabilitados({ slots, data, lista, bloqueios, ignorarId = null, agora = new Date() }) {
  const off = new Set();
  if (!data) return off;

  (lista || [])
    .filter(i => i.id !== ignorarId && normalizarData(i.horario_atendimento) === data)
    .forEach(i => off.add(horaDeRegistro(i.horario_atendimento)));

  const horasBloqueadas = new Set(
    (bloqueios || [])
      .filter(b => normalizarData(b.horario_atendimento) === data)
      .map(b => horaDeRegistro(b.horario_atendimento).slice(0, 2))
  );
  slots.forEach(s => { if (horasBloqueadas.has(s.slice(0, 2))) off.add(s); });

  const p = n => String(n).padStart(2, '0');
  const hojeStr = `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}`;
  if (data === hojeStr) {
    const atual = `${p(agora.getHours())}:${p(agora.getMinutes())}`;
    slots.forEach(s => { if (s < atual) off.add(s); });
  }
  return off;
}