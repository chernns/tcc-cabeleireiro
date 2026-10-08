import { gerarSlots, calcularDesabilitados } from '../src/utils/slots';

const DATA = '2026-10-20';
const slots = gerarSlots(8, 18, 30);
const ag = (id, hora, dia = DATA) => ({ id, status: 'pendente', horario_atendimento: `${dia} ${hora}` });
const bloq = (hora, dia = DATA) => ({ id: 99, status: 'bloqueado', horario_atendimento: `${dia}T${hora}:00` });
const futuro = new Date(2026, 9, 1, 12, 0); // data de referência anterior ao dia testado

const calc = (extra = {}) => calcularDesabilitados({ slots, data: DATA, lista: [], bloqueios: [], agora: futuro, ...extra });

describe('calcularDesabilitados', () => {
  test('sem data nada é desabilitado', () => {
    expect(calc({ data: '' }).size).toBe(0);
  });

  test('agendamento desabilita o horário exato', () => {
    const off = calc({ lista: [ag(1, '10:30')] });
    expect(off.has('10:30')).toBe(true);
    expect(off.has('10:00')).toBe(false);
  });

  test('agendamento de outro dia não afeta', () => {
    expect(calc({ lista: [ag(1, '10:30', '2026-10-21')] }).has('10:30')).toBe(false);
  });

  test('ignorarId libera o horário do agendamento reagendado', () => {
    const off = calc({ lista: [ag(1, '10:30'), ag(2, '11:00')], ignorarId: 1 });
    expect(off.has('10:30')).toBe(false);
    expect(off.has('11:00')).toBe(true);
  });

  test('bloqueio desabilita a hora inteira', () => {
    const off = calc({ bloqueios: [bloq('15:00')] });
    expect(off.has('15:00')).toBe(true);
    expect(off.has('15:30')).toBe(true);
    expect(off.has('14:30')).toBe(false);
    expect(off.has('16:00')).toBe(false);
  });

  test('hoje: horários já passados ficam desabilitados', () => {
    const agora = new Date(2026, 9, 20, 14, 10);
    const off = calc({ agora });
    expect(off.has('14:00')).toBe(true);
    expect(off.has('08:00')).toBe(true);
    expect(off.has('14:30')).toBe(false);
  });

  test('em outra data os horários passados do relógio não afetam', () => {
    const agora = new Date(2026, 9, 19, 23, 0);
    expect(calc({ agora }).has('08:00')).toBe(false);
  });
});