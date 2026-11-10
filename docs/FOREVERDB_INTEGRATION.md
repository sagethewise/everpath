# ForeverDB integration contract (2026-11-10)

**State: pending API approval.** No approved ForeverDB records are published. Live import requires an authorized `FOREVERDB_API_KEY` in local `.env` only. This document summarizes the terms and endpoints copied by the project owner from the provider's developer page; verify updates with the provider before release.

## Required use conditions

- Display a visible link to https://foreverdb.net **wherever ForeverDB data is shown**. The global footer contains a persistent "Data by ForeverDB.net" badge; individual acquisition records also link to the provider. Keep the badge present after public launch and remove the "pending approval" note only when approved and functioning. The attribution link must remain visible in every faction theme and on mobile.
- Do not resell, misrepresent as proprietary, or redistribute data outside agreed terms. Warcraft assets and client content belong to their own rights holders.
- Store the API key on the server/in local import scripts, **never** inside frontend `VITE_` env values, committed files or browser requests.
- API limits: 60 requests/minute/key, 10,000/day/key. Respect `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `X-Daily-Remaining`; retry 429 via `Retry-After`, with bounded backoff, and stop when daily quota is exhausted. Provider permits a one-minute cache; refresh policy requires explicit confirmation before longer-lived republication of third-party facts.
- Retain `meta` provenance (build, client, attribution, count/next paging) from responses, and source-level `seenInForever` vs `Classic` labels. Successful API response does **not** equal verified Forever location.
- In videos/posts containing provider data, link and credit ForeverDB in description/caption.

## Relevant endpoints (confirmed by supplied documentation)

| Purpose | API path | Notes |
| --- | --- | --- |
| Provider metadata | `/api/v1/meta` | build, game cap, data totals |
| Professions and acquisition | `/api/v1/professions`, `/api/v1/professions/{slug}` | 12 professions indexed by provider; ranks, trainers, paged recipes, learnedFrom.sources, skill orange/yellow/green/grey, vendor/drop/quest sources and zones |
| Gathering | `/api/v1/gathering/{slug}` | herbalism/mining/skinning/fishing, best zones and counts; Classic spawn estimates are not Forever-verified coordinates |
| Vendors | `/api/v1/vendors`, `/api/v1/vendors/{id}` | zone and NPC location, stock/prices, in-game observation vs Classic status |
| Quests | `/api/v1/quests`, `/api/v1/quests/{id}` | start/end location with uiMapId, zone, x/y % where known, source evidence |
| Zones | `/api/v1/zones` | list UI map IDs and zone labels (paginate) |
| Items | `/api/v1/items`, `/api/v1/items/{id}` | item source, speculation, beta-only flags; do not recommend non-live items as available |
| Changes | `/api/v1/changes-seen` | verified/unconfirmed player observations |

**Important mismatch:** Blizzard's current index in Everpath contains 13 profession entries; ForeverDB docs describe 12. Do not join by index/order. Match by ID/slug with audit flags and manually review mismatches.

**Pets:** supplied ForeverDB documentation does **not** list a pet/companion endpoint. Do not claim this API supplies all pet acquisition locations. Blizzard remains our primary pet identity/media source; any third-party pet source needs explicit permission and a separate mapping process.

## Proposed normalized record shape

Each published acquisition requires `entityType`, Blizzard `entityId`, `method`, `sourceTitle`, `sourceUrl`, `license`, `reviewedAt`, `evidenceLevel`, location zone and optionally verified map/point. Preserve provider `gameBuild`, observed/classic origin, and whether locations have supporting reports in the staging metadata. **Never publish Classic-only coordinates as verified Forever map pins.**

## Review workflow

1. Once approved, create `.env` with `FOREVERDB_API_KEY` (not in Git).
2. Run `npm run api:foreverdb:stage` to download **staging only** and inspect `imports/staging/foreverdb/report.json`.
3. Inspect fields, pagination and legal reuse policy of each endpoint before broadening the import. Stage trainer/vendor/quest details in small batches with tracked quotas.
4. Match item records by Blizzard ID; reconcile profession slugs/IDs and source/zone identifiers. For pets, verify another permitted source.
5. Prepare `imports/reviewed-sources.json` with reviewed, attributed records. `npm run data:review-sources` explicitly publishes approved records to the local catalog.
6. Test both themes, mobile footer badge, all details dialogs, and map absence/presence.

**No blanket republication:** importing provider JSON into staging is not approval to redistribute its entire API database.
