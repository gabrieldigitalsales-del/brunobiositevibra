# Bruno Teixeira — Vibra Soluções

Biosite em React + Vite + TypeScript com painel administrativo e Supabase.

## 1. Configurar o Supabase

1. Crie ou abra o projeto correto no Supabase.
2. Abra **SQL Editor**.
3. Execute todo o arquivo `supabase-vibra-biosite.sql` de uma vez.
4. Em **Project Settings > API**, copie a URL e a chave `anon public`.
5. Duplique `.env.example` com o nome `.env` e preencha:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

As tabelas e funções usam exclusivamente o prefixo `vibra_biosite_`.

## 2. Rodar

```bash
npm install
npm run dev
```

## 3. Painel administrativo

Abra:

```text
http://localhost:5173/?admin=1
```

O acesso utiliza somente senha. O campo não mostra nem preenche a senha automaticamente.

## 4. Produção

```bash
npm run build
npm run preview
```

A pasta gerada para publicação é `dist`.

## Observação sobre imagens

As imagens escolhidas no painel são convertidas para dados e salvas junto ao conteúdo no Supabase. Para imagens de site, prefira arquivos JPG/WebP otimizados para evitar conteúdo excessivamente pesado.
