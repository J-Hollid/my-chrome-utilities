# mutation-stamp: sha256=9a68de2a9164936f8e297a69841c8ccb2563f9e01a0ff960163a9ef9afa8a210
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-11T00:12:20.947714705Z","feature_name":"Data Layer Live inspector layout runtime","feature_path":"features/data-layer-live-inspector-layout-runtime.feature","background_hash":"12da915c01085c3aa86081183b92624998ea827a73adaaf10b093082dd34f063","implementation_hash":"sha256:live-inspector-runtime-integration-v1","scenarios":[{"index":0,"name":"Data Layer Live inspector layout runtime 001","scenario_hash":"2c4966c2f2dbd88ba585e141a8b1a915b360cc1a402facc69d8dd0a651ecfb38","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-11T00:12:20.947714705Z"}]}
# acceptance-mutation-manifest-end

Feature: Data Layer Live inspector layout runtime

  Background:
    Given the built extension side panel is running in a browser at 320 CSS px wide
    And captured event purchase is open in the Live inspector

  # Data Layer Live inspector layout runtime 001
  Scenario Outline: Data Layer Live inspector layout runtime 001
    Given the selected event has a payload taller than viewport height <panel_height>
    When bounding rectangles are measured in the running side panel
    Then the live session header, source statuses, inspector, and inspector actions do not intersect
    And every inspector action is reachable by scrolling the active content region
    And the document has no horizontal overflow

    Examples:
      | panel_height |
      | 640 CSS px   |
