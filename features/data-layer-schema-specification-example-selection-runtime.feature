Feature: Data layer schema specification example selection runtime

  Background:
    Given the built extension side panel is running with the production specification builder, rules, documentation, and clipboard controls
    And production duration has documented example 24 and effective allowedValues 12 and 24

  # Data layer schema specification example selection runtime 001
  Scenario: Data layer schema specification example selection runtime 001
    When the production duration Example value cell is activated
    Then the rendered in-cell editor contains selectable Documentation 24, Allowed value 12, Allowed value 24, Custom value, and Blank sources
    And Documentation 24 is selected initially
    And the production cell does not expose a standalone text override without a source choice
    When Allowed value 12 is selected
    Then the rendered cell changes to 12 and reopening identifies Allowed value 12 as selected

  # Data layer schema specification example selection runtime 002
  Scenario Outline: Data layer schema specification example selection runtime 002
    When production duration selects <source_choice>
    Then the rendered preview and both production clipboard formats contain <preview_value>
    And production schema persistence remains byte-for-byte unchanged

    Examples:
      | source_choice    | preview_value |
      | Documentation 24 | 24            |
      | Allowed value 12 | 12            |
      | Custom value 18  | 18            |
      | Blank            | an empty cell |

  # Data layer schema specification example selection runtime 003
  Scenario: Data layer schema specification example selection runtime 003
    Given production rules provide conditional, inherited, duplicated, disabled, and conflicting allowed values
    When the rendered example choices are inspected and selected
    Then only distinct effective choices are selectable
    And conditional and inherited labels remain visible while only their values enter the cell
    And a property without effective values exposes an unavailable Allowed value source with explanation

  # Data layer schema specification example selection runtime 004
  Scenario: Data layer schema specification example selection runtime 004
    Given production example choices have been made for two rows
    When selection, sorting, column movement, and export controls rerender the production preview
    Then applicable choices and values remain associated with their canonical property paths
    And only one production example editor can be open
    And keyboard activation, Escape cancellation, and focus return operate on the actual rendered controls
    When the source revision changes
    Then choices rebuild from that source without mutating production schemas

