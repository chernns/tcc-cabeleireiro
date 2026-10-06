import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, Switch,
  Dimensions, TouchableOpacity, Platform,
  StatusBar as RNStatusBar, ScrollView, Modal, Linking, ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createClient } from '@supabase/supabase-js';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

const DARK = {
  bg: '#0A0A0A', surface: '#141414', card: '#1A1A1A', cardBorder: '#2A2A2A',
  input: '#1E1E1E', inputBorder: '#303030', text: '#F0EDE8', textSub: '#7A7570',
  placeholder: '#4A4642', accent: '#C9A84C', accentDim: '#8A6E2E',
  accentGlow: 'rgba(201,168,76,0.15)', danger: '#C0392B', success: '#27AE60',
  navBorder: '#1F1F1F', overlay: 'rgba(0,0,0,0.75)', modalBg: '#1A1A1A',
  modalBorder: '#2A2A2A', emptyBg: '#141414', timelineBg: '#111111',
};
const LIGHT = {
  bg: '#F4F1EC', surface: '#FFFFFF', card: '#FFFFFF', cardBorder: '#E8E3DA',
  input: '#FFFFFF', inputBorder: '#D8D2C8', text: '#1A1714', textSub: '#8A8278',
  placeholder: '#B8B2A8', accent: '#9A6E1A', accentDim: '#C49A3C',
  accentGlow: 'rgba(154,110,26,0.10)', danger: '#C0392B', success: '#27AE60',
  navBorder: '#E8E3DA', overlay: 'rgba(0,0,0,0.50)', modalBg: '#FFFFFF',
  modalBorder: '#E8E3DA', emptyBg: '#F4F1EC', timelineBg: '#F0EDE8',
};

