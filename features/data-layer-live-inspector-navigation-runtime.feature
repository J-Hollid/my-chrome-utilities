# mutation-stamp: sha256=e95c00c7c39e6bc7057d43967a4afd23e8ace4f4c29d8e8f88c71c30b15c148e
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-11T00:12:20.830588456Z","feature_name":"Data Layer Live inspector navigation runtime","feature_path":"features/data-layer-live-inspector-navigation-runtime.feature","background_hash":"815fb304ce01c28691540ab7f4c4fc52c28d511e6f699f5f8038cfa2542570b4","implementation_hash":"sha256:live-inspector-runtime-integration-v1","scenarios":[]}
# acceptance-mutation-manifest-end

Feature: Data Layer Live inspector navigation runtime

  Background:
    Given the built extension side panel is running in a browser at 360 CSS px wide
    And captured event purchase is available in the Live event list

  # Data Layer Live inspector navigation runtime 001
  Scenario: Data Layer Live inspector navigation runtime 001
    Given the navigation return snapshot records row purchase and offset 480 CSS px
    And the observation lifecycle snapshot reports Capturing
    When the user opens event purchase
    Then computed layout removes the event list
    And computed layout includes the inspector and visible Back to events control
    And Back to events is in the inspector header before inspector body content
    And Back to events has no hidden ancestor
    And Back to events is not contained by the event-list element
    When the user activates Back to events
    Then the inspector leaves the rendered layout
    And the event list re-enters the layout
    And document activeElement is the purchase row
    And restored feed scrollTop equals 480 CSS px
    And inspector navigation never changes the observation lifecycle snapshot
