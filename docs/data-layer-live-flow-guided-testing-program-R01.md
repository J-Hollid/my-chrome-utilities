# Data layer Live Flow guided testing program R01

## Authority and outcome

This program activates one bounded operator-guided testing slice across the active
Flow graph, canonical effective-schema compiler, and existing Live event feed and
event details. It supersedes the separate guided-test workflow previously described
by this program.

Flow testing is a context applied to the existing Live experience. The operator
selects one active-project Flow above the event feed, opens any observed event
through the feed's ordinary event-details action, links it to an eligible Flow Page
frame or Event occurrence, and receives ordinary event validation and defect
reporting against that step's effective schema.

This is not automatic Assignment, temporal Flow execution, or proof that an entire
Flow passed. The product records the operator's selected path while keeping the
event feed and event details as the primary interaction and review surfaces.

## Flow context in the event feed

The Live event feed owns the Flow test selector. It lists only the active project's
Flows by human name. Selecting a Flow sets the current Live session's Flow-test
context without replacing, filtering, reordering, or duplicating the event feed.
The selected Flow is visible above the feed, and every existing event row retains
its ordinary details action.

Selecting a Flow does not preselect a graph step or observed event and opens no
separate guided-test workspace, candidate-event feed, or wizard. No Flow is inferred
from repository order, prior sessions, observed payloads, or Assignments. Without
an active project, Flow-test context is absent and Live offers Open project and
Create project.

## First event and start Page ordering

Opening an unlinked observed event in a newly selected Flow context adds a Flow-step
selector to its existing event details. The initial selector contains Page frames,
not Event occurrences.

Root Page frames with no incoming relationships are listed first. Remaining Page
frames follow, so an operator can begin at a specific later context. Within both
groups, frames retain deterministic graph order. Repeated instances of one Page
remain distinct stable choices.

A Flow containing only loops may have no root Page. In that case every Page frame
remains available in graph order and the details explain that no root Page exists.
Root status is a preference and presentation order, never a restriction on where
the operator may start.

## Linking and ordinary event validation

Selecting a Page frame links the open observed event to the selected Flow, stable
frame identity, and current Live session. It immediately validates the observed
payload against that Flow Page instance's live effective schema: applicable Shared
Profiles, ordered Page Groups, Page contribution, and sparse instance override.

The validation appears in the same event-details presentation used when automatic
assignment selected a schema. Property highlighting, issue actions, provenance,
and the usual defect report builder are reused. Flow context and Flow-produced
validation details are stored on the same observed-event presentation model, so
the ordinary Create defect report action receives both. Event details expose one
validation issue presentation and one defect action; they do not append a separate
Manual Flow test result list or Flow-only defect action. The recorded Flow-step
link remains visible in the Flow-step section. The result records selection mode
Manual Flow test, Flow, graph step, observed event, effective schema revision,
issues, and provenance.

This session link is not a project Assignment and does not invoke the automatic
assignment resolver. It creates or changes no Assignment, canonical contributor,
Flow topology, schema payload copy, or observed-event payload.

## Relationship-guided next selections

After an observed event is linked, that Flow step becomes the current traversal
position. When the operator later opens another unlinked observed event from the
ordinary feed, its Flow-step selector contains only direct outgoing relationship
targets of the current step.

Page frames and Event occurrences may both be relationship targets.
`expected_next`, `alternative`, and `merge` remain directed documentary kinds.
Optional relationship labels are shown when present; otherwise human source and
target names are used. Stable graph identities remain beneath the controls.

Selecting a target links and validates the open observed event, then makes that
target current for the next unlinked event. A validation failure does not alter the
linked path or disable valid outgoing targets.

For a Page-frame target, validation uses that frame's effective Page-instance
schema. For an Event-occurrence target, validation uses the full effective
occurrence schema combining its containing Page-instance branch, Event branch, and
occurrence contribution. Repeated Pages and Events remain distinct through stable
frame and occurrence identities.

## Operator control of feed order

Flow testing imposes no chronology rule on observed events. The operator may open
and link an unlinked feed event captured before or after the previously linked
event. Flow context does not hide, disable, reorder, or automatically select feed
rows.

The relationship-guided selector constrains graph-step meaning, not which observed
event the operator may inspect next. One observed event's existing session link is
shown when that event is revisited rather than silently replacing it with the
current traversal target.

## Revisiting linked events

Reopening a linked event shows its recorded Flow and Flow-step selection together
with its ordinary validation result, issues, provenance, and defect actions. This
display behaves as though that effective schema had been selected by automatic
assignment, while retaining Manual Flow test as the selection provenance.

Reviewing an earlier linked event does not rewind or advance the session traversal
position. The most recently linked step remains current. Consequently, opening a
new unlinked event after reviewing older evidence still offers outgoing targets
from the current step.

