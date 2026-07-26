# TWAtility Belt branding parity matrix R01

## Audit status and authority

This is the Slice 0 control, state, workflow, and preservation contract for the
production branding migration. It is intentionally more specific than the frozen
mock's own coverage claim.

- Program: `docs/twatility-branding-integration-program-R01.md`
- Reference branch: `feature/ui-mock`
- Program reference commit: `1dc45634aad24975a9f6c0c9dd474c934e87a65f`
- Frozen mock commit: `92d9c2d39b2724f85154be05328594c727368099`
- Integration branch: `feature/twatility-branding`
- Integration program commit: `6e77e4c3791f67c42bb3fe1db36f792a865ef5e2`
- Previous master base: `e4d36277a4113d2999c26ac6ba8ae13c5c6b0242`
- Current master base: `e4d36277a4113d2999c26ac6ba8ae13c5c6b0242`
- First master-boundary result: no upstream commit or file delta
- Current authority: fetched `origin/master` version of
  `docs/swarmforge-active-scope.md`, its six named programs, and all 16 active
  behavior/runtime contracts
- Production baseline evidence:
  `docs/twatility-branding-evidence/slice-0-baseline/`

The mock is design evidence only. `mock.js`, hardcoded examples, fixed counts,
predetermined toasts, static validation results, fake persistence, fake file and
clipboard actions, and illustrative project data are never behavior authority.

## Classification key

- **Structural improvement** — production presentation structure changes while
  retaining the authoritative model, command, identity, focus, persistence, and
  Undo semantics. The proposed structural rows were approved by the user on
  2026-07-26.
- **Branding/layout parity** — existing controls are wrapped or regrouped without
  changing behavior or state ownership.
- **Brush-on styling** — tokens, typography, color, border, shadow, spacing,
  focus-ring appearance, overflow, and responsive CSS only.
- **Preserve implementation** — production is more complete or semantically
  stronger. Mock styling may inform the result, but its interaction is not ported.
- **Mock-only / do not port** — the cited mock content has no supported production
  equivalent or conflicts with current authority.

## Owner and verification shorthand

The codes below expand every compact matrix cell to exact production files and
checks.

### Production owners

- **O-SHELL** — `side-panel.html`, `side-panel.css`, `src/side-panel.ts`,
  `src/platform/utility-shell-dom.ts`, `src/workspace-tabs.ts`,
  `src/workspace-tabs-ui.ts`, `src/command-palette*.ts`,
  `src/side-panel-action-hierarchy*.ts`, `src/panel-empty-states*.ts`
- **O-LIVE** — `side-panel.html`, `src/side-panel.ts`, `src/data-layer-live-*.ts`,
  `src/data-layer-observation-*.ts`, `src/data-layer-event-feed-*.ts`,
  `src/data-layer-workflow-focus-ui.ts`, `src/data-layer-live-flow-testing*.ts`,
  `src/data-layer-live-flow-defect-report.ts`
- **O-PROJECTS** — `side-panel.html`,
  `src/data-layer-project-library.ts`,
  `src/data-layer-project-library-ui.ts`,
  `src/data-layer-project-entity-lifecycle.ts`
- **O-DURABLE** — `src/data-layer-durable-project-repository.ts`,
  `src/data-layer-durable-project-repository-ui.ts`,
  `src/data-layer-durable-project-runtime.ts`, `src/durable-project/`,
  `src/data-layer-compact-canonical-history.ts`
- **O-LIBRARY** — `side-panel.html`, `src/side-panel.ts`,
  `src/data-layer-event-library-*.ts`, `src/data-layer-event-template-*.ts`,
  `src/data-layer-push-draft-review-*.ts`,
  `src/data-layer-selected-target-push*.ts`
- **O-SESSIONS** — `side-panel.html`, `src/side-panel.ts`,
  `src/data-layer-saved-sessions.ts`,
  `src/data-layer-saved-session-live-feed.ts`
- **O-DEFECTS** — `side-panel.html`, `src/side-panel.ts`,
  `src/data-layer-defect-*.ts`, `src/data-layer-missing-event-*.ts`,
  `src/data-layer-event-occurrence-defect-report*.ts`,
  `src/data-layer-unified-defect-*.ts`
- **O-CANON** — `side-panel.html`, `src/side-panel.ts`,
  `src/data-layer-side-panel-unified-schema-editor.ts`,
  `src/data-layer-side-panel-schema-editor.ts`, `src/canonical-schema/`,
  `src/canonical-schema-focused/`,
  `src/data-layer-canonical-schema-focused-*.ts`,
  `src/data-layer-focused-schema-property-*.ts`
- **O-CONDITION** — `src/data-layer-shared-condition-tree-editor.ts`,
  `src/data-layer-canonical-schema-focused-condition*.ts`,
  `src/data-layer-canonical-schema-focused-rule*.ts`,
  `src/data-layer-composed-schema-workspace-focused-*.ts`,
  `src/data-layer-schema-assignment-data-conditions-ui.ts`
- **O-HOTKEYS** — `side-panel.html`, `src/side-panel.ts`,
  `src/hotkey-*.ts`, `src/utilities/hotkeys/`
- **O-STUDIO** — `specification-builder.html`,
  `specification-builder.css`, `specification-builder-guidance.css`,
  `src/specification-builder.ts`
- **O-LIFECYCLE** — `src/data-layer-project-entity-lifecycle.ts`,
  `src/specification-builder.ts`
- **O-COMPOSED** — `src/data-layer-composed-schema-workspace*.ts`,
  `src/data-layer-layered-schema*.ts`, `src/composed-schema/`,
  `src/layered-schema/`, `layered-schema.css`
- **O-FLOW** — `src/data-layer-flow-graph*.ts`, `src/flow-graph/`
- **O-FLOW-EXPORT** — `src/data-layer-flow-table-documentation-export.ts`,
  `src/data-layer-flow-table-documentation-export-ui.ts`
- **O-PROJECT-DOC** — `src/data-layer-flow-documentation-snapshot.ts`,
  `src/data-layer-project-documentation-compiler.ts`,
  `src/data-layer-project-documentation-records.ts`,
  `src/data-layer-project-documentation-workspace.ts`,
  `src/data-layer-project-documentation-workspace-ui.ts`,
  `src/specification-builder.ts`
- **O-ASSURANCE** — `src/data-layer-specification-assurance.ts`,
  `src/data-layer-specification-project.ts`, `src/specification-builder.ts`
- **O-BUILD** — `scripts/build.mjs`, `scripts/package.mjs`, `manifest.json`,
  `verification/packs.json`

### Verification sets

- **T-SHELL** — `npm run typecheck`; architecture check; exact action-hierarchy
  and empty-state unit/UI tests; `test/browser-packs/shell.mjs`; ID, role,
  `aria-controls`, `aria-describedby`, tab order, focus, and 360/420/512 checks
- **T-LIVE** — touched Live unit/property tests; applicable capture browser
  adapter; `live_flow_testing` checkpoint when Flow behavior overlaps; saved
  session, target, feed, validation, defect, dialog, focus-return, and 360px checks
- **T-PROJECTS** — project library unit/property tests;
  `test/browser-packs/project-management.mjs`;
  `test/browser-packs/project-entity-lifecycle.mjs`; durable renderer adapter;
  `project_management` checkpoint; IndexedDB, switch, import/export, cross-window,
  dialog, focus, and 360px checks
- **T-CANON** — focused canonical/rule/condition unit and property tests;
  conditional-rule and composed-schema tests; installed layered-schema adapter;
  `layered_schema` checkpoint; save/reload/inheritance/sparse override/reset/Undo,
  IME/caret, overlay geometry, Escape, focus-return, direct Table-cell commit,
  Tab/Shift+Tab traversal, blur deduplication, and invalid-cell checks
- **T-STUDIO** — project-management/entity-lifecycle/durable-renderer browser
  adapters; route, collection, Documentation-first tree order, Inspector, focus,
  and 1280/1440/1720/200% checks
- **T-FLOW** — Flow graph unit/persistence/property tests; Flow graph browser
  adapter; `flow_graph` checkpoint; pointer/keyboard, identity, example,
  topology, deletion/Undo, and viewport-restoration checks
- **T-EXPORT** — selected-Flow value-map and project Documentation
  unit/property/browser evidence; `flow_export` checkpoint; portable named sets
  and themes, progressive configuration, rich clipboard fallback, XLSX,
  stale/incomplete/preflight/repair, sanitization, and immutability checks
- **T-A11Y** — keyboard traversal, visible focus, accessible names/descriptions,
  dialog focus return, 200% zoom, contrast, reduced motion, forced colors
- **T-PACKAGE** — source rebuild; HTML-reference completeness; `node
  scripts/package.mjs`; packaged-extension Chrome load; console/page-error/
  failed-request audit

### Collision codes

- **C-LOW** — new scoped branding CSS/assets and documentation
- **C-SHELL** — `side-panel.html`, `side-panel.css`, `src/side-panel.ts`
- **C-STUDIO** — `specification-builder.html`, `specification-builder.css`,
  `src/specification-builder.ts`
- **C-CANON** — focused canonical, composed, layered, and condition renderers
- **C-PERSIST** — project library and durable repository/runtime
- **C-FLOW** — Flow graph, export, and guided Live Flow modules
- **C-BUILD** — `scripts/build.mjs`, manifest, verification registry, generated
  `dist/`; generated conflicts are always source-resolved and rebuilt

## Side-panel shell and navigation

| Surface or workflow | Production owner | Production controls | Mock destination | Classification | Preserve contract | Proposed migration | Risk tier | Verification | Master collision risk | Decision and status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Utility directory | O-SHELL | `#utility-directory`; active utility; Commands entry | control map / shell; side-panel masthead | Branding/layout parity | Utility registry ownership, namespaced lifecycle, accessible active state | Brand the header and directory without renaming utility hooks | V1 | T-SHELL, T-A11Y | C-SHELL | implemented and verified — Slice 2 |
| Workspace tabs | O-SHELL | `#workspace-tab-data-layer`, `#workspace-tab-hotkeys`; tab/tabpanel and roving `tabindex` | side-panel workspace tabs | Branding/layout parity | `role=tab`, `aria-controls`, selected state, keyboard arrows/Home/End | Restyle existing tabs as primary utility choices | V1 | T-SHELL, T-A11Y | C-SHELL | implemented and verified — Slice 2 |
| Data Layer view tabs | O-SHELL | `#data-layer-view-live/projects/library/sessions/defects/schemas`; authoritative `hidden` panel ownership | side-panel view rail | Branding/layout parity | Every peer view, selected state, stable IDs and keyboard targets | Contained branded subnavigation with wrap-safe labels | V1 | T-SHELL, T-A11Y | C-SHELL | implemented and verified — Slice 2 |
| Active project context | O-PROJECTS | `#active-project-header`; stable ID, name, Saved Draft, Published revision | project ribbon/context card | Branding/layout parity | No implied active project; atomic cross-surface identity | Turn existing summary into restrained project ribbon | V1 | T-PROJECTS | C-SHELL, C-PERSIST | implemented and verified — Slices 2–3 |
| Command palette | O-SHELL | `#open-palette`, `#palette`, `#palette-filter`, `#palette-results`; dialog/listbox | side-panel command palette | Brush-on styling | Filtering, command execution, Escape, selected option, focus return | Apply dialog/card tokens only | V0 | T-SHELL, T-A11Y | C-SHELL | implemented and verified — Slice 2 |
| Status and action feedback | O-SHELL | polite/assertive outputs, command log, saving/saved/failed and disabled reasons | state gallery / system feedback | Brush-on styling | Truthful message, live-region priority, `aria-describedby`, state owner | Shared notice, status-chip and disabled-reason styles | V0 | T-SHELL, T-A11Y | C-LOW | approved — Slices 1–2 |
| Responsive master/detail navigation | O-LIVE, O-SHELL | back-to-list, inspector close/back, stable origin focus | Live inspector and responsive mock | Branding/layout parity | Connected focused control, master/detail state and focus restoration | Reflow existing regions; never replace or overlay essential controls | V1 | T-SHELL, T-LIVE, T-A11Y | C-SHELL | shell layout implemented and verified — Slice 2; deeper Live workflow evidence retained for Slice 6 |

