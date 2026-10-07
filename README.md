# TCC Cabeleireiro

Aplicativo mobile (React Native + Expo + Supabase) para agendamento em salão de cabeleireiro.

## Como rodar
1. Copie `.env.example` para `.env` e preencha com a URL e a chave do Supabase.
2. `npm install`
3. `npx expo start`

## Limitações conhecidas
- O app não possui autenticação. As políticas RLS permitem acesso total ao papel `anon`.
  Melhoria futura: Supabase Auth com políticas por usuário.