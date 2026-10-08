# Casos de teste e defeitos encontrados

Projeto: TCC Cabeleireiro (app mobile React Native + Supabase)

**Ambiente:** Expo SDK 57, Expo Go no celular, Supabase (PostgreSQL), Windows.
**Tipos de teste:** manual funcional, validação em banco via SQL, testes unitários automatizados (Jest).

Legenda de status: ✅ Passou · 🐞 Falhou e foi corrigido · ⚠️ Registrado como limitação

---

## 1. Resumo dos defeitos

| ID | Defeito | Tipo | Severidade | Status |
|---|---|---|---|---|
| BUG-01 | Serviços iguais contados separadamente (maiúsculas, espaços, acentos) | Lógica de negócio | Média | 🐞 Corrigido |
| BUG-02 | Botão de WhatsApp fecha o app (`telefone` é `bigint`) | Integração app × banco | Alta | 🐞 Corrigido |
| BUG-03 | Horário aceita texto inválido e agendamento é salvo sem data | Validação de entrada | Alta | 🐞 Corrigido |
| BUG-04 | Reagendar apaga o original antes de validar o novo horário | Perda de dados | Alta | 🐞 Corrigido |
| BUG-05 | Dois agendamentos no mesmo horário ou em horário bloqueado | Regra de negócio | Alta | 🐞 Corrigido |
| BUG-06 | Relatórios não são regenerados após limpar o banco nem atualizados quando o total muda | Lógica / estado local | Média | 🐞 Corrigido |
| BUG-07 | Agendamento sem telefone (ou sem valor) parece salvo, mas não grava no banco | Tratamento de erro / tipos | Alta | 🐞 Corrigido |
| BUG-08 | Calendário exibe células fora do mês como selecionadas quando nenhuma data foi escolhida | Interface | Baixa | 🐞 Corrigido |
| BUG-09 | Erro `Property 'error' doesn't exist` ao agendar (regressão) | Regressão | Alta | 🐞 Corrigido |
| SEC-01 | Chave do Supabase e URL escritas no código-fonte | Segurança | Alta | 🐞 Corrigido |
| SEC-02 | Políticas RLS liberam tudo ao papel `anon` (12 avisos do linter) | Segurança | Média | ⚠️ Limitação (app sem login) |

---

## 2. Detalhamento dos defeitos

### BUG-01: agrupamento de serviços sensível a maiúsculas e acentos

- **Passos:** criar agendamentos concluídos com procedimento `degrade`, `Degrade`, `  DEGRADE ` e `degradê`; abrir Relatório > Serviços Mais Populares.
- **Esperado:** uma única linha "Degrade" com 4x e R$ 200.
- **Obtido:** linhas separadas para cada variação.
- **Causa:** o nome do serviço era usado diretamente como chave do agrupamento.
- **Correção:** chave normalizada (minúsculas, sem acentos, espaços repetidos unificados) e nome de exibição formatado. A lógica foi extraída para `src/utils/servicos.js`.
- **Verificação:** conferido por consulta SQL equivalente e por teste automatizado (`servicos.test.js`).

> Observação de QA: a primeira consulta SQL usada como referência não removia acentos e divergia do app. Antes de abrir um defeito, foi verificado de que lado estava a divergência: a referência estava desatualizada, não o app.

### BUG-02: erro `undefined is not a function` ao enviar lembrete por WhatsApp

- **Passos:** Clientes > tocar em "Enviar Lembrete por WhatsApp" em um cliente com telefone.
- **Esperado:** abrir o WhatsApp com número e mensagem preenchidos.
- **Obtido:** erro e fechamento do app em `abrirWhatsApp`.
- **Causa:** a coluna `telefone` é `bigint`; o Supabase devolve número, e o código chamava `.replace()` (método de texto).
- **Correção:** `String(cliente.telefone || '')` antes do `replace`, e conversão para texto na montagem da lista de clientes.
- **Verificação:** WhatsApp abriu com o número `+55` + DDD + número e a mensagem com `{nome}` substituído.

### BUG-03: validação de horário e de data

- **Passos:** informar horários inválidos na Home e no reagendamento (na época, o horário era digitado em campo de texto).
- **Obtido (antes):** qualquer texto era aceito; sem data selecionada, o registro era salvo como `" 14:30"`.
- **Causa:** a validação só verificava se o texto não estava vazio.
- **Correção:** função `normalizarHorario` (aceita `H:M`, devolve `HH:MM`, rejeita o restante) e validação de data e nome.
- **Verificação:** casos da seção 3.1 e testes automatizados (`horario.test.js`).
- **Evolução:** o campo de texto foi depois substituído por botões de horário (seção 4), eliminando a digitação; a validação continua ativa em `salvar` como segunda camada.

