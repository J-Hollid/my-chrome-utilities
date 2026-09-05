# Serena pilot architecture review

Task: `serena-development-pilot`. Received candidate: `9a811cdebe`.
Approved specification base: `268279a9bf`. Review started at 21:13 UTC on
2026-09-05. This is tooling and process work for QA integration.

The complete candidate diff implements the three approved boundaries: optional
Serena launch, required startup instructions, and the ownership query. It uses
the QA-integrated optional-tool preparation. Extension source, the core checker,
and the root toolchain and npm locks retain their bytes.

The review covered separation of IO, dependency direction, information hiding,
and local code quality. Installation, pin inspection, server transport, worker
launch, and configuration have separate modules. The launcher extracts its Codex
command construction into a small module. The query separates Git and registry
IO from explanation and presentation. It calls the canonical ownership,
history, quarantine, and readiness APIs. It does not run verification or write
query state. Historical source and task identities remain conserved; the
blocked-consumer plan digest and acceptance succession update match the added
task closure and retain the existing source authority.

The incoming exact review record passed 180 tasks in 12 min 44.036 s.
Architecture checks detected 167/167 Clojure and Babashka mutations and
160/160 soft Gherkin mutations across the three active contracts. The command
construction module passed its baseline and had no mutation sites. The pinned
tools wrote all mutation records. No record was edited by hand. The strict
runtime check and registry compilation check passed. The project has no pinned
JavaScript mutation tool; Clojure results do not cover JavaScript modules.
Architecture changes add generated mutation records and this report. No code
repair was needed. The final candidate requires its own focused record after
these additions; the incoming record does not cover the new commit.

The pinned DRY check found three pairs of identical five-line transition
functions. These functions verify their own contract, validate its example
relation, and set its state key. Retain this short wiring in each independently
owned handler. A shared cross-pack helper would add a dependency for this small
amount of code. Tests and fixtures remain separate from production modules.

The installed Serena connection in the architect worktree returned the five
allowed tools, a ready TypeScript server, current definitions, and references
for `mountInstalledDataLayerRuntime` and `ownershipQuery`. A scoped outline also
showed the two query functions. The Codex CLI read the effective absolute
worktree and tool allow list from the actual launch settings. Optional startup
and tool allow lists are documented in the
[official MCP configuration reference](https://learn.chatgpt.com/docs/extend/mcp?surface=cli).
The coder report records separate installed connections in all four worktrees
and an external-edit check. Those checks do not restart existing sessions.
Clojure remains unprovisioned; use ordinary tools for `.clj` and `.bb` files.

The pilot was neutral during this review: symbol queries confirmed the caller
boundary, but the full candidate diff was still required. One initial query
used an incorrect product path. File search supplied the correct path and the
next query passed. No setup download or session restart was needed.

What worked: the small adapters and canonical planner reuse made the boundaries
clear. Actual server and CLI checks confirmed the worktree binding.
Process limitation: existing sessions do not adopt new MCP settings until their
next launch. No time or token saving is claimed. Retain the bounded fallback
and use a fresh connection when results are doubtful. Record future tool-use
observations only during requested work.

QA integration remains separate from release completion. Existing deferred
incidents and terminal obligations remain for the user-requested release gate.
