# Serena initial-instructions QA scorecard

Task: `serena-initial-instructions-repair`.
Specification base: `35db9b1560b14d8d399b1ce087999ec7cab04401`.
Accepted implementation: `b17ad7b4e7ed6a14cf96702ce2cdc6ee6fb30f94`.
Final review base: `f21a7590a491a44823776e0d4e247aeb8bd508b0`.
Architect handoff: `20260907T152822Z_000898_from_architect`.
QA integration: 2026-09-07 15:30:45 UTC, from the QA reflog.

Serena now exposes `initial_instructions` in the server and client filters.
The offline refresh updates existing owned configuration and retains the pinned
installation and unrelated settings. Launch and server startup use that refresh.
The regression detects the missing dependency directly and rejects initialization
alone as proof of usable tools. The server remains optional and read-only.

| Measure | Result |
|---|---|
| Coder review evidence | 196/196 selected tasks passed; 17 min 11.885 s |
| Final architect evidence | 170/170 selected tasks passed; 10 min 53.942 s |
| Exact owners | Shell and verification process |
| Final properties | Five property tasks passed |
| Final package | Fresh package passed in 1.093 s |
| Evidence identity | Both bound reviews validated; both raw receipt hashes matched |
| Live setup proof | Four assigned worktrees passed the actual instruction-to-symbol sequence |
| Language mutation | 18/18 selected sites detected |
| Handoff to QA | 1 h 31 min 25 s total elapsed time |
| Initial implementation commit | 13 minutes after handoff; later repair and review still required |
| Terminal gates / master promotion | None |

The coder handoff started at 13:59:20 UTC. The next handoffs were at 15:06:24,
15:09:30, and 15:28:22. These give elapsed role intervals of 1 h 7 min 4 s for
the coder, 3 min 6 s for the refactorer, 18 min 52 s for the architect, and
2 min 23 s for the specifier through QA integration. No between-turn approval
wait was found in those implementation and review session records. These are
elapsed intervals, not measured coding effort. The two accepted verification
runs total 28 min 5.827 s and are already included. Client activation after QA
is a separate operational interval. The 60-minute delivery expectation was
exceeded; the report records the specific repair work.

What went well: all four pinned connections completed initialization, tool
listing, initial instructions, and an authored-code symbol query. Reviewers
repeated live checks in their own worktrees. Direct regression coverage catches
the missing setup tool even when generated lists agree with each other.

Where the process failed: the old checks proved connectivity without usable
tools. The first review then found an overwritten legacy observation and a
missing Shell browser producer. Both were repaired with the existing causal
route. The architecture mutation run needed direct handler dispatch to expose
two state mutations. Incident `38fec0e7-b140-4615-8012-1df18720c09e` retains its
terminal-deferred obligation; QA integration is not a terminal resolution.

Recommendation: retain the complete setup-sequence check and preserve older
observations when adding new evidence. Measure useful symbol work during ordinary
development before claiming speed or token savings. Complete the authorized
connection refresh at the idle boundary and record actual client tool delivery.

## Client activation

After QA integration, coder, refactorer, and architect had no active or queued
handoff, command, or progress lease. Existing Codex command lines still carried
the old five-tool filter. Activation preserves the exact saved conversations,
model settings, sandbox, and approval settings. It performs no software update.
The new six-tool client lists must be observed before claiming activation.

The actual `/mcp verbose` display confirmed the six tools, including
`initial_instructions`, in the refactorer at 15:39:38 UTC, coder at 15:40:55,
and architect at 15:41:57. Each resumed its exact existing session without a
new work prompt. A Codex update offer was skipped. Long conversation loading
and terminal input timing delayed the first confirmation; no package update
or repeated implementation verification was used to resolve that delay.

The specifier connection is the current reporting session. Its refresh is
prepared to run only after this exact turn completes and its queue and activity
are idle. A new turn cancels that pending action. Its result will be recorded
at `tmp/serena-client-refresh/specifier-result.json`; until that record exists,
specifier activation is pending. The three observed client results are in the
same directory. Configuration and four-worktree live proof are already accepted.

Codex defines `enabled_tools` as the client allowlist in the
[official MCP documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli).
The actual resumed client display, rather than generated configuration alone,
is the activation check here. No speed or token saving has yet been measured.