### BUG-04: reagendar apagava o agendamento original antes de validar

- **Passos:** cancelar > "Cancelar e Reagendar" > informar horário inválido ou ocupado.
- **Obtido (antes):** o agendamento original já havia sido apagado e o novo era recusado, resultando em perda do cliente.
- **Causa:** a ordem das operações em `confirmarReagendamento` (apagar, depois salvar).
- **Correção:** validar horário e conflito antes de apagar o original.
- **Verificação:** caso 6 da seção 3.2 (o original continua existindo após recusa).
- **Observação:** o BUG-07 revelou um caminho restante de perda de dados (falha do banco depois de apagar o original). A correção do BUG-07 fecha esse caminho: o novo registro passa a ser gravado antes de o original ser apagado.

### BUG-05: agendamentos duplicados e em horário bloqueado

- **Passos:** agendar duas vezes no mesmo horário; bloquear um horário e tentar agendar nele.
- **Obtido (antes):** ambos eram aceitos.
- **Causa:** `salvar` não consultava agendamentos existentes nem bloqueios.
- **Correção:** `buscarConflito` consulta registros `pendente` e `bloqueado` do dia.
- **Verificação:** casos da seção 3.2 e consulta SQL de duplicidade (zero linhas).
- **Evolução:** a regra de comparação mudou junto com os horários por botões (ver seção 4.1). A lógica foi extraída para `src/utils/conflito.js` e coberta por testes automatizados.

### BUG-06: relatórios não eram gerados nem atualizados

- **Sintoma:** tabelas `Relatorios` e `Relatorio_Tri` vazias com o app aberto.
- **Causa:** o app guardava no AsyncStorage a chave do último período gerado e, quando ela coincidia com o período atual, pulava a geração. Após esvaziar as tabelas no banco, o celular continuava "lembrando" que o relatório já existia. Além disso, o total do período era gravado uma única vez e nunca atualizado, contradizendo o aviso da tela (atualização automática).
- **Correção:** removida a trava; o relatório é gravado somente quando o total muda; erros das chamadas ao banco passaram a ser registrados no console.
- **Verificação:** ao concluir um novo atendimento, o total do relatório mensal e do trimestral é atualizado automaticamente em poucos segundos.

### BUG-07: agendamento sem telefone parece salvo, mas não grava

- **Descoberto durante:** o teste do envio de WhatsApp para cliente sem telefone (caso 3.4 nº 2).
- **Passos:** na Home, preencher nome, data e horário, deixar o telefone em branco e confirmar o agendamento; consultar a tabela `Procedimentos`.
- **Esperado:** o agendamento é gravado com telefone nulo, ou o app mostra uma mensagem de erro.
- **Obtido:** o app não mostra erro e limpa o formulário, mas o registro não existe no banco.
- **Causa provável:** o app envia `telefone: ''` (e `valor: ''`) para colunas `bigint` e `numeric`, e o banco rejeita texto vazio nesses tipos. O `salvar` não verificava o campo `error` do retorno do Supabase, então a falha era silenciosa. O mesmo vale para telefones digitados com máscara (por exemplo `(11) 99999-0001`) e valores com vírgula (`50,00`).
- **Correção:** a conversão foi extraída para funções puras (`telefoneParaNumero` e `valorParaNumero` em `src/utils/conversoes.js`) e a gravação para `gravarAgendamento` (`src/services/agendamentos.js`), que recebe o cliente do banco como parâmetro. Telefone vira número (só dígitos) ou `null`; valor (aceitando vírgula) vira número ou `null`; o erro devolvido pelo banco é verificado e exibido em alerta; `salvar` passa a devolver sucesso ou falha. No reagendamento, o original só é apagado depois que o novo registro é gravado com sucesso.
- **Reteste:** casos 1 a 5 da seção 3.6 cobertos por testes automatizados (`conversoes.test.js` e `agendamentos.test.js`, com banco simulado), todos passando. Casos 6 e 7 verificados manualmente no app, ambos conforme o esperado (seção 3.6).

### BUG-08: células fora do mês marcadas como selecionadas no calendário

