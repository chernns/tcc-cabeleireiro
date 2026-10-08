import { telefoneParaNumero, valorParaNumero } from '../src/utils/conversoes';

describe('telefoneParaNumero', () => {
  test('número simples', () => {
    expect(telefoneParaNumero('11999990001')).toBe(11999990001);
  });
  test('remove a máscara', () => {
    expect(telefoneParaNumero('(11) 99999-0001')).toBe(11999990001);
  });
  test('vazio, espaços e nulos viram null', () => {
    expect(telefoneParaNumero('')).toBeNull();
    expect(telefoneParaNumero('   ')).toBeNull();
    expect(telefoneParaNumero(null)).toBeNull();
    expect(telefoneParaNumero(undefined)).toBeNull();
  });
  test('texto sem dígitos vira null', () => {
    expect(telefoneParaNumero('abc')).toBeNull();
  });
});

describe('valorParaNumero', () => {
  test('inteiro e decimal com ponto', () => {
    expect(valorParaNumero('50')).toBe(50);
    expect(valorParaNumero('12.5')).toBe(12.5);
  });
  test('decimal com vírgula', () => {
    expect(valorParaNumero('50,00')).toBe(50);
    expect(valorParaNumero('45,90')).toBe(45.9);
  });
  test('com R$ e separador de milhar', () => {
    expect(valorParaNumero('R$ 50,00')).toBe(50);
    expect(valorParaNumero('1.500,00')).toBe(1500);
  });
  test('vazio, nulo e texto viram null', () => {
    expect(valorParaNumero('')).toBeNull();
    expect(valorParaNumero(null)).toBeNull();
    expect(valorParaNumero('abc')).toBeNull();
  });
});