# QA-branch release pilot feature mode R01

This file is active authority for feature integration into `qa`. It does not authorize master integration or an all-runnable-pack checkpoint.

## Feature integration mode

Use this mode for a new behavior slice, correction, or other independently
reviewable change.

1. Start the specification and implementation lineage from current `qa`. Do not
   inherit an abandoned or unrelated task branch.
2. The specification names the smallest checks that directly observe the change,
   an elapsed effort ceiling, and a checkpoint expected by halfway through that
   ceiling. These are reporting expectations rather than automatic intervention
   gates. At halfway and at the ceiling, report progress, the cause of any
   variance, remaining work, confidence, and current forecast. Continue by
   default while product and requirement scope are unchanged and the completion
   path is bounded and safe. A bounded difference between the forecast QA-impact
   list and the canonical changed-path plan is not a scope expansion requiring a
   user decision: use the complete planned pack set, record the variance, and
   continue. Pause for a user decision when product or requirement scope expands,
   requirements need
   reinterpretation, failures repeat without a causal explanation, no credible
   completion path remains, or another safety boundary requires authority.
   Ownership readiness follows
   `docs/qa-verification-ownership-readiness-R01.md`. Before product coding, a
   read-only intent plan evaluates likely shared integration surfaces. After the
   first coherent commit and before a complete planned diagnostic or evidence
   run, exact plan-only preflight compares the canonical changed paths with the
   approved scope. A `coarse-boundary` all-pack result automatically starts the
   standing-authorized ownership-preparation stage and resumes the already-approved
   product only after that stage is QA-integrated. Genuinely global behavior,
   unavailable ownership, or changed product or safety requirements still stop
   for current user direction. The planner never omits owned packs to preserve
   the smaller scope, and a product candidate cannot narrow its own current/base
   ownership in the same evidence range. Within a bounded pack plan,
   `docs/qa-verification-granularity-ratchet-R01.md` distinguishes ordinary
   forecast variance from a proved `coarse-within-pack` boundary. Forecast
   variance proceeds automatically. A proved bounded boundary invokes agent
   judgment: prepare now when the verification benefit is proportionate, or
   record a durable observation and use the conservative parent-pack plan when
   preparation would be materially broader, riskier, or more time-consuming
   than the approved product behavior. The judgment considers semantic mismatch,
   unrelated selected behavior, measured verification cost, seam coherence, and
   preparation cost and risk. It does not require a roadmap or forecast of future
   touches. An unproved refinement opportunity also uses the conservative parent
   plan. The all-pack `coarse-boundary` stop above remains mandatory.
3. Coder and refactorer run focused checks and record review-ready evidence. The
   architect completes architecture and quality review and runs focused checks
   for any changes or repairs. No role runs the all-runnable-pack gate in this mode.
   A reliability incident with an eligible causal repair, deterministic
   regression, exact focused review-ready evidence, and passing package proof is
   recorded as `terminal-verification-deferred`. That unresolved disposition
   permits focused review and QA integration only; it is neither resolution nor
   abandonment. Missing, failing, stale, or identity-mismatched proof remains
   blocking.
   The same bounded route applies when one exact governed diagnostic retry passes
   and is durably classified `confirmed-flaky`: that diagnostic remains
   classification proof only, the complete canonical owned-pack review and
   package must pass freshly, and atomic deferral records no invented repair.
   Reproduced, changed, unclassified, stale, multiply retried, uncovered, or
   identity-mismatched failures remain blocking. The incident is resolved only
   by matching passing evidence in the later explicitly requested all-runnable-pack
   checkpoint; terminal recurrence blocks final-ready recording.
   A later independently approved slice may start from that QA descendant. Its
   feature-mode roles do not audit, reverify, mutate, or re-defer every earlier
   incident, including one whose shared disposition was recorded on an abandoned
   parallel candidate. Failure-lineage ancestry and changed-path overlap alone
   create no incident proof obligation, do not attach the disposition to the
   later candidate, and do not require the parallel candidate to be merged. The
   later slice still needs its own exact focused evidence and package proof. Reopen one
   incident case by case only when ordinary focused work naturally reproduces
   its diagnosed failure boundary, or when the approved slice intentionally
   changes that incident's repair, regression, task-succession, runner, or
   evidence contract. Shared-infrastructure expansion remains subject to the
   preflight scope-choice rule in step 2. Otherwise leave the recorded incident
   unchanged for the frozen master-integration assessment.
