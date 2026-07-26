# TWAtility Belt click-through design mock

This directory is an isolated, presentation-only reference for redesigning the real extension.
It does not import production scripts, call Chrome APIs, persist input, read project storage, or
modify the production extension.

Open `index.html` directly, or serve this directory with any static file server.

Pages:

- `index.html` — tour and design intent
- `side-panel.html` — the side-panel shell and populated Retail & Trade examples
- `studio.html` — the full-page Specification Studio hero journey
- `state-gallery.html` — rare, blocked, recovery and review states
- `control-map.html` — traceability from production control families to the mock

Shared files:

- `assets/mock.css` — design tokens, layout, responsive and comic treatments
- `assets/mock.js` — presentation-only tabs, routes, dialogs, disclosures and toast feedback
- `assets/twatility-belt.png` — original generated utility-belt artwork
- `assets/analyst-mascot.png` — original generated analyst artwork
- `assets/twatility-belt-transparent.png` — alpha-channel belt cut-out used on UI backgrounds
- `assets/analyst-mascot-transparent.png` — alpha-channel analyst cut-out used on UI backgrounds
- `assets/ARTWORK.md` — ImageGen mode, final prompts and generated-source paths

The artwork was generated with the built-in image-generation tool from an art-direction
reference supplied by the user. The reference was treated as mood and print-style inspiration;
the resulting assets are original and contain no copied wording or logo. Any artwork placed
directly over a UI surface uses a real transparent PNG derivative rather than a background-colour
match, blend mode or masking workaround.

Responsive Studio behaviour mirrors controls already present in the extension: the inspector
starts collapsed at 1599 pixels and below, the existing Show/Hide inspector control preserves
the user’s later choice, and reopening it uses a three-column push layout or an in-flow narrow
layout rather than covering the workspace. Horizontal scrolling is kept local to the property
table, Flow canvas and Coverage matrix; collection routes reflow without a page-level scrollbar.
