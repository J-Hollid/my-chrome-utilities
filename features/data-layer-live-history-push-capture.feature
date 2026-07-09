Feature: Data layer live history push capture

  Background:
    Given a repository for project <project_name>
    And history array path <history_path> is configured

  # Data layer live history push capture 001
  Scenario Outline: Data layer live history push capture 001
    Given page <page_url> has no queued data layer entries at <history_path>
    And data layer testing is started from the side panel for the active website page
    When the active website page pushes history entry <event_name> with payload <payload_label>
    Then the side panel session timeline shows initial page entry <page_url> and observed event <event_name>
    And the observed event entry matches page URL <page_url>, observer path <history_path>, and payload <payload_label>

    Examples:
      | project_name         | history_path     | page_url                 | event_name | payload_label |
      | my-chrome-utilities | dataLayerHistory | https://www.example.com/ | signup     | signup-values |

  # Data layer live history push capture 002
  Scenario Outline: Data layer live history push capture 002
    Given before testing starts, page <page_url> has queued data layer entry <event_name> with payload <payload_label> at <history_path>
    When data layer testing is started from the side panel for the active website page
    Then the side panel session timeline shows initial page entry <page_url> and observed event <event_name>
    And the observed event entry matches page URL <page_url>, observer path <history_path>, and payload <payload_label>

    Examples:
      | project_name         | history_path     | page_url                 | event_name | payload_label |
      | my-chrome-utilities | dataLayerHistory | https://www.example.com/ | signup     | signup-payload |
