import { gravarAgendamento } from '../src/services/agendamentos';

// Banco simulado: guarda o que foi enviado e devolve a resposta combinada.
function criarClient(resposta = { error: null }) {
  const inseridos = [];
  return {
    inseridos,
    from: () => ({
      insert: async (linhas) => { inseridos.push(...linhas); return resposta; },
    }),
  };
}

const base = { nome_pessoa: 'Teste', horario_atendimento: '2026-10-20 10:00' };

describe('gravarAgendamento', () => {
  test('sem telefone: grava telefone nulo (caso 3.6 nº 1)', async () => {
    const client = criarClient();
    const r = await gravarAgendamento(client, { ...base, telefone: '', valor: '50' });
    expect(r.ok).toBe(true);
    expect(client.inseridos[0].telefone).toBeNull();
  });

  test('sem valor: grava valor nulo (caso 3.6 nº 2)', async () => {
    const client = criarClient();
    await gravarAgendamento(client, { ...base, telefone: '11999990001', valor: '' });
    expect(client.inseridos[0].valor).toBeNull();
  });

  test('telefone com máscara vira número (caso 3.6 nº 3)', async () => {
    const client = criarClient();
    await gravarAgendamento(client, { ...base, telefone: '(11) 99999-0001', valor: '' });
    expect(client.inseridos[0].telefone).toBe(11999990001);
  });

  test('valor com vírgula vira número (caso 3.6 nº 4)', async () => {
    const client = criarClient();
    await gravarAgendamento(client, { ...base, telefone: '', valor: '50,00' });
    expect(client.inseridos[0].valor).toBe(50);
  });

  test('sempre grava com status pendente', async () => {
    const client = criarClient();
    await gravarAgendamento(client, { ...base, telefone: '', valor: '' });
    expect(client.inseridos[0].status).toBe('pendente');
  });

  test('falha do banco devolve erro em vez de fingir sucesso (caso 3.6 nº 5)', async () => {
    const client = criarClient({ error: { message: 'sem conexão' } });
    const r = await gravarAgendamento(client, { ...base, telefone: '', valor: '' });
    expect(r).toEqual({ ok: false, erro: 'sem conexão' });
  });
});