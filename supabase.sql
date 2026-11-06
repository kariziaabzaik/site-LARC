-- =====================================================
-- LARC UFPE: banco de dados do site
-- Cole tudo no Supabase em: SQL Editor > New query > Run
-- =====================================================

create table projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'robotica',   -- robotica | controle | automacao
  description text,
  image_url text,
  created_at timestamptz default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  location text,
  is_deadline boolean default false            -- true = prazo (destaque com borda branca)
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_url text not null,
  created_at timestamptz default now()
);

create table team (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  position int default 0,                      -- ordem de exibição (menor aparece primeiro)
  photo_url text
);

-- Segurança (RLS): qualquer visitante LÊ; só usuário logado ESCREVE
alter table projects  enable row level security;
alter table events    enable row level security;
alter table documents enable row level security;
alter table team      enable row level security;

do $$
declare t text;
begin
  foreach t in array array['projects','events','documents','team'] loop
    execute format('create policy "leitura publica" on %I for select using (true)', t);
    execute format('create policy "escrita admin" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Armazenamento de imagens e PDFs (bucket público "liga")
insert into storage.buckets (id, name, public) values ('liga', 'liga', true)
on conflict (id) do nothing;

create policy "liga leitura"  on storage.objects for select using (bucket_id = 'liga');
create policy "liga envio"    on storage.objects for insert to authenticated with check (bucket_id = 'liga');
create policy "liga edicao"   on storage.objects for update to authenticated using (bucket_id = 'liga');
create policy "liga exclusao" on storage.objects for delete to authenticated using (bucket_id = 'liga');
