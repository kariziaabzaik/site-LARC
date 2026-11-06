-- =====================================================
-- LARC UFPE: ATUALIZAÇÃO do banco (v2)
-- Rode no Supabase em: SQL Editor > New query > Run
-- Pode rodar sobre o banco atual: não apaga nada e pode ser repetido.
-- =====================================================

-- 1) Projetos: link oficial e novas categorias (congresso | planta | apresentacao)
alter table projects add column if not exists official_url text;
alter table projects alter column category set default 'congresso';

-- Projetos antigos (robotica/controle/automacao) passam para "Plantas Didáticas".
-- Depois você pode mudar a categoria de cada um pelo painel.
update projects set category = 'planta' where category in ('robotica', 'controle', 'automacao');

-- 2) Fotos da galeria (várias por projeto)
create table if not exists project_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  image_url text not null,
  caption text,
  created_at timestamptz default now()
);

-- 3) Arquivos para download (banner, slides, artigo...)
create table if not exists project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  kind text not null default 'outro',          -- banner | slides | artigo | outro
  file_url text not null,
  created_at timestamptz default now()
);

-- 4) Segurança: qualquer visitante LÊ; só usuário logado ESCREVE
alter table project_photos enable row level security;
alter table project_files  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['project_photos','project_files'] loop
    execute format('drop policy if exists "leitura publica" on %I', t);
    execute format('drop policy if exists "escrita admin" on %I', t);
    execute format('create policy "leitura publica" on %I for select using (true)', t);
    execute format('create policy "escrita admin" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;
