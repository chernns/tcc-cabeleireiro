# Casos de teste e defeitos encontrados

Projeto: TCC Cabeleireiro (app mobile React Native + Supabase)

**Ambiente:** Expo SDK 57, Expo Go no celular, Supabase (PostgreSQL), Windows.
**Modos de execução:** os testes manuais de desempenho e de uso corrente usam `npm run rapido`, atalho para `expo start --tunnel -c --no-dev --minify` (ver seção 8); os demais podem ser feitos no modo normal (`npx expo start --tunnel -c`), que exibe telas de erro e avisos do React.
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
| BUG-10 | Relatórios com limites de período errados por comparação de texto local com data em UTC | Datas / fuso horário | Alta | 🐞 Corrigido |
| BUG-11 | Concluir, cancelar e desbloquear fingem sucesso quando o banco falha | Tratamento de erro | Alta | 🐞 Corrigido |
| BUG-12 | Bloqueio em lote criava bloqueio sobre horários com atendimento já agendado | Regra de negócio | Alta | 🐞 Corrigido |
| BUG-13 | Erro `Cannot convert undefined value to object` ao trocar de tela (lista `TELAS` ausente) | Configuração / regressão | Média | 🐞 Corrigido |
| BUG-14 | "Cancelar e Reagendar" não abria o modal de reagendamento (modal removido por engano) | Regressão | Alta | 🐞 Corrigido |
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

### BUG-10: limites de período dos relatórios errados (fuso horário)

- **Passos:** inserir atendimentos concluídos no primeiro dia do mês, no último dia, no primeiro dia do mês seguinte e no último dia do mês anterior; comparar o total do relatório mensal com o total calculado no banco.
- **Esperado:** o total do mês inclui o primeiro e o último dia e exclui os dias dos meses vizinhos.
- **Obtido (antes):** atendimentos do primeiro dia do mês ficavam de fora e atendimentos do primeiro dia do mês seguinte entravam no total.
- **Causa:** a coluna `horario_atendimento` é texto (`2026-10-01 10:00`), mas o período era montado com `toISOString()`, que converte para UTC (`2026-10-01T03:00:00.000Z` no fuso do Brasil). Na comparação de textos, o espaço vem antes do `T`, o que desloca os limites do mês.
- **Correção:** os limites passaram a ser datas locais em texto, com início inclusivo e fim exclusivo (`>= 2026-10-01` e `< 2026-11-01`), criadas pelas funções `dataLocal`, `limitesMes` e `limitesTrimestre`. A data padrão do reagendamento deixou de usar `toISOString()` e a marcação dos dias com agendamento no calendário passou a usar `normalizarData`.
- **Verificação:** com os dados de teste (R$ 100, 200, 400 e 800 nos quatro cenários acima), o relatório de outubro mostrou o mesmo total da consulta SQL (R$ 300). Regressões cobertas por `datas.test.js` e `trimestre.test.js`.

### BUG-11: concluir, cancelar e desbloquear sem tratamento de erro

- **Passos:** com a conexão desligada (modo avião), concluir um atendimento, cancelar um agendamento e desbloquear um horário.
- **Esperado:** alerta de erro e estado preservado.
- **Obtido (antes):** o app seguia como se tivesse funcionado (fechava o modal, removia o bloqueio da tela), sem que o banco tivesse sido alterado.
- **Causa:** as chamadas ao Supabase não verificavam o campo `error` do retorno (mesmo padrão do BUG-07).
- **Correção:** novas funções em `src/services/procedimentos.js` (`concluirProcedimento`, `removerProcedimento`, `inserirBloqueios`) devolvem sucesso ou falha, e o app só atualiza a tela quando a operação foi gravada. No reagendamento, uma falha ao remover o horário antigo é informada ao usuário.
- **Verificação:** casos da seção 3.9 e testes automatizados com banco simulado (`procedimentos.test.js`).

