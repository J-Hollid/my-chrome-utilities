# Serena pilot: coder report

This is tooling and workflow work for QA review. It does not change extension
behavior or claim release completion. Received specification: `268279a9bf`.

The candidate adds isolated optional Serena launch, explicit required startup
reading, and a read-only canonical ownership query. Core toolchain and root npm
lock bytes stay unchanged. Setup instructions are in
`swarmforge/scripts/serena/README.md`.

The pinned Serena revision is `13ac8c5b1d51873bd148aea440dcb22f85d3a439`.
The source archive SHA-256 is
`d67390e4e2cedc99a17ee04922fe7a3bc13ed7f7699f3eea2f20f440c84b9cb7`.

Live setup checks on 2026-09-05 connected separate stdio servers in the main
specifier checkout and the coder, refactorer, and architect worktrees. Each
connection exposed exactly five allowed tools and returned a definition and
references for `mountInstalledDataLayerRuntime` in product TypeScript and
`verificationOwnerForPath` in process `.mjs` code. The coder check also observed a
current function body after an external edit and restored the edited file.

The three other role worktrees used temporary candidate configuration overlays.
Those overlays were removed and their prior runtime configuration was restored.
No existing role session was restarted. These checks prove installed tools can
connect to each assigned tree; they do not prove existing sessions have adopted
new settings. Clojure remains unprovisioned. Babashka `.bb` uses ordinary tools.

Setup and correction took about 40 minutes before the candidate verification
stage. The first installation used the wrong upstream language-server directory.
The corrected provider uses the pinned release's `ts-lsp` directory. Initial
process reference results were empty until the separate `.mjs` project file was
added. One specifier connection returned no references; a fresh connection passed.
These are setup observations, not a performance benchmark or proof of time saved.
The pilot effect during this task was **impeded** by setup and recovery.

The query reuses registry loading, ownership resolution, historical planning,
quarantine restrictions, and readiness classification. It neither runs checks
nor writes evidence. Default text and JSON show at most ten check and consumer
entries, with explicit expansion commands. Committed-change mode excludes source
edits and rejects registry content that differs from HEAD.

The three contracts contain 17 outlines and 78 example rows. Direct tests cover
real command invocation, four launch roots, missing tools, server failure,
timeout, required includes, canonical ownership history, ambiguity, stale
registries, read-only execution, and output limits. Generated acceptance tests
passed for all three contracts. Registration checks prove their specific handlers
run before general handlers and reject changed example relations.

What worked: small adapters let optional failures preserve task delivery. Actual
language-server checks found the `.mjs` configuration gap before review.

Process failures: the first setup assumed an upstream directory name. A registry
registration initially treated process tooling as product source. The direct
cardinality test found this; the inputs now retain verification-only ownership.

Refinements: retain the setup commands and the live-check limitations in this
report. Use a fresh connection or ordinary files when references are doubtful.
Record helped, neutral, or impeded only during future work requested by the user.