## Live capture, inspection, and guided validation

| Surface or workflow | Production owner | Production controls | Mock destination | Classification | Preserve contract | Proposed migration | Risk tier | Verification | Master collision risk | Decision and status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Saved-session banner | O-SESSIONS, O-LIVE | return to current feed; revalidate; comparison status | state gallery / historical session | Branding/layout parity | Saved bytes, current-schema comparison, no feed mutation | Styled comparison banner with existing actions | V1 | T-LIVE | C-SHELL | approved — Slice 6 |
| Session summary | O-LIVE | ended/running; observer state; target; count; URL/path/source; Copy URL | Live session mast | Branding/layout parity | Real session and Chrome target state; clipboard effect | Card hierarchy and wrap-safe metadata | V1 | T-LIVE, T-A11Y | C-SHELL | approved — Slices 2, 6 |
| Setup checklist | O-LIVE | Choose target; access/path readiness; Start and disabled reason | target-readiness gallery | Branding/layout parity | Permission/path truth; unavailable reason; recovery action | Progressive numbered presentation around existing controls | V1 | T-LIVE, T-A11Y | C-SHELL | approved — Slice 6 |
| Capture lifecycle | O-LIVE | `#start-data-layer-testing`, Pause, Resume, End; authoritative `hidden` | Live and alternate lifecycle states | Brush-on styling | Chrome observation side effects and capturing/paused/ended transitions | State-colored action group without changing lifecycle wiring | V0 | T-LIVE | C-SHELL | approved — Slice 6 |
| Session boundary actions | O-LIVE, O-SESSIONS | Save session; Start fresh; Report missing event | state gallery reviews | Branding/layout parity | Snapshot, fresh-session and report side effects; pending data review | Consistent secondary action section | V1 | T-LIVE, T-A11Y | C-SHELL | approved — Slice 6 |
| Save snapshot review | O-SESSIONS | name; summary; confirm/cancel; valid-name disabled state | Save current session dialog | Brush-on styling | Dialog label, validation, atomic saved-session write, origin focus | Shared review-dialog skin | V0 | T-LIVE, T-A11Y | C-LOW | approved — Slice 6 |
| Fresh-session confirmation | O-LIVE | Save and start fresh; Discard and start fresh; Cancel | fresh-session dialog | Brush-on styling | Explicit destructive choice, session transition, focus return | Shared destructive review styling | V0 | T-LIVE, T-A11Y | C-LOW | approved — Slice 6 |
| Observation source status | O-LIVE | connected/disconnected/error sources; reconnect guidance; count | Live source health / error gallery | Brush-on styling | Real observer status and visible recovery | Status chips and source cards | V0 | T-LIVE, T-A11Y | C-LOW | approved — Slice 6 |
| Event-feed query | O-LIVE | search/filter criteria; saved filters; clear/reset; result count | observed event feed | Branding/layout parity | Query model, persisted saved filters, current result ownership | Compact filter card with stacking at 360px | V1 | T-LIVE | C-SHELL | approved — Slice 6 |
| Event timeline | O-LIVE | event selection; nested tuple/property expansion; provenance; empty/error | Live event cards | Branding/layout parity | Chronology, stable selection, expansion and source evidence | Branded timeline/card projection | V1 | T-LIVE, T-A11Y | C-SHELL | approved — Slice 6 |
| Event inspector | O-LIVE | Back to events; property tree; raw payload; validation issues; contextual actions | Live event detail | Branding/layout parity | Master/detail state, raw bytes, issue identity, return focus | Section/card treatment with local code overflow | V1 | T-LIVE, T-A11Y | C-SHELL | approved — Slice 6 |
| Captured-event actions | O-LIVE, O-LIBRARY, O-DEFECTS | Validate; report; create/update template; declare property; push selected target | inspector actions / report review | Preserve implementation | Real validation, library, schema, defect, target side effects and disabled reasons | Restyle action hierarchy; do not use mock toasts | V1 | T-LIVE | C-SHELL | preserve — Slice 6 |
| Guided validation | O-LIVE, O-CANON | destination/schema/property/rule; nested path; issue; expected/conditions; back/continue/finish | control-map claim; incomplete mock destination | Preserve implementation | Production step state, canonical commands, continuation, no fake result | Style the actual guided drawer only; mock structure is insufficient | V1 | T-LIVE, T-CANON | C-SHELL, C-CANON | preserve — Slice 6 |
| Manual Flow testing | O-LIVE, O-FLOW | Flow selector above existing feed; root Page, contained Event, outgoing Page linking; ordinary validation/defect | control-map claim; absent actual mock journey | Preserve implementation | Feed order unchanged; no auto Assignment; Page context; stable links; no execution claim | Brand existing feed/detail integration; do not create mock wizard/pass-fail system | V2 | T-LIVE, T-FLOW | C-FLOW | preserve — Slice 6 |
| Observation settings | O-LIVE | Browse tabs; history path/status; restart; warning; detach review | settings and permission/path gallery | Branding/layout parity | Optional permissions, active tab, path recovery, detach semantics | Branded settings section and review dialog | V1 | T-LIVE, T-A11Y | C-SHELL | approved — Slice 6 |
| Target picker | O-LIVE | target search/count/list/select; permission state; Close/recovery | target-picker dialog | Branding/layout parity | Chrome tab permission/access, result ownership, focus trap/return | Shared target-list/dialog styling | V1 | T-LIVE, T-A11Y | C-SHELL | approved — Slice 6 |

## Projects and durable repository

| Surface or workflow | Production owner | Production controls | Mock destination | Classification | Preserve contract | Proposed migration | Risk tier | Verification | Master collision risk | Decision and status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Active project card | O-PROJECTS | Open Studio; Edit details; Export; human metadata | Projects active card | Branding/layout parity | Stable active identity, real metadata, project-name accessible actions | Branded active card with no fictional logo | V1 | T-PROJECTS | C-SHELL, C-PERSIST | implemented and verified — Slice 3 |
| No-active and repository-unavailable states | O-PROJECTS, O-DURABLE | Open project; Create project; disabled project controls; recovery-only guidance | Projects/no-active and recovery gallery | Preserve implementation | Never infer first/recent/only project; global Saved Schemas remain available; failed mount never presents a false empty library or Web Storage fallback | Style the authoritative empty/recovery projection without fabricating context | V2 | T-PROJECTS, T-A11Y | C-PERSIST | preserved and verified — Slice 3 |
| Project library query | O-PROJECTS | search; Name/Last saved sort; result count | Projects library | Branding/layout parity | Query/sort state and compact metadata reads only | Responsive query toolbar | V1 | T-PROJECTS | C-SHELL | implemented and verified — Slice 3 |
| Project rows | O-PROJECTS | Active/Switch; Edit; Export; saved/published metadata | project rows | Branding/layout parity | Name in accessible actions; no implicit activation; pending writes block switch | Branded rows/cards preserving exact action set | V1 | T-PROJECTS, T-A11Y | C-SHELL, C-PERSIST | implemented and verified — Slice 3 |
| Metadata-only library and selective route loading | O-PROJECTS, O-DURABLE | library search/sort/open; active metadata projection | project library | Preserve implementation | Browse 100-project metadata without loading bodies; open only the selected project/visible route; inactive projects gain no subscription | Presentation may group metadata but must not add body hydration or selectable-card activation | V2 | T-PROJECTS | C-PERSIST | preserved and verified — Slice 3 |
| Create project | O-PROJECTS | name/purpose/site/owner/notes; review; confirm; Open Studio; Close | create-project dialog | Branding/layout parity | Project-scoped ID, atomic create, active-context result, review focus | Guided review styling around production form | V1 | T-PROJECTS | C-PERSIST | implemented and verified — Slice 3 |
| Edit project metadata | O-PROJECTS | same fields; Save; page-scoped Undo; Close | edit-project dialog | Branding/layout parity | Draft token, record-scoped save, exact Undo, focus return | Restyle production form and result | V1 | T-PROJECTS | C-PERSIST | implemented and verified — Slice 3 |
| Page-scoped Undo/Redo and conflicts | O-DURABLE | Undo; Redo; Retry/Reject conflict; disabled/history state | edit and recovery states | Preserve implementation | Forward/inverse patches stay only in the open project page; reload/project replacement clears history; stale overlap cannot overwrite the newer Draft; Published revision does not advance | State/action hierarchy only; never promise persisted history | V2 | T-PROJECTS | C-PERSIST | preserved and verified — Slice 3 |
| Switch review | O-PROJECTS, O-DURABLE | named impact; pending Merge/Reject/Retry; Confirm/Cancel | switch review gallery | Preserve implementation | Atomic side-panel/Studio subscription; stale/failed writes block before activation | Branded impact review with truthful disabled reason | V2 | T-PROJECTS | C-PERSIST | preserved and verified — Slice 3 |
| Cross-window active-context convergence | O-PROJECTS, O-DURABLE | active header; safe switch/deep-link review; project-scoped route restoration | cross-window context gallery | Preserve implementation | One nullable durable active identity; activation commits before subscriptions/entity lookup; identity/token notifications carry no full project payload; per-project location fallback remains valid | Highlight the shared context without duplicating or hardcoding it | V2 | T-PROJECTS | C-PERSIST | preserved and verified — Slice 3 |
| Project export | O-PROJECTS, O-DURABLE | Export active/library project; download/result | active card and project rows | Preserve implementation | Read latest fully persisted Draft; no mutation/context change; include complete project graph and immutable publication content; exclude permissions, Live, cache, UI, history, backups, and diagnostics | Style the existing download action/result; no mock toast or alternate format | V2 | T-PROJECTS, T-PACKAGE | C-PERSIST | preserved and verified — Slice 3 |
| Project import | O-PROJECTS, O-DURABLE | file; staged summary; unique name; Import as new; invalid/blocked | side-panel import gallery | Preserve implementation | Versioned atomic import, remapped owned IDs/refs, inactive until opened | Style existing staged review; no mock file behavior | V2 | T-PROJECTS, T-PACKAGE | C-PERSIST | preserved and verified — Slice 3 |
| Repository status | O-DURABLE | opening/ready/saving/failed; project counts | Projects durable storage | Brush-on styling | IndexedDB is canonical; mount read-only unless verified migration | Shared storage status panel | V0 | T-PROJECTS | C-PERSIST | implemented and verified — Slice 3 |
| Save failure and recovery blockers | O-DURABLE | exact Save failed status; disabled Switch/Publish; Retry; Reject; Export unsaved Draft; backup; diagnostics | durable recovery gallery | Preserve implementation | Quota/abort/unavailable/corrupt/verification failures retain the command and last durable token; recovery never claims saved work or silently deletes records | Warning/danger presentation must retain exact command, reason, disabled state, and non-colour copy | V2 | T-PROJECTS, T-A11Y | C-PERSIST | preserved and verified — Slice 3 |
| Legacy migration review | O-DURABLE | export sources; choose library/active projection; result | equal-generation divergence gallery | Preserve implementation | Explicit source choice, durable read-back, checksummed backup, atomic cleanup | Style production recovery review only | V2 | T-PROJECTS | C-PERSIST | preserved and verified — Slice 3 |
| Orphan Flow ownership repair | O-DURABLE, O-LIFECYCLE | recovery receipt/backup; dependency and stale-route projections | production-only repair state | Preserve implementation | Atomic backup/delete/receipt/read-back; advance Draft token only; retain original on any failure; remove ghost dependency/navigation without changing Published revision | No new control; preserve truthful recovery and removal projections | V2 | T-PROJECTS, T-STUDIO | C-PERSIST, C-STUDIO | preserve — Slices 3–4 |
| Storage & recovery | O-DURABLE | Retry; Reject; Export unsaved Draft; repository backup; diagnostics; Close | recovery gallery | Preserve implementation | Exact failed command retained; last durable Draft unchanged; switch/publish blocked | Branded recovery surface with deterministic result focus | V2 | T-PROJECTS, T-A11Y | C-PERSIST | preserved and verified — Slice 3 |
| Migration-backup deletion | O-DURABLE | review; retain/cancel; delete retained legacy bytes only | delete-backup dialog | Preserve implementation | No cascade; recovery bytes only; explicit destructive confirmation and focus return | Shared destructive-dialog skin | V1 | T-PROJECTS, T-A11Y | C-PERSIST | preserved and verified — Slice 3 |

