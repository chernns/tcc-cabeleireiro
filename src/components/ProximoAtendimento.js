import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

//-----------------utils-----------------//

import { formatarContagem } from '../utils/formatadores';

export function ProximoAtendimento({ lista, T, formatarData }) {
    const [agora, setAgora] = useState(Date.now());
    useEffect(() => { const id = setInterval(() => setAgora(Date.now()), 1000); return () => clearInterval(id); }, []);
    const proximo = lista.map(i => ({ ...i, ts: new Date(i.horario_atendimento).getTime() })).filter(i => i.ts >= agora - 60000).sort((a, b) => a.ts - b.ts)[0];
    if (!proximo) return null;
    const diff = proximo.ts - agora, urgente = diff < 15 * 60 * 1000;
    return (
        <View style={{ backgroundColor: T.surface, borderRadius: 16, borderWidth: 1.5, borderColor: urgente ? T.danger : T.accent, marginBottom: 18, overflow: 'hidden' }}>
        <View style={{ height: 3, backgroundColor: urgente ? T.danger : T.accent }} />
        <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: urgente ? 'rgba(192,57,43,0.12)' : T.accentGlow, borderWidth: 1, borderColor: urgente ? 'rgba(192,57,43,0.35)' : T.accentDim, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={urgente ? 'alarm-outline' : 'time-outline'} size={22} color={urgente ? T.danger : T.accent} />
            </View>
            <View style={{ flex: 1 }}>
            <Text style={{ color: T.textSub, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>Próximo atendimento</Text>
            <Text style={{ color: T.text, fontSize: 15, fontWeight: '800' }}>{proximo.nome_pessoa}</Text>
            {proximo.nome_procedimento ? <Text style={{ color: T.textSub, fontSize: 12, marginTop: 1 }}>{proximo.nome_procedimento}</Text> : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: urgente ? T.danger : T.accent, fontSize: diff <= 0 ? 16 : 18, fontWeight: '800', letterSpacing: -0.5 }}>{formatarContagem(diff)}</Text>
            <Text style={{ color: T.textSub, fontSize: 11, marginTop: 2 }}>{formatarData(proximo.horario_atendimento)}</Text>
            </View>
        </View>
        </View>
    );
}