# QA-branch release pilot scorecards R01

Status: historical delivery evidence split from the active pilot rules on
2026-08-30

These scorecards record settled results. They do not change the active rules in
`docs/qa-branch-release-pilot-R01.md`.

## First cumulative master-promotion scorecard and decision

The first cumulative promotion completed on 2026-08-21. `qa` and `master` were
fast-forwarded from master base `64e7a43c95` to exact final-ready commit
`70c94a8ce6` and tree `704aba4f903b`. Forty QA-ready handoffs were accumulated.
The observation portfolio was empty at freeze.

Eight complete-gate attempts were started. Four failed and remained recorded;
four passed. Two passing candidates were superseded by later repairs. A third
pass proved the final tree but was bound to the closure task and intermediate
base, so it remained valid terminal proof without being valid promotion evidence.
The promotion-bound final run passed all 884 tasks across every runnable pack,
properties, generated acceptance, browser observations, and package creation in
22 minutes 35.358 seconds. Its durable evidence digest is
`89e730ab85bb71793fa49a6584ff9077ff8325d282588fa229e8ff3b9939f9d8`.

The current release lineage closed 29 incident records through nine corrective
commits or checkpoint adjustments; 19 audited off-lineage records were retired as
nonblocking. Promotion authorization to the master fast-forward took 4 hours
23 minutes 2 seconds. The final gate amortized to 33.9 seconds per accumulated
task. The baseline model reports 11 hours 30 minutes 57 seconds of gross terminal
time avoided relative to forty independent promotions, but this is not claimed as
measured net saving because the four partial failed runs lack reliable completion
timestamps.

The settled recommendation is **adjust**: retain the exact final all-runnable-pack
gate and priority-driven natural-lull promotion timing; improve pre-promotion
checks for branding expectations, generated-test ownership, Flow geometry,
incident-ledger consistency, and exact promotion task/base evidence binding. The
user explicitly rejected an artificial batch-size limit on 2026-08-21. Future
scorecards may use task count to explain amortization and waiting time, but must
not convert it into a release trigger or target.

## Flow schema-editor scrolling QA measurement

Approved task `flow-instance-schema-editor-scrolling` was first dispatched at
11:22:53Z on 2026-08-18. Read-only intent paused product coding, the independently
reviewed route-layout slice reached QA, and the product was reissued from exact QA
at 13:40:43Z. The resumed role intervals were 1 hour 35 minutes 37 seconds from
coder claim to review handoff, 29 minutes 7 seconds in refactorer review, and
15 minutes 8 seconds from architect claim to `qa-ready`. Product reissue to
`qa-ready` was 2 hours 20 minutes 18 seconds; initial approved dispatch through
`qa-ready`, including ownership preparation, was 4 hours 38 minutes 8 seconds.

Coder review evidence ran 147 focused tasks in 8 minutes 31 seconds. Because the
architect refreshed the changed Flow handler mutation manifest, the final tree
received a fresh 147-task proof in 8 minutes 33 seconds, with `flow_graph`,
`layered_schema`, and `shell`, properties, installed scenario-047 browser
evidence, acceptance sessions, and 886-millisecond package proof. No complete
all-20 run occurred, and no pass was represented as master-ready or final
regression proof.

The bounded repairs kept the scrolling assertion in Shell stylesheet ownership,
made the tall Flow evidence fixture compatible with existing example-completeness
contracts, and declared and conserved all eight runtime-047 evidence leaves.
There is no unresolved product failure. Recommendation: **adjust** the next
similar Flow slice by declaring its evidence-leaf partition and tall-fixture
compatibility before the first evidence run, while retaining the focused QA
pilot and exact ownership slice. Do not activate another broad verification
program from this timing variance.

## Guided Excel template authoring QA measurement

Approved task `guided-excel-template-authoring` was first dispatched at
21:16:40Z on 2026-08-18. Product work paused for the independently reviewed
eligible-repair admission prerequisite and resumed from exact QA scorecard
`4be970ec` at 06:03:13Z on 2026-08-19. The resumed product reached `qa-ready` in
2 hours 31 minutes 15 seconds and QA in 2 hours 33 minutes 41 seconds. Initial
dispatch through QA, including the prerequisite, was 11 hours 20 minutes 14
seconds.

Six successful focused checkpoints consumed about 29 minutes 45 seconds. The
settled final three-pack plan selected `flow_export`, `project_management`, and
`shell` with 135 tasks, properties, installed browser evidence, and package
proof. Two earlier `flow_export` acceptance failures received deterministic
repairs and atomic eligible-repair evidence; their exact dispositions remain
`terminal-verification-deferred`. Five passing focused trees were superseded by
later reviewed changes. No all-20 run occurred and no evidence was represented
as final regression or master-ready proof.

Recommendation: **adjust** the next similar authoring slice by settling its
acceptance example relations, installed evidence-key inventory, extracted-source
ownership, and layout properties before the first evidence run. Retain the
focused pilot and automatic eligible-repair route; do not activate a broad new
verification program from this local evidence-ordering variance.
