Feature: Data layer Push draft review

  Background:
    Given template Purchase confirmation version 3 has event purchase and a valid unsaved draft
    And the draft has validation state Valid and destination queue.history
    And adapter Event history is ready with permission to push
    And active target Signal Shop has URL https://signal.example.test/checkout

  # Data layer Push draft review 001
  Scenario: Data layer Push draft review 001
    Given the page has not received the draft and no execution record exists for it
    When the operator selects Push draft
    Then a push confirmation view opens without invoking the source adapter
    And the confirmation identifies event purchase, target Signal Shop, target URL https://signal.example.test/checkout, destination queue.history, template version 3, and validation state Valid
    And preflight performs zero page writes and zero audit writes
    And the final action is labelled Push purchase to Signal Shop

  # Data layer Push draft review 002
  Scenario: Data layer Push draft review 002
    Given the last saved payload and current draft differ as follows
      | property       | saved value | draft value | change  |
      | transaction_id | test-123    | test-456    | changed |
      | revenue        | 39.95       | 49.95       | changed |
      | coupon         | SUMMER      | absent      | removed |
      | debug          | absent      | true        | added   |
    When the review renders its property comparison
    Then its changed-properties summary shows each listed property, prior value, current value, and change kind
    And unchanged draft properties are omitted from the changed-properties summary

  # Data layer Push draft review 003
  Scenario: Data layer Push draft review 003
    Given the operator is reviewing the pending push
    When the operator activates Cancel
    Then the Library editor is restored with the unsaved draft unchanged
    And cancellation leaves both the page and audit history untouched

  # Data layer Push draft review 004
  Scenario Outline: Data layer Push draft review 004
    Given push readiness has unresolved condition <unresolved_condition>
    When Library editor actions are displayed
    Then Push draft is disabled with visible reason <disabled_reason>
    And the reason is associated with Push draft for assistive technology
    And no confirmation or adapter execution can be started

    Examples:
      | unresolved_condition | disabled_reason                         |
      | no active target      | Select a target before pushing          |
      | permission missing    | Request access for Signal Shop          |
      | destination invalid   | Correct destination path queue.history  |
      | JSON invalid          | Correct the JSON draft                  |
      | adapter not ready     | Make adapter Event history ready        |

  # Data layer Push draft review 005
  Scenario: Data layer Push draft review 005
    Given the push confirmation view shows the current draft exactly
    And baseline counts for page events and execution records are noted
    When the operator activates Push purchase to Signal Shop
    Then exactly one purchase event containing the reviewed draft is created on Signal Shop
    And exactly one immutable execution record is added
    And the execution record stores these reviewed execution facts
      | event    | target title | target URL                               | destination   | template version | payload           | time            | result    |
      | purchase | Signal Shop  | https://signal.example.test/checkout    | queue.history | 3                | effective payload | completion time | completed |
    And resulting counts increase by one page event and one execution record only
