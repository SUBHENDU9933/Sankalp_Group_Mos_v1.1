-- Sankalp Marketing Hub — v1.3 messages table for Meta webhooks (inbox events).
-- Stores raw webhook events (Messenger, Instagram DM, IG comments, WhatsApp).
-- The Inbox UI reads from this table.

create table if not exists public.messages (
  id            bigserial primary key,
  channel       text,                 -- 'page' | 'instagram' | 'whatsapp'
  external_id   text,                 -- platform-side message/comment ID
  sender_id     text,
  recipient_id  text,
  event_type    text,                 -- message | postback | reaction | comment | status:delivered | ...
  text          text,
  attachments   jsonb,
  raw           jsonb,                -- original webhook payload (for replay/debug)
  received_at   timestamptz default now(),
  read_at       timestamptz,
  replied_at    timestamptz,
  reply_text    text,
  created_at    timestamptz default now()
);

create index if not exists messages_channel_idx       on public.messages (channel);
create index if not exists messages_received_at_idx   on public.messages (received_at desc);
create index if not exists messages_sender_idx        on public.messages (sender_id);
create unique index if not exists messages_external_uniq on public.messages (channel, external_id) where external_id is not null;

alter table public.messages disable row level security;
