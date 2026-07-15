Feature: Data layer event occurrence defect report

  Background:
    Given a testing session contains a valid page_view event captured during the /products page visit
    And the captured event has source event-history, target payload, and payload {"page_type":"product_detail","product_id":"robot-1"}
    And the common defect-report builder is available

  # Data layer event occurrence defect report 001
  Scenario Outline: Data layer event occurrence defect report 001
    Given page_view has <validation_state>
    When the operator opens its report actions
    Then Report unexpected event and Report wrong event name are available
    And choosing <report_action> opens the common builder with evidence stage <evidence_stage>
    And no selected validation issue is required

    Examples:
      | validation_state | report_action            | evidence_stage                                      |
      | Valid            | Report unexpected event  | captured occurrence and absence expectation         |
      | Valid            | Report wrong event name  | captured occurrence and replacement event identity  |
      | 1 issue          | Report unexpected event  | captured occurrence and absence expectation         |

  # Data layer event occurrence defect report 002
  Scenario: Data layer event occurrence defect report 002
    Given the operator confirms page_view should not have fired during the products visit
    When the Unexpected event report is presented
    Then Actual result contains captured page_view identity, payload, validation state, source, capture time, URL, and page-visit identity
    And Expected result states no page_view event is fired during /products
    And Differences states captured page_view was an unexpected occurrence
    And no expected payload, validation failure, or corrected property is invented

  # Data layer event occurrence defect report 003
  Scenario: Data layer event occurrence defect report 003
    Given the operator confirms product_view should have fired instead of page_view
    When the Wrong event name report is presented
    Then Actual result contains captured page_view and its unchanged payload
    And Expected result contains product_view with the accepted expected payload
    And Differences states page_view was fired and product_view should have been fired instead
    And event-name substitution is distinct from a payload add, replace, or remove correction

  # Data layer event occurrence defect report 004
  Scenario Outline: Data layer event occurrence defect report 004
    Given Wrong event name mode resolves expected identity from <identity_source>
    When expected event details are reviewed
    Then expected identity is <expected_identity>
    And operator action is <operator_action>

    Examples:
      | identity_source                                  | expected_identity                         | operator_action                                      |
      | one enabled covering product_view assignment     | assignment source, name, target, and scope | confirm the assignment                               |
      | several enabled covering assignments             | no assignment selected                     | choose one readable assignment                       |
      | no covering assignment and custom product_view   | explicit source, name, target, and scope    | acknowledge non-schema expectation and confirm       |
      | current page_view identity                        | unchanged captured identity                 | change the event name before completing the report   |

  # Data layer event occurrence defect report 005
  Scenario Outline: Data layer event occurrence defect report 005
    Given expected product_view uses <schema_relationship>
    When its expected payload is initialized
    Then payload outcome is <payload_outcome>
    And editing outcome is <editing_outcome>

    Examples:
      | schema_relationship                         | payload_outcome                              | editing_outcome                                      |
      | captured payload satisfies expected schema  | typed captured payload is reused unchanged   | optional editing remains available                   |
      | captured payload fails expected schema      | compatible values are prefilled              | invalid and missing fields require operator review   |
      | expected schema has additional properties   | captured values and schema tree are combined | recursive property and array editing is available    |
      | no expected schema is selected               | captured payload is retained as a draft       | warning and explicit operator confirmation are required |

  # Data layer event occurrence defect report 006
  Scenario Outline: Data layer event occurrence defect report 006
    Given occurrence evidence reports <evidence_condition>
    When the operator confirms <expectation>
    Then guardrail outcome is <guardrail_outcome>
    And the captured events remain visible and unchanged

    Examples:
      | evidence_condition                                      | expectation                              | guardrail_outcome                                      |
      | covering assignment says page_view applies on /products | page_view should not fire                | warning with explicit override                         |
      | product_view was also captured in the products visit    | product_view should replace page_view    | warning with matching event evidence and explicit override |
      | expected event name equals page_view                    | a different event name should be used    | completion blocked until identity differs              |
      | no contradictory assignment or captured event exists    | product_view should replace page_view    | expectation can be confirmed                           |

  # Data layer event occurrence defect report 007
  Scenario Outline: Data layer event occurrence defect report 007
    Given the reproduction journey starts at /listing and ends at the captured products visit
    When the operator chooses expectation mode <mode>
    Then the final assertion is <final_assertion>
    And Visit /listing and Visit /products remain captured pathname anchors
    And Click component, Log in as user, Scroll, and Custom steps can be added, adjusted, reordered, and removed between them

    Examples:
      | mode               | final_assertion                                                |
      | Unexpected event   | Expect no page_view event to be pushed during /products       |
      | Wrong event name   | Expect product_view instead of page_view during /products     |

  # Data layer event occurrence defect report 008
  Scenario: Data layer event occurrence defect report 008
    Given captured events surround page_view in the products visit
    When the operator composes Supporting timeline evidence
    Then the same searchable event chooser and Summary, Payload, and Validation details controls used by other defect reports are available
    And page_view can be included as captured evidence without duplicating Actual result
    And timeline entries remain in capture chronology
    And changing the reproduction start does not reassign the defect occurrence to another page visit

  # Data layer event occurrence defect report 009
  Scenario: Data layer event occurrence defect report 009
    Given page_view has validation state Valid
    When occurrence report evidence is generated
    Then Valid and the assigned schema identity are retained as captured context
    And no validation issue, failing pointer, rule failure, or corrected value is fabricated
    And an existing validation failure may be retained as context without becoming the occurrence defect identity
    And a separate validation-issue report remains available when applicable

  # Data layer event occurrence defect report 010
  Scenario: Data layer event occurrence defect report 010
    Given an occurrence report has expected identity, reproduction steps, timeline, and report detail edits
    When live preview, Jira rich text, Jira plain text, saved defect, reopened preview, and recopied output are compared
    Then Actual result, Expected result, Differences, occurrence evidence, steps, timeline, and edits are equivalent
    And the saved defect type is Unexpected event or Wrong event name according to expectation mode
    And notes and an optional matching saved session use the common Defect Library lifecycle

  # Data layer event occurrence defect report 011
  Scenario Outline: Data layer event occurrence defect report 011
    Given an active reported occurrence defect is matched against a current occurrence differing by <difference>
    When event-feed defect triage is computed
    Then match result is <match_result>

    Examples:
      | difference                         | match_result |
      | nothing                            | Reported     |
      | captured payload values            | Reported     |
      | capture time                       | Reported     |
      | same-URL page-load generation      | Reported     |
      | source display name                | Reported     |
      | source id                          | New          |
      | actual event name                  | New          |
      | validation target                  | New          |
      | pathname scope                     | New          |
      | expectation mode                   | New          |
      | expected event name in wrong-name mode | New       |
      | expected source or target in wrong-name mode | New    |

  # Data layer event occurrence defect report 012
  Scenario: Data layer event occurrence defect report 012
    Given a saved occurrence defect is linked to its captured page_view and testing session
    When the operator opens, edits, recopies, resolves, reopens, archives, searches, filters, or deletes it
    Then common Defect Library behavior is preserved
    And following its captured-event link restores the exact page visit and occurrence
    And returning restores Defects view position, report state, filters, scroll, and focus
    And no operation mutates captured events, immutable saved sessions, schemas, assignments, or page-visit association

