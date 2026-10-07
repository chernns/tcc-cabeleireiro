import { trimestreAtual, labelTrimestre, rangeTrimestrre } from '../src/utils/trimestre';

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
    [0, 1], [2, 1],   // jan e mar -> T1
    [3, 2], [5, 2],   // abr e jun -> T2
    [6, 3], [8, 3],   // jul e set -> T3
    [9, 4], [11, 4],  // out e dez -> T4
  ])('mês %i (índice) pertence ao trimestre %i', (mes, esperado) => {
    jest.useFakeTimers().setSystemTime(new Date(2026, mes, 15, 12, 0));
    expect(trimestreAtual()).toEqual({ tri: esperado, ano: 2026 });
  });
});

describe('rangeTrimestrre', () => {
  test('o intervalo do T1 começa em 1/jan e termina em 31/mar', () => {
    const { inicio, fim } = rangeTrimestrre(1, 2026);
    const i = new Date(inicio), f = new Date(fim);
    expect([i.getFullYear(), i.getMonth(), i.getDate()]).toEqual([2026, 0, 1]);
    expect([f.getFullYear(), f.getMonth(), f.getDate()]).toEqual([2026, 2, 31]);
  });

  test('o intervalo do T4 termina em 31/dez', () => {
    const { fim } = rangeTrimestrre(4, 2026);
    const f = new Date(fim);
    expect([f.getMonth(), f.getDate()]).toEqual([11, 31]);
  });

  test('o fim é às 23:59:59 do último dia', () => {
    const f = new Date(rangeTrimestrre(2, 2026).fim);
    expect([f.getHours(), f.getMinutes(), f.getSeconds()]).toEqual([23, 59, 59]);
  });

  test('o início vem antes do fim', () => {
    const { inicio, fim } = rangeTrimestrre(3, 2026);
    expect(new Date(inicio) < new Date(fim)).toBe(true);
  });
});