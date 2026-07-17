# Side-Panel Visual Walkthrough Report: R03

## Round Context

| Field | Value |
| --- | --- |
| Round ID | R03 |
| Date | 2026-07-18 |
| Extension commit | `d800847` plus the R03 correction working tree |
| Accepted recommendations under test | DLSP-01 through DLSP-12 |
| Chrome side-panel widths reviewed | 360px, 520px, 720px |
| Local demo flow completed | Yes, with the preparation deviation recorded below |
| Tuple and object event capture verified | Yes: native `queue.history` object capture plus the generated runtime acceptance boundary |

The native walkthrough used an unpacked `dist/` build in a fresh isolated visible Chrome profile, with the only active target at `http://127.0.0.1:4173/`. The repository has no `npm run demo` script, so the documented preparation command could not be used. A temporary local-only commerce fixture on the required origin supplied the operator buttons and `queue.history`; no production site, personal profile, direct storage seed, or published schema mutation was used.

The actual Chrome-owned side panel supplied the Live, inspector, Library, payload-editor, push, and focus evidence. The Specification Builder screenshots are supplemental production-workspace evidence captured by the focused browser adapter; they do not substitute viewport emulation for the native side-panel width matrix.

## Walkthrough Results

| Step | Expected outcome | Result | Evidence |
| --- | --- | --- | --- |
| Choose target | Target is clear and ready. | Passed. The fresh panel began Ended and Disconnected; the picker exposed only the local demo and enabled Start testing after selection. | [No-target state](../artifacts/side-panel-walkthrough/R03/R03-360-no-target.png), [selected target and capture](../artifacts/side-panel-walkthrough/R03/native-live-feed-360.png) |
| Start testing | Capturing and Connected; one initial pageview. | Passed. Capture attached to `queue.history`, showed Capturing and Connected, and began with one `page_view`. | [360px Live](../artifacts/side-panel-walkthrough/R03/native-live-feed-360.png) |
| Commerce flow | Expected page and interaction events captured. | Passed for the decisive interaction sequence: `select_item`, `add_to_cart`, `begin_checkout`, checkout `page_view`, `add_shipping_info`, `add_payment_info`, and `purchase`. The temporary fixture did not model a separate navigation pageview for every product/cart action; that preparation deviation is the basis of VW-R03-01. | [Eight-event feed before push](../artifacts/side-panel-walkthrough/R03/native-live-feed-360.png) |
| Inspect event | Event detail opens and has a visible return path. | Passed. The purchase inspector showed source, capture time, page, destination, provenance, payload properties, actions, and Back to events. | [360px inspector](../artifacts/side-panel-walkthrough/R03/R03-360-purchase-inspector.png), [720px inspector](../artifacts/side-panel-walkthrough/R03/R03-720-purchase-inspector.png) |
| Save to Library | Template is saved and feedback is local. | Passed. Save to Library produced one identifiable `purchase` template sourced from Event history to `queue.history`. | [360px Library](../artifacts/side-panel-walkthrough/R03/R03-360-library.png), [720px Library](../artifacts/side-panel-walkthrough/R03/R03-720-library.png) |
| Edit payload | Draft, version, and result are clear. | Passed. `ecommerce.value` changed from 49.95 to 54.95 through the rendered editor; revision review identified the changed path and saved version 2. | [360px version-2 editor](../artifacts/side-panel-walkthrough/R03/R03-360-payload-editor.png), [520px version-2 editor](../artifacts/side-panel-walkthrough/R03/R03-520-payload-editor.png), [720px save feedback](../artifacts/side-panel-walkthrough/R03/R03-720-payload-editor.png) |
| Push draft | Confirmation is shown and one local event is pushed. | Passed. Confirmation named `purchase`, the local target, `queue.history`, version, validation state, and payload change review. Confirming push increased the feed from eight to nine events exactly once. | [Push confirmation](../artifacts/side-panel-walkthrough/R03/native-push-confirmation-520.png), [push result and returned editor focus](../artifacts/side-panel-walkthrough/R03/native-push-result-focus-520.png), [nine-event feed](../artifacts/side-panel-walkthrough/R03/R03-520-live.png) |
| Keyboard pass | Focus and status announcements behave as specified. | Passed at 360px and 720px. Enter activated the focused event/return controls, Back to events restored the originating event, closing the editor restored its Library Edit control, and save/push completion returned focus to the editor heading with one local result. | [360px focused Live state](../artifacts/side-panel-walkthrough/R03/R03-360-live.png), [520px push focus result](../artifacts/side-panel-walkthrough/R03/native-push-result-focus-520.png), [720px focused Library state](../artifacts/side-panel-walkthrough/R03/R03-720-library.png) |

