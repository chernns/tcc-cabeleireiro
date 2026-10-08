import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';


export const OPCOES_CORTE = ['Masculino', 'Feminino'];

// Botões de seleção única. Tocar na opção já escolhida desmarca (campo opcional).
export function SeletorOpcoes({ T, opcoes, valor, onChange }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {opcoes.map(op => {
        const ativo = valor === op;
        return (
          <TouchableOpacity
            key={op}
            onPress={() => onChange(ativo ? '' : op)}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12,
              backgroundColor: ativo ? T.accent : T.input,
              borderWidth: 1, borderColor: ativo ? T.accent : T.inputBorder,
            }}
          >
            <Text style={{ color: ativo ? '#fff' : T.textSub, fontWeight: ativo ? '800' : '500', fontSize: 14 }}>{op}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}