### BUG-12: bloqueio em lote sobre atendimentos agendados

- **Passos:** agendar um cliente às 14:00 em um dia; bloquear 14:00 em vários dias (por exemplo "Este mês").
- **Esperado:** o dia com o atendimento não é bloqueado e o usuário é avisado.
- **Obtido (antes):** o bloqueio era criado mesmo assim, e o atendimento ficava dentro de um horário bloqueado.
- **Causa:** `confirmarBloqueioLote` inseria os bloqueios sem consultar os registros existentes.
- **Correção:** o app busca agendamentos e bloqueios do período, separa as datas livres das ocupadas (`separarDatasBloqueio`, em `src/utils/bloqueio.js`), bloqueia só as livres e informa quantos dias e quais foram ignorados.
- **Verificação:** casos da seção 3.10 e `bloqueio.test.js`.

### BUG-13: erro ao trocar de tela por gesto ou menu

- **Passos:** com a navegação por páginas deslizáveis, arrastar de uma tela para outra ou tocar em uma aba do menu.
- **Esperado:** a tela muda e o destaque do menu acompanha.
- **Obtido (antes):** erro `Cannot convert undefined value to object` na linha do `onPageSelected`; o app abria normalmente e só falhava ao trocar de página.
- **Causa:** o código importava a lista `TELAS` de `src/constants.js`, mas a exportação não existia no arquivo (passo não aplicado ou não salvo), então o acesso `TELAS[posição]` falhava.
- **Correção:** exportar `TELAS` em `src/constants.js`, na mesma ordem do menu.
- **Verificação:** casos da seção 3.13.
- **Lição:** o erro só aparecia na interação, não ao abrir o app, o que reforça a necessidade de testar todos os fluxos de tela após mudanças de navegação.

### BUG-14: reagendamento sem modal

- **Passos:** cancelar um agendamento e tocar em "Cancelar e Reagendar".
- **Esperado:** abre o modal de reagendamento.
- **Obtido (antes):** o aviso de cancelamento fechava e nenhum modal abria.
- **Causa:** ao reorganizar o `App.js` para incluir o modal de edição, o `EditModal` ligado a `reagendandoItem` foi removido; só restou o da edição. Identificado em revisão do código (a função `dataLocal` continuava importada sem uso).
- **Correção:** restaurado o segundo `EditModal`, com `dadosCliente={reagendandoItem}` e `onSalvar={confirmarReagendamento}`.
- **Verificação:** caso 3 da seção 3.13 e caso 17 da seção 3.7.
- **Lição:** regressão de funcionalidade pré-existente causada por edição manual do arquivo principal; reforça a falta de testes de interface (seção 7).

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
| 19 | Home: formulário de agendamento | Sem campo de duração; botões de horário seguidos de "Contato & Valor" | ✅ |
| 20 | Criar agendamento completo | Salva e o formulário limpa | ✅ |
| 21 | Cancelar e Reagendar | Modal sem campo de duração; reagendamento funciona | ✅ |
| 22 | Banco após agendar | `carga_horaria` nulo no novo registro | ✅ |
| 23 | Busca por `duracao` e `setDuracao` no código | Nenhuma referência restante | ✅ |
| 24 | `npm test` após a remoção | Todas as suites passando | ✅ |

### 3.8 Limites de período dos relatórios (BUG-10)

Dados inseridos por SQL (o app não permite criar atendimentos no passado), todos com status `concluido`:

| Data e hora | Valor | Deve entrar no mês de outubro? |
|---|---|---|
| 2026-09-30 22:00 | R$ 800 | Não |
| 2026-10-01 10:00 | R$ 100 | Sim |
| 2026-10-31 23:00 | R$ 200 | Sim |
| 2026-11-01 10:00 | R$ 400 | Não |

