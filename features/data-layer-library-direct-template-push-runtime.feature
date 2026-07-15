Feature: Data layer Library direct template push runtime

  Background:
    Given the built extension side panel is running with the production Event Library, editor, selected-target push, and feedback controls
    And production Library row Purchase confirmation version 3 stores event purchase, destination dataLayer, and transaction_id test-123
    And production target Signal Shop is selected and ready

  # Data layer Library direct template push runtime 001
  Scenario: Data layer Library direct template push runtime 001
    Given the production Library editor is closed
    When the operator clicks Library row Push on Purchase confirmation
    Then production selected-target execution pushes exactly one saved purchase payload to Signal Shop at dataLayer
    And the production Library editor remains hidden
    And the row list and current search remain rendered
    And production Library feedback announces the successful target and destination

  # Data layer Library direct template push runtime 002
  Scenario: Data layer Library direct template push runtime 002
    Given the production editor contains an unsaved Product detail draft
    When the operator clicks Library row Push on Purchase confirmation
    Then production execution uses Purchase confirmation version 3 and transaction_id test-123
    And the editor still displays the unchanged Product detail draft
    And no editor field is replaced with Purchase confirmation data

  # Data layer Library direct template push runtime 003
  Scenario: Data layer Library direct template push runtime 003
    Given the production editor contains an unsaved Purchase confirmation draft with transaction_id test-456
    When the operator clicks Library row Push on Purchase confirmation
    Then production execution receives saved transaction_id test-123
    And the editor retains unsaved transaction_id test-456
    And clicking Push draft still opens the production draft review for transaction_id test-456

  # Data layer Library direct template push runtime 004
  Scenario Outline: Data layer Library direct template push runtime 004
    Given production direct push encounters <runtime_condition>
    When the operator clicks Library row Push on Purchase confirmation
    Then production creates no page event
    And production Library feedback reports <result>
    And the production editor remains in its prior open or closed state
    And persisted Purchase confirmation remains byte-for-byte unchanged

    Examples:
      | runtime_condition         | result                            |
      | no selected target        | Select a target before pushing     |
      | target access unavailable | Request access for Signal Shop     |
      | page injection failure    | Push to Signal Shop failed         |