## Width Matrix

| State | 360px | 520px | 720px |
| --- | --- | --- | --- |
| Live feed | [Capturing, nine events, no horizontal overflow](../artifacts/side-panel-walkthrough/R03/R03-360-live.png) | [Capturing, nine events, no horizontal overflow](../artifacts/side-panel-walkthrough/R03/R03-520-live.png) | [Capturing, nine events, no horizontal overflow](../artifacts/side-panel-walkthrough/R03/R03-720-live.png) |
| Event inspector | [Purchase metadata and return path remain readable](../artifacts/side-panel-walkthrough/R03/R03-360-purchase-inspector.png) | [Purchase metadata and actions remain grouped](../artifacts/side-panel-walkthrough/R03/R03-520-purchase-inspector.png) | [Wider payload and metadata layout remains contained](../artifacts/side-panel-walkthrough/R03/R03-720-purchase-inspector.png) |
| Library | [One version-2 purchase row; Edit focus return](../artifacts/side-panel-walkthrough/R03/R03-360-library.png) | [One version-2 purchase row](../artifacts/side-panel-walkthrough/R03/R03-520-library.png) | [One version-2 purchase row; Edit focus return](../artifacts/side-panel-walkthrough/R03/R03-720-library.png) |
| Payload editor | [54.95 and version 2 remain reachable](../artifacts/side-panel-walkthrough/R03/R03-360-payload-editor.png) | [54.95 and version 2 remain reachable](../artifacts/side-panel-walkthrough/R03/R03-520-payload-editor.png) | [54.95, version 2, and saved result are clear](../artifacts/side-panel-walkthrough/R03/R03-720-payload-editor.png) |
| Keyboard focus state | [Live/event return state](../artifacts/side-panel-walkthrough/R03/R03-360-live.png) | [Push completion returns to editor heading](../artifacts/side-panel-walkthrough/R03/native-push-result-focus-520.png) | [Editor close returns to Library Edit](../artifacts/side-panel-walkthrough/R03/R03-720-library.png) |

No reviewed native width showed horizontal overflow. Long metadata wrapped within its region; controls remained visible and associated with their labels or result. The 360px inspector and editor necessarily use vertical scrolling, but the current target/session status and explicit return action remain available before deep payload detail.

## Verification of Accepted Recommendations

| Recommendation ID | Acceptance criteria result | Evidence | Status |
| --- | --- | --- | --- |
| DLSP-01 | Assignment count, rows, search, empty state, conflict result, stable IDs, pinned revision, nested conditions, blank rejection, and published-revision isolation agree. | [Truthful assignment editor at 1280px](../artifacts/side-panel-walkthrough/R03/specification-assignments-1280.png); focused browser and model gates | Passed verification |
| DLSP-02 | A dedicated full-page project workspace exposes project tree, bounded workspace, contextual inspector, draft state, preflight, release, and interchange actions. | [Structured workspace at 1280px](../artifacts/side-panel-walkthrough/R03/specification-builder-1280.png) | Passed verification |
| DLSP-03 | Pages, applicability, flows, durable schema drafts, assignments, fixtures, and releases are first-class collections. The accessible primary flow editor authors ordered steps, branches/joins, occurrence bounds, optionality, and transitions; no graphical canvas is required. | [Structured flow editor](../artifacts/side-panel-walkthrough/R03/specification-builder-1280.png), [assignments and integrated schema-draft surface](../artifacts/side-panel-walkthrough/R03/specification-assignments-1280.png) | Passed verification |
| DLSP-04 | Reusable profiles compose with provenance and Where used data rather than requiring a single opaque inherited winner. | Focused model and generated acceptance gates | Passed verification |
| DLSP-05 | Autosave failure retains the edit and exposes retry; release review is whole-project and prior releases remain immutable; restore creates a draft. | Focused browser observation and generated acceptance gates | Passed verification |
| DLSP-06 | Bulk authoring commits 100 rows transactionally, Undo restores zero, and the 500-property scenario remains bounded. | Focused browser observation; [bounded responsive workspace](../artifacts/side-panel-walkthrough/R03/specification-builder-720.png) | Passed verification |
| DLSP-07 | Named structured conditions preserve nested All + Not path logic and resolver analysis reports ambiguity before release. | [Truthful assignment controls](../artifacts/side-panel-walkthrough/R03/specification-assignments-720.png); focused browser/model gates | Passed verification |
| DLSP-08 | Fixture/preflight and coverage surfaces run without captured traffic; 500 properties and 50 flows render at most 40 rows and deep-link to the exact field. | Focused browser observation and generated acceptance gates | Passed verification |
| DLSP-09 | Ten tree collections, global search, contextual selection, provenance, Where used, and exact issue navigation remain available at reviewed widths. | [720px structured workspace](../artifacts/side-panel-walkthrough/R03/specification-builder-720.png), [1280px structured workspace](../artifacts/side-panel-walkthrough/R03/specification-builder-1280.png) | Passed verification |
| DLSP-10 | Full-state import is staged, collision-blocked, remappable, and committed atomically; project identity and linked structured conditions survive. | Focused browser/model gates | Passed verification |
| DLSP-11 | Documentation table generation is named and separated from full-fidelity Specification Project and JSON Schema interchange, with explicit lossy-export metadata. | [Workspace actions](../artifacts/side-panel-walkthrough/R03/specification-builder-1280.png); focused clipboard observation | Passed verification |
| DLSP-12 | 360px, 520px, and 720px layouts have no page overflow, bounded rows, and at least 44px rendered controls; keyboard return/focus behavior passed. | [360px flow editor](../artifacts/side-panel-walkthrough/R03/specification-builder-360.png), [520px assignment editor](../artifacts/side-panel-walkthrough/R03/specification-assignments-520.png), native width matrix above | Passed verification |

