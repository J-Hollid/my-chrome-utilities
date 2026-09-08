# Utility page boundary assessment R01

Status: investigation complete; retained-page design approved on 2026-09-08.
Date: 2026-09-08. Inspected QA: `3c276a37` plus the uncommitted preparation draft.
Method: production source inspection and current browser documentation.
No browser prototype, production change, or complete verification run was made.

Subsequent user decision: retain loaded utility pages and working state when
switching workspaces. No automatic unloading or hidden-page eviction. Active
work continues under its existing stop/target rules. Recurring utility changes
must use a focused route without unrelated broad test families. The current
binding requirements are in `utility-tab-expansion-boundary-R01.md`; the option
comparison below remains the investigation record.

## Current behavior

`src/workspace-tabs-ui.ts` changes `panel.hidden`, selected state, focus, and
stored selection. It does not start, suspend, or dispose a utility on selection.
`side-panel.html` contains both utility workspaces and loads shared Data Layer,
Schema, brand, and host styles. Document queries and global key handlers share
the same document. A hidden panel is a presentation state, not a runtime boundary.

`src/side-panel.ts` starts the installed Data Layer runtime and disposes it on
`pagehide`. `src/data-layer-installed/runtime.ts` imports the utility modules,
opens durable Data Layer storage, then constructs workspace navigation and the
other controllers. Startup thus remains coupled even though module entry points
exist. `capture/index.ts` disposal removes target and permission listeners,
clears scheduled refresh, and stops live capture.

The existing storage adapter checks owned keys, but its backing storage belongs
to the extension origin. Separate HTML files do not create separate permissions
or private storage automatically. [Chrome storage boundaries](https://developer.chrome.com/docs/extensions/develop/concepts/storage-and-cookies).

## Options

| Option | Benefit | Limitation |
|---|---|---|
| Keep all workspaces in one document | Least immediate change; running capture survives selection | Shared styles, document, startup, and runtime lifetime |
| Load modules on first use in the same document | Less unnecessary startup; explicit mount and dispose | Still shares document and global styles; Shadow DOM would only address part of this |
| Navigate the side panel to a different utility page | Separate document, styles, globals, and entry module | Replaces the previous document; its active work and drafts need an explicit lifetime |
| Keep a small host and embed utility pages | Separate utility documents with persistent outer navigation; an active page can remain mounted | Frames need explicit focus, messaging, resource, and lifetime rules |
| Launch a full-width utility page | Strong fit for editors and diff/merge work; independently testable | It is another surface; target identity and shared sessions need explicit handling |

Chrome can select a local side-panel page with `sidePanel.setOptions`. Its
`tabId` means a browser target tab, not a TWA workspace tab. This API alone does
not define application workspace navigation or preserve an outgoing page's work.
[Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel).

An iframe has its own document and window. Same-origin frames can still access
each other, and a separate frame does not promise a separate browser process or
protection from a CPU hang. Hiding a frame does not itself suspend its script
work or send a visibility change. [Frame documents](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe),
[page visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API).

## Recommendation for this preparation

Choose a separate HTML entry page and entry module for each new top-level
utility. Keep the side-panel host responsible for navigation and launching.
Prefer a small embedded utility entry page when the panel needs live controls;
open heavy workbench UI in its own full-width page. This is a recommended design,
not a requirement to build every surface before Tealium can start.

Assess and prove this boundary in the ownership preparation. Test a controlled
Probe page both independently and through the production host. Keep existing
Data Layer subviews together. Do not migrate every Data Layer controller, move
capture to a background worker, or rewrite Hotkeys merely to introduce the new
page contract. The existing Data Layer host may remain a legacy adapter during
this preparation, with its unchanged capture lifetime explicitly preserved.

Use these acceptance conditions:

- Probe loads its own assets without importing Data Layer implementation.
- A broad style or duplicate element ID in Probe cannot alter sibling controls.
- A Probe startup exception leaves outer navigation and existing capture usable.
- A utility is loaded when needed; hide, close, unload, and stop are distinct.
- Changing workspace leaves an active capture job running. Idle presentation
  work can stop on hide. Reopening does not duplicate jobs or listeners.
- Opening a workbench carries the bound website target. The new extension tab
  never becomes an implicit observation target. Each job has one owner even if
  the same utility has more than one visible surface.
- Host/page communication uses declared messages, validates source and target,
  and does not reach through another utility's DOM or call its private globals.
- Namespaced storage, draft saving, focus transfer, and global command access
  remain explicit. A frame boundary cannot supply these contracts by itself.

These are structural fault boundaries for trusted utility code. A sandbox for
executing user-edited or retrieved JavaScript is a separate decision: Chrome
sandbox pages lose direct extension APIs and need a message bridge. This task
does not execute Tealium code in the extension UI or add that sandbox.
[Chrome sandbox pages](https://developer.chrome.com/docs/extensions/reference/manifest/sandbox).

## Effect on verification

Separate pages give each utility a real entry point for installed tests. Host
tests cover navigation, page loading, focus, target passing, messages, and job
continuity. Utility tests cover utility behavior. This supports narrower owners,
but the registry must still declare and prove them; HTML separation alone does
not change the canonical task plan. Preserve shared and terminal obligations.

The next implementation decision must compare the bounded plan for a page host
with the current show/hide host. Report the migration cost separately from later
utility additions. The earlier four-hour preparation allowance is still an
unvalidated estimate, not evidence that the page boundary fits that time.
