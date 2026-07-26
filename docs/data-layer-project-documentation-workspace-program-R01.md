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

Incomplete output requires confirmation and contains only the concise
`Draft — incomplete` label.

## Theme contract

Themes are named project-local structured records. Supported decisions include
client identity, logo, colors, typography, density, borders, striping, highlighted
headings, column widths, and header and footer text. The same supported decisions
drive preview, Excel, and rich clipboard styling. Theme values contain no
executable CSS or workbook code. Cross-project reuse is manual copy and paste.

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
remain unchanged.