| # | Cenário | Esperado | Resultado |
|---|---|---|---|
| 1 | Relatório mensal de outubro | R$ 300, igual à consulta SQL com `>= '2026-10-01' and < '2026-11-01'` | ✅ |
| 2 | Limites de mês e trimestre (incluindo virada de ano e fevereiro bissexto) | Início inclusivo e fim exclusivo corretos | ✅ Automatizado (`datas.test.js` e `trimestre.test.js`) |

### 3.9 Falhas de conexão ao concluir, cancelar e desbloquear (BUG-11)

| # | Cenário | Esperado | Resultado |
|---|---|---|---|
| 1 | Modo avião: concluir um atendimento | Alerta de erro; o modal continua e o atendimento continua pendente | ✅ |
| 2 | Modo avião: cancelar ("Só Cancelar") | Alerta de erro; o agendamento continua existindo | ✅ |
| 3 | Modo avião: desbloquear um horário | Alerta de erro; o bloqueio continua na timeline | ✅ |
| 4 | Com internet: concluir, cancelar e desbloquear | Funcionam normalmente | ✅ |
| 5 | Falha do banco em cada operação | Devolve erro em vez de fingir sucesso | ✅ Automatizado (`procedimentos.test.js`) |

### 3.10 Bloqueio em lote (BUG-12)

| # | Cenário | Esperado | Resultado |
|---|---|---|---|
| 1 | Cliente agendado às 14:00 em um dia; bloquear 14:00 em "Este mês" | Mensagem de sucesso, com o dia do agendamento listado como ignorado | ✅ |
| 2 | Conferir o dia ignorado na timeline | Sem bloqueio sobre o cliente | ✅ |
| 3 | Repetir o mesmo bloqueio em lote | "Nenhum dia foi bloqueado: todos já têm atendimento ou bloqueio" | ✅ |
| 4 | Lógica de separação de datas (hora cheia, formatos com espaço e com `T`, concluídos, listas vazias) | Datas livres e ignoradas corretas | ✅ Automatizado (`bloqueio.test.js`) |
| 5 | Inserção em lotes de 50, parando no primeiro erro | Lotes de 50, 50 e 20 para 120 registros | ✅ Automatizado (`procedimentos.test.js`) |

### 3.11 Edição de agendamentos

| # | Cenário | Esperado | Resultado |
|---|---|---|---|
| 1 | Home e Agenda (linha e lista): cada agendamento | Botões Concluir, Editar e Cancelar visíveis na mesma linha | ✅ |
| 2 | Editar: abrir o modal | Nome, tipo de corte, procedimento, telefone e valor preenchidos; data e horário marcados | ✅ |
| 3 | Mudar só o nome e salvar | Nome muda; horário e status continuam iguais | ✅ |
| 4 | Mudar o horário para um livre | Agendamento muda de lugar na agenda | ✅ |
| 5 | Horário ocupado ou bloqueado | Botão desabilitado | ✅ |
| 6 | Manter o próprio horário | Continua selecionável e salva | ✅ |
| 7 | Limpar o telefone e salvar | Salva; `telefone` nulo no banco | ✅ |
| 8 | Editar em modo avião | Alerta de erro; nada muda | ✅ |
| 9 | Editar agendamento criado com outro intervalo (por exemplo 14:20) | Horário original aparece como botão extra | ✅ |
| 10 | Atualização de dados no banco | Só os campos editados mudam; status não é alterado; telefone e valor convertidos | ✅ Automatizado (`edicao.test.js`) |

### 3.12 Atualização em tempo real (Supabase Realtime)

| # | Cenário | Esperado | Resultado |
|---|---|---|---|
| 1 | Inserir um agendamento direto no Table Editor do Supabase, com o app aberto | Aparece na Home em cerca de 1 segundo | ✅ |
| 2 | Apagar ou editar uma linha pelo painel | O app reflete a mudança | ✅ |
| 3 | Concluir um atendimento no app | Total do relatório atualiza | ✅ |
| 4 | Bloqueio em lote de um mês | A tela atualiza uma vez só, sem travar | ✅ |
| 5 | Minimizar o app, alterar algo pelo painel e voltar | Dados atualizados ao voltar | ✅ |
| 6 | Desligar o Wi-Fi e religar | Volta a atualizar em até 1 minuto | ✅ |
| 7 | Terminal do Expo | Sem mensagens `Realtime: CHANNEL_ERROR` | ✅ |

