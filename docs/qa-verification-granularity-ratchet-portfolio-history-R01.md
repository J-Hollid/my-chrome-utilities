# QA verification granularity ratchet portfolio history R01

Status: historical implementation evidence split from the active authority on
2026-08-30

This file records one settled application of the ratchet. The active rules are
in `docs/qa-verification-granularity-ratchet-R01.md`.

## Active judgment-and-portfolio implementation

Stable task `judgment-based-granularity-portfolio` implements the approved
process contract from the exact QA base named by its handoff. It changes no
browser product, persistence, migration, packaging, assertion, existing slice,
or exact-pack closure.

**Development focus:** replace deterministic preparation routing for bounded
`granularity-assessment-required` and `coarse-within-pack` results with a
structured agent judgment outcome; keep all-pack `coarse-boundary` preparation
mandatory; add append-only observation recording, duplicate occurrence
accounting, portfolio listing and explicit dispositions; prevent plan-only
preflight from mutating that state; and make master-promotion handoff validation
reject a freeze with undisposed observations or selected hardening that has not
reached QA. Update coder, refactorer, architect, and specifier contracts and
their direct process tests. Likely implementation surfaces include
`scripts/verification-ownership-readiness-core.mjs`,
`scripts/verification-ownership-readiness.mjs`, the stacked-campsite store and
control modules, settled final-verification policy and workflow, SwarmForge role
and shared prompts, and a dedicated observation module if separation is
clearer. Reuse the existing atomic and immutable campsite persistence patterns.

The judgment input and persisted rationale must make semantic product scope,
unrelated selected families, measured cost and failure surface, seam clarity,
preparation cost and risk, and reconsideration evidence inspectable. The
implementation must not replace judgment with a weighted score, hard threshold,
roadmap field, or prediction of future touches. Observation recording never
changes the readiness plan; preparation routing occurs only for an explicit
immediate-preparation outcome.

**QA impact:** forecast the `shell` parent, especially the existing
`swarmforge-stacked-ratchet` and `swarmforge-handoff-control` process slices,
with the exact changed-path plan authoritative. Direct tests cover all judgment
outcomes, mandatory all-pack routing, observation identity and occurrence,
plan-only non-mutation, all four portfolio dispositions, selected-hardening QA
proof, pre-freeze rejection, and one post-freeze terminal gate. Run the focused
exact plan with properties and package proof. Feature mode must not run all 20
packs.

The implementation-and-review effort ceiling is four hours. At two hours report
the exact plan, judgment and persistence shapes, portfolio/freeze enforcement,
failures, remaining work, confidence, and forecast. If this process-only change
itself exposes a bounded coarse verification path, apply the new judgment and
retain conservative focused evidence; do not recursively open preparation just
because the classification exists.

### Settled judgment-and-portfolio result

Specification `1cabea0450` was handed to the coder at 16:43:42Z on 2026-08-18.
Architect candidate `0b4f8b4a9d` was returned QA-ready at 19:21:08Z and
fast-forwarded into QA at about 19:24Z: about 2 hours 41 minutes from handoff to
integration, inside the four-hour ceiling. At the two-hour point the candidate
was already in independent refactorer review.

Independent review caught two material portfolio defects before QA: an earlier
promotion disposition could incorrectly satisfy a later promotion, and a
malformed persisted portfolio could be interpreted as empty instead of failing
closed. The repaired implementation scopes every disposition and hardening proof
to one promotion identity, rejects malformed state, and makes the release-
candidate handoff read the repository-shared portfolio before it may freeze QA.
The architect also kept portfolio IO at the focused handoff-policy boundary
while preserving the ordinary settled verification command surface.

Refactorer candidate `f4139bdb06` and final architect candidate `0b4f8b4a9d`
each passed the exact 77-task `shell` plan with properties, acceptance, and
package proof. Their focused wall times were about 4 minutes 59 seconds and
4 minutes 53 seconds; package proof took 883 and 896 milliseconds. No task
failed and no all-20 checkpoint ran.

The integrated workflow exposes five inspectable judgment outcomes, keeps
plan-only readiness non-mutating, appends repeated observation occurrences,
rejects stale or colliding identities, supports selected, combined, carried,
and retired portfolio dispositions, and blocks release freeze until selected
hardening is review-ready in exact QA ancestry. All-pack coarse ownership still
requires immediate preparation. The initial repository portfolio is empty.
Recommendation: **continue** with this judgment contract and evaluate real
observations at the next user-requested master-promotion intake; do not create a
new verification program merely to populate it.
