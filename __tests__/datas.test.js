import { formatarData, normalizarData } from '../src/utils/datas';

describe('formatarData', () => {
  test('formata dia/mês e hora com zero à esquerda', () => {
    const d = new Date(2026, 9, 7, 9, 5); // 7 out 2026, 09:05 (horário local)
    expect(formatarData(d)).toBe('7/10  09:05');
  });

  test('formata minutos zerados com dois dígitos', () => {
    const d = new Date(2026, 0, 15, 14, 0);
    expect(formatarData(d)).toBe('15/1  14:00');
  });
});

describe('normalizarData', () => {
  test('extrai a data de um texto com espaço', () => {
    expect(normalizarData('2026-10-07 14:30')).toBe('2026-10-07');
  });

  test('extrai a data de um texto com T (formato ISO)', () => {
    expect(normalizarData('2026-10-07T14:00:00')).toBe('2026-10-07');
  });

  test('retorna vazio para valores vazios', () => {
    expect(normalizarData('')).toBe('');
    expect(normalizarData(null)).toBe('');
    expect(normalizarData(undefined)).toBe('');
  });
});