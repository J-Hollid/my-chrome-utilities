# TWAtility Belt Branding — Slice 4 Review R01

## Slice and classification

Slice 4 — Specification Studio shell and navigation.

Classification: branding/layout parity plus the approved responsive and route
hardening needed to expose existing production destinations. Production remains
authoritative for project identity, collection lifecycle, Documentation, Flow,
schema editing, persistence, publication, conflicts, recovery, focus, and
Undo/Redo.

## Integration boundary

- Slice integration base: `caf0c448`
- Previous and audited latest master cutoff:
  `7edae41131a4e6a282d80f67a2fbcfbada52beb3`
- Opening fetch: `2026-07-26T16:50:01.9431127Z`
- Closing fetch: `2026-07-26T17:11:18.4017331Z`
- Upstream delta during Slice 4: none
- Direction: no merge was required because `origin/master` was unchanged.
  Master was never checked out, modified, merged into, committed to, or pushed.

## Reviewable commits

- `9bb1ad2b` — Record the Slice 4 master boundary
- `f7074aec` — Brand the responsive Specification Studio shell
- `bfa55c61` — Complete the Studio navigation contracts
- `2cbd9bfe` — Keep Studio disclosures viewport safe
- `dda9dd6c` — Verify the packaged Studio shell
- `460e01be` — Regenerate Slice 4 extension output
- `a2f52011` — Record Slice 4 Studio evidence

The closing boundary, completed parity classifications, and this review record
are committed separately. The slice branch and non-master integration branch
are pushed before this gate is presented.

## Files and production seams

- `specification-builder-brand.css`: scoped masthead, project bar, rail,
  grouped/sticky tools, More disclosure, workspace, collection rows, Inspector,
  dialogs, desktop pane sizing, narrow in-flow layout, 200% containment,
  reduced-motion, and forced-colours presentation.
- `src/specification-builder.ts`: responsive Inspector default; direct Project
  overview tree route; truthful overview breadcrumb/Inspector context; exit
  from Documentation before collection routes; visible conflict/deep-route
  focus destinations.
- `test/browser-packs/project-entity-lifecycle.mjs`: retains keyboard close
  assertions while accepting the approved already-collapsed desktop default.
- `test/twatility-studio-shell-browser-test.mjs`: packaged-Chrome functional,
  responsive, persistence, accessibility, focus, control-equivalence, runtime,
  and screenshot evidence.
- `verification/packs.json`: assigns the new Studio test exactly once to
  `project_management`.
- `docs/twatility-branding-evidence/slice-4-studio-shell/`: final overview,
  Pages, Flow, narrow captures, and machine-readable report.
- Tracked `dist/` was regenerated from source. Generated JavaScript and source
  maps were not hand-edited.

## Controls and states preserved

- TWAtility wordmark, Specification Studio surface name, stable project
  identity, environment, Draft/Published status, exact save state, and Retry.
- No-project starting paths and the real blank-project form.
- Documentation, Project overview, Shared Profiles, Pages, Page Groups, Events,
  Applicability, Flows, Fixtures, Assignments, and installed Releases recovery.
- Breadcrumb route identity and cross-collection global search.
- Inspector Show/Hide with `aria-controls`, `aria-expanded`, exact label,
  dataset layout state, and valid visible focus destinations.
- Run preflight, Coverage matrix, Publish release, Undo, Redo, full project
  export, JSON Schema plus manifest export, and staged import.
- All eight collection Add/Open/Remove controls, empty/populated states,
  type-specific creation, dependency review, stable-ID Undo, and named focus.
- Documentation-first routing, read-only opening, entity/deep repair exits, and
  no obsolete Generate documentation control.
- Main-workspace Flow graph and Page/Page Group configuration ownership,
  independent of the optional Inspector.
- Durable project bytes, Draft token/sequence, and Published revision remained
  unchanged through pure navigation, resizing, toggling, and screenshots.

## Parity rows completed

- Project starting paths and blank-project form preservation.
- Project status bar.
- Project tree and Project overview route.
- Breadcrumb and global search.
- Inspector layout.
- Validate and Release toolbar preservation.
- More actions.
- Project Documentation shell route.
- Collection overviews and entity creation.
- Event semantic preservation and entity removal review.

Canonical property/rule structure, Page/Page Group schema internals, and the
remaining Documentation, Flow, assurance, recovery, and entity-state styling
retain their later Slice 5–6 ownership.

## Visual evidence

Before:

- `docs/twatility-branding-evidence/slice-0-baseline/studio-overview-1280x900.png`
- `docs/twatility-branding-evidence/slice-0-baseline/studio-pages-1440x900.png`
- `docs/twatility-branding-evidence/slice-0-baseline/studio-flow-1720x960.png`
- `docs/twatility-branding-evidence/slice-1-foundation/studio-1280x900.png`

After:

