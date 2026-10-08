import { trimestreAtual, labelTrimestre, limitesTrimestre } from '../src/utils/trimestre';

describe('labelTrimestre', () => {
  test('monta o texto de cada trimestre', () => {
    expect(labelTrimestre(1, 2026)).toBe('1º Trimestre 2026');
    expect(labelTrimestre(4, 2026)).toBe('4º Trimestre 2026');
  });
});

describe('trimestreAtual', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test.each([
    [0, 1], [2, 1],
    [3, 2], [5, 2],
    [6, 3], [8, 3],
    [9, 4], [11, 4],
  ])('mês %i (índice) pertence ao trimestre %i', (mes, esperado) => {
    jest.useFakeTimers().setSystemTime(new Date(2026, mes, 15, 12, 0));
    expect(trimestreAtual()).toEqual({ tri: esperado, ano: 2026 });
  });
});

describe('limitesTrimestre', () => {
  test.each([
    [1, '2026-01-01', '2026-04-01'],
    [2, '2026-04-01', '2026-07-01'],
    [3, '2026-07-01', '2026-10-01'],
    [4, '2026-10-01', '2027-01-01'],
  ])('trimestre %i', (tri, inicio, fim) => {
    expect(limitesTrimestre(tri, 2026)).toEqual({ inicio, fim });
  });

  test('regressão: atendimentos do primeiro dia entram e os do trimestre seguinte não', () => {
    const { inicio, fim } = limitesTrimestre(4, 2026);
    const dentro = r => r >= inicio && r < fim;
    expect(dentro('2026-10-01 10:00')).toBe(true);
    expect(dentro('2026-12-31 22:00')).toBe(true);
    expect(dentro('2027-01-01 10:00')).toBe(false);
    expect(dentro('2026-09-30 22:00')).toBe(false);
  });
});