## Event Library, sessions, and defects

| Surface or workflow | Production owner | Production controls | Mock destination | Classification | Preserve contract | Proposed migration | Risk tier | Verification | Master collision risk | Decision and status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Template library toolbar | O-LIBRARY | search; Add event; Import; Export; Clear | Library toolbar | Branding/layout parity | Real file/clipboard/library effects, empty-state recovery | Branded query/action header | V1 | T-LIVE, T-A11Y | C-SHELL | approved — Slice 6 |
| Template rows | O-LIBRARY | open/edit; duplicate; delete; revisions/source; push | Library rows | Branding/layout parity | Stable template identity, target legality, accessible named actions | Row/card presentation | V1 | T-LIVE | C-SHELL | approved — Slice 6 |
| Library import review | O-LIBRARY | Append/Replace/Cancel; staged counts/errors | schema/template import dialogs | Preserve implementation | Atomic strategy, destructive replacement review, no mock file shortcut | Shared staged-import styling | V1 | T-LIVE, T-A11Y | C-SHELL | preserve — Slice 6 |
| Library clear/delete review | O-LIBRARY | clear/delete request, impact, confirm/cancel | clear/delete dialogs | Preserve implementation | Dependency and destructive impact; focus return | Shared danger-dialog styling | V1 | T-LIVE, T-A11Y | C-SHELL | preserve — Slice 6 |
| Template identity | O-LIBRARY | stable ID/name/event/source/destination/revision | template editor | Brush-on styling | Identity, source lineage and destination semantics | Field/metadata tokens only | V0 | T-LIVE | C-SHELL | approved — Slice 6 |
| Template properties | O-LIBRARY | structured property rows/add/edit/remove | template editor | Branding/layout parity | JSON/property round trip, path/type semantics | Responsive structured-property cards | V1 | T-LIVE | C-SHELL | approved — Slice 6 |
| Advanced template data | O-LIBRARY | JSON editor; invalid JSON; destination errors | advanced editor | Brush-on styling | Exact bytes, validation association, local horizontal overflow | Monospace/code surface and error styling | V0 | T-LIVE, T-A11Y | C-SHELL | approved — Slice 6 |
| Template actions | O-LIBRARY | Save revision; Push draft; Save copy; Discard; return | editor actions | Preserve implementation | Revision, selected-target, file/storage side effects and disabled reasons | Restyle existing hierarchy | V1 | T-LIVE | C-SHELL | preserve — Slice 6 |
| Template reviews | O-LIBRARY | push/revision/unsaved-close reviews | mock review dialogs | Preserve implementation | Review before mutation, focus restoration, stale target handling | Shared review-dialog styling | V1 | T-LIVE, T-A11Y | C-SHELL | preserve — Slice 6 |
| Test sequences | O-LIBRARY | create/list/run/replay states | Library sequences | Preserve implementation | Installed replay behavior and evidence; no mock fake run | Style only existing sequence surfaces | V1 | T-LIVE | C-SHELL | preserve — Slice 6 |
| Saved-session library | O-SESSIONS | search; Import; list/count; empty state | Sessions view | Branding/layout parity | Persisted session bytes, active query, import errors | Branded library layout | V1 | T-LIVE | C-SHELL | approved — Slice 6 |
| Session row actions | O-SESSIONS | Open Live; Revalidate; Export; sequence; Delete | session rows | Preserve implementation | Saved/current context, real exports, named destructive action | Restyle rows and action grouping | V1 | T-LIVE | C-SHELL | preserve — Slice 6 |
| Session detail | O-SESSIONS | capture/source/event/validation evidence | session detail | Branding/layout parity | Immutable evidence, current-schema comparison, return path | Section/card and code treatment | V1 | T-LIVE | C-SHELL | approved — Slice 6 |
| Session deletion | O-SESSIONS | request/cancel/confirm; focus return | delete review | Preserve implementation | Exact session only; stable list focus | Shared danger review | V1 | T-LIVE, T-A11Y | C-SHELL | preserve — Slice 6 |
| Defect filters | O-DEFECTS | search; status/type/event/schema/path; count | Defects view | Branding/layout parity | Query semantics and current result count | Responsive filter toolbar | V1 | T-LIVE | C-SHELL | approved — Slice 6 |
| Defect rows | O-DEFECTS | stable defect selection, state/type/event/schema/path | defect list | Branding/layout parity | Stable identity and evidence summary | Status-accented cards/rows | V1 | T-LIVE | C-SHELL | approved — Slice 6 |
| Defect detail | O-DEFECTS | expected/actual; semantic diff; payload; timeline; reproduction; provenance | defect detail | Branding/layout parity | Saved evidence remains exact; Flow/schema provenance and actual-vs-expected stay distinct | Branded evidence sections with local code overflow | V1 | T-LIVE | C-SHELL | approved — Slice 6 |
| Defect actions | O-DEFECTS | resolve; copy; archive; delete; edit/status | defect actions | Preserve implementation | Clipboard/export/storage effects and destructive review | Restyle hierarchy only | V1 | T-LIVE | C-SHELL | preserve — Slice 6 |
| Unified validation report builder | O-DEFECTS, O-LIVE | issue selection; contributor evidence; actual/expected; save/cancel | validation report gallery | Preserve implementation | Ordinary validation/defect path; no parallel Flow-only result | Shared staged-builder styling | V2 | T-LIVE | C-FLOW, C-SHELL | preserve — Slice 6 |
| Missing-event report builder | O-DEFECTS, O-LIVE | event/after/Page/window/payload; save/cancel | missing-event dialog | Preserve implementation | Distinguish missing from invalid; stable context and exact payload | Shared staged-builder styling | V1 | T-LIVE | C-SHELL | preserve — Slice 6 |

## Schemas, rules, assignments, and hotkeys

| Surface or workflow | Production owner | Production controls | Mock destination | Classification | Preserve contract | Proposed migration | Risk tier | Verification | Master collision risk | Decision and status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Schema subnavigation | O-CANON | Schemas; Rule Library; Assignments tabs | Schemas subtabs | Branding/layout parity | All installed destinations, selected state and stable hooks | Branded secondary tabs | V1 | T-CANON, T-A11Y | C-SHELL, C-CANON | approved — Slice 6 |
| Schema library toolbar | O-CANON | documentation; search; import/export; recheck | schema toolbar | Branding/layout parity | Global Saved Schema Library works without active project | Responsive toolbar | V1 | T-CANON | C-SHELL | approved — Slice 6 |
| Schema rows & evidence | O-CANON | grouped Saved/Profile/Page Group/Page/Event/Flow instance/occurrence list; validation evidence | schema rows | Preserve implementation | One compact editor, stable contributor identity, no embedded Studio editor | Style grouped production list; ignore mock omissions | V1 | T-CANON | C-CANON | preserve — Slice 6 |
| Schema identity & inheritance | O-CANON, O-COMPOSED | name/target/description/parents/provenance/declared-only | mock schema identity | Preserve implementation | Native sparse inheritance, contributor roles, canonical Draft tokens | Branded metadata and provenance tags | V1 | T-CANON | C-CANON | preserve — Slices 5–6 |
| Property navigation | O-CANON | filter/sort/tree; Add property; stable property rows | property navigation | Branding/layout parity | Search caret/IME stays in same connected control; no write/Undo | Responsive tree/table navigation | V1 | T-CANON | C-CANON | approved — Slice 5 |
| Property definition | O-CANON | focused Definition fields; type/presence/allowed values/docs/example | property definition | Structural improvement | One staged property command and Undo; valid typed values; stable focus | Consolidate presentation under current Definition child layer | V2 | T-CANON | C-CANON | approved — Slice 5 |
| Focused property facets | O-CANON | property menu and one mounted Definition/Rules/Structure section | focused property editors | Preserve implementation | No competing Presence/Values/Conditions first layer; Cancel/Escape discards stage | Style existing layered overlay; do not restore stale mock tabs | V2 | T-CANON | C-CANON | preserve — Slice 5 |
| Rules & conditions | O-CONDITION | stable rule rows; Then; optional When; shared nested condition tree | mock Rules and conditional disclosure | Structural improvement | Rule defaults Always; required Then; Add condition/group; typed All/Any/Not; stable IDs; one Undo | Unify clearer row hierarchy around authoritative shared renderer | V2 | T-CANON | C-CANON | approved — Slice 5 |
| Structure operations | O-CANON | children/cardinality/order/type/duplicate/remove | Structure editor | Branding/layout parity | Tree-derived paths, stable identities, impact review and Undo | Style rows and controls; preserve renderer | V1 | T-CANON | C-CANON | approved — Slice 5 |
| Ownership & provenance | O-CANON, O-COMPOSED | View/Edit/Remove local/Reset/Open source/Replace/conflict actions | ownership and provenance | Preserve implementation | Action legality by ownership; inherited bytes immutable; sparse reset | Status/provenance treatment only | V1 | T-CANON | C-CANON | preserve — Slice 5 |
| Schema supporting panels | O-CANON | validation examples; assignments; generated document; revision history | supporting accordions | Preserve implementation | Existing routes and evidence, no mock fake output | Apply consistent disclosures and code surfaces | V1 | T-CANON | C-CANON | preserve — Slice 6 |
| Schema draft lifecycle | O-CANON, O-DURABLE | save/publish/revision/Undo/Redo/close/discard | draft lifecycle | Preserve implementation | Opaque Draft token; page-memory Undo/Redo; only intentional Publish advances revision | Style state/action hierarchy only | V2 | T-CANON, T-PROJECTS | C-CANON, C-PERSIST | preserve — Slices 5–6 |
| Schema reviews | O-CANON | publish/restore/delete/import/close and conflict reviews | state gallery dialogs | Preserve implementation | Named impact, dependency repair, validation association and focus return | Shared review dialogs | V1 | T-CANON, T-A11Y | C-CANON | preserve — Slice 6 |
| Reusable Rule Library | O-CANON | search/create/export/list/source/version | Rule Library | Branding/layout parity | Human names, immutable pinned snapshots, no raw-ID selection | Branded library/list | V1 | T-CANON | C-CANON | approved — Slice 6 |
| Reusable rule editor | O-CANON, O-CONDITION | kind-first fields; Then/When; severity/message; save | reusable editor | Preserve implementation | Only applicable fields mount; invalid save has no command/write/Undo | Style production editor; omit mock generic expected-value model | V2 | T-CANON | C-CANON | preserve — Slice 5 |
| Rule lifecycle reviews | O-CANON | pinned upgrade; replacement; delete impact | rule review dialogs | Preserve implementation | Stable rule/source identity and named dependent impact | Shared review styling | V1 | T-CANON, T-A11Y | C-CANON | preserve — Slice 6 |
| Assignment Library | O-CANON, O-LIFECYCLE | search/create/list/conflict/open/remove | Assignments | Branding/layout parity | Project-scoped stable target; no standalone schema copy | Branded overview/list | V1 | T-CANON, T-STUDIO | C-CANON, C-STUDIO | approved — Slice 6 |
| Assignment editor | O-CANON, O-CONDITION | name; contributor kind/target; Event; applicability/condition; source/target/priority | mock Inspector assignment form | Preserve implementation | Top-level lifecycle owns Add; Inspector has no exclusive generic Add; live effective target | Style production route; do not copy mock Inspector ownership | V2 | T-CANON, T-STUDIO | C-CANON, C-STUDIO | preserve — Slices 5–6 |
| Canonical migration & removal impact | O-CANON, O-DURABLE | migration choices; property/entity dependency repair; confirm/cancel | migration and impact dialogs | Preserve implementation | Atomic migration; source bytes; stable identity; blocked dependencies; focus return | Shared impact/migration review styling | V2 | T-CANON, T-PROJECTS | C-CANON, C-PERSIST | preserve — Slice 6 |
| Hotkey search | O-HOTKEYS | command filter and result count | Hotkeys search | Brush-on styling | Search/catalog semantics and connected focus | Token/field styling | V0 | T-SHELL, T-A11Y | C-SHELL | implemented and verified — Slice 2 |
| Binding editor | O-HOTKEYS | display/capture/reset/clear/conflict | Hotkeys editor | Branding/layout parity | Key capture, conflict resolution, command identity, keyboard access | Branded binding rows | V1 | T-SHELL, T-A11Y | C-SHELL | implemented and verified — Slice 2 |
| Keymap files | O-HOTKEYS | Create/Update/Load; hidden file input; result | Hotkeys keymap | Preserve implementation | Real file effects, validation, persisted keymap namespace | Restyle existing actions; no mock fake file operation | V1 | T-SHELL | C-SHELL | preserved and verified — Slice 2 |
| Command catalogue parity | O-HOTKEYS, O-SHELL | same command identities in palette and Hotkeys | control-map command parity | Preserve implementation | No missing/renamed command and same executable action | Visual parity only | V1 | T-SHELL | C-SHELL | preserved and verified — Slice 2 |

