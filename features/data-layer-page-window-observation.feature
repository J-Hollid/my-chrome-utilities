Feature: Data layer page window observation

  Background:
    Given a repository for project <project_name>
    And history array path <history_path> is configured
    And a data layer testing session is active

  # Data layer page window observation 001
  Scenario Outline: Data layer page window observation 001
    Given active website page <page_url> defines history array path <history_path>
    When observation starts for the active website page
    Then observer status <status> is shown for history array path <history_path>
    And the observer resolves <history_path> from the active website page window

    Examples:
      | project_name         | history_path     | page_url                | status |
      | my-chrome-utilities | test_obj.history | https://example.test/p/ | ready  |

  # Data layer page window observation 002
  Scenario Outline: Data layer page window observation 002
    Given active website page <page_url> does not define history array path <history_path>
    When observation starts for the active website page
    Then observer status <status> is shown for history array path <history_path>
    And no observer is active for history array path <history_path>

    Examples:
      | project_name         | history_path  | page_url                | status       |
      | my-chrome-utilities | queue.history | https://example.test/p/ | path missing |

  # Data layer page window observation 003
  Scenario Outline: Data layer page window observation 003
    Given active website page <page_url> defines history array path <history_path>
    When page <page_url> appends history entry <event_name> with payload <payload_label>
    Then the extension records a new observed event entry
    And the observed event entry URL is <page_url>
    And the observed event entry observer path is <history_path>
    And the page-owned history array contains entry <event_name>

    Examples:
      | project_name         | history_path     | page_url                | event_name | payload_label |
      | my-chrome-utilities | test_obj.history | https://example.test/p/ | signup     | signup-values |
