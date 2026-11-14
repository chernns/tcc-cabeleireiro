import { OPCOES_SERVICO, montarProcedimento, lerProcedimento } from '../src/utils/procedimentos';

describe('montarProcedimento', () => {
  test('só corte', () => {
    expect(montarProcedimento({ corte: 'Cabelo' })).toBe('Corte de cabelo');
    expect(montarProcedimento({ corte: 'Barba' })).toBe('Corte de barba');
    expect(montarProcedimento({ corte: 'Cabelo + barba' })).toBe('Corte de cabelo e barba');
  });

  test('só pintura', () => {
    expect(montarProcedimento({ pintura: 'Cabelo' })).toBe('Pintura de cabelo');
    expect(montarProcedimento({ pintura: 'Cabelo + barba' })).toBe('Pintura de cabelo e barba');
  });

  test('corte e pintura juntos', () => {
    expect(montarProcedimento({ corte: 'Cabelo', pintura: 'Barba' })).toBe('Corte de cabelo + Pintura de barba');
  });

  test('nada marcado vira texto vazio', () => {
    expect(montarProcedimento({})).toBe('');
    expect(montarProcedimento()).toBe('');
  });

  test('ignora opção desconhecida', () => {
    expect(montarProcedimento({ corte: 'Sobrancelha' })).toBe('');
  });

  test('mantém partes antigas ao final', () => {
    expect(montarProcedimento({ corte: 'Cabelo', outros: ['Degrade'] })).toBe('Corte de cabelo + Degrade');
    expect(montarProcedimento({ outros: ['Degrade'] })).toBe('Degrade');
  });
});

describe('lerProcedimento', () => {
  test('ida e volta para todas as combinações', () => {
    const vazio = [''];
    for (const corte of [...vazio, ...OPCOES_SERVICO]) {
      for (const pintura of [...vazio, ...OPCOES_SERVICO]) {
        const texto = montarProcedimento({ corte, pintura });
        expect(lerProcedimento(texto)).toEqual({ corte, pintura, outros: [] });
      }
    }
  });

  test('texto antigo digitado fica em "outros"', () => {
    expect(lerProcedimento('Degrade')).toEqual({ corte: '', pintura: '', outros: ['Degrade'] });
  });

  test('texto antigo com "+" é preservado na volta', () => {
    const lido = lerProcedimento('Corte + Barba');
    expect(lido.outros).toEqual(['Corte', 'Barba']);
    expect(montarProcedimento(lido)).toBe('Corte + Barba');
  });

  test('mistura de opções e texto antigo', () => {
    expect(lerProcedimento('Corte de cabelo + Degrade')).toEqual({ corte: 'Cabelo', pintura: '', outros: ['Degrade'] });
  });

  test('o mesmo grupo duas vezes: a segunda parte vai para "outros"', () => {
    expect(lerProcedimento('Corte de cabelo + Corte de barba')).toEqual({ corte: 'Cabelo', pintura: '', outros: ['Corte de barba'] });
  });

  test('vazio, nulo e indefinido', () => {
    const vazio = { corte: '', pintura: '', outros: [] };
    expect(lerProcedimento('')).toEqual(vazio);
    expect(lerProcedimento(null)).toEqual(vazio);
    expect(lerProcedimento(undefined)).toEqual(vazio);
  });
});