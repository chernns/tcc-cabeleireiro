import { normalizarHorario } from '../src/utils/horario';

describe('normalizarHorario', () => {
  test('mantém horário já formatado', () => {
    expect(normalizarHorario('14:30')).toBe('14:30');
  });

  test('completa com zero à esquerda', () => {
    expect(normalizarHorario('9:05')).toBe('09:05');
    expect(normalizarHorario('9:5')).toBe('09:05');
  });

  test('aceita os limites válidos', () => {
    expect(normalizarHorario('00:00')).toBe('00:00');
    expect(normalizarHorario('23:59')).toBe('23:59');
  });

  test('ignora espaços nas pontas', () => {
    expect(normalizarHorario('  14:30 ')).toBe('14:30');
  });

  test('rejeita horas e minutos fora do intervalo', () => {
    expect(normalizarHorario('24:00')).toBeNull();
    expect(normalizarHorario('12:60')).toBeNull();
  });

  test('rejeita texto e formatos errados', () => {
    expect(normalizarHorario('abc')).toBeNull();
    expect(normalizarHorario('1430')).toBeNull();
    expect(normalizarHorario('14:30:00')).toBeNull();
  });

  test('rejeita vazio, null e undefined', () => {
    expect(normalizarHorario('')).toBeNull();
    expect(normalizarHorario(null)).toBeNull();
    expect(normalizarHorario(undefined)).toBeNull();
  });
});