## Specification Studio shell and entity lifecycle

| Surface or workflow | Production owner | Production controls | Mock destination | Classification | Preserve contract | Proposed migration | Risk tier | Verification | Master collision risk | Decision and status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Project starting paths | O-STUDIO | template/import/JSON/schema/spreadsheet/adopt start paths | Studio start screen | Preserve implementation | Installed start behavior remains, but Projects is authoritative project entry | Style current no-project recovery without expanding stale semantics | V1 | T-STUDIO | C-STUDIO | preserved and verified — Slice 4 |
| Blank project form | O-STUDIO | `#create-project-form`; name/description/site/Create | Studio start screen | Preserve implementation | Real project create and validation; no hardcoded project | Style only; keep as recovery path | V1 | T-STUDIO | C-STUDIO | preserved and verified — Slice 4 |
| Project status bar | O-STUDIO, O-DURABLE | `#project-context`, `#project-state`, `#retry-save`; Saved/Published/failure | Studio project bar | Branding/layout parity | Stable project identity, Draft token state, truthful save failure | Branded masthead/project bar | V1 | T-STUDIO, T-PROJECTS | C-STUDIO, C-PERSIST | implemented and verified — Slice 4 |
| Project tree | O-STUDIO, O-LIFECYCLE, O-PROJECT-DOC | Documentation; Project overview; eight collections; installed Releases recovery | Studio collection rail | Branding/layout parity | Documentation remains first, then stable collection routes/counts; project isolation; no Schemas collection | Branded tree/rail; retain Documentation-first order and installed release route without expanding it | V1 | T-STUDIO, T-EXPORT | C-STUDIO | implemented and verified — Slice 4 |
| Breadcrumb & global search | O-STUDIO | `#project-breadcrumb`, `#project-search` | Studio tools | Branding/layout parity | Route identity, search state and focus | Branded sticky tools and wrap-safe breadcrumbs | V1 | T-STUDIO, T-A11Y | C-STUDIO | implemented and verified — Slice 4 |
| Inspector layout | O-STUDIO | toggle with `aria-controls/expanded`; contextual `#project-inspector` | mock responsive inspector | Branding/layout parity | User choice, valid focus destination, no exclusive Add/Open/Remove/Flow command | Three-pane push/collapsed/in-flow narrow layout | V1 | T-STUDIO, T-A11Y | C-STUDIO | implemented and verified — Slice 4 |
| Validate toolbar | O-STUDIO, O-ASSURANCE | Run preflight; Coverage matrix | mock Validate menu | Preserve implementation | Installed behavior remains; archived scope is not reactivated | Style existing controls; do not create new assurance semantics | V1 | T-STUDIO | C-STUDIO | preserved and verified — Slice 4 |
| Release toolbar | O-STUDIO, O-DURABLE | Publish release / intentional revision | mock Release menu | Preserve implementation | Only intentional Publish advances immutable revision; blockers truthful | Emphasize current publish boundary without mock release claims | V2 | T-STUDIO, T-PROJECTS | C-STUDIO, C-PERSIST | preserved and verified — Slice 4 |
| More actions | O-STUDIO | Undo/Redo; full export; JSON schema; import | mock More menu | Branding/layout parity | Every current installed action/effect, enabled reason, page-memory Undo/Redo; no obsolete Generate documentation action | Branded disclosure/action menu; Documentation is a top-level project route | V1 | T-STUDIO, T-A11Y | C-STUDIO | implemented and verified — Slice 4 |
| Project Documentation route | O-STUDIO, O-PROJECT-DOC, O-DURABLE | first tree button `data-kind=documentation`; `?view=documentation`; Set/Content/Configure/Theme/Preview/Export | mock Studio documentation surfaces | Preserve implementation | `aria-current`, breadcrumb/Inspector context, entity-route exit, active-project reset, repair deep links; opening is read-only | Brand as a first-class Studio workspace without restoring the removed dialog or Flow-owned form | V2 | T-EXPORT, T-STUDIO, T-A11Y | C-STUDIO, C-PERSIST | preserved and verified for the Slice 4 shell; Slice 6 content polish pending |
| Collection overviews | O-LIFECYCLE, O-STUDIO | Add; search; Open `<name>`; Remove `<name>`; empty state for eight kinds | Studio collection routes | Branding/layout parity | Type-specific route, named actions, Inspector-independent access, stable focus | Shared overview/card/list patterns | V1 | T-STUDIO, T-A11Y | C-STUDIO | implemented and verified — Slice 4 |
| Entity creation | O-LIFECYCLE, O-STUDIO | guided type-specific Create/Cancel main-workspace route | mock Add routes | Branding/layout parity | Project-scoped ID, validation, saved Draft, focus and back route | Shared guided creation layout | V1 | T-STUDIO | C-STUDIO | implemented and verified — Slice 4 |
| Shared Profile fields | O-LIFECYCLE, O-CANON | name; canonical contribution; source lineage | Shared Profile route | Preserve implementation | Contributor role, canonical model, no second schema type/editor | Brand current workspace; do not use mock duplicate editor | V2 | T-STUDIO, T-CANON | C-STUDIO, C-CANON | preserve — Slices 4–5 |
| Page fields | O-LIFECYCLE, O-COMPOSED | name; observed context event; memberships; effective schema | Page routes | Preserve implementation | Page is context-setting event; no Events-catalog binding/role; sparse contribution | Style real Page editor and effective-schema workspace | V2 | T-STUDIO, T-CANON | C-STUDIO, C-CANON | preserve — Slices 4–5 |
| Page Group fields | O-LIFECYCLE, O-COMPOSED | name; derived members; contribution; effective schema | Page Group routes | Preserve implementation | Ordered membership semantics, derived members, sparse contribution | Style real workspace/table | V2 | T-STUDIO, T-CANON | C-STUDIO, C-CANON | preserve — Slices 4–5 |
| Event fields | O-LIFECYCLE, O-CANON | name; interaction observed event; source/target/trigger | Event routes | Preserve implementation | Catalog Events are interactions; no documentary role or Page-context binding | Omit mock role selector; style fixed production semantics | V2 | T-STUDIO, T-CANON | C-STUDIO | preserved and verified — Slice 4 |
| Applicability editor | O-LIFECYCLE, O-CONDITION | name; priority/fallback; nested production predicate model | mock applicability form | Structural improvement | Shared typed All/Any/Not tree, stable IDs, persistence and focus | Replace remaining flat Studio presentation with shared renderer, not mock rows | V2 | T-CANON, T-STUDIO | C-STUDIO, C-CANON | approved — Slice 5 |
| Fixture fields | O-LIFECYCLE, O-ASSURANCE | entity identity, event/page/flow refs, expected evidence | Fixture routes | Preserve implementation | Active scope covers lifecycle only; installed execution is not expanded | Style installed fields and states without adding mock execution semantics | V1 | T-STUDIO | C-STUDIO | preserve — Slice 6 |
| Assignment fields | O-LIFECYCLE, O-CONDITION | contributor kind/ID; Event; applicability; source/target/priority | Assignment routes | Preserve implementation | Live effective target, no compiled/schema copy, top-level lifecycle | Style main workspace; shared condition presentation where mounted | V2 | T-CANON, T-STUDIO | C-STUDIO, C-CANON | preserve — Slices 5–6 |
| Entity removal review | O-LIFECYCLE | named dependency list/repair; Cancel/Remove; Undo | removal review | Preserve implementation | No cascade; blocked dependencies; next/previous/Add focus; stable-ID Undo | Shared impact-review styling | V2 | T-STUDIO, T-A11Y | C-STUDIO | preserved and verified — Slice 4 |
| Saved-schema adoption | O-STUDIO, O-CANON, O-DURABLE | source picker; review; commit/cancel; lineage | adoption review | Preserve implementation | Global source byte-identical; project-owned Draft; canonical facet mapping | Style staged adoption review | V2 | T-STUDIO, T-CANON | C-STUDIO, C-PERSIST | preserve — Slice 6 |
| Bulk property authoring | O-STUDIO, O-CANON | bulk input; stage; review/commit; result | mock Inspector bulk editor | Preserve implementation | One atomic command and one page-scoped Undo; no exclusive Inspector ownership | Style installed advanced function only | V2 | T-CANON, T-STUDIO | C-STUDIO, C-CANON | preserve — Slice 6 |
| Page Group membership | O-COMPOSED, O-STUDIO | searchable add; accessible reorder/remove; impact; focus | membership stack | Preserve implementation | Ordered general-to-specific list; lane placement separate; blocks in-use removal | Style current editor and provenance | V2 | T-CANON, T-STUDIO | C-STUDIO, C-CANON | preserve — Slice 5 |

## Canonical, composed, Flow, and export workspaces

