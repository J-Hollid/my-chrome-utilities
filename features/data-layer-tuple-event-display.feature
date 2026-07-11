# mutation-stamp: sha256=e5320516d76b65451329b6b1a1b948bfed9797790d00e7735d288af1bcd1dbc5
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T23:15:51.914679941Z","feature_name":"Data layer tuple event display","feature_path":"features/data-layer-tuple-event-display.feature","background_hash":"1ed406330c33164448b1b64f5e6411da604de2b6e19e02c7feda7ced47da0b2d","implementation_hash":"sha256:live-event-inspector-ux-v1","scenarios":[{"index":0,"name":"Data layer tuple event display 001","scenario_hash":"a9615767270be254731eac71e354460b9b625a389b4d7b0f0d21ccd9236e86a9","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:15:51.914679941Z"}]}
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
    And canonical fields retain event name <event_name>, observer path <history_path>, and timestamp <timestamp>
    And summary configuration prioritizes <first_property> then <second_property>
    When the side panel renders the observed event
    Then the visible event row shows <event_name>, <timestamp>, source <history_path>, validation state, <first_property>, and <second_property>
    And no third summary property is displayed
    And payload properties <first_property>, <second_property>, and <third_property> are available in the Payload section
    And the complete tuple is available through a collapsed Raw input disclosure without duplicating payload by default

    Examples:
      | project_name         | event_name | history_path  | timestamp            | payload_object                                                       | first_property                  | second_property       | third_property                  |
      | my-chrome-utilities | pageview   | event.history | 2026-07-09T20:00:00Z | page_name, page_type, propertyx                                      | page_name: "example page_name"  | page_type: "homepage" | propertyx: "example property"  |
