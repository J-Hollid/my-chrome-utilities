# QA verification pack taxonomy evolution R01

Status: user-approved specification decision recorded on 2026-08-20; bounded
focused evidence reaffirmed and the unnecessary preparation retired on
2026-08-21

Prepared: 2026-08-20

Stable implementation task: `registry-derived-verification-packs`

## Decision

Verification-pack cardinality is derived from the runnable entries in
`verification/packs.json`. Twenty is the current runnable count, not an
architectural constant, target, ceiling, or floor. The terminal safety contract
is **all runnable packs from the exact candidate registry**, with properties and
package proof, regardless of how many runnable packs that registry contains.

This decision supersedes only the fixed-cardinality language in the current QA
verification, final-gate, and feature-workflow programs. Historical receipts and
scorecards that say `all-20` continue to describe the exact twenty-pack registry
they executed. They do not constrain a later registry to twenty runnable packs.

The existing subordinate-slice ratchet remains valid, but a reviewed topology
migration may promote a proved slice or other stable boundary into a top-level
pack. Promotion changes organization and selection granularity without removing
an assertion or weakening exact-pack, terminal, packaging, persistence,
security, or migration meaning.

## Audit evidence

At QA `43c019bb`, the registry contains 21 pack definitions and 20 runnable
packs. `selective_profile_inheritance` is a non-runnable empty definition. The
20 runnable packs contain 885 direct task identities; the smallest contains 5,
the median contains 15, and the largest contains 287.

The current slice portfolio contains 17 slices across 9 runnable packs and maps
27 unique direct task identities. `schemas` contains 287 direct task identities
and one two-task slice. `capture` contains 170 direct task identities and no
slice. Current slices map unit, browser-observation, and checkpoint tasks, but no
acceptance or property task. Pack selection is therefore deterministic, while
the present top-level taxonomy and slice coverage do not yet provide consistent
granularity.

First-parent registry history also shows that cardinality was once allowed to
follow product structure: it grew from 8 runnable packs on 2026-07-17 to 20 on
2026-07-31. On 2026-08-02, selective-profile behavior moved into
`layered_schema`, leaving the old id empty and reducing the runnable count to 19;
`property_set_flow_sections` then restored the count to 20. The later policy
froze that incidental count rather than deriving it from the registry.

## Pack, slice, and remainder criteria

A reviewed boundary is eligible for promotion to a top-level pack only when the
evidence establishes all of the following:

1. It is an independently nameable product or verification capability with a
   stable observable outcome.
2. It has exact source or explicitly classified verification-only ownership,
   direct task identities, dependencies, consumers, and a representative path.
3. It can be selected and executed independently without silently requiring the
   unrelated remainder of its former parent.
4. Real feature evidence shows that the parent repeatedly contributes complete
   unrelated task families, or that an indivisible pack-level task such as an
   acceptance session prevents safe slice-level selection.
5. Current and historical ownership can conserve every former source path,
   assertion, task, prerequisite, consumer, reliability boundary, browser
   observation, performance obligation, and package input exactly once.

A boundary remains a subordinate slice when it is an internal seam, shared
component, adapter, or verification support boundary whose behavior is meaningful
only within its parent or declared consumers. The conservative parent remainder
continues to own every path and task that has no proved narrower mapping.

Pack size, task count, elapsed time, source count, forecast variance, or an
attempt to reach a preferred cardinality never decides promotion by itself. When
semantic independence or conservation cannot be proved, record a durable
observation or parent fallback and retain the existing pack.

## Topology migration contract

An approved addition, split, promotion, merge, rename, or retirement is one
atomic registry migration:

- the current registry has unique runnable ids and exact ownership;
- the old and new closures conserve every registered task and terminal
  obligation exactly once;
- compatible historical changed-path planning uses the union of old and new
  ownership so a migration cannot narrow candidate evidence;
