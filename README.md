# my-chrome-utilities

A small Manifest V3 side panel extension.

Feature work starts from `qa`. Current product contracts are in `docs/` and
`features/`. SwarmForge records remain as history.

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

Run the checks that cover the changed code and behavior. For example:

```sh
npm run typecheck
npm run build
npm test
npm run test:portability
node test/twatility-projects-browser-test.mjs
npm run package
```

The browser test uses the installed extension in headless Chrome. Chrome must
be installed. A restricted container can block Chrome startup; run this test
with the required local permission. Keep a direct product result separate from
a check of the feature specification.

## Optional development tools

- Serena is installed locally and can help find TypeScript symbols. It is an
  optional read-only aid. The current Codex session may not expose its MCP
  tools; use `rg` or direct file reads then. Check the local install with
  `node swarmforge/toolchain/cli.mjs inspect serena`.
- `crap4clj` measures Clojure acceptance code through a fresh coverage run.
  Its local dependency is optional and is not installed in every worktree. It
  does not measure the TypeScript extension. Use it only for a Clojure change
  when the local tool is present.
- Headless Chrome tests are useful for installed controls and file transfer.
  Run a focused browser test after the unit checks. Keep browser proof as a
  direct test result; no SwarmForge receipt is required.

Legacy SwarmForge packs and receipts remain in the repository for historical
review. They are not a gate for ordinary feature work.
