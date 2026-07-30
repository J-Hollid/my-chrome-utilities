# Data layer project documentation workspace program R01

## Objective

Replace the Flow-owned export form with one project-level Documentation workspace
that saves named Documentation Sets and project-local themes. A set may export
individual or combined Flow value maps, one project-wide capture matrix, and
dedicated Site Profile tables as Excel or rich clipboard content.

## Product model

A Documentation Set is project Draft data with stable section selections, order,
per-section configuration, and a project-local theme reference. It survives reload
and project portability. Export generation is read-only and creates no project
revision.

The section kinds are:

- optional Overview;
- one value-map section per selected Flow;
- exactly one project-wide capture-matrix section;
- one property-table section per selected Site Profile.

Flow selection and capture-matrix selection are independent. A Flow section owns
only its value map. The matrix selects Page and Event definitions plus Flow
Page-instance and Event-occurrence effective contexts from anywhere in the project.
Site Profiles are never matrix columns.

## Workspace interaction

The top-level Documentation tab contains:

1. `Set` for named configurations and section order;
2. `Content` for searchable Flow, matrix-context, and Profile selection;
3. `Configure` for only the selected section;
4. `Theme` for project-local structured branding and a live sample;
5. `Preview` for the selected immutable snapshot;
6. `Export` for current, selected, or complete scope.

Configuration is progressive. Unselected sections and advanced theme groups are
not eagerly mounted into one long form.

## Concept grouping configuration

Each Documentation Set owns one ordered concept checklist derived from effective
canonical properties across the project. Matching trims whitespace and deduplicates
case-insensitively while retaining the configured display spelling. The virtual
`Ungrouped` entry represents properties with no stored concept. Every entry has an
independent inclusion choice, and a separate `Include concept subheadings` choice
controls presentation only. Exclusion always removes that concept's property rows,
even when subheadings are hidden.

Concept configuration applies to every selected Site Profile property-table sheet
and the one Data capture matrix. It does not apply to Flow value maps. Every entry,
including virtual `Ungrouped`, has the same positional reorder behavior. New
concepts append after the complete saved sequence without moving any existing
entry. Operators may reorder and include or exclude every entry. Configuration
survives reload, Undo, Redo, and project portability. A configured concept with no
current rows retains its choice but emits no empty output heading.

Within an included concept, rows retain stable path order. When subheadings are
hidden, rows still follow configured concept-group order in one ordinary table.
When enabled, the table renders its standard column headings once, followed by
each non-empty concept as a full-width divider and that concept's rows. Concept
dividers never repeat the standard column headings. This order and filtering are
identical in preview, Excel, semantic rich clipboard HTML, and the plain-text
fallback.

## Concept correction

Selecting `Include concept subheadings` stores the Set choice and marks the current
immutable preview stale. Refreshing that preview must project one heading for every
non-empty included group into every selected Site Profile property table and the
Data capture matrix. Current, selected, and complete rich copy, plain text, and
Excel consume that refreshed snapshot and cannot silently omit those headings.
Turning the choice off and refreshing removes headings without changing filtering
or row order.

The initial Profile compiler gated concept processing on the literal name
`Sitewide`. A Profile property-table section with any other name therefore bypassed
heading presentation, concept inclusion, and concept order. Profile names have no
concept semantics: every selected Site Profile table consumes the same Set-level
concept snapshot, including a section added after the previous preview.

The initial reconciliation treated `Ungrouped` as a terminal sentinel: it removed
that entry from the configured sequence and appended it last on every render and
compile. This made its visible reorder controls ineffective. `Ungrouped` is instead
an ordinary saved ordering entry with virtual grouping semantics only. Reconciliation
preserves its exact position and appends newly discovered concepts after all saved
entries.

## Concept table hierarchy

A grouped table has one deliberate visual hierarchy: section title, one standard
column-heading row, full-width concept dividers, then property rows. The section
title remains the strongest heading. Concept dividers use a lighter theme color,
smaller type, and less emphasis than the section title while retaining readable
contrast. They do not resemble a second table header.

Preview and rich clipboard HTML use one semantic table header and semantic concept
row-group headings. Excel uses one standard column-heading row and merged concept
divider rows spanning the table width. Plain text writes the column headings once
and each non-empty concept label once. Repetition required by a rendering medium at
a physical page boundary is not concept-driven repetition.

## Output contract

The first release supports:

- `.xlsx` workbooks;
- semantic rich clipboard HTML with a plain-text fallback.

It offers no plain spreadsheet-copy, HTML-file, or PDF export.

