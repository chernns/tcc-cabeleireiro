import { concluirProcedimento, removerProcedimento, inserirBloqueios } from '../src/services/procedimentos';

function criarClient({ erro = null, falharNoInsert = null } = {}) {
  const chamadas = [];
  let inserts = 0;
  const cadeia = (tipo, dados) => ({
    eq: async (campo, valor) => { chamadas.push({ tipo, dados, campo, valor }); return { error: erro }; },
  });
  return {
    chamadas,
    from: () => ({
      update: dados => cadeia('update', dados),
      delete: () => cadeia('delete'),
      insert: async linhas => {
        inserts++;
        chamadas.push({ tipo: 'insert', linhas });
        return { error: falharNoInsert === inserts ? { message: 'falhou' } : erro };
      },
    }),
  };
}

describe('concluirProcedimento', () => {
  test('atualiza o status do registro certo', async () => {
    const c = criarClient();
    expect(await concluirProcedimento(c, 7)).toEqual({ ok: true });
    expect(c.chamadas[0]).toMatchObject({ tipo: 'update', dados: { status: 'concluido' }, campo: 'id', valor: 7 });
  });

  test('devolve o erro do banco em vez de fingir sucesso', async () => {
    const c = criarClient({ erro: { message: 'sem conexão' } });
    expect(await concluirProcedimento(c, 7)).toEqual({ ok: false, erro: 'sem conexão' });
  });
});

describe('removerProcedimento', () => {
  test('remove o registro certo', async () => {
    const c = criarClient();
    expect(await removerProcedimento(c, 3)).toEqual({ ok: true });
    expect(c.chamadas[0]).toMatchObject({ tipo: 'delete', campo: 'id', valor: 3 });
  });

  test('devolve o erro do banco', async () => {
    const c = criarClient({ erro: { message: 'sem conexão' } });
    expect(await removerProcedimento(c, 3)).toEqual({ ok: false, erro: 'sem conexão' });
  });
});

describe('inserirBloqueios', () => {
  const gerar = n => Array.from({ length: n }, (_, i) => ({ id: i }));

  test('divide em lotes de 50', async () => {
    const c = criarClient();
    expect(await inserirBloqueios(c, gerar(120))).toEqual({ ok: true });
    expect(c.chamadas.map(x => x.linhas.length)).toEqual([50, 50, 20]);
  });

  test('para no primeiro lote que falhar', async () => {
    const c = criarClient({ falharNoInsert: 2 });
    expect(await inserirBloqueios(c, gerar(120))).toEqual({ ok: false, erro: 'falhou' });
    expect(c.chamadas).toHaveLength(2);
  });

  test('lista vazia não chama o banco', async () => {
    const c = criarClient();
    expect(await inserirBloqueios(c, [])).toEqual({ ok: true });
    expect(c.chamadas).toHaveLength(0);
  });
});