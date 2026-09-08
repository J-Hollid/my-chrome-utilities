# Project observation sources R01

Status: approved by the user on 2026-09-08 for coder handoff and QA integration.
Prepared: 2026-09-08. Task: `project-multiple-observation-sources`.
Starting QA commit: `dce549f1c31a3cc46192be27eae243f04eb80834`.

## Outcome and scope

Observe two or more configured event arrays on one selected website tab at the
same time. For example, observe `dataLayer` as Marketing and `event.history` as
Application. Show their events in one Live feed with a source label and filter.

The approved scope is event arrays. Changes to plain objects and capture of
network requests need separate requirements. This task does not activate older
Adobe or GTAG work.

Required instruction: docs/data-layer-project-observation-sources-verification-R01.md

Product contract: `features/data-layer-project-observation-sources.feature`.
Runtime contract: `features/data-layer-project-observation-sources-runtime.feature`.

This approved program replaces only the one-observation-path limit in
`docs/data-layer-project-event-transport-settings-program-R01.md` and the matching
single-path expectations in its product/runtime scenarios 001, 002, 006, 008,
and 009. Those contracts must be updated coherently during implementation.
Their single-source examples remain regression cases. Push routing, explicit
Library destinations, active project ownership, and durable saves remain binding.
The older `data-layer-multiple-observation-sources.feature` is a design reference;
this task does not activate its broader adapter program.

## Settings and source identity

Data Layer Settings has an Observation sources list in the active project.
Each row has a stable identity, a required display name, an array path, an
Enabled control, and a current connection status. Add, edit, disable, and remove
are available with keyboard input. Removal requires confirmation. Controls fit
the existing narrow side panel without horizontal scrolling at 360 CSS pixels.

Paths use the existing safe page-window path grammar. Trim surrounding space
and treat an optional leading `window.` as the same path. Reject an empty name,
invalid path, or duplicate normalized path before saving. A syntactically valid
path may be saved before the website creates it. Names can repeat; show the path
beside the name in settings and source choices to distinguish them.

A rename retains source identity. A path edit retains the configured source
identity but starts a new observation generation. Old captured entries retain
the name and path recorded at capture. No name or path is an event identifier.
Removing and later adding a source creates a new identity; it does not attach
old events or source-specific assignments to the new source implicitly.

Settings survive durable reload, project switching, and project export/import.
An imported project retains internal source references within its new project
identity. A failed save leaves the last committed configuration active and
retains the edit with an error and retry action. No active project means no
implicit source configuration or project selection.

An older project with one observationHistoryPath opens with one enabled source
at that exact path. Preserve its existing source references and push default.
Migration is repeatable, verifies durable read-back, and creates no publication.
An empty source list is valid and does not restore a hidden default on reload.

## Observation and feed

Start testing observes every enabled source on the same selected tab. Show each
source as Ready, Waiting for path, Not an array, Disabled, or Access required,
as applicable. At least one ready enabled source permits capture; other source
failures remain visible. With no ready source, show the reason and keep Start
testing unavailable. A waiting source joins automatically when its array appears.
Keep the existing selected-target and exact-origin permission recovery behavior.

On first attachment to an array, capture its existing entries once. Then capture
new pushes with no loss between the snapshot and live subscription. Preserve
entry order within each source. Read initial source snapshots in saved list
order; append subsequent observations in extension receipt order. Use a stable
capture sequence for equal timestamps. Do not claim a total website execution
order across independently observed queues or sort by a payload timestamp.

Every event retains project, session, source, page-load, and entry identity plus
the source name and path at capture. Equal payloads in different sources are
separate observations. Different paths that alias the same array are also
separate configured sources: capture once per source without calling the page's
original push more than once. Capture must preserve push arguments, receiver,
return value, and page-visible results.

Live defaults to All sources. Each row and the inspector show the source name;
the path is available in the inspector and source choices. A source filter
combines with existing feed filters and changes only the visible subset and
count. It does not stop capture, delete events, or change validation inputs.
Source-specific assignments and defect evidence must keep the event's exact
source identity. An assignment for one source must not match another source
merely because the event name or payload is equal.

## Lifecycle and compatibility

Disable detaches only that source. Re-enable observes entries added while it was
disabled, once per source and array entry, without repeating earlier entries.
Remove deletes only the configuration after confirmation. Captured and saved
session evidence remains readable with its original source identity and labels.
Rename changes future labels only. A path edit detaches the old path before the
new path attaches; it never changes another source or an earlier event.

Reload and navigation attach enabled sources to the new page load. Replacing
one observed array starts a new generation for that source. Repeated attachment
to the same array does not duplicate events or stack active subscriptions.
Late callbacks from a removed source, old path, old project, old target, or old
page load cannot enter the current feed. Project switching uses only the new
project's configuration for subsequent capture and retains earlier evidence
under its original project/session identity. Existing session boundary rules
continue to apply.

Stop testing, target closure, and permission loss dispose affected subscriptions.
Recovery rechecks every enabled source on the same selected target. It never
attaches to an unrelated active tab. Cleanup of one source cannot break another
source or replace a newer page-owned push function with a stale function.

Keep one separate project Default push path. Direct pushes use it; a saved
Library event uses its explicit Destination. Selecting, filtering, disabling,
or editing an observation source never changes either destination. Saving a
captured event as a new Library event still seeds the project push default, not
the observation path. The operator can then edit that explicit Destination.

## Delivery and review

This is a functional change for QA integration. It requires production changes
and installed evidence, including two real arrays with equal event payloads.
The source manager, durable settings, subscriptions, and feed projections must
have separate modules. The current Capture controller has 1,325 lines: extract
the affected coordination responsibility before extending it. Do not add a new
large controller or mix settings persistence with page-hook logic.

Planning estimate: eight hours from coder start to a QA-ready candidate. At four
hours, report a working two-array capture case, the ownership classification,
remaining work, and revised estimate. At eight hours, report the same measures
and any delay. These are reporting checkpoints, not permission to skip checks
or stop a bounded repair. Actual timing is unknown until implementation.

The user's reply "Agreed" approves this specification and the coder handoff.
Proceed through implementation, focused review, and QA integration under the
named task. Master promotion remains a separate user request.
