# TWAtility branding merge handover R02

Status: merge-ready on `feature/twatility-art-update`

Base commit: `9ae535ae` (`master` and `origin/master` when this branch was prepared)

Prepared: 2026-08-03

## Purpose

This branch replaces the extension's provisional branding with one cohesive,
original British weekly-comic-inspired production treatment. It also carries the
later visual corrections requested during review: full-canvas Chrome icons, the
correct `TWAtility` spelling, proportion-locked analyst frames, a matching panel
wordmark, and a simple non-self-intersecting speech-bubble tail.

This handover is the merge and conflict-resolution index. The detailed production
authority remains in:

- `docs/swarmforge-active-scope.md` for the later behavioral and visual contracts;
- `assets/brand/ARTWORK.md` for asset provenance, generation prompts, dimensions,
  and pixel-level constraints;
- the feature files and automated tests named below for executable acceptance.

When an older R01 review or parity document conflicts with those later sources,
the later active-scope clauses, packaged-artwork record, and executable tests win.
Do not classify the intentional replacements listed here as regressions.

## What is in the branch

### Packaged artwork

| Asset | Production contract |
| --- | --- |
| `assets/brand/icons/icon-{16,32,48,128}.png` | Generated `TWA` Chrome badge at its four manifest/action sizes. The rounded navy tile fills the useful canvas and has genuine transparent corners. The former opaque cream square or white outer gutter must not return. |
| `assets/brand/specification-studio-title.png` | 1600 by 360 RGBA generated wordmark containing exactly `TWAtility Belt`. `tility` has one lowercase `l`, two dotted `i` letters, and a readable space before `Belt`. |
| `assets/brand/side-panel-title.png` | Exact 800 by 180, 50 percent Lanczos derivative of the corrected Studio wordmark. It is intentionally the same lettering, not a font approximation or a separately redrawn logo. |
| `assets/brand/technical-analyst.png` | 587 by 822 RGBA locked idle analyst drawing. |
| `assets/brand/technical-analyst-speaking-a.png` | 587 by 822 locked-frame open-mouth variant. Its alpha channel and all pixels outside the documented face-expression guard remain aligned with idle. |
| `assets/brand/technical-analyst-speaking-b.png` | 587 by 822 relaxed-mouth locked base used as the second speaking frame. |
| `assets/brand/twatility-belt.png` | Retained genuine-alpha R01 tool-belt cutout used as supporting decoration, not as either wordmark. |

The concept boards in the separate branding repository were mood and hierarchy
references only. No concept-board pixels ship. The production PNGs above were
created from the generated artwork workflow documented in `ARTWORK.md`; do not
replace them with the concept images.

### Chrome extension shell

- `manifest.json` now names the extension `TWAtility Belt` and uses the generated
  16, 32, 48, and 128 pixel icons for both extension and action icon maps.
- `side-panel.html` uses `side-panel-title.png` inside the existing accessible
  `TWAtility Belt` heading. The image is decorative to assistive technology
  because the heading owns the accessible name.
- `side-panel-brand.css` preserves the wordmark's 40:9 aspect ratio. At compact
  widths the Commands control stays separate and the utility chips occupy a
  predictable second row; the title must not be squeezed horizontally.
- The source and tracked `dist` shell files are expected to match byte-for-byte
  after `npm run build`.

### Specification Studio masthead

- The generated raster contains only `TWAtility Belt`.
- `Specification Studio`, both stars, project context, state, and actions remain
  live semantic HTML/CSS so the header can reflow without stretching the raster.
- The accepted composition is the long, low masthead with red `TWA`, cream
  `tility Belt`, a shallow mustard Studio ticket, navy field, and non-overlapping
  context/status controls.
- The raster must never be restored to `TWAtillity`, combined with a generated
  Studio ticket, clipped, or stretched with `scaleX`.

### Technical analyst

- The three analyst images share the same 587 by 822 canvas, crop, body scale,
  baseline, silhouette, tool belt, pouches, clipboard, hands, shoulders, and
  head proportions.
- Speaking deliberately reads as a mouth flipbook. Standard motion alternates
  `speaking-a` and `speaking-b`; reduced motion presents a stable speaking frame.
  Hiding guidance, changing route, blocking the Studio, or disposing the
  controller restores idle.
- The former requirement for independently redrawn open-hand and magnifying-glass
  body poses is superseded. Restoring those broad redraws would reintroduce the
  proportion jumps and disappearing tool-belt details that this branch fixes.
- The readable bubble is stacked above the bust inside the dedicated analyst
  footer. It is not a side-by-side bubble and must not cover navigation,
  workspace controls, Inspector controls, or analyst artwork.
- The SVG tail has a broad open root, two monotonic tapered edges, and one rounded
  point. The outline is simple: no inward curl, loop, doubled cap, crossing, or
  self-intersection. It points through transparent upper-right analyst canvas
  and remains clear of all three image frames.

