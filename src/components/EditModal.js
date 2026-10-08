import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

//---------------components------------------//

import { CalendarioCustom } from './CalendarioCustom';
import { SeletorOpcoes, OPCOES_CORTE } from './SeletorOpcoes';
import { SeletorHorario } from './SeletorHorario';

//-----------------utils-----------------//

import { normalizarHorario } from '../utils/horario';
import { gerarSlots, calcularDesabilitados } from '../utils/slots';


export function EditModal({
  visible, item, dadosCliente, T, onSalvar, onFechar, dataInicial = '',
  lista = [], bloqueios = [], horaInicio = 7, horaFim = 22, intervalo = 30,
}) {
  const [nome, setNome] = useState(''), [horario, setHorario] = useState(''), [telefone, setTelefone] = useState('');
  const [valor, setValor] = useState(''), [corte, setCorte] = useState(''), [procedimento, setProcedimento] = useState('');
  const [dataEdit, setDataEdit] = useState(''), [focused, setFocused] = useState('');
  const [mostrarCal, setMostrarCal] = useState(false);
  const isReagendar = !item && !!dataInicial;

  // Horários disponíveis na data escolhida (o agendamento sendo reagendado não ocupa o próprio horário)
  const ignorarId = (item || dadosCliente)?.id ?? null;
  const slots = gerarSlots(horaInicio, horaFim, intervalo);
  const desabilitados = calcularDesabilitados({ slots, data: dataEdit, lista, bloqueios, ignorarId });

  useEffect(() => {
    if (!item) return;
    setNome(item.nome_pessoa ? String(item.nome_pessoa) : '');
    setTelefone(item.telefone ? String(item.telefone) : '');
    setValor(item.valor ? String(item.valor) : '');
    setCorte(item.tipo_corte ? String(item.tipo_corte) : '');
    setProcedimento(item.nome_procedimento ? String(item.nome_procedimento) : '');
    const dt = item.horario_atendimento ? new Date(item.horario_atendimento) : new Date();
    setHorario(`${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`);
    const raw = item.horario_atendimento || '';
    setDataEdit(raw.split('T')[0].split(' ')[0] || dataInicial);
    setMostrarCal(false);
  }, [item]);

  useEffect(() => { if (item) return; if (dataInicial) { setDataEdit(dataInicial); setMostrarCal(false); } }, [dataInicial, item]);

  useEffect(() => {
    if (!isReagendar || !dadosCliente) return;
    setNome(dadosCliente.nome_pessoa ? String(dadosCliente.nome_pessoa) : '');
    setTelefone(dadosCliente.telefone ? String(dadosCliente.telefone) : '');
    setCorte(dadosCliente.tipo_corte ? String(dadosCliente.tipo_corte) : '');
    setProcedimento(dadosCliente.nome_procedimento ? String(dadosCliente.nome_procedimento) : '');
    setValor(dadosCliente.valor ? String(dadosCliente.valor) : '');
    setHorario('');
  }, [dadosCliente, isReagendar]);

  // Se o horário escolhido deixou de ser válido (outra data, ficou ocupado, intervalo mudou), limpa
  useEffect(() => {
    if (horario && (!slots.includes(horario) || desabilitados.has(horario))) setHorario('');
  }, [dataEdit, lista, bloqueios, horaInicio, horaFim, intervalo]);

  if (!visible) return null;

  function handleSalvar() {
    if (!nome.trim()) { alert('Preencha o nome!'); return; }
    if (!dataEdit) { alert('Selecione uma data!'); return; }
    const h = normalizarHorario(horario);
    if (!h) { alert('Selecione um horário.'); return; }
    onSalvar({ nome_pessoa: nome, tipo_corte: corte, nome_procedimento: procedimento, horario_atendimento: `${dataEdit} ${h}`, telefone, valor });
  }

  const inp = (id, ph, val, setter, extra = {}) => (
    <TextInput placeholder={ph} placeholderTextColor={T.placeholder} value={val} onChangeText={setter} onFocus={() => setFocused(id)} onBlur={() => setFocused('')} style={{ backgroundColor: T.input, color: T.text, borderWidth: 1, borderColor: focused === id ? T.accent : T.inputBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, marginTop: 8, flex: extra.flex || undefined }} {...extra} />
  );
  const lbl = txt => <Text style={{ color: T.accent, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginTop: 18, marginBottom: 2, marginLeft: 2 }}>{txt}</Text>;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onFechar}>
      <View style={{ flex: 1, backgroundColor: T.overlay, justifyContent: 'flex-end' }}>
        <ScrollView style={{ backgroundColor: T.modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: T.modalBorder }} contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: T.inputBorder, alignSelf: 'center', marginBottom: 20 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: T.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 }}>{isReagendar ? '🔄 Reagendar' : 'Editar Agendamento'}</Text>
            <TouchableOpacity onPress={onFechar}><Ionicons name="close" size={22} color={T.textSub} /></TouchableOpacity>
          </View>

          {lbl('Data')}
          <TouchableOpacity onPress={() => setMostrarCal(v => !v)} style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: T.input, borderWidth: 1, borderColor: mostrarCal ? T.accent : (dataEdit ? T.accent : T.inputBorder), borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="calendar-outline" size={18} color={dataEdit ? T.accent : T.placeholder} />
              <Text style={{ color: dataEdit ? T.text : T.placeholder, fontSize: 15 }}>{dataEdit || 'Selecione uma data'}</Text>
            </View>
            <Ionicons name={mostrarCal ? 'chevron-up' : 'chevron-down'} size={16} color={T.textSub} />
          </TouchableOpacity>
          {mostrarCal && (
            <View style={{ borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
              <CalendarioCustom markedDates={dataEdit ? { [dataEdit]: { selected: true } } : {}} onDayPress={d => { setDataEdit(d.dateString); setMostrarCal(false); }} selectedDate={dataEdit} dark={true} />
            </View>
          )}

          {lbl('Cliente')}{inp('nome', 'Nome completo', nome, setNome)}

          {lbl('Tipo de corte')}
          <SeletorOpcoes T={T} opcoes={OPCOES_CORTE} valor={corte} onChange={setCorte} />

          {lbl('Procedimento')}
          {inp('proc', 'Procedimento', procedimento, setProcedimento)}

          {lbl('Horário')}
          {!dataEdit ? (
            <Text style={{ color: T.placeholder, fontSize: 13, marginTop: 8 }}>Selecione uma data para ver os horários.</Text>
          ) : slots.length === 0 ? (
            <Text style={{ color: T.placeholder, fontSize: 13, marginTop: 8 }}>Nenhum horário disponível. Confira o funcionamento e o intervalo em Config.</Text>
          ) : (
            <SeletorHorario T={T} slots={slots} valor={horario} onChange={setHorario} desabilitados={desabilitados} />
          )}

          {lbl('Contato & Valor')}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {inp('tel', 'Telefone', telefone, setTelefone, { flex: 1, keyboardType: 'phone-pad' })}
            {inp('val', 'R$ 0,00', valor, setValor, { flex: 1, keyboardType: 'numeric' })}
          </View>

          <TouchableOpacity onPress={handleSalvar} style={{ backgroundColor: T.accent, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 24, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 }}>{isReagendar ? 'Confirmar Reagendamento' : 'Salvar Alterações'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}