import { atualizarAgendamento } from '../src/services/agendamentos';

function criarClient(erro = null) {
  const chamadas = [];
  return {
    chamadas,
    from: () => ({
      update: dados => ({
        eq: async (campo, valor) => { chamadas.push({ dados, campo, valor }); return { error: erro }; },
      }),
    }),
  };
}

const dados = {
  nome_pessoa: 'Ana', tipo_corte: 'Feminino', nome_procedimento: 'Barba',
  horario_atendimento: '2026-10-20 14:30', telefone: '(11) 99999-0001', valor: '50,00',
};

describe('atualizarAgendamento', () => {
  test('atualiza somente o registro do id informado', async () => {
    const c = criarClient();
    expect(await atualizarAgendamento(c, 12, dados)).toEqual({ ok: true });
    expect(c.chamadas[0]).toMatchObject({ campo: 'id', valor: 12 });
  });

  test('converte telefone e valor', async () => {
    const c = criarClient();
    await atualizarAgendamento(c, 1, dados);
    expect(c.chamadas[0].dados).toMatchObject({ telefone: 11999990001, valor: 50 });
  });

  test('telefone e valor vazios viram nulo', async () => {
    const c = criarClient();
    await atualizarAgendamento(c, 1, { ...dados, telefone: '', valor: '' });
    expect(c.chamadas[0].dados).toMatchObject({ telefone: null, valor: null });
  });

  test('não altera o status nem outros campos', async () => {
    const c = criarClient();
    await atualizarAgendamento(c, 1, dados);
    expect(Object.keys(c.chamadas[0].dados).sort()).toEqual(
      ['horario_atendimento', 'nome_pessoa', 'nome_procedimento', 'telefone', 'tipo_corte', 'valor']
    );
  });

  test('devolve o erro do banco', async () => {
    const c = criarClient({ message: 'sem conexão' });
    expect(await atualizarAgendamento(c, 1, dados)).toEqual({ ok: false, erro: 'sem conexão' });
  });
});