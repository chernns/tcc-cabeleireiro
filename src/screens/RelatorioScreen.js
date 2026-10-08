import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

//---------------components------------------//

import { EstadoVazio } from '../components/EstadoVazio';
import { CardRelatorio } from '../components/CardRelatorio';

export function RelatorioScreen({
    T, dark, dadosGrafico, servicos,
    abaRelatorio, setAbaRelatorio, buscarRelatorios,
    relatorios, relatoriosTri,
}) {
    return (
        <ScrollView contentContainerStyle={{ padding: 18 }} showsVerticalScrollIndicator indicatorStyle={dark ? 'white' : 'black'}>
            <View style={{ marginBottom: 18 }}>
                <Text style={{ color: T.textSub, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>Financeiro</Text>
                <Text style={{ color: T.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>Relatório</Text>
            </View>

            {/* Cards de resumo */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <View style={{ flex: 1, backgroundColor: T.surface, borderRadius: 14, borderWidth: 1, borderColor: T.cardBorder, padding: 14 }}>
                <Text style={{ color: T.textSub, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Concluídos</Text>
                <Text style={{ color: T.accent, fontSize: 28, fontWeight: '800' }}>{dadosGrafico.total}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: T.surface, borderRadius: 14, borderWidth: 1, borderColor: T.cardBorder, padding: 14 }}>
                <Text style={{ color: T.textSub, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Receita Total</Text>
                <Text style={{ color: T.accent, fontSize: 22, fontWeight: '800' }}>R$ {dadosGrafico.receitaTotal.toFixed(2)}</Text>
                </View>
            </View>

            {/* Gráfico */}
            <View style={{ backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.cardBorder, padding: 16, overflow: 'hidden', marginBottom: 20 }}>
                <Text style={{ color: T.textSub, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Receita por Dia</Text>
                <LineChart data={{ labels: dadosGrafico.labels.length ? dadosGrafico.labels : ['--'], datasets: [{ data: dadosGrafico.values.length ? dadosGrafico.values : [0] }] }} width={Dimensions.get('window').width - 68} height={200} withDots withShadow={false} chartConfig={{ backgroundColor: T.surface, backgroundGradientFrom: T.surface, backgroundGradientTo: T.surface, decimalPlaces: 0, color: (opacity=1) => `rgba(201,168,76,${opacity})`, labelColor: () => T.textSub, propsForDots: { r: '5', strokeWidth: '2', stroke: T.accent }, propsForBackgroundLines: { stroke: T.cardBorder } }} bezier style={{ borderRadius: 8, marginLeft: -10 }} />
            </View>

            {/* Serviços populares */}
            {servicos.length > 0 && (
                <View style={{ backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.cardBorder, padding: 16, marginBottom: 20 }}>
                <Text style={{ color: T.textSub, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Serviços Mais Populares</Text>
                {servicos.map((s, idx) => {
                    const pct = servicos[0].count > 0 ? (s.count / servicos[0].count) * 100 : 0;
                    return (
                    <View key={idx} style={{ marginBottom: idx < servicos.length - 1 ? 14 : 0 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: T.accent, fontSize: 10, fontWeight: '800' }}>{idx + 1}</Text>
                            </View>
                            <Text style={{ color: T.text, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>{s.nome}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ color: T.textSub, fontSize: 12 }}>{s.count}x</Text>
                            {s.receita > 0 && <Text style={{ color: T.accent, fontSize: 12, fontWeight: '700' }}>R$ {s.receita.toFixed(0)}</Text>}
                        </View>
                        </View>
                        <View style={{ height: 5, backgroundColor: T.cardBorder, borderRadius: 3, overflow: 'hidden' }}>
                        <View style={{ height: 5, width: `${pct}%`, backgroundColor: idx === 0 ? T.accent : T.accentDim, borderRadius: 3 }} />
                        </View>
                    </View>
                    );
                })}
                </View>
            )}

            {/*  Banner automático */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: T.accentGlow, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: T.accentDim, marginBottom: 16 }}>
                <Ionicons name="sync-outline" size={16} color={T.accent} />
                <Text style={{ color: T.accent, fontSize: 12, fontWeight: '600', flex: 1 }}>
                Relatórios atualizados automaticamente a cada 5 segundos — sem precisar apertar nada.
                </Text>
            </View>

            {/*  Tabs mensal / trimestral */}
            <View style={{ flexDirection: 'row', backgroundColor: T.surface, borderRadius: 12, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden', marginBottom: 14 }}>
                {[{ id: 'mensal', label: 'Mensal', icon: 'calendar-outline' }, { id: 'trimestral', label: 'Trimestral', icon: 'layers-outline' }].map(t => {
                const ativo = abaRelatorio === t.id;
                return (
                    <TouchableOpacity key={t.id} onPress={() => { setAbaRelatorio(t.id); buscarRelatorios(); }} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: ativo ? T.accentGlow : 'transparent', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                    <Ionicons name={t.icon} size={16} color={ativo ? T.accent : T.textSub} />
                    <Text style={{ color: ativo ? T.accent : T.textSub, fontWeight: ativo ? '800' : '400', fontSize: 13 }}>{t.label}</Text>
                    </TouchableOpacity>
                );
                })}
            </View>

            {/* Lista de relatórios conforme aba */}
            {abaRelatorio === 'mensal' ? (
                relatorios.length === 0
                ? <EstadoVazio T={T} mensagem="Nenhum relatório mensal ainda. Aguarde o próximo ciclo automático." icone="bar-chart-outline" />
                : relatorios.map(r => <CardRelatorio key={r.id} r={r} T={T} />)
            ) : (
                relatoriosTri.length === 0
                ? <EstadoVazio T={T} mensagem="Nenhum relatório trimestral ainda. Aguarde o próximo ciclo automático." icone="layers-outline" />
                : relatoriosTri.map(r => <CardRelatorio key={r.id} r={r} T={T} />)
            )}
        </ScrollView>
    );
}