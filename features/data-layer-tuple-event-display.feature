Feature: Data layer tuple event display

  Background:
    Given a repository for project <project_name>
    And a data layer testing session is active

  # Data layer tuple event display 001
  Scenario Outline: Data layer tuple event display 001
    Given observed data layer tuple [<event_name>, <payload_object>] is captured at <timestamp> from <history_path>
    When the side panel renders the observed event
    Then the observed event heading uses <event_name> instead of <timestamp> before observer path <history_path>
    And payload properties <first_property>, <second_property>, and <third_property> are displayed as separate event detail lines
    And raw payload object display is not shown for the observed event

    Examples:
      | project_name         | event_name | history_path  | timestamp            | payload_object                                                       | first_property                  | second_property       | third_property                  |
      | my-chrome-utilities | pageview   | event.history | 2026-07-09T20:00:00Z | page_name, page_type, propertyx                                      | page_name: "example page_name"  | page_type: "homepage" | propertyx: "example property"  |
