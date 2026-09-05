# Serena toolchain ownership preparation R01

Status: authorized preparation for the approved Serena pilot.
Prepared: 2026-09-05. Task: `verification-slice-serena-development-pilot`.
Starting QA: `3269657a4b0bfd2c587b13392191d1746fb722d9`.
Mode: tooling-only feature integration into QA, with independent review.

Calibration clarification: follow `docs/calibration-receipt-independence-R01.md`
to repair the selected tests' temporary-receipt dependency within this same
active task. Preserve candidate `3dae61aa25bd66c8547e9e2cabdbf15feff86aba`.
Resume through the bound unblocker; the original pilot remains paused.

## Authority and observed cause

Process coder note `20260905T143848Z_000001_from_coder` under the specifier's
immediate-preparation routing rule. The note records the user's direction:
"Perform an ownership preparation. In general we should do the work to slice
out what needs to be tested." The original pilot remains approved.

The coder's read-only intent selected 21 packs and 922 tasks, compared with the
`shell` and `verification_process` forecast. Its classification is
`genuinely-global`. Preserve that result. Both causal paths below are explicit
`globalImpact` entries in `verification/manifests/shell.json`. No checks ran.
The coder is still at the pilot specification commit and has no product delta.

| Causal path | Required final disposition |
|---|---|
| `scripts/check-swarmforge-toolchain.mjs` | Retain core checker bytes and global ownership; place new optional development-tool operations behind a separate, reviewed entry point. |
| `swarmforge/toolchain.lock.json` | Retain existing pins, bytes, core evidence digest, and global ownership; place only new optional development-tool pins in one subordinate authority fragment. |

The separation must isolate optional code navigation from extension execution.
It must not relabel a core runtime edit as a local tool change. The risk is
incorrect authority composition or evidence identity. Direct causal contracts
must prove the boundary before its ownership can be used.

## Smallest permitted implementation

Keep the two causal files unchanged in this preparation and the resumed pilot.
Keep their current global declarations. Add a small optional-tool module and
one subordinate pin fragment under `swarmforge/toolchain/`. The toolchain root
continues to own all existing runtime and analysis-tool pins. The fragment owns
only new optional development-tool names. Use a fixed, documented composition
rule: one source per name, no override of a root pin, and an error for duplicate,
unknown-schema, missing requested, or invalid pins. No competing root lock.

The optional entry point is part of that composed toolchain authority. It may
validate or provision only an explicitly named optional tool. Core validation
still calls the existing strict checker; missing optional tools cannot turn a
core failure into a pass. Optional inspection is offline. Download or install
is permitted only by an explicit named provisioning operation. Reuse existing
safe primitives where suitable; do not copy the core validator or change its
command behavior. Keep IO, pin validation, and dispatch in separate small units.

This preparation installs and tests the extension point and ownership only.
The fragment may be empty until the pilot adds its actual pins and provider.
Use controlled local fixtures to prove dispatch and pin failures. Do not add
Serena, MCP configuration, project indexing, ownership-query behavior, startup
reading changes, or product features in this task. Existing optional Clojure
tools do not need migration. This document permits the subordinate composition
and named optional entry point as the precise toolchain rule refinement needed
by the pilot; it does not change core authority or other roles' duties.

## Development focus and QA impact

Start with three direct groups: composed-pin validation and explicit dispatch;
unchanged strict runtime behavior with offline startup; canonical owner and
consumer selection. Tests must invoke production boundaries, with deterministic
adapters for network attempts and invalid local tools. A source-string check
alone is insufficient. Preserve existing process contracts in
`test/swarmforge-process-contract-test.mjs` where they observe this boundary.
Acceptance contract: `features/serena-toolchain-ownership-preparation.feature`.

Proposed source prefix: `swarmforge/toolchain/` for the fragment and small
optional-tool modules. Proposed parent: `shell`; subordinate slice:
`development_toolchain`. Exact consumer: `shell/swarmforge-handoff-control`,
for the worker-launch contract. Register the new CLI, feature, handler, and
direct tests as exact paths where they sit outside that prefix. Declare the
direct consumer check that observes offline role startup; retain existing
transitive consumers. No product pack becomes a consumer because it is readable.

QA forecast: `shell` and `verification_process`. Existing integration paths
likely to change are the Shell and verification-process manifests, generated
registry, `verification/granularity-dispositions.json`, and the shared toolchain
instruction in the project article and engineering prompt. Read-only shared
dependencies include the core checker, root lock, verification identity,
runtime launcher, and current/base planner. Include any actual additional edit
in intent and exact planning. Do not edit evidence policy, root checker, or
root lock to fit this forecast.

Run intent before coding and exact plan-only preflight after the first coherent
commit. Record a durable disposition for both causal paths under the original
task in the existing disposition registry: replacement paths for the reviewed
optional boundary, with an explicit reason that real core changes remain
global. If the seam cannot be proved, record a parent fallback and the conflict.
New dispositions take effect only after architect review and QA integration.

Preserve all old/current owner and consumer closures, direct checks, properties,
prerequisites, quarantine restrictions, and terminal obligations. The preparation
cannot narrow its own evidence with its new mapping. Use the complete bounded
canonical plan plus package proof. Do not run all runnable packs in feature
mode or create a new bootstrap exception. If preserving authority requires a
core edit or an all-pack preparation, report that exact conflict before coding
that expansion; do not remove global declarations or bypass the preflight.

## Review, disposition, and resumption

Forecast ceiling: two elapsed hours; halfway report at one hour. Expect a
working pin/dispatch boundary and a bounded exact plan at halfway. Report
variance, remaining work, confidence, and forecast; continue safe bounded work
under the current QA rules. No benchmark, telemetry, or enforcement programme.

The refactorer and architect review the preparation separately from the pilot.
Require both path dispositions and direct evidence that core Node, TypeScript,
Babashka, APS, artifact, and verification identity remain controlled by the
unchanged root authority. Require negative core-mismatch cases as well as
optional pin and dispatch cases. A passing fixture alone cannot replace the
candidate's strict checker and focused package evidence.

Only an exact architect `qa-ready` handoff with bound focused evidence permits
QA integration. Record quarantine repair only if applicable. Then reissue
`serena-development-pilot` automatically from that exact QA head, retaining its
three feature contracts and user-approved behavior. There is no product patch
to reapply. A specification commit alone does not satisfy this prerequisite.
Record actual elapsed time, preparation failures, and the resulting pilot plan
in the existing delivery report. No local setup saving is claimed yet.
