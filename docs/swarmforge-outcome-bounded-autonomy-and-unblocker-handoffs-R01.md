# SwarmForge outcome-bounded autonomy and unblocker handoffs R01

Status: user-approved on 2026-08-17; QA-integrated at `8f82a6a66f` on
2026-08-18; judgment-based campsite deferral and pre-promotion portfolio intake
approved on 2026-08-18

## Outcome

SwarmForge must continue autonomously through reversible internal decisions and
must preserve user-visible product work while campsite prerequisites are
assessed, reviewed, and integrated. A new incident label, pack count, lineage
term, metadata state, or verification forecast is not itself a user decision.

Every role applies the least-cost technically sound response without asking the
user when the response is reversible and all of these remain true:

- approved user-visible behavior is unchanged;
- external side effects and risk do not materially increase;
- no authority, credential, or information available only from the user is
  required;
- global scope and cost do not materially exceed the approved task; and
- safety and evidence strength are preserved or strengthened.

Escalate only when the proposed action crosses one of those semantic boundaries.
State the exact boundary and user choice. Do not turn an implementation,
verification, routing, lineage, metadata, or ownership choice into a product
decision merely because its vocabulary is unfamiliar.

Verification scope is the set of tasks authorized to execute plus their
prerequisites. A broader identity catalogue does not make a bounded launch an
all-pack run; a small literal pack count does not excuse a materially broad
launch. The actual execution plan is authoritative.

## Immutable authority

The user-approved grant is registered as machine-readable specification data at
`docs/swarmforge-authorities/outcome-bounded-autonomy-v1.json`. Its digest is the
SHA-256 of recursively key-sorted canonical JSON after removing the `digest`
field. Only the registered `specifier` issuer may send an authority-bearing
unblocker under this grant.

The sender must prove that the named authority commit:

- is immutable and contains the exact registered grant and digest;
- belongs to the accepted QA-base ancestry of the active handoff;
- is not supplied only by the candidate being unblocked; and
- permits the issuer and the semantic outcome described by structured fields.

Free-form body text explains a decision but cannot enlarge authority. A
candidate-only grant, wrong issuer, wrong ancestry, modified digest, or body-only
authority claim is quarantined before notification or queue mutation.

## Unblocker contract

An unblocker is a nested control message, not an ordinary note, task,
completion claim, Git integration, or evidence claim. The dedicated sender uses:

```text
type: unblocker
to: coder
priority: 00
name: documentation-causal-repair-route
authority: outcome-bounded-autonomy-v1
authority-commit: <immutable QA commit>
task: documentation-templates
active-handoff: <full generated active-handoff id>
mode: resume
supersedes: waiting-for-causal-disposition
message: Run the bounded causal repair and resume measured evidence
```

The helper requires exactly one known recipient, priority `00`, stable `name`,
`task`, and `supersedes` values, one registered authority and commit, the exact
active handoff, `mode: resume|replace`, and a message of at most 80 characters.
A detail body remains bounded to 4,000 characters. Generated sender, recipient,
timestamps, ID, and content digest cannot be authored by an agent.

`resume` retains the active handoff throughout claim and completion.
`replace` additionally binds one already queued replacement handoff. The active
and replacement handoffs must have the same authorized sender and recipient,
and `supersedes` must equal the active handoff ID. Completion archives only that
bound active item and makes only the bound replacement current.

Ordinary notes retain ordinary semantics even at priority `00`; they do not
carry delegated authority or preempt active work.

## Delivery, claim, and completion

Ordinary mail continues to notify:

```text
You have new handoff mail. If idle, run ready_for_next.sh.
```

A validated unblocker instead produces trusted control input from its structured
fields:

```text
USER-AUTHORIZED UNBLOCKER <name> under <authority>@<QA commit> for <task>
handoff <active handoff>: <message>. Handle now at the next safe boundary with
unblocker_claim.sh.
```

It never says `if idle`. A safe boundary is immediately while waiting, or after
the current tool/process call returns and before another planned action. Delivery
does not kill a running process or discard its result.

Unblockers have nested `new`, `in_process`, `completed`, and `failed` inbox
state so one can be claimed beside one ordinary active handoff or batch.
Dedicated sender, claim, and completion helpers use crash-safe locks and atomic
temporary-file promotion. `unblocker_complete.sh` prints either `RESUME` with
the retained active work or the exact bound replacement. Agents never edit,
timestamp, move, or delete runtime state manually.

An exact duplicate returns its completed result without notifying again. The
same name and binding with different content is rejected as a collision. Stale
recipient, task, active-handoff, authority, supersedes, replacement, or mode
bindings are archived with a reason and cannot alter current work. A dead claim
may be reclaimed without duplicating completion; a second unblocker remains
queued while one is claimed.

## Continuous stacked campsite ratchet