- every new or retained dependency and consumer edge is explicit and acyclic;
- exact-pack selectors, timing budgets, calibration, reporting, evidence
  receipts, reliability closure, and terminal planning derive their expected
  pack set and count from the same exact registry identity;
- adding a runnable pack makes it required by the terminal plan without a code
  change to another numerical constant; and
- removing a runnable pack is permitted only after its behavior and tasks are
  explicitly transferred or removed under separate product authority.

An empty compatibility identity is not runnable and does not contribute to
cardinality. If historical identity translation remains necessary, declare it
as migration metadata rather than presenting it as a current capability. A
source-less runnable pack must explicitly declare that it is a
verification-only behavior pack and name the production owner it observes.

## Initial taxonomy portfolio

This specification authorizes assessment, not immediate splitting, for these
boundaries:

| Boundary | Initial disposition | Evidence to seek |
|---|---|---|
| `schemas` | selected for a bounded topology assessment | Independently executable schema core, validation, guided workflow, and specification-builder closures; especially acceptance-session separation |
| `capture` | selected for a bounded topology assessment | Independent live observation, saved-session/recovery, and event-feed closures |
| `selective_profile_inheritance` | selected for explicit disposition | Retire the empty compatibility identity or restore a genuinely independent runnable boundary |
| `project_assurance_severity` | selected for classification | Declare a verification-only pack with its observed production owner or move its evidence to a coherent source-owning boundary |
| `shell` | carried as a cross-cutting parent | Prefer reviewed slices unless a future boundary proves independent terminal and consumer semantics |

Each assessment is a separate task. No row pre-approves a registry change, and
no implementation may batch unrelated product refactoring into the cardinality
correction.

## Settled first-use routing correction

The user-approved product task `registry-derived-verification-packs` started from
exact QA `465af2a504`. Stopped coherent candidate `bf234ead7b` changed no browser
product behavior, persistence, migration, or security boundary. Its read-only
historical-path replay from specification `895c9fc649` returned
`genuinely-global`, 20 pack identities, and 796 planned tasks solely because it
had edited `scripts/verification-reliability-values.mjs`, whose conservative
helper ownership reaches every runnable pack and has no credible current-path
boundary. That mechanical result does not invalidate the approved low-risk
focused-evidence decision.

The user reaffirmed on 2026-08-21 that this verification-only behavior does not
warrant a complete product-pack feature run when executable synthetic registries
prove that the derived set can actually dispatch packs. This is durable current
authority; do not request the same acceptance again while product scope and the
no-touch boundary below remain unchanged. The derived task
`verification-slice-registry-derived-verification-packs` is retired without
implementation. Reissue the original stable product task from the exact QA
descendant containing this correction.

The bounded reconstruction must establish all of the following:

1. **Historical variance without current scope.** Preserve the stopped
   candidate's complete changed-path inventory for audit. Classify the rejected
   `scripts/verification-reliability-values.mjs` edit as audit-only forecast
   variance, not a current likely implementation path. Exact candidate preflight
   must reject the candidate if that file changed.
2. **Pure injected boundary.** Keep
   `scripts/verification-reliability-values.mjs` unchanged and pure. Derive the
   exact runnable identities in the cardinality contract and inject them through
   an adapter into reliability, terminal, calibration, reporting, and evidence
   callers. Proposed prefix `scripts/verification-pack-cardinality/` remains
   owned by `shell` under slice `verification_pack_cardinality_contract`.
3. **Executable generic proof.** Test the current registry, a compatible
   registry with one added runnable pack, and a registry with an empty
   compatibility identity. Each fixture must prove both the derived identity set
   and representative synthetic pack dispatch. Consumer identity alone does not
   select unrelated product-pack closures.
4. **Specification-bound focused evidence.** The focused route is valid only for
   this exact no-product candidate and its named cardinality, workflow, evidence,
   reliability, and process-contract tasks. It cannot become a generic
   caller-selected `shell` bypass for other tooling candidates. Missing proof,
   an unapproved changed path, or a changed product boundary fails closed before
   review-ready recording.
