Feature: Data layer missing event defect report runtime

  Background:
    Given the built extension side panel is running with production Live sessions, Schema Library, defect reporting, and Jira Cloud export
    And a production testing session contains a visit to https://shop.example/checkout
    And Checkout purchase revision 4 has an enabled purchase assignment for event-history on /checkout

  # Data layer missing event defect report runtime 001
  Scenario Outline: Data layer missing event defect report runtime 001
    Given the checkout visit contains 0 captured purchase events
    When the operator activates rendered Report missing event from <entry_point>
    And selects Checkout purchase revision 4 and the checkout visit
    And confirms that at least one matching event was expected
    Then the production defect model stores a Missing event report without a captured-event identity
    And Actual result renders No matching purchase event was captured
    And Expected result references Checkout purchase revision 4 and its enabled assignment
    And no actual payload, capture timestamp, or validation issue is stored or rendered

    Examples:
      | entry_point            |
      | Live session actions   |
      | schema row actions     |

  # Data layer missing event defect report runtime 002
  Scenario Outline: Data layer missing event defect report runtime 002
    Given production session chronology contains <matching_count> purchase events inside the selected checkout scope
    When rendered absence verification runs
    Then warning visibility is <warning_visibility>
    And ordinary continuation is <continuation_state>
    And reported matching count is <matching_count>

    Examples:
      | matching_count | warning_visibility | continuation_state                 |
      | 0              | hidden             | available without override          |
      | 1              | visible            | available through explicit override |
      | 2              | visible            | available through explicit override |

  # Data layer missing event defect report runtime 003
  Scenario: Data layer missing event defect report runtime 003
    Given production absence verification finds 1 matching purchase event
    When the operator opens that event from the warning and returns
    Then the defect draft and warning are restored
    When the operator activates rendered Create missing-event report anyway
    Then the production report retains the matching event identity, capture evidence, and explicit override
    And report generation and Jira Cloud export remain available
    And the matching event remains unchanged and visible in the Live feed

  # Data layer missing event defect report runtime 004
  Scenario: Data layer missing event defect report runtime 004
    Given a purchase event exists in checkout visit 1 but not checkout visit 2
    When the operator changes the rendered expectation scope from visit 1 to visit 2
    Then production matching changes from 1 event to 0 events
    And the warning closes without recording an override
    When the operator changes the scope back to visit 1
    Then production matching returns to 1 event and the warning reopens

  # Data layer missing event defect report runtime 005
  Scenario Outline: Data layer missing event defect report runtime 005
    Given Checkout purchase revision 4 has <assignment_context>
    When the rendered expectation editor selects that schema
    Then production prefill is <prefill_result>
    And the operator must perform <required_action> before report creation

    Examples:
      | assignment_context                    | prefill_result                            | required_action                              |
      | 1 enabled covering assignment         | source, event, target, domain, and path    | confirm the event expectation                 |
      | 2 enabled covering assignments        | readable assignment choices                | choose an assignment and confirm expectation  |
      | no enabled covering assignment        | editable schema-referenced event details    | acknowledge warning and confirm expectation   |

  # Data layer missing event defect report runtime 006
  Scenario: Data layer missing event defect report runtime 006
    Given the operator completes a production missing-event report with schema, assignment, visit, interval, and timeline evidence
    When the rendered final preview and Copy for Jira Cloud representations are generated
    Then both representations identify Missing event, No matching event captured, and the exact expected schema revision
    And both distinguish schema expectations from observed capture evidence
    And both omit actual JSON and property-validation differences
    And override evidence appears in both representations only when an override was recorded

  # Data layer missing event defect report runtime 007
  Scenario: Data layer missing event defect report runtime 007
    Given a saved session contains 0 purchase events in the checkout visit
    When the production saved-session Live view creates and reopens a missing-event report
    Then the report uses the saved page-visit chronology and exact selected schema revision
    And later production capture cannot change its absence result or supporting timeline
    And rendered Back to selected page visit and Back to Live feed restore focus and scroll without a captured-event target
