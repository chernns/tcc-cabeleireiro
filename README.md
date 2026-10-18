# TCC Cabeleireiro

Aplicativo mobile para gestão de agendamentos de um salão de cabeleireiro, desenvolvido como Trabalho de Conclusão de Curso.

## Funcionalidades

- Agendamento de clientes com data, horário, tipo de corte, serviço e valor
- Horários escolhidos por botões, gerados a partir do horário de funcionamento e do intervalo configurado (mínimo de 15 minutos); horários ocupados, bloqueados ou já passados ficam indisponíveis
- Bloqueio de conflitos (horário já ocupado ou bloqueado)
- Agenda com visualização em linha do tempo ou lista
- Bloqueio de horários, individual ou em lote (vários dias); o lote ignora dias que já têm atendimento ou bloqueio e informa quais foram ignorados
- Concluir, editar, cancelar e reagendar atendimentos, com aviso de erro quando a operação não é gravada
- Atualização em tempo real (Supabase Realtime): mudanças no banco aparecem no app sem precisar recarregar
- Navegação por gesto: além do menu superior, dá para arrastar para o lado para trocar de tela
- Cadastro automático de clientes a partir dos atendimentos, com envio de lembrete por WhatsApp
- Relatórios financeiros (gráfico de receita, serviços mais populares, relatórios mensal e trimestral)
- Modo claro e escuro, horário de funcionamento e mensagem de lembrete configuráveis

## Tecnologias

- React Native + Expo
- Supabase (PostgreSQL)
- Jest (testes automatizados)

## Como rodar

1. Instale Node.js (LTS) e o app **Expo Go** no celular.
2. Clone o repositório e instale as dependências:
   ```bash
   npm install
   ```
3. Copie `.env.example` para `.env` e preencha com a URL e a chave pública do seu projeto Supabase:
   ```
   EXPO_PUBLIC_SUPABASE_URL=
   EXPO_PUBLIC_SUPABASE_KEY=
   ```
4. Inicie o app e escaneie o QR code com o Expo Go:
   ```bash
   npx expo start -c
   ```
   Se o celular ficar parado em "Bundling" ou aparecer "Packager is not running" (redes que isolam os dispositivos ou firewall), use o túnel:
   ```bash
   npx expo start --tunnel -c
   ```

### Desempenho no Expo Go

No Expo Go, o modo de desenvolvimento (padrão) deixa o app visivelmente mais lento: ações simples, como trocar entre modo claro e escuro, chegaram a levar quase 2 segundos. Para medir o desempenho real, inicie sem o modo de desenvolvimento e com o código minificado:

```bash
npx expo start --tunnel -c --no-dev --minify
```

O projeto traz esse comando como atalho no `package.json`:

```bash
npm run rapido
```

Nesse modo o atraso é imperceptível. Em contrapartida, ele esconde as telas de erro e os avisos do React, então, durante o desenvolvimento, vale alternar com o modo normal para depurar.

### Banco de dados

O app usa três tabelas no Supabase: `Procedimentos`, `Relatorios` e `Relatorio_Tri`. É necessário habilitar o RLS e criar políticas de acesso para o papel `anon` (veja "Limitações conhecidas") e incluir a tabela `Procedimentos` na publicação do Realtime:

```sql
alter publication supabase_realtime add table "Procedimentos";
```

## Como testar

```bash
npm test
```

Os testes automatizados (13 suites) cobrem as funções puras em `src/utils/` (horário, datas e limites de período, trimestres, formatação, agrupamento de serviços, conversões, geração de horários, conflitos, horários indisponíveis e bloqueio em lote) e as operações de gravação em `src/services/` (agendar, editar, concluir, remover e bloquear), com o banco simulado. Os fluxos de interface e de banco foram testados manualmente; os casos estão documentados em [`docs/casos-de-teste.md`](docs/casos-de-teste.md).

## Estrutura do projeto

```
App.js                estado, lógica de banco, navbar e modais
src/
  components/         calendário, modais, cards e demais componentes
  screens/            Home, Agenda, Clientes, Relatório, Config
  services/           cliente Supabase, consulta de conflitos e operações de gravação
  utils/              horário, datas, trimestre, formatadores, serviços, conversões, slots, conflito
  theme.js            temas claro e escuro
  constants.js
__tests__/            testes automatizados (Jest)
docs/                 documentação de testes
```

## Qualidade e testes

Durante o desenvolvimento foram encontrados e corrigidos vários defeitos, todos documentados com passos para reproduzir, causa e correção em [`docs/casos-de-teste.md`](docs/casos-de-teste.md). Entre eles: agrupamento de serviços sensível a maiúsculas e acentos, erro no envio por WhatsApp causado por incompatibilidade de tipo entre banco e app, validação de horário ausente, risco de perda de dados ao reagendar, agendamentos duplicados, falha silenciosa ao gravar campos opcionais vazios, limites de período dos relatórios errados por causa do fuso horário, operações que fingiam sucesso quando o banco falhava, bloqueio em lote sobre atendimentos já agendados, um defeito visual no calendário e regressões de navegação detectadas em teste.

## Limitações conhecidas

- **Sem autenticação.** As políticas RLS liberam acesso total ao papel `anon`, e o linter do Supabase aponta isso como aviso. Melhoria futura: Supabase Auth com políticas por usuário.
- **`horario_atendimento` é texto** (`varchar`) e existem dois formatos (`2026-10-07 10:00` e `2026-10-07T10:00:00`). Melhoria futura: migrar para `timestamp`.
- **`telefone` é `bigint`**, o que descarta zeros à esquerda. Melhoria futura: usar `text`.
- **Gesto sobre o calendário:** um arraste horizontal sobre o calendário troca de tela em vez de mudar o mês; para mudar de mês, use as setas.
- **Realtime depende da publicação** `supabase_realtime`; se a conexão com o canal cair, o app se atualiza ao voltar para o primeiro plano e a cada 60 segundos.
- **Sem duração de atendimento:** cada agendamento ocupa apenas o seu horário na grade definida pelo intervalo configurado, e um atendimento longo não impede agendar nos horários seguintes. Bloqueios, por outro lado, valem para a hora inteira.

## Autor

Arthur Henrique da Silva Gomes — [LinkedIn](https://www.linkedin.com/in/arthur-henrique-da-silva-gomes-07a499298/) · [GitHub](https://github.com/chernns)