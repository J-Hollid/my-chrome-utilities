# mutation-stamp: sha256=b1e2a9ff3602ce1ed387945baddafe69b30b0a8d09399e6860654b24baa2c4af
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T23:55:22.276418070Z","feature_name":"Data Layer Live inspector navigation","feature_path":"features/data-layer-live-inspector-navigation.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:live-inspector-interaction-regressions-v1","scenarios":[{"index":0,"name":"Data Layer Live inspector navigation 001","scenario_hash":"c2e4c125473574d5acc7f0b82af42c4e50f41d27336e60a209a62c30357ce231","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:55:22.276418070Z"},{"index":1,"name":"Data Layer Live inspector navigation 002","scenario_hash":"0cd4cfffe7f6cc3d6076b19d24e90489af2814a8affdfe69c2af77eefbc24182","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:55:22.276418070Z"}]}
# acceptance-mutation-manifest-end

Feature: Data Layer Live inspector navigation

  # Data Layer Live inspector navigation 001
  Scenario Outline: Data Layer Live inspector navigation 001
    Given the Live event list is displayed at available width <panel_width>
    And event <event_name> is visible at feed scroll position <scroll_position>
    When event <event_name> is opened
    Then the inspector replaces the event list
    And a visible Back to events control remains inside the visible inspector context
    And the return control is keyboard reachable while the event list is hidden
    When Back to events is activated
    Then the inspector closes and the event list is displayed
    And keyboard focus returns to event <event_name>
    And the feed filters and scroll position <scroll_position> are restored

    Examples:
      | panel_width | event_name | scroll_position |
      | 320 CSS px  | banner     | 480 CSS px      |

  # Data Layer Live inspector navigation 002
  Scenario Outline: Data Layer Live inspector navigation 002
    Given event <event_name> is open in the Live inspector
    And no inspector disclosure or modal interaction is active
    When Escape is pressed
    Then the inspector closes and the event list is displayed
    And keyboard focus returns to event <event_name>

    Examples:
      | event_name |
      | banner     |
