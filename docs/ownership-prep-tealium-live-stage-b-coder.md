# Tealium preparation Stage B coder record

Task: `ownership-prep-tealium-live`. Specification base:
`fceab38a0880109df317b2d9d8e439875901fbc9`.
This is behavior-preserving background preparation. Tealium remains inactive.

## Change and bounded disposition

`src/background.ts` calls repository startup before registering side-panel
commands. `src/background/repository.ts` retains the real repository open and
error report. `src/background/side-panel.ts` retains action and command callbacks,
synchronous gesture-bearing opening, active-tab fallback, and focus after open.
Module import alone does not start work. No message or connection listener is
added. There is no unused registration abstraction.

The canonical declaration gives `src/background/` the same composition boundary
as its entry. The background slice owns the direct runtime and ownership tests.
Its 12 consumers are capture, command-palette, defects, durable_project_repository,
event-library, hotkeys, live_flow_testing, project_event_transport,
project_management, replay, schemas, and verification_process. Shell remains the
owner. Each production path retains its terminal-full obligation.

Disposition: conservative parent fallback for this preparation range. The
pre-change intent selected 13 packs and 824 tasks. Background startup and host
messaging serve these installed consumers, so this extraction cannot justify
removing them. The new local slice can describe future changes after independent
review, but current/base union must cover this range. Another preparation would
add cost without a separately observed narrower runtime boundary. This small
extraction is reversible and leaves every product behavior and permission intact.
Reconsider only if measured task cost and a separately tested consumer boundary
supply new evidence. Task counts and estimates are not runtime proof.

## Checks and limits

The expanded direct test first failed on the absent extracted module. It invokes
compiled production composition and real registered callbacks through controlled
Chrome and IndexedDB capabilities. It checks startup order, failed repository
open, action and command gestures, delayed focus, missing ids, empty fallback,
and rejected focus delivery. It rejects any new message or connection listener.

The ownership check first rejected its unregistered test path. It checks exact
host consumers, both extracted paths, complete old runnable-pack and terminal
identities and the unchanged non-runnable catalogue. A separate candidate diff
checks byte-equal manifest/build files without forbidding later approved product
changes. Its first draft tried to execute the non-runnable catalogue entry; that
fixture error was corrected without changing coverage. Existing Stage A
registration conservation also passes. Installed compatibility still requires
fresh focused host evidence and package proof; mocks alone are insufficient.

## Independently reviewed later product sequence

The specifier must reissue `tealium-live` only after final preparation review and
implementation-bearing QA integration. Keep the same stable product task across
these two review stages:

1. From the exact accepted preparation head, implement the approved product
   modules, tests, utility declarations, and delivery declarations while leaving
   `manifest.json` unchanged. Establish the exact private Tealium prefixes and
   consumers. Deliver the real local DevTools HTML resource at an identical
   source/destination path through `build-delivered-dependencies.json`, and make
   the needed background registration through the existing composition entry.
   Independently review and integrate this registration/delivery candidate into
   QA with its canonical bounded plan. The packaged DevTools entry remains
   inactive until the second stage. Do not claim final source-navigation delivery.
2. Use that exact implementation-bearing QA head as the activation base. Change
   only the root manifest's `devtools_page` field to the already delivered local
   HTML resource. Keep verification scripts, registry, build policy, delivery
   declarations, and every other manifest field unchanged in this range. The
   canonical Git adapter must prove its field delta and accepted-base policy;
   an intent path query alone cannot prove it. Independently review this range,
   verify real DevTools navigation and all required product runtime scenarios,
   and integrate into QA before claiming product completion.

If the second stage needs a policy or registration correction, finish and
independently integrate that correction with the manifest unchanged, then rebase
activation on the resulting accepted head. Do not combine policy introduction and
manifest narrowing or weaken the adapter. Root and package loading retain the
existing build route. Master promotion remains a separate user-requested gate.

Preparation touch paths are the background entry, its two private modules,
compiled counterparts, the background test and ownership helper, Shell declarations, generated
registry, and this record. The manifest, build, permissions, and other product
sources remain unchanged. Final review evidence and measured cost are recorded
separately against the exact committed candidate.

The first review prelaunch stopped because adding a standalone Shell task changed
the authenticated historical consumer-plan digest. The same ownership assertions
now run from the existing background task through a small helper. This preserves
the accepted task identities and assertions without changing historical authority.
No check executed in the stopped review launch.
