# mutation-stamp: sha256=cd381e441fa11bffa963afd1e1b963a727ee029791b62c77d9da60fb43aaaf21
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T13:22:06.110493191Z","feature_name":"Data layer unified defect report builder","feature_path":"features/data-layer-unified-defect-report-builder.feature","background_hash":"18c1b62499d38343e28617deb55496d9b394301f99c463f78d53d85acabf7453","implementation_hash":"sha256:5c6561344f4a1bb868290b934003653f90556cdd88231f37a406b67d71bfe152","scenarios":[{"index":10,"name":"Data layer unified defect report builder 011","scenario_hash":"96498c7cff14834e0ef934ebff1200b9d925798d4ab3836b728fb48d8840a57d","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-15T13:22:06.110493191Z"},{"index":3,"name":"Data layer unified defect report builder 004","scenario_hash":"b5a10884347bd979d117080ab2e28a22ca526f0c8999ea441a89b32c5ead7bcb","mutation_count":36,"result":{"Total":36,"Killed":36,"Survived":0,"Errors":0},"tested_at":"2026-07-14T20:32:31.236437619Z"},{"index":12,"name":"Data layer unified defect report builder 013","scenario_hash":"9bd55db4200f6a1f065c37818721680b5fa7aca3ee30f3c7c4d145d2deabd112","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-14T20:32:31.236437619Z"},{"index":0,"name":"Data layer unified defect report builder 001","scenario_hash":"7c7d04925b1ca8d3d300c6c95dedeeb216ca0d573213af48949a3d89424a9d7f","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-14T18:37:54.525481151Z"},{"index":5,"name":"Data layer unified defect report builder 006","scenario_hash":"65c2513ad034d465bbe7dc855f9c43456d59bfffdb2db5ae300146b1463e05b1","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-14T18:37:54.525481151Z"}]}
# acceptance-mutation-manifest-end

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
    And it identifies the checkout page visit without an operator-editable observation interval
    And capture timestamps are not presented as part of the missing-event result
    And it does not fabricate an event payload, validation issue, capture timestamp, or captured-event identity

  # Data layer unified defect report builder 003
  Scenario: Data layer unified defect report builder 003
    Given Generic pageview revision 4 defines required page_name and required products
    And products is an array of objects requiring numeric id and string name
    And its covering assignment expects pageview from event-history
    When the missing-event Expected result is built
    Then event name, source, target, schema identity, and assignment scope are derived from that exact schema revision
    And the editor recursively displays page_name, products, products array items, id, and name with complete paths and types
    And required properties are included while optional properties remain available for explicit inclusion
    And object and array containers can be expanded and collapsed without flattening their descendants
    And array items can be added, duplicated, and removed without changing sibling items
    And changing the expected payload cannot modify the schema, assignment, or any captured event

  # Data layer unified defect report builder 004
  Scenario Outline: Data layer unified defect report builder 004
    Given expected property <property_path> has type <property_type> and schema choices <schema_choices>
    When the operator chooses <value_source> value <entered_value>
    Then the expected payload stores <stored_value> at <json_pointer>
    And the stored value has JSON type <json_type>
    And the response source is <response_source>

    Examples:
      | property_path    | property_type | schema_choices   | value_source | entered_value | stored_value | json_pointer     | json_type | response_source          |
      | page_name        | string        | home and test     | schema       | test          | test         | /page_name       | string    | schema-provided value    |
      | products.0.id    | number        | none              | custom       | 1             | 1            | /products/0/id   | number    | operator custom response |
      | products.0.name  | string        | robot and vehicle | custom       | robot         | robot        | /products/0/name | string    | operator custom response |
      | logged_in        | boolean       | true and false    | schema       | false         | false        | /logged_in       | boolean   | schema-provided value    |

  # Data layer unified defect report builder 005
  Scenario: Data layer unified defect report builder 005
    Given /products is selected as the reproduction start point
    And the checkout expectation scope is selected as the reproduction endpoint
    When the reproduction journey is generated
    Then From pathname displays /products and To pathname displays /checkout
    And Visit /products and Visit /checkout are pathname anchors in captured order
    And an Add step between /products and /checkout action is available between the anchors
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
    When From pathname or To pathname changes to another page visit
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
    And no separate Create missing-event report action is required
    And copy and save become available when required expected values, expectation confirmation, and absence verification are complete

  # Data layer unified defect report builder 010
  Scenario: Data layer unified defect report builder 010
    Given absence verification finds a matching purchase event
    When the common builder displays the missing-event warning
    Then the report draft, expected result, reproduction journey, timeline, report details, and preview remain available
    And overriding the warning adds the matching-event and override evidence to the preview
    And it does not switch to a separate reduced report workflow

  # Data layer unified defect report builder 011
  Scenario Outline: Data layer unified defect report builder 011
    Given a complete missing-event report has been composed in the common builder
    When the operator activates <report_action>
    Then successful outcome is <successful_effect>
    And feedback is displayed only after the effect succeeds

    Examples:
      | report_action                     | successful_effect                                                        |
      | Copy for Jira Cloud               | the current preview is written through the Jira clipboard integration     |
      | Save defect                       | one discoverable Missing event defect is persisted in Defects              |
      | Save defect and copy              | one defect is persisted and the same representation is written to clipboard |

  # Data layer unified defect report builder 012
  Scenario: Data layer unified defect report builder 012
    Given pageview expected values are page_name test and products item id 1 with name robot
    When the Expected result preview is displayed
    Then it states pageview is fired with {"page_name":"test","products":[{"id":1,"name":"robot"}]}
    And the payload is formatted as indented JSON using the same object and array presentation as a captured Live event
    And the preview, Jira representation, and saved defect use the same expected payload
    And editing a leaf or array item refreshes all three representations without stale content

  # Data layer unified defect report builder 013
  Scenario Outline: Data layer unified defect report builder 013
    Given a complete missing-event report remains open
    When report completion encounters <failed_effect>
    Then the builder displays <failure_feedback>
    And it does not display copy or save success
    And the report draft and preview remain unchanged for retry

    Examples:
      | failed_effect                       | failure_feedback                    |
      | clipboard writing rejects           | Copy failed                         |
      | Defect Library persistence rejects  | Save failed                         |

  # Data layer unified defect report builder 014
  Scenario: Data layer unified defect report builder 014
    Given a missing-event report was saved from the common builder
    When the operator opens it from Defects, edits it, and recopies it
    Then the report uses the same preview representation and persistence lifecycle as a validation-issue report
    And the nested expected payload, schema expectation, absence evidence, reproduction endpoints, manual steps, timeline, and report edits are retained
    And Back to selected page visit and Back to Live feed restore builder, navigation, scroll, and focus state without requiring a captured defect event