| Surface or workflow | Production owner | Production controls | Mock destination | Classification | Preserve contract | Proposed migration | Risk tier | Verification | Master collision risk | Decision and status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Canonical draft header | O-CANON, O-DURABLE | contributor/source/Draft token/provenance; Undo/Redo | canonical header | Branding/layout parity | Opaque token not operator revision; stable identity; page-memory history | Branded context/status bar | V1 | T-CANON | C-CANON | approved — Slice 5 |
| Property table/tree | O-CANON, O-COMPOSED | all properties; inline Description/Allowed values/Example; local overflow; tree | property table/tree | Branding/layout parity | Same canonical model; all effective rows; datasets/labels and editable-cell DOM order; one vertical owner at 360px | Responsive table/compact-row presentation that does not replace or reorder direct-edit cells | V2 | T-CANON | C-CANON | approved — Slice 5 |
| Quick Table cell transactions | O-CANON, O-COMPOSED | Enter; Tab; Shift+Tab; blur; Escape; inline diagnostic | no mock authority | Preserve implementation | One property command/Undo only on changed valid commit; unchanged no-op; invalid refocus; no duplicate blur; sparse inherited override; parent propagation; focus survives rerender | Style visible editable cells and diagnostics only; preserve `data-inline-schema-facet/path`, scope, and traversal order | V2 | T-CANON, T-A11Y | C-CANON | preserve — Slice 5 |
| Property actions menu | O-CANON | Definition/Rules/Structure; source/override/reset/remove | property menu | Preserve implementation | One focused menu, ownership legality, exact origin focus | Restyle current menu/layers; omit stale extra first-level tabs | V2 | T-CANON | C-CANON | preserve — Slice 5 |
| Definition editing | O-CANON | type; presence; comma-separated Allowed values; docs; example method/value | Definition layer | Structural improvement | Blank/Allowed value/Custom mount rules; typed validation; one command/Undo | Clearer progressive disclosure inside authoritative Definition layer | V2 | T-CANON | C-CANON | approved — Slice 5 |
| Rule inventory | O-CANON, O-CONDITION | stable rows; When/Then/severity/message/source/ownership; named actions | Rules layer | Structural improvement | Stable identity and legal View/Edit/Remove/Replace/Open source actions | Apply compact hierarchy and summaries without flattening | V2 | T-CANON | C-CANON | approved — Slice 5 |
| Add/edit rule | O-CONDITION | kind-first; required Then; optional Add When; review/save/cancel | mock rule builder | Structural improvement | Always default; invalid no-op; nested typed tree; focus restoration | Shared production builder with clearer row/layer presentation | V2 | T-CANON | C-CANON | approved — Slice 5 |
| Allowed values | O-CANON | zero/one/many typed comma-separated values | mock Allowed values | Structural improvement | No expected-vs-allowed distinction; legacy exact projects as one without mutation | Align all mounts with current Definition presentation | V2 | T-CANON | C-CANON | approved — Slice 5 |
| Structure editor | O-CANON | container/item/cardinality/unique/undeclared child/reorder | Structure layer | Branding/layout parity | Stable tree identity, valid structural commands and Undo | Branded structured rows | V1 | T-CANON | C-CANON | approved — Slice 5 |
| Composed contributor rows | O-COMPOSED | inherited/local/effective/shadowed/conflict/provenance; override/reset | composed workspace | Preserve implementation | Sparse facet ownership, live parent updates, conflict blocking | Style status/provenance and row hierarchy; keep production model | V2 | T-CANON | C-CANON | preserve — Slice 5 |
| Effective documentation | O-COMPOSED | developer export/readiness/diagnostics for selected context | effective documentation | Preserve implementation | Blocked/incomplete truth; no assignment/validation controls moved here | Style existing output and diagnostics | V1 | T-CANON | C-CANON | preserve — Slice 6 |
| Migration & impact | O-CANON, O-COMPOSED | conflicts; source choice; dependency repairs; reset/remove | migration/impact dialogs | Preserve implementation | Atomic canonical migration, stable references, exact repair/focus | Shared impact review | V2 | T-CANON | C-CANON | preserve — Slice 6 |
| Flow identity fields | O-FLOW, O-STUDIO | Flow name/context and project route | Flow workspace | Brush-on styling | Stable Flow ID and project-owned route | Context/status treatment only | V0 | T-FLOW | C-FLOW, C-STUDIO | approved — Slice 6 |
| Component catalogues | O-FLOW | searchable Page Groups, Pages, interaction Events | Flow catalogues | Branding/layout parity | Main-workspace access with Inspector closed; keyboard insertion | Branded catalogue cards/search | V1 | T-FLOW, T-A11Y | C-FLOW | approved — Slice 6 |
| Lane & Page-frame controls | O-FLOW | ordered Page Group lanes; insert/move/free edge; duplicate/remove; schema contribution | Flow canvas/outline | Preserve implementation | No fallback lanes; placement separate from membership; repeated Page creates distinct instance | Style canvas bands/cards; no mock fixed lanes | V2 | T-FLOW | C-FLOW | preserve — Slice 6 |
| Occurrence controls | O-FLOW | interaction Event insert/reassign/move/detail/remove | Flow Event nodes | Preserve implementation | Containment, stable occurrence identity, Page reassignment preview and schema preservation | Style existing nodes/popovers | V2 | T-FLOW | C-FLOW | preserve — Slice 6 |
| Connections | O-FLOW | pointer/keyboard Page-frame port drawing | Flow ports | Preserve implementation | Only Page ports; right-left expected_next, top-bottom alternative, bottom-top merge; invalid no-op | Visual port/edge treatment only | V2 | T-FLOW, T-A11Y | C-FLOW | preserve — Slice 6 |
| Relationship editor | O-FLOW | optional label/condition/expectation; Delete and Undo | mock relationship form | Preserve implementation | Kind inferred from ports; no Parallel/operator kind selector; delete exact identity; focus return | Style production popover; omit mock kind/reverse controls | V2 | T-FLOW | C-FLOW | preserve — Slice 6 |
| Derived examples | O-FLOW, O-COMPOSED | Page/Event read-only JSON; Complete/Incomplete/Invalid/Blocked; repair links | Flow examples | Preserve implementation | Derived from effective schemas; never stored payload copy; exact deep links | Branded code/status panels | V1 | T-FLOW, T-CANON | C-FLOW, C-CANON | preserve — Slice 6 |
| Advanced executable steps | O-STUDIO | explicitly separate advanced disclosure | mock Advanced steps | Preserve implementation | Must not duplicate/replace documentary graph; current installed behavior only | Style disclosure with clear advanced boundary | V1 | T-STUDIO | C-STUDIO | preserve — Slice 6 |
| Documentation Set, Content, and Configure | O-PROJECT-DOC, O-DURABLE | named Set/theme creation; Set selector; reorderable outline; Flow/Profile search; Overview/Flow/matrix/Profile selection; relevant-only configuration | mock documentation workspace | Preserve implementation | Draft-owned stable section identities/order/config/theme reference; exactly one matrix; independent Flow/matrix/Profile choices; hidden order retained; no eager all-section form | Style progressive regions and ordered controls without moving ownership back to Flow pages | V2 | T-EXPORT, T-STUDIO | C-STUDIO, C-PERSIST | preserve — Slice 6 |
| Project Documentation theme and preview | O-PROJECT-DOC | project-local structured theme; Brand/Typography/Table/Header-footer details; Save/Preview/Copy/Paste; sample; Refresh preview | mock theme/preview | Preserve implementation | Sanitized local data-image logo only; no executable CSS; supported fingerprint shared by preview/XLSX/rich copy; TWAtility product theme must not alter client output semantics | Contain client-themed preview inside branded Studio chrome; preserve progressive details and stale alert | V2 | T-EXPORT, T-A11Y | C-STUDIO, C-PERSIST | preserve — Slice 6 |
| Project Documentation export and preflight | O-PROJECT-DOC, O-FLOW-EXPORT | current/selected/complete scope; per-section selection; Confirm incomplete; Copy rich documentation; Download Excel; repair links | gallery documentation export | Preserve implementation | Rich HTML plus plain fallback and `.xlsx` only; stale/blocked disables; concise Draft-incomplete truth; formula/HTML/sheet-name safety; generation read-only | Shared export/status/preflight styling; no TSV, plain spreadsheet, HTML-file, PDF, diagnostics, provenance, raw identities, or repair detail in shared output | V2 | T-EXPORT, T-PACKAGE, T-A11Y | C-STUDIO, C-PERSIST | preserve — Slice 6 |
| Fixture execution | O-ASSURANCE | installed fixture execution/results | mock fixture runner | Preserve implementation | Not active expansion scope; do not invent mock run results | Style current installed states only | V1 | T-STUDIO | C-STUDIO | preserve — Slice 6 |

## Assurance, import/export, conflict, and cross-window surfaces

| Surface or workflow | Production owner | Production controls | Mock destination | Classification | Preserve contract | Proposed migration | Risk tier | Verification | Master collision risk | Decision and status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Preflight | O-ASSURANCE | Run preflight; ready/blocked; repair links | ready/blocked gallery | Preserve implementation | Installed behavior only; archived program not reactivated | Style truthful result and links | V1 | T-STUDIO | C-STUDIO | preserve — Slice 6 |
| Coverage matrix | O-ASSURANCE | coverage view/cells/deep links | coverage gallery | Preserve implementation | Installed behavior only; local table overflow; exact repairs | Branded table/status presentation | V1 | T-STUDIO | C-STUDIO | preserve — Slice 6 |
| Release review | O-ASSURANCE, O-DURABLE | diff/blockers; Publish/Publish and close/Restore/Cancel | release review gallery | Preserve implementation | Only intentional Publish advances revision; real evidence and focus return | Shared publication-review styling | V2 | T-STUDIO, T-PROJECTS | C-STUDIO, C-PERSIST | preserve — Slice 6 |
| Release collection | O-ASSURANCE | installed release history/restore | mock Releases collection | Preserve implementation | Do not delete installed capability; do not expand archived release program | Style current list only | V1 | T-STUDIO | C-STUDIO | preserve — Slice 6 |
| Superseded project documentation dialog | O-STUDIO, O-PROJECT-DOC | removed `#generate-documentation` and `#documentation-export` controls | mock documentation dialog | Intentional omission | Current master replaced the eager dialog with the top-level persistent Documentation workspace | Do not restore obsolete provenance/where-used/applicability/Flow/fixture/release checkboxes or Copy table action | V1 | T-EXPORT, T-STUDIO | C-STUDIO | superseded by master — Slice 6 |
| Project export | O-DURABLE, O-STUDIO | full-fidelity export; standard JSON schema + manifest | mock More/export | Preserve implementation | Complete Draft graph; exclude permissions, Live, cache, UI, Undo; real download | Branded export actions/results | V2 | T-PROJECTS, T-PACKAGE | C-PERSIST, C-STUDIO | preserve — Slice 6 |
| Staged Studio import | O-DURABLE, O-STUDIO | file; collision; remap; Commit/Cancel | Studio import dialog | Preserve implementation | Atomic import/remap, current project unchanged until commit | Shared staged-import styling | V2 | T-PROJECTS, T-STUDIO | C-PERSIST, C-STUDIO | preserve — Slice 6 |
| Concurrent conflict review | O-DURABLE, O-STUDIO | Reload; Reapply; Merge selected; newer/pending comparison | conflict dialog | Preserve implementation | Opaque token conflict, selected-field legality, no newer overwrite, deterministic focus | Shared conflict-review styling | V2 | T-PROJECTS, T-STUDIO | C-PERSIST, C-STUDIO | preserve — Slice 6 |
| Studio storage recovery | O-DURABLE, O-STUDIO | Retry; unsaved Draft; repository backup; diagnostics; Close | Studio recovery dialog | Preserve implementation | Exact failed command retained; last durable bytes; switch/publish block; result focus | Shared recovery panel/dialog | V2 | T-PROJECTS, T-A11Y | C-PERSIST, C-STUDIO | preserve — Slice 6 |
| Cross-window active context | O-DURABLE, O-PROJECTS, O-STUDIO | subscription; switch review; per-project route restore | control-map / context reviews | Preserve implementation | One active identity, pending writes first, no cross-project lookup, stable route/focus | Brand status/review only | V3 | T-PROJECTS, T-STUDIO | C-PERSIST, C-STUDIO, C-SHELL | preserve — Slices 3–6 |

## Rare, blocked, empty, and recovery states

These rows cover every state-gallery family and the production-only states the
mock cannot prove.

