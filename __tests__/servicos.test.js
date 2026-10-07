import { agruparServicos } from '../src/utils/servicos';

const reg = (nome, status, valor) => ({ nome_procedimento: nome, status, valor });

describe('agruparServicos', () => {
  test('caso validado no banco: degrade 4x R$200 e barba 2x R$30', () => {
    const dados = [
      reg('degrade', 'concluido', 50),
      reg('Degrade', 'concluido', 50),
      reg('  DEGRADE ', 'concluido', 50),
      reg('degradê', 'concluido', 50),
      reg('Barba', 'concluido', 30),
      reg('barba', 'pendente', 30),
    ];
    expect(agruparServicos(dados)).toEqual([
      { nome: 'Degrade', count: 4, receita: 200 },
      { nome: 'Barba', count: 2, receita: 30 },
    ]);
  });

  test('pendente conta na quantidade, mas não na receita', () => {
    const r = agruparServicos([reg('Corte', 'pendente', 40)]);
    expect(r[0]).toEqual({ nome: 'Corte', count: 1, receita: 0 });
  });

  test('junta espaços repetidos no meio do nome', () => {
    const r = agruparServicos([reg('corte  masculino', 'concluido', 10), reg('Corte masculino', 'concluido', 10)]);
    expect(r).toHaveLength(1);
    expect(r[0].count).toBe(2);
  });

  test('ignora nomes vazios, nulos e só com espaços', () => {
    const r = agruparServicos([reg('', 'concluido', 10), reg(null, 'concluido', 10), reg('   ', 'concluido', 10)]);
    expect(r).toEqual([]);
  });

  test('trata valor nulo como zero', () => {
    const r = agruparServicos([reg('Pintura', 'concluido', null)]);
    expect(r[0].receita).toBe(0);
  });

  test('ordena do mais frequente para o menos frequente', () => {
    const r = agruparServicos([reg('A', 'pendente'), reg('B', 'pendente'), reg('B', 'pendente')]);
    expect(r.map(x => x.nome)).toEqual(['B', 'A']);
  });

  test('respeita o limite de itens', () => {
    const dados = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(n => reg(n, 'pendente'));
    expect(agruparServicos(dados)).toHaveLength(5);
    expect(agruparServicos(dados, 3)).toHaveLength(3);
  });

  test('aceita lista vazia ou indefinida', () => {
    expect(agruparServicos([])).toEqual([]);
    expect(agruparServicos(undefined)).toEqual([]);
  });
});