# mutation-stamp: sha256=ea850b2744b946d6d3e826459f3ec26718c2e6bfccf549083b231b611f768aad
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T09:08:41.523399855Z","feature_name":"Data layer event occurrence defect report runtime","feature_path":"features/data-layer-event-occurrence-defect-report-runtime.feature","background_hash":"6a61c326cbbc5960d938aed7998ec7760748f9c49db5df35939a352fc0359a0b","implementation_hash":"sha256:991fb36fab74afc264273b5a0b113f0f63779d8f9632e324385db65d2f3d07b3","scenarios":[{"index":0,"name":"Data layer event occurrence defect report runtime 001","scenario_hash":"b9f37a5f2bdcd7f888f93d218b668e7d90a09fc7c57cb77edcb0e70d42f1d4c1","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-15T09:08:41.523399855Z"},{"index":3,"name":"Data layer event occurrence defect report runtime 004","scenario_hash":"a41c6d1139e72ebb1b5f9f12e6e28c8e47454ef7267609132484139ce4b4df3a","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-15T09:08:41.523399855Z"},{"index":4,"name":"Data layer event occurrence defect report runtime 005","scenario_hash":"93f3213dd57fa7113157b41aeb4b5079a47fb03cf7ce738aaefdcc49d1efd94f","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-15T09:08:41.523399855Z"},{"index":5,"name":"Data layer event occurrence defect report runtime 006","scenario_hash":"269e14219c1e712325fbc256b4501c8f9fd34ae6db2db4dcab71c0ab00a945f0","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-15T09:08:41.523399855Z"},{"index":7,"name":"Data layer event occurrence defect report runtime 008","scenario_hash":"e75f18b331a3bfd4a9e7c92c94587099687418f6575f79a08c0f647f5098406a","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-15T09:08:41.523399855Z"}]}
# acceptance-mutation-manifest-end

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
    When Copy for Jira Cloud, plain-text fallback, Save defect, reopen, and recopy are exercised through actual controls
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
