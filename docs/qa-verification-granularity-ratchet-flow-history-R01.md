# QA verification granularity ratchet Flow history R01

Status: historical implementation evidence split from the active authority on
2026-08-30

This file records one settled application of the ratchet. The active rules are
in `docs/qa-verification-granularity-ratchet-R01.md`.

## Settled Flow schema-editor route disposition preparation

Read-only intent for approved product task
`flow-instance-schema-editor-scrolling` started from QA `28e7b2dded` and stopped
before product coding with `granularity-assessment-required`. The causal path is
`src/data-layer-layered-schema-ui.ts`, whose propagating
`layered_schema_composition` boundary selects the otherwise unrelated
`flow_export`, `live_flow_testing`, and `property_set_flow_sections` task
families. The complete conservative intent plan is `flow_graph`,
`layered_schema`, `flow_export`, `live_flow_testing`,
`property_set_flow_sections`, and `shell`, comprising 156 tasks. No coherent
product candidate or product patch reference exists.

Standing authority therefore activates independent task
`verification-slice-flow-instance-schema-editor-scrolling` from exact QA
`28e7b2dded`. It establishes verification ownership only and must not implement
directional Flow scenario 047, change schema composition, or make the editor
scrollable. The preparation must establish all of the following:

1. **Route-layout seam.** Prefer a behavior-preserving extraction at
   `src/layered-schema/flow-editor-route-layout.ts` for the Flow-launched
   editor-host presentation lifecycle: opening the Page-instance or
   Event-occurrence editor, exchanging `#workspace-content` with
   `#layered-schema-editor-host`, closing on ordinary route departure, and
   restoring the recorded Flow context only through Return to Flow. General
   schema compilation, composed-property authoring, persistence, and collection
   editors remain outside this seam.
2. **Conserved behavior.** The extraction preserves scenario 046 for both
   contributor scopes, including stable contributor identity and scope, focus
   return, Flow camera and workspace-scroll restoration, stale-route cleanup,
   and zero project commands on navigation. Existing layered-schema unit and
   property contracts remain unchanged. The currently approved scenario 047
   remains outside the preparation and cannot be claimed satisfied or weakened
   to make preparation evidence pass.
3. **Exact slice and consumer.** Register subordinate slice
   `layered_schema_flow_editor_route` under parent pack `layered_schema` with
   the exact extracted source path, direct
   `unit:test/data-layer-layered-schema-test.mjs` observation,
   `property:test/data-layer-layered-schema-property-test.mjs` prerequisite,
   and `flow_graph` as the installed consumer. Its observable boundary is the
   Flow-launched layered-schema route presentation and active editor-host
   lifecycle. `layered-schema.css` retains its existing shell-to-
   `layered_schema` bridge, and
   `src/flow-graph/flow-workspace-shell.css` retains its existing
   `flow_graph`-to-shell bridge.
4. **Durable disposition.** Record one task-scoped disposition for
   `src/data-layer-layered-schema-ui.ts`. If the extraction is proved, record
   `integrated-seam` with the new route-layout path as its replacement and make
   the resumed product consume that seam without changing the broad file. If
   route presentation cannot be separated without retaining general schema
   composition behavior, record an evidence-backed `parent-fallback` and keep
   the complete conservative owner/consumer closure. Either reviewed result is
   final for this product lineage and prevents the same assessment loop.
5. **Conservative preparation proof.** The preparation cannot use its new slice
   to narrow its own current/base evidence range. Begin with the six-pack,
   156-task conservative forecast above, then use exact changed-path preflight
   as authoritative. Prove unchanged parent-pack task closure, prerequisites,
   consumers, route-lifecycle behavior, CSS bridge ownership, terminal
   obligations, quarantine behavior, and package contents. Run properties and
   package proof, but never the all-20 gate.
6. **Clean product resumption.** After architect `qa-ready` integration, record
   the reviewed quarantine repair if applicable and reissue stable task
   `flow-instance-schema-editor-scrolling` from that exact QA head without
   another user decision. The resumed product runs fresh read-only intent and
   exact candidate preflight, consumes the integrated route seam or its explicit
   parent fallback, and remains bound to scenario 047.

The preparation implementation-and-review effort ceiling is 120 minutes from
coder receipt to architect `qa-ready`. At 60 minutes report the extraction or
fallback decision, exact slice tasks and consumer, scenario-046 conservation,
current exact packs and tasks, disposition status, failures, remaining work,
confidence, and forecast. Continue while product behavior is unchanged and a
bounded safe completion path remains. Stop for user direction only if coverage
would weaken, ownership becomes unavailable, the preparation becomes genuinely
global, or the seam would change product requirements.

The preparation is QA-integrated at `4daea21df0` from base `0444fa50ef`. It
settled on the preferred `integrated-seam` result: Flow-launched editor-route
visibility, ordinary-departure cleanup, and Return-to-Flow presentation restore
now live in `src/layered-schema/flow-editor-route-layout.ts`, while schema
composition, property authoring, persistence, and collection editors remain in
their existing owners. Unit and property observations conserve Page-instance
and Event-occurrence route identity, focus, Flow camera, workspace scroll,
disclosure state, and cleanup. Scenario 047 and the CSS overflow behavior were
not changed or claimed complete.

The registered `layered_schema_flow_editor_route` slice has the exact source,
unit, property prerequisite, and `flow_graph` consumer specified above. The
durable disposition replaces the broad product intent path with that seam;
existing CSS bridges are unchanged. Review-ready evidence passed the complete
six-pack conservative range—`flow_export`, `flow_graph`, `layered_schema`,
`live_flow_testing`, `property_set_flow_sections`, and `shell`—with properties,
package proof, and 183 focused tasks. No all-20 run occurred. The original
156-task forecast was 27 tasks low. Dispatch-to-architect-ready elapsed
2 hours 7 minutes 54 seconds, about 8 minutes beyond the 120-minute ceiling;
the overrun changes neither the accepted evidence nor the rule for subsequent
work. No verification-slice quarantine is active, so no repair transition is
applicable. The stable product task resumes automatically from the exact
documentation scorecard descendant of `4daea21df0`.