- `docs/twatility-branding-evidence/slice-4-studio-shell/studio-overview-1280x900.png`
- `docs/twatility-branding-evidence/slice-4-studio-shell/studio-pages-1440x900.png`
- `docs/twatility-branding-evidence/slice-4-studio-shell/studio-flow-1720x960.png`
- `docs/twatility-branding-evidence/slice-4-studio-shell/studio-narrow-360x800.png`
- Machine-readable findings:
  `docs/twatility-branding-evidence/slice-4-studio-shell/report.json`

## Automated verification

Final gate: 12 command-level validations passed, 0 final failures.

- `npm run build`
- `node test/data-layer-project-entity-lifecycle-test.mjs`
- `node test/data-layer-project-entity-lifecycle-property-test.mjs`
- `node test/data-layer-schema-specification-builder-test.mjs`
- `node test/data-layer-schema-specification-builder-property-test.mjs`
- `node test/browser-packs/project-entity-lifecycle.mjs`
- `node test/twatility-studio-shell-browser-test.mjs`
- `node scripts/run-focused-acceptance.mjs --pack project_management`
- `node test/browser-packs/durable-project-renderer.mjs`
- `node test/twatility-brand-foundation-test.mjs`
- `node test/twatility-brand-foundation-browser-test.mjs`
- `node scripts/package.mjs`

The authoritative acceptance pack passed build, project lifecycle/library
unit/property checks, project-management contexts 001–010, portability 001–005,
entity-lifecycle contexts 011–018, Projects branding, Studio branding, generated
Gherkin entrypoints, and ended with `acceptance passed`.

During test development, the new adapter correctly rejected an invalid synthetic
Flow fixture and an overly broad persistence hash that included allowed route
metadata. The final fixture uses the complete production graph shape and the
final persistence assertion compares project state, Draft token/sequence, and
Published revision while permitting route metadata updates. No final-gate
product or test assertion remains red.

## Workflows exercised

- Loaded tracked `dist/` as a packaged extension in installed Chrome.
- Opened Documentation, exited to Pages, and verified the stale `view` query
  cannot reopen Documentation on a collection route.
- Opened Project overview from the tree and verified route, breadcrumb,
  `aria-current`, and H1 focus.
- Exercised all eight collection lifecycle routes and retained Add/Open/Remove
  access with the Inspector closed.
- Searched across collections and opened real matched entities.
- Verified Inspector defaults at 1280/1440/1720, keyboard-accessible toggle
  state, manual reopen, in-page choice across rerenders, and narrow in-flow
  availability.
- Opened the real More disclosure and confirmed the complete current action set
  without the removed Generate documentation control.
- Opened a real Flow workspace with main-workspace canvas controls and optional
  contextual Inspector.
- Compared every interactive control's identity, state, and ARIA relationships
  with branding styles enabled and disabled.
- Visually inspected all four final captures.

## Accessibility and responsive findings

- At 1280×900, 1440×900, 1720×960, 360×800, and a 640×450
  200%-equivalent viewport, no document/body horizontal overflow occurs.
- Desktop uses bounded tree, workspace, and optional Inspector panes; the
  Inspector collapses below 1600px by default and the user's later in-page
  choice survives rerenders.
- Narrow navigation and an opened Inspector remain in normal document flow
  under one document vertical scroll owner.
- Local horizontal scrolling remains reserved for intrinsically wide tables,
  matrices, and canvases.
- All visible controls have accessible names; all inspected ARIA references
  resolve; selected routes have non-colour current-state treatment.
- Conflict and deep-route focus never target a hidden Inspector.
- Reduced-motion and forced-colours treatments remain scoped and active.

## Master collisions and resolution

There were no master collisions. Both Slice 4 fetch boundaries resolved
`origin/master` to the same finite cutoff, so merging would have created no
delta. No source or generated conflict resolution was needed.

## Differences and deferred rows

- The production breadcrumb remains truthful route text rather than mock
  clickable crumbs.
- The production Inspector remains contextual; mock Details/Tools/History tabs
  and Inspector-owned lifecycle actions were not copied.
- No mock Validate action, Releases toolbar, Generate documentation action,
  storage button, fictional project logo, role selector, or fallback Flow lane
  was introduced.
- Canonical rules and nested conditions remain Slice 5.
- Documentation internals, Flow internals, Library/Live/Sessions/Defects/Schemas
  finishing, assurance, import/export, conflicts, recovery, and remaining rare
  states remain Slice 6.

## Recommendation

Approve Slice 4 and proceed to Slice 5. At the Slice 5 boundary, fetch and audit
current `origin/master`, merge any new master delta only into the branding
feature lineage, update the parity matrix, then migrate the shared production
nested condition-tree presentation across canonical, composed, side-panel, and
Studio mounts without changing serialization, inheritance, persistence, focus,
or Undo semantics.
