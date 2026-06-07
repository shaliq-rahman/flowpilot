create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  file_path text not null,
  file_type text not null,
  file_size bigint not null default 0,
  created_at timestamptz not null default now()
);
create index idx_documents_project_id on public.documents(project_id);
