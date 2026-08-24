# Side-panel composition-root single-cutover program R01

## Status and authority

On 2026-08-24 the user approved planning one larger behavior-preserving
`src/side-panel.ts` cutover instead of paying the broad verification cost for a
sequence of installed controller extractions. The user also requested an
unattended overnight execution path that does not pause for routine choices or
repeat expensive verification after every extraction.

This document specifies stable product task `side-panel-single-cutover`. It
authorizes the specifier to finish the contract, but it is not an implementation
handoff until the user explicitly approves coder handoff. It is QA feature
integration, not a promotion of accumulated QA work to `master`.

## Diagnosed bottleneck

At the planning baseline, `src/side-panel.ts` contains 6,395 lines, 112 import
declarations, 216 top-level function declarations, and about 275 event-listener
registrations. It owns state and installed behavior for Capture, Live Inspection,
Event Library, Schemas, Defects, Replay, Projects, durable persistence, and shell
composition.

Read-only intent for a direct `src/side-panel.ts` change selects all twenty
runnable packs and 803 tasks through `shell_platform_runtime`. This is correct:
path ownership cannot distinguish responsibilities inside one file. The recent
Live target permission-recovery delivery showed the cost. A small target-path
apply callback selected all twenty packs and 890 tasks and required two separately
reviewed ownership preparations before focused product proof became causal.

The remedy is not to narrow `src/side-panel.ts`, rename the monolith, or assign
symbol ranges to different packs. The root remains genuinely global. The remedy
is to make it small and stable so ordinary product work changes owned controller
paths instead.

## Behavior and safety boundary

This program changes structure only. It preserves exactly:

- the extension manifest, side-panel browser entry, HTML identities, stylesheets,
  commands, Hotkeys, Command Palette, workspace navigation, focus, accessibility,
  and visible text and layout;
- every storage namespace, key, serialized value, migration, project revision,
  Undo and Redo result, Published schema meaning, saved session, template, defect,
  replay sequence, and active-project identity;
- current Chrome permission requests, active-tab handling, observation target,
  configured paths, page probes, runtime messages, downloads, and object-URL
  cleanup; and
- every registered unit, property, acceptance, hardening, browser target,
  assertion leaf, package input, and terminal obligation.

Behavior changes, storage migrations, assertion deletion, coverage substitution,
or broader permissions require a separate user-approved specification.

## Target architecture

`src/side-panel.ts` becomes the stable application bootstrap. It may construct
shared platform and storage adapters, mount the utility shell and installed
utility controllers, route registered commands, perform shell arbitration, and
dispose mounted lifecycles. It owns no Data Layer mutable state, domain rendering,
domain persistence, or domain event listener.

The Data Layer public entry mounts one installed runtime. That runtime composes
pack-owned controllers through explicit typed ports. Each controller owns its DOM
queries or injected element collection, mutable state, render/update operations,
event listeners, runtime subscriptions, asynchronous cancellation, and idempotent
disposal. Controllers may import their own module internals. Cross-domain behavior
enters through injected capabilities; one controller may not import another
controller's implementation or share its mutable object.

The initial Schema controller may remain internally large. Once its state and
installed wiring are outside the global root, canonical editing, rules,
assignments, and guided validation can be split under focused Schema ownership in
later work without touching `src/side-panel.ts`.

The completion guardrail is responsibility-based. As a diagnostic ceiling, the
bootstrap should not exceed 500 source lines. Exceeding that ceiling requires an
architect explanation proving that every retained line is stable shell
composition rather than domain behavior.

## State and lifecycle ownership

| Controller | Exclusive installed ownership |
|---|---|
| Capture | observation targets, permission/path integration, session and observer runtime, Live feed/filter state, saved sessions, refresh scheduling, and capture subscriptions |
| Event Library | template library, editor and rename state, import/deletion review, push review, readiness, and template actions |
| Schemas | schema and rule libraries, drafts, canonical editor settlement, assignments, validation records, guided validation, and schema dialogs |
| Defects | defect library, selection, return position, copy/export actions, and defect presentation |
| Replay | replay sequences, replay controls, execution presentation, and replay lifecycle |
| Projects | Project Library host, active-project capability, navigation, and project-scoped coordination |
| Durable Projects | durable startup, migration review, save-failure recovery, retry/reject/export, and repository UI lifecycle |
| Project Event Transport | observation and push paths, durable transport settlement, and target-path refresh capability |
| Live Flow Testing | installed test lifecycle, current summary, event-result projection, and project-opening capabilities |
| Installed Data Layer runtime | controller construction order, typed port wiring, command projection, aggregate disposal, and no domain state |