### 3.13 Navegação por gesto entre telas

| # | Cenário | Esperado | Resultado |
|---|---|---|---|
| 1 | Arrastar para a esquerda na Home | Vai para a Agenda e o destaque do menu acompanha, sem erro | ✅ |
| 2 | Continuar arrastando até Config | Passa por Clientes e Relatório, na ordem do menu | ✅ |
| 3 | Cancelar e Reagendar, depois do ajuste do BUG-14 | O modal de reagendamento abre | ✅ |
| 4 | Arrastar para a direita | Volta pela mesma ordem | ✅ |
| 5 | Tocar em uma aba do menu | Desliza até a tela e destaca a aba | ✅ |
| 6 | Arrastar para fora na primeira e na última tela | Nada acontece (sem loop) | ✅ |
| 7 | Rolar uma tela na vertical | Rolagem normal, sem trocar de tela | ✅ |
| 8 | Preencher parte do formulário da Home, ir a outra tela e voltar | O que foi digitado continua | ✅ |
| 9 | Digitar em um campo e arrastar | O teclado fecha e a tela troca | ✅ |
| 10 | Abrir Relatório arrastando | Os relatórios carregam como ao tocar no menu | ✅ |
| 11 | Usar modais (concluir, editar, bloquear em lote) | Funcionam; o gesto não troca a tela por baixo | ✅ |
| 12 | Modo escuro | Sem faixas ou cores estranhas entre as telas | ✅ |

### 3.14 Seleção do serviço por botões (cortar e pintar)

| # | Cenário | Esperado | Resultado |
|---|---|---|---|
| 1 | Home: campo de serviço | Dois grupos de botões, Cortar e Pintar, com Cabelo, Barba e Cabelo + barba | ✅ |
| 2 | Tocar em Cortar > Cabelo | Fica ativo; os outros do grupo ficam apagados | ✅ |
| 3 | Tocar em Pintar > Barba mantendo o corte | Os dois grupos ficam marcados ao mesmo tempo | ✅ |
| 4 | Tocar de novo na opção marcada | Desmarca | ✅ |
| 5 | Confirmar o agendamento | Salva; o cartão mostra `Corte de cabelo + Pintura de barba` | ✅ |
| 6 | Depois de salvar | Formulário limpa e nada fica marcado | ✅ |
| 7 | Agendar sem escolher serviço | Salva (campo opcional); cartão mostra "Procedimento não informado" | ✅ |
| 8 | Editar um agendamento novo | Botões já vêm marcados como estavam | ✅ |
| 9 | Editar um agendamento antigo (texto digitado, por exemplo `Degrade`) | Aparece "Serviço anterior mantido" e o texto continua ao salvar sem mexer | ✅ |
| 10 | Tocar em "toque para remover" e salvar | O serviço antigo some | ✅ |
| 11 | Cancelar e Reagendar | O modal abre com o serviço marcado | ✅ |
| 12 | Relatório > Serviços mais populares | Mostra os nomes novos (por exemplo, Corte de cabelo) | ✅ |
| 13 | Modo escuro | Botões legíveis | ✅ |
| 14 | Montagem e leitura do texto do serviço (todas as combinações de corte e pintura, ida e volta, texto antigo, nulos) | Texto montado e lido corretamente, sem perder partes antigas | ✅ Automatizado (`servico.test.js`) |

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
- **Serviço (procedimento):** campo de texto livre substituído por dois grupos de botões, Cortar e Pintar, cada um com Cabelo, Barba e Cabelo + barba; é possível marcar uma opção em cada grupo. O banco continua guardando o serviço como texto, montado pelo app (por exemplo, `Corte de cabelo + Pintura de barba`). Textos antigos digitados são preservados ao editar. A lógica está em `src/utils/procedimentos.js` (`montarProcedimento`, `lerProcedimento`) e é coberta por `servico.test.js`.
- **Duração:** campo removido da Home e do reagendamento, por ser desnecessário (nenhuma regra dependia dele; conflitos e horários usam apenas o intervalo da Config). A coluna `carga_horaria` foi mantida no banco para preservar o histórico: novos agendamentos gravam valor nulo e os antigos conservam o valor que tinham.

