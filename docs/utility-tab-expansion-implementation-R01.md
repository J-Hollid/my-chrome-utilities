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

Probe remains a controlled fixture. Its HTML and private entry are copied only
into the temporary test extension. The declared fixture stylesheet is delivered
at `utility-fixtures/probe.css`; production pages do not reference it. No Probe
product tab, Tealium feature, DevTools surface, or permission is added.

## Specification checks and cost plan

The initial host intent selected 22 tasks across 13 owners. The combined intent
also includes the new declarations, acceptance handlers, and storage-failure
correction. It selects 178 tasks across the same 13 owners. These are plan-only
results, not passing runtime evidence.

The current additive replay selects 32 tasks. A private Probe edit selects only
`build:dist`, `unit:test/utility-tab-expansion/protocol-test.mjs`, and
`browser:test/utility-tab-expansion-standalone-browser-test.mjs`. There are 29
additional host tasks in the additive plan, with no complete parent fallback.
`test/utility-tab-expansion/planning-test.mjs` reports every task identity and
checks shared consumers, unknown-path rejection, conservative permission
selection, same-range base obligations, and all 1,178 prior task entries across
the base owner plans. Counts do not establish a time saving.

The same `common-probe.mjs` checks run against the standalone document and the
retained document. Focused receipts must supply the final measured durations.
The final QA-base additive replay remains a separate required checkpoint after
independent review; the current plan does not claim that QA checkpoint.

## Development proof and remaining gate

Direct Chrome checks have passed at 360 and 800 CSS pixels for retained document
identity, drafts, filters, selection, scroll, isolated styles and IDs, one job
owner, full-width access, reset confirmation, explicit stop, target closure,
and continuing Data Layer capture with unchanged session identity. Reopening
preserved the saved draft, workspace selection, and project bytes. Controlled
waiting storage, failed storage, and a private startup exception left navigation
usable. The standalone private checks also passed.

These direct checks preceded the final shell-controller extraction. The settled
candidate still requires exact planning, fresh focused checks with properties,
package proof, and review-ready evidence. No all-pack or master proof is claimed.

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
