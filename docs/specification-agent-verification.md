# Specification agent verification

Date: 2026-10-14. Branch: `feat/codex-specification-agent`.
Base: `decouple-swarmforge`, which contains `qa` and six later commits.

The feature adds a Studio agent control, a local Codex companion, five read-only
MCP tools, persistent review, Excel import matching, and export-template
conversion. New code is split by task. The existing Studio entry file delegates
its documentation and agent setup to a small integration module.

## Specification checks

| Check | Result | Scope |
| --- | --- | --- |
| `npm run typecheck` | Pass | TypeScript contracts |
| `npm run build` | Pass | Extension output and repository build checks |
| `node test/agent-specification-test.mjs` | Pass | Atomic apply, references, inheritance, matching, duplicate checks, local/source conflicts, decisions, field types, flow screenshot loading and retention |
| `node test/data-layer-documentation-template-excel-test.mjs` | Pass | Existing Excel template contract and renderer |
| `node test/data-layer-selective-profile-inheritance-test.mjs` | Pass | Existing Shared Profile selection model |
| `git diff --check` | Pass | Patch whitespace |

The feature scenarios are written in
`features/specification-agent-companion.feature`. They were checked through the
focused tests above and below; the full historical acceptance suite was not run.

## Runtime proof

| Check | Result | Limit |
| --- | --- | --- |
| `node test/agent-companion-test.mjs` | Pass | Real HTTP, MCP process, files, Excel rendering, auth, stop and recovery; fixed model output |
| `node test/agent-browser-test.mjs` | Pass | Installed Chrome control, revision, durable apply, reload, Excel upload, template preview and asset save; fixed model output and pregranted localhost access |
| `node test/agent-live-codex-test.mjs --live` | Pass | Real Codex 0.162.1 and ChatGPT Pro login; both source sheets read through MCP; four accepted changes, one export template, and a second-turn trigger revision |
| `node test/agent-tailscale-test.mjs --live` | Pass | HTTPS, token, and CORS through a temporary port on this host; no second-device proof |

The successful live test evidence is in the ignored workspace at
`tmp/codex-companion/live-test-1792009757110/evidence.json`. It records completed
MCP reads, source coverage, revisions, and output counts. It contains no token.
The Tailscale test removed its temporary listener and verified that the existing
Serve configuration was unchanged.

No claim is made that a live website sends these events. Source files in these
tests were generated fixtures. The screenshot body test checks loading and
retention; it does not measure the model's visual interpretation accuracy.
Chrome's native host-permission dialog requires a separate manual check.

## What went well

The existing canonical schema, draft transaction, durable asset store, and
template export contracts could be used directly. The browser test proves that
project changes and template bodies remain available after a page reload.
The real Codex test proves that the local subscription works through the bridge.

## Process failures and corrections

- The first live test accepted a proposal even though MCP reads had failed. The
  tool log exposed this false positive. The companion now pre-approves only its
  five read-only tools and requires successful reads for every populated source
  row. The repeated test passed with completed MCP calls.
- A later model response used a colon in a template ID. The structured output
  contract now constrains template IDs to safe characters. Invalid proposals
  get one repair attempt. The repeated live test passed.
- The headless browser could not operate Chrome's native permission prompt.
  The isolated test extension pregrants localhost access; this limit is explicit.
- One build was rejected because source edits continued during assembly. The
  final build ran after the edits stopped and passed.

## Refinement

Test a real project workbook and screenshot flow before broad use. Then check
the native permission dialog and connect from a second device in the tailnet.
Add those files as regression fixtures when their contents can be stored in the
repository. A later task-history screen can make older companion reviews easier
to retrieve; the current screen retains one task per project.

See [the setup and use guide](specification-agent-companion.md) for startup,
Tailscale, import review, template export, and recovery steps.
