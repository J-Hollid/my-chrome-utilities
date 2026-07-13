# mutation-stamp: sha256=fda79b7ad19bc7e3a61b9a7b4395200aff0c88203fd56a1be05088adc917f9c5
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-13T08:41:45.162978520Z","feature_name":"Data layer defect report reproduction","feature_path":"features/data-layer-defect-report-reproduction.feature","background_hash":"d9768cb62230d232dc3c2961bf4e5ece9197a1278d334c76ceb415ed4b30d0d0","implementation_hash":"sha256:f7f6b5cbb393fdd8834d7429ed92a5442df7a9db1fd4b730426860a2b07c5939","scenarios":[]}
# acceptance-mutation-manifest-end

Feature: Data layer defect report reproduction

  Background:
    Given a defect report is being built from invalid event purchase
    And its testing session retains pathname visits and captured event chronology

  # Data layer defect report reproduction 001
  Scenario: Data layer defect report reproduction 001
    Given the operator selects pathname visit /products as the reproduction start
    And the defect event belongs to a later /checkout visit
    When a pathname skeleton is generated
    Then one editable reproduction step is created for each contiguous pathname visit from /products through /checkout
    And the steps are ordered from the selected start to the defect event
    And captured events are not inserted into the pathname steps

  # Data layer defect report reproduction 002
  Scenario: Data layer defect report reproduction 002
    Given the selected range visits /products, then /checkout, then /products
    When a pathname skeleton is generated
    Then the two noncontiguous /products visits produce distinct reproduction steps
    And consecutive events within the same pathname visit do not produce duplicate steps

  # Data layer defect report reproduction 003
  Scenario: Data layer defect report reproduction 003
    Given the session timeline contains pageview, promotion, checkout, and purchase
    When the timeline builder is opened
    Then no timeline event is selected for the report
    And events can be filtered by event name, source, pathname, and validation state
    And the operator can select and deselect individual timeline events
    And payload and validation details remain excluded unless the operator includes them for a selected event

  # Data layer defect report reproduction 004
  Scenario: Data layer defect report reproduction 004
    Given the operator selects pageview summary and purchase validation details from the session timeline
    When Supporting timeline is added to the report
    Then only pageview and purchase appear in Supporting timeline
    And they remain in capture chronology
    And each entry contains capture time, event name, source, and pathname
    And pageview contains its summary without its payload or validation details
    And purchase contains its validation details without its payload
    And unselected timeline events do not appear in the report

  # Data layer defect report reproduction 005
  Scenario: Data layer defect report reproduction 005
    Given the pathname skeleton contains operator edits
    And Supporting timeline contains selected events
    When the operator changes the timeline selection
    Then the pathname skeleton edits remain unchanged
    And Supporting timeline reflects the changed selection