const DIAS_SEMANA     = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const DIAS_SEMANA_EXT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// ── Helpers de trimestre ──────────────────────────────────────────────────────
function trimestreAtual() {
  const agora = new Date();
  const tri   = Math.floor(agora.getMonth() / 3) + 1; // 1..4
  const ano   = agora.getFullYear();
  return { tri, ano };
}
function labelTrimestre(tri, ano) {
  const nomes = { 1: '1º Trimestre', 2: '2º Trimestre', 3: '3º Trimestre', 4: '4º Trimestre' };
  return `${nomes[tri]} ${ano}`;
}
function rangeTrimestrre(tri, ano) {
  const mesInicio = (tri - 1) * 3;          // 0, 3, 6, 9
  const mesFim    = mesInicio + 2;           // 2, 5, 8, 11
  const inicio    = new Date(ano, mesInicio, 1).toISOString();
  const fim       = new Date(ano, mesFim + 1, 0, 23, 59, 59).toISOString();
  return { inicio, fim };
}
// Aceita "14:30", "9:05", "9:5"... e devolve "HH:MM". Retorna null se inválido.
function normalizarHorario(texto) {
  const m = String(texto || '').trim().match(/^([01]?\d|2[0-3]):([0-5]?\d)$/);
  if (!m) return null;
  return `${m[1].padStart(2, '0')}:${m[2].padStart(2, '0')}`;
}
// Retorna o registro que conflita com o horário, ou null se estiver livre.
async function buscarConflito(dataHora) {
  const [data, hora] = dataHora.split(' ');
  const horaCheia = hora.split(':')[0];
  const { data: registros, error } = await supabase
    .from('Procedimentos')
    .select('id, nome_pessoa, status, horario_atendimento')
    .in('status', ['pendente', 'bloqueado'])
    .like('horario_atendimento', `${data}%`);
  if (error) return { erro: true };
  return (registros || []).find(r => {
    const h = r.horario_atendimento.replace('T', ' ').split(' ')[1] || '';
    return h.split(':')[0] === horaCheia;
  }) || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Calendário customizado
// ─────────────────────────────────────────────────────────────────────────────
function CalendarioCustom({ markedDates = {}, onDayPress, selectedDate, selectedDates, multiSelect = false, dark }) {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());

  const C = {
    bg: dark ? '#111111' : '#1C1C1E', header: dark ? '#1A1A1A' : '#242426',
    cell: dark ? '#1E1E1E' : '#2C2C2E', cellBorder: dark ? '#2A2A2A' : '#3A3A3C',
    today: dark ? '#2A2000' : '#2E2200', todayBorder: '#C9A84C',
    selected: '#C9A84C', multiSel: 'rgba(201,168,76,0.30)', multiSelBorder: '#C9A84C',
    marked: '#C9A84C', past: dark ? '#161616' : '#232323', pastBorder: dark ? '#202020' : '#2A2A2A',
    text: '#F0EDE8', textSub: '#7A7570', textDisabled: '#3A3535', arrow: '#C9A84C',
  };

  function diasNoMes(a, m) { return new Date(a, m + 1, 0).getDate(); }
  function primeiroDiaSemana(a, m) { return new Date(a, m, 1).getDay(); }
  function mesAnterior() {
    if (ano === hoje.getFullYear() && mes === hoje.getMonth()) return;
    if (mes === 0) { setMes(11); setAno(a => a - 1); } else setMes(m => m - 1);
  }
  function proximoMes() {
    if (mes === 11) { setMes(0); setAno(a => a + 1); } else setMes(m => m + 1);
  }
  const totalDias = diasNoMes(ano, mes), offset = primeiroDiaSemana(ano, mes);
  const totalCelulas = Math.ceil((offset + totalDias) / 7) * 7;
  function pad(n) { return String(n).padStart(2, '0'); }
  function dateStr(d) { return `${ano}-${pad(mes + 1)}-${pad(d)}`; }
  const hojeStr = `${hoje.getFullYear()}-${pad(hoje.getMonth()+1)}-${pad(hoje.getDate())}`;
  function ehPassado(ds) { return ds < hojeStr; }
  const podeVoltarMes = !(ano === hoje.getFullYear() && mes === hoje.getMonth());

  return (
    <View style={{ backgroundColor: C.bg, borderRadius: 20, overflow: 'hidden' }}>
      <View style={{ backgroundColor: C.header, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={mesAnterior} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: podeVoltarMes ? C.cell : 'transparent', borderWidth: 1, borderColor: podeVoltarMes ? C.cellBorder : 'transparent', alignItems: 'center', justifyContent: 'center', opacity: podeVoltarMes ? 1 : 0.2 }}>
          <Ionicons name="chevron-back" size={18} color={C.arrow} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: C.text, fontSize: 17, fontWeight: '800', letterSpacing: 0.3 }}>{MESES[mes]}</Text>
          <Text style={{ color: C.textSub, fontSize: 12, marginTop: 1 }}>{ano}</Text>
        </View>
        <TouchableOpacity onPress={proximoMes} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.cell, borderWidth: 1, borderColor: C.cellBorder, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-forward" size={18} color={C.arrow} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.bg }}>
        {DIAS_SEMANA.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: i === 0 || i === 6 ? '#C9A84C' : C.textSub, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>{d}</Text>
          </View>
        ))}
      </View>
      <View style={{ paddingHorizontal: 12, paddingBottom: 16 }}>
        {Array.from({ length: totalCelulas / 7 }, (_, semana) => (
          <View key={semana} style={{ flexDirection: 'row', marginBottom: 6 }}>
            {Array.from({ length: 7 }, (_, col) => {
              const idx = semana * 7 + col, dia = idx - offset + 1;
              const valido = dia >= 1 && dia <= totalDias;
              const ds = valido ? dateStr(dia) : '';
              const passado = valido && ehPassado(ds), ehHoje = ds === hojeStr;
              const ehSel = multiSelect ? (selectedDates instanceof Set && selectedDates.has(ds)) : ds === selectedDate;
              const temMarca = valido && !!markedDates[ds], fimSemana = col === 0 || col === 6;
              const clicavel = valido && !passado;
              return (
                <TouchableOpacity key={col} onPress={() => clicavel && onDayPress && onDayPress({ dateString: ds })} activeOpacity={clicavel ? 0.7 : 1} style={{ flex: 1, alignItems: 'center', paddingVertical: 2 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: ehSel ? (multiSelect ? C.multiSel : C.selected) : ehHoje ? C.today : passado ? C.past : valido ? C.cell : 'transparent',
                    borderWidth: ehSel ? 1.5 : ehHoje ? 1.5 : valido ? 1 : 0,
                    borderColor: ehSel ? (multiSelect ? C.multiSelBorder : 'transparent') : ehHoje ? C.todayBorder : passado ? C.pastBorder : C.cellBorder,
                  }}>
                    {ehSel && multiSelect ? <Ionicons name="checkmark" size={16} color="#C9A84C" /> : (
                      <Text style={{ fontSize: 14, fontWeight: ehSel || ehHoje ? '800' : fimSemana && !passado ? '600' : '400',
                        color: ehSel && !multiSelect ? '#1A1714' : passado ? C.textDisabled : !valido ? 'transparent' : fimSemana ? '#C9A84C' : C.text,
                      }}>{valido ? dia : ''}</Text>
                    )}
                  </View>
                  <View style={{ width: 4, height: 4, borderRadius: 2, marginTop: 2, backgroundColor: (temMarca && !ehSel) ? C.marked : 'transparent' }} />
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal de bloqueio em lote
// ─────────────────────────────────────────────────────────────────────────────
function BloqueioLoteModal({ visible, T, onFechar, onConfirmar }) {
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

// ─────────────────────────────────────────────────────────────────────────────
// Componentes base (EstadoVazio, StatusOcupacao, BloqueioModal, ConfirmModal,
// ConcluirModal, EditModal, ProximoAtendimento, LinhaDeTempo, AppointmentCard)
// ─────────────────────────────────────────────────────────────────────────────
function EstadoVazio({ T, mensagem = 'Nenhum agendamento nesta data', icone = 'calendar-outline' }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 }}>
      <View style={{ marginBottom: 20, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 22, backgroundColor: T.accentGlow, borderWidth: 1.5, borderColor: T.accentDim, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icone} size={38} color={T.accentDim} />
        </View>
        <View style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim }} />
        <View style={{ position: 'absolute', bottom: -4, left: -10, width: 12, height: 12, borderRadius: 6, backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim }} />
      </View>
      <Text style={{ color: T.text, fontSize: 16, fontWeight: '700', marginBottom: 6, textAlign: 'center' }}>Nada por aqui!</Text>
      <Text style={{ color: T.textSub, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>{mensagem}</Text>
    </View>
  );
}

function StatusOcupacao({ agendamentos, bloqueios, horaInicio, horaFim, T }) {
  const totalSlots = horaFim - horaInicio;
  const horasOcupadas = new Set([
    ...agendamentos.map(a => new Date(a.horario_atendimento).getHours()),
    ...bloqueios.map(b => new Date(b.horario_atendimento).getHours()),
  ]).size;
  const pct = totalSlots > 0 ? Math.round((horasOcupadas / totalSlots) * 100) : 0;
  const cor = pct >= 80 ? '#C0392B' : pct >= 50 ? '#E67E22' : '#27AE60';
  if (agendamentos.length === 0 && bloqueios.length === 0) return null;
  return (
    <View style={{ backgroundColor: T.surface, borderRadius: 14, borderWidth: 1, borderColor: T.cardBorder, padding: 14, marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ color: T.textSub, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>Ocupação do dia</Text>
        <Text style={{ color: cor, fontWeight: '800', fontSize: 15 }}>{pct}%</Text>
      </View>
      <View style={{ height: 8, backgroundColor: T.cardBorder, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ height: 8, width: `${pct}%`, backgroundColor: cor, borderRadius: 4 }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ color: T.textSub, fontSize: 11 }}>{horasOcupadas} hora{horasOcupadas !== 1 ? 's' : ''} ocupada{horasOcupadas !== 1 ? 's' : ''}</Text>
        <Text style={{ color: T.textSub, fontSize: 11 }}>{totalSlots - horasOcupadas} livre{totalSlots - horasOcupadas !== 1 ? 's' : ''}</Text>
      </View>
    </View>
  );
}

function BloqueioModal({ visible, hora, data, T, onConfirm, onCancel }) {
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

function ConfirmModal({ visible, item, T, onConfirm, onCancel, onReagendar }) {
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

function ConcluirModal({ visible, item, T, onConfirm, onCancel }) {
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

function EditModal({ visible, item, dadosCliente, T, onSalvar, onFechar, dataInicial = '' }) {
  const [nome, setNome] = useState(''), [horario, setHorario] = useState(''), [telefone, setTelefone] = useState('');
  const [valor, setValor] = useState(''), [corte, setCorte] = useState(''), [procedimento, setProcedimento] = useState('');
  const [duracao, setDuracao] = useState(''), [dataEdit, setDataEdit] = useState(''), [focused, setFocused] = useState('');
  const [mostrarCal, setMostrarCal] = useState(false);
  const isReagendar = !item && !!dataInicial;

  useEffect(() => {
    if (!item) return;
    setNome(item.nome_pessoa ? String(item.nome_pessoa) : '');
    setTelefone(item.telefone ? String(item.telefone) : '');
    setValor(item.valor ? String(item.valor) : '');
    setCorte(item.tipo_corte ? String(item.tipo_corte) : '');
    setProcedimento(item.nome_procedimento ? String(item.nome_procedimento) : '');
    setDuracao(item.carga_horaria ? String(item.carga_horaria) : '');
    const dt = item.horario_atendimento ? new Date(item.horario_atendimento) : new Date();
    setHorario(`${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`);
    const raw = item.horario_atendimento || '';
    setDataEdit(raw.split('T')[0].split(' ')[0] || dataInicial);
    setMostrarCal(false);
  }, [item]);

  useEffect(() => { if (item) return; if (dataInicial) { setDataEdit(dataInicial); setMostrarCal(false); } }, [dataInicial, item]);

  useEffect(() => {
    if (!isReagendar || !dadosCliente) return;
    setNome(dadosCliente.nome_pessoa ? String(dadosCliente.nome_pessoa) : '');
    setTelefone(dadosCliente.telefone ? String(dadosCliente.telefone) : '');
    setCorte(dadosCliente.tipo_corte ? String(dadosCliente.tipo_corte) : '');
    setProcedimento(dadosCliente.nome_procedimento ? String(dadosCliente.nome_procedimento) : '');
    setValor(dadosCliente.valor ? String(dadosCliente.valor) : '');
    setDuracao(dadosCliente.carga_horaria ? String(dadosCliente.carga_horaria) : '');
    setHorario('');
  }, [dadosCliente, isReagendar]);

  if (!visible) return null;
  function handleSalvar() {
    if (!nome.trim()) { alert('Preencha o nome!'); return; }
    const h = normalizarHorario(horario);
    if (!h) { alert('Horário inválido. Use o formato HH:MM, por exemplo 14:30.'); return; }
    if (!dataEdit) { alert('Selecione uma data!'); return; }
    onSalvar({ nome_pessoa: nome, tipo_corte: corte, nome_procedimento: procedimento, carga_horaria: duracao, horario_atendimento: `${dataEdit} ${h}`, telefone, valor });
  }
  const inp = (id, ph, val, setter, extra = {}) => (
    <TextInput placeholder={ph} placeholderTextColor={T.placeholder} value={val} onChangeText={setter} onFocus={() => setFocused(id)} onBlur={() => setFocused('')} style={{ backgroundColor: T.input, color: T.text, borderWidth: 1, borderColor: focused === id ? T.accent : T.inputBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, marginTop: 8, flex: extra.flex || undefined }} {...extra} />
  );
  const lbl = txt => <Text style={{ color: T.accent, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginTop: 18, marginBottom: 2, marginLeft: 2 }}>{txt}</Text>;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onFechar}>
      <View style={{ flex: 1, backgroundColor: T.overlay, justifyContent: 'flex-end' }}>
        <ScrollView style={{ backgroundColor: T.modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: T.modalBorder }} contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: T.inputBorder, alignSelf: 'center', marginBottom: 20 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: T.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 }}>{isReagendar ? '🔄 Reagendar' : 'Editar Agendamento'}</Text>
            <TouchableOpacity onPress={onFechar}><Ionicons name="close" size={22} color={T.textSub} /></TouchableOpacity>
          </View>
          {lbl('Data')}
          <TouchableOpacity onPress={() => setMostrarCal(v => !v)} style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: T.input, borderWidth: 1, borderColor: mostrarCal ? T.accent : (dataEdit ? T.accent : T.inputBorder), borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="calendar-outline" size={18} color={dataEdit ? T.accent : T.placeholder} />
              <Text style={{ color: dataEdit ? T.text : T.placeholder, fontSize: 15 }}>{dataEdit || 'Selecione uma data'}</Text>
            </View>
            <Ionicons name={mostrarCal ? 'chevron-up' : 'chevron-down'} size={16} color={T.textSub} />
          </TouchableOpacity>
          {mostrarCal && (
            <View style={{ borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
              <CalendarioCustom markedDates={dataEdit ? { [dataEdit]: { selected: true } } : {}} onDayPress={d => { setDataEdit(d.dateString); setMostrarCal(false); }} selectedDate={dataEdit} dark={true} />
            </View>
          )}
          {lbl('Cliente')}{inp('nome', 'Nome completo', nome, setNome)}
          {lbl('Serviço')}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {inp('corte', 'Tipo de corte', corte, setCorte, { flex: 1 })}
            {inp('proc', 'Procedimento', procedimento, setProcedimento, { flex: 1 })}
          </View>
          {lbl('Horário')}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {inp('dur', 'Duração', duracao, setDuracao, { flex: 1 })}
            {inp('hora', 'HH:MM', horario, setHorario, { flex: 1 })}
          </View>
          {lbl('Contato & Valor')}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {inp('tel', 'Telefone', telefone, setTelefone, { flex: 1, keyboardType: 'phone-pad' })}
            {inp('val', 'R$ 0,00', valor, setValor, { flex: 1, keyboardType: 'numeric' })}
          </View>
          <TouchableOpacity onPress={handleSalvar} style={{ backgroundColor: T.accent, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 24, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 }}>{isReagendar ? 'Confirmar Reagendamento' : 'Salvar Alterações'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function formatarContagem(ms) {
  if (ms <= 0) return 'Agora!';
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2,'0')}m ${String(ss).padStart(2,'0')}s`;
  return `${String(m).padStart(2,'0')}m ${String(ss).padStart(2,'0')}s`;
}

function ProximoAtendimento({ lista, T, formatarData }) {
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

function LinhaDeTempo({ agendamentos, bloqueios, T, dark, concluir, cancelar, formatarData, dataSelecionada, horaInicio = 7, horaFim = 22, onBloquear, onDesbloquear }) {
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
              <Text style={{ color: atual ? T.accent : T.textSub, fontSize: 12, fontWeight: atual ? '800' : '400' }}>{String(h).padStart(2,'00')}:00</Text>
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

function AppointmentCard({ item, T, dark, concluir, cancelar, formatarData }) {
  return (
    <View style={{ backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, borderRadius: 16, marginTop: 14, overflow: 'hidden' }}>
      <View style={{ height: 3, backgroundColor: T.accent }} />
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="person" size={18} color={T.accent} />
            </View>
            <Text style={{ color: T.text, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>{item.nome_pessoa}</Text>
          </View>
          <View style={{ backgroundColor: T.accentGlow, borderWidth: 1, borderColor: T.accentDim, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: T.accent, fontSize: 12, fontWeight: '700' }}>R$ {item.valor || '0'}</Text>
          </View>
        </View>
        <View style={{ backgroundColor: dark ? '#111111' : '#F8F5F0', borderRadius: 10, padding: 12, gap: 6, marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="time-outline" size={14} color={T.textSub} />
            <Text style={{ color: T.textSub, fontSize: 13 }}>{formatarData(item.horario_atendimento)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="cut-outline" size={14} color={T.textSub} />
            <Text style={{ color: T.textSub, fontSize: 13 }}>{item.nome_procedimento || 'Procedimento não informado'}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => concluir(item)} style={{ flex: 1, backgroundColor: T.success, paddingVertical: 11, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
            <Ionicons name="checkmark-circle-outline" size={15} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Concluir</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => cancelar(item)} style={{ flex: 1, backgroundColor: 'transparent', paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: T.danger, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
            <Ionicons name="close-circle-outline" size={15} color={T.danger} />
            <Text style={{ color: T.danger, fontWeight: '700', fontSize: 12 }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function SectionLabel({ children, T }) {
  return <Text style={{ color: T.accent, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginTop: 20, marginBottom: 6, marginLeft: 2 }}>{children}</Text>;
}
function StyledInput({ placeholder, value, onChangeText, id, T, focused, setFocused, ...rest }) {
  return (
    <TextInput placeholder={placeholder} placeholderTextColor={T.placeholder} value={value} onChangeText={onChangeText} onFocus={() => setFocused(id)} onBlur={() => setFocused('')} style={{ flex: rest.flex || undefined, backgroundColor: T.input, color: T.text, borderWidth: 1, borderColor: focused === id ? T.accent : T.inputBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginTop: 8 }} {...rest} />
  );
}

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
  function formatarData(d) {
    const dt = new Date(d);
    return `${dt.getDate()}/${dt.getMonth()+1}  ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'00')}`;
  }
  function normalizarData(str) { return str ? str.replace('T', ' ').substring(0, 10) : ''; }

  const bloqueiosDoDia    = bloqueios.filter(b => normalizarData(b.horario_atendimento) === dataAgenda);
  const clientesFiltrados = buscaCliente.trim() ? clientes.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase().trim())) : clientes;

  // ── Card de relatório reutilizável ─────────────────────────────────────────
  function CardRelatorio({ r }) {
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

          {/* ✅ Banner automático */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: T.accentGlow, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: T.accentDim, marginBottom: 16 }}>
            <Ionicons name="sync-outline" size={16} color={T.accent} />
            <Text style={{ color: T.accent, fontSize: 12, fontWeight: '600', flex: 1 }}>
              Relatórios atualizados automaticamente a cada 5 segundos — sem precisar apertar nada.
            </Text>
          </View>

          {/* ✅ Tabs mensal / trimestral */}
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
              : relatorios.map(r => <CardRelatorio key={r.id} r={r} />)
          ) : (
            relatoriosTri.length === 0
              ? <EstadoVazio T={T} mensagem="Nenhum relatório trimestral ainda. Aguarde o próximo ciclo automático." icone="layers-outline" />
              : relatoriosTri.map(r => <CardRelatorio key={r.id} r={r} />)
          )}
        </ScrollView>
      )}

      {/* CONFIG */}
      {tela === 'config' && (
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
              <Text style={{ color: T.accent, fontSize: 13, fontWeight: '600' }}>Funcionamento: {String(horaInicio).padStart(2,'0')}:00 até {String(horaFim).padStart(2,'00')}:00 — {horaFim - horaInicio}h de trabalho</Text>
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
      )}
    </View>
  );
}