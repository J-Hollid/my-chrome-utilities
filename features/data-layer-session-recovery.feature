Feature: Data layer session recovery

  Background:
    Given a repository for project <project_name>
    And a data layer testing session is active

  # Data layer session recovery 001
  Scenario Outline: Data layer session recovery 001
    Given observed event entry <event_name> was captured on page <page_url>
    When the side panel is reopened after same-tab navigation to <next_url>
    Then the timeline still includes event entry <event_name>
    And the configured history array path <history_path> is restored
    And the event entry remains associated with page <page_url>

    Examples:
      | project_name         | history_path  | page_url                | next_url                    | event_name |
      | my-chrome-utilities | queue.history | https://example.test/p/ | https://example.test/cart/  | signup     |

  # Data layer session recovery 002
  Scenario Outline: Data layer session recovery 002
    When the active tab refreshes during a data layer testing session
    Then observer attachment status <status> is shown
    And the user can restart observation for the active tab

    Examples:
      | project_name         | status     |
      | my-chrome-utilities | attached   |
      | my-chrome-utilities | needs sync |

  # Data layer session recovery 003
  Scenario Outline: Data layer session recovery 003
    Given a data layer testing session was intentionally ended
    When the side panel is reopened
    Then the ended session remains ended
    And the observer is not reattached automatically

    Examples:
      | project_name         |
      | my-chrome-utilities |

  # Data layer session recovery 004
  Scenario Outline: Data layer session recovery 004
    When data layer session recovery features are inspected
    Then cross-device sync is not present
    And automatic background monitoring of every tab is not present

    Examples:
      | project_name         |
      | my-chrome-utilities |
