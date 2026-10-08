import { encontrarConflito } from '../src/utils/conflito';

const ag = (hora, nome = 'Maria') => ({ id: 1, nome_pessoa: nome, status: 'pendente', horario_atendimento: `2026-10-20 ${hora}` });
const bloq = hora => ({ id: 2, nome_pessoa: 'Bloqueado', status: 'bloqueado', horario_atendimento: `2026-10-20T${hora}:00` });

describe('encontrarConflito', () => {
  test('mesmo horário exato conflita', () => {
    expect(encontrarConflito([ag('14:30')], '2026-10-20 14:30')).toMatchObject({ nome_pessoa: 'Maria' });
  });

  test('horários diferentes na mesma hora não conflitam', () => {
    expect(encontrarConflito([ag('14:00')], '2026-10-20 14:30')).toBeNull();
    expect(encontrarConflito([ag('14:30')], '2026-10-20 14:00')).toBeNull();
  });

  test('bloqueio vale para a hora inteira', () => {
    expect(encontrarConflito([bloq('14:00')], '2026-10-20 14:00')).toMatchObject({ status: 'bloqueado' });
    expect(encontrarConflito([bloq('14:00')], '2026-10-20 14:45')).toMatchObject({ status: 'bloqueado' });
  });

  test('bloqueio não afeta outras horas', () => {
    expect(encontrarConflito([bloq('14:00')], '2026-10-20 15:00')).toBeNull();
    expect(encontrarConflito([bloq('14:00')], '2026-10-20 13:30')).toBeNull();
  });

  test('compara horas com e sem zero à esquerda', () => {
    expect(encontrarConflito([ag('9:05')], '2026-10-20 09:05')).not.toBeNull();
  });

  test('lista vazia ou indefinida não conflita', () => {
    expect(encontrarConflito([], '2026-10-20 10:00')).toBeNull();
    expect(encontrarConflito(undefined, '2026-10-20 10:00')).toBeNull();
  });

  test('horário inválido não conflita', () => {
    expect(encontrarConflito([ag('10:00')], 'abc')).toBeNull();
  });
});