5. **Conservation.** Preserve current registry topology, every existing
   exact-pack task closure, historical ownership, calibration rows, receipt and
   evidence identities, reliability obligations, package inputs, and the final
   all-runnable-pack master checkpoint. A later valid added pack becomes
   terminally required through the same generic contract.
6. **Clean reconstruction.** Use stopped candidate `bf234ead7b` only as an
   audited patch reference. Reconstruct approved task-owned behavior from
   commits `0a52f69a`, `31777846`, and `3ffa07e1` with required `By coder.`
   metadata, remove the rejected generic tooling-evidence bypass, keep the
   reliability-values helper unchanged, and add the end-to-end no-touch and
   focused-routing regressions.

The stopped candidate's audit inventory is the existing integration paths in
`acceptance/src/acceptance/steps/modular_architecture.clj`,
`acceptance/src/acceptance/verification_support/`, `scripts/report-verification-throughput.mjs`,
`scripts/run-focused-acceptance.mjs`, the settled-final-verification policy and
review modules, `scripts/verification-changes.mjs`, `scripts/verification-evidence.mjs`,
the ownership-readiness modules, `scripts/verification-packs.mjs`, the
verification reliability modules, run-intent, slice-quarantine and task-
succession modules, the settled workflow and process-contract tests, and
`verification/packs.json`, plus proposed cardinality contract and direct test
files. Only `scripts/verification-reliability-values.mjs` has the explicit
audit-only, no-touch disposition; all actual candidate paths remain subject to
fresh intent and exact preflight.

## Development focus and QA impact

The first implementation changes cardinality mechanics only. It must remove
fixed-count validation while leaving the current registry topology and all
twenty current runnable closures unchanged. Likely existing shared integration
surfaces are:

- `scripts/verification-packs.mjs`;
- `scripts/report-verification-throughput.mjs`;
- `scripts/verification-reliability-closure.mjs`;
- the settled final-verification workflow and evidence contracts;
- performance calibration and process-contract tests; and
- `features/modular-verification-packs.feature` and
  `features/settled-candidate-final-verification.feature`.

The proposed new source prefix is
`scripts/verification-pack-cardinality/`, owned by parent pack `shell` under
proposed subordinate slice `verification_pack_cardinality_contract`. Its exact
consumers are every runnable pack in the evaluated registry because terminal
closure, calibration, and evidence reporting consume the same derived set.
Those semantic consumers are proved through the generic executable contract;
they do not authorize unrelated product-pack task closures.

Before coding, run read-only ownership intent against the current QA base with
the actual reconstructed path forecast and the audit-only no-touch disposition.
Exact candidate preflight must prove the prohibited helper stayed unchanged.
Any new product, persistence, migration, security, or genuinely global path is
new scope and stops; the already settled historical replay does not.

**Development focus:** the direct cardinality contract test, settled workflow
test, verification process-contract test, and scenarios 188–198. Prove current,
added-runnable, and empty-compatibility registries through executable synthetic
pack dispatch, fail-closed ambiguity, the prohibited helper no-touch guard, and
the specification-bound focused evidence route.

**QA impact:** `shell` with the exact named cardinality, workflow, evidence,
reliability, and process-contract tasks, properties, acceptance for the changed
scenarios, and package proof. The exact candidate plan may add a bounded direct
consumer selected by an actual changed path, but it does not run complete
product-pack closures or the all-runnable-pack gate. The latter remains
exclusive to explicit master integration.

The implementation-and-review effort ceiling is four hours from renewed coder
receipt to architect `qa-ready`. At two hours report the no-touch guard, actual
candidate paths, exact tasks, synthetic execution proof, evidence binding,
failures, remaining work, confidence, and forecast. Continue while the settled
scope remains unchanged and a bounded safe completion path exists.
