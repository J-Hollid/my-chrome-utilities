Feature: Data layer active page read result

  Background:
    Given a repository for project <project_name>
    And history array path <history_path> is configured
    And a data layer testing session is active

  # Data layer active page read result 001
  Scenario Outline: Data layer active page read result 001
    Given active website page <page_url> defines history array path <history_path> with existing entry <event_name>
    When the extension reads history array path <history_path> from the active website page
    Then the active page read succeeds
    And the active page read result includes history array path <history_path>
    And the active page read result is not empty
    And observer status <status> is shown for history array path <history_path>

    Examples:
      | project_name         | history_path     | page_url                | event_name | status |
      | my-chrome-utilities | test_obj.history | https://example.test/p/ | signup     | ready  |

  # Data layer active page read result 002
  Scenario Outline: Data layer active page read result 002
    Given active website page <page_url> cannot be read by the extension
    When observation starts for the active website page
    Then page access status <page_access_status> is shown
    And observer status is not <path_status>
    And no empty page object is used as a successful page read

    Examples:
      | project_name         | history_path     | page_url                | page_access_status     | path_status  |
      | my-chrome-utilities | test_obj.history | https://example.test/p/ | page access unavailable | path missing |
