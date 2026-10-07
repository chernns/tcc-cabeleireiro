import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CalendarioCustom } from '../components/CalendarioCustom';
import { ProximoAtendimento } from '../components/ProximoAtendimento';
import { SectionLabel, StyledInput } from '../components/FormFields';
import { EstadoVazio } from '../components/EstadoVazio';
import { AppointmentCard } from '../components/AppointmentCard';
import { formatarData } from '../utils/datas';

export function HomeScreen({
  T, dark, lista, agendaHome, dataHome, setDataHome,
  form, intervalo, salvar, setItemParaConcluir, setItemParaCancelar,
}) {
  const {
    nome, setNome, corte, setCorte, procedimento, setProcedimento,
    duracao, setDuracao, horario, setHorario, telefone, setTelefone,
    valor, setValor, focused, setFocused,
  } = form;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 18 }}
      showsVerticalScrollIndicator
      indicatorStyle={dark ? 'white' : 'black'}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ marginBottom: 18 }}>
        <Text style={{ color: T.textSub, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>Agendamentos</Text>
        <Text style={{ color: T.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>Novo Horário</Text>
      </View>

      <ProximoAtendimento lista={lista} T={T} formatarData={formatarData} />

      <View style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 4 }}>
        <CalendarioCustom markedDates={agendaHome} onDayPress={d => setDataHome(d.dateString)} selectedDate={dataHome} dark={dark} />
      </View>

      {dataHome
        ? <Text style={{ color: T.accent, fontSize: 12, textAlign: 'center', marginBottom: 6, letterSpacing: 1 }}>📅 {dataHome}</Text>
        : <Text style={{ color: T.placeholder, fontSize: 12, textAlign: 'center', marginBottom: 6 }}>Selecione uma data acima</Text>}

      <View style={{ backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.cardBorder, padding: 16, marginTop: 10 }}>
        <SectionLabel T={T}>Cliente</SectionLabel>
        <StyledInput id="nome" placeholder="Nome completo" value={nome} onChangeText={setNome} T={T} focused={focused} setFocused={setFocused} />

        <SectionLabel T={T}>Serviço</SectionLabel>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StyledInput id="corte" placeholder="Tipo de corte" value={corte} onChangeText={setCorte} flex={1} T={T} focused={focused} setFocused={setFocused} />
          <StyledInput id="proc" placeholder="Procedimento" value={procedimento} onChangeText={setProcedimento} flex={1} T={T} focused={focused} setFocused={setFocused} />
        </View>

        <SectionLabel T={T}>Horário</SectionLabel>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StyledInput id="dur" placeholder={`Duração (padrão: ${intervalo}min)`} value={duracao} onChangeText={setDuracao} flex={1} T={T} focused={focused} setFocused={setFocused} />
          <StyledInput id="hora" placeholder="14:00" value={horario} onChangeText={setHorario} flex={1} T={T} focused={focused} setFocused={setFocused} />
        </View>

        <SectionLabel T={T}>Contato & Valor</SectionLabel>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StyledInput id="tel" placeholder="Telefone" value={telefone} onChangeText={setTelefone} flex={1} keyboardType="phone-pad" T={T} focused={focused} setFocused={setFocused} />
          <StyledInput id="val" placeholder="R$ 0,00" value={valor} onChangeText={setValor} flex={1} keyboardType="numeric" T={T} focused={focused} setFocused={setFocused} />
        </View>

        <TouchableOpacity onPress={() => salvar()} style={{ backgroundColor: T.accent, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 20, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 }}>Confirmar Agendamento</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ color: T.text, fontSize: 17, fontWeight: '800' }}>Pendentes</Text>
          <View style={{ backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
            <Text style={{ color: T.accent, fontSize: 12, fontWeight: '700' }}>{lista.length}</Text>
          </View>
        </View>
        {lista.length === 0
          ? <EstadoVazio T={T} mensagem="Nenhum agendamento pendente ainda." />
          : lista.map(item => (
              <AppointmentCard key={item.id} item={item} T={T} dark={dark} concluir={setItemParaConcluir} cancelar={setItemParaCancelar} formatarData={formatarData} />
            ))}
      </View>
    </ScrollView>
  );
}