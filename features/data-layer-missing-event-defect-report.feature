# mutation-stamp: sha256=be2d99d62b527292f4b601d4e50dbfffecb320fc33b068f47088a2a5db9a0141
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T14:31:01.044719434Z","feature_name":"Data layer missing event defect report","feature_path":"features/data-layer-missing-event-defect-report.feature","background_hash":"6a3fb6acd45f05f08c5a6b5ce8c81a32a18a2a115834dd8a4060b165f77d2863","implementation_hash":"sha256:72a263825e531f2492c6904f9c8ee32bcc01ab0f6d631014be91e399718d4489","scenarios":[{"index":0,"name":"Data layer missing event defect report 001","scenario_hash":"82d893f46815399a23b685063559cf6018a43c9dfd80e76efe4c048251f07670","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-14T14:31:01.044719434Z"},{"index":2,"name":"Data layer missing event defect report 003","scenario_hash":"1f59c57f8b39ecb95d5dd514bea8aa16810068475db6b59ec0d701c135ff6b11","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-14T14:31:01.044719434Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer missing event defect report

  Background:
    Given a testing session contains a visit to https://shop.example/checkout
    And Checkout purchase revision 4 has an enabled assignment for event purchase from source event-history on /checkout

  # Data layer missing event defect report 001
  Scenario Outline: Data layer missing event defect report 001
    Given no purchase event was captured during the checkout visit
    When the operator activates Report missing event from <entry_point>
    Then a missing-event defect builder opens without requiring a captured event
    And Checkout purchase revision 4 can be selected as the expected schema
    And the checkout visit can be selected as the expectation scope
    And no event payload, capture timestamp, or validation issue is fabricated

    Examples:
      | entry_point                         |
      | the Live session actions            |
      | the Checkout purchase schema actions |

  # Data layer missing event defect report 002
  Scenario: Data layer missing event defect report 002
    Given Checkout purchase revision 4 is selected
    When expected-event details are displayed
    Then its enabled assignment prefills purchase, event-history, payload, and /checkout
    And the builder explains that an assignment controls validation when an event appears but does not prove the event must occur
    And no missing-event assertion exists before the operator confirms At least one matching event was expected
    And the operator can edit event name, source, target, page visit, and expectation explanation before confirmation
    And confirming the expectation does not change the schema or assignment

  # Data layer missing event defect report 003
  Scenario Outline: Data layer missing event defect report 003
    Given the selected schema has <assignment_context>
    When expected-event defaults are resolved for the checkout visit
    Then the prefill result is <prefill_result>
    And expectation confirmation is <confirmation_requirement>

    Examples:
      | assignment_context                            | prefill_result                                      | confirmation_requirement                              |
      | 1 enabled assignment covering the visit       | source, event, target, domain, and path              | explicit operator confirmation                        |
      | 2 enabled assignments covering the visit      | readable assignment choices                          | explicit assignment choice and operator confirmation  |
      | no enabled assignment covering the visit      | schema identity with editable event details          | warning acknowledgement and operator confirmation     |
      | only a disabled assignment covering the visit | disabled assignment shown as non-authoritative context | warning acknowledgement and operator confirmation   |

  # Data layer missing event defect report 004
  Scenario: Data layer missing event defect report 004
    Given the operator confirms that at least one matching purchase event was expected during the checkout visit
    And the selected scope contains 0 matching events
    When report details are generated
    Then defect type is Missing event
    And Actual result states No matching purchase event was captured
    And Expected result states that at least one purchase event matching Checkout purchase revision 4 was expected
    And schema name and version, assignment context, expected source, event name, target, page URL, and observation interval are retained as evidence
    And the schema rules and documentation are available as expected-event context
    And no empty or invented actual JSON payload is presented

  # Data layer missing event defect report 005
  Scenario: Data layer missing event defect report 005
    Given the operator declares purchase missing during the checkout visit
    And 1 matching purchase event exists inside that scope
    When absence verification runs
    Then a warning identifies the matching event count, capture time, source, page URL, and validation state
    And the matching event can be opened without discarding the defect draft
    And the warning does not prohibit report creation
    And ordinary confirmation is replaced by an explicit Create missing-event report anyway action
    When the operator explicitly activates Create missing-event report anyway
    Then report creation continues without deleting or hiding the matching event
    And the report records the matching event evidence and the explicit operator override
    And an optional override explanation can be included

  # Data layer missing event defect report 006
  Scenario: Data layer missing event defect report 006
    Given absence verification found a matching purchase event
    When the operator changes the selected page visit or observation interval
    Then matching-event verification reruns against the new scope
    And an event outside the new scope does not prevent an unqualified missing-event report
    And returning to a scope containing the event restores the warning
    And no previous override applies automatically to a changed expectation or scope

  # Data layer missing event defect report 007
  Scenario: Data layer missing event defect report 007
    Given the operator edited assignment-prefilled expected-event details
    When a different schema revision or assignment is selected
    Then edited values are not silently replaced
    And a review identifies each proposed source, event, target, URL, or scope replacement
    And matching-event verification uses only the values accepted by the operator
    And the report retains the exact selected schema revision

  # Data layer missing event defect report 008
  Scenario: Data layer missing event defect report 008
    Given a missing-event report uses the checkout visit as its expectation scope
    When reproduction and timeline evidence are composed
    Then the checkout pathname visit is the initial reproduction context
    And manual reproduction steps can be added before the expected-event assertion
    And surrounding captured events can be selected as supporting timeline entries
    And timeline evidence distinguishes observed events from the absent expected purchase event
    And no timeline entry is synthesized for purchase

  # Data layer missing event defect report 009
  Scenario: Data layer missing event defect report 009
    Given a completed missing-event report references Checkout purchase revision 4
    When the final preview and Jira Cloud representation are produced
    Then Summary and Description identify a missing purchase event rather than failed payload validation
    And Actual result, Expected result, Steps to reproduce, Schema expectation, Capture evidence, and Supporting timeline are available
    And schema constraints and documentation are identified as expectations rather than observed values
    And matching-event warning and override evidence are included when an override occurred
    And the representation contains no fabricated payload, validation issue, or event timestamp

  # Data layer missing event defect report 010
  Scenario: Data layer missing event defect report 010
    Given the builder was opened without a captured defect event
    When its navigation controls are displayed
    Then Back to selected page visit and Back to Live feed are available
    And Back to captured event is absent
    And returning to the builder restores its schema, expectation, scope, warning, and override state
    And keyboard focus returns to Report missing event

  # Data layer missing event defect report 011
  Scenario: Data layer missing event defect report 011
    Given a saved testing session contains the checkout visit and no matching purchase event
    When the operator creates a missing-event report from that saved session
    Then absence verification uses the saved immutable event chronology and page visits
    And the report references the selected schema revision without altering the saved session
    And later live events do not retroactively change the saved-session absence result