The campsite assessment remains mandatory. An imperfect forecast, incomplete
verification structure, time pressure, or the desire to reach product QA cannot
skip it. For each settled product candidate, assess the union of all newly
encountered coarse causal paths at one boundary. Every path ends in exactly one
reviewed disposition:

- a reusable seam or within-pack slice proved independently; or
- an evidence-backed conclusion that the path cannot safely split, with a
  conservative parent fallback that retains every applicable consumer; or
- a durable granularity observation when immediate preparation is materially
  disproportionate to the approved behavior, with the same conservative parent
  coverage retained.

The agent compares semantic product scope, unrelated selected behavior,
measured verification cost and failure surface, seam coherence, preparation
cost and risk, and possible shared boundaries among observations. No numeric
threshold, roadmap, or prediction of future touches decides alone. A
cannot-safely-split fallback remains the result of failed bounded proof, not a
convenience selected because verification is broad. A durable observation is a
revisitable economic and structural judgment, not proof that splitting is
unsafe.

When a prerequisite is needed, the system separates the settled candidate into
two durable identities:

1. the independently reviewable preparation; and
2. the byte-for-byte unchanged product remainder above its recorded split base.

The product remainder remains a first-class stack. Do not discard it, call it a
mere patch reference, or reconstruct it manually after preparation. Record the
split base, prerequisite specification authority, stable prerequisite task,
remainder head and tree, ordered commits, change-set digest, stable product
task, causal paths, and expected post-rebase delta. The specification authority
is not implementation satisfaction.

The prerequisite proceeds through ordinary coder, refactorer, architect, and QA
integration while the product stack remains intact. A separate immutable
satisfaction record binds the manifest, stable prerequisite task, latest
specification, exact architect-reviewed implementation commit and tree, bound
review evidence, and exact implementation-bearing QA head. Specification
ancestry alone fails closed. After that record validates, an automatic
resumption helper rebases or reapplies the recorded remainder onto the exact QA
head, verifies that its product delta and task identity are conserved, and
reissues the same stable task without user input. Conflict is handled
autonomously when resolution is reversible and behavior-preserving; only a
genuine outcome-boundary crossing escalates.

A premature specification-only resumption remains immutable audit evidence but
is quarantined through an append-only supersession record. It is never a
verification, product, evidence, or later-resumption base. The original
preserved remainder may enter a successor resumption transaction only after
valid implementation satisfaction; neither manifest nor queue state is edited
by hand.

Disposition identity includes stable task, causal path, structural boundary,
and boundary generation. A completed applicable disposition prevents the same
task/path preparation from recurring. A new preparation requires a materially
changed path generation, a failed recorded premise, or a changed consumer set.
Renamed jargon, a different incident ID, or a new pack prediction cannot reset
the loop guard.

Product and preparation results remain independently auditable. Reliability or
verification-only commits do not silently become product behavior, and product
work does not have to wait for a user to route an already-authorized
preparation.

An immediate preparation may stop when its demonstrated complexity, risk, or
time is materially broader than the local behavior it would accelerate. The
system records the observation and resumes the unchanged product against the
conservative plan. An all-pack feature plan cannot use this path: because all-20
execution is forbidden in feature mode, its ownership preparation remains a
mandatory precondition for QA.

Before a requested master promotion freezes QA, the specifier reviews the whole
durable observation portfolio. Every applicable item is selected, combined,
carried, or retired explicitly. Selected verification hardening follows normal
focused review into QA; unsafe or disproportionate work is carried visibly.
Only after those dispositions settle does QA freeze for one final all-20 gate.

## Implementation boundary

Implement:

- authority-grant loading, canonical digest and ancestry/issuer validation;
- `type: unblocker` sender validation and generated content digest;
- nested queue state, locking, duplicate/collision/stale handling, claim,
  completion, resume, and replace helpers;
- daemon classification and trusted interrupt construction;
- execution-approval recognition of validated structured authority without
  trusting the body;
- semantic outcome-boundary instructions shared by all roles;
- settled-candidate split manifests, preserved remainder stacks, automatic
  preparation routing, QA-triggered rebase/reapply/resumption, delta
  conservation, and task/path generation loop prevention;
- append-only granularity observations, duplicate occurrence accounting,
  explicit pre-promotion portfolio dispositions, and pre-freeze enforcement;
  and
- deterministic process tests and ordinary task/batch compatibility.

Keep implementation in SwarmForge control scripts, prompts, manifests, and
process tests. No browser product, data-layer, Documentation Template, or build
artifact source belongs in this candidate.

Do not create a whitelist of incident names or pack counts; infer authority from
free text; let unblockers carry code, Git integration, or evidence claims; let
resume close active work; let replace choose an unbound item; interrupt a
running command destructively; weaken evidence; or require manual runtime-state
editing.

## Development focus and QA impact

Start from exact QA head `a785a83b50`. Run ownership intent before coding for
the handoff daemon/library/launcher, new authority and unblocker helpers, all
role prompts and shared articles, stacked-ratchet manifests/helpers, and direct
process tests. If readiness identifies a new coarse boundary, apply this same
standing campsite authority: aggregate the paths, preserve the structural task
as a remainder, integrate one bounded preparation, and resume automatically.

