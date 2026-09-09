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

All 38 tasks passed freshly on commit `91219ecfd67310b4a78ed2fd8ad6696018829d42`
and tree `fd36eb2566dcb74f3fe4b7626cade4a71c643a1b`. The raw runner receipt is committed as
[utility-tab-expansion-cost-receipt-R01.json.gz](utility-tab-expansion-cost-receipt-R01.json.gz).
Its uncompressed SHA-256 is `85030c5db570c4b4565abc9f48fc0cea05cb5136dcfd4b3be2e56e5e1013f015`.
Run: `90c86f25-b6f5-4f0e-b4ea-9cd77ed0d7fa`. Intent: `development-diagnostic`.

This receipt measures the explicit additive input selection on the named candidate.
It is development measurement, not review-ready or QA-integration proof. The
browser tasks create the actual source registration and delivery declaration in
isolated checkouts, then build, package, extract, and execute the contribution.
The final review-ready record is separate and binds the settled correction.

Read the full receipt without a temporary path:

```sh
gzip -dc docs/utility-tab-expansion-cost-receipt-R01.json.gz > /tmp/utility-cost-receipt.json
```

| Route | Tasks | Sum of recorded task durations |
| --- | ---: | ---: |
| Private utility edit | 3 | 23.238 s |
| Additional host and delivery | 35 | 142.135 s |
| Additive contribution | 38 | 165.373 s |

These sums are task durations, not elapsed run time. Parallel work overlaps.
The standalone and installed browser programs use the same private utility and
common checks. Both now include production build/package setup. The installed
program also checks host behavior, so the whole-program durations are different
workloads and do not establish a time saving.

- Standalone: 14.508 s.
- Installed: 28.032 s.

| Additional task | Recorded duration |
| --- | ---: |
| `acceptance-generate:features/side-panel-workspace-tabs.feature` | 0.036 s |
| `acceptance-generate:features/utility-tab-expansion-boundary.feature` | 0.033 s |
| `acceptance-generate:features/utility-tab-expansion-runtime.feature` | 0.032 s |
| `acceptance-parse:features/side-panel-workspace-tabs.feature` | 0.036 s |
| `acceptance-parse:features/utility-tab-expansion-boundary.feature` | 0.032 s |
| `acceptance-parse:features/utility-tab-expansion-runtime.feature` | 0.034 s |
| `browser-observation:LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER+SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER+WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER` | 8.737 s |
| `browser-observation:STUDIO_GLOBAL_STYLE_SMOKE_TARGET` | 3.497 s |
| `browser:test/project-observation-sources-browser-test.mjs` | 37.232 s |
| `browser:test/utility-tab-expansion-browser-test.mjs` | 28.032 s |
| `checkpoint:shell:dist-artifact-integrity` | 0.265 s |
| `checkpoint:shell:portable-package` | 1.248 s |
| `property:test/data-layer-project-documentation-profile-concepts-property-test.mjs` | 0.103 s |
| `property:test/workspace-tabs-property-test.mjs` | 0.042 s |
| `unit:test/command-palette-installed-controller-test.mjs` | 0.307 s |
| `unit:test/command-registry-runtime-test.mjs` | 0.044 s |
| `unit:test/data-layer-installed/consumers/capture-consumer-test.mjs` | 0.183 s |
| `unit:test/data-layer-installed/consumers/defects-consumer-test.mjs` | 0.182 s |
| `unit:test/data-layer-installed/consumers/durable-project-repository-consumer-test.mjs` | 0.171 s |
| `unit:test/data-layer-installed/consumers/event-library-consumer-test.mjs` | 0.175 s |
| `unit:test/data-layer-installed/consumers/live-flow-testing-consumer-test.mjs` | 0.166 s |
| `unit:test/data-layer-installed/consumers/project-event-transport-consumer-test.mjs` | 0.167 s |
| `unit:test/data-layer-installed/consumers/project-management-consumer-test.mjs` | 0.188 s |
| `unit:test/data-layer-installed/consumers/replay-consumer-test.mjs` | 0.172 s |
| `unit:test/data-layer-installed/consumers/schemas-consumer-test.mjs` | 0.166 s |
| `unit:test/data-layer-project-documentation-workspace-test.mjs` | 0.214 s |
| `unit:test/hotkey-installed-controller-test.mjs` | 0.279 s |
| `unit:test/modular-utility-architecture-test.mjs` | 30.032 s |
| `unit:test/package-clean-checkout-contract-test.mjs` | 22.654 s |
| `unit:test/side-panel-single-cutover-preparation-test.mjs` | 1.065 s |
| `unit:test/utility-tab-expansion/host-message-test.mjs` | 0.050 s |
| `unit:test/utility-tab-expansion/planning-test.mjs` | 0.427 s |
| `unit:test/verification-contracts/ownership-event-library-contract-test.mjs` | 4.127 s |
| `unit:test/verification-contracts/registry-reachability-contract-test.mjs` | 1.674 s |
| `unit:test/workspace-tabs-installed-controller-test.mjs` | 0.333 s |

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

## Authorized Layered Schema repair

The fresh utility review found a Layered Schema browser timeout. The user
approved a bounded repair. The canonical target repeated the complete surface
workflow before its own observations. Its previous successful run took
116.095 seconds within a 120-second limit.

The canonical target now uses the unchanged authoring setup and focus evidence
that its observations consume. The separate surface target retains the other
surface observations. The canonical observation source and runtime limit are
unchanged. A registered regression executes the first evaluator call from the
old and new programs and checks the retained setup bytes.

Governed repair run `0a240be6-8667-47d0-98ee-b007e1c835e9` passed
49 checks on candidate `8453ae95`. The isolated canonical browser target passed
in 50.307 seconds. Incident `6c5fe401-439a-44ae-a390-a68a98a9f526` became
eligible for fresh review. These two durations are separate observations, not
a controlled performance benchmark. The complete four-target browser batch
and exact utility review remain required before the review-ready handoff.