| Surface or workflow | Production owner | Production controls | Mock destination | Classification | Preserve contract | Proposed migration | Risk tier | Verification | Master collision risk | Decision and status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Durable storage loading | O-DURABLE | `aria-busy`; skeleton/progress; controls unavailable truthfully | Opening durable storage | Brush-on styling | Mount read-only, no implied ready state | Branded loading/skeleton tokens with reduced motion | V0 | T-PROJECTS, T-A11Y | C-LOW | implemented and verified — Slice 3 |
| Empty Live feed | O-LIVE | no events; Choose target/help recovery | No captured events yet | Branding/layout parity | Visible route to capture/repair; no fake count | Shared guided empty state | V1 | T-LIVE | C-SHELL | approved — Slice 6 |
| Unsaved-command block | O-DURABLE | Switch/Publish disabled; reason; recovery | Actions blocked by unsaved command | Preserve implementation | Exact command retained; actions blocked until recovery | Shared blocked notice and reason association | V1 | T-PROJECTS, T-A11Y | C-PERSIST | preserve — Slices 3, 6 |
| Target ready/permission/path variants | O-LIVE | connected; permission denied; queue/path absent; ready | target access gallery | Preserve implementation | Chrome permission/path truth and direct recovery | Consistent status/notice cards | V1 | T-LIVE | C-SHELL | preserve — Slice 6 |
| Capture paused/current/saved variants | O-LIVE, O-SESSIONS | paused count; current capture; historical comparison | Live errors/gallery | Preserve implementation | Session bytes/state and correct available lifecycle actions | State-colored mast/cards | V1 | T-LIVE | C-SHELL | preserve — Slice 6 |
| Save/restart/end reviews | O-LIVE, O-SESSIONS | three dialogs and all confirm/cancel paths | session review gallery | Preserve implementation | Destructive distinctions and exact focus return | Shared review-dialog family | V1 | T-LIVE, T-A11Y | C-SHELL | preserve — Slice 6 |
| Project switch/import variants | O-PROJECTS, O-DURABLE | impact, staged file, invalid/blocked, confirm/cancel | project storage gallery | Preserve implementation | Atomicity, inactive import, current state unchanged on cancel/failure | Shared review family | V2 | T-PROJECTS | C-PERSIST | preserved and verified — Slice 3 |
| Equal-generation divergence | O-DURABLE | both source summaries/exports; explicit radio choice | legacy migration gallery | Preserve implementation | No automatic winner; verified read-back and backup | Shared migration review | V2 | T-PROJECTS | C-PERSIST | preserved and verified — Slice 3 |
| Failed Draft command | O-DURABLE | Retry/Reject/export/diagnostics; block switch/publish | exact command retained | Preserve implementation | Exact command and last saved Draft remain distinct | Shared recovery surface | V2 | T-PROJECTS | C-PERSIST | preserved and verified — Slice 3 |
| Repository failure classes | O-DURABLE | quota/abort/unavailable/corrupt/verification messages and recovery | partial mock recovery | Preserve implementation | Truthful cause, no silent fallback or Web Storage authority | Consistent status plus exact recovery actions | V2 | T-PROJECTS | C-PERSIST | preserve — Slices 3, 6 |
| Validation issue detail | O-LIVE, O-DEFECTS | issue/contributor selection; actual/expected; repair/report | validation detail gallery | Preserve implementation | Stable issue identity and provenance; ordinary validation route | Branded evidence/review cards | V1 | T-LIVE | C-SHELL | preserve — Slice 6 |
| Missing event | O-DEFECTS | expected event/context/window/payload; report | expected missing event gallery | Preserve implementation | Missing distinct from invalid; no invented observation | Branded report builder | V1 | T-LIVE | C-SHELL | preserve — Slice 6 |
| Completed defect | O-DEFECTS | copy/download/library/status actions | completed defect gallery | Preserve implementation | Immutable evidence/provenance, real side effects | Branded result and actions | V1 | T-LIVE | C-SHELL | preserve — Slice 6 |
| Schema publication | O-CANON, O-DURABLE | diff/impact/revalidate; Publish/Cancel | publication review | Preserve implementation | Intentional revision only; blockers truthful; focus return | Shared publication review | V2 | T-CANON | C-CANON, C-PERSIST | preserve — Slice 6 |
| Pinned rule upgrade/delete | O-CANON | dependent snapshots; continue/keep/delete/cancel | rule lifecycle gallery | Preserve implementation | Pinned bytes and named impact | Shared review styling | V1 | T-CANON | C-CANON | preserve — Slice 6 |
| Canonical migration conflict | O-CANON | conflicting sources; resolution/note; confirm/cancel | canonical migration gallery | Preserve implementation | Atomic migration, source fidelity, no silent winner | Shared migration review | V2 | T-CANON | C-CANON | preserve — Slice 6 |
| Property removal impact | O-CANON, O-COMPOSED | consumer list/repair; keep/remove/reset | property impact gallery | Preserve implementation | Local-only legality, parent/source immutability, exact Undo | Shared dependency review | V2 | T-CANON | C-CANON | preserve — Slice 6 |
| Schema deletion/import | O-CANON | dependency block; append/replace; cancel | schema delete/import gallery | Preserve implementation | Stable identity, source bytes, atomic strategy and focus return | Shared review styling | V2 | T-CANON | C-CANON | preserve — Slice 6 |
| Stale Flow export | O-FLOW-EXPORT | Refresh disabled/enabled; stale explanation | incomplete mock coverage | Preserve implementation | No export until refreshed; no state mutation | Shared stale notice and refresh action | V2 | T-EXPORT | C-FLOW | preserve — Slice 6 |
| Incomplete Flow export | O-FLOW-EXPORT | diagnostics; explicit confirmation; Draft label | partial gallery export | Preserve implementation | Blocked/incomplete cells retained; no false completeness | Shared confirmation/review | V2 | T-EXPORT | C-FLOW | preserve — Slice 6 |
| Preflight ready/blocked and coverage gap | O-ASSURANCE | ready/blocked repairs; covered/gap cells | assurance gallery | Preserve implementation | Installed semantics only; no mock fixed result | Style existing states | V1 | T-STUDIO | C-STUDIO | preserve — Slice 6 |
| Studio import collision | O-DURABLE, O-STUDIO | remap; commit disabled; cancel | staged import gallery | Preserve implementation | Complete staged graph, current project unchanged | Shared import review | V2 | T-PROJECTS, T-STUDIO | C-PERSIST | preserve — Slice 6 |
| Studio stale-write conflict | O-DURABLE, O-STUDIO | newer/pending comparison; Reload/Reapply/Merge | concurrent edit gallery | Preserve implementation | Opaque token and record-scoped merge, no newer overwrite | Shared conflict review | V2 | T-PROJECTS | C-PERSIST | preserve — Slice 6 |
| Studio save failure | O-DURABLE, O-STUDIO | retry/export/backup/diagnostics; block switch/publish | Studio save not committed | Preserve implementation | Last Saved Draft unchanged; exact unsaved command | Shared recovery dialog | V2 | T-PROJECTS, T-A11Y | C-PERSIST | preserve — Slice 6 |
| Empty collections and no active project | O-PROJECTS, O-LIFECYCLE | Open/Create project; guided Add per collection | incomplete mock coverage | Branding/layout parity | Same real route/action; no active inference; stable focus | Shared guided empty-state pattern | V1 | T-PROJECTS, T-STUDIO | C-SHELL, C-STUDIO | approved — Slices 3–4 |
| Canonical search IME/caret | O-CANON | same connected search input through typing/composition/clear | not represented in mock | Preserve implementation | No canonical command, persistence write, token or Undo | Styling must not remount or steal focus | V2 | T-CANON, T-A11Y | C-CANON | preserve — Slice 5 |
| Nested overlay edge geometry | O-CONDITION | complete active layer at 360px; minimal nearest scroll; layer focus return | not represented in mock | Structural improvement | Every control remains in viewport; Escape closes one layer | Apply viewport-safe shared overlay presentation | V2 | T-CANON, T-A11Y | C-CANON | approved — Slice 5 |

## Explicit mock-only exclusions

| Surface or workflow | Production owner | Production controls | Mock destination | Classification | Preserve contract | Proposed migration | Risk tier | Verification | Master collision risk | Decision and status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Hardcoded Retail & Trade records/counts | Real production state owners above | Real project/session/event/schema/defect data only | all mock pages | Mock-only / do not port | Render actual production state | Keep copy tone and layout only; no seeded production content | V0 | Data-source assertions in all relevant tests | C-LOW | omit |
| `mock.js` tabs/routes/forms/toasts | Real renderers and effects above | Production event handlers/Chrome/storage/files/clipboard | `ui-mock/assets/mock.js` | Mock-only / do not port | Every real action and state transition | Port no mock JavaScript | V0 | Static import/search plus functional gates | C-LOW | omit |
| Fictional project logos | O-PROJECTS, O-STUDIO | Human project identity only | any illustrative brand slot | Mock-only / do not port | No invented project brand/meaning | Use typography/status, never generated project marks | V0 | Visual review | C-LOW | omit |
| Archived assurance expansion | O-ASSURANCE | Installed controls only | preflight/coverage/release mock journeys | Mock-only / do not port | Do not delete installed production; do not reactivate archived scope | Styling only for what exists | V1 | Route/control equivalence | C-STUDIO | omit new behavior |
| Event documentary role selector | O-LIFECYCLE | Page context event; Event interaction semantics | mock Event role/context-setting/back-office | Mock-only / do not port | Fixed current authority semantics | Remove no production control; never add mock role selector | V2 | Project lifecycle tests | C-STUDIO | omit |
| Operator-selected relationship kind/reverse | O-FLOW | Valid port-pair inference only | mock relationship kind/port/reverse form | Mock-only / do not port | Exact expected_next/alternative/merge inference | Style production popover only | V2 | T-FLOW | C-FLOW | omit |
| Flat/mock conditional rule model | O-CONDITION | Shared typed nested tree | generic expected value, Negate, flat rows | Mock-only / do not port | Current Always/Then/optional When tree | Use mock visual hierarchy only | V2 | T-CANON | C-CANON | omit |
| Stale example-method options | O-CANON | Blank/Allowed value/Custom with conditional editor | Generated/First allowed value/always-mounted input | Mock-only / do not port | Current typed mount semantics | Use current production controls | V2 | T-CANON | C-CANON | omit |
| Inspector-owned generic Add/Assignment | O-LIFECYCLE, O-STUDIO | Main-workspace type-specific lifecycle | mock generic Inspector forms | Mock-only / do not port | Add/Open/Remove remain available with Inspector closed | Inspector styling only | V1 | T-STUDIO | C-STUDIO | omit |
| Static pass/fail Flow wizard | O-LIVE, O-FLOW | Flow context in existing feed/detail; no execution claim | control-map-only manual Flow claim | Mock-only / do not port | Ordinary validation/defect route and chronology-independent linking | Brand the real production integration | V2 | T-LIVE, T-FLOW | C-FLOW | omit |

## Frozen mock dialog traceability

Every dialog in the frozen mock is mapped below. A matching name means
presentation evidence only; production IDs, ownership, state, side effects,
accessible relationships, focus, and recovery remain authoritative.