4. The architect sends the exact candidate to the specifier with
   `readiness: qa-ready` and `verified: review-ready`. That claim must have bound
   focused evidence for the exact task, base, commit, tree, changed paths, and
   receipt.
5. The specifier may fast-forward `qa` to that exact candidate. QA integration is
   not master integration, release completion, or final regression proof.

After the architect's last candidate change, the required focused check is run
once in evidence-producing mode. Its receipt records review-ready evidence for
that exact tree; an ordinary preliminary run of the same plan on the same tree is
not required. A later change requires one new evidence-producing run.

## Development-focus and QA-impact convention

For ordinary features beginning after Flow relationship port snapping, use the
documentation-only convention in
`docs/feature-development-focus-and-advisory-scouting-R01.md`. The implementation
handoff distinguishes a minimal **development focus** for red/green iteration
from a bounded **QA impact** for the settled candidate. This is a knowledge
ratchet, not a new verification mechanism or intervention gate. Existing exact
changed-path planning remains authoritative, and the all-runnable-pack checkpoint remains
exclusive to explicit master integration.

The same document records the completed telemetry-disabled RepoWise scouting
pilot. Trial 4 changed neither development focus nor QA impact and its stale-index
refresh impeded the workflow, so routine checkpoints are stopped for now. Do not
add RepoWise to ordinary feature handoffs or make it a delivery condition. It may
still be selected explicitly for unfamiliar-code or known-hotspot investigation
when its existing index is already current; it cannot block work, widen evidence
on its own, or override the canonical registry.

The ownership-readiness program is the required non-advisory pre-coding check for
likely shared integration paths. It is distinct from stopped RepoWise scouting:
it evaluates the canonical verification registry, executes no product task, and
can route a standing-authorized preparation stage under its approved safeguards.
The granularity ratchet applies the same lifecycle inside a selected pack while
preserving complete exact-pack and terminal execution.

## Verification run intent

An ordinary focused invocation is `development-diagnostic` unless it carries
explicit review-evidence, governed repair-focused, or terminal-checkpoint
authority. A diagnostic receipt retains task output, timing, and local failure
detail, but it never creates or mutates repository-common incidents, retry
allowances, terminal deferrals, or handoff debt. It cannot support review-ready,
QA-ready, or final-ready evidence and cannot be retrospectively upgraded.

`--prepare-evidence` is explicit review-evidence authority. A failure during that
run creates the normal durable reliability incident. Governed repair-focused and
terminal invocations retain their existing durable semantics. Evidence recording
must validate the receipt's immutable run intent and reject a missing, mismatched,
diagnostic, or retrospectively upgraded intent. Later diagnostic success does not
erase an earlier diagnostic receipt.

The first implementation includes an audited compatibility pass for receipts
created before run intent existed. It may make an incident nonblocking only when
the source receipt proves that the invocation had no evidence task, repair
authority, terminal authority, or readiness claim and the disposition retains
the incident and immutable failure history. Missing or ambiguous authority stays
blocking. Existing eligible terminal-verification-deferred incidents remain
unresolved on their recorded candidates, including abandoned parallel
candidates. They do not enter a later
feature evidence preflight merely because changed paths overlap their inputs. No
carry-forward transition is recorded for an unrelated feature candidate; its
exact focused evidence and package proof cover its approved scope only. Master
integration evaluates the accumulated deferred incidents, their diagnoses, and
any repairs from another lineage against the frozen cumulative tree case by case
before the terminal checkpoint.

The following one-time bootstrap is completed and is not a precedent for later
feature work. Because the original correction changed shared runner semantics,
its first checkpoint
cannot satisfy ordinary path-only conservation against older deferred incidents.
One explicit `--run-intent-bootstrap` review-evidence invocation is permitted only
when the approved base contains the run-intent contract but lacks its
implementation and the candidate adds that implementation. Preflight must prove
that every other applicable incident is already eligible and terminal-deferred
and that the exact focused plan selects each deferred failure task or its declared
successor. Pending evidence then requires all of those tasks to pass freshly with
package proof before handoff may re-defer the incidents on the exact candidate.
Any unrelated, ineligible, uncovered, or ambiguous incident blocks. Once the base
contains run-intent implementation, bootstrap authority is exhausted.

Feature candidates must be independently understandable and revertible. Partial,
speculative, or known-failing work stays in task worktrees and never enters
`qa`. Persistence, concurrency, migration, security, packaging, and verification
infrastructure changes should normally occupy a release batch alone.
