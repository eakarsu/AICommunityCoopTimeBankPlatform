# Controlled time-bank operations

The authoritative path is `/api/timebank`: verified tenant membership gates listings, deterministic skill overlap creates matches, idempotent exchanges settle through an append-only double-entry time-credit ledger, and disputes/governance/outbox/audit state is durable. Quarter-hour bounds and row locks protect concurrent settlement. Generated `/api/gap-*` routes and their navigation entries are quarantined; AI output is advisory and never posts credits.

Copy `.env.example`, set unique secrets, run `scripts/bootstrap.sh`, then `scripts/migrate.sh`. `start.sh` only starts this repository's existing processes; it never installs, seeds, migrates, creates databases, or kills ports. Demo seeding is separately guarded.

Identity verification, email/SMS, calendar/maps, moderation, and accounting export require approved provider adapters. An adapter must use an idempotency key/cursor, write `tb_outbox` delivery status and sanitized failures, minimize location precision, and support retries/dead-letter handling. Provider credentials and safeguarding policy approval are deployment blockers.
