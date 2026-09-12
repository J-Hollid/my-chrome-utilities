# Live property declaration modal recovery R01

Task: `live-property-declaration-modal-recovery`
Mode: bounded functional repair, focused QA integration.
Base: `f0570e37804d263c5c60bc92703ae079c2796931`.

## Authority and outcome

On 2026-09-12 the user reported that clicking
`live-property-add-to-schema` makes the side panel unresponsive. Restore the
existing Add to schema behavior. This task changes no product requirement or
storage model. Follow the existing contracts in
`features/data-layer-live-schema-property-declaration.feature` and
`features/data-layer-live-schema-property-declaration-runtime.feature`.
This correction program supplies the task scope and verification route.
Master promotion remains separate.

The earlier quota report is not reproduced. Do not assume it caused this
failure or start a storage migration. If confirmation reproduces a storage
failure, assess its exact causal path under the shared engineering rules.

## Bounded discovery and runtime evidence

Repair family: declaration dialog visibility and lifecycle.
Boundary: the installed Live property action, declaration review and destination
picker, their close/disposal paths, and return to the originating inspector.
The short discovery pass is complete. Current defects and proof gaps are:

- `SchemaGuidedValidationController.openLivePropertyDeclaration` appends a modal
  to `#guided-validation-flow`, which starts hidden in `side-panel.html`.
  The method does not expose that host before `showModal()`.
- A Chrome diagnostic invoked the built production controller with that hidden
  host and no selected destination. The dialog matched `:modal` but measured
  0 by 0 pixels. Making the same host visible produced a modal measuring
  190.5625 by 119.34375 pixels. No persistence callback ran. This reproduces an
  invisible modal that blocks input; it is not proof of a process crash.
- The direct controller test configures `guidedRoot:null` and `document:null`.
  Its current assertions do not exercise this installed dialog boundary.
- Close, Escape, repeated opening, and controller disposal need direct checks
  so the repair cannot leave hidden modal state or stale controls behind.

The diagnostic used the current built controller in an isolated Chrome page,
not the user's browser profile or the complete installed side panel. The coder
must supply fresh installed side-panel proof. The temporary diagnostic is
`tmp/live-declaration-modal-probe.html`; it is local supporting material only.

## Repair checks

1. With Live visible and the guided host initially hidden, activate the actual
   property-row Add to schema button. The destination picker or selected-draft
   review must be visible, have nonzero bounds, and accept pointer and keyboard
   input. Test both destination branches.
2. Opening and cancelling must leave schema persistence unchanged. Cancel and
   Escape must release modal input blocking and return focus to the originating
   control. Reopening must produce one usable dialog.
3. Confirm one nested property addition through the existing durable path.
   Preserve siblings, assignments, rules, current publication, and the
   declaration-only semantics. Restore the originating Live property and prove
   the saved declaration survives reload.
4. Dispose or replace the controller while the dialog is open. No modal or
   listener may remain that blocks the side panel. Preserve other guided flows.

Use a small dialog lifecycle owner if separation is needed. Do not add a second
independent declaration workflow or extend a controller monolith. Do not catch
and suppress save failures or reset the user's storage.

## Development focus and QA impact

Development focus: the installed declaration dialog regression, the existing
`test/data-layer-installed/schemas/guided-validation-controller-test.mjs`, and
`test/data-layer-live-schema-property-declaration-test.mjs`. Browser proof must
invoke the installed property action and measure visibility and input; a mocked
dialog or an assertion that `open` is true is insufficient.

Likely shared integration path:
`src/data-layer-installed/schemas/guided-validation-controller.ts`.
Existing parent: `schemas`; slice: `schema_guided_validation`.
Exact declared consumers from the canonical ownership query: `project_management`,
`capture`, `live_flow_testing`, `project_assurance_severity`, and
`guided_test_cases`, each through `side_panel_installed_controller_consumer`.
If a new dialog helper is needed, propose the narrow prefix
`src/data-layer-installed/schemas/live-property-declaration-` under the same
parent and slice, with those same consumers, and validate actual references.
Do not change verification ownership in the product range to omit coverage.

The coder must record read-only intent classification before product edits.
Run exact changed-path plan-only preflight on the first coherent candidate.
The six packs above are a forecast; use every pack selected by the canonical
plan. A bounded variance proceeds under existing authority. An all-pack coarse
boundary follows the standing ownership-preparation route.

Settled review command, with the exact planned pack list and received base:

```sh
node scripts/run-focused-acceptance.mjs --pack schemas --pack capture \
  --pack project_management --pack live_flow_testing \
  --pack project_assurance_severity --pack guided_test_cases --property \
  --changed-since <base> --prepare-evidence live-property-declaration-modal-recovery
node scripts/verification-evidence.mjs record <printed-pending-file>
```

Preserve package proof and ordinary coder, refactorer, architect, and specifier
review duties. Only architect `qa-ready` evidence permits QA integration.
Do not launch a full terminal gate for this task.

Effort expectation: 60 minutes to the first review-ready candidate, with a
30-minute progress check. Report the cause of variance and continue while the
repair remains bounded and safe. Record diagnosis, implementation, review, and
focused verification time separately. Specification checks and the isolated
diagnostic are not installed runtime or release proof.
