Feature: Data Layer Live inspector actions

  # Data Layer Live inspector actions 001
  Scenario Outline: Data Layer Live inspector actions 001
    Given captured event <event_name> with payload <payload_label> is selected in the Live inspector
    When Copy payload is activated
    Then canonical JSON for <payload_label> is written to the system clipboard
    And success feedback appears only after the clipboard write succeeds
    And a failed clipboard write reports failure without claiming the copy completed

    Examples:
      | event_name | payload_label   |
      | purchase   | purchase-values |

  # Data Layer Live inspector actions 002
  Scenario Outline: Data Layer Live inspector actions 002
    Given captured event <event_name> from <source_name> with destination <destination> and payload <payload_label> is selected
    When Save to Library is activated
    Then exactly one editable event template is created from <event_name>, <source_name>, <destination>, and <payload_label>
    And the saved template is visible and persisted in the Library view
    And success feedback identifies the saved template
    And the selected Live inspector remains open

    Examples:
      | event_name | source_name   | destination  | payload_label   |
      | purchase   | Event history | event.history | purchase-values |

  # Data Layer Live inspector actions 003
  Scenario Outline: Data Layer Live inspector actions 003
    Given captured event <event_name> has validation state <initial_state>
    And schema <schema_name> is assigned to its source and event name
    When Validate is activated
    Then schema <schema_name> validates the event payload
    And the same captured event changes to validation state <result_state> without creating another event
    And structured validation issues are available when <result_state> reports issues
    And the feed row and open inspector show <result_state>

    Examples:
      | event_name | initial_state | schema_name | result_state |
      | purchase   | Not checked   | Purchase v2 | 2 issues     |

  # Data Layer Live inspector actions 004
  Scenario Outline: Data Layer Live inspector actions 004
    Given captured event <event_name> has no compatible assigned schema
    When its inspector actions are displayed
    Then Validate is absent or disabled with an explanation
    And activating inspector actions cannot report validation completed without running validation

    Examples:
      | event_name |
      | pageview   |
