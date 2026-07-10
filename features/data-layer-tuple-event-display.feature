Feature: Data layer tuple event display

  Background:
    Given a repository for project <project_name>
    And the project skeleton is inspected
    And package metadata identifies the project as <project_name>
    And a data layer testing session is active

  # Data layer tuple event display 001
  Scenario Outline: Data layer tuple event display 001
    Given observed data layer tuple [<event_name>, <payload_object>] is captured at <timestamp> from <history_path>
    And the tuple event uses the canonical event name
    And the tuple event uses the canonical observer path
    And the tuple event uses the canonical timestamp
    When the side panel renders the observed event
    Then the visible event row shows only <event_name> with a distinct source label for <history_path>
    And capture time <timestamp> remains available in the inspector without adding visible event-row text
    And payload properties <first_property>, <second_property>, and <third_property> are available in the Payload section
    And the complete tuple is available through a collapsed Raw input disclosure without duplicating payload by default

    Examples:
      | project_name         | event_name | history_path  | timestamp            | payload_object                                                       | first_property                  | second_property       | third_property                  |
      | my-chrome-utilities | pageview   | event.history | 2026-07-09T20:00:00Z | page_name, page_type, propertyx                                      | page_name: "example page_name"  | page_type: "homepage" | propertyx: "example property"  |
