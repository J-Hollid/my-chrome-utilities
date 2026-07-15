Feature: Data layer Library direct template push

  Background:
    Given the Library contains Purchase confirmation version 3 with event purchase and destination dataLayer
    And its saved payload contains transaction_id test-123
    And selected target Signal Shop is ready to receive pushes

  # Data layer Library direct template push 001
  Scenario: Data layer Library direct template push 001
    Given no Library editor is open
    When the operator activates Library row Push on Purchase confirmation
    Then exactly one purchase event with transaction_id test-123 is pushed to Signal Shop at dataLayer
    And the Library editor remains closed
    And the Library list, search, and selected target remain unchanged
    And visible Library feedback identifies Purchase confirmation, Signal Shop, dataLayer, and success

  # Data layer Library direct template push 002
  Scenario: Data layer Library direct template push 002
    Given the editor is open for Product detail with an unsaved draft
    When the operator activates Library row Push on Purchase confirmation
    Then Purchase confirmation version 3 is pushed from its saved payload
    And the editor remains on Product detail with its unsaved draft unchanged
    And Purchase confirmation is not opened in the editor

  # Data layer Library direct template push 003
  Scenario: Data layer Library direct template push 003
    Given the editor is open for Purchase confirmation
    And its unsaved draft changes transaction_id to test-456
    When the operator activates Library row Push on Purchase confirmation
    Then the pushed event contains saved transaction_id test-123
    And the unsaved draft still contains transaction_id test-456
    And Push draft remains the action for reviewing and pushing the unsaved draft

  # Data layer Library direct template push 004
  Scenario Outline: Data layer Library direct template push 004
    Given direct push has <blocking_condition>
    When the operator activates Library row Push on Purchase confirmation
    Then no event is pushed
    And the Library shows <failure_feedback>
    And no template editor or draft review is opened
    And Purchase confirmation version 3 remains unchanged

    Examples:
      | blocking_condition                 | failure_feedback                          |
      | no selected target                 | Select a target before pushing            |
      | target permission is unavailable   | Request access for Signal Shop            |
      | destination is dataLayer[0]        | Invalid push destination path dataLayer[0] |
      | selected-page execution fails      | Push to Signal Shop failed                |
