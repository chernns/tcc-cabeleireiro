import React from 'react';
import { View, Text, TextInput, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function ConfigScreen({
  T, dark, setDark,
  horaInicio, setHoraInicio, horaFim, setHoraFim,
  intervalo, setIntervalo, msgLembrete, setMsgLembrete,
}) {
    return (
        <ScrollView contentContainerStyle={{ padding: 18 }} showsVerticalScrollIndicator indicatorStyle={dark ? 'white' : 'black'}>
            <View style={{ marginBottom: 24 }}>
                <Text style={{ color: T.textSub, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>Preferências</Text>
                <Text style={{ color: T.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>Configurações</Text>
            </View>
            <Text style={{ color: T.accent, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Aparência</Text>
            <View style={{ backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden', marginBottom: 24 }}>
                <TouchableOpacity onPress={() => setDark(v => !v)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name={dark ? 'moon' : 'sunny'} size={20} color={T.accent} />
                        </View>
                        <View>
                            <Text style={{ color: T.text, fontSize: 15, fontWeight: '700' }}>{dark ? 'Modo Escuro' : 'Modo Claro'}</Text>
                            <Text style={{ color: T.textSub, fontSize: 12, marginTop: 1 }}>Aparência do aplicativo</Text>
                        </View>
                    </View>
                <Switch value={dark} onValueChange={setDark} trackColor={{ false: T.inputBorder, true: T.accentDim }} thumbColor={dark ? T.accent : T.textSub} pointerEvents="none" />
                </TouchableOpacity>
            </View>
            <Text style={{ color: T.accent, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Horário de Funcionamento</Text>
            <View style={{ backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.cardBorder, padding: 18, marginBottom: 24 }}>
                <Text style={{ color: T.textSub, fontSize: 13, marginBottom: 16, lineHeight: 18 }}>Define o intervalo de horas exibido na linha do tempo da agenda.</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    {[{ label: 'Abertura', val: horaInicio, dec: () => setHoraInicio(h => Math.max(0, h-1)), inc: () => setHoraInicio(h => Math.min(horaFim-1, h+1)) }, { label: 'Fechamento', val: horaFim, dec: () => setHoraFim(h => Math.max(horaInicio+1, h-1)), inc: () => setHoraFim(h => Math.min(23, h+1)) }].map((item, i) => (
                        <View key={i} style={{ flex: 1 }}>
                            <Text style={{ color: T.textSub, fontSize: 12, marginBottom: 8 }}>{item.label}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: T.input, borderRadius: 12, borderWidth: 1, borderColor: T.inputBorder, paddingHorizontal: 12, paddingVertical: 10 }}>
                                <TouchableOpacity onPress={item.dec} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="remove" size={16} color={T.accent} /></TouchableOpacity>
                                    <Text style={{ color: T.text, fontSize: 18, fontWeight: '800', minWidth: 44, textAlign: 'center' }}>{String(item.val).padStart(2,'0')}h</Text>
                                <TouchableOpacity onPress={item.inc} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="add" size={16} color={T.accent} /></TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, backgroundColor: T.accentGlow, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: T.accentDim }}>
                    <Ionicons name="time-outline" size={16} color={T.accent} />
                    <Text style={{ color: T.accent, fontSize: 13, fontWeight: '600' }}>Funcionamento: {String(horaInicio).padStart(2,'0')}:00 até {String(horaFim).padStart(2,'0')}:00 — {horaFim - horaInicio}h de trabalho</Text>
                </View>
            </View>
            <Text style={{ color: T.accent, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Intervalo entre Atendimentos</Text>
            <View style={{ backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.cardBorder, padding: 18, marginBottom: 24 }}>
                <Text style={{ color: T.textSub, fontSize: 13, marginBottom: 16, lineHeight: 18 }}>Duração padrão sugerida no campo "Duração" ao criar um novo agendamento.</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TouchableOpacity onPress={() => setIntervalo(i => Math.max(5, i-5))} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="remove" size={20} color={T.accent} /></TouchableOpacity>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ color: T.accent, fontSize: 36, fontWeight: '800', letterSpacing: -1 }}>{intervalo}</Text>
                            <Text style={{ color: T.textSub, fontSize: 12, marginTop: 2 }}>minutos</Text>
                        </View>
                    <TouchableOpacity onPress={() => setIntervalo(i => Math.min(180, i+5))} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="add" size={20} color={T.accent} /></TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                    {[15, 30, 45, 60, 90].map(min => (
                        <TouchableOpacity key={min} onPress={() => setIntervalo(min)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: intervalo === min ? T.accent : T.accentGlow, borderWidth: 1, borderColor: intervalo === min ? T.accent : T.accentDim }}>
                            <Text style={{ color: intervalo === min ? '#fff' : T.accent, fontWeight: '700', fontSize: 13 }}>{min}min</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            <Text style={{ color: T.accent, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Mensagem de Lembrete (WhatsApp)</Text>
            <View style={{ backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.cardBorder, padding: 18, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: T.accentGlow, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: T.accentDim, marginBottom: 14 }}>
                    <Ionicons name="information-circle-outline" size={16} color={T.accent} />
                    <Text style={{ color: T.accent, fontSize: 12, flex: 1, lineHeight: 17 }}>Use <Text style={{ fontWeight: '800' }}>{'{nome}'}</Text> para inserir o nome do cliente automaticamente.</Text>
                </View>
                <TextInput value={msgLembrete} onChangeText={setMsgLembrete} multiline numberOfLines={5} textAlignVertical="top" placeholder="Digite a mensagem de lembrete..." placeholderTextColor={T.placeholder} style={{ backgroundColor: T.input, color: T.text, borderWidth: 1, borderColor: T.inputBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, lineHeight: 20, minHeight: 110 }} />
                <Text style={{ color: T.textSub, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 16, marginBottom: 8 }}>Pré-visualização</Text>
                <View style={{ backgroundColor: '#25D366', borderRadius: 14, borderBottomLeftRadius: 4, padding: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 14, lineHeight: 20 }}>{msgLembrete.replace(/\{nome\}/g, 'João Silva') || '...'}</Text>
                </View>
                <TouchableOpacity onPress={() => setMsgLembrete('Olá {nome}! 😊\nPassando para lembrar do seu agendamento conosco.\nQualquer dúvida, é só chamar! ✂️')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: T.inputBorder }}>
                    <Ionicons name="refresh-outline" size={15} color={T.textSub} />
                    <Text style={{ color: T.textSub, fontSize: 13 }}>Restaurar mensagem padrão</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}