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
| BUG-06 | Relatórios não são regenerados após limpar o banco nem atualizados quando o total muda | Lógica / estado local | Média | 🐞 Causa confirmada; ver observação |
| SEC-01 | Chave do Supabase e URL escritas no código-fonte | Segurança | Alta | 🐞 Corrigido (variáveis de ambiente) |
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
- **Verificação:** WhatsApp abriu com o número `+55` + DDD + número e a mensagem com `{nome}` substituído. Cliente sem telefone exibe alerta.

### BUG-03: validação de horário e de data

- **Passos:** informar horários inválidos na Home e no reagendamento.
- **Obtido (antes):** qualquer texto era aceito; sem data selecionada, o registro era salvo como `" 14:30"`.
- **Causa:** a validação só verificava se o texto não estava vazio.
- **Correção:** função `normalizarHorario` (aceita `H:M`, devolve `HH:MM`, rejeita o restante) e validação de data e nome. A validação do reagendamento acontece dentro do modal.
- **Verificação:** casos 1 a 9 da seção 3.1 e testes automatizados (`horario.test.js`).

### BUG-04: reagendar apagava o agendamento original antes de validar

- **Passos:** cancelar > "Cancelar e Reagendar" > informar horário inválido ou ocupado.
- **Obtido (antes):** o agendamento original já havia sido apagado e o novo era recusado, resultando em perda do cliente.
- **Causa:** a ordem das operações em `confirmarReagendamento` (apagar, depois salvar).
- **Correção:** validar horário e conflito antes de apagar; só então apagar o original e salvar o novo.
- **Verificação:** caso 6 da seção 3.2 (o original continua existindo após recusa).

### BUG-05: agendamentos duplicados e em horário bloqueado

- **Passos:** agendar duas vezes no mesmo horário; bloquear um horário e tentar agendar nele.
- **Obtido (antes):** ambos eram aceitos.
- **Causa:** `salvar` não consultava agendamentos existentes nem bloqueios.
- **Correção:** `buscarConflito` consulta registros `pendente` e `bloqueado` do dia e compara a hora cheia.
- **Verificação:** casos 1 a 8 da seção 3.2 e consulta SQL de duplicidade (zero linhas).

### BUG-06: relatórios não eram gerados

- **Sintoma:** tabelas `Relatorios` e `Relatorio_Tri` vazias com o app aberto.
- **Causa confirmada:** o app guarda no AsyncStorage a chave do último período gerado e, quando ela coincide com o período atual, pula a geração. Após esvaziar as tabelas no banco, o celular continuava "lembrando" que o relatório já existia.
- **Defeito de lógica relacionado:** com essa trava, o total do mês é gravado uma única vez e nunca atualizado, contradizendo o aviso da tela (atualização automática).
- **Correção proposta:** remover a trava, gravar somente quando o total mudar e registrar erros no console. **Confirmar no repositório se foi aplicada antes de marcar como encerrado.**

### SEC-01: credenciais no código

- **Achado:** URL e chave do Supabase escritas diretamente no código (e expostas no editor online usado inicialmente).
- **Ação:** movidas para variáveis de ambiente (`.env`, ignorado pelo Git; `.env.example` versionado), chave anterior substituída.
- **Verificação:** `git check-ignore -v .env` confirma que o arquivo é ignorado; `git status` não lista `.env`.

### SEC-02: avisos do linter do Supabase

- **Achado:** 12 avisos (`rls_policy_always_true` e `pg_graphql_*`). Parte vinha de políticas antigas redundantes (removidas).
- **Decisão:** os avisos restantes são aceitos porque o app não tem autenticação e precisa que o papel `anon` leia e grave. Revogar o `SELECT` do `anon` quebraria o app.
- **Melhoria futura:** Supabase Auth com políticas por usuário.

---

## 3. Casos de teste manuais

### 3.1 Validação de horário e data (BUG-03)

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

| # | Cenário | Esperado | Resultado |
|---|---|---|---|
| 1 | Agendar às 10:00 em horário livre | Salva | ✅ |
| 2 | Agendar às 10:00 novamente no mesmo dia | Alerta de conflito | ✅ |
| 3 | Agendar às 10:30 (mesma hora cheia de um agendamento às 10:00) | Alerta de conflito | ✅ |
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
| 2 | Cliente sem telefone | Alerta "Este cliente não tem telefone cadastrado." | A registrar |

### 3.5 Regressão após refatoração

Após dividir o `App.js` em componentes, telas, serviços e utilitários, todas as telas e fluxos foram testados novamente: Início, Agenda (linha e lista), Clientes, Relatório (abas mensal e trimestral), Configurações, concluir, cancelar, reagendar, bloqueio individual e em lote. Resultado: ✅ sem diferenças em relação ao comportamento anterior.

---

## 4. Consultas SQL de verificação

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

## 5. Testes automatizados (Jest)

Executar com `npm test`.

| Arquivo | Cobre | Pontos principais |
|---|---|---|
| `horario.test.js` | `normalizarHorario` | zero à esquerda, limites 00:00 e 23:59, espaços, 24:00, 12:60, texto, vazio e nulo |
| `formatadores.test.js` | `formatarContagem` | "Agora!", minutos e segundos, horas, arredondamento de milissegundos |
| `datas.test.js` | `formatarData`, `normalizarData` | formatos com espaço e com `T`, valores vazios |
| `trimestre.test.js` | `trimestreAtual`, `labelTrimestre`, `rangeTrimestrre` | todos os meses, início e fim dos trimestres, relógio simulado |
| `servicos.test.js` | `agruparServicos` | caso do `degrade`, receita só de concluídos, espaços, nulos, ordenação, limite |

---

## 6. Melhorias futuras de qualidade

- Testes de interface com React Native Testing Library (formulário da Home, modais).
- Testes de integração do fluxo de agendamento com banco de teste.
- Migrar `horario_atendimento` para `timestamp` e `telefone` para `text`.
- Autenticação com Supabase Auth e políticas RLS por usuário.
- Pipeline de CI (GitHub Actions) rodando `npm test` a cada push.