import { separarDatasBloqueio } from '../src/utils/bloqueio';

const reg = (status, horario) => ({ status, horario_atendimento: horario });
const datas = ['2026-10-20', '2026-10-21', '2026-10-22'];

describe('separarDatasBloqueio', () => {
  test('sem registros, todas as datas ficam livres', () => {
    expect(separarDatasBloqueio(datas, 14, [])).toEqual({ livres: datas, ignoradas: [] });
    expect(separarDatasBloqueio(datas, 14, undefined)).toEqual({ livres: datas, ignoradas: [] });
  });

  test('agendamento na mesma hora cheia faz o dia ser ignorado', () => {
    const r = separarDatasBloqueio(datas, 14, [reg('pendente', '2026-10-21 14:30')]);
    expect(r.ignoradas).toEqual(['2026-10-21']);
    expect(r.livres).toEqual(['2026-10-20', '2026-10-22']);
  });

  test('agendamento em outra hora não impede o bloqueio', () => {
    const r = separarDatasBloqueio(datas, 14, [reg('pendente', '2026-10-21 15:00')]);
    expect(r.ignoradas).toEqual([]);
  });

  test('bloqueio já existente (formato com T) faz o dia ser ignorado', () => {
    const r = separarDatasBloqueio(datas, 12, [reg('bloqueado', '2026-10-20T12:00:00')]);
    expect(r.ignoradas).toEqual(['2026-10-20']);
  });

  test('atendimento concluído não impede o bloqueio', () => {
    const r = separarDatasBloqueio(datas, 14, [reg('concluido', '2026-10-21 14:00')]);
    expect(r.ignoradas).toEqual([]);
  });

  test('aceita hora sem zero à esquerda', () => {
    const r = separarDatasBloqueio(datas, 9, [reg('pendente', '2026-10-22 09:30')]);
    expect(r.ignoradas).toEqual(['2026-10-22']);
  });

  test('todas ocupadas: nenhuma livre', () => {
    const regs = datas.map(d => reg('pendente', `${d} 14:00`));
    expect(separarDatasBloqueio(datas, 14, regs).livres).toEqual([]);
  });
});