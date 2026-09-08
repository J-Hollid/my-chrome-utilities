# Repository retrieval delivery R01

Task: `repository-retrieval-defaults`. Mode: focused review for QA.

The command provides bounded file discovery, literal search, and text reads.
It reports source positions, completion, and a quoted continuation command.
`read <file> --full` returns a complete required instruction without approval.
The command writes no index, cache, runtime state, or telemetry.

The approved root instructions are installed with one helper usage paragraph.
The existing startup adapter requests one safe-boundary read only if the current
root instructions were not already supplied or read. Role prompts and the MCP
protocol are unchanged.

Instruction delivery and observed use are separate claims:

| Role | Current session delivery | Observed helper use |
|---|---|---|
| Coder | Explicit full read observed | One full AGENTS.md read, followed by scoped repository reads |
| Specifier | Pending | Pending |
| Refactorer | Pending | Pending |
| Architect | Explicit full read observed at review | One scoped helper search; no matches |

The coder's first smoke test proves one observed call. It does not prove
permanent compliance. Other sessions remain Pending until their effective
input or explicit read is observed at a safe boundary. No busy role was
restarted, and no product handoff was interrupted.

Fixture checks exercise all four role routes through the production startup
adapter and preserve each complete role and required includes. These are
fixture results, not proof that the four live sessions reloaded instructions.

Retrieval assessment: helped. The helper answered scoped instruction and
registration questions without a repeated result representation. An earlier
direct scope read was too large; later calls used bounded or targeted reads.
Serena could not inspect Clojure with the active TypeScript server, so one direct
read supplied the needed startup code. Use filename discovery before uncertain
paths and use symbol tools only where the server supports the language.

Focused evidence and package results are recorded in the exact candidate's
review evidence. No all-runnable-pack or master integration claim is made here.

The received QA base also contains the two observation-source contracts. Their
implementation was sent separately for review at `0030725425`; it is preserved
on `coder-project-multiple-observation-sources-review-0030725425`. This task
registers those base contracts as planned under Project Event Transport until
that implementation joins QA. The retrieval branch does not claim their runtime
proof. This registration adds the owning pack to the conservative focused plan.

Prelaunch also required the existing authenticated Shell consumer-plan digest
to include the registered retrieval checks. Its replacement was calculated with
the production planner and canonical digest function. The declaration's source,
task, and code identities remain unchanged. No prelaunch rule, incident, receipt,
or recorded authority was removed. Direct identity checks cover this update.

Architecture review separated the reusable instruction fixture from its unit
test. The pending-activation probe now checks generated startup guidance without
requiring the live delivery report to keep the architect Pending. This preserves
the difference between a fixture case and observed session activation.

Serena reference queries found both consumers of the extracted fixture. A scoped
helper search returned an explicit no-match result. Retrieval assessment: helped
for the bounded search; earlier combined direct output was too large. Use smaller
independent output budgets for the next review.

The architecture checks detected all eight selected Clojure mutations. After the
expected-result repair, the one changed mutation site passed again. Soft Gherkin
mutation found eight missed checks: four keyword-keyed expected results and four
unknown instruction routes. The repairs detected all 16 mutations in the affected
scenarios; seven earlier passing mutations were reused by the tool. DRY found no
duplicate candidates. No JavaScript mutation tool is pinned for these modules.

The review preserves inward dependencies, hidden query and page representations,
read-only IO, and separate test helpers. No production TypeScript changed. The
focus remains the existing Shell and Verification Process owners for the review
changes. Exact focused evidence and package proof are bound in the Git review
note for the final candidate.

What worked: mutation exposed missed acceptance checks before QA forwarding.
Process failure: the first fixtures accepted unrecognized routes and did not
check keyword-keyed expected results. Refinement: keep test cases independent of
live status reports, and check the actual example representation at the runtime
boundary before the first evidence run.
