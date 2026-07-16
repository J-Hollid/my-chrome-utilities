Feature: Data layer schema specification preview layout runtime

  Background:
    Given the built extension side panel is running with the production specification builder and stylesheet
    And production preview data makes the seven-column table wider than a narrow side panel

  # Data layer schema specification preview layout runtime 001
  Scenario: Data layer schema specification preview layout runtime 001
    When the production specification builder renders at narrow panel width
    Then the table is a descendant of one accessible Specification preview container
    And the container's client width does not exceed the builder's client width
    And the container's scroll width exceeds its client width
    And the builder and Data layer panel scroll widths do not exceed their client widths
    And production source, selector, export, feedback, and close controls remain inside the panel's horizontal bounds

  # Data layer schema specification preview layout runtime 002
  Scenario: Data layer schema specification preview layout runtime 002
    When production preview styles are computed
    Then heading emphasis and background differ from data cells
    And each heading and data cell has visible boundaries and non-zero padding
    And adjacent data rows alternate presentation while retaining readable text contrast
    And hover and focus-within presentation adds a visible boundary or outline
    And long description, mandatory, allowed-value, and comment text wraps within readable cells

  # Data layer schema specification preview layout runtime 003
  Scenario: Data layer schema specification preview layout runtime 003
    Given production preview overflow is positioned at its left edge
    When its horizontal scroll position is changed through the production container
    Then the container reaches later columns while the builder and panel horizontal positions remain unchanged
    And keyboard focus can traverse heading actions and example controls before leaving the preview
    And focused off-screen controls are brought into the container's visible area

  # Data layer schema specification preview layout runtime 004
  Scenario: Data layer schema specification preview layout runtime 004
    Given the production preview has a non-zero horizontal scroll position
    When selection, sorting, example editing, column movement, and export options rerender the table
    Then production preserves a valid preview scroll position and aligned styled cells
    And no duplicate preview container or nested horizontal scrollbar is created
    And changing copied-table style does not remove production preview styling
    And clipboard output remains independent of preview-only layout markup and styles

  # Data layer schema specification preview layout runtime 005
  Scenario: Data layer schema specification preview layout runtime 005
    When production light, dark, increased-contrast, and narrow viewport conditions are exercised
    Then computed preview colors, borders, outlines, wrapping, and control bounds remain readable and operable
    And runtime coverage measures real container, table, builder, and panel geometry rather than source-text declarations

