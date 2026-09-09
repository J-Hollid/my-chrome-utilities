# Tealium Live experiment R01

Date: 2026-09-09. Status: experiments complete; production specification pending.
Authority: the user requested an autonomous sequence of bounded experiments.
Scope: diagnostic tooling and interface evaluation, not feature integration or
master promotion. No production file, shipped manifest, or feature contract was
changed. The inspected checkout was `qa` at
`5a39aec9531d8275310394ab1a6a639d9d0f8429`.

## Decision

Continue with a Tealium utility whose first view is Live. Use the existing
retained utility host and a small DevTools bridge for Show in Sources. A separate
Tealium DevTools panel is not needed for the tested source-opening action.

Use runtime structure and observed resources for detection. A domain or filename
match is insufficient. Keep code registration, initialization, send observation,
and network results separate. The first release should make claims only about
the evidence it actually collects.

## Runtime scorecard

Browser: Chrome 151.0.7922.75. Node: repository-locked 24.19.0.
The final experiments passed 30 behavior checks. A separate timing observation
is not included in that check count.

| Stage | Browser proof | Result | Decision |
| --- | --- | --- | --- |
| Detection | 7 page cases and 1 late-tag transition | 8 passed | Continue with runtime/resource detection |
| Source navigation | 4 exact source selections and 4 stale-page rejections | 8 passed | Continue with the small DevTools bridge |
| Live | Host registration, session, layout, source action, and lifecycle | 14 passed | Continue; refine presentation and compatibility before release |
| Timing | 100 scans of the small controlled page | Diagnostic only | Do not infer production overhead |

Stage 1 took 786 ms, Stage 2 took 3,187 ms, and Stage 3 took 3,922 ms inside
their recorded run boundaries. These durations exclude browser cleanup and do
not measure development effort. The recorded span from runtime download to the
final Live result was about 13 minutes 26 seconds. It excludes earlier research
and later reporting.

## Stage 1: detection and inventory

Cases covered absence, a misleading script filename and unrelated global, an
early queue, separate and bundled tags, a custom script source, one real
published runtime, duplicate UIDs in distinct profiles, and a late tag.

The real source was the public runtime used by Tealium Docs:
`https://tags.tiqcdn.com/utag/tealium/docs/prod/utag.js`.
It reported version `ut4.52.202504230113`. Its original 169,865 bytes were served
unchanged at a local custom URL ending in
`/custom/real-payload.js?revision=original`. The fixture supplied a custom
publishing-path override before loading it.

The detector found profile `tealium.docs` and bundled tag UID `115` without a
Tealium host name or a `utag.js` resource filename. The runtime had loading
suppressed and was not initialized, but the sender code was registered. This
directly disproves the use of code registration alone as proof that a tag fired.
The detector did not call tracking, consent, or loader functions.

The local page blocked external requests. Resource timing still exposed some
attempted, blocked resources. Therefore a resource entry alone must not be
labelled as successful loading or delivery.

This proves operation with a custom origin and path. It does not exercise an
actual DNS CNAME or all customer hosting arrangements. Separate and custom tag
cases used controlled runtime-shaped fixtures; only the bundled case used the
downloaded real runtime.

## Stage 2: source navigation

A temporary Manifest V3 extension used the actual
`chrome.devtools.inspectedWindow` and `chrome.devtools.panels.openResource`
APIs. Checks inspected the real Sources editor, including non-empty text.

Separate and custom scripts opened at their exact observed URLs, including
query strings. For a bundled tag, the prototype searched loaded resource text
for the exact registered send function. It rejected an absent or non-unique
match instead of inventing a source location.

The real UID `115` opened in the renamed runtime at its send function. The raw
source location was zero-based line 415, column 954. Chrome automatically
formatted the file; the displayed function began at editor line 4,462. The
check verified the selected function text, not equality between raw and
formatted line numbers.

