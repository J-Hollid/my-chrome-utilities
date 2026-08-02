# TWAtility Belt packaged artwork

The production branding is local, generated artwork. The boards under
`my-chrome-utilities-twatility-branding/assets/brand/concept/` were used only
to identify broad palette, energy, and product hierarchy; none of their pixels
ship in this extension.

## Production assets

- `twatility-belt.png` is the retained R01 genuine-alpha tool-belt cutout
  (1774 × 887, RGBA).
- `specification-studio-title.png` is the generated wordmark-only masthead
  (1600 × 360, RGBA). It contains exactly `TWAtility Belt`: red `TWA`, then
  cream `tility` spelled `t-i-l-i-t-y` with one lowercase `l`, then `Belt`, all
  inside one joined ink/keyline/shadow envelope with a compact but readable
  `y`–`B` word space.
  The asset deliberately contains no Studio ticket, stars, project metadata,
  or status. `Specification Studio`, its decorative stars, and the shallow
  mustard ticket are live HTML/CSS so the hierarchy can reflow without
  distorting the generated lettering.
- `side-panel-title.png` is the exact half-resolution panel derivative
  (800 × 180, RGBA) of `specification-studio-title.png`. It is a proportional
  Lanczos reduction of the approved generated pixels—not a fresh redraw—so the
  panel and Studio share the same corrected `TWAtility Belt` glyphs, outlines,
  keyline, halftone, and shadow. CSS may resize it proportionally only; cropping,
  horizontal stretching, recolouring, or substituting live imitation text is a
  regression.
- `technical-analyst.png`, `technical-analyst-speaking-a.png`, and
  `technical-analyst-speaking-b.png` form one proportion-locked generated
  analyst set. Every frame uses the same 587 × 822 transparent canvas, figure,
  crop, and baseline; speaking changes are limited to the face-expression
  region so the head, shoulders, torso, hands, and tool belt cannot jump.
- `icons/icon-{16,32,48,128}.png` are optically downscaled from one generated
  square master and are referenced by both the manifest and action icon maps.
  Their rounded navy tile has genuine transparent corners and fills the useful
  canvas; no opaque cream square or pale outer gutter is part of the artwork.

The title, icon master, and analyst sheet used flat green removal backgrounds,
were converted to genuine alpha with the installed ImageGen chroma-key helper,
and were visually checked for edge fringing. No runtime fetch, remote font, or
concept sheet dependency is permitted.

## Generation prompts

All new artwork used the built-in ImageGen path.

### Extension icon master

> Original square Chrome-extension emblem for TWAtility Belt; exact `TWA`
> lettering once; oversized red-orange letters with cream highlight and heavy
> ink outline; irregular mustard impact burst; deep-navy rounded-square frame;
> bold hand-inked mid-century British weekly-comic energy; flat screen-print
> palette; simple enough for 16 px; no extra text, mockup, watermark, or copied
> reference composition.

The selected icon then received one built-in ImageGen framing edit:

> Change only the outer framing. Remove the baked-in off-white/cream square
> border and all light corner pixels. Expand the existing deep-navy rounded
> badge and black ink outline to occupy essentially the full square canvas while
> preserving the exact single `TWA`, red-orange fill, cream highlight, mustard
> burst, proportions, angle, and hand-inked British-comic character. Put only
> the tiny area outside the rounded badge on a perfectly flat `#00ff00`
> chroma-key field. Add no text, symbol, tool, frame, mockup, or scenery.

The generated 1254 × 1254 edit was alpha-keyed with a soft matte and despill,
then downscaled directly to 128, 48, 32, and 16 pixels with Lanczos filtering.
All four final PNGs have zero-alpha corners, no green-dominant edge pixels, and
an unclipped rounded outline. Their high-alpha core bounds are 14 × 14,
30 × 30, 45 × 46, and 120 × 122 pixels respectively, so the badge reads as a
full Chrome tile without restoring an opaque pale canvas.

### Specification Studio wordmark

> Create original new artwork containing exactly `TWAtility Belt` once on one
> line, spelled `T-W-A-t-i-l-i-t-y`, one word space, `B-e-l-t`; `tility` has
> exactly one lowercase `l` between its two dotted `i` letters. Use a cohesive
> mid-century British weekly-comic masthead energy: large
> red-orange italic `TWA`, cream italic `tility Belt`, open counters, heavy
> hand-inked black outline, thin cream keyline, deep-navy offset shadow, and
> restrained screen-print halftone. Keep one compact readable word space before
> `Belt` while one continuous outline/shadow envelope holds the mark together.
> Generate on a perfectly flat chroma-green removal field. No ticket, star,
> tools, character, background scene, project metadata, extra text, watermark,
> glossy esports bevel, clipped outline, or copied reference pixels.

