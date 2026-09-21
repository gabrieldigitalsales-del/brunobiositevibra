# Bruno Teixeira — Vibra Soluções

Biosite em React + Vite + TypeScript com painel administrativo e Supabase.

## Supabase

O projeto usa o Supabase já existente. **Não crie outro projeto Supabase.**

Objetos exclusivos:
- `vibra_biosite_content`
- `vibra_biosite_admin_config`
- `vibra_biosite_admin_sessions`
- schema privado `vibra_biosite_private`
- bucket `vibra-biosite-media`
- Edge Function `vibra-biosite-upload`

Variáveis do frontend:
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Painel administrativo

Produção:
```text
https://brunovibrasolucoes.vercel.app/?admin=1
```

O login usa senha protegida por hash no Supabase, sessões temporárias e limitação de tentativas. A senha **não deve ser escrita no repositório**.

A aba **Segurança** do painel permite trocar a senha. Após trocar a senha, outras sessões administrativas são invalidadas.

## Imagens

Novos uploads realizados pelo painel são otimizados no navegador e enviados para o bucket `vibra-biosite-media`. O JSON do conteúdo guarda somente a URL da imagem.

Imagens antigas já salvas como Base64 continuam compatíveis e podem ser substituídas gradualmente pelo painel.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

A pasta `dist` é gerada pelo build e não deve ser versionada.

## Produção

Domínio atual:
`https://brunovibrasolucoes.vercel.app/`
