import { formatarContagem } from '../src/utils/formatadores';

describe('formatarContagem', () => {
  test('retorna "Agora!" quando o tempo acabou', () => {
    expect(formatarContagem(0)).toBe('Agora!');
    expect(formatarContagem(-5000)).toBe('Agora!');
  });

  test('formata só minutos e segundos abaixo de 1 hora', () => {
    expect(formatarContagem(1000)).toBe('00m 01s');
    expect(formatarContagem(65 * 1000)).toBe('01m 05s');
    expect(formatarContagem(59 * 60 * 1000 + 59 * 1000)).toBe('59m 59s');
  });

  test('inclui horas a partir de 1 hora', () => {
    expect(formatarContagem(3600 * 1000)).toBe('1h 00m 00s');
    expect(formatarContagem((2 * 3600 + 5 * 60 + 9) * 1000)).toBe('2h 05m 09s');
  });

  test('ignora milissegundos (arredonda para baixo)', () => {
    expect(formatarContagem(1999)).toBe('00m 01s');
  });
});