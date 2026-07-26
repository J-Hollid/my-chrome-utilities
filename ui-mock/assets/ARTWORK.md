# Original mock artwork

Both bitmap assets were generated with OpenAI’s built-in ImageGen tool, using the supplied screenshot only as a broad mood reference. The artwork is original and does not copy its logo, text, characters, or layout.

## Utility belt

Original source file (archival; not referenced by the UI): `twatility-belt.png`

Prompt:

> Create an original, wide editorial illustration of a gloriously over-equipped utility belt for a Technical Web Analyst. The belt should contain a magnifying glass, code brackets, a small tablet, measuring tape, cable tester, notebook, pencil, tag labels and other plausible web-analysis tools. Use restrained 1950s British weekly-comic energy: warm cream newsprint, hand-inked outlines, slightly imperfect spot colour, navy blue, mustard yellow, tobacco brown and small orange-red accents. Make it polished enough for a modern professional product UI, with crisp silhouette, believable leather and metal details, gentle halftone texture and no grunge that harms readability. Straight-on product composition, generous breathing room, no people, no brand marks, no logos, no lettering, no speech bubbles and no existing characters.

## Analyst mascot

Original source file (archival; not referenced by the UI): `analyst-mascot.png`

Prompt:

> Create an original full-body character illustration of a friendly British Technical Web Analyst: smart shirt, tie and waistcoat, spectacles, a magnifying glass in one hand and a clipboard in the other. The expression should suggest dry competence and mild amusement, never slapstick. Use restrained old British weekly-comic styling with hand-inked lines, warm cream newsprint, subtle halftone, navy clothing, mustard accents and small orange-red details. Keep the pose clear at small UI sizes and the rendering professional enough for a modern web application. Isolated centered figure with generous cream-paper margin, no words, no logo, no speech bubble, no copied character and no brand marks.

Generated source files:

- `C:\Users\J-Hol\.codex\generated_images\019f9d45-6c7c-7a53-a6c7-7fb3fda99500\call_LQNuwsN4XoxQu6fUbVvvjxYH.png`
- `C:\Users\J-Hol\.codex\generated_images\019f9d45-6c7c-7a53-a6c7-7fb3fda99500\call_lEwqyh7A1gbSn4fQXujh1w4I.png`

## Transparent production cut-outs

Final files:

- `twatility-belt-transparent.png`
- `analyst-mascot-transparent.png`

The built-in ImageGen edit workflow placed each subject on a removable green background. The bundled `remove_chroma_key.py` helper then produced PNG files with real alpha channels, soft antialiased edges and despill. These are the files used anywhere artwork sits directly over a UI surface.

Utility-belt extraction prompt:

> Preserve only the illustrated Technical Web Analyst utility belt and the tools physically attached to or emerging from it: leather belt and buckle, pouches, magnifying glass, ruler, notebook, probe, cable and network plug. Preserve the exact retro British comic ink style, colours, textures and crisp outlines. Remove the cream paper panel, its black frame, all halftone corner texture, all lightning bolts, ground marks and decorative background ink. Replace the removed area with a perfectly flat solid #00ff00 chroma-key background for later alpha removal. Keep the complete belt and every attached tool fully in frame with generous clean padding. No shadows, gradients, texture, floor, glow, reflection, stray marks, lettering or watermark.

Analyst extraction prompt:

> Preserve the illustrated Technical Web Analyst character, pose, facial expression, magnifying glass, clothing, clipboard, ink linework, colours and vintage British comic printing style. Replace every part of the cream paper background, halftone background dots, corner marks and blue speed lines with a perfectly flat solid #00ff00 chroma-key background for later alpha removal. Keep the entire character fully inside frame with a clean margin around hair, arms, clipboard and torso. No texture, shadows, gradients, floor, glow, reflection, stray marks, lettering or watermark.

Generated chroma-key sources:

- `C:\Users\J-Hol\.codex\generated_images\019f9d45-6c7c-7a53-a6c7-7fb3fda99500\call_ScZIil5pVlzMNq1iumWkZfsy.png`
- `C:\Users\J-Hol\.codex\generated_images\019f9d45-6c7c-7a53-a6c7-7fb3fda99500\call_LzaJKaQkdOXPnuqeR1OPVE9M.png`
