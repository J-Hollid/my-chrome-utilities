Feature: Data layer Library editor close runtime repair

  Background:
    Given the built extension Library view is running in a browser
    And template Purchase confirmation version 3 is present in the template list

  # Data layer Library editor close runtime repair 001
  Scenario Outline: Data layer Library editor close runtime repair 001
    Given no template is selected for editing at <panel_width> CSS px
    When the Library render completes
    Then the entire event-property-editor has hidden set to true
    And its computed display is none and its offset parent is null
    And no editor header, Properties, JSON, execution, validation, or editor action content is exposed to assistive technology
    And the template list remains the current Library content

    Examples:
      | panel_width |
      | 360         |
      | 520         |
      | 720         |

  # Data layer Library editor close runtime repair 002
  Scenario Outline: Data layer Library editor close runtime repair 002
    Given Edit for Purchase confirmation has keyboard focus at <panel_width> CSS px
    When the operator activates Edit
    Then the entire event-property-editor has hidden set to false and is visible
    And its header, Properties, progressive sections, validation, and actions belong to the same editor pane
    When the operator activates Close editor without unsaved changes
    Then the entire event-property-editor has hidden set to true
    And its computed display is none and its offset parent is null
    And keyboard focus returns to Edit for Purchase confirmation

    Examples:
      | panel_width |
      | 360         |
      | 520         |
      | 720         |

  # Data layer Library editor close runtime repair 003
  Scenario: Data layer Library editor close runtime repair 003
    Given the clean Purchase confirmation editor is open
    When Close editor completes
    Then the editor pane itself is removed from layout and accessibility exposure
    And the close action does not merely clear or hide the Properties section
    And no empty editor border, header, metadata, feedback, or action region remains visible
    And Close editor is absent until another template editor opens

  # Data layer Library editor close runtime repair 004
  Scenario: Data layer Library editor close runtime repair 004
    Given the Purchase confirmation editor has unsaved changes
    When the operator activates Close editor
    Then the editor remains visible while its dirty-close confirmation is displayed
    And the confirmation offers Keep editing, Save revision, and Discard changes
    When the operator chooses Keep editing
    Then the confirmation is hidden and the complete editor remains visible

  # Data layer Library editor close runtime repair 005
  Scenario Outline: Data layer Library editor close runtime repair 005
    Given the dirty-close confirmation is displayed for Purchase confirmation
    When the operator chooses <closing_choice>
    Then the entire event-property-editor is hidden with computed display none
    And the Library retains Purchase confirmation version <expected_version>
    And keyboard focus returns to Edit for Purchase confirmation

    Examples:
      | closing_choice  | expected_version |
      | Save revision   | 4                |
      | Discard changes | 3                |

  # Data layer Library editor close runtime repair 006
  Scenario: Data layer Library editor close runtime repair 006
    When the automated Library editor-close browser test is inspected
    Then it opens and closes the editor through interface actions at 360, 520, and 720 CSS px
    And it asserts hidden value, computed display, offset parent, focus restoration, and accessibility exposure for the whole editor pane
    And it covers clean close, Keep editing, Save revision, and Discard changes
    And the test does not force the editor visible before asserting its rendered close state