### 4.3 Edição de agendamentos

Os agendamentos pendentes passaram a ter o botão "Editar" (Home, Agenda em linha e em lista), que abre o mesmo modal do reagendamento com os dados preenchidos. A edição altera o registro existente (`atualizarAgendamento`), sem cancelar e recriar, e verifica conflito de horário ignorando o próprio agendamento.

### 4.4 Atualização por Realtime no lugar de polling

A consulta ao banco a cada 5 segundos foi substituída pelo Supabase Realtime: o app é avisado quando a tabela `Procedimentos` muda e atualiza em seguida (com agrupamento de eventos de 400 ms). Como reforço, atualiza ao voltar para o app e a cada 60 segundos. Requer que a tabela esteja na publicação `supabase_realtime`.

### 4.5 Navegação por gesto

As telas (Início, Agenda, Clientes, Relatório e Config) passaram a ficar em páginas deslizáveis (`react-native-pager-view`). É possível arrastar para o lado para trocar de tela, e o menu superior continua funcionando e acompanha a tela atual. Todas as telas ficam montadas, preservando o que foi digitado ao navegar. A ordem das telas está em `TELAS` (`src/constants.js`).

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

-- Serviços gravados (nomes montados pelos botões e textos antigos)
select nome_procedimento, count(*) from "Procedimentos" group by 1 order by 2 desc;

-- Valores de tipo de corte em uso
select tipo_corte, count(*) from "Procedimentos" group by tipo_corte;

-- Total do mês, para comparar com o relatório do app (BUG-10)
select sum(valor) from "Procedimentos"
where status = 'concluido'
  and horario_atendimento >= '2026-10-01' and horario_atendimento < '2026-11-01';

-- Tabelas publicadas no Realtime
select tablename from pg_publication_tables where pubname = 'supabase_realtime';

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

Executar com `npm test`. Última execução: 14 suites passando.

| Arquivo | Cobre | Pontos principais |
|---|---|---|
| `horario.test.js` | `normalizarHorario` | zero à esquerda, limites 00:00 e 23:59, espaços, 24:00, 12:60, texto, vazio e nulo |
| `formatadores.test.js` | `formatarContagem` | "Agora!", minutos e segundos, horas, arredondamento de milissegundos |
| `datas.test.js` | `formatarData`, `normalizarData`, `dataLocal`, `proximoDia`, `limitesMes` | formatos com espaço e com `T`, dia local à noite, virada de mês e de ano, fevereiro bissexto, regressão dos limites do mês |
| `trimestre.test.js` | `trimestreAtual`, `labelTrimestre`, `limitesTrimestre` | todos os meses, limites dos quatro trimestres, regressão do primeiro dia do período, relógio simulado |
| `servicos.test.js` | `agruparServicos` | caso do `degrade`, receita só de concluídos, espaços, nulos, ordenação, limite |
| `conversoes.test.js` | `telefoneParaNumero`, `valorParaNumero` | máscara, vírgula, "R$", separador de milhar, vazio, nulo e texto |
| `agendamentos.test.js` | `gravarAgendamento` | telefone e valor nulos, conversões, status pendente, falha do banco (cliente simulado) |
| `slots.test.js` | `gerarSlots`, `horaDeRegistro` | intervalos de 30, 45 e 60 min, intervalo inválido, formatos de data com espaço e com `T` |
| `conflito.test.js` | `encontrarConflito` | horário exato, bloqueio por hora inteira, horas com e sem zero, listas vazias |
| `desabilitados.test.js` | `calcularDesabilitados` | ocupados, bloqueios, `ignorarId` no reagendamento, horários passados de hoje, outras datas |
| `bloqueio.test.js` | `separarDatasBloqueio` | dia com agendamento ignorado, bloqueio existente, concluído não impede, hora sem zero, todas ocupadas |
| `procedimentos.test.js` | `concluirProcedimento`, `removerProcedimento`, `inserirBloqueios` | registro certo, erro do banco devolvido, lotes de 50, parada no primeiro erro, lista vazia |
| `servico.test.js` | `montarProcedimento`, `lerProcedimento` | cada opção de corte e pintura, combinações, ida e volta de todas as combinações, textos antigos preservados, mesmo grupo repetido, vazio e nulo |
| `edicao.test.js` | `atualizarAgendamento` | atualiza só o id informado, conversões, nulos, campos enviados, erro do banco |

