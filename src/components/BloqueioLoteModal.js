import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DIAS_SEMANA_EXT } from '../constants';

export function BloqueioLoteModal({ visible, T, onFechar, onConfirmar }) {
    const [hora, setHora]           = useState('12');
    const [motivo, setMotivo]       = useState('');
    const [diasSemana, setDiasSemana] = useState([]);
    const [tipoAlvo, setTipoAlvo]   = useState('mes');
    const [salvando, setSalvando]   = useState(false);
    const [focused, setFocused]     = useState('');

    useEffect(() => {
        if (!visible) { setHora('12'); setMotivo(''); setDiasSemana([]); setTipoAlvo('mes'); setSalvando(false); }
    }, [visible]);

    function toggleDia(d) { setDiasSemana(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]); }

    function gerarDatas() {
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        let dataFim = new Date(hoje.getFullYear(), 11, 31);
        if (tipoAlvo === 'semana') { dataFim = new Date(hoje); dataFim.setDate(hoje.getDate() + 6); }
        else if (tipoAlvo === 'mes') { dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0); }
        const datas = [], cur = new Date(hoje);
        while (cur <= dataFim) {
        const dow = cur.getDay();
        if (diasSemana.length === 0 || diasSemana.includes(dow)) {
            const y = cur.getFullYear(), m = String(cur.getMonth()+1).padStart(2,'0'), d = String(cur.getDate()).padStart(2,'0');
            datas.push(`${y}-${m}-${d}`);
        }
        cur.setDate(cur.getDate() + 1);
        }
        return datas;
    }

    async function handleConfirmar() {
        const h = parseInt(hora, 10);
        if (isNaN(h) || h < 0 || h > 23) { alert('Hora inválida (0–23)'); return; }
        const datas = gerarDatas();
        if (datas.length === 0) { alert('Nenhuma data gerada. Verifique os filtros.'); return; }
        setSalvando(true);
        await onConfirmar({ hora: h, motivo, datas });
        setSalvando(false);
    }

    const horasRapidas = ['06','07','08','09','10','11','12','13','14','18','19','20'];
    const tiposAlvo    = [{ id: 'semana', label: 'Próx. 7 dias' }, { id: 'mes', label: 'Este mês' }, { id: 'ano', label: 'Este ano' }];
    const preview      = gerarDatas().length;

    return (
        <Modal transparent animationType="slide" visible={visible} onRequestClose={onFechar}>
        <View style={{ flex: 1, backgroundColor: T.overlay, justifyContent: 'flex-end' }}>
            <ScrollView style={{ backgroundColor: T.modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: T.modalBorder }} contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: T.inputBorder, alignSelf: 'center', marginBottom: 20 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(192,57,43,0.12)', borderWidth: 1, borderColor: 'rgba(192,57,43,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="lock-closed-outline" size={20} color={T.danger} />
                </View>
                <View>
                    <Text style={{ color: T.text, fontSize: 18, fontWeight: '800' }}>Bloquear em lote</Text>
                    <Text style={{ color: T.textSub, fontSize: 12, marginTop: 1 }}>Mesmo horário em vários dias</Text>
                </View>
                </View>
                <TouchableOpacity onPress={onFechar}><Ionicons name="close" size={22} color={T.textSub} /></TouchableOpacity>
            </View>
            <Text style={{ color: T.accent, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginTop: 22, marginBottom: 8 }}>Horário a bloquear</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
                {horasRapidas.map(h => (
                <TouchableOpacity key={h} onPress={() => setHora(h)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: hora === h ? T.danger : T.accentGlow, borderWidth: 1, borderColor: hora === h ? T.danger : T.accentDim }}>
                    <Text style={{ color: hora === h ? '#fff' : T.accent, fontWeight: '700', fontSize: 13 }}>{h}:00</Text>
                </TouchableOpacity>
                ))}
            </View>
            <TextInput value={hora} onChangeText={setHora} placeholder="Ou digite (0–23)" placeholderTextColor={T.placeholder} keyboardType="numeric" onFocus={() => setFocused('hora')} onBlur={() => setFocused('')} style={{ backgroundColor: T.input, color: T.text, borderWidth: 1, borderColor: focused === 'hora' ? T.accent : T.inputBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 }} />
            <Text style={{ color: T.accent, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginTop: 18, marginBottom: 8 }}>Motivo (opcional)</Text>
            <TextInput value={motivo} onChangeText={setMotivo} placeholder="Ex: Almoço, Reunião recorrente..." placeholderTextColor={T.placeholder} onFocus={() => setFocused('motivo')} onBlur={() => setFocused('')} style={{ backgroundColor: T.input, color: T.text, borderWidth: 1, borderColor: focused === 'motivo' ? T.accent : T.inputBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 }} />
            <Text style={{ color: T.accent, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginTop: 18, marginBottom: 8 }}>Período</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
                {tiposAlvo.map(t => (
                <TouchableOpacity key={t.id} onPress={() => setTipoAlvo(t.id)} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: tipoAlvo === t.id ? T.danger : T.accentGlow, borderWidth: 1, borderColor: tipoAlvo === t.id ? T.danger : T.accentDim }}>
                    <Text style={{ color: tipoAlvo === t.id ? '#fff' : T.accent, fontWeight: '700', fontSize: 12 }}>{t.label}</Text>
                </TouchableOpacity>
                ))}
            </View>
            <Text style={{ color: T.accent, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginTop: 18, marginBottom: 8 }}>
                Dias da semana <Text style={{ color: T.textSub, fontWeight: '400', textTransform: 'none' }}>(vazio = todos)</Text>
            </Text>
            <View style={{ flexDirection: 'row', gap: 5 }}>
                {DIAS_SEMANA_EXT.map((d, i) => {
                const ativo = diasSemana.includes(i);
                return (
                    <TouchableOpacity key={i} onPress={() => toggleDia(i)} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: ativo ? T.danger : T.surface, borderWidth: 1, borderColor: ativo ? T.danger : T.cardBorder }}>
                    <Text style={{ color: ativo ? '#fff' : (i === 0 || i === 6) ? T.accent : T.textSub, fontWeight: ativo ? '800' : '400', fontSize: 10 }}>{d}</Text>
                    </TouchableOpacity>
                );
                })}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, backgroundColor: preview > 0 ? 'rgba(192,57,43,0.08)' : T.accentGlow, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: preview > 0 ? 'rgba(192,57,43,0.3)' : T.accentDim }}>
                <Ionicons name="calendar-outline" size={16} color={preview > 0 ? T.danger : T.accent} />
                <Text style={{ color: preview > 0 ? T.danger : T.accent, fontSize: 13, fontWeight: '600', flex: 1 }}>
                {preview === 0 ? 'Nenhuma data gerada com esses filtros' : `${preview} dia${preview !== 1 ? 's' : ''} serão bloqueados às ${hora.padStart(2,'0')}:00`}
                </Text>
            </View>
            <TouchableOpacity onPress={handleConfirmar} disabled={salvando || preview === 0} style={{ backgroundColor: salvando || preview === 0 ? T.accentDim : T.danger, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 20, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                {salvando ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="lock-closed-outline" size={20} color="#fff" />}
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
                {salvando ? 'Bloqueando...' : `Bloquear ${preview} dia${preview !== 1 ? 's' : ''}`}
                </Text>
            </TouchableOpacity>
            </ScrollView>
        </View>
        </Modal>
    );
}