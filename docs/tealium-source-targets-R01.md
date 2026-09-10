# Tealium source targets R01

Status: explicitly approved by the user, 2026-09-10.
Stable task: `tealium-source-targets`. Mode: focused QA integration.
The dependency is complete: metadata reached QA at `0f72e53b93`, with its report
at `314b9555`. Start from the received source specification commit on that
descendant. Preserve the metadata implementation in the source-navigation base.

## Required task inputs

- `docs/tealium-live-R01.md`: retained target, observation, and source safeguards.
- `features/tealium-source-navigation.feature`: source behavior, including
  scenarios 008 through 010 and the clarified existing source action.
- `features/tealium-source-navigation-runtime.feature`: actual editor proof,
  including scenarios 007 through 009.
- `docs/tealium-live-verification-R01.md`: installed evidence and review rules.

This follow-up changes source resolution and its two visible destinations.
It preserves automatic metadata lookup, DevTools connection recovery, current
document validation, and every existing terminal obligation.

## Findings

The current resolver returns immediately if a sender's function text occurs
twice inside one file. It therefore skips the known tag-script URL fallback.
Line ambiguity need not prevent access to an identified containing file.

The pinned real runtime exposes the registered object as
`utag.o[profile].sender[uid]`. Its `extend` property is an array of functions.
Its `send` function calls those functions. Read their code without calling them.
[Tealium's template documentation](https://docs.tealium.com/iq-tag-management/tags/tealium-custom-container-tag/)
also describes `u.extend` as the extension-function array and `u.send` as the
tag's send function. Extension code is additional matching evidence; it is not
guaranteed to be unique.

## Behavior

1. Present **Go to u.send** and **Go to u.extend** beside each other in the
   selected tag's inspector. Go to u.send replaces the existing Show in Sources
   label. Preserve the existing Copy source URL action for an identified file.
2. Resolve file identity separately from the requested code location. A single
   verified containing file remains openable when a function occurs more than
   once. Open its start and show **Exact location unavailable; opened file**.
   Do not select an arbitrary duplicate and call it an exact match.
3. For a separate tag script, consider its actual observed URL before rejecting
   duplicate function text elsewhere. Use a tag-associated script URL that is
   present among loaded resources for the bound target. Preserve its actual
   host, custom path, and query string. Do not construct a URL from UID alone
   or assume Tealium-domain hosting.
4. Read `send` and `extend` from the same registered tag object. Use extension
   function code as additional evidence to narrow candidate files and tag
   definitions when send code is repeated. Match the selected runtime/profile
   and UID. Shared extension code is not independent proof of tag identity.
5. For Go to u.send, open the selected tag's unique send definition when proved.
   For Go to u.extend, open its extension-array definition when proved. A loop
   that calls `u.extend` inside send is not the array definition. If the array
   definition cannot be located but the containing file is verified, use the
   same file-start fallback with explicit feedback.
6. An empty readable extension array may still be inspected. An absent or
   unreadable extension array shows **u.extend unavailable** and disables only
   its action. Do not invent extensions or make the entire tag unavailable.
7. Evaluate both destinations independently. Extension evidence that identifies
   one file does not prove which of several send definitions in that file is
   the selected one. Prove their association within the tag definition before
   selecting an exact send location; otherwise open the verified file.
8. If several containing files remain possible, retain an ambiguity message
   and disable automatic opening. Conflicting content at the same URL, missing
   loaded content, and stale target evidence remain unresolved boundaries.
   Uncertain line location does not authorize an arbitrary file selection.

Retain selection, focus, filters, observation state, and metadata names on both
surfaces. Each action identifies its requested destination through the message
route and validates current tag code before opening. A change to either source
fingerprint invalidates affected pending resolutions. Disconnect, navigation,
frame replacement, Stop, and session replacement cancel old actions. Recovery
must never repeat a previous open action or open the other destination.

Observation and source inspection do not execute extension functions, send
functions, tag loads, or tracking requests. No new permission, manifest entry,
remote API, or shared utility-host change is needed for this behavior.

## Development and QA expectations

Development focus: `test/tealium/devtools/source-test.mjs` for matching and
fallback; `test/tealium/detection/reader-test.mjs` for safe extension evidence;
the existing DevTools browser/limits checks for both real editor destinations.
Add small imported cases under the current owners. Preserve the locked parser,
real acceptance handlers, and existing source navigation sessions.

Likely paths: detection reader/types and current-tag validation; DevTools
resolver/entry/broker; Live source actions/render/HTML; their delivered files;
existing Tealium source contracts, acceptance steps, and owned tests.

| Prefix | Parent and slice | Exact consumers |
| --- | --- | --- |
| `src/tealium/detection/` | `shell.tealium_detection` | `shell.tealium_live`, `shell.tealium_devtools` |
| `src/tealium/devtools/` | `shell.tealium_devtools` | `shell.tealium_live` |
| `src/tealium/live/` | `shell.tealium_live` | no external slice consumers |
| Proposed small resolver modules under `src/tealium/devtools/` | existing `shell.tealium_devtools` prefix | the source resolver and bridge |

Forecast: 45 Tealium/Shell checks plus package. A fresh detection-types ownership
query at metadata QA `0f72e53b93` confirmed that same three-slice closure with
registry digest `d3f8e10ed4886974c2ce4b610a8307f85078ab0b943ed8988c78d9f7fbf68fa7`.
Run coder intent before source coding, with complete likely paths and any small
new prefix. Do not change the registry to preserve a count. No broad DataLayer
or all-pack gate is planned. Use the full canonical bounded plan and current
ownership judgment rules.

Browser proof must inspect nonempty content and the actual editor selection for
both destinations, including after formatting. Cover duplicate sends in one
bundle, a known separate script amid identical copies elsewhere, unique and
shared extension code, absent/empty extend, wrong-definition distractors, and
late actions. Fixtures must establish the association independently of expected
results. A callback alone is not proof of the selected location.

Planning allowance: 60 active coder minutes; at 30 minutes report the matching
correction and first working editor destination. Continue bounded work and
report variance. Exact review evidence and package proof are required before
the coder/refactorer/architect QA path completes. Keep specification checks
separate from installed runtime proof. This task, its forecast, and its 30/60
minute checkpoints replace the original Live task's historical forecast and
allowance. After a coherent commit, run exact plan-only preflight. At settlement,
use the exact received specification base and
`--prepare-evidence tealium-source-targets` with properties and package proof.
Only record the printed pending evidence after successful runner exit. Forward
through coder, refactorer, and architect; accept only exact QA-ready evidence.

## Specification checks

Both source-navigation feature files passed the repository Gherkin parser and
IR-DRY checker on 2026-09-10. The product file now has ten scenarios; the runtime
file has nine. Six new scenarios supply 20 expanded cases. New example columns
are used and have no redundant constant values. Existing shared setup stays in
Background. The new runtime fixture setup and no-execution assertion were
normalized to the existing steps.

Four advisory similarity findings remain: action availability versus activation,
mismatched-action setup versus evaluation, a fixed send action versus a varying
destination, and a generic pending action versus one with an explicit destination.
These distinctions are intentional. Reports are under
`tmp/tealium-source-targets-spec/`. No acceptance mutation or runtime proof was
run by the specifier. Metadata is now accepted, so the source-target handoff
can proceed from its descendant with a separate exact review base.
