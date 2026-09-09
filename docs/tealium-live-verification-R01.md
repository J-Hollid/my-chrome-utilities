# Tealium Live verification R01

Status: user-approved forecast for `tealium-live`, 2026-09-09.
This document defines verification duties for the approved product task.

## Contracts and development focus

Use these three behavior groups, each with separate product and runtime files:

| Group | Product contract | Runtime contract |
| --- | --- | --- |
| Detection | `features/tealium-detection.feature` | `features/tealium-detection-runtime.feature` |
| Live | `features/tealium-live.feature` | `features/tealium-live-runtime.feature` |
| Source navigation | `features/tealium-source-navigation.feature` | `features/tealium-source-navigation-runtime.feature` |

Begin with three small development targets. Proposed names below are not yet
registered commands or evidence claims:

1. `test/tealium/detection-test.mjs`: supported runtime shapes, evidence states,
   metadata, identity, read failures, and resource resolution inputs.
2. `test/tealium/live-session-test.mjs`: one owner, pause/end races, access and
   document generations, frame replacement, and retained surface actions.
3. `test/tealium-live-browser-test.mjs`: installed detection, actual Sources
   selection, and Live controls. Split independent browser cases by behavior
   when needed; do not create one large all-purpose browser program.

During correction, run the failing leaf. Register executable product handlers,
runtime adapters, direct tests, and their owned fixtures before focused review.
Use the locked APS parser and mutator; do not create another Gherkin runner.
The specifier runs parser and IR-DRY checks only. Other roles retain their
assigned acceptance-mutation and quality duties.

## Experiment evidence and new browser proof

`docs/tealium-live-experiment-R01.md` records 30 diagnostic behavior checks.
Its source archive is a reference prototype, not approved implementation or
review-ready evidence. Preserve its runtime URL and hash as historical inputs.
Do not silently refresh that immutable identity if the remote source changes.

New proof must use production callbacks and the built, packaged extension in the
native side panel and full-width utility page. A mock acceptance-world flag,
source-string assertion, placeholder host, or source-opening callback alone is
not proof of the corresponding installed behavior.

Use local executable fixtures for distinct runtime shapes, separate/custom
scripts, duplicate UIDs, failed requests, early initialization, and frames.
Keep one provenance-bound real runtime sample for the renamed bundled-source
case. Serve it from controlled custom host aliases and paths with external
tracking requests blocked. Record the exact bytes and configuration overrides.
Runtime fixtures must establish facts independently of expected example values.
Do not generate fake success by copying an expected UID or source into results.

The example fixture catalogue is descriptive input: standard separate uses UID
21; first-party separate uses UID 32; the pinned real bundle uses UID 115;
custom source uses UID 52. Their executable runtime/resource evidence must
produce those outcomes. A changed expected value alone must not change the
fixture's observed behavior. Resolve aliases under controlled browser networking;
do not contact customer sites, alter DNS, or send tracking requests for tests.

Required new proof includes exact-origin permission grant and decline, valid
activeTab access, partial frame coverage, same-URL page reload and frame
replacement, late old-document results, and unsupported runtime evidence.
Use observation, lifecycle, and save acknowledgements. Controlled clocks may
test scheduling; arbitrary sleeps are not readiness proof.

For source navigation, verify the actual Sources editor URL and non-empty
content. For a unique bundled location, verify selected tag code after source
formatting. Exercise closed DevTools, another inspected tab, late connection,
disconnect, duplicate-function ambiguity, unavailable locations, and source-load
failure. Browser automation opening DevTools represents a user action and must
not be claimed as an extension capability.

Verify the real clipboard contents and controlled failure feedback. Verify
computed visibility, actual pane dimensions, scroll containers, focus, and
overflow at measured Live widths 360, 520, 720, and 900 CSS px. Include long
metadata and URLs, no selection, new rows while scrolled, and Back to tags.
Verify both the native side panel and the full-width page.

Measure observation cost on representative tag/resource populations, including
the real sample. Report page-read and messaging cost, chosen cadence, and any
overlap or hidden-page scheduling limits. The experiment's three-tag timing
sample is not a production budget or a performance guarantee.

## Existing shared paths and QA forecast

Canonical read-only path queries at QA `5a39aec9531d8275310394ab1a6a639d9d0f8429`
used registry SHA-256
`0eaada3df037180e9d31b3ee9cf4cc3e22dd2211e45cc9e6ed87d2ada8d9bc41`.
The worktree contains unrelated local changes. These are advisory path results,
not an exact task plan. No product test ran for these queries.

