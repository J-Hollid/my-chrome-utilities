# Serena initial-instructions correction

Task: `serena-initial-instructions-repair`.
Specification base: `35db9b1560b14d8d399b1ce087999ec7cab04401`.
Classification: bounded tooling correction for QA review.

The shared allowlist omitted the setup tool required by the pinned server.
It now includes `initial_instructions` in the project, global, and generated
Codex client filters. Editing, shell, project switching, memory, and onboarding
tools remain excluded. The server remains optional and the project read-only.

The new offline refresh uses the existing Babashka YAML reader. It changes only
owned settings, preserves other settings, checks the installed pin, and is safe
to repeat. Role launch and server startup use it before starting the connection.
It does not download or install software. A refresh failure preserves ordinary
task delivery with a specific fallback reason.

The explicit connection check initializes the server, checks its actual tool
catalogue, calls `initial_instructions`, then queries
`renderProjectLibraryPresentation` in authored TypeScript. It rejects a missing
filter entry, missing catalogue entry, instruction failure, or wrong symbol
path. A successful initialization alone cannot pass.

## Evidence and delivery limits

The launch regression first failed with the missing setup tool. Focused tests
then passed for all four role fixtures, repeated refresh, preserved installation
sentinels and unrelated settings, and eight sequence outcomes. Spawned launch
fixtures have a five-second limit. Sequence fixtures use fixed calls and no
browser. Generated Gherkin acceptance and registration checks passed.

`serena-initial-instructions-live-proof.json` records four actual pinned MCP
connections, their protocol, tool list, instruction response, installation pin,
and authored symbol result. These connections used each assigned worktree and
its separate Serena home. All four returned usable results. Owned project and
global configuration was refreshed in each worktree. Existing Codex role
sessions were not restarted; their client connections must receive the reviewed
configuration at the authorized idle boundary after QA integration.

Read-only intent selected 78 tasks under Shell and verification process. The
latter is the canonical registry owner and is within the specification forecast.
The exact committed plan and recorded review note are authoritative for handoff.
No all-runnable-pack gate, pin change, model change, or general verifier change
is part of this correction.

The first exact preflight selected 179 tasks. Review startup stopped before any
test because the stored Shell consumer-plan digest predated this registration.
Canonical comparison found only two added tasks: parse and generate for the new
Serena feature. No task was removed; the Shell session gained that feature.
The stored digest was updated to the canonical result. Its standalone ownership
preflight remains bounded under verification process. No incident or receipt
was edited, and the original source identities and prerequisites stay intact.

The first executing review exposed two evidence integration defects. The new
sequence record replaced the older server record for consumers that read the
last JSON line. The server test now emits both observations together. The Shell
session also selected the inherited companion contract without its existing
browser producer. That registered producer is now an explicit Shell session
prerequisite. Its standalone preflight is bounded to verification process;
no companion product code or general verifier behavior was changed. The stored
consumer-plan digest follows this one prerequisite addition. A fixed regression
executes the previous final output statement and compares the previous and new
prerequisite maps. Native repair evidence must pass before the next review.

## Process assessment

What went well: the actual pinned connection confirmed the complete dependency
sequence in every role worktree. The first regression directly detected the
missing tool instead of comparing two incomplete generated lists.

What failed: old checks proved connectivity and configuration agreement but did
not prove usable tools. Local YAML configuration also remained stale after code
changes. Both gaps are covered by this correction.

Recommendation: keep deterministic sequence tests separate from local live
proof, and refresh role connections only at idle review boundaries.

Serena was initially impeded by the missing setup tool. After reading its real
instructions, two symbol queries found the registry writer and its exact body.
That reduced module reading. The four live symbol queries are setup proof, not
a measured development saving. No speed or token saving is claimed.

## Architect review

Reviewed from `f21a7590a491a44823776e0d4e247aeb8bd508b0` on 2026-09-07.
The complete tooling diff passes module-boundary, dependency, information-hiding,
and local-quality review. The sequence validator is separate from configuration
IO and connection startup. Refresh preserves unrelated settings and performs no
provisioning. The two verification fixes retain the old observation and add the
required producer; they do not narrow evidence. The compiled registry matches.

The incoming 196-task receipt matched its recorded SHA256 and passed review
validation. A new separate architect connection also passed initialization,
tool listing, initial instructions, and the authored symbol query in this
worktree. It did not restart this or another role. The four recorded manuals
match apart from their assigned roots. Live checks are setup proof, not a
measured development saving. This session's existing client still has its old
filter; refresh all role connections at the specified idle QA boundary.

Differential language mutation rejected all 18 selected sites. Two handler-state
mutations required direct execution with the declared handler list instead of
the combined pack handler list. The tool wrote the manifest. DRY found no
candidates. Launch, four-role refresh, fallback, and sequence tests passed.
No feature contract changed after the approved specification, so Gherkin
mutation was not repeated. No TypeScript production source changed.

What went well: real setup proof confirmed that the missing dependency is fixed.
What failed: a combined acceptance dispatcher initially masked two handler-state
mutations. Refinement: use direct declared-handler tests for language mutation,
and complete the authorized client refresh only after QA integration and idle
role checks. The exact final review claim is recorded in the commit's Git note.
