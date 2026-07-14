Feature: Data layer unified defect report builder

  Background:
    Given a testing session contains visits to /products and /checkout
    And Checkout purchase revision 4 defines expected event purchase from event-history on /checkout
    And no matching purchase event was captured during the checkout visit

  # Data layer unified defect report builder 001
  Scenario Outline: Data layer unified defect report builder 001
    Given the operator starts a defect report for <defect_kind>
    When the report builder is displayed
    Then it uses <evidence_stage> to establish the defect
    And Expected result, Steps to reproduce, Supporting timeline, Report details, report preview, copy, and save stages use the common defect-report interaction
    And switching defect kind does not replace common stages with reduced text fields or evidence checklists

    Examples:
      | defect_kind             | evidence_stage                                      |
      | captured validation issue | selected issue and captured Actual result          |
      | missing purchase event  | expected-event confirmation and absence verification |

  # Data layer unified defect report builder 002
  Scenario: Data layer unified defect report builder 002
    Given the operator confirms that purchase was expected during the checkout visit
    When the missing-event Actual result is displayed
    Then it states that no matching purchase event was pushed or observed in event-history during the selected scope
    And it identifies the checkout page visit and observation interval
    And it does not fabricate an event payload, validation issue, capture timestamp, or captured-event identity

  # Data layer unified defect report builder 003
  Scenario: Data layer unified defect report builder 003
    Given Checkout purchase revision 4 and its covering assignment are selected
    When the missing-event Expected result is built
    Then event name, source, target, schema identity, assignment scope, and required payload structure are derived from that exact schema revision
    And required property constraints are represented without inventing literal values
    And optional schema properties are available for explicit inclusion rather than added automatically
    And changing an expected value cannot modify the schema, assignment, or any captured event

  # Data layer unified defect report builder 004
  Scenario Outline: Data layer unified defect report builder 004
    Given expected property <property> has schema constraint <constraint>
    When the operator chooses expected response <response_choice>
    Then the Expected result presents <expected_presentation>
    And the response source is <response_source>

    Examples:
      | property  | constraint        | response_choice          | expected_presentation       | response_source          |
      | currency  | one of EUR or USD | Use generic constraint   | currency is EUR OR USD      | schema constraint        |
      | currency  | one of EUR or USD | schema value EUR         | currency is EUR             | schema-provided value    |
      | order_id  | required string   | custom value A-123       | order_id is A-123           | operator custom response |

  # Data layer unified defect report builder 005
  Scenario: Data layer unified defect report builder 005
    Given /products is selected as the reproduction start point
    And the checkout expectation scope is selected as the reproduction endpoint
    When the reproduction journey is generated
    Then Visit /products and Visit /checkout are pathname anchors in captured order
    And the final assertion states Expect purchase to be pushed to event-history during /checkout
    And the expected-event assertion is not represented as a captured timeline event
    And a start and endpoint on the same visit still allow manual steps before the final assertion

  # Data layer unified defect report builder 006
  Scenario Outline: Data layer unified defect report builder 006
    Given the missing-event reproduction composer is open for the /products segment
    When the operator adds <step_kind> with <step_input>
    Then the numbered journey includes <step_text> before the next pathname anchor
    And Adjust, Remove, Move earlier, Move later, and the contextual add action behave as in a validation-issue report

    Examples:
      | step_kind       | step_input                    | step_text                              |
      | Click component | Checkout, sticky footer button | Click Checkout — sticky footer button |
      | Log in as user  | returning customer            | Log in as returning customer           |
      | Scroll          | bottom of the page            | Scroll to the bottom of the page       |
      | Custom step     | Apply the free delivery filter | Apply the free delivery filter         |

  # Data layer unified defect report builder 007
  Scenario: Data layer unified defect report builder 007
    Given the operator added reproduction steps between /products and /checkout
    When the expected-event endpoint changes to another page visit or observation interval
    Then absence verification reruns against the new endpoint
    And pathname anchors are rebuilt from captured visit chronology
    And manual steps that still belong to the retained journey remain in order
    And steps outside the new journey are presented for review rather than silently discarded or reassigned
    And the final expected-event assertion reflects the accepted endpoint

  # Data layer unified defect report builder 008
  Scenario: Data layer unified defect report builder 008
    Given surrounding pageview and checkout events were captured in the reproduction scope
    When the operator adds Supporting timeline evidence
    Then the same searchable event selection and evidence configuration used by validation-issue reports are available
    And Summary, Payload, and Validation details can be included independently for a selected captured event
    And timeline entries can be added, adjusted, removed, and remain in capture chronology
    And no selectable or synthetic timeline entry is created for the missing purchase event

  # Data layer unified defect report builder 009
  Scenario: Data layer unified defect report builder 009
    Given the missing-event builder has selected an expected schema
    When the report builder is displayed or edited
    Then a report preview remains visible throughout the flow
    And it contains current Summary, Description, Steps to reproduce, Actual result, Expected result, Schema expectation, Capture evidence, and Supporting timeline content
    And editing expected values, reproduction steps, timeline evidence, Summary, Description, or Expected result explanation refreshes the preview immediately
    And incomplete required stages show preview assistance without retaining stale generated content
    And copy and save remain unavailable until expectation confirmation and absence verification are complete

  # Data layer unified defect report builder 010
  Scenario: Data layer unified defect report builder 010
    Given absence verification finds a matching purchase event
    When the common builder displays the missing-event warning
    Then the report draft, expected result, reproduction journey, timeline, report details, and preview remain available
    And overriding the warning adds the matching-event and override evidence to the preview
    And it does not switch to a separate reduced report workflow

  # Data layer unified defect report builder 011
  Scenario: Data layer unified defect report builder 011
    Given a complete missing-event report has been composed in the common builder
    When the operator copies it, saves it as reported, reopens it from Defects, edits it, and recopies it
    Then the report uses the same preview representation and persistence lifecycle as a validation-issue report
    And schema expectation, absence evidence, reproduction endpoint, manual steps, timeline, and report edits are retained
    And Back to selected page visit and Back to Live feed restore builder, navigation, scroll, and focus state without requiring a captured defect event
