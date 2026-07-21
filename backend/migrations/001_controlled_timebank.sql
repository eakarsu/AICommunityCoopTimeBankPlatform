BEGIN;
CREATE TABLE IF NOT EXISTS users (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS ai_results (id BIGSERIAL PRIMARY KEY, user_id BIGINT REFERENCES users(id), endpoint TEXT NOT NULL, request_params JSONB, result_text TEXT NOT NULL, model_used TEXT, tokens_used INTEGER, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS tb_communities (
  id BIGSERIAL PRIMARY KEY, tenant_key TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tb_memberships (
  community_id BIGINT NOT NULL REFERENCES tb_communities(id), user_id BIGINT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('member','steward','admin')),
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','suspended')),
  location_precision TEXT NOT NULL DEFAULT 'private' CHECK (location_precision IN ('private','district','neighborhood')),
  PRIMARY KEY (community_id,user_id)
);
CREATE TABLE IF NOT EXISTS tb_listings (
  id BIGSERIAL PRIMARY KEY, community_id BIGINT NOT NULL REFERENCES tb_communities(id), member_id BIGINT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('offer','request')), title TEXT NOT NULL, skills TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','matched','closed','withdrawn')),
  version INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tb_exchanges (
  id BIGSERIAL PRIMARY KEY, community_id BIGINT NOT NULL REFERENCES tb_communities(id), offer_id BIGINT REFERENCES tb_listings(id), request_id BIGINT REFERENCES tb_listings(id),
  provider_id BIGINT NOT NULL, receiver_id BIGINT NOT NULL, status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','accepted','completed','disputed','settled','cancelled')),
  agreed_hours NUMERIC(6,2) NOT NULL CHECK (agreed_hours > 0 AND agreed_hours <= 24), version INTEGER NOT NULL DEFAULT 1,
  idempotency_key TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (community_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS tb_ledger_entries (
  id BIGSERIAL PRIMARY KEY, community_id BIGINT NOT NULL REFERENCES tb_communities(id), exchange_id BIGINT NOT NULL REFERENCES tb_exchanges(id),
  account_user_id BIGINT NOT NULL, counterparty_user_id BIGINT NOT NULL, amount NUMERIC(8,2) NOT NULL CHECK (amount <> 0),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('earn','spend','reversal')), reverses_entry_id BIGINT REFERENCES tb_ledger_entries(id),
  posted_by BIGINT NOT NULL, posted_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(exchange_id,account_user_id,entry_type)
);
CREATE TABLE IF NOT EXISTS tb_disputes (
  id BIGSERIAL PRIMARY KEY, exchange_id BIGINT NOT NULL REFERENCES tb_exchanges(id), opened_by BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','mediation','resolved','withdrawn')),
  reason TEXT NOT NULL, resolution TEXT, resolved_by BIGINT, version INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tb_governance_proposals (
  id BIGSERIAL PRIMARY KEY, community_id BIGINT NOT NULL REFERENCES tb_communities(id), title TEXT NOT NULL, body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','deliberation','voting','accepted','rejected')),
  created_by BIGINT NOT NULL, closes_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tb_audit_events (
  id BIGSERIAL PRIMARY KEY, community_id BIGINT, actor_id BIGINT, action TEXT NOT NULL, entity_type TEXT NOT NULL,
  entity_id BIGINT, before_state JSONB, after_state JSONB, request_id TEXT, occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tb_outbox (
  id BIGSERIAL PRIMARY KEY, community_id BIGINT, event_type TEXT NOT NULL, payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','failed','dead_letter')),
  attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT, next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION tb_block_ledger_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'time-credit ledger is append-only'; END $$;
DROP TRIGGER IF EXISTS tb_ledger_immutable ON tb_ledger_entries;
CREATE TRIGGER tb_ledger_immutable BEFORE UPDATE OR DELETE ON tb_ledger_entries FOR EACH ROW EXECUTE FUNCTION tb_block_ledger_mutation();
COMMIT;
