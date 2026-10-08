import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export function SeletorHorario({ T, slots, valor, onChange, desabilitados }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {slots.map(s => {
        const off = desabilitados.has(s);
        const ativo = valor === s;
        return (
          <TouchableOpacity
            key={s}
            disabled={off}
            onPress={() => onChange(ativo ? '' : s)}
            activeOpacity={0.7}
            style={{
              minWidth: 68, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10,
              backgroundColor: ativo ? T.accent : T.input,
              borderWidth: 1, borderColor: ativo ? T.accent : T.inputBorder,
              opacity: off ? 0.35 : 1,
            }}
          >
            <Text style={{
              color: ativo ? '#fff' : T.text, fontWeight: ativo ? '800' : '600', fontSize: 13,
              textDecorationLine: off ? 'line-through' : 'none',
            }}>{s}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}