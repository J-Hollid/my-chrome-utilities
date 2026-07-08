Feature: Data layer event timeline

  Background:
    Given a repository for project <project_name>
    And a data layer testing session is active

  # Data layer event timeline 001
  Scenario Outline: Data layer event timeline 001
    When observed event entries are recorded
    Then the side panel shows them in capture order
    And each timeline entry shows event name <event_name>
    And each timeline entry shows page URL <page_url>
    And each timeline entry shows capture time
    And each timeline entry shows observer path <history_path>

    Examples:
      | project_name         | history_path  | page_url                | event_name |
      | my-chrome-utilities | queue.history | https://example.test/p/ | signup     |

  # Data layer event timeline 002
  Scenario Outline: Data layer event timeline 002
    Given timeline entry <event_name> is visible
    When the timeline entry is expanded
    Then the expanded entry shows event name <event_name>
    And the expanded entry shows page URL <page_url>
    And the expanded entry shows observer path <history_path>
    And the expanded entry shows payload <payload_label>
    And the expanded entry shows raw value <raw_label>

    Examples:
      | project_name         | history_path  | page_url                | event_name | payload_label | raw_label  |
      | my-chrome-utilities | queue.history | https://example.test/p/ | signup     | signup-values | signup-raw |

  # Data layer event timeline 003
  Scenario Outline: Data layer event timeline 003
    When data layer timeline features are inspected
    Then timeline filtering is not present
    And timeline search is not present
    And validation results are not present

    Examples:
      | project_name         |
      | my-chrome-utilities |
