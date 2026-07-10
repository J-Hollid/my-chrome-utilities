# mutation-stamp: sha256=9814a724f33a388c788fdb9b7ee437f8ea3a18a8b72202172a64196d129a8ae0
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T23:55:22.286983072Z","feature_name":"Data Layer Live inspector layout","feature_path":"features/data-layer-live-inspector-layout.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:live-inspector-interaction-regressions-v1","scenarios":[{"index":0,"name":"Data Layer Live inspector layout 001","scenario_hash":"a5f145a3b818b83dc0f4bb77bc75f9fa8e98ef13e76b5aea86ecc868633d3636","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:55:22.286983072Z"},{"index":1,"name":"Data Layer Live inspector layout 002","scenario_hash":"a400d39e0ef9020c84da7430e7fcd2160704e2d74bad1c69a415fce2e904749f","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:55:22.286983072Z"}]}
# acceptance-mutation-manifest-end

Feature: Data Layer Live inspector layout

  # Data Layer Live inspector layout 001
  Scenario Outline: Data Layer Live inspector layout 001
    Given an event inspector is displayed at width <panel_width>, height <panel_height>, and text zoom <text_zoom>
    When the Live view's computed layout is inspected
    Then the live session header, source statuses, and event inspector occupy non-overlapping regions in that order
    And no inspector content or action obscures the live session header or source statuses
    And all inspector content reflows without horizontal document scrolling
    And the active content region can scroll to every inspector section and action

    Examples:
      | panel_width | panel_height | text_zoom  |
      | 320 CSS px  | 640 CSS px   | 100 percent |
      | 320 CSS px  | 640 CSS px   | 200 percent |

  # Data Layer Live inspector layout 002
  Scenario Outline: Data Layer Live inspector layout 002
    Given event <event_name> has a payload taller than the available Live content region
    When event <event_name> is inspected
    Then the inspector header, body, and action controls remain in one non-overlapping inspector layout
    And scrolling the inspector body does not move content underneath the session header or source statuses
    And Copy payload, Save to Library, Validate, and Back to events remain reachable

    Examples:
      | event_name |
      | purchase   |
