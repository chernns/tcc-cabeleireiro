import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function AppointmentCard({ item, T, dark, concluir, cancelar, formatarData }) {
    return (
        <View style={{ backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, borderRadius: 16, marginTop: 14, overflow: 'hidden' }}>
        <View style={{ height: 3, backgroundColor: T.accent }} />
        <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person" size={18} color={T.accent} />
                </View>
                <Text style={{ color: T.text, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>{item.nome_pessoa}</Text>
            </View>
            <View style={{ backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: T.accent, fontSize: 12, fontWeight: '700' }}>R$ {item.valor || '0'}</Text>
            </View>
            </View>
            <View style={{ backgroundColor: dark ? '#111111' : '#F8F5F0', borderRadius: 10, padding: 12, gap: 6, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="time-outline" size={14} color={T.textSub} />
                <Text style={{ color: T.textSub, fontSize: 13 }}>{formatarData(item.horario_atendimento)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="cut-outline" size={14} color={T.textSub} />
                <Text style={{ color: T.textSub, fontSize: 13 }}>{item.nome_procedimento || 'Procedimento não informado'}</Text>
            </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => concluir(item)} style={{ flex: 1, backgroundColor: T.success, paddingVertical: 11, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
                <Ionicons name="checkmark-circle-outline" size={15} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Concluir</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => cancelar(item)} style={{ flex: 1, backgroundColor: 'transparent', paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: T.danger, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
                <Ionicons name="close-circle-outline" size={15} color={T.danger} />
                <Text style={{ color: T.danger, fontWeight: '700', fontSize: 12 }}>Cancelar</Text>
            </TouchableOpacity>
            </View>
        </View>
        </View>
    );
}