# my-chrome-utilities

A small Manifest V3 side panel extension.

Current SwarmForge specification scope is recorded in
[`docs/swarmforge-active-scope.md`](docs/swarmforge-active-scope.md). Historical
data-layer correction programs are archived and are not implementation authority.

## Portable Build

Create the unpacked extension build:

```sh
npm run build
```

After building, create a portable zip archive from that same `dist` artifact:

```sh
npm run package
```

To move the extension to another machine, copy `build/package/my-chrome-utilities.zip`.
You can also copy the `dist` directory directly for unpacked testing.

On the target machine, open Chrome extensions, enable developer mode, choose
load unpacked, and select the copied `dist` directory.

Smoke test:

1. Open the extension side panel.
2. Click Commands or press Ctrl+K inside the side panel.
3. Run `demo.say-hello`.
4. Confirm the visible command log records that `demo.say-hello` ran.

## Debugging

Build the unpacked extension before debugging:

```sh
npm run build
```

In Chrome, open `chrome://extensions`, enable developer mode, choose
load unpacked, and select the `dist` directory.

After each code change, run `npm run build` again and click Reload on the
extension card in `chrome://extensions`.

Use the inspect links on the extension card to debug the service worker and
side panel. The generated source maps embed the TypeScript source, so DevTools
can open and breakpoint files under `src/` even though the unpacked extension
only serves files from `dist/`.

## Verification

Use direct unit or browser leaves while diagnosing and correcting a change. Once
the candidate is settled, run each affected verification pack once:

```sh
npm test -- --pack <pack-id> --changed-since <base-commit>
```

Changed paths select complete packs; they never reduce a selected pack to a
single unit test, feature, browser observation, or checkpoint. The runner builds
once for that invocation, executes every registered check in each selected pack,
and prints the path of its structured task receipt before execution. Deleted and renamed paths require
`--changed-since`, which binds both historical and candidate ownership.

Durable handoff evidence is deliberately a two-step operation after committing a
clean candidate:

```sh
npm test -- --pack <pack-id> --property --changed-since <base-commit> --prepare-evidence <task>
node scripts/verification-evidence.mjs record <printed-pending-file>
```

The evidence note binds the task, base and candidate commits, exact pack set,
canonical registry-derived plan and change set, locked runtime, build artifact,
and every passed task in the re-read raw receipt. Terminal CI uses four isolated
pack shards; each runner performs one local build before its `--no-build` shard.
The shard receipt validates and records that prepared artifact before package
acceptance instead of rebuilding it.
`npm run test:throughput` reports those four
builds, observation/checkpoint counts, shard balance, and timing from validated
completed receipts with conservative fallbacks.

During pack orchestration, `SWARMFORGE_PACK_RUNNER_OWNS_JS=1` makes the Babashka
unit and property lanes Clojure-only. Browser-backed feature replays remain
registered pack tasks; acceptance helpers may consume only an exact passed receipt
and fail closed instead of starting an unplanned Node/browser subprocess. A
standalone `bb test:unit` still runs the full legacy unit-plus-feature set. After
checkpoints complete, receipt-backed pack sessions run in the bounded worker pool
and report their independent failures together.

## Clojure Analysis Tools

The SwarmForge analysis commands use Clojure CLI with cache and configuration
stored under each worktree's `.swarmforge/clojure` directory.

```sh
clj -Sdescribe
crap4clj data_layer
dry4clj
clj-mutate acceptance/src/acceptance/runtime.clj --scan
```

`crap4clj` runs the Clojure unit coverage suite and analyzes the Babashka
acceptance implementation under `acceptance/src`. Optional arguments select
source-path fragments in the CRAP report. When the coverage suite reports test
failures but still produces a fresh LCOV file, `crap4clj` prints the selected
CRAP report and retains the nonzero coverage exit status; it never reuses stale
coverage. `dry4clj` compares the acceptance implementation and
its unit tests by default. Mutation scans require an explicit source file and
do not run mutation tests.
