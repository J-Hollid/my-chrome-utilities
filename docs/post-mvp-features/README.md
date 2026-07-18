# Post-MVP executable Flow acceptance backlog

These historical Gherkin files are outside the active `features/` corpus because they specify temporal Flow traversal, prior-Flow routing, occurrence enforcement, runtime branches and joins, journey Fixtures, or Flow-path coverage that the product owner explicitly excluded from the Specification Flow Graph MVP on 2026-07-18.

They are retained as architectural backlog and historical acceptance context. They are not MVP product promises, release gates, or evidence. Any later executable-Flow cycle must reconcile them against the canonical graph, Assignment, schema, release, and Live behavior current at that time before restoring them to active acceptance.

## Why structural archiving is required

Verification-pack discovery inventories `.feature` files under `features/`. A prose scope comment inside an active feature cannot disable its scenarios and would leave mutually exclusive MVP and temporal requirements in the same acceptance corpus. Moving these files under `docs/post-mvp-features/` makes the exclusion structural while preserving the original scenarios and historical mutation metadata for later design work.

The active MVP contracts are the directional Flow graph, effective per-Event schema and Assignment, documentation export, manual tester expectations, and terminal Flow specification workflow features under `features/`. They require independent Assignment-backed Event validation and prohibit hidden prior-Flow, transition, occurrence, branch-token, join-wait, or journey-verdict behavior.

## Archived families

- `data-layer-temporal-flow-authoring.feature` and its runtime companion
- `data-layer-temporal-flow-execution-correction.feature` and its runtime companion
- `data-layer-greenfield-retail-trade-production-release.feature` and its runtime companion
- `data-layer-retail-trade-decisive-workflow.feature` and its runtime companion
- `data-layer-unified-specification-evaluation.feature` and its runtime companion
- `data-layer-effective-requirement-coverage-correction.feature` and its runtime companion
- `data-layer-production-fixture-execution.feature` and its runtime companion
- `data-layer-truthful-preflight-release-correction.feature` and its runtime companion
- `data-layer-project-fixtures-preflight.feature` and its runtime companion
- `data-layer-project-interchange.feature` and its runtime companion

Some archived files also contain non-temporal behavior that was valid in the older program. That behavior must be specified anew in an active MVP feature when still required; an archived mixed-scope file is never partially active.

## How a future cycle may reactivate behavior

1. Start a separately approved executable-Flow specification cycle.
2. Reassess every archived scenario against the then-current canonical graph, observable Assignment inputs, effective-schema compiler, immutable release, and Live boundaries.
3. Rewrite or split scenarios so no active requirement relies on hidden graph traversal or contradicts independent per-Event validation.
4. Move only the reviewed replacement features back under `features/`.
5. Run the Gherkin parser and `ir-dry-checker`, prune redundant parameters, consolidate safe Background setup, and obtain explicit approval before coder handoff.

Archived mutation manifests record historical acceptance results only. They do not establish current coverage, implementation status, or release eligibility.