The decisive release scenario also passed at the actual browser/model boundary: Retail and Trade share the same Purchase event and confirmation context, each advances a distinct prior flow state, the final payload omits a funnel marker, and the resolver returns different unambiguous assignment/profile winners for `retail checkout` and `trade checkout`.

## New Recommendations

### VW-R03-01: Restore the documented deterministic demo runner

**Priority:** P1

**Evidence:** R03 preparation at the documented `npm run demo` step; `package.json` has no `demo` script, so the required origin and commerce sequence had to be supplied by a temporary local fixture. That fixture covered the decisive commerce interactions but not a separate pageview for every navigation named in the workflow.

**Observed issue:** A reviewer cannot reproduce the authoritative walkthrough from repository commands alone, and an ad hoc fixture can drift from the required page-navigation event sequence.

**Recommended change:** Ship a deterministic local demo command at `http://127.0.0.1:4173` whose rendered product, basket, checkout, shipping, payment, and order controls emit the workflow's canonical pageviews and interaction events.

**Acceptance criteria:**

- `npm run demo` starts the local fixture on `127.0.0.1:4173` from a clean checkout.
- The rendered operator flow emits one initial pageview, the documented navigation pageviews, `select_item`, `add_to_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, and one `purchase` without direct scripting or storage seeding.
- The fixture remains local-only and is safe for Push draft verification in an isolated Chrome profile.

**Product value:** Every visual review exercises the same safe event sequence, making screenshots, counts, and regression comparisons trustworthy.

**Likely implementation areas:** `package.json`, a local demo entry point, and walkthrough/acceptance fixture support.

## Regressions

| Regression | Previous expected behaviour | Current behaviour | Severity | Evidence |
| --- | --- | --- | --- | --- |
| None observed | Native tuple/object capture, side-panel workflow, responsive containment, focus return, and project persistence remain stable. | All exercised behavior passed; the missing demo runner is recorded as reproducibility debt rather than a product regression. | None | Native width matrix and focused/full gates listed above |

## Round Outcome

DLSP-01 through DLSP-12 passed R03 verification. The correction includes production assignment/schema-draft lifecycle integration, an accessible structured flow-step editor as the primary authoring behavior, and unambiguous markerless Retail/Trade prior-flow resolution. There is no remaining recommendation to replace a generic project JSON editor: steps, branches, occurrence limits, optionality, and transitions are directly authorable through structured controls.

The product correction is ready for downstream refactorer and architect review after the recorded build, unit, browser, and generated acceptance gates. VW-R03-01 should be scheduled to make the next native walkthrough reproducible from the documented repository command; it does not reopen the delivered structured project editor behavior.
