//-------------------RAIZ-------------------//

import { supabase } from './supabase';

//------------------UTILS-------------------//

import { encontrarConflito } from '../utils/conflito';

// Retorna o registro que conflita com o horário, ou null se estiver livre.
export async function buscarConflito(dataHora) {
  const data = dataHora.split(' ')[0];
  const { data: registros, error } = await supabase
    .from('Procedimentos')
    .select('id, nome_pessoa, status, horario_atendimento')
    .in('status', ['pendente', 'bloqueado'])
    .like('horario_atendimento', `${data}%`);
  if (error) return { erro: true };
  return encontrarConflito(registros, dataHora);
}