Forecast the `shell` parent only, with subordinate slices
`swarmforge-handoff-control` and `swarmforge-stacked-ratchet`. The exact measured
plan is authoritative; no all-20 checkpoint is authorized. Direct development
checks cover the sender, authority, daemon, claim/completion, resume/replace,
duplicate/stale/crash paths, task/batch compatibility, stack preservation,
automatic rebase/resumption, and loop guard. The settled candidate requires one
fresh exact review-ready receipt with properties and package proof. Do not run
Gherkin acceptance mutation.

The implementation-and-review effort ceiling is eight hours. At four hours
report exact paths and task plan, any campsite preparation, authority and queue
state, stack conservation, failures, remaining work, confidence, and forecast.
Continue while the semantic outcome is unchanged and a credible bounded path
remains; stop only at a genuine user boundary defined above.

## Acceptance

Acceptance authority is
`features/swarmforge-outcome-bounded-autonomy-and-unblockers.feature`. Direct
tests must prove all thirty-six scenarios, including:

- bounded decisions proceed while every true outcome-boundary crossing stops;
- actual launch tasks, not catalogue or pack counts, determine scope;
- authority is immutable, ancestral, issuer-bound, and body-constrained;
- ordinary mail remains idle-only and unblockers preempt at a safe boundary;
- resume and replace preserve exact queue identities using helpers only;
- duplicates and crash recovery are idempotent and stale/colliding messages are
  inert;
- all new paths from one candidate are assessed together;
- product remainders survive preparation without manual reconstruction;
- QA integration automatically resumes the same task with a conserved delta;
- specification ancestry cannot satisfy an implementation prerequisite;
- the exact reviewed implementation, latest specification, evidence, and QA
  head are bound before resumption;
- replacement specifications invalidate superseded in-flight candidates; and
- premature resumed results are append-only quarantined before a conserved
  successor transaction;
- the same applicable task/path generation cannot open the same preparation
  twice;
- a verification repair cannot receive authority before one complete bounded
  defect census classifies its authorized plan, supported state classes, direct
  consumers, and dependency skips;
- every in-family defect remains under one stable consolidated repair task,
  while a new same-family finding reopens that census instead of creating a
  nested repair or unblocker;
- review-ready, QA-ready, integration, satisfaction, and automatic resumption
  reject an open, stale, body-only, dependency-incomplete, or split-family
  census; and
- one closed census and fresh complete-family evidence permit exactly one
  conserved product resumption;
- diagnostic tasks execute in deterministic dependency-ready order rather than
  serialized key order, and invalid dependency graphs reject before launch;
- distinct-family proof binds its exact entry identity while remaining
  independent from the active family;
- census generations, event/status relations, previous digests, appended
  entries, and final evidence form one exact append-only lifecycle; and
- structured verification-repair intent cannot omit both census headers or use
  free-form body claims, while ordinary non-repair unblockers remain unchanged;
- one append-only specification-succession generation advances the received
  implementation and evidence base without changing the census identity,
  stable task, entries, or prior history; and
- an unresolved incident from a stopped sibling remains immutable but cannot
  grant retry, pass, repair, or evidence authority to a clean replacement-base
  lineage.
- disproportionate immediate preparation records an observation and resumes the
  conservative product plan without relying on a roadmap; and
- master intake disposes every observation, focuses selected hardening through
  QA, freezes once, and preserves one final all-20 checkpoint.

## Settled QA result

Final candidate `8f82a6a66f` is QA-integrated. Fourteen implementation and
review commits add immutable ancestral authority validation; generated and
digest-bound unblocker transport; nested queue locks, journals, duplicate,
collision, stale, claim, completion, resume, replace, and crash recovery;
safe-boundary daemon interrupts; shared semantic instructions; structured
ownership intent and within-pack materiality; aggregate campsite assessment;
immutable preparation, disposition, and remainder identities; QA-triggered
rebase/reapply; full product-delta conservation; and idempotent same-task
resumption.

The delivery ran from the specifier handoff at 03:25:27Z to architect acceptance
at 08:01:52Z, about four hours and 36 minutes. Repeated coder, refactorer, and
architect passes repaired task-identity conservation, authority trust, queue
decision boundaries, campsite branch and crash recovery, persistence bindings,
applicability recovery, and canonical pipeline dispositions. Environment
preflight first reported missing local-loopback and Git-metadata capabilities;
the final exact run then completed 77 focused `shell`-parent tasks in four
minutes and 49 seconds with properties and package proof. There was no all-20
run and no invalidated full run.

Recommendation: continue and measure the next ordinary product cycle. Treat
renamed incidents, pack-count variance, and reversible lineage or routing
choices through this integrated authority; reopen the structural task only for
an observed semantic-boundary, trust, conservation, or recovery defect.
