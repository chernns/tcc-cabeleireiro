import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CalendarioCustom } from '../components/CalendarioCustom';
import { StatusOcupacao } from '../components/StatusOcupacao';
import { LinhaDeTempo } from '../components/LinhaDeTempo';
import { EstadoVazio } from '../components/EstadoVazio';
import { AppointmentCard } from '../components/AppointmentCard';
import { formatarData, normalizarData } from '../utils/datas';

export function AgendaScreen({
    T, dark, lista, agendaAgenda, dataAgenda, setDataAgenda,
    bloqueiosDoDia, horaInicio, horaFim, modoAgenda, setModoAgenda,
    setBloqueioLoteModal, setBloqueioModal, desbloquear,
    setItemParaConcluir, setItemParaCancelar,
}) {
    return (
        <ScrollView contentContainerStyle={{ padding: 18 }} showsVerticalScrollIndicator indicatorStyle={dark ? 'white' : 'black'}>
            <View style={{ marginBottom: 14 }}>
                <Text style={{ color: T.textSub, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>Calendário</Text>
                <Text style={{ color: T.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>Agenda</Text>
            </View>
            <TouchableOpacity onPress={() => setBloqueioLoteModal(true)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(192,57,43,0.10)', borderWidth: 1.5, borderColor: T.danger, borderRadius: 14, paddingVertical: 12, marginBottom: 14 }}>
                <Ionicons name="lock-closed-outline" size={18} color={T.danger} />
                <Text style={{ color: T.danger, fontWeight: '800', fontSize: 14 }}>Bloquear horário em vários dias</Text>
            </TouchableOpacity>
            <View style={{ borderRadius: 20, overflow: 'hidden' }}>
                <CalendarioCustom markedDates={agendaAgenda} onDayPress={d => setDataAgenda(d.dateString)} selectedDate={dataAgenda} dark={dark} />
            </View>
            {dataAgenda ? (
                <View style={{ marginTop: 16 }}>
                <StatusOcupacao agendamentos={lista.filter(i => normalizarData(i.horario_atendimento) === dataAgenda)} bloqueios={bloqueiosDoDia} horaInicio={horaInicio} horaFim={horaFim} T={T} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ color: T.textSub, fontSize: 13 }}>Agendamentos em <Text style={{ color: T.accent, fontWeight: '700' }}>{dataAgenda}</Text></Text>
                    <View style={{ flexDirection: 'row', backgroundColor: T.surface, borderRadius: 10, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden' }}>
                    <TouchableOpacity onPress={() => setModoAgenda('timeline')} style={{ paddingHorizontal: 12, paddingVertical: 7, backgroundColor: modoAgenda === 'timeline' ? T.accentGlow : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Ionicons name="git-branch-outline" size={14} color={modoAgenda === 'timeline' ? T.accent : T.textSub} />
                        <Text style={{ fontSize: 12, color: modoAgenda === 'timeline' ? T.accent : T.textSub, fontWeight: modoAgenda === 'timeline' ? '700' : '400' }}>Linha</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setModoAgenda('lista')} style={{ paddingHorizontal: 12, paddingVertical: 7, backgroundColor: modoAgenda === 'lista' ? T.accentGlow : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Ionicons name="list-outline" size={14} color={modoAgenda === 'lista' ? T.accent : T.textSub} />
                        <Text style={{ fontSize: 12, color: modoAgenda === 'lista' ? T.accent : T.textSub, fontWeight: modoAgenda === 'lista' ? '700' : '400' }}>Lista</Text>
                    </TouchableOpacity>
                    </View>
                </View>
                {(() => {
                    const doDia = lista.filter(i => normalizarData(i.horario_atendimento) === dataAgenda);
                    if (modoAgenda === 'timeline') {
                    return <LinhaDeTempo agendamentos={doDia} bloqueios={bloqueiosDoDia} T={T} dark={dark} concluir={setItemParaConcluir} cancelar={setItemParaCancelar} formatarData={formatarData} dataSelecionada={dataAgenda} horaInicio={horaInicio} horaFim={horaFim} onBloquear={h => setBloqueioModal({ hora: h })} onDesbloquear={desbloquear} />;
                    }
                    return doDia.length === 0 ? <EstadoVazio T={T} mensagem={`Nenhum agendamento para ${dataAgenda}`} /> : doDia.map(item => <AppointmentCard key={item.id} item={item} T={T} dark={dark} concluir={setItemParaConcluir} cancelar={setItemParaCancelar} formatarData={formatarData} />);
                })()}
                </View>
            ) : <EstadoVazio T={T} mensagem="Selecione uma data no calendário para ver os agendamentos." />}
        </ScrollView>
    );
}