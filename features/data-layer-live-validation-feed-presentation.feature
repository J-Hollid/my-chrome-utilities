Feature: Data layer Live validation feed presentation

  Background:
    Given the Live event feed contains events with automatic schema validation results

  # Data layer Live validation feed presentation 001
  Scenario Outline: Data layer Live validation feed presentation 001
    Given event <event_name> has validation result <validation_result>
    When its top-level feed row is displayed
    Then validation badge text is <badge_text>
    And validation symbol is <status_symbol>
    And visual status treatment is <status_treatment>

    Examples:
      | event_name | validation_result           | badge_text             | status_symbol | status_treatment |
      | pageview   | Valid                       | Valid                  | check         | pass             |
      | checkout   | 2 warnings                  | 2 warnings             | warning       | warning          |
      | purchase   | 2 errors and 1 warning      | 2 errors and 1 warning | error         | error            |
      | consent    | Not checked                 | Not checked            | neutral       | neutral          |
      | refund     | Assignment error            | Assignment error       | error         | assignment error |

  # Data layer Live validation feed presentation 002
  Scenario: Data layer Live validation feed presentation 002
    Given event purchase has schema errors
    When its feed row is highlighted
    Then an error border or tint distinguishes the complete event row
    And visible error text, symbol, and counts communicate the same state without color
    And the row's accessible name includes its validation state and counts

  # Data layer Live validation feed presentation 003
  Scenario: Data layer Live validation feed presentation 003
    Given highlighted event rows include selected, hovered, and keyboard-focused states
    When the operator navigates the feed
    Then selection, hover, and keyboard focus remain distinguishable from validation status
    And validation styling does not obscure event name, time, source, pathname, or summaries

  # Data layer Live validation feed presentation 004
  Scenario: Data layer Live validation feed presentation 004
    Given the selected inspector event has 2 errors and 1 warning
    When that event is opened from the feed
    Then its inspector summary displays Validation failed, 2 errors, and 1 warning
    And the assigned schema name and exact version are visible
    And Show validation issues, Revalidate, and Change schema are available
