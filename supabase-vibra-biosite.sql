-- ============================================================
-- VIBRA BIOSITE — BANCO EXCLUSIVO
-- Execute este arquivo uma única vez no SQL Editor do Supabase.
-- Todos os objetos usam o prefixo vibra_biosite_ para não misturar projetos.
-- Senha administrativa inicial: definida abaixo conforme solicitado.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.vibra_biosite_content (
  id smallint primary key default 1 check (id = 1),
  content jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.vibra_biosite_admin_config (
  id smallint primary key default 1 check (id = 1),
  password_hash text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.vibra_biosite_admin_sessions (
  token uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 hours')
);

insert into public.vibra_biosite_content (id, content)
values (1, null)
on conflict (id) do nothing;

insert into public.vibra_biosite_admin_config (id, password_hash)
values (1, crypt('asd123', gen_salt('bf', 10)))
on conflict (id) do update
set password_hash = excluded.password_hash,
    updated_at = now();

alter table public.vibra_biosite_content enable row level security;
alter table public.vibra_biosite_admin_config enable row level security;
alter table public.vibra_biosite_admin_sessions enable row level security;

revoke all on public.vibra_biosite_admin_config from anon, authenticated;
revoke all on public.vibra_biosite_admin_sessions from anon, authenticated;
revoke insert, update, delete on public.vibra_biosite_content from anon, authenticated;
grant select on public.vibra_biosite_content to anon, authenticated;

create policy "vibra_biosite_public_read"
on public.vibra_biosite_content
for select
to anon, authenticated
using (id = 1);

create or replace function public.vibra_biosite_admin_login(p_password text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_token uuid;
begin
  select password_hash into v_hash
  from public.vibra_biosite_admin_config
  where id = 1;

  if v_hash is null or crypt(coalesce(p_password, ''), v_hash) <> v_hash then
    return null;
  end if;

  delete from public.vibra_biosite_admin_sessions
  where expires_at <= now();

  insert into public.vibra_biosite_admin_sessions default values
  returning token into v_token;

  return v_token;
end;
$$;

create or replace function public.vibra_biosite_save_content(
  p_token uuid,
  p_content jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.vibra_biosite_admin_sessions
    where token = p_token
      and expires_at > now()
  ) then
    raise exception 'Sessão administrativa inválida ou expirada.';
  end if;

  insert into public.vibra_biosite_content (id, content, updated_at)
  values (1, p_content, now())
  on conflict (id) do update
  set content = excluded.content,
      updated_at = now();
end;
$$;

create or replace function public.vibra_biosite_change_password(
  p_token uuid,
  p_new_password text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.vibra_biosite_admin_sessions
    where token = p_token
      and expires_at > now()
  ) then
    raise exception 'Sessão administrativa inválida ou expirada.';
  end if;

  if length(coalesce(p_new_password, '')) < 6 then
    raise exception 'A nova senha precisa ter pelo menos 6 caracteres.';
  end if;

  update public.vibra_biosite_admin_config
  set password_hash = crypt(p_new_password, gen_salt('bf', 10)),
      updated_at = now()
  where id = 1;

  delete from public.vibra_biosite_admin_sessions
  where token <> p_token;
end;
$$;

revoke all on function public.vibra_biosite_admin_login(text) from public;
revoke all on function public.vibra_biosite_save_content(uuid, jsonb) from public;
revoke all on function public.vibra_biosite_change_password(uuid, text) from public;

grant execute on function public.vibra_biosite_admin_login(text) to anon, authenticated;
grant execute on function public.vibra_biosite_save_content(uuid, jsonb) to anon, authenticated;
grant execute on function public.vibra_biosite_change_password(uuid, text) to anon, authenticated;

comment on table public.vibra_biosite_content is 'Conteúdo exclusivo do biosite Bruno Teixeira / Vibra Soluções.';
comment on table public.vibra_biosite_admin_config is 'Configuração protegida do acesso administrativo do biosite.';
comment on table public.vibra_biosite_admin_sessions is 'Sessões temporárias do painel administrativo do biosite.';