The selected generation received one targeted proportion refinement:

> Preserve the exact text, colors, linework, halftone, and flat chroma field;
> change only the proportions and `y`–`B` spacing. Make the masthead lower and
> wider with open natural letterforms, give `y` and `B` a small unmistakable
> separation, and retain one shared outer outline/shadow envelope. Add no new
> elements or text.

The selected output was alpha-keyed and despilled, proportionally resized, and
placed on the 1600 × 360 transparent production canvas with even safe padding.
No horizontal CSS or raster stretch is permitted.

A later native-resolution spelling audit found that the proportion-refined
raster had painted `TWAtillity` despite its correct accessible label. Built-in
ImageGen received one glyph-specific correction:

> Delete only the second of the two adjacent undotted lowercase `l` stems, then
> shift `i-t-y Belt` left and close the gap naturally. The corrected cream word
> must read `tility`: `t`, dotted `i`, one undotted `l`, dotted `i`, `t`, `y`.
> Preserve every other glyph, color, halftone, italic angle, outline, keyline,
> navy shadow, long-low composition, and `y`–`B` separation. No extra `l`, no
> `tillity`, and no additional text or imagery.

The corrected generation was keyed from its measured flat-green field, cropped
to its artwork, proportionally resized to 1510 × 281, and centered at `(45, 39)`
on the unchanged 1600 × 360 transparent canvas. Its visible cream lettering has
ten substantial glyph bodies after red `TWA`—six for `tility`, four for `Belt`—
plus exactly two detached `i` dots. Browser tests count those normalized visual
components; correct alt text alone does not satisfy the raster spelling contract.

For the side panel, that corrected 1600 × 360 master was reduced exactly 50%
with RGBA Lanczos filtering to the packaged 800 × 180 derivative. The panel
renders that derivative at its intrinsic 40:9 ratio and keeps its heading's
accessible name in HTML; no new generated lettering or concept-art pixels were
introduced.

### Technical analyst proportion-locked speaking set

The original generated idle analyst is the locked drawing for every runtime
state. Built-in ImageGen was used to explore two identity-preserving speaking
repairs with the production frames supplied as references:

> Preserve the exact analyst identity and use the open-hand frame as the hard
> scale and registration anchor. Keep the same head size, eye spacing, shoulder
> width, torso length, belt, buckle, pouches, waist baseline, palette, and inked
> comic finish while correcting the magnifier frame. Change only the speaking
> expression and prop action; use a flat chroma-green removal field; add no text,
> bubble, scenery, border, watermark, or extra figure.

> Preserve the exact supplied analyst drawing, silhouette, head and facial
> proportions, spectacles, shoulders, torso, clipboard, hands, tool belt,
> buckle, pouches, crop, and waist baseline. Create a subtle alternate speaking
> state by changing only the mouth shape and a very small finger gesture. Keep
> the original British weekly-comic ink, palette, and flat chroma-green field;
> add no new prop, text, bubble, scene, border, or watermark.

Original-resolution overlay review showed that even constrained full redraws
still shifted facial and torso landmarks. Production therefore uses the stable
generated idle frame as a pixel-locked base: `technical-analyst-speaking-a.png`
adds the open-mouth expression from generated speaking artwork with a feathered
local composite, while `technical-analyst-speaking-b.png` is the relaxed-mouth
locked base. Runtime alternation still switches between the two speaking image
files, but reads as mouth animation instead of a body-scale change.

The stored expression RGB has changed-pixel bounds `x=241..380`, `y=176..318`
(inclusive). Tests allow visible colour differences only inside the guard
rectangle `[240, 175, 382, 320)`. The open-mouth frame reuses the idle alpha
channel wholesale, so its transparent silhouette and antialiasing are identical
rather than merely similar. Everything outside the expression guard—including
the eyes, hair silhouette, shoulders, hands, torso, clipboard, belt, buckle,
pouches, and tools—must remain identical. This later proportion lock supersedes
the broad open-hand and magnifying-glass pose brief.

The generated PNGs are the production sources of truth. Tests should assert
dimensions, alpha, packaging, the locked non-expression pixels, and readable
runtime geometry, not file hashes or the obsolete R01/R02 pose proportions.