| Frozen reference dialog | Production destination | Primary classification | Matrix row / disposition |
| --- | --- | --- | --- |
| `side-panel.html#assignment-editor-dialog` | Project Assignment route/editor | Preserve implementation | Assignment editor; omit Inspector/generic ownership |
| `side-panel.html#clear-library-dialog` | Event Library destructive review | Preserve implementation | Library clear/delete review |
| `side-panel.html#command-palette` | `#palette` production dialog/listbox | Brush-on styling | Command palette |
| `side-panel.html#create-project-dialog` | Production project creation review | Branding/layout parity | Create project |
| `side-panel.html#delete-defect-dialog` | Production defect deletion review | Preserve implementation | Defect actions |
| `side-panel.html#delete-rule-dialog` | Production rule impact review | Preserve implementation | Rule lifecycle reviews |
| `side-panel.html#delete-schema-dialog` | Production schema dependency review | Preserve implementation | Schema reviews |
| `side-panel.html#delete-session-dialog` | Production session deletion review | Preserve implementation | Session deletion |
| `side-panel.html#edit-project-dialog` | Production metadata edit/Undo | Branding/layout parity | Edit project metadata |
| `side-panel.html#end-session-dialog` | Production end-testing review | Preserve implementation | Save/restart/end reviews |
| `side-panel.html#event-template-editor` | Production Event Library editor | Branding/layout parity | Template identity/properties/actions |
| `side-panel.html#import-library-dialog` | Production template import review | Preserve implementation | Library import review |
| `side-panel.html#import-project-dialog` | Production project staged import | Preserve implementation | Project import |
| `side-panel.html#import-schema-dialog` | Production schema import review | Preserve implementation | Schema deletion/import |
| `side-panel.html#import-session-dialog` | Production saved-session import | Preserve implementation | Saved-session library |
| `side-panel.html#load-keymap-dialog` | Production keymap file review | Preserve implementation | Keymap files |
| `side-panel.html#missing-event-dialog` | Production missing-event builder | Preserve implementation | Missing-event report builder |
| `side-panel.html#observation-target-dialog` | Production Chrome target picker | Branding/layout parity | Target picker |
| `side-panel.html#push-review-dialog` | Production selected-target push review | Preserve implementation | Template reviews |
| `side-panel.html#rule-editor-dialog` | Production shared focused rule editor | Structural improvement | Add/edit rule; revise at review gate |
| `side-panel.html#save-session-dialog` | Production snapshot review | Brush-on styling | Save snapshot review |
| `side-panel.html#schema-editor-dialog` | Production compact canonical editor | Preserve implementation | Schema rows/evidence and focused facets |
| `side-panel.html#template-actions-dialog` | Production template action review | Preserve implementation | Template actions/reviews |
| `state-gallery.html#canonical-migration-dialog` | Production atomic canonical migration | Preserve implementation | Canonical migration conflict |
| `state-gallery.html#conflict-dialog` | Production stale Draft conflict review | Preserve implementation | Studio stale-write conflict |
| `state-gallery.html#defect-report-dialog` | Production ordinary defect builder | Preserve implementation | Unified validation report builder |
| `state-gallery.html#delete-backup-dialog` | Production retained-backup deletion review | Preserve implementation | Migration-backup deletion |
| `state-gallery.html#detach-target-dialog` | Production target detach review | Preserve implementation | Observation settings |
| `state-gallery.html#documentation-export-dialog` | Superseded eager export dialog | Intentional omission | Use current project Documentation workspace/preflight; do not restore removed controls |
| `state-gallery.html#end-testing-dialog` | Production end-testing review | Preserve implementation | Save/restart/end reviews |
| `state-gallery.html#fresh-session-dialog` | Production fresh-session review | Brush-on styling | Fresh-session confirmation |
| `state-gallery.html#legacy-migration-dialog` | Production equal-generation migration review | Preserve implementation | Legacy migration review |
| `state-gallery.html#missing-event-dialog` | Production missing-event builder | Preserve implementation | Missing event |
| `state-gallery.html#project-import-dialog` | Production side-panel staged import | Preserve implementation | Project import |
| `state-gallery.html#property-impact-dialog` | Production canonical dependency review | Preserve implementation | Property removal impact |
| `state-gallery.html#release-review-dialog` | Installed publication review | Preserve implementation | Release review; no archived expansion |
| `state-gallery.html#rule-delete-dialog` | Production rule deletion impact | Preserve implementation | Pinned rule upgrade/delete |
| `state-gallery.html#rule-upgrade-dialog` | Production pinned-rule upgrade | Preserve implementation | Pinned rule upgrade/delete |
| `state-gallery.html#save-session-dialog` | Production snapshot review | Brush-on styling | Save snapshot review |
| `state-gallery.html#schema-delete-dialog` | Production schema dependency review | Preserve implementation | Schema deletion/import |
| `state-gallery.html#schema-import-dialog` | Production schema import strategy review | Preserve implementation | Schema deletion/import |
| `state-gallery.html#schema-publication-dialog` | Production intentional revision review | Preserve implementation | Schema publication |
| `state-gallery.html#storage-recovery-dialog` | Production durable recovery UI | Preserve implementation | Storage & recovery |
| `state-gallery.html#studio-import-dialog` | Production Studio staged import collision | Preserve implementation | Studio import collision |
| `state-gallery.html#studio-storage-recovery` | Production Studio failed-save recovery | Preserve implementation | Studio save failure |
| `state-gallery.html#switch-project-dialog` | Production atomic switch review | Preserve implementation | Switch review |
| `state-gallery.html#target-picker-dialog` | Production Chrome target picker | Branding/layout parity | Target picker |
| `state-gallery.html#validation-detail-dialog` | Production validation issue detail | Preserve implementation | Validation issue detail |
| `studio.html#documentation-export` | Superseded Flow-owned/dialog presentation | Intentional omission | Use current project-level Documentation route and selected-Flow value-map sections |
| `studio.html#import-review` | Production Studio import review | Preserve implementation | Staged Studio import |
| `studio.html#project-conflict-review` | Production durable conflict review | Preserve implementation | Concurrent conflict review |
| `studio.html#release-review` | Installed publication boundary | Preserve implementation | Release review |
| `studio.html#remove-property-review` | Production canonical impact review | Preserve implementation | Migration & impact |
| `studio.html#saved-schema-review` | Production byte-preserving adoption | Preserve implementation | Saved-schema adoption |
| `studio.html#storage-recovery` | Production durable recovery | Preserve implementation | Studio storage recovery |

## Master-boundary ledger

| Boundary | Observed UTC | Previous base | New base | Commit delta | Controls/states/routes/persistence/tests added or changed | Matrix action |
| --- | --- | --- | --- | --- | --- | --- |
| Slice 0 initial fetch | 2026-07-26T12:22Z | `e4d36277a4113d2999c26ac6ba8ae13c5c6b0242` | `e4d36277a4113d2999c26ac6ba8ae13c5c6b0242` | none | none | Initial full authority and parity inventory recorded |
| Slice 0 closing fetch | 2026-07-26T12:44:26Z | `e4d36277a4113d2999c26ac6ba8ae13c5c6b0242` | `e4d36277a4113d2999c26ac6ba8ae13c5c6b0242` | none | none | No reclassification or merge required before review gate |
| Slice 1 opening fetch | 2026-07-26T13:11:21Z | `e4d36277a4113d2999c26ac6ba8ae13c5c6b0242` | `e4d36277a4113d2999c26ac6ba8ae13c5c6b0242` | none | none | User-approved structural decisions recorded; no upstream reclassification or source merge required |
| Slice 1 closing fetch | 2026-07-26T13:36:40Z | `e4d36277a4113d2999c26ac6ba8ae13c5c6b0242` | `e4d36277a4113d2999c26ac6ba8ae13c5c6b0242` | none | none | No controls, states, routes, persistence contracts, active-scope requirements, or test owners changed upstream; no reclassification or merge required |
| Slice 2 opening fetch | 2026-07-26T13:48:16Z | `e4d36277a4113d2999c26ac6ba8ae13c5c6b0242` | `6be109256c058330f3f7c2badc65f4224d3f31a7` | 13 commits: Quick Table save and Project Documentation workspace lineages | New direct Table commit/focus behavior; first-in-tree Documentation route and progressive workspace; Draft/portable Set/theme records; stale/incomplete/preflight/export states; removed eager dialog; expanded `layered_schema` and `flow_export` ownership | Added/updated the exact Quick Table, Project tree/route, Documentation configuration/theme/preview/export, More, obsolete-dialog, owner, and verification rows before merge; merged as `1f83b0f6` and verified at the finite cutoff |
| Slice 2 closing fetch | 2026-07-26T15:46:17.9825140Z | `6be109256c058330f3f7c2badc65f4224d3f31a7` | `7edae41131a4e6a282d80f67a2fbcfbada52beb3` | 5 commits: Excel workbook compatibility and mutation assurance | No controls, routes, UI states, project persistence schema, commands, side effects, or Undo/Redo boundaries changed. The existing Excel export output contract now requires a standards-correct root OOXML relationship, exact scope-dependent sheets/order, complete package parts/relationships, independent reader compatibility without repair, read-only mutation assurance, and durable range/cardinality rule observation in `layered_schema`. `flow_export` owns the workbook changes; `layered_schema` owns the durable-wait repair. | Existing Project Documentation Excel export and verification rows tightened before merge; merged into the Slice 2 feature branch as `4d57dde6` and verified at the finite cutoff |
| Slice 3 opening fetch | 2026-07-26T16:10:06.3195664Z | `7edae41131a4e6a282d80f67a2fbcfbada52beb3` | `7edae41131a4e6a282d80f67a2fbcfbada52beb3` | none | No controls, states, routes, persistence contracts, active-scope authorities, test owners, build inputs, or package inputs changed upstream. | No merge or parity reclassification required; Slice 3 starts from approved integration commit `220b70a0` with the same finite master cutoff |
| Slice 3 closing fetch | 2026-07-26T16:32:09.5449594Z | `7edae41131a4e6a282d80f67a2fbcfbada52beb3` | `7edae41131a4e6a282d80f67a2fbcfbada52beb3` | none | No controls, states, routes, persistence contracts, active-scope authorities, test owners, build inputs, or package inputs changed upstream during Slice 3. | No merge, conflict resolution, or parity reclassification required before the finite Slice 3 terminal gate |
| Slice 4 opening fetch | 2026-07-26T16:50:01.9431127Z | `7edae41131a4e6a282d80f67a2fbcfbada52beb3` | `7edae41131a4e6a282d80f67a2fbcfbada52beb3` | none | No controls, states, routes, persistence contracts, active-scope authorities, test owners, build inputs, or package inputs changed upstream. | No merge or parity reclassification required; Slice 4 starts from approved integration commit `caf0c448` with the same finite master cutoff |
| Slice 4 closing fetch | 2026-07-26T17:11:18.4017331Z | `7edae41131a4e6a282d80f67a2fbcfbada52beb3` | `7edae41131a4e6a282d80f67a2fbcfbada52beb3` | none | No controls, states, routes, persistence contracts, active-scope authorities, test owners, build inputs, or package inputs changed upstream during Slice 4. | No merge, conflict resolution, or parity reclassification required before the finite Slice 4 terminal gate |
| Slice 5 opening fetch | 2026-07-26T17:55:20.7165647Z | `7edae41131a4e6a282d80f67a2fbcfbada52beb3` | `7edae41131a4e6a282d80f67a2fbcfbada52beb3` | none | No controls, states, routes, persistence contracts, active-scope authorities, canonical command contracts, test owners, build inputs, or package inputs changed upstream. | No merge or parity reclassification required; Slice 5 starts from approved integration commit `9b2c0cb0` with the same finite master cutoff |

Every later slice boundary must append a row even when the merge is clean. Any
master delta must list controls, states, routes, persistence contracts, active
authority, and verification ownership before implementation continues.

### Slice 2 opening master-delta inventory

- **Controls:** direct Description, Allowed values, and Example Table cells now
  commit on Enter, Tab, Shift+Tab, or blur and cancel on Escape. Studio adds a
  first-in-tree Documentation button; named Set/theme creation; Set selection
  and outline reorder; Flow/Profile searches and section toggles; contextual
  Flow/matrix/Profile configuration; structured client theme controls; preview
  refresh; export scope/section selection; incomplete confirmation; rich copy;
  Excel download; and preflight repair links.
- **States and focus:** unchanged and invalid Table edits, sparse inherited
  overrides, parent propagation, inline diagnostics, rerender focus restoration,
  unavailable Flow/Profile configuration, stale preview alert, blocked export,
  incomplete confirmation, immutable snapshot, and feedback states are active.
  Entity and active-project changes exit Documentation; deep repairs preserve
  kind/entity/field destinations.
- **Routes:** `?project=<id>&view=documentation` is the authoritative
  project-level entry. The old More-menu Generate documentation action and
  `#documentation-export` dialog are removed. Flow pages retain value-map
  semantics but own no documentation configuration workspace.
- **Persistence:** `project.documentation` now stores project-Draft-owned named
  Documentation Sets and sanitized structured themes, survives reload and
  portability, and participates in ordinary project commands/Undo. Preview,
  rich copy, and workbook generation are read-only and create no publication.
- **Authority and tests:** active scope adds both Project Documentation
  contracts and its R01 program. `flow_export` now owns the compiler, records,
  workspace/UI, focused unit/property/browser evidence, and both new contracts;
  it depends on `flow_graph` and `layered_schema`. Canonical authoring scenarios
  035–036 and layered-schema evidence own Quick Table transactions.
- **Collision resolution contract:** retain master’s complete rewritten
  Documentation behavior and HTML removals; retain Slice 1 brand links/classes/
  lockup and portable Chrome resolver; resolve source only, then rebuild tracked
  `dist`. Side-panel source has no direct master collision, but Slice 2 CSS must
  not replace quick-edit inputs, datasets, accessible labels, traversal order,
  or the single vertical scroll owner.

### Slice 2 opening merge verification

- `origin/master` at `6be109256c058330f3f7c2badc65f4224d3f31a7`
  is an ancestor of feature merge `1f83b0f6`. Master was not checked out,
  modified, or pushed.
- Verification-pack ownership now assigns the Slice 1 static and packaged
  branding tests to `shell`, satisfying the repository-wide exactly-one-owner
  invariant introduced by the merged master.
- The merged durable-renderer RSS probe now uses the native Windows process
  inventory and preserves the Unix `ps` path. Its installed 501-property,
  persistence, Undo/Redo, recovery, isolation, heartbeat, heap, and RSS
  evidence passes.
