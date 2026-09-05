# Serena development pilot R01

Status: user-approved on 2026-09-05 for commit and coder implementation handoff.
Prepared: 2026-09-05. Task: `serena-development-pilot`. Mode: feature integration
into `qa`. Start implementation from the approved specification commit on QA.
This is a tooling and process task; it does not change extension behavior.

Prerequisite satisfied: `verification-slice-serena-development-pilot` is
independently reviewed and QA-integrated at `fa6c204e9d`. Its accepted result
and process scorecard are in `docs/serena-preparation-qa-scorecard.md`.
Resume this approved pilot from the QA recording descendant. Use the subordinate
optional-tool authority and entry point; keep the core checker, root lock,
and global runtime ownership unchanged. No product patch needs reapplication.

## Outcome and limits

Make Serena available during normal product and process work. Use it when a
symbol query can answer the current question with less reading. Add a small,
read-only query helper for verification ownership, which a language server
cannot establish. Reduce startup reading before adding more tool instructions.

The baseline is ordinary file search plus the existing ownership planner. No
local Serena time or token saving has been measured. The target is useful code
navigation with bounded setup and smaller relevant reads. Do not repeat completed
work, run comparison trials, create a benefit gate, or add a telemetry system.
Routine RepoWise scouting stays stopped. Existing approval, verification,
quarantine, incident, queue, lease, and handoff rules remain in force.

## Where to use the tools

| Work | Use |
|---|---|
| Specification | Locate product entry points and shared surfaces. Query ownership to define development focus and QA impact. |
| Coding | Read a module outline, then the required symbol bodies. Find callers when an interface or shared behavior changes. |
| Refactoring | Find definitions and references before a split or rename. Inspect declared verification consumers as well. |
| Architecture review | Read the complete candidate diff. Use scoped symbol queries to inspect affected boundaries and callers. |
| Failure diagnosis | Follow the current failed behavior and its known dependencies. Expand only for a concrete unanswered question. |
| Evidence | Use the canonical ownership planner and existing runners. Tool answers are discovery information, not passing proof. |

One short shared rule must be available to all four roles:

> Use file search for filenames, literal text, configuration, and documents.
> Use Serena for symbol structure and code references when it reduces required
> reading. Start with outlines and request only the required bodies. Query the
> ownership helper for verification relationships. Expand only for a concrete
> unanswered question. If Serena fails or gives doubtful results, use ordinary
> tools and inspect the affected code.

Do not require a Serena call on every task. Do not copy the full tool catalogue
into prompts or save task histories as Serena memories.

## Local setup and startup reading

Provide a reproducible, explicit provisioning command for a pinned Serena
revision and its required language servers. Record the pins under the existing
toolchain authority; keep setup code in small separate modules. Ordinary worker
startup must use local installed tools and must not download dependencies.
Preserve the project TypeScript 5.9.3 lock and worktree-local dependencies.

Use local stdio MCP with the Codex context. Each role process must bind to its
own absolute worktree, including the specifier root. Resolve the project from
that worktree or set it explicitly. Never share one mutable active-project
session across workers. Preserve the current sandbox and network controls.
Keep Serena optional for worker startup; a missing or failed server must not
prevent the role from receiving tasks. Give one short fallback reason.

Initially expose symbol overview, symbol lookup, reference lookup, declaration
lookup where supported by the pinned release, and only the setup tools needed
for that session. Disable symbolic editing, shell/file duplicates, memories,
onboarding, and usage reporting. Keep ordinary edit tools. Avoid startup hooks
and automatic broad reads. Record the actual tool list from the pinned release.

Use TypeScript support for product `.ts` and authored `.mjs` in `scripts/`,
`test/`, and `swarmforge/scripts/`. Check these paths even though the product
`tsconfig.json` includes only `src/`. Enable Clojure support for relevant `.clj`
work when its server is provisioned. Use ordinary reads for unsupported `.bb`.
Do not add a language adapter or alter the product build to make indexing work.

