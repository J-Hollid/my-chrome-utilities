Feature: Data layer schema specification preview layout

  Background:
    Given the specification builder is open with selected properties across all seven preview columns
    And descriptions, mandatory conditions, allowed values, and comments include long content

  # Data layer schema specification preview layout 001
  Scenario: Data layer schema specification preview layout 001
    Given the side panel is narrower than the readable specification table
    When the preview is displayed
    Then the table is contained by one region named Specification preview
    And that region fits within the builder's available width and owns the horizontal overflow
    And the table retains a readable natural width instead of compressing every column into the panel width
    And the builder and side panel do not gain horizontal scrolling
    And the source, property selector, completeness summary, export controls, feedback, and close action remain within the panel width

  # Data layer schema specification preview layout 002
  Scenario: Data layer schema specification preview layout 002
    Given the Specification preview region overflows horizontally
    When the operator scrolls it with pointer, touch, trackpad, or keyboard interaction
    Then columns hidden beyond either edge can be reached within the preview region
    And content outside the preview does not move horizontally
    And vertical panel scrolling remains available
    And focus can enter and leave table headings and editable cells without a keyboard trap
    And the preview region has an accessible name and visible focus treatment

  # Data layer schema specification preview layout 003
  Scenario: Data layer schema specification preview layout 003
    When specification rows and columns are rendered
    Then the heading row has distinct background and emphasized text
    And visible row and column boundaries align every heading with its cells
    And alternating data rows have distinguishable styling
    And a hovered row or a row containing focus has an additional non-color-only emphasis
    And cells have readable padding, top alignment, and wrapping for long content
    And inputs and column movement controls remain legible within their cells

  # Data layer schema specification preview layout 004
  Scenario: Data layer schema specification preview layout 004
    Given the preview is horizontally scrolled
    When property selection, row sorting, an example override, copy mode, heading inclusion, or export style changes
    Then the preview remains inside the same scrolling region
    And its horizontal position is retained when the changed content still permits that position
    And row and column styling is reapplied without heading and cell misalignment
    When a moved column receives focus outside the visible portion
    Then the preview scrolls enough to reveal that focused column

  # Data layer schema specification preview layout 005
  Scenario: Data layer schema specification preview layout 005
    Given the selected properties fit within the available builder width
    When the preview is displayed
    Then the same container and table styling remain
    And no unnecessary horizontal movement is required
    When more properties or wider content cause overflow
    Then horizontal scrolling becomes available without resizing the builder or panel

  # Data layer schema specification preview layout 006
  Scenario: Data layer schema specification preview layout 006
    Given the on-screen preview uses readable row and column styling
    When Plain, Bordered, or Bordered with highlighted headings is selected for Rich table export
    Then the on-screen preview styling remains readable and stable
    And the selected export style affects only copied rich-table presentation
    And Spreadsheet, Rich table, plain fallback, and manual preview selection retain the configured data, column order, and row order

  # Data layer schema specification preview layout 007
  Scenario: Data layer schema specification preview layout 007
    Given the extension is using a supported light, dark, or increased-contrast color preference
    When the specification preview is displayed
    Then headings, borders, alternating rows, focus, hover, controls, and text remain distinguishable
    And no row, column, state, or control is communicated by color alone