### Analyst copy and timing

The visual changes do not weaken the existing scheduler or copy contracts. The
documented general-tip pools, the five reviewed control-specific tips, first-show
delay, lifetime, cooldown, three-second dwell behavior, session rotation,
typewriter presentation, live-region behavior, focus handling, and project/Undo
invariance remain covered by the updated feature, model, browser, and acceptance
adapters.

## Superseded historical expectations

The following older expectations must not be used to reject this merge:

- a code-native imitation of the TWAtility wordmark in the panel;
- a combined generated `TWAtility Belt + Specification Studio` raster;
- the misspelled painted word `TWAtillity`;
- a cream or white square surrounding the Chrome badge;
- independently redrawn speaking figures with changing body/head proportions;
- loss of the analyst's right-side tool belt or pouches between frames;
- a magnifying-glass/open-hand whole-body speaking cycle;
- a speech bubble beside the analyst instead of above him;
- either earlier hooked or self-intersecting tail path;
- the provisional R01 portrait on the no-project card.

## Executable regression protection

The branch updates these contracts rather than suppressing them:

- `features/specification-studio-technical-analyst-guidance.feature`
- `features/specification-studio-technical-analyst-guidance-runtime.feature`
- `acceptance/src/acceptance/steps/specification_studio_technical_analyst_guidance.clj`
- `test/acceptance/specification_studio_technical_analyst_guidance_steps_test.clj`
- `test/specification-studio-technical-analyst-guidance-test.mjs`
- `test/twatility-brand-foundation-test.mjs`
- `test/twatility-brand-foundation-browser-test.mjs`
- `test/twatility-side-panel-shell-browser-test.mjs`
- `test/twatility-studio-shell-browser-test.mjs`
- `test/twatility-workflow-polish-browser-test.mjs`
- `acceptance/src/acceptance/steps/package_flow.clj`
- `test/acceptance/package_flow_steps_test.clj`

Notable regression mechanisms include visual glyph-component inspection of both
wordmark rasters, half-scale structural comparison for the panel derivative,
icon alpha/optical-fill sampling, analyst frame registration and pixel-guard
inspection, responsive containment checks, full-path tail intersection sampling,
and exact `dist` versus ZIP inventory comparison.

## Validation completed on this branch

The following passed during final review:

```text
npm run package
node test/specification-studio-technical-analyst-guidance-test.mjs
node test/twatility-brand-foundation-test.mjs
node test/twatility-brand-foundation-browser-test.mjs
node test/twatility-side-panel-shell-browser-test.mjs
node test/twatility-studio-shell-browser-test.mjs
node test/twatility-workflow-polish-browser-test.mjs
```

The final package contained the same 664 regular files as `dist`, and the checked
source assets/HTML were byte-identical in source, `dist`, and ZIP. Browser review
covered the panel at 360, 420, and 512 CSS pixels and the Studio/analyst at its
production desktop geometry.

The local machine did not expose the `bb` executable, so the Clojure acceptance
namespace was not rerun locally after its fixture additions. Its underlying Node
model/browser evidence passed, and the adapter/negative fixtures were updated.
Run the repository's normal Babashka acceptance task in an environment that has
Babashka before merging if that is a required master gate.

For the same reason, embedded Gherkin/Clojure mutation-stamp metadata was not
regenerated after the final spelling, package-inventory, and tail-simplicity
clauses were added. The executable source contracts are current. If fresh
mutation manifests are mandatory for `master`, run the repository's normal
mutation/stamp workflow in the Babashka-enabled merge environment and include
only those mechanical metadata updates with the merge.

One parallel browser run hit the existing timing-sensitive minimum typewriter
cadence assertion after all new tail checks had passed. The isolated rerun passed
the complete workflow. If that cadence assertion flakes under a heavily loaded
merge worker, rerun the workflow alone; do not remove the tail, frame-registration,
or accessibility assertions.

## Merge and regeneration guidance

1. Merge the complete branch, including source assets, specifications, tests, and
   tracked `dist` files. Do not take only the PNGs or only the CSS.
2. When resolving conflicts in the files listed above, prefer this branch's later
   branding contracts unless master contains a deliberately newer approved
   branding revision.
3. Do not regenerate or recompress the production PNGs during conflict resolution.
   A normal build copies them without image processing.
4. Run `npm run package` after conflict resolution. This rebuilds `dist` and writes
   `build/package/my-chrome-utilities.zip`.
5. `build/` is intentionally ignored, so the ZIP is a reproducible handoff artifact
   rather than a committed file. The tracked `dist` tree is part of the commit.
6. Confirm the package inventory exactly matches `dist` and rerun the focused
   browser checks above before updating `master`.

If a later redesign intentionally changes these decisions, update the active
scope, `ARTWORK.md`, feature contracts, browser evidence, and this handover in the
same change. Do not weaken or delete the current tests merely to make different
artwork look non-regressive.
