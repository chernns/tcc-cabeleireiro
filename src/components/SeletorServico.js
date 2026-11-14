import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SeletorOpcoes } from './SeletorOpcoes';
import { OPCOES_SERVICO, lerProcedimento, montarProcedimento } from '../utils/procedimentos';

export function SeletorServico({ T, valor, onChange }) {
  const sel = lerProcedimento(valor);
  const mudar = parcial => onChange(montarProcedimento({ ...sel, ...parcial }));

  const rotulo = txt => (
    <Text style={{ color: T.textSub, fontSize: 12, fontWeight: '600', marginTop: 12 }}>{txt}</Text>
  );

  return (
    <View>
      {rotulo('Cortar')}
      <SeletorOpcoes T={T} opcoes={OPCOES_SERVICO} valor={sel.corte} onChange={v => mudar({ corte: v })} />

      {rotulo('Pintar')}
      <SeletorOpcoes T={T} opcoes={OPCOES_SERVICO} valor={sel.pintura} onChange={v => mudar({ pintura: v })} />

      {sel.outros.length > 0 && (
        <TouchableOpacity
          onPress={() => mudar({ outros: [] })}
          style={{ marginTop: 12, padding: 10, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: T.inputBorder }}
        >
          <Text style={{ color: T.textSub, fontSize: 12 }}>
            Serviço anterior mantido: {sel.outros.join(' + ')} (toque para remover)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}