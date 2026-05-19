# Audit Recommendations & Status — AIWarehouseManager

Source: /Users/erolakarsu/projects/_AUDIT/reports/batch_09.md

Verdict per audit: partial-build, 12 AI endpoints, 31 non-AI routes. Domain is "Combined interior design & home inspection."

## Original audit recommendations

Missing AI counterparts:
- Predictive wear analysis for materials
- Contractor matching AI

Missing non-AI:
- Invoice/payment tracking
- Client communication portal
- Project timeline tracking
- Bulk import from photos

Custom feature ideas:
- Multi-modal vision analysis
- AR preview with furniture price integration
- Real-time multi-user collaboration
- Contractor marketplace with AI skill-matching
- Historical design trend analysis
- Smart home automation integration

## Implemented in this pass

None. AI surface is already broad (12 endpoints, including vision via the existing `/analyze` flow). Remaining items are NEEDS-PRODUCT-DECISION (marketplace, collaboration), NEEDS-CREDS (smart-home integrations), or substantive new features (real-time collaboration, AR).

## Backlog (priority order)

1. Predictive material wear endpoint (`/material-wear-prediction`) — text-only AI add-on, mechanical next step.
2. Contractor skill-match endpoint (`/contractor-match`) — text-only AI over contractor profiles.
3. Project timeline tracking — needs schema additions; product decision.
4. Invoice/payment tracking — credentials decision.
5. AR preview with prices — substantial frontend product work.
6. Smart-home integration — credentials decision.

## Apply pass 5 (all backlog)

Implemented 6 of the remaining backlog items as additive code (Prisma schema not changed; new tables created via `prisma.$executeRawUnsafe(CREATE TABLE IF NOT EXISTS …)`).

**Backend** — new file `backend/src/routes/extensions.js`, mounted under `/api`:
- Project timeline tracking (NEEDS-PRODUCT-DECISION): status enums = [planning, in-progress, on-hold, completed, cancelled]; milestones ordered via `order_index`. Endpoints `GET/POST /api/projects/timelines`, `GET/POST /api/projects/timelines/:id/milestones`, `PATCH /api/projects/milestones/:id`. New tables `project_timelines`, `project_milestones`.
- Invoice / payment tracking (NEEDS-CREDS → 503 `missing: STRIPE_API_KEY` on `/charge`): `GET/POST /api/invoices`, `POST /api/invoices/:id/charge`. New table `invoices`.
- AR preview with prices (TOO-RISKY → additive read-only manifest): `GET /api/ar/manifest/:designId`. Reads existing `DesignRoom` + `Furniture` Prisma models, returns positions + prices + model URLs. PRODUCT-DECISION: native AR rendering (three.js / WebXR) is a future product call.
- Smart-home integration (NEEDS-CREDS → 503 `missing: SMARTHOME_PROVIDER,SMARTHOME_API_KEY` on POST): `GET /api/smarthome/status`, `GET /api/smarthome/devices`, `POST /api/smarthome/devices`. New table `smarthome_devices`.
- Real-time multi-user collaboration (NEEDS-PRODUCT-DECISION → poll-based, forward-compatible with WebSocket): `POST/GET /api/collab/presence`, `POST/GET /api/collab/comments`. New tables `collab_presence`, `collab_comments`.
- Historical design trend analysis (MECHANICAL): `POST /api/design-trends/analyze` returns 503 with `missing: OPENROUTER_API_KEY` if AI key absent.

**Pre-existing fix (additive)**: bootstrap detects pass-5-first-cut tables that declared `user_id INTEGER` and drops them so the corrected `user_id TEXT` (matching Prisma uuid IDs) can be created.

**Smoke test:**
- `POST /api/auth/register` → 201 (returns JWT)
- `GET /api/projects/timelines` → 200
- `POST /api/projects/timelines {project_name:"Smoke Test"}` → 200 with persisted UUID `user_id`
- `POST /api/invoices {amount:100}` → 200
- `GET /api/smarthome/status` → 200 with `missing: [SMARTHOME_PROVIDER, SMARTHOME_API_KEY]`
- `POST /api/invoices/1/charge` → 503 with `missing: STRIPE_API_KEY`

No new deps, no `npm install`, no Prisma schema changes.

## Apply pass 4 (mechanical backlog)

Implemented both mechanical backlog items.

**Backend** (`backend/src/routes/ai.js`)
- Added `AIKeyMissingError` + a small `runChat()` wrapper around the already
  exported `callOpenRouterWithRetry`. Returns 503 (not 500) when
  `OPENROUTER_API_KEY` is unset.
- `POST /api/ai/material-wear-prediction` — `{ materials, environment?,
  usage_intensity?, climate?, notes? }` → wear timeline JSON (lifespan,
  drivers, warning signs, replacement cost, risk level per material).
- `POST /api/ai/contractor-match` — `{ job_description, required_skills?,
  budget?, timeline?, location?, contractor_ids? }` → ranked candidates from
  `prisma.contractor` with match_score / strengths / concerns / quote range.
  Returns 404 when no contractors exist.

**Frontend**
- `frontend/src/services/api.js` — new helpers `predictMaterialWear` and
  `matchContractor` (use the existing axios interceptor with
  `localStorage('token')` JWT).
- `frontend/src/pages/AIMaterialContractor.jsx` — new tabbed page (Material
  Wear / Contractor Match), per-tab form, lucide icons, react-hot-toast
  feedback, explicit 503 "AI not configured…" handling. Tailwind styling
  matches `MaintenancePredictor.jsx`.
- `frontend/src/App.jsx` — registered `/ai-material-contractor` behind
  `ProtectedRoute` + `Layout`.
- `frontend/src/components/Layout.jsx` — added sidebar entry "Materials &
  Contractors AI" under the Floor Plan AI section.

Smoke-tested locally: `register → POST /api/ai/material-wear-prediction`
with `OPENROUTER_API_KEY=` returned HTTP 503 with the expected error body.

No new deps, no `npm install`. Pre-existing bug — `routes/ai.js` and
`routes/aiDesign.js` import `{ callOpenRouter }` but the service only
exports `callOpenRouterWithRetry` — was NOT touched (would risk regressing
working flows that may resolve through other paths). New endpoints use the
exported helper directly so they are unaffected.

## Apply pass 3 (frontend)

Verified frontend coverage. The Vite/React/Tailwind frontend already has 30+ pages covering all existing AI endpoints — `AIAnalysis.jsx`, `AIDesignTools.jsx`, `RoomDetector.jsx`, `OptimizeLayout.jsx`, `HomeStaging.jsx`, `FurniturePlacer.jsx`, `MaintenancePredictor.jsx`, `EnergyAuditor.jsx`, `HomeInspector.jsx`, `Suggestions.jsx`, `Estimates.jsx`, `Dimensions.jsx`, `FullAnalysis.jsx`, `ARViewer.jsx`, etc. All routed in `App.jsx` behind a `ProtectedRoute` reading `localStorage('token')`.

The two backlog AI items (`material-wear-prediction`, `contractor-match`) are not yet in the backend either — they remain in backlog as paired backend+FE work.

Action: LEFT-AS-IS — no frontend gap to close.
