# mutation-stamp: sha256=c12d2c1590de910021da422a7a041c145bd285c718a5c8df32425b46d120b6ca
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-16T14:18:45.970755130Z","feature_name":"Data layer schema specification example selection","feature_path":"features/data-layer-schema-specification-example-selection.feature","background_hash":"6def84e1d7c5864afdc0ba249d2a73d0565f92b81ac9d279ea4776a57f54be98","implementation_hash":"2bf31ebbb091b81d5f8232353fd0b39bdddf062c","scenarios":[{"index":1,"name":"Data layer schema specification example selection 002","scenario_hash":"ddb9410a9a47cc6af8e1b73fdbdbf0da83936a66ff6b9fbe6f551b58f160ea94","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-07-16T14:18:45.970755130Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema specification example selection

  Background:
    Given the specification builder is open for Generic pageview revision 4
    And products[].duration has documented example 24 and effective allowed values 12 and 24
    And products[].product_name has no documented example or effective allowed value

  # Data layer schema specification example selection 001
  Scenario: Data layer schema specification example selection 001
    When the operator activates the duration Example value cell by pointer or keyboard
    Then one in-cell example editor opens for products[].duration
    And Documentation 24 is selected as the current source
    And Allowed value offers 12 and 24 as separate selectable choices in effective rule order
    And Custom value and Blank are also available
    And the Example value cell is not reduced to an unlabeled free-text input

  # Data layer schema specification example selection 002
  Scenario Outline: Data layer schema specification example selection 002
    Given the duration example editor is open
    When the operator selects <source_choice>
    Then the duration Example value cell displays <preview_value>
    And reopening the editor identifies <selected_source> as selected
    And Spreadsheet, Rich table, and plain fallback output contain <preview_value> for duration
    And the documented example remains 24

    Examples:
      | source_choice    | preview_value | selected_source  |
      | Documentation 24 | 24            | Documentation 24 |
      | Allowed value 12 | 12            | Allowed value 12 |
      | Allowed value 24 | 24            | Allowed value 24 |
      | Custom value 18  | 18            | Custom value     |
      | Blank            | blank         | Blank            |

  # Data layer schema specification example selection 003
  Scenario: Data layer schema specification example selection 003
    Given an effective allowed value is conditional or inherited
    When the property's example editor is opened
    Then the choice identifies its condition or inherited origin
    And selecting it places only the allowed value in the Example value cell
    And duplicate effective values appear once
    And disabled, overridden, or conflicting values are not offered as valid choices

  # Data layer schema specification example selection 004
  Scenario: Data layer schema specification example selection 004
    When the operator activates the product_name Example value cell
    Then Blank is selected
    And Custom value is available
    And Allowed value is unavailable with an explanation that no effective allowed values exist
    And Documentation is unavailable with an explanation that no documented example exists

  # Data layer schema specification example selection 005
  Scenario: Data layer schema specification example selection 005
    Given duration uses Allowed value 12 and product_name uses Custom value Phone
    When property selection, row sorting, column reordering, copy mode, heading inclusion, or export styling changes
    Then each applicable example source and preview value remains selected in the open builder
    When the builder source changes to another schema revision
    Then row-specific choices reset to that revision's documented examples or Blank
    And allowed choices are rebuilt from that source's effective rules
    And no schema documentation, validation rule, revision, or working draft is changed

  # Data layer schema specification example selection 006
  Scenario: Data layer schema specification example selection 006
    Given an example editor is open
    When another Example value cell is activated
    Then the previous editor closes and exactly one editor remains open
    And focus moves into the newly opened editor
    When the operator cancels or presses Escape
    Then the previous example source and value remain unchanged
    And focus returns to the originating Example value cell

