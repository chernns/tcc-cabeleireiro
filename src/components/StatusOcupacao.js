import React from 'react';
import { View, Text } from 'react-native';

export function StatusOcupacao({ agendamentos, bloqueios, horaInicio, horaFim, T }) {
    const totalSlots = horaFim - horaInicio;
    const horasOcupadas = new Set([
        ...agendamentos.map(a => new Date(a.horario_atendimento).getHours()),
        ...bloqueios.map(b => new Date(b.horario_atendimento).getHours()),
    ]).size;
    const pct = totalSlots > 0 ? Math.round((horasOcupadas / totalSlots) * 100) : 0;
    const cor = pct >= 80 ? '#C0392B' : pct >= 50 ? '#E67E22' : '#27AE60';
    if (agendamentos.length === 0 && bloqueios.length === 0) return null;
    return (
        <View style={{ backgroundColor: T.surface, borderRadius: 14, borderWidth: 1, borderColor: T.cardBorder, padding: 14, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ color: T.textSub, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>Ocupação do dia</Text>
            <Text style={{ color: cor, fontWeight: '800', fontSize: 15 }}>{pct}%</Text>
        </View>
        <View style={{ height: 8, backgroundColor: T.cardBorder, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ height: 8, width: `${pct}%`, backgroundColor: cor, borderRadius: 4 }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ color: T.textSub, fontSize: 11 }}>{horasOcupadas} hora{horasOcupadas !== 1 ? 's' : ''} ocupada{horasOcupadas !== 1 ? 's' : ''}</Text>
            <Text style={{ color: T.textSub, fontSize: 11 }}>{totalSlots - horasOcupadas} livre{totalSlots - horasOcupadas !== 1 ? 's' : ''}</Text>
        </View>
        </View>
    );
}