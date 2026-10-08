import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

//---------------components------------------//

import { EstadoVazio } from '../components/EstadoVazio';

export function ClientesScreen({
    T, dark, clientes, clientesFiltrados,
    buscaCliente, setBuscaCliente, focusBusca, setFocusBusca, abrirWhatsApp,
}) {
    return (
        <ScrollView contentContainerStyle={{ padding: 18 }} showsVerticalScrollIndicator indicatorStyle={dark ? 'white' : 'black'}>
            <View style={{ marginBottom: 14 }}>
                <Text style={{ color: T.textSub, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>Base de dados</Text>
                <Text style={{ color: T.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>Clientes</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.input, borderRadius: 14, borderWidth: 1, borderColor: focusBusca ? T.accent : T.inputBorder, paddingHorizontal: 14, marginBottom: 16, gap: 10 }}>
                <Ionicons name="search-outline" size={18} color={buscaCliente ? T.accent : T.placeholder} />
                <TextInput value={buscaCliente} onChangeText={setBuscaCliente} placeholder="Buscar cliente pelo nome..." placeholderTextColor={T.placeholder} onFocus={() => setFocusBusca(true)} onBlur={() => setFocusBusca(false)} style={{ flex: 1, color: T.text, fontSize: 15, paddingVertical: 13 }} />
                {buscaCliente.length > 0 && <TouchableOpacity onPress={() => setBuscaCliente('')}><Ionicons name="close-circle" size={18} color={T.placeholder} /></TouchableOpacity>}
            </View>
            {!buscaCliente && (
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <View style={{ flex: 1, backgroundColor: T.surface, borderRadius: 14, borderWidth: 1, borderColor: T.cardBorder, padding: 14 }}>
                    <Text style={{ color: T.textSub, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Clientes</Text>
                    <Text style={{ color: T.accent, fontSize: 28, fontWeight: '800' }}>{clientes.length}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: T.surface, borderRadius: 14, borderWidth: 1, borderColor: T.cardBorder, padding: 14 }}>
                    <Text style={{ color: T.textSub, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Atendimentos</Text>
                    <Text style={{ color: T.accent, fontSize: 28, fontWeight: '800' }}>{clientes.reduce((a, c) => a + c.atendimentos, 0)}</Text>
                </View>
                </View>
            )}
            {buscaCliente.trim().length > 0 && <Text style={{ color: T.textSub, fontSize: 13, marginBottom: 12 }}>{clientesFiltrados.length} resultado{clientesFiltrados.length !== 1 ? 's' : ''} para <Text style={{ color: T.accent, fontWeight: '700' }}>"{buscaCliente}"</Text></Text>}
            {clientesFiltrados.length === 0 ? <EstadoVazio T={T} mensagem={buscaCliente ? `Nenhum cliente encontrado para "${buscaCliente}"` : 'Nenhum cliente encontrado ainda.'} icone="people-outline" /> : clientesFiltrados.map((cliente, idx) => (
                <View key={idx} style={{ backgroundColor: T.card, borderRadius: 16, borderWidth: 1, borderColor: T.cardBorder, marginBottom: 12, overflow: 'hidden' }}>
                <View style={{ height: 3, backgroundColor: T.accent }} />
                <View style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: T.accent, fontSize: 18, fontWeight: '800' }}>{(cliente.nome || '?')[0].toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                        <Text style={{ color: T.text, fontSize: 16, fontWeight: '700' }}>{cliente.nome}</Text>
                        {cliente.telefone ? <Text style={{ color: T.textSub, fontSize: 12, marginTop: 2 }}>{cliente.telefone}</Text> : <Text style={{ color: T.placeholder, fontSize: 12, marginTop: 2, fontStyle: 'italic' }}>Sem telefone</Text>}
                        </View>
                    </View>
                    <View style={{ backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 8 }}>
                        <Text style={{ color: T.accent, fontWeight: '800', fontSize: 13 }}>R$ {cliente.total.toFixed(0)}</Text>
                    </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <View style={{ flex: 1, backgroundColor: dark ? '#111' : '#F8F5F0', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                        <Text style={{ color: T.accent, fontSize: 20, fontWeight: '800' }}>{cliente.atendimentos}</Text>
                        <Text style={{ color: T.textSub, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>Visitas</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: dark ? '#111' : '#F8F5F0', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                        <Text style={{ color: cliente.pendentes > 0 ? T.success : T.textSub, fontSize: 20, fontWeight: '800' }}>{cliente.pendentes}</Text>
                        <Text style={{ color: T.textSub, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>Pendentes</Text>
                    </View>
                    <View style={{ flex: 2, backgroundColor: dark ? '#111' : '#F8F5F0', borderRadius: 10, padding: 10 }}>
                        <Text style={{ color: T.textSub, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Último serviço</Text>
                        <Text style={{ color: T.text, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{cliente.ultimoServico || '—'}</Text>
                    </View>
                    </View>
                    <TouchableOpacity onPress={() => abrirWhatsApp(cliente)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#25D366', borderRadius: 12, paddingVertical: 11 }}>
                    <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Enviar Lembrete por WhatsApp</Text>
                    </TouchableOpacity>
                </View>
                </View>
            ))}
        </ScrollView>
    );
}