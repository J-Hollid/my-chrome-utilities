Feature: Data layer configurable history path

  Background:
    Given a repository for project <project_name>

  # Data layer configurable history path 001
  Scenario Outline: Data layer configurable history path 001
    When the data layer testing settings are opened
    Then the user can enter history array path <history_path>
    And the configured history array path is shown in the side panel
    And the configured history array path is persisted locally

    Examples:
      | project_name         | history_path             |
      | my-chrome-utilities | queue.history            |
      | my-chrome-utilities | test.test                |
      | my-chrome-utilities | some.deep.object.history |

  # Data layer configurable history path 002
  Scenario Outline: Data layer configurable history path 002
    Given history array path <history_path> is configured
    When the configured page object is checked
    Then path status <status> is shown in the side panel
    And no page script error is caused by the path check

    Examples:
      | project_name         | history_path  | status       |
      | my-chrome-utilities | queue.history | ready        |
      | my-chrome-utilities | missing.path  | path missing |
      | my-chrome-utilities | queue.value   | not an array |

  # Data layer configurable history path 003
  Scenario Outline: Data layer configurable history path 003
    When data layer settings are inspected
    Then config import is not present
    And config export is not present
    And validation schemas are not present

    Examples:
      | project_name         |
      | my-chrome-utilities |