- **Passos:** abrir o calendário (Home, Agenda ou modal de reagendar) sem selecionar nenhum dia e observar as células vazias do início e do fim do mês; depois selecionar um dia.
- **Esperado:** as células fora do mês ficam sempre sem destaque.
- **Obtido:** antes de escolher uma data, as células vazias apareciam destacadas em dourado; ao selecionar um dia real, elas desapareciam.
- **Causa:** para células fora do mês a data era um texto vazio (`''`), e a comparação com a data selecionada, também vazia no estado inicial, resultava em verdadeiro (`'' === ''`).
- **Correção:** exigir que a célula seja um dia válido do mês antes de considerá-la selecionada (`valido && ...`).
- **Verificação:** reteste no app: as células fora do mês deixaram de aparecer destacadas (caso 18 da seção 3.7).
- **Observação:** é o mesmo tipo de falha do BUG-07 (valor vazio tratado como valor válido).

### BUG-09: regressão `Property 'error' doesn't exist` ao agendar

- **Sintoma:** erro "promise rejeitada" no console ao confirmar um agendamento.
- **Causa:** ao extrair a gravação para `gravarAgendamento`, o bloco que declarava `const { error }` foi removido de `salvar`, mas o `if (error)` logo abaixo permaneceu, referenciando uma variável que não existia mais.
- **Correção:** `salvar` reescrita usando apenas o retorno de `gravarAgendamento`.
- **Lição:** a regressão apareceu porque `salvar` ainda não tem teste automatizado de integração. Fica como melhoria futura.

### SEC-01: credenciais no código

- **Achado:** URL e chave do Supabase escritas diretamente no código (e expostas no editor online usado inicialmente).
- **Ação:** movidas para variáveis de ambiente (`.env`, ignorado pelo Git; `.env.example` versionado). A chave anterior foi desativada no painel do Supabase.
- **Verificação:** `git check-ignore -v .env` confirma que o arquivo é ignorado; `git status` não lista `.env`.

### SEC-02: avisos do linter do Supabase

- **Achado:** 12 avisos (`rls_policy_always_true` e `pg_graphql_*`). Parte vinha de políticas antigas redundantes (removidas).
- **Decisão:** os avisos restantes são aceitos porque o app não tem autenticação e precisa que o papel `anon` leia e grave. Revogar o `SELECT` do `anon` quebraria o app.
- **Melhoria futura:** Supabase Auth com políticas por usuário.

---

## 3. Casos de teste manuais

### 3.1 Validação de horário e data (BUG-03)

Executados quando o horário ainda era digitado em campo de texto. Hoje a seleção é por botões (seção 4), e estes casos permanecem cobertos por testes automatizados (`horario.test.js`).

| # | Entrada | Esperado | Resultado |
|---|---|---|---|
| 1 | `14:30` | Salva como `14:30` | ✅ |
| 2 | `9:05` | Salva como `09:05` | ✅ |
| 3 | `9:5` | Salva como `09:05` | ✅ |
| 4 | `24:00` | Alerta de horário inválido | ✅ |
| 5 | `12:60` | Alerta de horário inválido | ✅ |
| 6 | `abc` | Alerta de horário inválido | ✅ |
| 7 | vazio | Alerta de horário inválido | ✅ |
| 8 | `14:30` sem data selecionada | Alerta para selecionar a data | ✅ (ver nota) |
| 9 | Reagendar com horário `abc` | Alerta; agendamento original continua existindo | ✅ |

**Nota sobre o caso 8:** na primeira execução o agendamento foi salvo no dia atual. A investigação mostrou estado residual: o Fast Refresh do Expo preserva o estado, e uma data tocada em teste anterior continuava selecionada. Após reiniciar o app com estado limpo, o alerta foi exibido. Lição: todo teste deve partir de um estado inicial conhecido.

### 3.2 Conflito de horário (BUG-05)

Casos 1 a 8 executados com a regra original (hora cheia). O caso 3 deixou de valer com a mudança de regra (seção 4.1) e foi substituído pelos casos da seção 3.7.

| # | Cenário | Esperado | Resultado |
|---|---|---|---|
| 1 | Agendar às 10:00 em horário livre | Salva | ✅ |
| 2 | Agendar às 10:00 novamente no mesmo dia | Alerta de conflito | ✅ |
| 3 | Agendar às 10:30 (mesma hora cheia de um agendamento às 10:00) | Alerta de conflito (regra antiga) | ✅ na época; substituído pela regra de horário exato |
| 4 | Bloquear 15:00 e tentar agendar 15:00 | Alerta de horário bloqueado | ✅ |
| 5 | Mesmo horário em outro dia | Salva | ✅ |
| 6 | Reagendar para horário ocupado | Alerta; original continua existindo | ✅ |
| 7 | Reagendar para horário livre | Original removido, novo criado | ✅ |
| 8 | Agendar em horário de atendimento já concluído | Salva | ✅ |