Four selections were rejected after navigation to a different URL. Same-URL
reload identity, duplicate function bodies, wrappers, and source-map behavior
remain untested. Exact function matching is a proved fallback for this sample,
not a universal Tealium source parser.

## Stage 3: Live and retained utility pages

The prototype copied seven existing compiled host modules without changing their
bytes. It registered Tealium through the real workspace host beside labelled
Data Layer and Hotkeys placeholders. It did not start those complete utilities.

Browser checks proved the following behavior:

- Observation starts on the bound website target.
- The closed DevTools state is shown; opening DevTools later enables the action.
- Show in Sources from Live selects the actual file and displays its text.
- Narrow layout shows the inspector; wide layout shows list and inspector.
- The Live document has no horizontal overflow in those measured states.
- New snapshots preserve search-input focus.
- A hidden utility retains its session, filter, and selection and finds a late tag.
- Pause prevents new snapshots during a 650 ms observation window; resume works.
- The expanded page has the same session and target, owns no second observer,
  and forwards Pause to the retained owner.
- Navigation clears the selection; target closure stops observation.

The test host was an extension page containing the retained utility iframe.
It was not the browser's native side-panel container. The target picker used an
explicit localhost host grant, so existing activeTab and access-recovery behavior
was not proved by this experiment.

The test harness used privileged `Target.openDevTools` automation to represent
the user opening DevTools. The extension did not open a closed DevTools window
and had no debugger permission.

## Specification checks and release limits

No Gherkin specification, acceptance mutation, focused QA evidence, packaging
proof, architecture review, or master gate was performed. These diagnostic
results cannot be promoted into review-ready or final-ready evidence.

Before production delivery, specify and prove document identity across same-URL
reloads, accessible frame coverage, exact permission recovery, ambiguous source
handling, and target/session ownership across surfaces. Do not require a full
new DevTools interface to deliver the tested action.

The Live layout fits the task, but the prototype repeats the target between its
test host and Live view and retains outer-page scrolling. Refine these to match
the existing Live context and scrolling rules. The prototype is not a finished
presentation contract.

The timing sample used only three controlled tags. Its p95 scan time was about
0.2 ms and maximum was 7.5 ms, with clock-resolution effects. It does not include
a representative busy website, long-running timers, or total extension impact.
Measure representative runtime and resource populations before fixing a polling
interval. Do not call this a proved low-overhead production design.

## Process findings

What worked: one real public runtime exposed a useful suppressed-loading case;
actual DevTools editor observations proved more than callback success; unchanged
host modules supported retained ownership and expanded-page actions.

Failures: initial browser launches encountered sandbox socket restrictions and
an overlong temporary socket path. An early page check accepted the initial
blank document. The first source test accepted file selection before text was
displayed. A later assertion confused raw and formatted source line numbers.
These were corrected inside the experimental harness. No unrelated product
repair was started.

Refinement: retain the three-stage approach. Use precise readiness conditions,
evidence labels, and a representative compatibility sample. Keep the DevTools
bridge small. Treat firing analysis as additional behavior with separate proof.

## Evidence and reproduction

- [Detection observations](tealium-live-experiment-evidence/stage1.json)
- [Sources editor observations](tealium-live-experiment-evidence/stage2.json)
- [Live observations](tealium-live-experiment-evidence/stage3.json)
- [Runtime source identity](tealium-live-experiment-evidence/runtime-source.json)
- [Unchanged host module identities](tealium-live-experiment-evidence/host-modules.json)
- [Narrow Live screenshot](tealium-live-experiment-evidence/live-narrow.png)
- [Wide Live screenshot](tealium-live-experiment-evidence/live-wide.png)
- [Real bundled source screenshot](tealium-live-experiment-evidence/sources-real-115.png)
- [Experimental source archive](tealium-live-experiment-evidence/experiment-source.zip)

The archive includes reproduction instructions and excludes downloaded
third-party code and browser profiles. The public source URL and hash bind the
real runtime sample. Existing unrelated local work was preserved.