Every listener and subscription has exactly one owner. `mount` is idempotent,
`dispose` removes every owned listener and subscription and cancels pending work,
repeated disposal is a no-op, and a disposed controller can mount one fresh
lifecycle without duplicating an action.

## Development focus and proposed QA ownership

The following prefixes are provisional until the coder's read-only intent and
architect review. They deliberately follow product/pack ownership rather than a
generic shell folder.

| Proposed source | Parent pack | Subordinate slice | Exact direct consumers |
|---|---|---|---|
| `src/data-layer-installed/capture/` | `capture` | `capture_installed_side_panel` | `event-library`, `project_event_transport`, `schemas`, `live_flow_testing`, `shell` |
| `src/data-layer-installed/event-library/` | `event-library` | `event_library_installed_side_panel` | `project_event_transport`, `defects`, `replay`, `guided_test_cases`, `shell` |
| `src/data-layer-installed/schemas/` | `schemas` | `schemas_installed_side_panel` | `defects`, `project_assurance_severity`, `guided_test_cases`, `shell` |
| `src/data-layer-installed/defects/` | `defects` | `defects_installed_side_panel` | `live_flow_testing`, `shell` |
| `src/data-layer-installed/replay/` | `replay` | `replay_installed_side_panel` | `shell` |
| `src/data-layer-installed/projects/` | `project_management` | `project_library_installed_side_panel` | `durable_project_repository`, `project_event_transport`, `guided_test_cases`, `shell` |
| `src/data-layer-installed/durable-projects/` | `durable_project_repository` | `durable_project_installed_side_panel` | `flow_graph`, `layered_schema`, `shell` |
| `src/data-layer-installed/project-event-transport/` | `project_event_transport` | `project_event_transport_installed_side_panel` | `capture`, `event-library`, `shell` |
| `src/data-layer-installed/live-flow-testing/` | `live_flow_testing` | `live_flow_testing_installed_side_panel` | `capture`, `defects`, `schemas`, `shell` |
| `src/data-layer-installed-runtime.ts` | `shell` | `shell_installed_data_layer_runtime` | `capture`, `event-library`, `schemas`, `defects`, `replay`, `project_management`, `durable_project_repository`, `project_event_transport`, `live_flow_testing` |

Likely existing shared integration surfaces are
`src/utilities/data-layer/index.ts`, the six public Data Layer module facades,
`architecture/data-layer-boundaries.json`, `verification/packs.json`,
`src/utility-registry.ts`, `src/side-panel-bootstrap.ts`, `side-panel.html`, and
the installed side-panel target registry and assertion map. The planned cutover
must name any of these paths it will actually change. It must also retain the
recently installed permission-recovery coordinator and target-path apply callback
when moving their composition out of the root.

Ordinary post-cutover leaf changes use their reviewed slice. Changes to the
installed Data Layer runtime select its bounded controller-owner closure. Direct
changes to `src/side-panel.ts`, `src/side-panel-bootstrap.ts`, shared platform
adapters, or utility-registry semantics remain global.

## One-candidate execution sequence

The product implementation remains one stable task and has one installed cutover
candidate. The expected `coarse-boundary` result is handled by the governed
ownership-preparation stage below rather than by weakening ownership or running
the all-pack plan. The role chain may continue without further user input while
the behavior and safety boundary above remains unchanged.

1. **Intent and automatic routing.** Before product coding, run read-only intent
   from the exact QA base with every forecast path, including
   `src/side-panel.ts`. On the expected `coarse-boundary` result, preserve the
   stable product task and issue structured preparation task
   `verification-slice-side-panel-single-cutover` from current QA. The judgment
   must say that one global installed cutover is unavoidable, while every future
   controller path is independently ownable.
2. **Inventory and freeze.** Record every top-level state owner, function cluster,
   listener, subscription, asynchronous timer, public facade import, command, and
   static source assertion. Bind the inventory to the exact QA base. Do not edit
   the installed root yet.
