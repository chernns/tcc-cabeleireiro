import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function LinhaDeTempo({ agendamentos, bloqueios, T, dark, concluir, cancelar, formatarData, dataSelecionada, horaInicio = 7, horaFim = 22, onBloquear, onDesbloquear }) {
    const horas = Array.from({ length: horaFim - horaInicio + 1 }, (_, i) => horaInicio + i);
    const porHora = {};
    agendamentos.forEach(a => { const h = new Date(a.horario_atendimento).getHours(); if (!porHora[h]) porHora[h] = []; porHora[h].push({ ...a, tipo: 'agendamento' }); });
    bloqueios.forEach(b => { const h = new Date(b.horario_atendimento).getHours(); if (!porHora[h]) porHora[h] = []; porHora[h].push({ ...b, tipo: 'bloqueio' }); });
    const agora = new Date(), hojeStr = `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,'0')}-${String(agora.getDate()).padStart(2,'0')}`;
    const ehHoje = dataSelecionada === hojeStr, horaAtual = ehHoje ? agora.getHours() : -1;
    function calcularIntervaloLivre(hBase) { let livres = 0; for (let h = hBase; h <= horaFim; h++) { if (porHora[h] && porHora[h].length > 0) break; livres++; } return livres; }
    return (
        <View style={{ marginTop: 16 }}>
        {horas.map((h, idx) => {
            const itens = porHora[h] || [], passado = h < horaAtual, atual = h === horaAtual;
            const bloqueado = itens.some(i => i.tipo === 'bloqueio'), agendadosHora = itens.filter(i => i.tipo === 'agendamento');
            const itemBloqueado = itens.find(i => i.tipo === 'bloqueio');
            const horaAntOcupada = idx > 0 && ((porHora[horas[idx - 1]] || []).length > 0);
            const intervaloLivre = (!bloqueado && agendadosHora.length === 0 && horaAntOcupada) ? calcularIntervaloLivre(h) : 0;
            return (
            <View key={h} style={{ flexDirection: 'row', minHeight: 52 }}>
                <View style={{ width: 48, alignItems: 'flex-end', paddingRight: 12, paddingTop: 2 }}>
                <Text style={{ color: atual ? T.accent : T.textSub, fontSize: 12, fontWeight: atual ? '800' : '400' }}>{String(h).padStart(2,'0')}:00</Text>
                </View>
                <View style={{ flex: 1, borderLeftWidth: 2, borderLeftColor: atual ? T.accent : bloqueado ? T.danger : passado ? T.cardBorder : T.inputBorder, paddingLeft: 14, paddingBottom: 8 }}>
                <View style={{ position: 'absolute', left: -6, top: 4, width: 10, height: 10, borderRadius: 5, backgroundColor: atual ? T.accent : bloqueado ? T.danger : agendadosHora.length > 0 ? T.accent : (passado ? T.cardBorder : T.inputBorder), borderWidth: atual ? 2 : 0, borderColor: T.bg }} />
                {bloqueado ? (
                    <View style={{ backgroundColor: dark ? 'rgba(192,57,43,0.18)' : 'rgba(192,57,43,0.08)', borderRadius: 12, borderWidth: 1.5, borderColor: T.danger, borderStyle: 'dashed', paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(192,57,43,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="lock-closed" size={16} color={T.danger} />
                        </View>
                        <View>
                        <Text style={{ color: T.danger, fontWeight: '800', fontSize: 13, letterSpacing: 0.3 }}>Indisponível</Text>
                        <Text style={{ color: T.danger, fontSize: 11, marginTop: 1, opacity: 0.75 }}>{itemBloqueado?.nome_procedimento || 'Horário bloqueado'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => onDesbloquear(itemBloqueado)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: T.danger, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
                        <Ionicons name="lock-open-outline" size={14} color="#fff" />
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Desbloquear</Text>
                    </TouchableOpacity>
                    </View>
                ) : agendadosHora.length === 0 ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                    <View>
                        {intervaloLivre >= 2 && !passado ? (
                        <View style={{ backgroundColor: 'rgba(39,174,96,0.12)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(39,174,96,0.3)', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Ionicons name="time-outline" size={12} color={T.success} />
                            <Text style={{ color: T.success, fontSize: 11, fontWeight: '600' }}>{intervaloLivre}h livres</Text>
                        </View>
                        ) : atual ? (
                        <View style={{ backgroundColor: T.accentGlow, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                            <Text style={{ color: T.accent, fontSize: 11, fontWeight: '600' }}>Horário atual</Text>
                        </View>
                        ) : passado ? (
                        <Text style={{ color: T.placeholder, fontSize: 12, fontStyle: 'italic' }}>—</Text>
                        ) : (
                        <Text style={{ color: T.placeholder, fontSize: 12 }}>Disponível</Text>
                        )}
                    </View>
                    {!passado && !atual && (
                        <TouchableOpacity onPress={() => onBloquear(h)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: T.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: T.cardBorder }}>
                        <Ionicons name="lock-closed-outline" size={12} color={T.textSub} />
                        <Text style={{ color: T.textSub, fontSize: 11 }}>Bloquear</Text>
                        </TouchableOpacity>
                    )}
                    </View>
                ) : null}
                {agendadosHora.map(item => (
                    <View key={item.id} style={{ backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.accent, marginTop: 2, marginBottom: 6, overflow: 'hidden' }}>
                    <View style={{ height: 2, backgroundColor: T.accent }} />
                    <View style={{ padding: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: T.text, fontWeight: '700', fontSize: 14 }}>{item.nome_pessoa}</Text>
                        <Text style={{ color: T.accent, fontWeight: '700', fontSize: 12 }}>R$ {item.valor || '0'}</Text>
                        </View>
                        {item.nome_procedimento ? <Text style={{ color: T.textSub, fontSize: 12, marginTop: 2 }}>{item.nome_procedimento}</Text> : null}
                        <Text style={{ color: T.textSub, fontSize: 11, marginTop: 3 }}>{formatarData(item.horario_atendimento)}</Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                        <TouchableOpacity onPress={() => concluir(item)} style={{ flex: 1, backgroundColor: T.success, borderRadius: 8, paddingVertical: 7, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                            <Ionicons name="checkmark-circle-outline" size={13} color="#fff" />
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>Concluir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => cancelar(item)} style={{ flex: 1, borderRadius: 8, paddingVertical: 7, borderWidth: 1, borderColor: T.danger, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                            <Ionicons name="close-circle-outline" size={13} color={T.danger} />
                            <Text style={{ color: T.danger, fontWeight: '700', fontSize: 11 }}>Cancelar</Text>
                        </TouchableOpacity>
                        </View>
                    </View>
                    </View>
                ))}
                </View>
            </View>
            );
        })}
        </View>
    );
}