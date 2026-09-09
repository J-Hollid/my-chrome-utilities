# Utility tab expansion implementation R01

Task: `utility-tab-expansion-boundary`. Mode: focused feature integration into QA.
Base: `de53abe11e8c41f6e53d2880f621a765dde7bdd7`.
The delivery note on that commit records independent QA integration of the
ownership preparation. Master promotion is separate.

## Working boundary

The side-panel entry starts workspace navigation before it awaits Data Layer.
It passes that navigation controller to the existing installed runtime. Mount
and dispose remain explicit in the stable entry. The existing shell controller
has moved, with its behavior unchanged, out of the large Data Layer runtime.

`src/utility-contributions/index.ts` contains page metadata only. Its shipped
list is empty. A contribution declares a unique identity, local HTML entry,
label, and versioned storage namespace. Private code loads in its own document
on first selection. Hiding the workspace does not remove that document.

`src/utility-host/` owns page retention, navigation setup, and declared messages.
The retained page owns the utility job. A full-width page receives the same
session and website target and forwards actions to that owner. Host and client
check the sending window, origin, utility identity, session, target, and message
kind. Explicit reset and close require confirmation when the owner reports
unsaved changes. Target closure prevents new work on that target. The host does
not choose another target automatically.

The existing Data Layer storage-failure presentation now changes only Data Layer
panels. The existing error and recovery controls remain available. Capture,
project persistence, and Data Layer storage formats are unchanged.

## Owner and consumer map

| Change | Exact boundary |
| --- | --- |
| Retained host and installed adapter | `shell.utility_workspace_host`, with all previously reviewed installed-controller, Hotkeys, Command Palette, and entry-verification consumers |
| Additive page metadata | `shell.utility_registration`, which retains the installed host boundary |
| Controlled Probe private HTML, styles, implementation, and common checks | `shell.utility_probe_private`; standalone browser checks, protocol checks, and the required build |
| Data Layer storage-failure presentation | Existing `durable_project_repository` ownership |
| Registry and acceptance declarations | Existing verification-process ownership and current/base conservation |

Probe remains a controlled fixture. An isolated checkout receives source metadata
and `build-delivered-dependencies.json` entries for its private HTML and module.
The production build and package commands create the test extension. The browser
loads extracted package files; private files and compiled metadata are not copied
or rewritten after the build. The declared stylesheet is delivered at
`utility-fixtures/probe.css`. Only the controlled observation and startup shim
changes the extracted side-panel document. The shipped metadata list stays empty. No Probe
product tab, Tealium feature, DevTools surface, or permission is added.

## Specification checks and cost plan

The architect returned candidate `86520cae3a` because it omitted a target-close
race and had no production package proof for private contribution files. Its
1,099-task passing receipt did not establish those missing outcomes.

The corrected additive plan includes `src/utility-contributions/index.ts`,
`build-delivered-dependencies.json`, and the three private Probe files. It selects
38 tasks with no complete parent-pack fallback. A private edit selects 3 tasks:
`build:dist`, the protocol unit check, and the standalone browser check. The
additive route therefore has 35 additional host and delivery tasks.

The shared delivery table also owns the existing ExcelJS delivery used by Flow
documentation. Including that real input adds these six checks to the previous
32-task fixture-only plan:

- `unit:test/data-layer-project-documentation-workspace-test.mjs`
- `unit:test/package-clean-checkout-contract-test.mjs`
- `property:test/data-layer-project-documentation-profile-concepts-property-test.mjs`
- `browser-observation:STUDIO_GLOBAL_STYLE_SMOKE_TARGET`
- `checkpoint:shell:dist-artifact-integrity`
- `checkpoint:shell:portable-package`

This is the existing exact shared-table boundary. It does not select a complete
Flow or Data Layer family. The correction retains these checks and reports the
cost; it does not remove shared consumers or introduce a new build framework.
The planner still checks all 1,178 prior task entries, unknown-path rejection,
permission conservatism, and same-range base obligations.

## Development proof and remaining gate

The registered host-message unit test now closes a target while selection is
pending, resolves selection, and delivers the owner's ready message. It failed
on the old build. It passes after the host preserves closure during selection.
A separate case closes another target and verifies that the selected target stays
usable. The owner receives `target-closed` when it becomes ready, and the launcher
stays disabled for the closed target.

All six installed browser cases passed through the production build/package
fixture after this correction. Package assertions compare the private HTML,
module, and stylesheet bytes with their declared sources and compare the compiled
registration with the extracted package. Receipt output records the package hash
and the metadata, declaration, and private-file hashes.

The same `common-probe.mjs` implementation and checks run in the standalone and
hosted pages. The measured comparison below is separate from specification-only
planning. Final review-ready evidence must bind the settled correction and its
package checkpoint. The final additive replay against the independently
integrated QA base remains an explicit post-integration obligation.

## Recorded cost comparison

The corrected 38-task measurement is pending. The earlier 32-task comparison
omitted the delivery declaration and must not be used as package proof.

## Process findings

Installed checks found the cross-workspace storage-failure selector. The code
change is limited to that causal defect. Early fixture checks also compared
different tab selection styles, waited for animation frames in a hidden page,
and read a controlled failure request before it existed. Those checks were
corrected without raising their runtime limits. The registry validator requires
new stylesheet files to be tracked before its complete inventory check.

Keep private checks separate from host checks. Use explicit controller ownership,
event acknowledgements, and current/base task identities. Report preparation
cost and recurring contribution cost separately after the exact receipt exists.