---

## 7. Melhorias futuras de qualidade

- Testes de interface com React Native Testing Library (formulário da Home, modais, seletores).
- Teste de integração para `salvar` (evitaria regressões como o BUG-09).
- Teste automatizado da navegação e da abertura dos modais (teria detectado o BUG-14).
- Somar, no relatório de serviços populares, combinações como "Corte de cabelo" e "Corte de cabelo + Pintura de barba" por tipo de serviço (hoje cada texto é uma linha separada).
- Se o salão passar a precisar de atendimentos com durações diferentes, reintroduzir a duração e considerá-la na regra de conflito (hoje cada agendamento ocupa apenas o seu horário).
- Migrar `horario_atendimento` para `timestamp` e `telefone` para `text`.
- Tratar também as falhas das consultas de leitura (`buscar` e os relatórios apenas registram o erro no console).
- Autenticação com Supabase Auth e políticas RLS por usuário.
- Pipeline de CI (GitHub Actions) rodando `npm test` a cada push.

---

## 8. Observação sobre desempenho

- **Sintoma:** no Expo Go, ações simples demoravam, por exemplo cerca de 2 segundos para o modo claro/escuro ter efeito.
- **Hipóteses investigadas:** (1) buscas ao banco disparadas ao trocar tema ou data, (2) telas ocultas sendo redesenhadas por causa das páginas deslizáveis, (3) três consultas em sequência na função de busca.
- **Medição:** o mesmo código foi executado nos dois modos do Expo Go.

| Modo | Comando | Resultado |
|---|---|---|
| Desenvolvimento (padrão) | `npx expo start --tunnel -c` | Atraso grande ao trocar o tema |
| Sem desenvolvimento, minificado | `npx expo start --tunnel -c --no-dev --minify` | Atraso imperceptível |

- **Conclusão:** o atraso vem do modo de desenvolvimento do Expo Go (verificações extras e ausência de otimizações), não do código do app. Nenhuma alteração de código foi necessária; a tentativa de reduzir redesenhos das telas ocultas (componente `Pagina`) foi descartada.
- **Decisão de teste:** os testes de desempenho e de uso corrente passam a ser feitos com `--no-dev --minify`, por meio do script `rapido` do `package.json` (`"rapido": "expo start --tunnel -c --no-dev --minify"`), executado com `npm run rapido`.
- **Contrapartida:** nesse modo as telas de erro e os avisos do React não aparecem (foi a tela de erro que revelou os BUG-09 e BUG-13). Por isso, antes de fechar cada etapa, os fluxos também devem ser percorridos no modo normal.
- **Ponto ainda em aberto:** a busca completa ao banco ao trocar tema ou tocar em um dia (`useEffect` com `[dataHome, dataAgenda, dark]`) é desnecessária e pode ser removida como otimização de consumo de dados e bateria.