A complete workbook contains configured Overview, one value-map sheet per Flow,
one Data capture matrix sheet, and one sheet per Site Profile. The Profile default
columns are Property, Description, Required, Allowed values, Example, and Comments.
Diagnostics and provenance remain tool-only preflight information and never appear
as sheets, columns, identities, hashes, or repair details in shared output.

For every selected Site Profile and the matrix, enabled concept subheadings are
subordinate merged styled rows spanning the complete Excel table width. Rich
document copy emits semantic concept headings suitable for Jira or Confluence;
this is the existing rich-copy path, not a new Jira API or export type.

Incomplete output requires confirmation and contains only the concise
`Draft — incomplete` label.

## Theme contract

Themes are named project-local structured records. Supported decisions include
client identity, logo, colors, typography, density, borders, striping, highlighted
headings, column widths, and header and footer text. The same supported decisions
drive preview, Excel, and rich clipboard styling. Theme values contain no
executable CSS or workbook code. Cross-project reuse is manual copy and paste.

The Brand group presents logo selection as a labelled image-file control rather
than a raw data-URL text field. It accepts readable PNG, JPEG, and GIF files,
converts an accepted file to the existing portable Base64 data-URL theme value,
and immediately shows the human file name and a bounded, aspect-ratio-preserving
sample. The converted data URL cannot exceed 250,000 characters. Raw data URLs
remain hidden from ordinary operators.

Type, read, and size failures show an associated textual diagnostic and cannot
replace the current saved logo or its sample. A saved logo exposes a Remove logo
control; removal updates the sample immediately and is persisted through the
ordinary theme save operation. Accepted, retained, replaced, and removed logos
continue through the same preview, rich-copy, Excel, reload, and portability
paths as every other structured theme value.

Logo presentation uses one aspect-ratio-preserving fit within a 180 by 64 CSS
pixel box and never enlarges an image beyond its decoded intrinsic dimensions.
The Brand sample, every configured preview section, and every rich-copy section
use that rule. Excel uses the physical equivalent 1.875 by two-thirds inch logo
area and fits the image within it at the same aspect ratio without enlargement.
Each logo area reserves its own space before the section title and table.

Selection validates that the bytes decode as the declared PNG, JPEG, or GIF
format before replacing the current logo. A type-valid data-URL prefix alone is
insufficient. Every logo-bearing workbook contains valid image, drawing,
relationship, and content-type parts and opens without a content warning, repair,
or removed drawing or image.

## Delivery boundary

This program supersedes the Flow-page entry point, per-Flow capture matrix,
exported diagnostics and provenance, HTML-file export, and the current eagerly
mounted configuration form. It retains effective-schema derivation, Flow value-map
semantics, matrix presence states, stale snapshot protection, output sanitization,
and rich clipboard compatibility from the earlier Flow table export contracts.

The focused verification boundary is the existing `flow_export` checkpoint
and its package command. Installed evidence must navigate through the project-level
tab, persist and port a named set and theme, configure two Flow sheets, configure
one independent matrix across project contexts, configure two Profile sheets,
parse current and combined workbooks, inspect rich clipboard output, compare theme
fingerprints, confirm incomplete export, and prove project and publication bytes
remain unchanged. It must additionally prove the project-wide concept checklist,
independent inclusion and heading controls, custom order, new-concept append
behavior, stale refresh, identical preview/Excel/rich-copy row sets, and strict
isolation to every selected Site Profile and the Data capture matrix. Heading
evidence must begin with an off snapshot, activate the installed control, refresh,
and parse the on result before reversing it. Ordering evidence must move
`Ungrouped` away from last position and preserve that position through compilation
and round-trips. A non-`Sitewide` Profile added after snapshot compilation must
prove filtering, ordering, and headings in preview, rich copy, plain text, and
Excel. Grouped-table evidence must additionally prove one column-heading row per
table, no concept-driven column-heading repetition, and the subordinate concept
divider treatment in preview, rich copy, and Excel. Branding evidence must choose
PNG, JPEG, and GIF files through the installed file control; compare preview,
clipboard, and workbook image bytes; prove raw data URLs are absent from the UI;
reject unsupported, unreadable, and oversized files without replacing the saved
logo; and remove a logo through the installed control and ordinary theme save.
Correction evidence must use real decodable 3000 by 2000 pixel PNG, JPEG, and GIF
fixtures, prove a 96 by 64 fit throughout the 180 by 64 presentation box, preserve
the three-to-two aspect ratio, and show that no logo obscures a title or table. It
must reject declared formats whose bytes cannot decode as that format. Workbook
evidence must resolve every image and drawing part and open each logo-bearing
workbook with an independent Excel-compatible reader without repair or removed
content.
