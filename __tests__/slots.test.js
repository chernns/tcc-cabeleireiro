import { gerarSlots, horaDeRegistro } from '../src/utils/slots';

describe('gerarSlots', () => {
  test('30 min: começa na abertura e termina antes do fechamento', () => {
    const s = gerarSlots(7, 22, 30);
    expect(s[0]).toBe('07:00');
    expect(s[s.length - 1]).toBe('21:30');
    expect(s).toHaveLength(30);
  });

  test('45 min: contagem a partir da abertura', () => {
    const s = gerarSlots(7, 22, 45);
    expect(s.slice(0, 4)).toEqual(['07:00', '07:45', '08:30', '09:15']);
    expect(s.slice(10, 13)).toEqual(['14:30', '15:15', '16:00']);
    expect(s).toHaveLength(20);
  });

  test('60 min', () => {
    expect(gerarSlots(8, 10, 60)).toEqual(['08:00', '09:00']);
  });

  test('aceita intervalo como texto', () => {
    expect(gerarSlots(8, 9, '30')).toEqual(['08:00', '08:30']);
  });

  test('intervalo inválido ou funcionamento inválido devolve lista vazia', () => {
    expect(gerarSlots(7, 22, 0)).toEqual([]);
    expect(gerarSlots(7, 22, -30)).toEqual([]);
    expect(gerarSlots(7, 22, 'abc')).toEqual([]);
    expect(gerarSlots(10, 10, 30)).toEqual([]);
    expect(gerarSlots(12, 8, 30)).toEqual([]);
  });
});

describe('horaDeRegistro', () => {
  test('formato com espaço e com T', () => {
    expect(horaDeRegistro('2026-10-07 14:30')).toBe('14:30');
    expect(horaDeRegistro('2026-10-07T09:00:00')).toBe('09:00');
  });
  test('completa zeros', () => {
    expect(horaDeRegistro('2026-10-07 9:5')).toBe('09:05');
  });
  test('valores inválidos devolvem vazio', () => {
    expect(horaDeRegistro('')).toBe('');
    expect(horaDeRegistro(null)).toBe('');
    expect(horaDeRegistro('abc')).toBe('');
    expect(horaDeRegistro('2026-10-07')).toBe('');
  });
});