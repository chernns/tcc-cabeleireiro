import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, Switch,
  Dimensions, TouchableOpacity, Platform,
  StatusBar as RNStatusBar, ScrollView, Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './src/services/supabase';
import { buscarConflito } from './src/services/agenda';
import { DARK, LIGHT } from './src/theme';
import { trimestreAtual, labelTrimestre, rangeTrimestrre } from './src/utils/trimestre';
import { normalizarHorario } from './src/utils/horario';
import { formatarData, normalizarData } from './src/utils/datas';
import { EstadoVazio } from './src/components/EstadoVazio';
import { StatusOcupacao } from './src/components/StatusOcupacao';
import { AppointmentCard } from './src/components/AppointmentCard';
import { SectionLabel, StyledInput } from './src/components/FormFields';
import { ProximoAtendimento } from './src/components/ProximoAtendimento';
import { LinhaDeTempo } from './src/components/LinhaDeTempo';
import { CardRelatorio } from './src/components/CardRelatorio';
import { CalendarioCustom } from './src/components/CalendarioCustom';
import { BloqueioModal, ConfirmModal, ConcluirModal } from './src/components/Modais';
import { BloqueioLoteModal } from './src/components/BloqueioLoteModal';
import { EditModal } from './src/components/EditModal';
import { ConfigScreen } from './src/screens/ConfigScreen';
import { RelatorioScreen } from './src/screens/RelatorioScreen';


