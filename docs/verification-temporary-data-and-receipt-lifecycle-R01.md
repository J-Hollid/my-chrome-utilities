# Verification temporary data and receipt lifecycle R01

Status: draft for user approval

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

## Development focus

- Temporary-path ownership, terminal cleanup, and crash recovery contract.
- Receipt-consumer classification at QA integration.
- Shared incident evidence storage and last-consumer removal.

Smallest direct checks:

- `test/verification-contracts/execution-checkpoint-contract-test.mjs`
- `test/verification-contracts/evidence-promotion-contract-test.mjs`
- `test/settled-final-verification-workflow-test.mjs`

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
- `swarmforge/scripts/` — parent pack `shell`, subordinate slice `role workspace
  cleanup`, consumers role launch, handoff completion, and idle recovery.

The coder must run the read-only ownership-intent classification before product
coding. New focused modules are preferred for lifecycle policy and cleanup.
Existing runner, reliability-store, and role scripts remain thin callers. Do
not add lifecycle policy to an existing monolith.

## Effort and reporting

The implementation effort ceiling is four hours. Report progress after two
hours. Report changed-path forecast variance, remaining work, confidence, and
the completion forecast. Continue while the scope remains bounded and safe.

## Non-goals

- Do not add a general `/tmp` cleaner.
- Do not remove paths without verified project ownership.
- Do not weaken receipt identity or evidence-validity rules.
- Do not delete evidence for an unresolved or terminal-deferred incident.
- Do not make raw receipts permanent audit artifacts.
- Do not reactivate VTD-018 or run the all-runnable-pack gate in feature mode.
