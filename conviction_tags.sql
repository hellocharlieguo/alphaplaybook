-- AlphaPlaybook — conviction_tags table
-- Stores every tagged transcript segment (from the LLM tagging pass) so the theme_engine
-- can roll them into L1/L2 weights and Layer B trajectory persists across weeks.
-- Parallel to voice_mentions. Run in the Supabase SQL editor.

create table if not exists conviction_tags (
  id                  bigint generated always as identity primary key,
  run_date            date not null,               -- Monday of the tagging run
  source              text not null,               -- transcript filename / URL
  voice               text not null default 'Visser', -- Visser | Camillo | ZaStocks
  segment_idx         int,                         -- order within transcript (arc reconstruction)
  theme               text not null,               -- AI Compute | AI Application | Monetary Scarcity | Tokenization
  pillar              text,                         -- Power|Chips|Memory|Interconnect|Copper (null if not compute)
  tickers             text[] default '{}',
  direction           text not null,               -- advocacy | neutral | caution
  conviction          numeric not null,            -- 0..1 (model)
  conviction_audited  numeric,                      -- Charlie override; null = accept model
  temporality         text,                         -- initiating|escalating|holding|trimming|exiting|reversing
  beneficiary_theme   text,                         -- where DEMAND lands (agent->compute rule)
  airtime             numeric default 0,            -- share of transcript this segment occupies (0..1)
  causal_claim        text,                         -- the mechanism, one line
  quote               text not null,                -- verbatim audit anchor (<= 25 words)
  created_at          timestamptz not null default now()
);

-- effective conviction = audited if present, else model. Use this in aggregation.
create or replace view conviction_tags_effective as
  select *, coalesce(conviction_audited, conviction) as conviction_eff
  from conviction_tags;

create index if not exists idx_conviction_tags_run   on conviction_tags (run_date);
create index if not exists idx_conviction_tags_theme on conviction_tags (theme, pillar);
create index if not exists idx_conviction_tags_temp  on conviction_tags (temporality);

-- RLS: match the rest of the schema (service-role writes from the tagging step).
alter table conviction_tags enable row level security;
create policy conviction_tags_read on conviction_tags for select using (true);
