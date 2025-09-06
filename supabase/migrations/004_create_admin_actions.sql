-- Ensure required extension for UUID generation
create extension if not exists pgcrypto;

-- Create admin_actions table if it doesn't exist
create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid null references public.profiles(id) on delete set null,
  action_type text not null,
  target_type text not null,
  target_id uuid null,
  description text null,
  metadata jsonb null,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_admin_actions_created_at on public.admin_actions(created_at desc);
create index if not exists idx_admin_actions_action_type on public.admin_actions(action_type);
create index if not exists idx_admin_actions_admin_id on public.admin_actions(admin_id);

comment on table public.admin_actions is 'Audit log of admin operations (e.g., delete_user).';
comment on column public.admin_actions.admin_id is 'Profile ID of admin performing the action.';
comment on column public.admin_actions.target_id is 'Primary identifier of the target entity (e.g., user id).';
