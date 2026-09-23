# QA verification granularity ratchet staging history R01

Status: historical implementation evidence split from the active authority on
2026-08-30

This file records one settled application of the ratchet. The active rules are
in `docs/qa-verification-granularity-ratchet-R01.md`.

## Approved durable-runtime staging disposition repair

Independent product review required project asset-body bytes and their matching
Draft metadata to commit atomically. Stopped coherent product candidate
`d139725a1a`, based on exact QA `1f68d463d7`, implements that requirement by
adding staging directly to `src/data-layer-durable-project-runtime.ts` and
`src/durable-project/runtime-core.ts`. Exact readiness correctly returns
`granularity-assessment-required`: those two broad controller paths add the
otherwise unrelated `flow_graph`, `live_flow_testing`, `layered_schema`, and
`property_set_flow_sections` families to a 13-pack/617-task product catalogue.
No task from that catalogue has been launched. Candidate `d139725a1a` remains a
patch reference only.

This is the intended campsite trigger, not a new product decision. Derived task
`verification-slice-documentation-templates` starts from current QA
`1f68d463d7` and establishes the durable prerequisite independently. It must not
merge or cherry-pick the stopped product commit, implement a Template Library or
renderer, or use a same-candidate slice to narrow its own preparation evidence.

The repair must establish all of the following:

1. **Reusable staging seam.** Prefer one independently owned project asset-body
   staging component under the durable-project boundary. The generic runtime may
   expose that component, but the storage keying, pending-body lifecycle, and
   command attachment must live outside the broad runtime controller wherever a
   truthful extraction is possible. The seam is reusable by any project-owned
   binary body; it contains no Excel, Documentation-kind, template-assignment,
   or workspace UI policy.
2. **Atomic command semantics.** A staged body is copied, project- and namespace-
   scoped, and attached only to the matching project Draft command. Matching
   metadata and bytes commit in the repository's one read-write transaction.
   Success clears only committed bodies. Validation failure, transaction abort,
   quota failure, or conflict leaves the exact unsaved command and bodies
   available for the existing retry or conflict-resolution path. Explicit
   rejection or caller discard removes its pending bodies. No successful state
   can contain metadata for a missing body, and no failed upload can leave a new
   durable orphan.
3. **Exact ownership and consumers.** A future seam change is owned by
   `durable_project_repository` and directly observed by the durable runtime
   unit/property contract. Its exact product consumer is `flow_export` through
   the existing `documentation_template_workspace` slice, which continues to
   reach the declared Shell workspace consumer. The slice declaration names the
   exact new source path, tasks, prerequisites, observable boundary, and
   consumers. It does not narrow arbitrary changes to either broad runtime file.
4. **Durable path disposition.** Add one task-scoped disposition for each of
   `src/data-layer-durable-project-runtime.ts` and
   `src/durable-project/runtime-core.ts`. When the reusable extraction is
   proved, each is an integrated-seam disposition whose replacement is the new
   staging seam and the staging capability is already present on QA before the
   product resumes. If complete extraction or exact consumer proof fails within
   the effort boundary, record an explicit reviewed parent fallback for that
   path instead. Either result is final for this product lineage and prevents
   the same assessment from looping again.
5. **Conservative preparation proof.** The preparation's own exact current/base
   plan remains authoritative for changes to the two broad runtime files; the
   newly declared slice cannot narrow that same evidence range. Prove unchanged
   generic save ordering, route hydration, projection notifications, retries,
   rejection, reapply/merge, Undo/Redo, schema saves, visual assets, archive
   compatibility, exact-pack task closures, terminal-full obligations,
   quarantine behavior, and package contents. The preparation may run its
   bounded canonical plan with properties and package proof, but never the
   all-20 gate.
