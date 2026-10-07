import { supabase } from './supabase';

export async function buscarConflito(dataHora) {
  const [data, hora] = dataHora.split(' ');
  const horaCheia = hora.split(':')[0];
  const { data: registros, error } = await supabase
    .from('Procedimentos')
    .select('id, nome_pessoa, status, horario_atendimento')
    .in('status', ['pendente', 'bloqueado'])
    .like('horario_atendimento', `${data}%`);
  if (error) return { erro: true };
  return (registros || []).find(r => {
    const h = r.horario_atendimento.replace('T', ' ').split(' ')[1] || '';
    return h.split(':')[0] === horaCheia;
  }) || null;
}