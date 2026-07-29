# Specification Studio choice controls program R01

## Objective

Replace the Studio's context-dependent checkbox presentation with one compact,
labelled choice-row pattern. Preserve a generous interaction target without making
the visible checkbox resemble a text field. Introduce switches only where the
control is a standalone binary setting whose reversible consequence applies
immediately.

## Observed defect

Specification Studio applies generic text-input height, padding, border, radius,
and label layout to every input. A fieldset-specific exception removes only part of
that treatment. The same checkbox markup therefore appears compact in some groups
and oversized or visually detached from its label elsewhere.

Checkbox construction is also distributed across Documentation, schema authoring,
conditions, conflicts, defect options, confirmations, and bulk staging. Nested
labels, explicit labels, accessible-name-only controls, and unlabelled table
selectors coexist without one visual or semantic contract.

## Design basis

This program follows:

- W3C form guidance that controls have visible, explicitly associated labels and
  that the label enlarges the clickable area;
- WCAG 2.2 minimum target sizing, visible focus, non-text contrast, and state not
  conveyed by color alone;
- USWDS and GOV.UK guidance to place checkboxes left of labels, make labels
  selectable, stack related options vertically, and use fieldset and legend for a
  related group; and
- Carbon guidance that switches are reserved for immediate reversible binary
  settings, while selections participating in a later operation remain
  checkboxes.

## Control classification

A checkbox represents independent membership, inclusion, acknowledgement,
confirmation, or staged selection. It remains a checkbox when another action such
as Save, Refresh, Confirm, or Run batch is required for the consequence to take
effect.

A switch represents one standalone binary setting only when changing it applies
the visible or durable consequence immediately, is safely reversible, and requires
no follow-up action. `Only defined fields` is the required representative switch.
`Include concept subheadings`, concept and export inclusion, incomplete-export
confirmation, staged-row selection, and theme options awaiting Save remain
checkboxes.

Buttons that reveal regions or navigate views remain buttons with expanded or
current state. Destructive operations and mutually exclusive choices do not become
switches.

## Checkbox row

The visible checkbox square is 16–18 CSS pixels. It is excluded from generic
text-input height, padding, radius, and width rules. The visible label begins 8 CSS
pixels to its right.

The complete labelled row is the pointer target: at least 36 CSS pixels high for a
fine pointer and 44 CSS pixels for a coarse pointer or narrow presentation. The
indicator stays compact at both sizes. Hover and keyboard focus reinforce the row
boundary without making the square look like a button or input field.

Every input has one visible explicit label using matching `id` and `for` values.
Optional hint text sits beneath the primary label and is programmatically
described by the input. Related choices are vertically stacked in a fieldset under
one legend. Row actions occupy a separate action boundary after the complete
indicator-label pair.

## Switch row

A switch uses the same label, target, wrapping, and focus principles. It visibly
shows a positive setting label plus current `On` or `Off` text. Checked state and a
shape or mark communicate state without relying on color. Its accessible role and
checked state update once when the operator clicks the labelled row or presses
Space.

Changing presentation from checkbox to switch does not change command, persistence,
Undo, or validation semantics.

## Responsive and accessible behavior

Choice rows preserve adjacency at 1280 and 360 CSS pixels and at 200 percent browser
zoom. Long labels and hints wrap within the label column. Indicators do not stretch,
actions do not interrupt labels, controls do not overlap or clip, and the Studio
introduces no horizontal page scroll.

Visible and accessible labels agree. Selected, unselected, indeterminate when
applicable, focused, disabled, and switch On or Off states remain distinguishable
without color alone. Keyboard order follows visual order and Space changes exactly
the focused control.

## Delivery boundary

This correction covers production Specification Studio choice controls across
Documentation, canonical schema authoring, conditions, conflicts, defect options,
theme configuration, confirmations, and bulk staging. It establishes one shared
choice-row renderer and presentation contract rather than accumulating local CSS
exceptions.

It does not alter product consequences, saved values, project revisions, Undo
history, validation, output generation, or the side panel. The exact checkpoint is
the `branding_polish` verification pack followed by `npm run package`.

Installed evidence must inspect every production Studio checkbox and switch,
exercise the representative classification examples, compare fine and coarse
pointer target geometry, click both indicator and label, operate with keyboard,
wrap long labels at 360 CSS pixels and 200 percent zoom, and prove established
Draft and history effects are conserved. Side-panel DOM and presentation hashes
must remain unchanged.
