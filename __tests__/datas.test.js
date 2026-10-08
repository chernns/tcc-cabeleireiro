import { formatarData, normalizarData, dataLocal, proximoDia, limitesMes } from '../src/utils/datas';

describe('formatarData', () => {
  test('formata dia/mês e hora com zero à esquerda', () => {
    const d = new Date(2026, 9, 7, 9, 5);
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

describe('dataLocal', () => {
  test('usa o dia local, não o UTC (mesmo à noite)', () => {
    expect(dataLocal(new Date(2026, 9, 7, 23, 59))).toBe('2026-10-07');
    expect(dataLocal(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
  });
});

describe('proximoDia', () => {
  test('dia comum e virada de mês', () => {
    expect(proximoDia('2026-10-07')).toBe('2026-10-08');
    expect(proximoDia('2026-10-31')).toBe('2026-11-01');
  });
  test('virada de ano', () => {
    expect(proximoDia('2026-12-31')).toBe('2027-01-01');
  });
  test('fevereiro, com e sem ano bissexto', () => {
    expect(proximoDia('2026-02-28')).toBe('2026-03-01');
    expect(proximoDia('2028-02-28')).toBe('2028-02-29');
  });
});

describe('limitesMes', () => {
  test('início do mês e início do mês seguinte', () => {
    expect(limitesMes(2026, 9)).toEqual({ inicio: '2026-10-01', fim: '2026-11-01' });
  });
  test('dezembro termina em janeiro do ano seguinte', () => {
    expect(limitesMes(2026, 11)).toEqual({ inicio: '2026-12-01', fim: '2027-01-01' });
  });
  test('regressão: inclui o primeiro dia e exclui o primeiro dia do mês seguinte', () => {
    const { inicio, fim } = limitesMes(2026, 9);
    const dentro = r => r >= inicio && r < fim;
    expect(dentro('2026-10-01 10:00')).toBe(true);
    expect(dentro('2026-10-31 23:00')).toBe(true);
    expect(dentro('2026-10-31T09:00:00')).toBe(true);
    expect(dentro('2026-11-01 10:00')).toBe(false);
    expect(dentro('2026-09-30 22:00')).toBe(false);
  });
});