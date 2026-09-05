# Serena ownership preparation: coder report

Task: `verification-slice-serena-development-pilot`.
Specification: `f338e511090712038e2f789a927a1514293e8000`.
Status on 2026-09-05: implementation is prepared; focused evidence is incomplete.
The handoff remains active. This report does not authorize QA integration or
resumption of the Serena pilot.

## Implemented boundary

- Added a fixed subordinate optional pin fragment and separate pin validation,
  file IO, provider dispatch, and CLI modules under `swarmforge/toolchain/`.
- Inspection is offline. Provisioning requires one explicit tool name. Root-pin
  conflicts, missing pins, unknown schemas, and invalid pins fail before dispatch.
- Preserved the root lock and core checker bytes and global declarations.
- Registered the Shell `development_toolchain` slice and its existing worker
  control consumer. Recorded both original causal path dispositions for review.
- Registered the three pending pilot contracts as planned features. Serena
  installation and pilot behavior remain outside this preparation.

## Verification and process scorecard

The initial intent was bounded to Shell and verification-process, with 142 tasks.
Exact planning remained bounded after implementation and corrections. Properties
add tasks to the executable plan; no all-runnable-pack command was launched.

Direct pin, dispatch, runtime, ownership, generated acceptance, and migration
history tests passed. The unchanged strict checker passed. A fresh build and
`node scripts/package.mjs` passed and produced the extension archive.

Two initial prelaunch checks found missing planned-feature registrations and a
stale derived blocked-aggregate consumer digest. Both were corrected. The Phase 2
identity was current. Local loopback access required scoped command approval.

The first two executable attempts stopped at frozen historical registry checks.
The repair preserves exact migration snapshots at their recorded Git commit and
compares retained acceptance-session features against the canonical historical
registry. Current manifest-to-registry parity remains exact. The shared projection
has direct tests. Its generated compact conservation record was refreshed with
the repository command. These are one attributable historical-comparison repair
family; no historical digest, incident binding, or assertion leaf was removed.

## Remaining evidence problem

The selected calibration and regression-routing checks require six raw receipts
from the August 7 calibration snapshot that are absent from the configured stores.
The first missing SHA-256 is
`036d34237df27751e01c1f14b8a72d549091a337334080c1b4c48bc5c305f94f`.
One other digest already has a committed retirement record; the six missing ones
do not. The calibration inputs were not changed by this task.

Recovery inspected 3,351 receipt files under the configured temporary roots and
3,669 under archived worktrees and temporary review directories (these searches
overlap). No required calibration digest was found. Current, review-ready, and
backup verification Git notes did not reference the first missing digest.
No replacement receipt or retirement identity was invented.

A passing direct test or package does not replace complete focused evidence.
The candidate must retain the selected checks and obtain the original receipt
bytes, authenticated retirement metadata, or a separately authorized calibration
recovery before review-ready evidence can be recorded.

## Assessment

The optional boundary and early ownership checks worked. Setup took about fifty
minutes through recovery inspection, within the two-hour forecast. The process
lost time to repeated historical assumptions and an unavailable baseline fixture.
The coder also stopped after promising to continue; work then resumed with an
evidence search and package validation.

Keep the optional boundary. Complete the historical evidence recovery before QA
handoff. Preserve the original pilot task and resume it only after independently
reviewed preparation reaches QA. No Serena setup or token saving is claimed.
