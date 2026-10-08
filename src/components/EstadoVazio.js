import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


export function EstadoVazio({ T, mensagem = 'Nenhum agendamento nesta data', icone = 'calendar-outline' }) {
    return (
        <View style={{ alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 }}>
        <View style={{ marginBottom: 20, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 80, height: 80, borderRadius: 22, backgroundColor: T.accentGlow, borderWidth: 1.5, borderColor: T.accentDim, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={icone} size={38} color={T.accentDim} />
            </View>
            <View style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim }} />
            <View style={{ position: 'absolute', bottom: -4, left: -10, width: 12, height: 12, borderRadius: 6, backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim }} />
        </View>
        <Text style={{ color: T.text, fontSize: 16, fontWeight: '700', marginBottom: 6, textAlign: 'center' }}>Nada por aqui!</Text>
        <Text style={{ color: T.textSub, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>{mensagem}</Text>
        </View>
    );
}