// ═════════════════════════════════════════════════════════════════════════════
// APP
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [tela, setTela] = useState('home');
  const [dark, setDark] = useState(false);
  const T = dark ? DARK : LIGHT;

  const [msgLembrete, setMsgLembrete] = useState('Olá {nome}! 😊\nPassando para lembrar do seu agendamento conosco.\nQualquer dúvida, é só chamar! ✂️');
  const [horaInicio, setHoraInicio]   = useState(7);
  const [horaFim, setHoraFim]         = useState(22);
  const [intervalo, setIntervalo]     = useState(30);

  const [agendaHome, setAgendaHome]     = useState({});
  const [agendaAgenda, setAgendaAgenda] = useState({});
  const [dataHome, setDataHome]         = useState('');
  const [dataAgenda, setDataAgenda]     = useState('');
  const [lista, setLista]               = useState([]);
  const [bloqueios, setBloqueios]       = useState([]);
  const [dadosGrafico, setDadosGrafico] = useState({ labels: [], values: [], total: 0, receitaTotal: 0 });
  const [relatorios, setRelatorios]     = useState([]);
  const [relatoriosTri, setRelatoriosTri] = useState([]); // ✅ trimestrais
  const [clientes, setClientes]         = useState([]);
  const [servicos, setServicos]         = useState([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [focusBusca, setFocusBusca]     = useState(false);
  const [abaRelatorio, setAbaRelatorio] = useState('mensal'); // ✅ 'mensal' | 'trimestral'

  const [nome, setNome] = useState(''), [horario, setHorario] = useState(''), [telefone, setTelefone] = useState('');
  const [valor, setValor] = useState(''), [corte, setCorte] = useState(''), [procedimento, setProcedimento] = useState('');
  const [duracao, setDuracao] = useState(''), [focused, setFocused] = useState('');

  const [itemParaCancelar, setItemParaCancelar]   = useState(null);
  const [itemParaConcluir, setItemParaConcluir]   = useState(null);
  const [reagendandoItem, setReagendandoItem]     = useState(null);
  const [modoAgenda, setModoAgenda]               = useState('timeline');
  const [bloqueioModal, setBloqueioModal]         = useState(null);
  const [bloqueioLoteModal, setBloqueioLoteModal] = useState(false);

  // ── Controle de geração automática ─────────────────────────────────────────
  // Guardamos "mes-ano" e "tri-ano" do último relatório gerado para não repetir
  const ultimoMesGerado = useRef('');
  const ultimoTriGerado = useRef('');

  useEffect(() => {
    AsyncStorage.getItem('tema').then(v => { if (v !== null) setDark(JSON.parse(v)); });
    AsyncStorage.getItem('msgLembrete').then(v => { if (v) setMsgLembrete(v); });
    AsyncStorage.getItem('horaInicio').then(v => { if (v !== null) setHoraInicio(Number(v)); });
    AsyncStorage.getItem('horaFim').then(v => { if (v !== null) setHoraFim(Number(v)); });
    AsyncStorage.getItem('intervalo').then(v => { if (v !== null) setIntervalo(Number(v)); });
    // Restaura última geração para não repetir após reiniciar o app
    AsyncStorage.getItem('ultimoMesGerado').then(v => { if (v) ultimoMesGerado.current = v; });
    AsyncStorage.getItem('ultimoTriGerado').then(v => { if (v) ultimoTriGerado.current = v; });
  }, []);
  useEffect(() => { AsyncStorage.setItem('tema', JSON.stringify(dark)); }, [dark]);
  useEffect(() => { AsyncStorage.setItem('msgLembrete', msgLembrete); }, [msgLembrete]);
  useEffect(() => { AsyncStorage.setItem('horaInicio', String(horaInicio)); }, [horaInicio]);
  useEffect(() => { AsyncStorage.setItem('horaFim', String(horaFim)); }, [horaFim]);
  useEffect(() => { AsyncStorage.setItem('intervalo', String(intervalo)); }, [intervalo]);

  // ── Funções de relatório ────────────────────────────────────────────────────

  // Gera / atualiza relatório mensal silenciosamente
  async function gerarRelatorioMensalAuto() {
    const agora    = new Date();
    const chave    = `${agora.getFullYear()}-${agora.getMonth()}`; // identificador único do mês
    if (ultimoMesGerado.current === chave) return; // já gerou neste mês nesta sessão

    const mesLabel  = agora.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
    const fimMes    = new Date(agora.getFullYear(), agora.getMonth()+1, 0, 23, 59, 59).toISOString();
    const { data: concluidos } = await supabase.from('Procedimentos').select('valor').eq('status','concluido').gte('horario_atendimento',inicioMes).lte('horario_atendimento',fimMes);
    const total = (concluidos||[]).reduce((acc,i) => acc+Number(i.valor||0), 0);
    const { data: existentes } = await supabase.from('Relatorios').select('id').eq('mes', mesLabel);
    const existente = existentes && existentes.length > 0 ? existentes[0] : null;
    if (existente) {
      await supabase.from('Relatorios').update({ total, criado_em: new Date().toISOString() }).eq('id', existente.id);
    } else {
      await supabase.from('Relatorios').insert([{ mes: mesLabel, total, criado_em: new Date().toISOString() }]);
    }
    ultimoMesGerado.current = chave;
    AsyncStorage.setItem('ultimoMesGerado', chave);
  }

  // Gera / atualiza relatório trimestral silenciosamente
  async function gerarRelatorioTrimestralAuto() {
    const { tri, ano } = trimestreAtual();
    const chave        = `${ano}-T${tri}`;
    if (ultimoTriGerado.current === chave) return;

    const label        = labelTrimestre(tri, ano);
    const { inicio, fim } = rangeTrimestrre(tri, ano);
    const { data: concluidos } = await supabase.from('Procedimentos').select('valor').eq('status','concluido').gte('horario_atendimento',inicio).lte('horario_atendimento',fim);
    const total = (concluidos||[]).reduce((acc,i) => acc+Number(i.valor||0), 0);
    const { data: existentes } = await supabase.from('Relatorio_Tri').select('id').eq('mes', label);
    const existente = existentes && existentes.length > 0 ? existentes[0] : null;
    if (existente) {
      await supabase.from('Relatorio_Tri').update({ total, criado_em: new Date().toISOString() }).eq('id', existente.id);
    } else {
      await supabase.from('Relatorio_Tri').insert([{ mes: label, total, criado_em: new Date().toISOString() }]);
    }
    ultimoTriGerado.current = chave;
    AsyncStorage.setItem('ultimoTriGerado', chave);
  }

  async function buscarRelatorios() {
    const { data: mensais }     = await supabase.from('Relatorios').select('*').order('criado_em', { ascending: false });
    const { data: trimestrais } = await supabase.from('Relatorio_Tri').select('*').order('criado_em', { ascending: false });
    setRelatorios(mensais || []);
    setRelatoriosTri(trimestrais || []);
  }

  async function buscar() {
    const { data: futuros }    = await supabase.from('Procedimentos').select('*').eq('status', 'pendente');
    const { data: concluidos } = await supabase.from('Procedimentos').select('*').eq('status', 'concluido');
    const { data: bloqueados } = await supabase.from('Procedimentos').select('*').eq('status', 'bloqueado');
    const pendentesOrdenados   = (futuros || []).sort((a, b) => new Date(a.horario_atendimento) - new Date(b.horario_atendimento));
    setLista(pendentesOrdenados);
    setBloqueios(bloqueados || []);
    const mapaServicos = {};
[...(futuros||[]), ...(concluidos||[])].forEach(i => {
  const s = (i.nome_procedimento || '').trim(); if (!s) return;
  const chave = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
  if (!mapaServicos[chave]) {
    const nomeBonito = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    mapaServicos[chave] = { nome: nomeBonito, count: 0, receita: 0 };
  }
  mapaServicos[chave].count++;
  if (i.status === 'concluido') mapaServicos[chave].receita += Number(i.valor || 0);
});
    setServicos(Object.values(mapaServicos).sort((a, b) => b.count - a.count).slice(0, 5));
    let mapa = {};
    (concluidos || []).forEach(i => {
      const d = new Date(i.horario_atendimento);
      const chave = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
      mapa[chave] = (mapa[chave] || 0) + Number(i.valor || 0);
    });
    const dias = Object.keys(mapa).sort((a, b) => { const [da,ma]=a.split('/').map(Number); const [db,mb]=b.split('/').map(Number); return ma!==mb?ma-mb:da-db; });
    const ultimos = dias.slice(-7);
    const receitaTotal = (concluidos||[]).reduce((acc,i) => acc + Number(i.valor||0), 0);
    setDadosGrafico({ labels: ultimos, values: ultimos.map(k => mapa[k]), total: (concluidos||[]).length, receitaTotal });
    const marcar = (arr, dataAtiva) => {
      let m = {}; (arr||[]).forEach(i => { const d=i.horario_atendimento.split('T')[0]; m[d]={marked:true,dotColor:T.accent}; });
      if (dataAtiva) m[dataAtiva]={...(m[dataAtiva]||{}),selected:true,selectedColor:T.accent}; return m;
    };
    setAgendaHome(marcar(futuros, dataHome)); setAgendaAgenda(marcar(futuros, dataAgenda));
    const todos = [...(futuros||[]), ...(concluidos||[])];
    const mapaClientes = {};
    todos.forEach(i => {
      const key = (i.nome_pessoa||'').toLowerCase().trim(); if (!key) return;
      if (!mapaClientes[key]) mapaClientes[key] = { nome: i.nome_pessoa, telefone: String(i.telefone||''), total: 0, atendimentos: 0, pendentes: 0, ultimoServico: '', ultimaData: '' };
      mapaClientes[key].atendimentos++; mapaClientes[key].total += Number(i.valor||0);
      if (i.status==='pendente') mapaClientes[key].pendentes++;
      if (i.nome_procedimento) mapaClientes[key].ultimoServico = i.nome_procedimento;
      const dt = i.horario_atendimento;
      if (!mapaClientes[key].ultimaData || dt > mapaClientes[key].ultimaData) { mapaClientes[key].ultimaData = dt; if (!mapaClientes[key].telefone && i.telefone) mapaClientes[key].telefone = String(i.telefone); }
    });
    setClientes(Object.values(mapaClientes).sort((a, b) => b.atendimentos - a.atendimentos));
    return bloqueados || [];
  }

  // ✅ Polling: busca dados + gera relatórios automaticamente a cada 5s
  useEffect(() => {
    async function tick() {
      await buscar();
      // Gera relatórios silenciosamente (só uma vez por período)
      await gerarRelatorioMensalAuto();
      await gerarRelatorioTrimestralAuto();
    }
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [dataHome, dataAgenda, dark]);

  // Carrega lista de relatórios ao entrar na aba
  useEffect(() => { if (tela === 'relatorio') buscarRelatorios(); }, [tela]);

  async function salvar(dadosExtras = null) {
    const n  = dadosExtras?.nome_pessoa || nome;
    const d  = dadosExtras?.horario_atendimento?.split(' ')[0] || dadosExtras?.horario_atendimento?.split('T')[0] || dataHome;
    const hBruto = dadosExtras ? (dadosExtras.horario_atendimento.split(' ')[1] || '') : horario;
    const h = normalizarHorario(hBruto);
    if (!n.trim()) { alert('Preencha o nome!'); return; }
    if (!d) { alert('Selecione uma data no calendário!'); return; }
    if (!h) { alert('Horário inválido. Use o formato HH:MM, por exemplo 14:30.'); return; }
    const dt = `${d} ${h}`;
    const conflito = await buscarConflito(dt);
    if (conflito?.erro) { alert('Não foi possível verificar a disponibilidade. Tente novamente.'); return; }
    if (conflito) {
      alert(conflito.status === 'bloqueado'
        ? 'Este horário está bloqueado.'
        : `Já existe um agendamento neste horário (${conflito.nome_pessoa}).`);
      return;
    }
    await supabase.from('Procedimentos').insert([{ nome_pessoa: n, tipo_corte: dadosExtras?.tipo_corte||corte, nome_procedimento: dadosExtras?.nome_procedimento||procedimento, carga_horaria: dadosExtras?.carga_horaria||duracao, horario_atendimento: dt, telefone: dadosExtras?.telefone||telefone, valor: dadosExtras?.valor||valor, status: 'pendente' }]);
    if (!dadosExtras) { setNome(''); setHorario(''); setTelefone(''); setValor(''); setCorte(''); setProcedimento(''); setDuracao(''); }
    buscar();
  }

  async function confirmarConclusao() {
    if (!itemParaConcluir) return;
    await supabase.from('Procedimentos').update({ status: 'concluido' }).eq('id', itemParaConcluir.id);
    setItemParaConcluir(null); buscar();
  }
  async function confirmarCancelamento() {
    if (!itemParaCancelar) return;
    await supabase.from('Procedimentos').delete().eq('id', itemParaCancelar.id);
    setItemParaCancelar(null); buscar();
  }
  function iniciarReagendamento() {
    const item = itemParaCancelar; setItemParaCancelar(null);
    setTimeout(() => setReagendandoItem(item), 300);
  }
  async function confirmarReagendamento(dados) {
    const dt = dados.horario_atendimento;
    const conflito = await buscarConflito(dt);
    if (conflito?.erro) { alert('Não foi possível verificar a disponibilidade. Tente novamente.'); return; }
    if (conflito && conflito.id !== reagendandoItem?.id) {
      alert(conflito.status === 'bloqueado' ? 'Este horário está bloqueado.' : `Já existe um agendamento neste horário (${conflito.nome_pessoa}).`);
      return;
    }
    if (reagendandoItem) await supabase.from('Procedimentos').delete().eq('id', reagendandoItem.id);
    await salvar(dados); setReagendandoItem(null); buscar();
  }
  async function confirmarBloqueio(motivo) {
    if (!bloqueioModal || !dataAgenda) return;
    const horaStr = String(bloqueioModal.hora).padStart(2, '0');
    const horario_atendimento = `${dataAgenda}T${horaStr}:00:00`;
    setBloqueioModal(null);
    const { data: inserido, error } = await supabase.from('Procedimentos').insert([{ nome_pessoa: 'Bloqueado', nome_procedimento: motivo || null, horario_atendimento, status: 'bloqueado' }]).select().single();
    if (error) { alert('Erro ao bloquear horário: ' + error.message); return; }
    if (inserido) { setBloqueios(prev => [...prev, inserido]); }
    else { const { data: bloqueados } = await supabase.from('Procedimentos').select('*').eq('status', 'bloqueado'); setBloqueios(bloqueados || []); }
  }
  async function desbloquear(item) {
    if (!item) return;
    setBloqueios(prev => prev.filter(b => b.id !== item.id));
    await supabase.from('Procedimentos').delete().eq('id', item.id);
  }
  async function confirmarBloqueioLote({ hora, motivo, datas }) {
    const horaStr   = String(hora).padStart(2, '0');
    const registros = datas.map(data => ({ nome_pessoa: 'Bloqueado', nome_procedimento: motivo || null, horario_atendimento: `${data}T${horaStr}:00:00`, status: 'bloqueado' }));
    const LOTE = 50;
    for (let i = 0; i < registros.length; i += LOTE) {
      const { error } = await supabase.from('Procedimentos').insert(registros.slice(i, i + LOTE));
      if (error) { alert('Erro ao bloquear em lote: ' + error.message); return; }
    }
    setBloqueioLoteModal(false);
    alert(`✅ ${datas.length} dia${datas.length !== 1 ? 's' : ''} bloqueado${datas.length !== 1 ? 's' : ''} às ${horaStr}:00!`);
    await buscar();
  }

  function abrirWhatsApp(cliente) {
    const tel = String(cliente.telefone || '').replace(/\D/g, '');
    if (!tel) { alert('Este cliente não tem telefone cadastrado.'); return; }
    const numero = tel.startsWith('55') ? tel : `55${tel}`;
    const msg = encodeURIComponent(msgLembrete.replace(/\{nome\}/g, cliente.nome));
    Linking.openURL(`https://wa.me/${numero}?text=${msg}`).catch(() => alert('Não foi possível abrir o WhatsApp.'));
  }


  const bloqueiosDoDia    = bloqueios.filter(b => normalizarData(b.horario_atendimento) === dataAgenda);
  const clientesFiltrados = buscaCliente.trim() ? clientes.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase().trim())) : clientes;

  // ── Card de relatório reutilizável ─────────────────────────────────────────
  

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar style={dark ? 'light' : 'dark'} backgroundColor={T.surface} />

      <ConcluirModal visible={!!itemParaConcluir} item={itemParaConcluir} T={T} onConfirm={confirmarConclusao} onCancel={() => setItemParaConcluir(null)} />
      <ConfirmModal  visible={!!itemParaCancelar} item={itemParaCancelar} T={T} onConfirm={confirmarCancelamento} onCancel={() => setItemParaCancelar(null)} onReagendar={iniciarReagendamento} />
      <EditModal     visible={!!reagendandoItem}  item={null} dadosCliente={reagendandoItem} T={T} dataInicial={dataAgenda || dataHome || new Date().toISOString().split('T')[0]} onSalvar={confirmarReagendamento} onFechar={() => setReagendandoItem(null)} />
      <BloqueioModal visible={!!bloqueioModal} hora={bloqueioModal?.hora} data={dataAgenda} T={T} onConfirm={confirmarBloqueio} onCancel={() => setBloqueioModal(null)} />
      <BloqueioLoteModal visible={bloqueioLoteModal} T={T} onFechar={() => setBloqueioLoteModal(false)} onConfirmar={confirmarBloqueioLote} />

      {/* NAVBAR */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0, paddingBottom: 14, paddingHorizontal: 10, backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.navBorder }}>
        {[
          { id: 'home',      icon: 'home',      label: 'Início'    },
          { id: 'agenda',    icon: 'calendar',  label: 'Agenda'    },
          { id: 'clientes',  icon: 'people',    label: 'Clientes'  },
          { id: 'relatorio', icon: 'bar-chart', label: 'Relatório' },
          { id: 'config',    icon: 'settings',  label: 'Config'    },
        ].map(tab => {
          const ativo = tela === tab.id;
          return (
            <TouchableOpacity key={tab.id} onPress={() => setTela(tab.id)} style={{ alignItems: 'center', gap: 4, paddingHorizontal: 8 }}>
              <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: ativo ? T.accentGlow : 'transparent', borderWidth: ativo ? 1 : 0, borderColor: ativo ? T.accentDim : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={tab.icon} size={21} color={ativo ? T.accent : T.textSub} />
              </View>
              <Text style={{ fontSize: 10, fontWeight: ativo ? '700' : '400', color: ativo ? T.accent : T.textSub, letterSpacing: 0.3 }}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* HOME */}
      {tela === 'home' && (
        <FlatList data={[{ key: 'home' }]} keyExtractor={i => i.key} contentContainerStyle={{ padding: 18 }} showsVerticalScrollIndicator indicatorStyle={dark ? 'white' : 'black'} renderItem={() => (
          <View>
            <View style={{ marginBottom: 18 }}>
              <Text style={{ color: T.textSub, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>Agendamentos</Text>
              <Text style={{ color: T.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>Novo Horário</Text>
            </View>
            <ProximoAtendimento lista={lista} T={T} formatarData={formatarData} />
            <View style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 4 }}>
              <CalendarioCustom markedDates={agendaHome} onDayPress={d => setDataHome(d.dateString)} selectedDate={dataHome} dark={dark} />
            </View>
            {dataHome ? <Text style={{ color: T.accent, fontSize: 12, textAlign: 'center', marginBottom: 6, letterSpacing: 1 }}>📅 {dataHome}</Text> : <Text style={{ color: T.placeholder, fontSize: 12, textAlign: 'center', marginBottom: 6 }}>Selecione uma data acima</Text>}
            <View style={{ backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.cardBorder, padding: 16, marginTop: 10 }}>
              <SectionLabel T={T}>Cliente</SectionLabel>
              <StyledInput id="nome" placeholder="Nome completo" value={nome} onChangeText={setNome} T={T} focused={focused} setFocused={setFocused} />
              <SectionLabel T={T}>Serviço</SectionLabel>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <StyledInput id="corte" placeholder="Tipo de corte" value={corte} onChangeText={setCorte} flex={1} T={T} focused={focused} setFocused={setFocused} />
                <StyledInput id="proc" placeholder="Procedimento" value={procedimento} onChangeText={setProcedimento} flex={1} T={T} focused={focused} setFocused={setFocused} />
              </View>
              <SectionLabel T={T}>Horário</SectionLabel>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <StyledInput id="dur" placeholder={`Duração (padrão: ${intervalo}min)`} value={duracao} onChangeText={setDuracao} flex={1} T={T} focused={focused} setFocused={setFocused} />
                <StyledInput id="hora" placeholder="14:00" value={horario} onChangeText={setHorario} flex={1} T={T} focused={focused} setFocused={setFocused} />
              </View>
              <SectionLabel T={T}>Contato & Valor</SectionLabel>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <StyledInput id="tel" placeholder="Telefone" value={telefone} onChangeText={setTelefone} flex={1} keyboardType="phone-pad" T={T} focused={focused} setFocused={setFocused} />
                <StyledInput id="val" placeholder="R$ 0,00" value={valor} onChangeText={setValor} flex={1} keyboardType="numeric" T={T} focused={focused} setFocused={setFocused} />
              </View>
              <TouchableOpacity onPress={() => salvar()} style={{ backgroundColor: T.accent, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 20, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 }}>Confirmar Agendamento</Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ color: T.text, fontSize: 17, fontWeight: '800' }}>Pendentes</Text>
                <View style={{ backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Text style={{ color: T.accent, fontSize: 12, fontWeight: '700' }}>{lista.length}</Text>
                </View>
              </View>
              {lista.length === 0 ? <EstadoVazio T={T} mensagem="Nenhum agendamento pendente ainda." /> : lista.map(item => <AppointmentCard key={item.id} item={item} T={T} dark={dark} concluir={setItemParaConcluir} cancelar={setItemParaCancelar} formatarData={formatarData} />)}
            </View>
          </View>
        )} />
      )}

      {/* AGENDA */}
      {tela === 'agenda' && (
        <ScrollView contentContainerStyle={{ padding: 18 }} showsVerticalScrollIndicator indicatorStyle={dark ? 'white' : 'black'}>
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: T.textSub, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>Calendário</Text>
            <Text style={{ color: T.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>Agenda</Text>
          </View>
          <TouchableOpacity onPress={() => setBloqueioLoteModal(true)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(192,57,43,0.10)', borderWidth: 1.5, borderColor: T.danger, borderRadius: 14, paddingVertical: 12, marginBottom: 14 }}>
            <Ionicons name="lock-closed-outline" size={18} color={T.danger} />
            <Text style={{ color: T.danger, fontWeight: '800', fontSize: 14 }}>Bloquear horário em vários dias</Text>
          </TouchableOpacity>
          <View style={{ borderRadius: 20, overflow: 'hidden' }}>
            <CalendarioCustom markedDates={agendaAgenda} onDayPress={d => setDataAgenda(d.dateString)} selectedDate={dataAgenda} dark={dark} />
          </View>
          {dataAgenda ? (
            <View style={{ marginTop: 16 }}>
              <StatusOcupacao agendamentos={lista.filter(i => normalizarData(i.horario_atendimento) === dataAgenda)} bloqueios={bloqueiosDoDia} horaInicio={horaInicio} horaFim={horaFim} T={T} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: T.textSub, fontSize: 13 }}>Agendamentos em <Text style={{ color: T.accent, fontWeight: '700' }}>{dataAgenda}</Text></Text>
                <View style={{ flexDirection: 'row', backgroundColor: T.surface, borderRadius: 10, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden' }}>
                  <TouchableOpacity onPress={() => setModoAgenda('timeline')} style={{ paddingHorizontal: 12, paddingVertical: 7, backgroundColor: modoAgenda === 'timeline' ? T.accentGlow : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="git-branch-outline" size={14} color={modoAgenda === 'timeline' ? T.accent : T.textSub} />
                    <Text style={{ fontSize: 12, color: modoAgenda === 'timeline' ? T.accent : T.textSub, fontWeight: modoAgenda === 'timeline' ? '700' : '400' }}>Linha</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setModoAgenda('lista')} style={{ paddingHorizontal: 12, paddingVertical: 7, backgroundColor: modoAgenda === 'lista' ? T.accentGlow : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="list-outline" size={14} color={modoAgenda === 'lista' ? T.accent : T.textSub} />
                    <Text style={{ fontSize: 12, color: modoAgenda === 'lista' ? T.accent : T.textSub, fontWeight: modoAgenda === 'lista' ? '700' : '400' }}>Lista</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {(() => {
                const doDia = lista.filter(i => normalizarData(i.horario_atendimento) === dataAgenda);
                if (modoAgenda === 'timeline') {
                  return <LinhaDeTempo agendamentos={doDia} bloqueios={bloqueiosDoDia} T={T} dark={dark} concluir={setItemParaConcluir} cancelar={setItemParaCancelar} formatarData={formatarData} dataSelecionada={dataAgenda} horaInicio={horaInicio} horaFim={horaFim} onBloquear={h => setBloqueioModal({ hora: h })} onDesbloquear={desbloquear} />;
                }
                return doDia.length === 0 ? <EstadoVazio T={T} mensagem={`Nenhum agendamento para ${dataAgenda}`} /> : doDia.map(item => <AppointmentCard key={item.id} item={item} T={T} dark={dark} concluir={setItemParaConcluir} cancelar={setItemParaCancelar} formatarData={formatarData} />);
              })()}
            </View>
          ) : <EstadoVazio T={T} mensagem="Selecione uma data no calendário para ver os agendamentos." />}
        </ScrollView>
      )}

      {/* CLIENTES */}
      {tela === 'clientes' && (
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
      )}

      {/* ── RELATÓRIO ── */}
      {tela === 'relatorio' && (
        <RelatorioScreen T={T} dark={dark} dadosGrafico={dadosGrafico} servicos={servicos}
          abaRelatorio={abaRelatorio} setAbaRelatorio={setAbaRelatorio} buscarRelatorios={buscarRelatorios}
          relatorios={relatorios} relatoriosTri={relatoriosTri} />
      )}

      {/* CONFIG */}
      {tela === 'config' && (
        <ConfigScreen T={T} dark={dark} setDark={setDark}
          horaInicio={horaInicio} setHoraInicio={setHoraInicio}
          horaFim={horaFim} setHoraFim={setHoraFim}
          intervalo={intervalo} setIntervalo={setIntervalo}
          msgLembrete={msgLembrete} setMsgLembrete={setMsgLembrete} />
      )}
    </View>
  );
}