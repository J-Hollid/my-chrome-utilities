# Configuration portability ownership preparation R01

Status: authorized by the approved product and standing immediate-preparation
rule on 2026-09-13. Task:
`verification-slice-complete-configuration-portability`.
Starting QA: `5be0d73db8600fefd6f95ad07e44d0bc941fc583`.
Product task: `complete-configuration-portability`. Feature integration into QA.

## Cause and scope

Coder note `20260913T071531Z_000077_from_coder` reports read-only intent classified
granularity-assessment-required: 19 packs and 203 tasks. Its explicit judgment
is immediate independent preparation. Three unsliced paths select unrelated
command-palette, defect, assurance, replay, verification-process, transport, and
broad Flow/runtime families. The rationale is to establish a stable module boundary
before product coding rather than narrow ownership inside a product candidate.
No product implementation exists. Preserve the approved specifications; there
is no product patch to split, rebase, or reconstruct.

Assess these paths together, with a durable reviewed disposition for each:

| Causal path | Required disposition |
| --- | --- |
| src/data-layer-project-library-ui.ts | Separate the existing project transport UI responsibility behind a stable interface, or prove and record why its existing parent fallback remains necessary. |
| src/flow-visual-archive-export.ts | Prove a focused archive-writing boundary and its direct validation/asset prerequisites, or retain the justified parent fallback. |
| src/flow-visual-asset-portability.ts | Prove a focused archive inspection/import boundary and its asset/reference consumers, or retain the justified parent fallback. |

Use prefix `src/configuration-portability/`, parent `project_management`, proposed
slice `configuration_portability`. Proposed direct consumer packs are
durable_project_repository, schemas, event-library, capture, hotkeys, and shell.
Prove the exact consumer task identities and prerequisites; add any real omitted
consumer. Names are proposals, not authority to remove coverage. Retain transitive
Flow and other existing consumers until an independently proved boundary says
otherwise. Do not invent future production calls solely to justify a slice.

Extract or register existing responsibilities only, without changing export
bytes, import results, conflict policy, visible labels, or asset behavior. Do not
implement complete setup, new formats, or the product bug repairs in this stage.
Do not build an empty plugin framework. Prefer small modules and direct existing
callers. Keep unused proposed extension points minimal and prove their ownership
with real production delegation or a precise independently reviewed contract.

## Verification and cost

Run read-only intent before changes, then exact plan-only on the first coherent
commit. The preparation's own evidence must preserve the conservative current/base
union. Do not consume the narrower mapping before this stage reaches QA. Conserve
all task identities, assertion leaves, observation targets, package inputs, and
terminal obligations. Test direct callers and negative missing-consumer/prerequisite
cases, not source strings alone. Preserve independent historical expectations.

Likely edits: the three causal paths, extracted modules, direct tests and this
contract's handler, project_management and affected consumer manifests, generated
registry, and the existing granularity disposition registry. Proposed QA scope
includes project_management, durable_project_repository, schemas, event-library,
capture, hotkeys, shell, verification_process, and their actual selected consumers.
The exact plan is authoritative. Do not run all runnable packs, create a bootstrap
exception, or change verification policy to fit the forecast.

Development focus: existing transport/archive tests and exact ownership/consumer
queries. Prove byte/behavior equivalence of any moved production code. Use focused
properties and package proof for settled review. Do not run Gherkin mutation as
the specifier. Contract: features/configuration-portability-ownership-preparation.feature.

Forecast ceiling: two hours, with a one-hour assessment. At each checkpoint report
the disposition of all three paths, actual selected tasks, measured cost, remaining
work, and confidence. If preparation becomes disproportionate, use the supported
durable-observation route and retain conservative coverage; report the exact
disposition for review. This is not permission to claim a safe split without proof.

## Review and product resumption

Refactorer and architect review this stage independently. Record dispositions
under the original product task and exact causal paths, including replacement
paths or evidence-backed fallback reasons. Do not repeat preparation for the same
accepted task/path generation without a materially changed premise or consumer set.

Only an architect qa-ready candidate with bound review-ready evidence permits QA
integration. Record a quarantine repair through the supported helper only if a
quarantined slice applies. Then the specifier automatically reissues
complete-configuration-portability from the exact accepted QA head. The product's
complete ZIP, quick setup, and three conflict choices remain unchanged. A new
specification commit alone is not implementation satisfaction. Master promotion
is separate, and no product delivery or speed saving is claimed by preparation.
