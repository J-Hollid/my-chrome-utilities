# mutation-stamp: sha256=a40fce66f549fbd8146c8bfd03fa759908fe657d197c97d324c5473b1f9cdb9a
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-09T21:32:02.124789538Z","feature_name":"Data layer tuple event display","feature_path":"features/data-layer-tuple-event-display.feature","background_hash":"1ed406330c33164448b1b64f5e6411da604de2b6e19e02c7feda7ced47da0b2d","implementation_hash":"sha256:83c03c78af432c3e3f28f0343b0300eb60df05978e5d4e5984bb16497ac1b636","scenarios":[{"index":0,"name":"Data layer tuple event display 001","scenario_hash":"3e5603a77a50c33fc653aad664c7a7758253d5ecc7165ce471379a95b2ee3801","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-09T21:31:47.438424075Z"}]}
# acceptance-mutation-manifest-end

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
    Then the event row shows <event_name> with a distinct source label for <history_path>
    And compact time is derived from <timestamp> without replacing the event name
    And payload properties <first_property>, <second_property>, and <third_property> are available in the Fields inspector
    And the complete tuple is available separately in the Raw inspector

    Examples:
      | project_name         | event_name | history_path  | timestamp            | payload_object                                                       | first_property                  | second_property       | third_property                  |
      | my-chrome-utilities | pageview   | event.history | 2026-07-09T20:00:00Z | page_name, page_type, propertyx                                      | page_name: "example page_name"  | page_type: "homepage" | propertyx: "example property"  |