Exclude nested `.worktrees/`, dependencies, generated output, vendored source,
caches, and runtime receipts from routine Serena exploration. Keep authored
tests and process code available. These exclusions must not filter ownership
queries or prevent ordinary reads of a task-relevant excluded file. Indexing
may prime the project once; it is not a per-handoff requirement. After external
edits or checkout, use current results. Refresh or fall back if results are stale.

Replace recursive reference traversal in `role-agent-instruction.bb`. Startup
must read the constitution, every constitution article, the assigned role
prompt, handoff rules, and the shared tool-use rule. Follow explicit required
instruction includes, once per resolved path. A file path, example command,
source citation, or historical link alone is not an instruction to read a file.
Read the current scope and mode rules when selecting a task, then only the
selected task's contracts, program, and applicable verification rules. Keep
conditional role duties intact. The launcher must not preload other roles,
historical programmes, all feature files, or the full registry through references.
A missing required instruction is an explicit error, not a silently omitted rule.

## Ownership query contract

Provide `node scripts/verification-ownership-query.mjs` with two operations:

- `path <repository-relative-path>` explains current ownership. Include owner,
  slice or parent fallback and reason, exact declared consumers, direct checks,
  and the authoritative manifest entry or legacy registry location. Distinguish
  direct checks from prerequisite and consumer checks. A proposed file can match
  an existing declared prefix; report whether the file exists. This is an
  advisory answer from the current registry, not approval for new ownership.
- `changes --base <commit> --task <task> --pack <id> ...` explains the committed
  change from that ancestor to current HEAD. Use the canonical change set and
  exact readiness/planning APIs, including old and new rename paths, base/current
  ownership union, properties, prerequisites, consumers, quarantine, and current
  dispositions. Preserve the readiness classification, next stage, reasons for
  expansion, and terminal obligations. Existing `intent` preflight remains the
  command for planned work and proposed ownership prefixes.

Default output is concise text. `--json` gives the same answer in structured
form. Both identify the absolute worktree, HEAD, registry content identity,
query mode, dirty state, and base when used. List all selected pack and slice
identities and all blocking restrictions. Show counts and at most ten entries
per check or consumer list, with the omitted count and an expansion command.
`--expand slice:<pack>/<slice>`, `--expand consumers`, or `--expand checks`
returns the requested complete detail, including provenance. Reject an unknown
expansion target. Do not dump source bodies, receipt bodies, or unrelated packs.

Current path queries may report valid uncommitted registry content, clearly
marked as such. Exact change queries require the current registry inputs to
match HEAD. Uncommitted source changes are reported as excluded from the
committed query; never describe that answer as covering the working tree.
Reject an invalid/non-ancestral base, invalid path, ambiguous owner, stale
generated registry, or missing authority with a specific nonzero error. A valid
unowned path returns explicit `unowned`, with no invented owner or safe-scope
claim. No query launches checks, updates an index, compiles registry files,
records evidence, changes quarantine/dispositions, or writes repository state.

Reuse `verification-registry/loader.mjs`, the ownership resolver, canonical
change-set/history APIs, and readiness/planning APIs. Do not copy their decision
rules into a second planner. Keep Git/CLI IO separate from result presentation.
No database, persistent query cache, new MCP server, or Serena fork is required.

## Development focus and QA impact

Development focus has three direct groups: ownership-query CLI behavior against
real temporary Git registries; role launch/project binding and offline fallback;
generated startup reading instructions. Acceptance steps must execute those
production boundaries. Fixtures can replace an external MCP process for failure
cases; source-string assertions alone cannot prove launch or query behavior.
The contracts are `features/swarmforge-serena-development-tools.feature`,
`features/swarmforge-serena-startup-reading.feature`, and
`features/verification-ownership-query.feature`.

QA impact forecast: `shell` and `verification_process`, including the existing
`swarmforge-handoff-control`, `registry_inventory`, `ownership_impact`,
`historical_planning`, and `task_batching` boundaries as selected by exact paths.
Check existing role lifecycle/process contracts if their boundaries change.
Do not edit planner policy to keep this forecast small.

