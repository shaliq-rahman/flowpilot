-- Extensions
create extension if not exists "uuid-ossp";

-- Enums
create type project_status as enum ('planning','active','on_hold','completed','cancelled');
create type task_status as enum ('backlog','todo','in_progress','in_review','done','cancelled');
create type task_priority as enum ('low','medium','high','urgent');
create type member_role as enum ('owner','admin','member','viewer');
create type milestone_status as enum ('upcoming','at_risk','completed','missed');

-- ─── TABLES (all created before any RLS policies) ──────────────────────────

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  full_name    text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.projects (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  description     text,
  status          project_status not null default 'planning',
  start_date      date,
  end_date        date,
  completion_pct  numeric(5,2) not null default 0 check (completion_pct >= 0 and completion_pct <= 100),
  color           text default '#6366f1',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.project_members (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        member_role not null default 'member',
  joined_at   timestamptz not null default now(),
  unique (project_id, user_id)
);

create table public.tasks (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  assignee_id     uuid references public.profiles(id) on delete set null,
  title           text not null,
  description     text,
  status          task_status not null default 'todo',
  priority        task_priority not null default 'medium',
  due_date        date,
  start_date      date,
  completion_pct  numeric(5,2) not null default 0 check (completion_pct >= 0 and completion_pct <= 100),
  estimated_hours numeric(6,2),
  actual_hours    numeric(6,2),
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.milestones (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  title        text not null,
  description  text,
  due_date     date not null,
  status       milestone_status not null default 'upcoming',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── RLS (enable + policies, after all tables exist) ───────────────────────

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.milestones enable row level security;

-- profiles
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- projects
create policy "Members can view projects" on public.projects for select
  using (owner_id = auth.uid() or exists (
    select 1 from public.project_members pm where pm.project_id = projects.id and pm.user_id = auth.uid()
  ));
create policy "Owners can insert projects" on public.projects for insert with check (owner_id = auth.uid());
create policy "Owners and admins can update projects" on public.projects for update
  using (owner_id = auth.uid() or exists (
    select 1 from public.project_members pm where pm.project_id = projects.id and pm.user_id = auth.uid() and pm.role in ('owner','admin')
  ));
create policy "Owners can delete projects" on public.projects for delete using (owner_id = auth.uid());

-- project_members
create policy "Members can view project membership" on public.project_members for select
  using (user_id = auth.uid());
create policy "Owners and admins can manage members" on public.project_members for all
  using (exists (
    select 1 from public.projects p where p.id = project_members.project_id
      and (p.owner_id = auth.uid() or exists (
        select 1 from public.project_members pm3 where pm3.project_id = p.id and pm3.user_id = auth.uid() and pm3.role in ('owner','admin')
      ))
  ));

-- tasks
create policy "Project members can view tasks" on public.tasks for select
  using (exists (
    select 1 from public.projects p where p.id = tasks.project_id
      and (p.owner_id = auth.uid() or exists (
        select 1 from public.project_members pm where pm.project_id = p.id and pm.user_id = auth.uid()
      ))
  ));
create policy "Project members can insert tasks" on public.tasks for insert
  with check (exists (
    select 1 from public.projects p where p.id = tasks.project_id
      and (p.owner_id = auth.uid() or exists (
        select 1 from public.project_members pm where pm.project_id = p.id and pm.user_id = auth.uid() and pm.role in ('owner','admin','member')
      ))
  ));
create policy "Project members can update tasks" on public.tasks for update
  using (exists (
    select 1 from public.projects p where p.id = tasks.project_id
      and (p.owner_id = auth.uid() or exists (
        select 1 from public.project_members pm where pm.project_id = p.id and pm.user_id = auth.uid() and pm.role in ('owner','admin','member')
      ))
  ));
create policy "Owners and admins can delete tasks" on public.tasks for delete
  using (exists (
    select 1 from public.projects p where p.id = tasks.project_id
      and (p.owner_id = auth.uid() or exists (
        select 1 from public.project_members pm where pm.project_id = p.id and pm.user_id = auth.uid() and pm.role in ('owner','admin')
      ))
  ));

-- milestones
create policy "Project members can view milestones" on public.milestones for select
  using (exists (
    select 1 from public.projects p where p.id = milestones.project_id
      and (p.owner_id = auth.uid() or exists (
        select 1 from public.project_members pm where pm.project_id = p.id and pm.user_id = auth.uid()
      ))
  ));
create policy "Project members can manage milestones" on public.milestones for all
  using (exists (
    select 1 from public.projects p where p.id = milestones.project_id
      and (p.owner_id = auth.uid() or exists (
        select 1 from public.project_members pm where pm.project_id = p.id and pm.user_id = auth.uid() and pm.role in ('owner','admin','member')
      ))
  ));

-- ─── FUNCTIONS & TRIGGERS ──────────────────────────────────────────────────

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-recalculate project completion from tasks
create or replace function public.recalculate_project_completion(p_project_id uuid)
returns void language plpgsql security definer as $$
declare v_completion numeric(5,2);
begin
  select coalesce(avg(completion_pct), 0) into v_completion
  from public.tasks where project_id = p_project_id and status != 'cancelled';
  update public.projects set completion_pct = round(v_completion, 2), updated_at = now() where id = p_project_id;
end;
$$;

create or replace function public.trigger_recalculate_project_completion()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_project_completion(old.project_id);
  else
    perform public.recalculate_project_completion(new.project_id);
  end if;
  return coalesce(new, old);
end;
$$;

create trigger tasks_recalculate_completion
  after insert or update of completion_pct, status or delete on public.tasks
  for each row execute procedure public.trigger_recalculate_project_completion();

-- Auto-update milestone status based on due_date
create or replace function public.update_milestone_status()
returns trigger language plpgsql as $$
begin
  if new.status != 'completed' then
    if new.due_date < current_date then new.status := 'missed';
    elsif new.due_date <= current_date + interval '7 days' then new.status := 'at_risk';
    else new.status := 'upcoming';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger milestones_auto_status
  before insert or update of due_date on public.milestones
  for each row execute procedure public.update_milestone_status();

-- updated_at triggers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

create trigger projects_updated_at before update on public.projects for each row execute procedure public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks for each row execute procedure public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();

-- ─── INDEXES ───────────────────────────────────────────────────────────────

create index idx_projects_owner_id   on public.projects(owner_id);
create index idx_projects_status     on public.projects(status);
create index idx_tasks_project_id    on public.tasks(project_id);
create index idx_tasks_assignee_id   on public.tasks(assignee_id);
create index idx_tasks_status        on public.tasks(status);
create index idx_tasks_due_date      on public.tasks(due_date);
create index idx_milestones_project  on public.milestones(project_id);
create index idx_milestones_due_date on public.milestones(due_date);
create index idx_project_members_uid on public.project_members(user_id);
