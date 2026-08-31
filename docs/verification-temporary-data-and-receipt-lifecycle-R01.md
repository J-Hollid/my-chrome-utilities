# Verification temporary data and receipt lifecycle R01

Status: approved; field cleanup correction in progress

Prepared: 2026-08-31

## Purpose

Keep `/tmp` temporary without removing verification proof before its last valid
consumer has finished. Separate temporary-data cleanup from evidence-retention
decisions. The runner owns cleanup of run data. The specifier owns receipt
disposition at successful QA and master integration boundaries.

## Data classes

Every project-owned verification path has one class and one owner:

- **Working data** includes task temporary files, Chrome profiles, staging
  copies, locks, and atomic-write stages. It can exist in `/tmp` only while its
  owner is live or its durable disposition is incomplete.
- **Reusable evidence** is an exact receipt or archive that a pending handoff,
  integration transaction, or authorized incident transition can still use. It
  is stored in project-local durable storage outside `/tmp`.
- **Obligation evidence** supports an unresolved or terminal-deferred incident.
  It remains durable until the obligation receives a terminal disposition.
- **Consumed or invalid evidence** has no current authorized consumer. Raw task
  output and archives in this class are removed after compact integration or
  release facts are recorded.

A temporary path cannot become durable because another file refers to it.
Temporary leases, links, manifests, and empty directories are removed with the
owned data.

## Cleanup boundaries

The run cleans each owned temporary path after success, recorded failure, or
cancellation. Cleanup starts only after required receipts and incident state
are durable. A failure for one path does not stop cleanup of independent paths.
Each remaining failure reports its run, owner, path, and cause.

Startup recovery can remove only paths with a valid project ownership record.
It confirms that the owner is dead and that durable disposition is complete. It
does not scan and remove arbitrary `/tmp` content. If safe evidence recovery is
not possible, it retains the exact path and reports one blocker.

Role review workspaces belong below project `.worktrees/`. The workflow removes
inactive review worktrees, exported review repositories, and their Git
administration records when their task disposition is complete. It preserves a
live workspace or one with incomplete evidence disposition.

## Receipt disposition

At a successful feature integration, the specifier evaluates every receipt and
archive created for that feature:

1. Confirm the receipt identity and its candidate, base, tree, task, plan, and
   run intent.
2. Name its current authorized consumer, if one exists.
3. Retain exact evidence until that consumer completes.
4. Retain incident evidence until the incident receives a terminal disposition.
5. Remove consumed, stale, or mismatched raw evidence when no active obligation
   needs its history.
6. Keep only compact hashes, timestamps, identities, and results that the
   integration record and delivery scorecard require.

The same check occurs after successful master integration. A final receipt is
not a permanent artifact after master advances, all incident dispositions are
complete, and the compact release record is durable.

## Shared evidence bytes

When several active incidents need byte-identical evidence, durable storage
keeps one validated content identity. Each incident binds that identity. The
last active consumer releases the content. This reduces storage use but does
not replace cleanup or make `/tmp` a durable store.

## Capacity protection

Before a verification operation starts, capacity preflight calculates its
maximum temporary requirement and a safety reserve. The operation does not
start when the available capacity is too small. The diagnostic gives the
required and available byte counts.

## One-time backlog disposition

After this feature reaches QA, the specifier applies the same ownership and
retention rules to existing project-owned `/tmp` data. The cleanup records a
manifest of removed paths and reasons. It does not remove an active workspace,
an uncommitted user change, unresolved evidence, or an unowned path.

## Field cleanup correction

The first backlog cleanup reduced `/tmp` from 5.4 GiB to 471 MiB. It exposed
two gaps that normal run cleanup did not cover:

- successful master integration left raw checkpoint-attempt records and
  resolved-incident receipt and package archives in repository temporary
  storage after the final Git note recorded their compact identities;
- process-id reuse could make startup recovery treat a dead owner as live.
- global workspace cleanup could treat an empty handoff queue as proof that a
  registered role was inactive and remove the workspace of a live role session.

Post-integration disposition must validate the exact final Git note, confirm
that no unresolved incident refers to the data, remove completed raw attempts
and archives, and preserve current unintegrated QA attempts and active
obligations. Process ownership must bind the process id to a stable process
start identity. A matching id with a different start identity is a dead owner,
not a reason to retain temporary data. Role workspace cleanup must also check
the role session state. An empty handoff queue does not prove that the role is
inactive.

## Development focus

- Temporary-path ownership, terminal cleanup, and crash recovery contract.
- Receipt-consumer classification at QA integration.
- Shared incident evidence storage and last-consumer removal.
- Post-integration removal of terminal checkpoint-attempt and incident archive
  data after exact Git-note validation.
- Process owner validation that cannot confuse a reused process id with the
  original owner.

Smallest direct checks:

- `test/verification-contracts/execution-checkpoint-contract-test.mjs`
- `test/verification-contracts/evidence-promotion-contract-test.mjs`
- `test/settled-final-verification-workflow-test.mjs`
- `test/verification-contracts/temporary-storage-lifecycle-test.mjs`
- a focused post-integration runtime-disposition contract test

## QA impact

Expected parent packs are `verification_process` and `shell`. Exact changed-path
planning remains authoritative. No all-runnable-pack checkpoint is authorized
in feature mode.

Likely existing shared integration surfaces and proposed prefixes:

- `scripts/verification-execution/` — parent pack `verification_process`,
  subordinate slice `verification temporary storage`, consumers runner,
  browser observations, and task launch.
- `scripts/verification-reliability-` — parent pack
  `verification_process`, subordinate slice `verification evidence retention`,
  consumers incident store, evidence recording, and terminal closure.
- `scripts/settled-final-verification.mjs` — parent pack
  `verification_process`, subordinate slice `integration receipt disposition`,
  consumers QA and master integration evidence.
- `scripts/verification-checkpoint-attempt.mjs` and
  `scripts/verification-reliability-persistence.mjs` — parent pack
  `verification_process`, subordinate slice `post-integration runtime
  disposition`, consumers the checkpoint store, incident archive store, and
  final Git-note evidence.
- `swarmforge/scripts/` — parent pack `shell`, subordinate slice `role workspace
  cleanup`, consumers role launch, handoff completion, and idle recovery.

The coder must run the read-only ownership-intent classification before product
coding. New focused modules are preferred for lifecycle policy and cleanup.
Existing runner, reliability-store, and role scripts remain thin callers. Do
not add lifecycle policy to an existing monolith.

The stopped field-cleanup candidate changed no product source. Its known
integration paths are `scripts/verification-execution/temporary-storage-lifecycle.mjs`,
`scripts/verification-checkpoint-attempt.mjs`,
`scripts/verification-reliability-persistence.mjs`, and the settled final
verification command boundary. No new source prefix or parent pack is
proposed. The coder must classify ownership intent before changing executable
code.

## Effort and reporting

The correction effort ceiling is two hours. Report changed-path forecast
variance, remaining work, confidence, and the completion forecast if the work
reaches 90 minutes. Continue while the scope remains bounded and safe.

## Non-goals

- Do not add a general `/tmp` cleaner.
- Do not remove paths without verified project ownership.
- Do not weaken receipt identity or evidence-validity rules.
- Do not delete evidence for an unresolved or terminal-deferred incident.
- Do not make raw receipts permanent audit artifacts.
- Do not reactivate VTD-018 or run the all-runnable-pack gate in feature mode.
