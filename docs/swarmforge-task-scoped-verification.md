# SwarmForge task-scoped verification

This file is part of the current active-scope authority. Read only the selected task row and the common commands and restrictions.

## Task-scoped verification

Use only the exact task pack selected below plus the package command. Do not infer
additional checkpoints from the full dependency graph. The canonical registry
still decides changed-path ownership, required consumers, target batching, and
historical rename/delete handling.

| Task area | Exact focused runner selection |
|---|---|
| Canvas-first Flow workspace | `--pack flow_graph --pack layered_schema` |
| Project Documentation | `--pack flow_export` |
| Documentation templates | `--pack flow_export --pack project_management --pack durable_project_repository` |
| Excel template area properties | Start with `--pack flow_export --pack project_management --pack shell`; exact read-only intent and changed-path planning are authoritative, with properties and package proof and no all-20 feature checkpoint. |
| Flow Documentation template instance content | `--pack flow_export --pack shell` |
| Flow template typed example literals | Start with `--pack flow_export`; exact read-only intent and changed-path planning are authoritative, with properties and package proof and no all-20 feature checkpoint. |
| Guided Live Flow testing | `--pack live_flow_testing` |
| Canonical and layered schema | `--pack layered_schema` |
| Layered schema inheritance-card consistency | Start with `--pack layered_schema --pack flow_graph --pack flow_export --pack live_flow_testing --pack property_set_flow_sections`; exact read-only intent and changed-path planning are authoritative, with properties and package proof and no all-20 feature checkpoint. |
| Project management and portability | `--pack project_management` |
| Project event transport | `--pack project_event_transport` |
| Event Library target-page push closure | Start with `--pack event-library`; exact read-only intent and changed-path planning are authoritative, with properties and package proof and no all-runnable-pack feature checkpoint. |
| Defect consolidation | Use only the `shell` parent for structured unblocker validation and role-process compatibility. No `verification_process` pack, properties, generated fixture, persistent census, diagnostic lifecycle, or all-runnable-pack checkpoint. |
| Verification task-checkpoint incident repair | Start with `--pack shell --pack verification_process`; keep `scripts/shared-artifact-parallel.mjs` unchanged and the fail-fast coordinator under `scripts/verification-execution/`; reject production runner recursion from registered tasks; exact read-only intent and changed-path planning are authoritative, with properties, package proof, preserved incident fixtures, and no all-runnable-pack feature checkpoint. |
| Legacy campsite satisfaction compatibility | Start with `--pack shell`; bind only generation `56b862f0012f` and manifest digest `df3889aae165`, resolve common-project QA-ready authority without copying runtime files, preserve existing campsite bytes, and use properties plus package proof with no all-runnable-pack feature checkpoint. |
| Aggregate child failure routing | Start with `--pack shell --pack verification_process`; preserve the live incident and parked candidate, prove the child-result and legacy-binding paths with synthetic fixtures, and use properties plus package proof with no live incident rerun or all-runnable-pack feature checkpoint. |
| Blocked aggregate evidence preparation | Start with `--pack verification_process`; change only the evidence core and runner, reliability run-intent and local blocked-aggregate helper, and the direct reliability-run-intent and evidence-promotion contracts; require fresh exact six-task evidence plus properties and package proof with no Shell aggregate, Flow child, product path, Gherkin handler, or all-runnable-pack feature checkpoint. |
| Blocked aggregate cross-base delta identity | Start with `--pack verification_process`; change only the blocked-aggregate reliability helper, runner, and direct reliability-run-intent and evidence-promotion contracts; prove canonical operation-sequence and reverse-base conservation with fresh exact six-task evidence, properties, and package proof and do not launch the staged routing candidate, live aggregate, Flow child, or an all-runnable-pack checkpoint. |
| Blocked aggregate cross-lineage admission | Start with `--pack verification_process`; change only the blocked-aggregate helper, runner, evidence core, and direct reliability-run-intent and evidence-promotion contracts; prove direct immutable incident validation plus unchanged generic blocking with fresh exact six-task evidence, properties, and package proof and do not launch the parked routing candidate, live aggregate, Flow child, or an all-runnable-pack checkpoint. |
| Blocked aggregate deferred-only revalidation | Start with `--pack verification_process`; change only the runner, blocked-aggregate helper when needed, and direct reliability-run-intent contract; prove complete admitted-population identity across deferred-only, empty, mixed, and mismatch fixtures with fresh exact five-task evidence, properties, and package proof and do not launch the parked routing candidate, live aggregate, Flow child, or an all-runnable-pack checkpoint. |
| Nested checkpoint capability routing | Start with `--pack verification_process`; change only the verification-process manifest and generated registry, runner output-forwarding seam, execution-checkpoint contract, and registry-inventory contract only when needed; require the exact `registry_inventory` plus `execution_checkpoint` six-task plan, properties, and package proof, with no parked routing candidate, live aggregate, Flow child, product candidate, or all-runnable-pack launch. |
| Schema relationship tree | `--pack schema_relationship_tree` |
| Durable project repository | `--pack durable_project_repository` |
| Property Sets and Flow Sections | `--pack property_set_flow_sections` |
| Project assurance severity | `--pack project_assurance_severity` |
| Choice controls, analyst guidance, and generated branding | `--pack branding_polish` |
| VTD-015 workflow bootstrap | all 20 canonical pack selectors; shared handoff and evidence behavior affects every pack |
| QA release-pilot workflow changes | `--pack shell --focused-task unit:test/settled-final-verification-workflow-test.mjs --focused-task unit:test/verification-process-contract-test.mjs` |
| Verification ownership readiness bootstrap | `--pack shell --pack flow_export --pack project_management --pack durable_project_repository`; include the two focused workflow/process-contract unit targets and package proof; one bounded additional exact owner may be recorded as forecast variance, but all 20 is forbidden |
| Verification granularity ratchet | `--pack shell --pack flow_export --pack project_management --pack durable_project_repository`; include direct slice-planner, conservation, workflow, and process-contract unit targets with properties and package proof; one bounded exact consumer may be recorded as variance, but all 20 is forbidden |
| Registry-derived verification packs | Start from `--pack shell` plus the exact modular-pack, throughput-reporting, reliability-closure, and process-contract targets selected by read-only intent. Keep the reliability-values and reliability-receipts helpers unchanged; inject terminal-repair defaults from a bounded cardinality adapter through store, runner, and closure callers; and register the cardinality prefix only under `verification_pack_cardinality_contract`, with no `globalImpact` entry and no registry pack consumers. Prove all semantic runnable identities through executable synthetic registries, preserve current topology and exact-pack closures, and never run the all-runnable-pack gate in feature mode. |
| Documentation-template mapping repair | Start with `--pack shell --pack flow_export --pack project_management --pack durable_project_repository`; exact preparation ownership is authoritative and may conservatively include the known 13-pack shared-path boundary, with properties and package proof. Never run all 20. Record candidate-path replay, automatic variance routing, slice-or-fallback disposition, exact-pack conservation, and package proof. |
| Outcome-bounded autonomy and stacked unblockers | Start with `--pack shell` and the exact `swarmforge-handoff-control` plus `swarmforge-stacked-ratchet` process slices. Read-only ownership intent is authoritative; aggregate new coarse paths once, apply bounded judgment, preserve deferred observations, and keep all-20 exclusive to the final master gate. |
| Flow verification proof hardening | `--pack flow_graph` |
| Flow browser-program partitioning | `--pack flow_graph --focused-task unit:test/verification-process-contract-test.mjs` |
| Flow relationship snap feedback | `--pack flow_graph` |
| Stage-aware stylesheet ownership | `--pack shell --focused-task unit:test/settled-final-verification-workflow-test.mjs --focused-task unit:test/verification-process-contract-test.mjs` |
| Flow stylesheet extraction | `--pack flow_graph --pack shell` |
| Flow derived JSON array examples | `--pack flow_graph --pack flow_export --pack live_flow_testing --pack property_set_flow_sections` |
| Flow visual thumbnail save settlement | `--pack flow_graph --pack flow_export --pack live_flow_testing --pack property_set_flow_sections` |
| Flow nested-Event thumbnail containment | `--pack flow_graph --pack flow_export --pack live_flow_testing --pack property_set_flow_sections` |
| Flow nested-Event thumbnail evidence contract | `--pack flow_graph --pack shell` |
| Layered Page-group Documentation display-path evidence repair | `--pack layered_schema` |
| Verification run-intent correction | `--pack shell --focused-task unit:test/settled-final-verification-workflow-test.mjs --focused-task unit:test/verification-process-contract-test.mjs` |

Run the selected packs with:

```sh
node scripts/run-focused-acceptance.mjs <exact-pack-selectors>
node scripts/package.mjs
```

Property tests require the explicit `--property` option. A committed handoff
checkpoint also requires `--changed-since <base>` and uses the two-step evidence
flow:

```sh
node scripts/run-focused-acceptance.mjs <exact-pack-selectors> --property \
  --changed-since <base> --prepare-evidence <task>
node scripts/verification-evidence.mjs record <printed-pending-file>
```

Do not run the terminal suite, broad regression, unrelated packs, or Gherkin
mutation unless the user explicitly authorizes that work. The package command
consumes the already validated `dist` tree and does not widen task scope.

The user approved the VTD-015 bootstrap terminal scope on 2026-08-11. During
implementation and review, use only focused process-contract checks. Each
committed VTD-015 handoff still follows the previously integrated protocol, whose
shared workflow impact requires the canonical all-20 checkpoint. The new
review-ready protocol became active when VTD-015 integrated; VTD-017 is its first
live payback measurement.

For a new VTD-008 or VTD-010 slice, changed-path preflight and the new bounded
specification determine the exact pack set. Do not reuse a completed slice's
one-time broad delivery checkpoint as permanent fan-out authority.
