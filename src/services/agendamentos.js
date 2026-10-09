//------------------UTILS-------------------//

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

// Atualiza os dados de um agendamento existente. Não mexe em status.
export async function atualizarAgendamento(client, id, dados) {
  const campos = {
    nome_pessoa: dados.nome_pessoa,
    tipo_corte: dados.tipo_corte,
    nome_procedimento: dados.nome_procedimento,
    horario_atendimento: dados.horario_atendimento,
    telefone: telefoneParaNumero(dados.telefone),
    valor: valorParaNumero(dados.valor),
  };
  const { error } = await client.from('Procedimentos').update(campos).eq('id', id);
  return error ? { ok: false, erro: error.message } : { ok: true };
}