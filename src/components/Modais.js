import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function BloqueioModal({ visible, hora, data, T, onConfirm, onCancel }) {
    const [motivo, setMotivo] = useState(''), [focused, setFocused] = useState(false);
    useEffect(() => { if (!visible) setMotivo(''); }, [visible]);
    if (!visible) return null;
    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
        <View style={{ flex: 1, backgroundColor: T.overlay, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 }}>
            <View style={{ width: '100%', backgroundColor: T.modalBg, borderRadius: 20, borderWidth: 1, borderColor: T.modalBorder, overflow: 'hidden' }}>
            <View style={{ height: 4, backgroundColor: T.danger }} />
            <View style={{ padding: 24 }}>
                <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(192,57,43,0.12)', borderWidth: 1, borderColor: 'rgba(192,57,43,0.30)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="lock-closed-outline" size={24} color={T.danger} />
                </View>
                <Text style={{ color: T.text, fontSize: 18, fontWeight: '800', marginBottom: 4 }}>Bloquear horário</Text>
                <Text style={{ color: T.textSub, fontSize: 14, marginBottom: 20 }}>{data}  {hora !== undefined ? String(hora).padStart(2,'0') : '--'}:00</Text>
                <Text style={{ color: T.accent, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Motivo (opcional)</Text>
                <TextInput value={motivo} onChangeText={setMotivo} placeholder="Ex: Almoço, Reunião, Pausa..." placeholderTextColor={T.placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ backgroundColor: T.input, color: T.text, borderWidth: 1, borderColor: focused ? T.accent : T.inputBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 20 }} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={onCancel} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: T.modalBorder, alignItems: 'center' }}>
                    <Text style={{ color: T.textSub, fontWeight: '700', fontSize: 14 }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onConfirm(motivo)} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: T.danger, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                    <Ionicons name="lock-closed-outline" size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Bloquear</Text>
                </TouchableOpacity>
                </View>
            </View>
            </View>
        </View>
        </Modal>
    );
}

export function ConfirmModal({ visible, item, T, onConfirm, onCancel, onReagendar }) {
    if (!item) return null;
    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
        <View style={{ flex: 1, backgroundColor: T.overlay, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 }}>
            <View style={{ width: '100%', backgroundColor: T.modalBg, borderRadius: 20, borderWidth: 1, borderColor: T.modalBorder, overflow: 'hidden' }}>
            <View style={{ height: 4, backgroundColor: T.danger }} />
            <View style={{ padding: 24 }}>
                <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(192,57,43,0.12)', borderWidth: 1, borderColor: 'rgba(192,57,43,0.30)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="trash-outline" size={24} color={T.danger} />
                </View>
                <Text style={{ color: T.text, fontSize: 18, fontWeight: '800', marginBottom: 6, letterSpacing: -0.3 }}>Cancelar agendamento?</Text>
                <Text style={{ color: T.textSub, fontSize: 14, lineHeight: 20, marginBottom: 6 }}>Você está prestes a cancelar o agendamento de</Text>
                <Text style={{ color: T.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>{item.nome_pessoa}</Text>
                {item.nome_procedimento ? <Text style={{ color: T.textSub, fontSize: 13, marginBottom: 12 }}>{item.nome_procedimento}</Text> : <View style={{ marginBottom: 12 }} />}
                <TouchableOpacity onPress={onReagendar} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim, borderRadius: 12, paddingVertical: 12, marginBottom: 12 }}>
                <Ionicons name="refresh-circle-outline" size={18} color={T.accent} />
                <Text style={{ color: T.accent, fontWeight: '700', fontSize: 14 }}>Cancelar e Reagendar</Text>
                </TouchableOpacity>
                <Text style={{ color: 'rgba(192,57,43,0.85)', fontSize: 13, marginBottom: 20, lineHeight: 18 }}>Ou apenas cancele — esta ação não pode ser desfeita.</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={onCancel} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: T.modalBorder, alignItems: 'center' }}>
                    <Text style={{ color: T.textSub, fontWeight: '700', fontSize: 14 }}>Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onConfirm} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: T.danger, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                    <Ionicons name="close-circle-outline" size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Só Cancelar</Text>
                </TouchableOpacity>
                </View>
            </View>
            </View>
        </View>
        </Modal>
    );
}

export function ConcluirModal({ visible, item, T, onConfirm, onCancel }) {
    if (!item) return null;
    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
        <View style={{ flex: 1, backgroundColor: T.overlay, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 }}>
            <View style={{ width: '100%', backgroundColor: T.modalBg, borderRadius: 20, borderWidth: 1, borderColor: T.modalBorder, overflow: 'hidden' }}>
            <View style={{ height: 4, backgroundColor: T.success }} />
            <View style={{ padding: 24 }}>
                <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(39,174,96,0.12)', borderWidth: 1, borderColor: 'rgba(39,174,96,0.30)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="checkmark-circle-outline" size={24} color={T.success} />
                </View>
                <Text style={{ color: T.text, fontSize: 18, fontWeight: '800', marginBottom: 6 }}>Concluir atendimento?</Text>
                <Text style={{ color: T.textSub, fontSize: 14, lineHeight: 20, marginBottom: 6 }}>Confirme a conclusão do atendimento de</Text>
                <Text style={{ color: T.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>{item.nome_pessoa}</Text>
                {item.nome_procedimento ? <Text style={{ color: T.textSub, fontSize: 13, marginBottom: 20 }}>{item.nome_procedimento}</Text> : <View style={{ marginBottom: 20 }} />}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={onCancel} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: T.modalBorder, alignItems: 'center' }}>
                    <Text style={{ color: T.textSub, fontWeight: '700', fontSize: 14 }}>Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onConfirm} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: T.success, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Confirmar</Text>
                </TouchableOpacity>
                </View>
            </View>
            </View>
        </View>
        </Modal>
    );
}