## Defects and session evidence

The existing defect report builder, persistence, and clipboard paths remain
authoritative. Opening it through the ordinary event-details Create defect report
action for a Flow-linked validation issue identifies the selected Flow, linked
graph step, and observed event in its heading. It retains the ordinary payload,
issue-selection, report-section, and action controls. A separate Flow-only builder
or defect trigger is not an alternate supported path.

Each selected issue distinguishes the observed value from the expected value and
identifies the violated rule. Expected-result assistance names the linked Flow-step
expectation and its effective schema revision. It does not call that expectation a
generic constraint or describe its provenance as a manually selected Flow step;
manual linking explains how the operator selected the validation target, not where
the constraint originated.

Report evidence snapshots the stable Flow, graph-step, and observed-event
identities; their event-to-step association; the effective target, revision, and
contributor provenance; and either the traversed relationship path or the Page
frame where testing started. Persistence and clipboard representations retain this
evidence so that the defect remains understandable after the Live session or Flow
definition changes.

The report describes an observed implementation event that does not satisfy the
linked Flow-step expectation. It does not characterize the Flow definition itself
as defective and does not claim that the selected Flow failed or executed. Saving,
copying, duplicate handling, and defect-library behavior remain the same as for
automatic-schema validation.

The Live session retains selected Flow context, current traversal position,
event-to-step links, traversed relationships, effective revisions, validation
results, and defect references. Reopening a saved session restores that evidence in
the existing feed and event details. Unchosen alternatives may be identified as Not
tested, but no output says Flow passed or claims the Flow executed.

## Non-goals

- no separate guided-test workspace, candidate-event feed, or step-first wizard;
- no automatic Flow, graph-step, or observed-event selection;
- no chronological restriction on operator-selected feed events;
- no creation or requirement of project Assignments;
- no background Flow execution, timing engine, or sequence assertion;
- no mutation of Flow topology, canonical contributors, or observed payloads;
- no claim that unchosen branches or the complete Flow were validated; and
- no activation of unrelated archived Live, release, preflight, or temporal-Flow
  programs.

## Acceptance inventory

| ID | Scenario | Required production evidence | Terminal condition |
|---|---|---|---|
| L01 | Live Flow guided testing 001 | integrated feed selector, unchanged feed, and absent-context UI | Flow selection sets context without opening a separate workflow |
| L02 | Live Flow guided testing 002 | root-first Page-frame values, repeated IDs, and loop-only Flow | roots are preferred while every Page frame remains available |
| L03 | Live Flow guided testing 003 | event-to-frame link, Page-instance compiler input, and ordinary detail UI | first selection validates inside existing event details |
| L04 | Live Flow guided testing 004 | outgoing relationship index, labels, and current-step update | another event offers only valid directed next graph steps |
| L05 | Live Flow guided testing 005 | Page and occurrence compiler inputs plus stable target IDs | each graph-step kind uses its live effective schema |
| L06 | Live Flow guided testing 006 | earlier and later feed-event selection with unchanged feed state | capture chronology never restricts the operator |
| L07 | Live Flow guided testing 007 | recorded link display and unchanged traversal cursor | reviewing an older linked event does not rewind the path |
| L08 | Live Flow guided testing 008 | one ordinary event-detail defect action, absent duplicate Flow-result controls, Flow-aware heading, distinct actual and expected evidence, Flow-step assistance, durable report snapshot, and standard defect adapters | the ordinary observed-event failure path produces a self-contained Flow-aware defect without a parallel Flow-only workflow or execution claim |
| L09 | Live Flow guided testing 009 | restored feed/detail evidence and domain hashes | saved sessions restore links without an execution claim |

## Terminal acceptance

Both feature files must parse and IR-dry-check with no findings. The exact
checkpoint is:

```sh
node scripts/run-focused-acceptance.mjs --pack live_flow_testing
node scripts/package.mjs
```

The pack registers both contracts plus focused production evidence for
active-project Flow context in the existing feed, root-first start selection,
Page-frame and Event-occurrence effective-schema resolution, relationship-guided
detail selections, chronology-independent operator event choice, recorded-link
review without cursor changes, Flow-aware defect headings and evidence snapshots,
distinct actual and expected issue presentation, one ordinary event-detail defect
action with no parallel Flow-result controls, ordinary validation and defect
adapters, saved session restoration, assignment bypass, and domain immutability.
It declares its active Flow graph and layered-schema dependencies in the pack
registry rather than invoking additional commands.

Production implementation, browser-runtime evidence, and property evidence form
one candidate lineage before terminal integration. Property coverage must exercise
that candidate's production serializer and traversal model; it must not substitute
a test-only model when the candidate requires production corrections.