### 3.3 Agrupamento de serviços (BUG-01)

| # | Entrada | Esperado | Resultado |
|---|---|---|---|
| 1 | `degrade`, `Degrade`, `  DEGRADE `, `degradê` (concluídos, R$ 50 cada) | Degrade 4x, R$ 200 | ✅ |
| 2 | `Barba` concluída (R$ 30) e `barba` pendente (R$ 30) | Barba 2x, R$ 30 | ✅ |

### 3.4 WhatsApp (BUG-02)

| # | Cenário | Esperado | Resultado |
|---|---|---|---|
| 1 | Cliente com telefone | WhatsApp abre com número e mensagem corretos | ✅ |
| 2 | Cliente sem telefone | Alerta "Este cliente não tem telefone cadastrado." | ✅ Estava bloqueado pelo BUG-07. Após a correção, o alerta aparece e o app não fecha (mesmo teste do caso 7 da seção 3.6) |

### 3.5 Regressão após refatoração

Após dividir o `App.js` em componentes, telas, serviços e utilitários, todas as telas e fluxos foram testados novamente: Início, Agenda (linha e lista), Clientes, Relatório (abas mensal e trimestral), Configurações, concluir, cancelar, reagendar, bloqueio individual e em lote. Resultado: ✅ sem diferenças em relação ao comportamento anterior.

### 3.6 Gravação com campos opcionais vazios (BUG-07)

| # | Cenário | Esperado | Resultado |
|---|---|---|---|
| 1 | Agendar sem telefone | Grava com `telefone` nulo | ✅ Automatizado (`agendamentos.test.js`) |
| 2 | Agendar sem valor | Grava com `valor` nulo | ✅ Automatizado |
| 3 | Agendar com telefone mascarado `(11) 99999-0001` | Grava `11999990001` | ✅ Automatizado (`conversoes.test.js` e `agendamentos.test.js`) |
| 4 | Agendar com valor `50,00` | Grava `50` | ✅ Automatizado |
| 5 | Falha do banco | Devolve erro em vez de fingir sucesso; app exibe alerta | ✅ Automatizado (banco simulado) |
| 6 | Reagendar com falha de conexão (modo avião ligado, Wi-Fi desligado) | Nenhuma ação é gravada no banco; agendamento original continua existindo | ✅ Manual: sem conexão o app deixou de registrar ações no banco e o original foi preservado |
| 7 | Cliente salvo sem telefone, tocar em WhatsApp | Alerta "Este cliente não tem telefone cadastrado." | ✅ Manual: alerta exibido, app não fecha |

Os casos automatizados validam a lógica de conversão e o tratamento de erro; a confirmação do registro no banco real e o fluxo de tela continuam sendo verificados manualmente.

### 3.7 Seleção por botões: tipo de corte, horários e reagendamento

| # | Cenário | Esperado | Resultado |
|---|---|---|---|
| 1 | Tipo de corte: tocar em uma opção | Só a opção tocada fica ativa | ✅ |
| 2 | Tocar de novo na opção marcada | Desmarca (campo opcional) | ✅ |
| 3 | Agendar com tipo de corte escolhido | `tipo_corte` gravado no banco com o valor da opção | ✅ |
| 4 | Config com 30 min: abrir a Home e escolher uma data | Botões de 30 em 30 min a partir da abertura | ✅ |
| 5 | Mudar o intervalo para 45 min | Botões passam a ter 45 min de distância | ✅ |
| 6 | Config: tocar no `-` repetidamente | Intervalo para em 15 min | ✅ |
| 7 | Home sem data selecionada | Aviso no lugar dos botões de horário | ✅ |
| 8 | Data de hoje | Horários já passados apagados e não selecionáveis | ✅ |
| 9 | Horário já agendado no dia | Aparece apagado e riscado | ✅ |
| 10 | Agendar 14:00 e depois 14:30 no mesmo dia | Ambos aceitos | ✅ |
| 11 | Bloquear uma hora na Agenda e abrir a Home nesse dia | Todos os botões dessa hora apagados | ✅ |
| 12 | Confirmar sem escolher horário | Alerta "Selecione um horário." | ✅ |
| 13 | Escolher horário e trocar a data ou o intervalo | A seleção é limpa | ✅ |
| 14 | Reagendar: modal mostra botões de horário | Sem campo de texto | ✅ |
| 15 | Reagendar: horário do próprio agendamento | Continua selecionável | ✅ |
| 16 | Reagendar para horário ocupado ou bloqueado | Botão desabilitado | ✅ |
| 17 | Reagendar para horário livre | Original removido, novo criado | ✅ |
| 18 | Calendário sem data selecionada (BUG-08) | Células fora do mês sem destaque | ✅ |

