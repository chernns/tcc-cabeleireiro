# TCC Cabeleireiro

Aplicativo mobile para gestão de agendamentos de um salão de cabeleireiro, desenvolvido como Trabalho de Conclusão de Curso.

## Funcionalidades

- Agendamento de clientes com data, horário, tipo de corte, serviço e valor
- Horários escolhidos por botões, gerados a partir do horário de funcionamento e do intervalo configurado (mínimo de 15 minutos); horários ocupados, bloqueados ou já passados ficam indisponíveis
- Bloqueio de conflitos (horário já ocupado ou bloqueado)
- Agenda com visualização em linha do tempo ou lista
- Bloqueio de horários, individual ou em lote (vários dias)
- Concluir, cancelar e reagendar atendimentos
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

### Banco de dados

O app usa três tabelas no Supabase: `Procedimentos`, `Relatorios` e `Relatorio_Tri`. É necessário habilitar o RLS e criar políticas de acesso para o papel `anon` (veja "Limitações conhecidas").

## Como testar

```bash
npm test
```

Os testes automatizados (10 suites) cobrem as funções puras em `src/utils/` (horário, datas, trimestres, formatação, agrupamento de serviços, conversões, geração de horários, conflitos e horários indisponíveis) e a gravação de agendamentos, com o banco simulado. Os fluxos de interface e de banco foram testados manualmente; os casos estão documentados em [`docs/casos-de-teste.md`](docs/casos-de-teste.md).

## Estrutura do projeto

```
App.js                estado, lógica de banco, navbar e modais
src/
  components/         calendário, modais, cards e demais componentes
  screens/            Home, Agenda, Clientes, Relatório, Config
  services/           cliente Supabase e consulta de conflitos
  utils/              horário, datas, trimestre, formatadores, serviços, conversões, slots, conflito
  theme.js            temas claro e escuro
  constants.js
__tests__/            testes automatizados (Jest)
docs/                 documentação de testes
```

## Qualidade e testes

Durante o desenvolvimento foram encontrados e corrigidos vários defeitos, todos documentados com passos para reproduzir, causa e correção em [`docs/casos-de-teste.md`](docs/casos-de-teste.md). Entre eles: agrupamento de serviços sensível a maiúsculas e acentos, erro no envio por WhatsApp causado por incompatibilidade de tipo entre banco e app, validação de horário ausente, risco de perda de dados ao reagendar, agendamentos duplicados, falha silenciosa ao gravar campos opcionais vazios e um defeito visual no calendário.

## Limitações conhecidas

- **Sem autenticação.** As políticas RLS liberam acesso total ao papel `anon`, e o linter do Supabase aponta isso como aviso. Melhoria futura: Supabase Auth com políticas por usuário.
- **`horario_atendimento` é texto** (`varchar`) e existem dois formatos (`2026-10-07 10:00` e `2026-10-07T10:00:00`). Melhoria futura: migrar para `timestamp`.
- **`telefone` é `bigint`**, o que descarta zeros à esquerda. Melhoria futura: usar `text`.
- **Atualização por polling** a cada 5 segundos. Melhoria futura: Supabase Realtime.
- **Sem duração de atendimento:** cada agendamento ocupa apenas o seu horário na grade definida pelo intervalo configurado, e um atendimento longo não impede agendar nos horários seguintes. Bloqueios, por outro lado, valem para a hora inteira.
- Os intervalos de relatório usam `toISOString()` (UTC) contra uma coluna de texto, o que pode deixar atendimentos noturnos do último dia do período fora do total.

## Autor

Seu Nome — [LinkedIn](https://linkedin.com/in/seu-perfil) · [GitHub](https://github.com/seu-usuario)