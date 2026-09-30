-- add fieldloft schema

-- Auto-update updatedAt on row changes.
create or replace function touchUpdatedAt()
returns trigger
language plpgsql
as $$
begin
  new.updatedAt = now();
  return new;
end;
$$;

create table users (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  email text not null unique,
  name text not null,
  passwordHash text not null
);

create trigger usersTouchUpdatedAt
  before update on users
  for each row execute function touchUpdatedAt();

create table forms (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  ownerId uuid not null references users(id) on delete cascade,
  slug text not null unique,
  title text not null default 'Untitled form',
  description text not null default '',
  published boolean not null default false,
  themeColor text not null default '#4f46e5',
  thankYouMessage text not null default 'Thanks! Your response has been recorded.',
  notifyOwner boolean not null default true
);

create index formsOwnerIdIdx on forms (ownerId);

create trigger formsTouchUpdatedAt
  before update on forms
  for each row execute function touchUpdatedAt();

create table fields (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  formId uuid not null references forms(id) on delete cascade,
  position double precision not null default 0,
  kind text not null check (kind in ('short', 'long', 'email', 'number', 'single', 'multiple', 'date', 'rating', 'file')),
  label text not null default '',
  helpText text not null default '',
  required boolean not null default false,
  options text[] not null default '{}'
);

create index fieldsFormIdIdx on fields (formId);

create trigger fieldsTouchUpdatedAt
  before update on fields
  for each row execute function touchUpdatedAt();

create table responses (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  formId uuid not null references forms(id) on delete cascade,
  answers jsonb not null default '{}'
);

create index responsesFormIdIdx on responses (formId);

create trigger responsesTouchUpdatedAt
  before update on responses
  for each row execute function touchUpdatedAt();

create table responseFiles (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  responseId uuid not null references responses(id) on delete cascade,
  fieldId uuid not null,
  name text not null,
  contentType text not null,
  size integer not null,
  data bytea not null
);

create index responseFilesResponseIdIdx on responseFiles (responseId);

create trigger responseFilesTouchUpdatedAt
  before update on responseFiles
  for each row execute function touchUpdatedAt();
