import React from 'react';
import { View, Text } from 'react-native';


export function CardRelatorio({ r, T }) {
    return (
        <View style={{ backgroundColor: T.surface, borderRadius: 14, borderWidth: 1, borderColor: T.cardBorder, padding: 16, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
                <Text style={{ color: T.text, fontSize: 15, fontWeight: '700', textTransform: 'capitalize' }}>{r.mes}</Text>
                <Text style={{ color: T.textSub, fontSize: 11, marginTop: 3 }}>{r.criado_em ? new Date(r.criado_em).toLocaleDateString('pt-BR') : ''}</Text>
            </View>
            <View style={{ backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: T.accent, fontWeight: '800', fontSize: 15 }}>R$ {Number(r.total).toFixed(2)}</Text>
            </View>
        </View>
    );
}