6. **Clean product resumption.** After architect `qa-ready` integration, reissue
   stable task `documentation-templates` from that exact QA head without another
   user decision. Reconstruct `d139725a1a` as task-owned patches only. The
   resumed product must use the integrated staging seam and leave both broad
   runtime files unchanged, unless their recorded decision is the explicit
   parent fallback. It then runs a fresh exact preflight. The earlier exact
   10-pack boundary is the conservation target, not a hard-coded pack-count
   waiver; the measured canonical plan remains authoritative.

**Development focus:** extract and directly test the generic staged-body
lifecycle; connect it to the existing durable Draft transaction; add the exact
slice, two durable dispositions, current/base conservation fixtures, and the
automatic resumption regression. Begin with the runtime unit and property tests,
the ownership-readiness test, and the verification process-contract test.

**QA impact:** forecast `durable_project_repository`, `flow_export`, their
declared `shell` consumer, and package proof. Read-only intent and exact
candidate preflight determine the preparation's complete conservative plan; a
bounded wider result proceeds and is recorded, while an all-20 result, missing
ownership, weakened evidence, or changed persistence meaning stops. Do not run
the stopped product's 13-pack/617-task catalogue as preparation evidence.

The preparation implementation-and-review effort ceiling is four hours from
coder receipt to architect `qa-ready`. At two hours report the chosen seam or
fallback per path, atomic failure/retry status, exact preparation packs and
tasks, conservation status, failures, remaining work, confidence, and forecast.
Continue while the approved behavior is unchanged and a bounded safe completion
path remains.

## Settled durable-runtime staging repair result

Specification `397cdd27de` was handed to the coder at 18:34:55Z on 2026-08-17
and received four seconds later. Final candidate `06222ff00f` reached the
refactorer at 20:02:50Z, the architect at 20:06:33Z, and the specifier at
20:11:50Z; QA fast-forward followed at about 20:13Z. Handoff-to-QA time was about
1 hour 39 minutes, inside the four-hour ceiling and before the two-hour status
checkpoint.

The preparation extracts `src/durable-project/project-asset-body-staging.ts` as
the reusable seam. It records `integrated-seam` dispositions for both
`src/data-layer-durable-project-runtime.ts` and
`src/durable-project/runtime-core.ts`. A seam-only change selects exactly
`durable_project_repository`, its `flow_export` Documentation consumer, and the
existing `shell` consumer. The preparation's own current/base evidence remained
conservative at eight packs and 217 tasks because it changed the broad runtime
and repository paths; it did not use its new slice to narrow the same range.

Independent review found two substantive atomicity defects. Initial candidate
`ebf5fe6033` allowed an already queued unrelated Draft to claim a body staged
later and did not bind selective conflict resolution to the originating
operation. Candidate `7faf9fea61` added operation identity and queue ownership,
but could still retain nonconflicting metadata while discarding its body during
a mixed selective merge. Final candidate `06222ff00f` makes a body-bearing Draft
operation all-or-nothing when conflict selection would drop any of its patches.
It also proves retry, reapply, reviewed rejection, queued ordering, project
isolation, generation safety, transaction rollback after body writes begin, and
the two retained/rejected merge outcomes.

Three complete eight-pack checkpoints passed all 217 tasks with properties and
package proof in about 11 minutes 55 seconds, 11 minutes 51 seconds, and 11
minutes 52 seconds. The first two passing trees were superseded by the review
repairs above. Architect exact-tree refresh reused the final conserved artifacts
in about seven seconds. There was no failed verification run and no all-20
attempt. Exact-pack task closures, existing terminal-full obligations,
quarantine behavior, generic save and route behavior, visual bodies, Undo/Redo,
schema saves, and archive compatibility remain conserved.

Recommendation: automatically reissue stable task `documentation-templates`
from this scorecard's exact QA commit and reconstruct stopped candidate
`d139725a1a` as task-owned patches only. The product must use the integrated
staging capability and leave both broad runtime files unchanged. Its fresh exact
preflight is authoritative; the earlier 10-pack result is a conservation target,
not a numeric waiver.
