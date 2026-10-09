const ok = () => ({ ok: true });
const falha = error => ({ ok: false, erro: error.message });

export async function concluirProcedimento(client, id) {
  const { error } = await client.from('Procedimentos').update({ status: 'concluido' }).eq('id', id);
  return error ? falha(error) : ok();
}

export async function removerProcedimento(client, id) {
  const { error } = await client.from('Procedimentos').delete().eq('id', id);
  return error ? falha(error) : ok();
}

// Insere em lotes; para no primeiro erro.
export async function inserirBloqueios(client, registros, tamanhoLote = 50) {
  for (let i = 0; i < registros.length; i += tamanhoLote) {
    const { error } = await client.from('Procedimentos').insert(registros.slice(i, i + tamanhoLote));
    if (error) return falha(error);
  }
  return ok();
}