---

## 4. Mudanças de comportamento

### 4.1 Regra de conflito de horários

Com horários de 15 a 90 minutos, tratar cada hora como bloco único impediria dois agendamentos na mesma hora. A regra passou a ser:

- **Agendamento:** conflita somente no horário exato.
- **Bloqueio:** continua valendo para a hora inteira.

A lógica está em `src/utils/conflito.js` (`encontrarConflito`) e é coberta por `conflito.test.js`.

### 4.2 Campos de seleção

- **Tipo de corte:** campo de texto livre substituído por seleção entre opções fixas (Masculino e Feminino), reduzindo variações de digitação.
- **Horário:** campo de texto `HH:MM` substituído por botões gerados a partir do horário de funcionamento e do intervalo configurado (mínimo de 15 minutos). A lógica está em `src/utils/slots.js` (`gerarSlots`, `calcularDesabilitados`).

---

## 5. Consultas SQL de verificação

```sql
-- Duplicidade de horários ativos (esperado: zero linhas)
select horario_atendimento, count(*) from "Procedimentos"
where status in ('pendente','bloqueado')
group by horario_atendimento having count(*) > 1;

-- Horários com formato inválido (esperado: zero linhas)
select id, nome_pessoa, horario_atendimento from "Procedimentos"
where horario_atendimento !~ '^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$';

-- Atendimentos concluídos sem valor
select id, nome_pessoa from "Procedimentos"
where status = 'concluido' and (valor is null or valor = 0);

-- Valores de tipo de corte em uso
select tipo_corte, count(*) from "Procedimentos" group by tipo_corte;

-- Serviços agrupados (referência para o relatório do app)
select lower(translate(regexp_replace(trim(nome_procedimento), '\s+', ' ', 'g'),
         'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
         'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')) as servico,
       count(*) as qtd,
       sum(valor) filter (where status = 'concluido') as receita
from "Procedimentos"
where nome_procedimento is not null and nome_procedimento <> ''
  and status in ('pendente','concluido')
group by 1 order by qtd desc;
```

---

## 6. Testes automatizados (Jest)

Executar com `npm test`. Última execução: 10 suites passando.

| Arquivo | Cobre | Pontos principais |
|---|---|---|
| `horario.test.js` | `normalizarHorario` | zero à esquerda, limites 00:00 e 23:59, espaços, 24:00, 12:60, texto, vazio e nulo |
| `formatadores.test.js` | `formatarContagem` | "Agora!", minutos e segundos, horas, arredondamento de milissegundos |
| `datas.test.js` | `formatarData`, `normalizarData` | formatos com espaço e com `T`, valores vazios |
| `trimestre.test.js` | `trimestreAtual`, `labelTrimestre`, `rangeTrimestrre` | todos os meses, início e fim dos trimestres, relógio simulado |
| `servicos.test.js` | `agruparServicos` | caso do `degrade`, receita só de concluídos, espaços, nulos, ordenação, limite |
| `conversoes.test.js` | `telefoneParaNumero`, `valorParaNumero` | máscara, vírgula, "R$", separador de milhar, vazio, nulo e texto |
| `agendamentos.test.js` | `gravarAgendamento` | telefone e valor nulos, conversões, status pendente, falha do banco (cliente simulado) |
| `slots.test.js` | `gerarSlots`, `horaDeRegistro` | intervalos de 30, 45 e 60 min, intervalo inválido, formatos de data com espaço e com `T` |
| `conflito.test.js` | `encontrarConflito` | horário exato, bloqueio por hora inteira, horas com e sem zero, listas vazias |
| `desabilitados.test.js` | `calcularDesabilitados` | ocupados, bloqueios, `ignorarId` no reagendamento, horários passados de hoje, outras datas |

---

## 7. Melhorias futuras de qualidade

- Testes de interface com React Native Testing Library (formulário da Home, modais, seletores).
- Teste de integração para `salvar` (evitaria regressões como o BUG-09).
- Considerar a duração do atendimento na regra de conflito (hoje um corte longo não bloqueia os horários seguintes).
- Migrar `horario_atendimento` para `timestamp` e `telefone` para `text`.
- Verificar o retorno de erro de todas as chamadas ao Supabase (concluir, cancelar, desbloquear ainda não tratam falhas).
- Autenticação com Supabase Auth e políticas RLS por usuário.
- Pipeline de CI (GitHub Actions) rodando `npm test` a cada push.