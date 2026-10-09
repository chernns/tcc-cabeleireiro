import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform, StatusBar as RNStatusBar, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

//-------------------RAIZ-------------------//

import { DARK, LIGHT } from './src/theme';

//-----------------SERVICES-------------------//

import { supabase } from './src/services/supabase';
import { buscarConflito } from './src/services/agenda';
import { gravarAgendamento } from './src/services/agendamentos';
import { concluirProcedimento, removerProcedimento, inserirBloqueios } from './src/services/procedimentos';

//------------------UTILS-------------------//

import { trimestreAtual, labelTrimestre, limitesTrimestre } from './src/utils/trimestre';
import { normalizarData, dataLocal, limitesMes, proximoDia } from './src/utils/datas';
import { separarDatasBloqueio } from './src/utils/bloqueio';
import { normalizarHorario } from './src/utils/horario';
import { agruparServicos } from './src/utils/servicos';

//-----------------COMPONENTS--------------------//

import { BloqueioModal, ConfirmModal, ConcluirModal } from './src/components/Modais';
import { BloqueioLoteModal } from './src/components/BloqueioLoteModal';
import { EditModal } from './src/components/EditModal';

//-------------------screens---------------------//

import { RelatorioScreen } from './src/screens/RelatorioScreen';
import { ClientesScreen } from './src/screens/ClientesScreen';
import { ConfigScreen } from './src/screens/ConfigScreen';
import { AgendaScreen } from './src/screens/AgendaScreen';
import { HomeScreen } from './src/screens/HomeScreen';



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
  const [focused, setFocused] = useState('');

  const [itemParaCancelar, setItemParaCancelar]   = useState(null);
  const [itemParaConcluir, setItemParaConcluir]   = useState(null);
  const [reagendandoItem, setReagendandoItem]     = useState(null);
  const [modoAgenda, setModoAgenda]               = useState('timeline');
  const [bloqueioModal, setBloqueioModal]         = useState(null);
  const [bloqueioLoteModal, setBloqueioLoteModal] = useState(false);

  // ── Controle de geração automática ─────────────────────────────────────────
  // Guardamos "mes-ano" e "tri-ano" do último relatório gerado para não repetir

  useEffect(() => {
    AsyncStorage.getItem('tema').then(v => { if (v !== null) setDark(JSON.parse(v)); });
    AsyncStorage.getItem('msgLembrete').then(v => { if (v) setMsgLembrete(v); });
    AsyncStorage.getItem('horaInicio').then(v => { if (v !== null) setHoraInicio(Number(v)); });
    AsyncStorage.getItem('horaFim').then(v => { if (v !== null) setHoraFim(Number(v)); });
    AsyncStorage.getItem('intervalo').then(v => { if (v !== null) setIntervalo(Math.max(15, Number(v))); });
    // Restaura última geração para não repetir após reiniciar o app

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
    const mesLabel = agora.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    const { inicio, fim } = limitesMes(agora.getFullYear(), agora.getMonth());

    const { data: concluidos, error: e1 } = await supabase.from('Procedimentos').select('valor')
      .eq('status','concluido').gte('horario_atendimento', inicio).lt('horario_atendimento', fim);
    if (e1) { console.log('Relatório mensal (busca):', e1.message); return; }

    const total = (concluidos||[]).reduce((acc,i) => acc+Number(i.valor||0), 0);
    const { data: existentes, error: e2 } = await supabase.from('Relatorios').select('id,total').eq('mes', mesLabel);
    if (e2) { console.log('Relatório mensal (consulta):', e2.message); return; }

    const existente = existentes && existentes[0];
    if (existente && Number(existente.total) === total) return;

    const { error: e3 } = existente
      ? await supabase.from('Relatorios').update({ total, criado_em: new Date().toISOString() }).eq('id', existente.id)
      : await supabase.from('Relatorios').insert([{ mes: mesLabel, total, criado_em: new Date().toISOString() }]);
    if (e3) console.log('Relatório mensal (gravação):', e3.message);
  }

  // Gera / atualiza relatório trimestral silenciosamente
  async function gerarRelatorioTrimestralAuto() {
    const { tri, ano } = trimestreAtual();
    const label = labelTrimestre(tri, ano);
    const { inicio, fim } = limitesTrimestre(tri, ano);

    const { data: concluidos, error: e1 } = await supabase.from('Procedimentos').select('valor')
      .eq('status','concluido').gte('horario_atendimento', inicio).lt('horario_atendimento', fim);
    if (e1) { console.log('Relatório trimestral (busca):', e1.message); return; }

    const total = (concluidos||[]).reduce((acc,i) => acc+Number(i.valor||0), 0);
    const { data: existentes, error: e2 } = await supabase.from('Relatorio_Tri').select('id,total').eq('mes', label);
    if (e2) { console.log('Relatório trimestral (consulta):', e2.message); return; }

    const existente = existentes && existentes[0];
    if (existente && Number(existente.total) === total) return;

    const { error: e3 } = existente
      ? await supabase.from('Relatorio_Tri').update({ total, criado_em: new Date().toISOString() }).eq('id', existente.id)
      : await supabase.from('Relatorio_Tri').insert([{ mes: label, total, criado_em: new Date().toISOString() }]);
    if (e3) console.log('Relatório trimestral (gravação):', e3.message);
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
    setServicos(agruparServicos([...(futuros||[]), ...(concluidos||[])]));
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
      let m = {}; (arr||[]).forEach(i => { const d=normalizarData(i.horario_atendimento); m[d]={marked:true,dotColor:T.accent}; });
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

  async function salvar(dadosExtras = null, ignorarId = null) {
    const n  = dadosExtras?.nome_pessoa || nome;
    const d  = dadosExtras?.horario_atendimento?.split(' ')[0] || dadosExtras?.horario_atendimento?.split('T')[0] || dataHome;
    const hBruto = dadosExtras ? (dadosExtras.horario_atendimento.split(' ')[1] || '') : horario;
    const h = normalizarHorario(hBruto);
    if (!n.trim()) { alert('Preencha o nome!'); return false; }
    if (!d) { alert('Selecione uma data no calendário!'); return false; }
    if (!h) { alert(dadosExtras ? 'Horário inválido. Use o formato HH:MM, por exemplo 14:30.' : 'Selecione um horário.'); return false; }
    const dt = `${d} ${h}`;
  
    const conflito = await buscarConflito(dt);
    if (conflito?.erro) { alert('Não foi possível verificar a disponibilidade. Tente novamente.'); return false; }
    if (conflito && conflito.id !== ignorarId) {
      alert(conflito.status === 'bloqueado'
        ? 'Este horário está bloqueado.'
        : `Já existe um agendamento neste horário (${conflito.nome_pessoa}).`);
      return false;
    }

    const resultado = await gravarAgendamento(supabase, {
      nome_pessoa: n,
      tipo_corte: dadosExtras?.tipo_corte || corte,
      nome_procedimento: dadosExtras?.nome_procedimento || procedimento,
      horario_atendimento: dt,
      telefone: dadosExtras?.telefone ?? telefone,
      valor: dadosExtras?.valor ?? valor,
    });
    if (!resultado.ok) { alert('Erro ao salvar o agendamento: ' + resultado.erro); return false; }

    if (!dadosExtras) { setNome(''); setHorario(''); setTelefone(''); setValor(''); setCorte(''); setProcedimento(''); }
    buscar();
    return true;
  }

  async function confirmarConclusao() {
    if (!itemParaConcluir) return;
    const r = await concluirProcedimento(supabase, itemParaConcluir.id);
    if (!r.ok) { alert('Não foi possível concluir o atendimento: ' + r.erro); return; }
    setItemParaConcluir(null);
    buscar();
  }

  async function confirmarCancelamento() {
    if (!itemParaCancelar) return;
    const r = await removerProcedimento(supabase, itemParaCancelar.id);
    if (!r.ok) { alert('Não foi possível cancelar o agendamento: ' + r.erro); return; }
    setItemParaCancelar(null);
    buscar();
  }
  function iniciarReagendamento() {
    const item = itemParaCancelar; setItemParaCancelar(null);
    setTimeout(() => setReagendandoItem(item), 300);
  }
  async function confirmarReagendamento(dados) {
    const ok = await salvar(dados, reagendandoItem?.id);
    if (!ok) return;
    if (reagendandoItem) {
      const r = await removerProcedimento(supabase, reagendandoItem.id);
      if (!r.ok) alert('O novo horário foi salvo, mas não foi possível remover o antigo: ' + r.erro);
    }
    setReagendandoItem(null);
    buscar();
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
    const r = await removerProcedimento(supabase, item.id);
    if (!r.ok) { alert('Não foi possível desbloquear o horário: ' + r.erro); return; }
    setBloqueios(prev => prev.filter(b => b.id !== item.id));
  }
  async function confirmarBloqueioLote({ hora, motivo, datas }) {
    const horaStr   = String(hora).padStart(2, '0');
    const ordenadas = [...datas].sort();

    // Busca o que já existe no período para não bloquear sobre atendimentos
    const { data: existentes, error } = await supabase
      .from('Procedimentos')
      .select('status, horario_atendimento')
      .in('status', ['pendente', 'bloqueado'])
      .gte('horario_atendimento', ordenadas[0])
      .lt('horario_atendimento', proximoDia(ordenadas[ordenadas.length - 1]));
    if (error) { alert('Não foi possível verificar os horários: ' + error.message); return; }

    const { livres, ignoradas } = separarDatasBloqueio(ordenadas, hora, existentes);
    if (livres.length === 0) {
      alert(`Nenhum dia foi bloqueado: todos já têm atendimento ou bloqueio às ${horaStr}:00.`);
      return;
    }

    const registros = livres.map(data => ({
      nome_pessoa: 'Bloqueado', nome_procedimento: motivo || null,
      horario_atendimento: `${data}T${horaStr}:00:00`, status: 'bloqueado',
    }));
    const r = await inserirBloqueios(supabase, registros);
    if (!r.ok) {
      alert('Erro ao bloquear em lote: ' + r.erro + '\nAlguns dias podem ter sido bloqueados. Repita a operação: dias já bloqueados são ignorados.');
      await buscar();
      return;
    }

    setBloqueioLoteModal(false);
    let msg = `✅ ${livres.length} dia${livres.length !== 1 ? 's' : ''} bloqueado${livres.length !== 1 ? 's' : ''} às ${horaStr}:00.`;
    if (ignoradas.length > 0) {
      const lista5 = ignoradas.slice(0, 5).join(', ') + (ignoradas.length > 5 ? '…' : '');
      msg += `\n${ignoradas.length} ignorado${ignoradas.length !== 1 ? 's' : ''} (já tinham atendimento ou bloqueio): ${lista5}`;
    }
    alert(msg);
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
  const form = {
    nome, setNome, corte, setCorte, procedimento, setProcedimento,
    horario, setHorario, telefone, setTelefone,
    valor, setValor, focused, setFocused,
  };

  // ── Card de relatório reutilizável ─────────────────────────────────────────
  

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar style={dark ? 'light' : 'dark'} backgroundColor={T.surface} />

      <ConcluirModal visible={!!itemParaConcluir} item={itemParaConcluir} T={T} onConfirm={confirmarConclusao} onCancel={() => setItemParaConcluir(null)} />
      <ConfirmModal  visible={!!itemParaCancelar} item={itemParaCancelar} T={T} onConfirm={confirmarCancelamento} onCancel={() => setItemParaCancelar(null)} onReagendar={iniciarReagendamento} />
      <EditModal visible={!!reagendandoItem} item={null} dadosCliente={reagendandoItem} T={T}
      dataInicial={dataAgenda || dataHome || dataLocal()}
      lista={lista} bloqueios={bloqueios} horaInicio={horaInicio} horaFim={horaFim} intervalo={intervalo}
      onSalvar={confirmarReagendamento} onFechar={() => setReagendandoItem(null)} />
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
        <HomeScreen T={T} dark={dark} lista={lista} bloqueios={bloqueios} agendaHome={agendaHome}
          dataHome={dataHome} setDataHome={setDataHome}
          form={form} intervalo={intervalo} horaInicio={horaInicio} horaFim={horaFim} salvar={salvar}
          setItemParaConcluir={setItemParaConcluir} setItemParaCancelar={setItemParaCancelar} />
      )}

      {tela === 'agenda' && (
        <AgendaScreen T={T} dark={dark} lista={lista} agendaAgenda={agendaAgenda}
          dataAgenda={dataAgenda} setDataAgenda={setDataAgenda}
          bloqueiosDoDia={bloqueiosDoDia} horaInicio={horaInicio} horaFim={horaFim}
          modoAgenda={modoAgenda} setModoAgenda={setModoAgenda}
          setBloqueioLoteModal={setBloqueioLoteModal} setBloqueioModal={setBloqueioModal}
          desbloquear={desbloquear}
          setItemParaConcluir={setItemParaConcluir} setItemParaCancelar={setItemParaCancelar} />
      )}

      {tela === 'clientes' && (
        <ClientesScreen T={T} dark={dark} clientes={clientes} clientesFiltrados={clientesFiltrados}
          buscaCliente={buscaCliente} setBuscaCliente={setBuscaCliente}
          focusBusca={focusBusca} setFocusBusca={setFocusBusca} abrirWhatsApp={abrirWhatsApp} />
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