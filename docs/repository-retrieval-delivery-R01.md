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
| Architect | Pending | Pending |

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