- The Flow and Project Documentation browser adapters now wait for production
  module initialization and reacquire live stable-identity nodes around
  rerenders. This removes test-only navigation, stale-node, and geometry races
  without weakening any asserted product behavior.
- The branded narrow Studio restores the production single vertical scroll
  owner. The complete layered-schema browser adapter passes at 360 pixels,
  including table facets, inline quick edits, overlays, conditions, focus,
  persistence, and side-panel parity.
- `node scripts/run-focused-acceptance.mjs --pack flow_export` passed
  uninterrupted with Babashka 1.12.218 from a SHA-256-verified portable
  temporary tool directory. The run covered the pack dependency closure,
  packaged Chrome adapters, generated Gherkin entrypoints, and ended with
  `acceptance passed`.
- `node scripts/package.mjs` produced
  `build/package/my-chrome-utilities.zip`.
- `node test/twatility-brand-foundation-test.mjs`,
  `node test/twatility-brand-foundation-browser-test.mjs`, and
  `node test/headless-chrome-lifecycle-test.mjs` passed.
- A source rebuild after staging produced no working-tree delta against the
  staged generated `dist`, proving deterministic tracked output for this
  boundary.

### Slice 2 closing master-delta inventory

- **Controls, routes, and visible states:** no new or changed production
  controls, navigation routes, focus relationships, accessibility semantics,
  responsive states, or client-theme behavior. No new state-gallery or
  control-map entry is required.
- **Excel output contract:** Download Excel workbook remains the existing
  control and a read-only operation. Its `.xlsx` output must use the OOXML
  workbook MIME, have a complete ZIP central directory, resolve every declared
  internal relationship, and use the standards-correct root
  `officeDocument` relationship so an independent Excel-compatible reader opens
  it without a format error or repair.
- **Scope identity and order:** current scope for Checkout produces
  `Checkout journey`; selected scope for Checkout plus Sitewide produces
  `Checkout journey`, `Sitewide`; complete scope produces `Overview`,
  `Checkout journey`, `Article journey`, `Data capture matrix`, `Sitewide`,
  `Opened Article`, in that order.
- **Persistence and mutations:** no project persistence contract changes.
  Workbook generation remains mutation-free. The layered-schema browser owner
  now waits for both the draft sequence and the expected durable `range` and
  `cardinality` rules, so persistence evidence cannot pass on a token advance
  alone.
- **Authority and test ownership:** the existing Project Documentation export
  row remains preserve-production-behavior with mock presentation-only
  authority. `flow_export` adds runtime checkpoint `export015` plus unit,
  property, browser, acceptance, and mutation assurance for compatibility.
  `layered_schema` owns only its strengthened durable-wait synchronization.
  Packaging remains owned by `node scripts/package.mjs`.
- **Merge contract:** merge `origin/master` only into the Slice 2 feature
  branch. Preserve the feature branch's portable Chrome executable resolution
  and branded Studio readiness guards while taking master's Excel
  compatibility assertions and durable-rule wait. Resolve source, rebuild
  tracked `dist`, and do not modify or push master.

### Slice 2 closing merge verification

- `origin/master` at `7edae41131a4e6a282d80f67a2fbcfbada52beb3`
  is an ancestor of feature merge `4d57dde6`. Master was not checked out,
  modified, merged into, or pushed.
- Git auto-merged the two anticipated browser-test overlaps. Inspection
  confirmed that portable Chrome discovery and branded Studio initialization
  guards remain alongside master's `export015`, independent-reader workbook
  compatibility assertions, exact current/selected/complete sheet order, and
  durable `range` plus `cardinality` wait.
- `node scripts/run-focused-acceptance.mjs --pack flow_export` passed
  uninterrupted and ended with `acceptance passed`, including its `flow_graph`
  and `layered_schema` dependency closure.
- `node test/twatility-brand-foundation-test.mjs`,
  `node test/twatility-brand-foundation-browser-test.mjs`, and
  `node test/twatility-side-panel-shell-browser-test.mjs` passed against the
  packaged extension.
- The Slice 2 browser evidence verifies 360×760, 420×900, and 512×900 with no
  document, body, or workspace horizontal overflow; named and connected
  controls; stable control identity with and without branding; all six Data
  Layer routes; Hotkeys; command-palette Escape/focus return; arrow-key tab
  focus; transparent local assets; and contained long text.
- `node scripts/package.mjs` produced
  `build/package/my-chrome-utilities.zip`.

## Slice 0 baseline and known-red checks

### Passed

- `npm ci --prefer-offline` — locked dependencies installed in the sibling
  branding worktree.
- `npm run typecheck` — passed.
- `node scripts/check-architecture.mjs` — passed.
- `node test/side-panel-action-hierarchy-test.mjs` — passed.
- `node test/side-panel-action-hierarchy-ui-test.mjs` — passed.
- `node test/panel-empty-states-test.mjs` — passed.
- `node test/panel-empty-states-ui-test.mjs` — passed.
- Packaged tracked `dist/` loaded in installed Chrome
  `C:\Program Files\Google\Chrome\Application\chrome.exe`.
- Seeded production IndexedDB project rendered on the side panel and Studio.
- Captures at 360×760, 420×900, 512×900, 1280×900, 1440×900, and 1720×960
  had `scrollWidth === viewportWidth`.
- Valid seeded routes produced no runtime exception.

### Demonstrated pre-existing baseline failures

1. `npm run build` passes the npm typecheck and architecture phases but
   `scripts/build.mjs` fails on Windows with `spawnSync tsc ENOENT` because it
   invokes the bare `tsc` executable through `execFileSync`. The failed script
   deletes `dist` before the failing spawn. Tracked `dist` was restored exactly
   from `HEAD`; no generated drift was retained. Slice 1 must make the build
   invoke the locked TypeScript compiler portably.
2. `node test/browser-packs/shell.mjs` fails before testing with
   `spawn google-chrome ENOENT` because the harness hardcodes the Linux
   executable name. Chrome itself is installed and worked through its absolute
   path for the packaged baseline. Test infrastructure must use a portable
   executable resolver before this adapter can be counted as passed on Windows.
3. Packaged Studio requests
   `specification-builder-guidance.css`, but tracked `dist/` lacks it. Chrome
   recorded `net::ERR_FILE_NOT_FOUND` on each Studio route. This is the exact
   build omission named by the program and is a Slice 1 blocker.
4. `npm ci` reports one high-severity dependency advisory. No audit-fix mutation
   was authorized or attempted; it is not a branding regression.

## Baseline visual findings

- Side panel has no page-width horizontal overflow at 360, 420, or 512 pixels.
- Production navigation labels wrap awkwardly at 360px and the active-project
  summary is visually dense, but every audited control remains reachable.
- Projects and Live rely on one vertical scroll owner and retain real disabled
  reasons and actions.
- Studio has no page-width horizontal overflow at 1280, 1440, or 1720 pixels.
- The missing guidance stylesheet leaves Studio visually sparse and materially
  affects the baseline; Slice 1 must correct packaging before judging final
  layout parity.
- Studio project identity, collection counts, Add/Open/Remove actions, Inspector,
  Page semantics, and Flow canvas controls are visibly present.
- The production Flow route correctly exposes no fallback lanes and says to add
  a Page Group; this stronger behavior overrides the mock's lane examples.

## Approved structural classification

The user approved the following deliberately narrow structural rows on
2026-07-26:

1. Property Definition presentation under the existing focused layer.
2. Rule inventory and Add/Edit presentation over the shared production rule
   model.
3. Shared nested condition-tree presentation, including remaining flat Studio
   applicability mounts.
4. Current Allowed-values and example-method progressive disclosure.
5. Viewport-safe nested overlay geometry and layer focus restoration.

These proposals do **not** authorize a new schema model, flat condition format,
mock behavior, Inspector-owned lifecycle, or changes to durable state. All other
rows are brush-on, layout parity, preservation, or explicit omission.

Approval closes the Slice 0 review gate and permits the remaining implementation
slices to proceed. Slice 0 itself is not the terminal program deliverable.

## Slice 1 foundation completion

Slice 1 completed the cross-cutting presentation and packaging foundation used by
every matrix row:

- explicit scoped theme activation on the side panel and Specification Studio;
- shared red, navy, cream, mustard, status, focus, contrast, spacing, radius,
  shadow, and display/body/monospace tokens;
- accessible code-native TWAtility Belt wordmarks;
- packaged genuine-alpha belt and technical-analyst illustrations;
- base controls, fields, labels, panels, dialogs, focus-visible,
  reduced-motion, and forced-colours treatment;
- portable locked TypeScript compiler invocation and deterministic inline-source
  maps;
- the previously missing `specification-builder-guidance.css`;
- recursive local asset packaging and built-HTML reference validation; and
- portable Chrome discovery for all existing browser verification owners.

The installed-extension equivalence check demonstrated that enabling or
disabling only the branding stylesheets leaves each control's tag, ID, type,
role, hidden/disabled state, and ARIA relationships unchanged. The control rows
retain their approved Slice 2–6 owners; Slice 1 does not claim completion of
those later layout or structural decisions.

## Slice 3 Projects completion

Slice 3 completed the Projects vertical workflow against finite master cutoff
`7edae41131a4e6a282d80f67a2fbcfbada52beb3`:

- branded active-project context, active card, metadata query toolbar, project
  rows, durable-storage status, staged reviews, failure/recovery surfaces, and
  destructive backup review;
- retained production IndexedDB, nullable active-context, metadata-only library,
  selective loading, page-scoped history, conflict, migration, recovery,
  import/export, and cross-window convergence contracts;
- restored live origin-focus resolution after metadata Save and Undo rerenders,
  and explicit origin-focus restoration for Create and Import review exits;
- registered one packaged Projects browser owner under `project_management`;
- verified search, Name/Last-saved sort, switch review, create review, staged
  import, metadata Save, durable Undo, recovery, stable identity, focus return,
  accessible names and relationships, branding control equivalence, and
  360/420/512 responsive containment; and
- regenerated tracked `dist/` from source and packaged the extension without
  hand-editing generated JavaScript or source maps.

The opening and closing master fetches found no upstream delta, so no master
merge or conflict resolution was required. Master was never checked out,
modified, committed to, merged into, or pushed. The shared cross-window,
orphan-repair, and empty-project seams remain preserved for their additional
Studio verification in Slices 4–6; Slice 3's Projects ownership is complete.

## Slice 4 Specification Studio completion

Slice 4 completed the Specification Studio shell and navigation against finite
master cutoff `7edae41131a4e6a282d80f67a2fbcfbada52beb3`:

- branded the production project bar, status, collection rail, breadcrumb,
  grouped tools, global search, workspace, entity rows, Inspector, and
  viewport-safe More disclosure;
- restored the approved Documentation-first tree order followed by a directly
  reachable Project overview, all eight collection routes, and installed
  Releases recovery, with no Schemas collection;
- made Project overview a stable routed/focused destination and ensured leaving
  Documentation clears its `view` query before opening a collection route;
- defaults the Inspector collapsed below 1600 CSS pixels and open at wider
  desktop sizes, while preserving the operator's later in-page choice across
  rerenders and keeping narrow navigation plus an opened Inspector in flow;
- hardened conflict and deep-route focus so a collapsed Inspector is never used
  as an invisible destination;
- retained main-workspace ownership of Add, Open, Remove, Documentation, Page
  and Page Group configuration, and Flow graph commands; and
- verified the packaged extension at 1280×900, 1440×900, 1720×960, 360×800,
  and a 200%-equivalent CSS viewport with stable project bytes, Draft token and
  sequence, Published revision, control identity, ARIA relationships, and zero
  runtime or local-load errors.

The opening and closing master fetches found no upstream delta, so no master
merge or conflict resolution was required. Master was never checked out,
modified, committed to, merged into, or pushed. Canonical rule/condition
structure remains Slice 5, while Documentation content, Flow internals,
assurance, import/export, conflict/recovery, and remaining entity-state polish
remain Slice 6.
