# Tealium Live: first integration stage

Task: `tealium-live`. Incoming review base: `fa8ea6c1ed3561a1aad837acc215de37357144d4`.
Authority: `docs/tealium-live-preparation-acceptance-R01.md`.

## Delivery

The Tealium contribution opens a private retained page. One owner keeps the
website target, document identities, session, filters, selection, and inventory.
The full-width page sends actions to that owner. It does not start a second read
loop. Data Layer startup is not required. Production modules separate page
inspection, browser document checks, session state, controls, and source routing.

The page reader inspects supported runtime properties without calling tracking,
loading, consent, or sender functions. Script and timing entries are request
evidence. They do not establish registered code or successful vendor delivery.
The inventory retains accessible frames and reports incomplete coverage.

The DevTools page reads loaded resource content, finds unique registered code,
and validates the target, session, frame, profile, UID, and document before an
explicit source action. Identical copies of one URL and content share a source
location. Different possible URLs or conflicting content remain ambiguous.
Source operations have an eight-second deadline. Clipboard actions use the
clicking surface and retain visible success or failure feedback.

The build delivers both exact Tealium HTML entry points. **The repository
manifest is unchanged.** Source browser tests extract the actual package and
add only `devtools_page` in that isolated fixture. They report `preview: true`.
This is real source-runtime preview evidence, not final manifest activation
proof. QA must accept this stage before the manifest-only second stage.

## Runtime identity and compatibility

The pinned public Tealium docs runtime is unchanged, gzip-compressed only for
storage. Its uncompressed SHA-256 is
`82882bb70abe78a85629baf4859ce01710fd92d1270b025cfdafd8ef9d324b89`.
The fixture provenance is in `test/tealium/detection/fixtures/provenance.json`.
Chrome loads it from both custom publishing and renamed first-party paths.
The installed inventory observes profile `tealium.docs`, UID `115`.
Fixture CSP blocks external tracking traffic. The sample is not a shipped asset.

A supported real runtime can register sender code before `loader.cfg` exists.
The reader therefore accepts supported sender evidence without inventing tag
configuration. Missing metadata remains unavailable. Unsupported runtime shapes
are reported with retained supported-frame results.

Chrome can omit the new URL after navigation from an optional-origin grant.
Live must not offer access to the old origin as if it were current. In that case
it retains the tab identity, clears the stale address, and explains recovery.
A new extension action supplies activeTab; Check access again restores the same
session intent. Browse all tabs remains an optional way to reveal the address.
A paused or ended session cannot resume from an access grant alone.

## Verification state

Direct model checks cover runtime evidence, getters, stable identities, filters,
session races, source ambiguity, bridge validation, and source deadlines.
Direct Chrome checks cover the native side panel, full-width controls, layout
at 360/520/720/900 CSS pixels, real grants, frame replacement, source editors,
clipboard, startup failure, and concurrent Data Layer capture.

The real Sources editor contains the expected function for separate, custom,
and bundled sources. A repeated action selects the function after Chrome
formatting. Another website's editor is unchanged. Real page reloads, child
replacement, and session replacement reject held old source requests.

These direct checks are development diagnostics. The first exact plan selected 192 checks because the new report lacked a
private ownership entry. Adding that entry reduced selection to 71 checks with
no unresolved expansion. Fresh review evidence remains pending. No master gate,
reviewer-owned mutation checks, or final activation proof is claimed.

## Cost and process record

The first real runtime checkpoint passed within the four-hour allowance.
A representative local sample with the real runtime and 201 configured or
registered tags measured 12 production reads: mean 3.95 ms, maximum 5.60 ms.
The separate tab/document check measured mean 0.86 ms, maximum 1.00 ms.
This is one local sample, not a cross-machine performance bound. The installed
fixture had three observed resource entries and approximately 200 extra inert
script elements. The checked-in cost runner reports actual counts.

The scheduler waits one second between ticks. Inventory reads do not overlap.
Document checks have their own guard, so a held inventory callback cannot hide
frame replacement. Hidden retained pages remain subject to Chrome scheduling;
this implementation does not promise background real-time cadence.

Task work began at 19:02 UTC on 2026-09-09. The first candidate was prepared
about two hours later. The 30-active-minute ownership-wiring target is not
proved. No prior preparation effort is reset. The previously accepted Probe
measurement of 79.740 seconds extra host-selection cost remains a separate
preparation finding, not the cost of this product verification run.

What went well: real runtime inspection found a valid sender-only state; native
Chrome tests established actual editor, permission, and document behavior.
Failures found and fixed: early native action before listener readiness; an
unusable initial geometry assertion; hidden Chrome addresses after navigation;
source ambiguity in a multi-URL fixture; and an enabled Start control after
owner closure. A TypeScript DOM-iteration error was caught by the build. Some
UI code preceded its browser test, so strict test-first compliance is partial.
Several broad file reads returned too much output; subsequent reads were
narrowed. None of these failed runs is review evidence.

Refinement: retain the small private test groups, use measured browser fields
for runtime claims, and repeat the source tests against the unchanged package
after QA accepts the manifest-only activation stage.
