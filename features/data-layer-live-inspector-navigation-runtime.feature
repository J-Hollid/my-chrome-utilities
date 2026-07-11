# mutation-stamp: sha256=e95c00c7c39e6bc7057d43967a4afd23e8ace4f4c29d8e8f88c71c30b15c148e
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-11T00:12:20.830588456Z","feature_name":"Data Layer Live inspector navigation runtime","feature_path":"features/data-layer-live-inspector-navigation-runtime.feature","background_hash":"815fb304ce01c28691540ab7f4c4fc52c28d511e6f699f5f8038cfa2542570b4","implementation_hash":"sha256:live-inspector-runtime-integration-v1","scenarios":[]}
# acceptance-mutation-manifest-end

Feature: Data Layer Live inspector navigation runtime

  Background:
    Given the built extension side panel is running in a browser at 320 CSS px wide
    And captured event purchase is available in the Live event list

  # Data Layer Live inspector navigation runtime 001
  Scenario: Data Layer Live inspector navigation runtime 001
    Given the Live event list has keyboard focus on event purchase
    When the user opens event purchase
    Then the event list has computed display none
    And the inspector and Back to events control have computed display other than none
    And Back to events has no hidden ancestor
    When the user activates Back to events
    Then the inspector has computed display none
    And the event list has computed display other than none
    And keyboard focus returns to event purchase
