-- Schema del database.
-- Eseguire su PostgreSQL (o nell'SQL Editor di Supabase) prima di avviare il server.

create table clienti (
  id        bigint generated always as identity primary key,
  nome      text not null,
  email     text not null unique,
  creato_il timestamptz not null default now()
);

create table utenti (
  id        bigint generated always as identity primary key,
  email     text not null unique,
  password  text not null,
  creato_il timestamptz not null default now()
);