| Existing input | Current owner | Selected path-query scope |
| --- | --- | --- |
| `src/utility-contributions/index.ts` | `shell.utility_registration` | 32 checks across 13 packs through exact host consumers |
| `src/utility-host/page-client.ts` | `shell.utility_workspace_host` | 32 checks across the same 13 packs |
| `build-delivered-dependencies.json` | `shell.documentation_template_delivery` and declared consumers | 7 checks across `shell` and `flow_export` |
| `manifest.json` | `shell` parent fallback | 1,167 checks across all 21 current packs |
| `src/background.ts` | `shell` parent fallback | 1,167 checks across all 21 current packs |

The direct registration consumer is `shell.utility_workspace_host`. Its current
transitive consumers are the installed-controller slices in `project_management`,
`durable_project_repository`, `capture`, `event-library`,
`project_event_transport`, `schemas`, `defects`, `replay`, and
`live_flow_testing`; the utility-host slices in `command-palette` and `hotkeys`;
and `verification_process.utility_entry_consumer`. Preserve those real checks.
The delivery table additionally retains its declared Flow documentation checks.

Likely changes include additive utility metadata, local Tealium HTML/styles,
delivery declarations, a DevTools entry declaration, and message routing.
Assess existing target/access helpers before reusing them. Reuse of Live's
interaction pattern does not require changing Data Layer implementation.
If utility-host code changes, inspect its actual callers and retain all owners.

Adding a DevTools entry can affect extension startup and message handling.
Check existing background and asynchronous message consumers, not only the new
source action. An apparently small manifest edit is not automatically local.
The 32-check additive route and earlier 38-task experiment route do not establish
the cost of this feature. Their scopes are different.

## Proposed private ownership

These are proposed prefixes, parents, and exact consumers for intent assessment.
They do not declare installed ownership or require specific class designs.

| Proposed source prefix | Parent and proposed slice | Exact proposed consumers |
| --- | --- | --- |
| `src/tealium/detection/` | `shell.tealium_detection` | `shell.tealium_live`, `shell.tealium_devtools` |
| `src/tealium/live/` | `shell.tealium_live` | none outside this slice; it owns its installed page/protocol checks |
| `src/tealium/devtools/` | `shell.tealium_devtools` | `shell.tealium_live` for its installed source action |

Put behavior-owned tests and fixtures in separate `test/tealium/` subdirectories.
Include the existing `test/background-command-test.mjs` check when changing
background composition. Add a direct Tealium bridge-composition check under
its own slice. Confirm these relationships and any additional consumer from
actual callers before declaring ownership. Include delivered Tealium assets in
their real build/package owner. Never assign the whole manifest or background
entry to a private Tealium slice.

A private Tealium edit must retain its own installed boundary checks without
automatically selecting all utility-host consumers. Registration or shared-host
semantic changes retain the existing host closure. Separate build prerequisites
from regression consumers; a retained HTML page is not an import of another
utility's private implementation.

The coder must run `node scripts/verification-ownership-readiness.mjs intent`
with the exact approved base, stable task, complete likely paths, pack forecast,
and proposed prefixes before product coding. Follow the helper's local argument
contract. No combined intent classification was run at the specification stage.

The manifest/background queries expose a likely coarse boundary. An actual
`coarse-boundary` result routes independently reviewed ownership preparation
before its narrower boundary may be consumed. Do not run all packs in feature
mode, hide consumers, add wildcard exemptions, or start a verification-framework
project. Bounded granularity findings use the current structured judgment rules.
If no sound narrower route exists, report that exact boundary while preserving
independent approved work. Existing authority governs causal repairs and routing.

## Settled proof and reporting

After the first coherent product commit, derive exact plan-only preflight from
the canonical changed paths and approved base. At the settled candidate, run
the complete selected focused plan once with `--property`, `--changed-since
<base>`, and `--prepare-evidence tealium-live`, plus package proof. Record the
printed pending evidence only after the runner exits. Follow current helpers;
do not turn diagnostic receipts into review evidence.

Coder forwards to refactorer, then architect. Only the exact architect QA-ready
handoff permits QA integration. Master promotion and its terminal gate require
a separate user request. Preserve existing incident and terminal obligations.

Record approval, handoff, role intervals, focused test time, failures, repairs,
reruns, and QA integration from durable records. Separate ownership preparation
cost from private utility work. First checkpoint: intent plus first working
detection. Report elapsed progress at four hours and variance against the
eight-hour QA-ready planning allowance. Continue bounded causal work under the
shared engineering rules; elapsed time alone is not another approval boundary.

The draft specification-check results are recorded separately in
`docs/tealium-live-specification-checks-R01.md`.
