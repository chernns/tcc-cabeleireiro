import { telefoneParaNumero, valorParaNumero } from '../utils/conversoes';

export async function gravarAgendamento(client, dados) {
  const registro = {
    ...dados,
    telefone: telefoneParaNumero(dados.telefone),
    valor: valorParaNumero(dados.valor),
    status: 'pendente',
  };
  const { error } = await client.from('Procedimentos').insert([registro]);
  return error ? { ok: false, erro: error.message } : { ok: true };
}