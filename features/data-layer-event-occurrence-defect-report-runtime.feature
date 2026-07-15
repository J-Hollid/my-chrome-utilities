Feature: Data layer event occurrence defect report runtime

  Background:
    Given the built extension side panel is running with production Live observation, validation, common defect reporting, Jira export, Defect Library persistence, and saved sessions
    And a production Valid page_view with payload {"page_type":"product_detail","product_id":"robot-1"} is captured during the /products page visit

  # Data layer event occurrence defect report runtime 001
  Scenario Outline: Data layer event occurrence defect report runtime 001
    When the operator opens actual report actions and selects <report_action>
    Then the production common builder opens with evidence stage <evidence_stage>
    And Expected result, Steps to reproduce, Supporting timeline, Report details, preview, copy, and save use production common controls
    And no validation issue is synthesized or required

    Examples:
      | report_action            | evidence_stage                                      |
      | Report unexpected event  | captured occurrence and absence expectation         |
      | Report wrong event name  | captured occurrence and replacement event identity  |

  # Data layer event occurrence defect report runtime 002
  Scenario: Data layer event occurrence defect report runtime 002
    Given the operator confirms through actual controls that page_view should not have fired
    When the production Final report preview renders
    Then Actual result renders the captured page_view identity, valid typed payload, validation state, capture evidence, and page visit
    And Expected result renders that no page_view event is fired during /products
    And Differences identifies an unexpected occurrence without payload corrections
    And production report type is Unexpected event

  # Data layer event occurrence defect report runtime 003
  Scenario: Data layer event occurrence defect report runtime 003
    Given the operator selects production product_view assignment as the expected identity
    When the actual Wrong event name report preview renders
    Then Actual result renders captured page_view and its unchanged payload
    And Expected result renders product_view with the accepted expected payload
    And Differences identifies event-name substitution separately from payload corrections
    And production report type is Wrong event name

  # Data layer event occurrence defect report runtime 004
  Scenario Outline: Data layer event occurrence defect report runtime 004
    Given production expected product_view has <schema_relationship>
    When the actual expected-identity and payload controls initialize
    Then production payload state is <payload_state>
    And completion state is <completion_state>

    Examples:
      | schema_relationship                        | payload_state                                  | completion_state                                  |
      | compatible assigned schema                 | typed captured payload reused                  | ready with optional editing                       |
      | incompatible assigned schema               | compatible captured fields prefilled           | blocked on invalid and missing expected fields    |
      | nested object and array schema              | recursive schema tree and captured values shown | ready after required nested values are completed  |
      | no covering assignment and custom identity | captured payload retained as draft             | blocked on warning acknowledgement and confirmation |

  # Data layer event occurrence defect report runtime 005
  Scenario Outline: Data layer event occurrence defect report runtime 005
    Given production occurrence evidence contains <contradiction>
    When the operator confirms <expectation> through rendered controls
    Then rendered guardrail is <guardrail>

    Examples:
      | contradiction                                      | expectation                           | guardrail                                           |
      | covering page_view assignment                      | page_view should not fire             | explicit override required                          |
      | captured product_view in the same page visit       | product_view should replace page_view | matching event evidence and explicit override required |
      | expected identity still named page_view            | different event should fire           | completion blocked                                  |
      | none                                               | product_view should replace page_view | confirmation accepted                               |

  # Data layer event occurrence defect report runtime 006
  Scenario Outline: Data layer event occurrence defect report runtime 006
    Given production reproduction start is /listing and endpoint is the captured /products visit
    When the operator selects <mode> and edits the journey through actual common controls
    Then the rendered final assertion is <assertion>
    And production pathname anchors, manual steps, reorder, removal, focus restoration, and scroll behavior match the other defect builders

    Examples:
      | mode               | assertion                                                       |
      | Unexpected event   | Expect no page_view event to be pushed during /products          |
      | Wrong event name   | Expect product_view instead of page_view during /products        |

  # Data layer event occurrence defect report runtime 007
  Scenario: Data layer event occurrence defect report runtime 007
    Given the production occurrence report contains reproduction steps, selected timeline evidence, and report edits
    When Copy for Jira Cloud, plain-text fallback, Save as reported defect, reopen, and recopy are exercised through actual controls
    Then every representation retains equivalent Actual, Expected, Differences, occurrence evidence, steps, timeline, and edits
    And the persisted record retains expectation mode, actual identity, expected identity, page-visit scope, and optional saved-session link
    And reopening restores report navigation, scroll, and focus

  # Data layer event occurrence defect report runtime 008
  Scenario Outline: Data layer event occurrence defect report runtime 008
    Given a production active occurrence defect differs from the current occurrence by <difference>
    When actual Live event triage and duplicate-save review run
    Then production match result is <match_result>
    And an active match links to the existing defect without suppressing validation state

    Examples:
      | difference                  | match_result |
      | captured payload            | Reported     |
      | capture time                | Reported     |
      | same-URL reload generation  | Reported     |
      | source id                   | New          |
      | actual event name           | New          |
      | pathname scope              | New          |
      | expectation mode            | New          |
      | wrong-name expected identity | New         |

  # Data layer event occurrence defect report runtime 009
  Scenario: Data layer event occurrence defect report runtime 009
    Given a production occurrence defect is linked to an immutable saved session
    When the operator follows its captured occurrence link and returns
    Then Saved session Live mode opens the exact event and page-visit generation without starting observation
    And returning restores the same defect, Defects filters, list position, scroll, and focus
    And editing report details or notes does not mutate the saved session or captured event

  # Data layer event occurrence defect report runtime 010
  Scenario: Data layer event occurrence defect report runtime 010
    Given the actual occurrence builder is 320 CSS pixels wide with a long nested payload and reproduction journey
    When the operator completes both expectation modes using keyboard controls
    Then identity choices, guardrails, expected payload, steps, timeline, preview, copy, and save remain reachable without horizontal page scrolling
    And meaning remains identifiable without relying on color
    And runtime coverage enters from the production Valid Live event and exercises actual occurrence modeling, assignment resolution, expected-payload validation, common composers, export, persistence, matching, saved-session navigation, and both report types rather than source-string inspection