Likely existing shared paths: `swarmforge/scripts/role-agent-instruction.bb`,
the launcher call site in `swarmforge/scripts/swarmforge.bb`, the constitution
project article, `swarmforge/toolchain.lock.json`, the toolchain checker,
`.gitignore`, and the two pack manifests. Read-only API dependencies are
`scripts/verification-packs.mjs`, `scripts/verification-ownership-readiness.mjs`,
`scripts/verification-ownership-readiness-core.mjs`, `scripts/verification-registry/`,
and `scripts/verification-planner/`. List these as changed paths only if edited.
No stopped Serena implementation candidate exists to replay.

Proposed boundaries below are intent forecasts, not installed ownership. Exact
source paths include their feature, handler, and direct test files. No product
pack is a declared consumer merely because its code can be queried.

| Proposed source prefix or exact path | Parent pack / subordinate slice | Exact consumers |
|---|---|---|
| `scripts/verification-ownership-query/` and `scripts/verification-ownership-query.mjs` | `verification_process` / proposed `ownership_query` | none; the CLI is a read-only leaf |
| `swarmforge/scripts/serena/` and `.serena/project.yml` | `shell` / proposed `serena_development_tools` | `shell/swarmforge-handoff-control`, for worker launch |
| Shared usage prompt under `swarmforge/scripts/shared-articles/` | `shell` / existing `swarmforge-handoff-control` | existing `verification_process/reliability_run_intent` and `verification_process/evidence_promotion` |

Use exact file registration for a project MCP config if that route is needed;
do not claim ownership of the full `.codex/` directory or modify user-global
settings. Validate effective configuration in the actual role launch context.
The coder must run read-only intent classification before implementation.
`coarse-boundary` requires independent ownership preparation. Bounded
`granularity-assessment-required` or `coarse-within-pack` requires the existing
structured judgment; it does not automatically authorize a preparation project.
Use conservative base/current evidence until a reviewed refinement is eligible.

## Completion and live use

Forecast: four elapsed hours for setup, helper, and focused implementation
evidence. At two hours, expect a working query and a worktree-bound server smoke
check. At halfway and at the ceiling report variance, remaining work, confidence,
and revised forecast; continue bounded safe work under the current QA rules.

Before claiming the pilot is enabled, exercise the installed Serena connection
in each role's worktree. Confirm the correct project and current definition and
reference results for a product TypeScript symbol and an authored process `.mjs`
symbol. Exercise one external-edit refresh and the ordinary-tool fallback. Record
the pins, effective tool list, supported language coverage, and setup time once.
Restart existing sessions only at an idle or safe task boundary; do not claim
that a config edit refreshed a running worker. If Serena cannot be enabled, keep
normal development available and report the pilot setup as incomplete.

Then use it on naturally requested product and process tasks. Add one short
`helped`, `neutral`, or `impeded` observation and a concrete reason to the existing
delivery report when relevant; record setup or recovery delay. Use available
timestamps/token totals without requiring extra collection. Do not hold a task
open for an observation, invent a saving, replay work, or wait for a task quota.
Keep useful uses, adjust the specific source of friction, and disable optional
Serena use if repeated failures cost more effort than it saves. No new gate.

## Research basis

Official sources checked on 2026-09-05: Serena [tools](https://oraios.github.io/serena/01-about/035_tools.html),
[Codex setup](https://oraios.github.io/serena/02-usage/030_clients.html#codex-cli-and-app),
[indexing](https://oraios.github.io/serena/02-usage/040_workflow.html#indexing),
[memory controls](https://oraios.github.io/serena/02-usage/045_memories.html#disabling-memories-and-onboarding),
[configuration](https://oraios.github.io/serena/02-usage/050_configuration.html),
[language file matching](https://github.com/oraios/serena/blob/main/src/solidlsp/ls_config.py),
and [Codex MCP configuration](https://developers.openai.com/codex/mcp).
These support capability and setup choices, not a measured local speed claim.

Specification check: the vendored APS parser accepted all three feature files
(17 outlines, 78 example rows). The IR-DRY check found no remaining findings
after two wording overlaps were corrected. Shared setup is in each Background.
No acceptance mutation or implementation test was run in the specification phase.
Implementation and installation remain pending. The approved handoff starts
`serena-development-pilot` from this specification commit on QA.
