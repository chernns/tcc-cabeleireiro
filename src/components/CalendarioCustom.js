import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DIAS_SEMANA, MESES } from '../constants';

export function CalendarioCustom({ markedDates = {}, onDayPress, selectedDate, selectedDates, multiSelect = false, dark }) {
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