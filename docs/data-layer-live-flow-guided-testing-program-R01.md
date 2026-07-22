# Data layer Live Flow guided testing program R01

## Authority and outcome

This program activates one bounded operator-driven testing slice across the active
Flow graph, canonical effective-schema compiler, and existing Live feed. In Live for
the active project, an operator selects a Flow, chooses a start Page frame, manually
matches captured events to Page-frame or Event-occurrence graph steps, and follows
only directed relationships exposed by the documentary Flow.

This is not automatic Assignment, temporal Flow execution, or proof that an entire
Flow passed. The product guides and records the operator's selected path while each
matched event receives ordinary per-Event schema validation.

## Entry and project context

`Flow test` is a visible Live action. It requires one active project and lists only
that project's Flows by human name. No Flow is inferred from repository order,
prior sessions, an observed event, or an Assignment. Without an active project the
action offers Open project and Create project.

After Flow selection, the start control lists every Page frame by Page name, lane,
and stable frame identity. Root Pages without incoming relationships are recommended,
but any Page frame may start a partial-path test. Repeated instances of the same Page
remain separate choices. Event occurrences cannot start before a Page is selected.

## Step and relationship guidance

Page frames and Event occurrences are both test steps. After a matched event is
validated, only targets of outgoing relationships from the current stable node are
offered next. `expected_next`, `alternative`, and `merge` remain directed traversal
kinds; no new execution meaning or `Parallel` kind is introduced. Optional labels
are shown when present, otherwise human source and target names are used.

The operator selects the next graph step before choosing an observed event. Nodes
without a current outgoing relationship are unavailable with an explanation.
Validation failure does not silently change the path or block the operator from
continuing through a defined outgoing relationship.

## Live event matching

Candidate feed rows remain operator-selected. They must be unmatched in this run
and captured after the previously matched event. A Page step shows observed Page
context evidence; an Event step shows Event identity and observation-source
evidence. These signals guide and filter but never choose a feed row automatically.
Earlier, reused, or incompatible events remain visible with their reason. One feed
event can be matched only once within a run.

The guided result is stored separately from any existing automatic validation on
the same observed event. Flow testing neither invokes the automatic assignment
resolver nor creates, updates, disables, or impersonates an Assignment.

## Effective schema selection

For a Page-frame step, validation uses that Flow Page instance's live effective
schema: applicable Shared Profiles, ordered Page Groups, Page contribution, and
sparse instance override. For an Event-occurrence step, validation uses the full
effective occurrence schema, combining its containing Page-instance branch, Event
branch, and occurrence override. Stable frame and occurrence identities keep
repeated Pages and Events distinct.

Each result records selection mode `Manual Flow test`, active project, Flow, graph
step, observed event, effective schema revision, issues, and exact provenance. It
claims no automatic winner and stores no copied schema payload.

## Defects and run history

Property issues use the existing Live feed and inspector presentation. The standard
defect report builder, persistence, and clipboard paths remain available with the
same payload, issues, target revision, and provenance as automatic validation, plus
Flow, graph step, matched path, relationships, and capture times.

Run history records each graph step, traversed relationship, observed event,
effective revision, validation result, and optional defect reference. Completing a
terminal or operator-ended run produces `Completed selected path`; it never says
`Flow passed`. Unchosen alternatives are `Not tested`. Saved Live sessions retain
the summary for review without resuming capture or matching.

## Non-goals

- no automatic event-to-step matching or Flow selection;
- no creation or requirement of Assignments;
- no background Flow execution, timing engine, or sequence assertion;
- no mutation of Flow topology, canonical contributors, or observed payloads;
- no claim that unchosen branches or the complete Flow were validated; and
- no activation of unrelated archived Live, release, preflight, or temporal-Flow
  programs.

## Acceptance inventory

| ID | Scenario | Required production evidence | Terminal condition |
|---|---|---|---|
| L01 | Live Flow guided testing 001 | active-project Flow query and absent-context UI | only active-project Flows can start a run |
| L02 | Live Flow guided testing 002 | Page-frame choices, roots, and repeated identities | every Page instance is selectable and distinct |
| L03 | Live Flow guided testing 003 | assignment bypass and Page-instance compiler input | Page validation uses live effective frame schema |
| L04 | Live Flow guided testing 004 | occurrence compiler input and ordinary issue UI | Event validation uses full occurrence schema |
| L05 | Live Flow guided testing 005 | outgoing relationship index and labels | only valid directed next nodes are actionable |
| L06 | Live Flow guided testing 006 | chronological candidate IDs and match history | no event is selected automatically or reused |
| L07 | Live Flow guided testing 007 | standard report builder, save, and clipboard adapters | Flow-scoped failures create ordinary defects |
| L08 | Live Flow guided testing 008 | saved-session summary and domain hashes | selected path is reviewable without domain mutation |

## Terminal acceptance

Both feature files must parse and IR-dry-check with no findings. The exact checkpoint
is:

```sh
node scripts/run-focused-acceptance.mjs --pack live_flow_testing
node scripts/package.mjs
```

The pack registers both contracts plus focused production evidence for active-
project Flow selection, Page start choice, Page and Event schema resolution,
relationship guidance, chronological manual feed matching, ordinary issue and
defect integration, saved run summaries, assignment bypass, and domain immutability.
It declares its active Flow graph and layered-schema dependencies in the pack
registry rather than invoking additional commands.
