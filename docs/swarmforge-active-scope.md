# SwarmForge active data-layer scope

## Current authority

The only active specification cycle is the interactive directional Flow graph
review checkpoint. Its active contracts are:

- `features/data-layer-directional-flow-specification-graph.feature`
- `features/data-layer-directional-flow-specification-graph-runtime.feature`

The checkpoint covers human Page and Event selectors, context-setting and
interaction occurrences, expected-next/alternative/parallel/merge relationships,
pointer and keyboard positioning, synchronized outline editing, stable references,
persistence/reload, and the explicit boundary that payload validation is independent
while journey expectations remain manual.

Schema composition, Assignment readiness, resolver redesign, documentation export,
fixtures, coverage, preflight, release, Live, cross-surface concurrency, and temporal
Flow execution are not active work. A future slice requires product-owner review, a
new approved specification cycle, and a new file-based SwarmForge handoff.

## Archived material

Detailed full-site R01, correction R02/R04, and later Flow specifications were
removed from the active tree on 2026-07-19. They remain available at:

- Branch: `archive/data-layer-r02-r04-specifications-2026-07-19`
- Anchor commit: `d346e89a4c98376b2e85ec48963c2b07af6fe3c0`

That snapshot contains all 60 behavior/runtime feature files from the completed
specification work. Master retains the two graph contracts named above and removes
the other 58: 28 full-site R01 files, 22 correction R02/R04 files, and eight
deferred Flow-slice files, together containing 545 scenarios. The archive also
contains 11 detailed program/assessment documents and 111 schema-editor or
side-panel walkthrough artifacts. These are reference material, not acceptance
authority.

Recovery examples:

```sh
git show archive/data-layer-r02-r04-specifications-2026-07-19:docs/full-site-data-layer-specification-correction-program-R04.md
git worktree add /tmp/data-layer-specification-archive archive/data-layer-r02-r04-specifications-2026-07-19
```

Unmerged experiments are preserved separately and must not be merged wholesale:

- `archive/r02-page-resolver-wip-2026-07-19`
- `archive/r02-refactorer-recovery-8e9-2026-07-19`
- `archive/r02-refactorer-recovery-2026-07-19`

Completed production, unit, and property-test improvements remain on `master` as
the installed-product baseline. Their presence does not activate the archived
program. Workspace-local untracked walkthrough files are likewise non-authoritative.

## Verification boundary

Use the dedicated `flow_graph` verification pack and its focused commands for this
checkpoint. Do not estimate or execute this work from every command reached through
the schema or shell dependency graph. Full regression, full acceptance, browser
matrices, and archived feature packs require explicit direction.
