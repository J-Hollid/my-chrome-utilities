Feature: Data layer testing session

  Background:
    Given a repository for project <project_name>
    And history array path <history_path> is configured

  # Data layer testing session 001
  Scenario Outline: Data layer testing session 001
    When command <command_id> is run for the active tab
    Then a data layer testing session starts for the active tab
    And the session scope is the active tab journey
    And the side panel shows the session as active
    And the active session uses history array path <history_path>

    Examples:
      | project_name         | history_path  | command_id               |
      | my-chrome-utilities | queue.history | data-layer.start-testing |

  # Data layer testing session 002
  Scenario Outline: Data layer testing session 002
    Given a data layer testing session is active
    When the active tab navigates or reloads from <start_url> to <next_url>
    Then the same data layer testing session remains active
    And captured event entries remain part of the same session timeline

    Examples:
      | project_name         | history_path  | start_url             | next_url                |
      | my-chrome-utilities | queue.history | https://example.test/ | https://example.test/p/ |
      | my-chrome-utilities | queue.history | https://example.test/ | https://example.test/   |

  # Data layer testing session 003
  Scenario Outline: Data layer testing session 003
    Given a data layer testing session is active
    When the side panel is reopened
    Then the active session is restored from local persistence
    And captured event entries remain visible

    Examples:
      | project_name         | history_path  |
      | my-chrome-utilities | queue.history |

  # Data layer testing session 004
  Scenario Outline: Data layer testing session 004
    Given a data layer testing session is active
    When command <command_id> is run for the active tab
    Then an active session warning is shown
    And the existing data layer testing session remains unchanged

    Examples:
      | project_name         | history_path  | command_id               |
      | my-chrome-utilities | queue.history | data-layer.start-testing |

  # Data layer testing session 005
  Scenario Outline: Data layer testing session 005
    Given a data layer testing session is active
    When command <command_id> is run for the active tab
    Then the data layer testing session ends intentionally
    And no new page entries are captured for that ended session

    Examples:
      | project_name         | history_path  | command_id             |
      | my-chrome-utilities | queue.history | data-layer.end-testing |

  # Data layer testing session 006
  Scenario Outline: Data layer testing session 006
    When data layer testing session features are inspected
    Then a multi-profile session manager is not present
    And event replay is not present

    Examples:
      | project_name         | history_path  |
      | my-chrome-utilities | queue.history |