3. **Ownership preparation.** Add controller path declarations, typed port
   contracts, lifecycle harnesses, proposed slices, registered direct tasks, and
   consumer-only installed proof declarations. Controllers remain unmounted and
   contain no activated product behavior. `src/side-panel.ts`, its public facade
   imports, and installed behavior stay byte-identical during this stage. Run
   only the exact bounded preparation evidence, obtain architect `qa-ready`, and
   integrate the preparation into QA.
4. **Automatic product resumption.** Reissue stable task
   `side-panel-single-cutover` from that exact QA descendant without another user
   decision. Re-run read-only intent and candidate preflight; the reviewed
   preparation and this specification supply the causal cutover route but do not
   classify the global root as narrow.
5. **Controller construction.** Move or adapt behavior into the unmounted
   controllers on the same candidate. Run build and the changed controller's
   direct unit tests after each coherent controller. Do not run an installed
   browser matrix or an all-pack plan after each extraction.
6. **Pre-cutover settlement.** Require every controller-local lifecycle test,
   architecture contract, ownership declaration, import-boundary check, and
   static conservation test to pass together. Resolve all known failures before
   touching the installed root.
7. **Atomic cutover.** Replace the Data Layer body in `src/side-panel.ts` with
   public runtime construction, command routing, mounting, and disposal. Move,
   rather than redesign, behavior. Update static tests to inspect the new owners
   while conserving their assertion meaning. Do not perform a second partial
   installed extraction.
8. **Installed stabilization.** Build once, run controller-local tests together,
   then run the complete existing direct side-panel compatibility assertion map
   once against the coherent cutover. Repair causal leaves before requesting
   exact evidence.
9. **Exact evidence.** Run fresh read-only candidate preflight. Because the
   candidate necessarily changes the global root, use only the independently
   reviewed, user-approved causal cutover evidence: build; architecture and
   ownership contracts; every new controller unit; conserved static contracts;
   every existing registered installed side-panel assertion leaf through its
   canonical target/session batching; relevant declared properties; and package
   proof. No feature-mode all-runnable-pack checkpoint or unrelated whole-pack
   array is authorized.
10. **Focus proof and handoff.** Demonstrate negative changed-path plans for every
   new controller prefix and a still-global plan for the root. Hand off the exact
   candidate and review-ready evidence through the normal refactorer and architect
   route for QA integration only.

## Overnight failure policy

Routine implementation choices, bounded refactors, test fixture adjustments, and
causal repairs do not require user input. Preserve the stable task and continue.

- A failure before exact evidence is repaired at its owning controller and reruns
  only that direct check plus shared prerequisites. The complete direct side-panel
  compatibility map runs again only after all causal leaves are green. If that
  second complete compatibility run fails, stop rather than begin another broad
  repair cycle.
- Exact evidence does not begin while a known failure, pending asynchronous task,
  changed ownership declaration, or unreviewed integration path remains.
- If the first exact-candidate run fails causally, discard its candidate-bound
  evidence, repair the smallest owning leaf, rerun that leaf and the complete
  direct compatibility map, then permit one replacement exact-candidate run.
- Stop fail-closed instead of looping when the same causal boundary invalidates
  the replacement run, behavior or durable data would need to change, a new
  permission is required, an undeclared controller consumer appears, an assertion
  would be weakened, the root cannot be reduced to composition, or the change
  escapes the paths and consumers above.

No timeout, slow task, or overnight duration alone authorizes deletion, skipped
evidence, broader permissions, a full-pack feature run, master integration, or a
different product behavior.

## Completion evidence

The program is complete on QA only when:

- `src/side-panel.ts` contains only the allowed stable composition
  responsibilities and no Data Layer mutable state or domain listener;
- all moved state, listener, subscription, timer, and cleanup inventory entries
  have exactly one controller owner;
- every existing behavior and durable-data assertion remains represented;
- the ownership preparation is QA-integrated and the product candidate descends
  from that exact commit;
- each controller mounts, disposes, and remounts independently in direct tests;
- every proposed prefix has one valid slice, registered tasks and prerequisites,
  reviewed exact consumers, and no parent fallback;
- representative controller-only changes exclude unrelated packs, while a root
  change still selects every runnable pack; and
- the exact QA candidate has review-ready focused evidence and package proof.

Measured source size, selected pack/task counts, direct-test time, installed
compatibility time, exact verification time, failures, repairs, invalidated runs,
and reruns are recorded in the delivery scorecard. A later cumulative promotion
to `master` remains a separate user decision.
