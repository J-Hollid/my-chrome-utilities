# Tealium Live automatic metadata verification R01

Task: `tealium-live-metadata`. User-approved 2026-09-10.
Required behavior: `docs/tealium-live-metadata-R01.md` and its named contracts.
Preserve the existing installed-proof rules in
`docs/tealium-live-verification-R01.md`; this document replaces that task's
historical path forecast and eight-hour allowance for this follow-up only.

## Development focus

1. `test/tealium/detection/reader-test.mjs`: identity and environment from local
   evidence, including the pinned real fixture and custom delivery paths.
2. `test/tealium/live/model-test.mjs` and a small imported metadata check:
   strict parsing, joins, fallback, duplicate requests, and lifecycle rejection.
3. `test/tealium/live/browser-test.mjs` and a small imported metadata case:
   production automatic retrieval, rendered names, permissions, and failure.

These are initial red/green targets. Use the failing leaf during correction.
Split independent metadata code and checks into small modules under the
existing detection and Live owners. Do not extend the owner into an HTTP parser
or duplicate the generic acceptance runner. Add real handlers for the appended
scenarios under the existing Tealium acceptance sessions.

## Ownership intent and expected QA impact

Canonical read-only path queries at QA `4322eaf783` used registry digest
`d3f8e10ed4886974c2ce4b610a8307f85078ab0b943ed8988c78d9f7fbf68fa7`.
`src/tealium/live/owner.ts` selected 20 checks in `shell.tealium_live` with no
external slice consumers. `src/tealium/detection/types.ts` selected 45 checks
across `shell.tealium_detection`, `shell.tealium_live`, and
`shell.tealium_devtools`, including build. Package adds one task.

Forecast: **45 selected Tealium/Shell tasks plus package, 46 total** under the
current registry. This is an advisory scope, not evidence or a fixed cap.
The detection types are consumed by Live and DevTools, so preserve that closure.
No unrelated DataLayer pack, shared host, manifest, or verification-policy change
is expected. Recompute from the actual diff; include every canonical consumer.

| Likely path or prefix | Parent and slice | Exact consumers |
| --- | --- | --- |
| `src/tealium/detection/page-reader.ts`, `types.ts` | `shell.tealium_detection` | `shell.tealium_live`, `shell.tealium_devtools` |
| `src/tealium/live/owner.ts`, `session.ts`, `render.ts`, `index.html`, `live.css` | `shell.tealium_live` | no external slice consumers |
| Proposed `src/tealium/live/metadata/` | existing `shell.tealium_live` parent prefix | the retained Live owner and rendered metadata view |
| Proposed `test/tealium/live/metadata/` | existing `shell.tealium_live` test prefix | existing Live model/browser entry points |
| Detection/Live feature files and existing acceptance step modules | respective existing Tealium slice | registered acceptance sessions and runtime adapters |

Before coding, the coder must run the read-only ownership intent with the exact
received specification base, stable task, complete likely paths, forecast Shell
pack, and proposed prefixes. Use the current helper argument contract. No
combined intent result is claimed here. Preserve mandatory coarse-boundary
routing and bounded granularity judgment. Do not weaken ownership to keep the
forecast count or start broad preparation without an actual classified need.

## Required proof

Use controlled network responses for repeatable checks. Valid metadata must
come from independent fixture input, not copied expected table values. Exercise
the production extension-context fetch with the fixed endpoint intercepted by
the test browser. Include both side-panel and full-width views, current grant
and absent grant, grant/decline actions, delayed response, exact joins, unsafe
or empty data, bounded timeout/size failure, and explicit retry. Observe actual
request counts, response handling, rendered names, selection, and source state.
Hold the network response to prove fallback rows appear before it finishes.

Use the existing pinned real runtime to prove local account/profile/publish
identity under a custom path. Treat the environment as unavailable when the
fixture's overrides make its runtime path ambiguous and no explicit value is
available. Verify markup-like local and remote names as literal visible text.
Observe no extra lookup on repeated polls, utility switches, or expansion.
Verify late-result rejection after lifecycle changes and no update while paused.

One bounded public read without login is a separate smoke observation. The
investigation already proves the public endpoint for Tealium's docs profile.
If it is unavailable during delivery, report that limit and prove the specified
fallback; do not make external uptime a repeatable suite dependency or claim a
new public success. Never send tracking calls or request customer credentials.

After the first coherent candidate, run exact plan-only preflight. At settlement,
run the selected focused plan once with properties, changed-since the exact
handoff base, and `--prepare-evidence tealium-live-metadata`, including package.
Record evidence only after successful runner exit. Coder forwards to refactorer
and architect; only exact QA-ready evidence permits QA integration. All existing
terminal obligations remain separate. No all-pack feature gate is authorized.

Specifier checks are Gherkin parser and IR-DRY only. Do not claim runtime or
acceptance mutation proof from them. Report actual checks, timings, failures,
and any scope variance at delivery; use the program's 30/60-minute checkpoints.
