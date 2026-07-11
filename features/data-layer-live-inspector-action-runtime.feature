# mutation-stamp: sha256=6a97dfbfd5b9a67d7273e9f9c588384a334b43190e1d2798b0ae3a05b444c61e
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-11T00:12:20.962684984Z","feature_name":"Data Layer Live inspector action runtime","feature_path":"features/data-layer-live-inspector-action-runtime.feature","background_hash":"12da915c01085c3aa86081183b92624998ea827a73adaaf10b093082dd34f063","implementation_hash":"sha256:live-inspector-runtime-integration-v1","scenarios":[{"index":2,"name":"Data Layer Live inspector action runtime 003","scenario_hash":"b47a8a17a764eb39be646f3686ad16a5bebd756af2280fd047b550c8a25c62ba","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-11T00:12:20.962684984Z"}]}
# acceptance-mutation-manifest-end

Feature: Data Layer Live inspector action runtime

  Background:
    Given the built extension side panel is running in a browser at 320 CSS px wide
    And captured event purchase is open in the Live inspector

  # Data Layer Live inspector action runtime 001
  Scenario: Data Layer Live inspector action runtime 001
    Given the browser clipboard does not contain the selected event payload
    When the user activates Copy payload
    Then the browser clipboard contains the selected event payload as canonical JSON
    And success feedback is absent until the clipboard operation resolves successfully

  # Data Layer Live inspector action runtime 002
  Scenario: Data Layer Live inspector action runtime 002
    Given the Library does not contain a template for the selected event
    When the user activates Save to Library
    Then browser storage contains one persisted editable template for the selected event
    And opening the Library view displays that saved template
    And the Live inspector reports the actual saved template result

  # Data Layer Live inspector action runtime 003
  Scenario Outline: Data Layer Live inspector action runtime 003
    Given assigned schema <schema_name> produces validation state <result_state> for the selected event
    When the user activates Validate
    Then the running validator is invoked for the selected event and <schema_name>
    And the existing event shows validation state <result_state> in the feed and inspector
    And the event count is unchanged

    Examples:
      | schema_name | result_state |
      | Purchase v2 | 2 issues     |
