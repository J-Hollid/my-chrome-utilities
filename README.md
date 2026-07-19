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

Create a portable zip archive:

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
source-path fragments. `dry4clj` compares the acceptance implementation and
its unit tests by default. Mutation scans require an explicit source file and
do not run mutation tests.
