# mutation-stamp: sha256=12a5b0aa306d87441659bf1ee6f3338f0e3feb8745539727f97d11792e3197cd
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-13T10:32:10.125039001Z","feature_name":"Data layer defect report reproduction","feature_path":"features/data-layer-defect-report-reproduction.feature","background_hash":"e4c166b6670887cd89442e4e9bbbcdbb874c101aa28f80970f0750bf764c97ca","implementation_hash":"sha256:f7f6b5cbb393fdd8834d7429ed92a5442df7a9db1fd4b730426860a2b07c5939","scenarios":[]}
# acceptance-mutation-manifest-end

Feature: Data layer defect report reproduction

  Background:
    Given a defect report is being built from invalid event purchase
    And its testing session retains pathname visits and captured event chronology
    And the captured session contains pageview, promotion, checkout, and purchase

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
    Given no event has been added to Supporting timeline
    When the timeline builder is displayed
    Then an empty state and Add event to timeline are displayed
    And captured events and their evidence controls are not listed in the timeline builder
    And the pathname skeleton remains independently editable

  # Data layer defect report reproduction 004
  Scenario: Data layer defect report reproduction 004
    When the operator activates Add event to timeline
    Then an event-selection stage explains that one captured event must be selected
    And each event choice identifies capture time, event name, source, pathname, and validation state
    And search and filters for event name, source, pathname, and validation state are available within the event-selection stage
    And matching event choices are displayed newest first in a bounded result window
    And older matches can be loaded without rendering the complete session at once
    And exactly one event can be selected before continuing
    And evidence configuration controls are not displayed before an event is selected

  # Data layer defect report reproduction 005
  Scenario: Data layer defect report reproduction 005
    Given the event-selection stage is displayed
    When the operator selects purchase
    Then an evidence-configuration stage identifies purchase as the selected event
    And event choices are no longer displayed
    And capture time, event name, source, and pathname are identified as always included
    And Summary is explained as the compact event summary
    And Payload is explained as the captured event JSON
    And Validation details is explained as schema, rule, and issue information
    And Back to event selection, Add to timeline, and Cancel are available

  # Data layer defect report reproduction 006
  Scenario: Data layer defect report reproduction 006
    Given purchase is configured for a new timeline entry
    And only Validation details is included in its evidence configuration
    When the operator activates Add to timeline
    Then one purchase entry is added to Supporting timeline
    And it contains capture time, event name, source, pathname, and validation details
    And summary and payload are excluded
    And the entry identifies Validation details as included
    And Adjust and Remove are available for the entry
    And the add-event stages are closed

  # Data layer defect report reproduction 007
  Scenario: Data layer defect report reproduction 007
    Given purchase is configured for a new timeline entry
    And the pathname skeleton contains operator edits
    When the operator activates Cancel
    Then purchase is not added to Supporting timeline
    And the pathname skeleton edits remain unchanged
    And focus returns to Add event to timeline

  # Data layer defect report reproduction 008
  Scenario: Data layer defect report reproduction 008
    Given Supporting timeline contains purchase with Validation details
    When the operator activates Adjust for purchase
    Then the evidence-configuration stage is prefilled with purchase and Validation details
    When the operator replaces Validation details with Payload and activates Save changes
    Then the existing purchase entry contains payload without validation details
    And no duplicate purchase entry is created
    And focus returns to Adjust for purchase

  # Data layer defect report reproduction 009
  Scenario: Data layer defect report reproduction 009
    Given purchase is the only entry in Supporting timeline
    When the operator activates Remove for purchase
    Then purchase is removed from Supporting timeline
    And the captured purchase event remains in the testing session
    And the timeline builder displays its empty state

  # Data layer defect report reproduction 010
  Scenario: Data layer defect report reproduction 010
    Given purchase has already been added to Supporting timeline
    When the operator opens the event-selection stage
    Then purchase is identified as Already added and cannot be added again
    And Adjust is available for the existing purchase entry

  # Data layer defect report reproduction 011
  Scenario: Data layer defect report reproduction 011
    Given purchase is added before the earlier captured pageview event
    When both entries are displayed in Supporting timeline
    Then pageview appears before purchase in capture chronology
    And adding events in another order does not change timeline chronology
