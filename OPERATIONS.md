# Warehouse Manager operations

## Supported boundary

The governed path covers facility/site permissions, assets, timestamped operational events, constrained warehouse jobs, independent operator and safety review, approved dispatch requests, execution receipts, realized outcomes, and manual recovery. Telemetry, ERP, WMS, TMS, SCADA, GIS, device, weather, maintenance, and notification names are typed adapter contracts—not claims that live industrial systems are connected.

No recommendation autonomously dispatches equipment or overrides capacity, worker-safety, restricted-zone, or maintenance constraints. The older generated design surfaces are quarantined by default and cannot be enabled in production.

## Deploy and run

Install dependencies explicitly in `backend/` and `frontend/` and generate the Prisma client as a reviewed build step. Configure `.env` from `.env.example` with `DATABASE_URL`, unique `GOVERNANCE_TENANT_ID`, and a random `JWT_SECRET` of at least 32 characters. Keep equipment/provider credentials in a secret manager.

Use `./start.sh check`; review SQL and take a backup before `ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate`; then run `./start.sh start`. Startup never pushes Prisma schema, seeds data, installs packages, or terminates unrelated processes.

## Workflow and recovery

Create a subject-scoped job at `/api/governance` with authoritative provenance and `Idempotency-Key`, submit it, and obtain a decision from a different authorized reviewer. Workers checkpoint inbound batches and use leased outbox claims plus typed receipts. On stale/duplicate telemetry, unsafe constraint, delayed feedback, equipment outage, or ambiguous receipt, halt dispatch, preserve audit evidence, reconcile the source and resume the same durable job or invoke manual fallback.

Historical fixtures measure forecast/optimization error, constraint violations, latency, missed events, and realized outcomes. Run `node --test backend/src/governance/tests/*.test.js` and `bash -n start.sh`. Destructive fixtures require explicit opt-in and environment-supplied passwords on a disposable database.
