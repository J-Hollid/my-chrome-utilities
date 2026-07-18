Feature: Data layer Flow documentation export

  Background:
    Given Checkout journey contains context-setting, interaction, alternative, parallel, and merge expectations
    And its Event-occurrence nodes own required, optional, conditional, or informational obligations and multiplicity expectations
    And every automatically validated Event occurrence has an effective schema, named Assignment, examples, and provenance

  # Data layer Flow documentation export 001
  Scenario: Data layer Flow documentation export 001
    Given draft revision 24 is selected for documentation
    When the operator generates complete developer documentation at 2026-07-18T14:30:00Z
    Then Overview identifies project Shop, Flow Checkout journey, purpose Checkout implementation, Draft, project revision 24, release revision Not applicable, validation-plan revision 24, released time Not applicable, documentation snapshot identity, generated time 2026-07-18T14:30:00Z, no omissions, reference artwork state, and the manual-journey boundary
    And the documentation contains a diagram with text alternative, Pages, nodes, Events, relationships, effective requirements, Assignments, examples, tester checklist, provenance, and traceability
    And every record and cross-link derives from draft revision 24

  # Data layer Flow documentation export 002
  Scenario: Data layer Flow documentation export 002
    When Confluence output is previewed and copied
    Then it contains the selected metadata banner, a readable directional diagram, and a text alternative listing every node and relationship in logical order
    And its Nodes, Events, Relationships, Pages, Effective requirements, Assignments, Examples, Tester checklist, and Traceability tables use the fixed field names of the Spreadsheet tables
    And copied rich HTML and plain text contain the same record keys and semantic field values
    And the legend states that obligations, multiplicity, ordering, alternatives, parallel branches, and merges are checked manually

  # Data layer Flow documentation export 003
  Scenario Outline: Data layer Flow documentation export 003
    When Spreadsheet table <table> is generated
    Then its fixed columns in order are <columns>
    And every cross-link uses a human-readable export key rather than a raw storage identifier

    Examples:
      | table                  | columns                                                                                                                                                                                                                                                                                          |
      | Overview               | Field, Value                                                                                                                                                                                                                                                                                     |
      | Nodes                  | Node key, Flow key, Flow name, Node name, Event key, Event name, Role, Page key, Page name, Obligation, Expected minimum, Expected maximum, Frequency note, Trigger, Profile keys, Effective contract key, Assignment key, Readiness, Developer note, Tester note                           |
      | Events                 | Event key, Event name, Emitted name, Source, Validation target, Role, Description, Shared requirement keys, Example keys, Used by node keys                                                                                                                                                       |
      | Relationships          | Relationship key, Flow key, Source node key, Kind, Group, Label, Condition, Target node key, Human expectation                                                                                                                                                                                   |
      | Pages                  | Page key, Page name, Route or matcher summary, Requirement keys, Profile keys, Context node keys, Used by node keys                                                                                                                                                                              |
      | Effective requirements | Requirement key, Contract key, Node key, Page key, Event key, Path, Presence, Type, Exact value, Allowed values, Condition or rule, Severity, Example, Description, Comments, Winning origin, Complete provenance, Schema revision                                                                 |
      | Assignments            | Assignment key, Assignment name, Event key, Source matcher, Target matcher, Validation target, URL matcher, Payload matcher, Environment matcher, Session matcher, Observable matcher summary, Priority, Version policy, Contract key, Schema revision, Readiness, Candidate outcome, Rejected candidate reasons |
      | Examples               | Example key, Event case, Node key, Contract key, Outcome kind, Observable context, Payload, Expected Assignment outcome, Expected issue codes, Requirement level, Case revision, Result Assignment content revision, Result contract or schema revision, Result validation-plan revision, Runner version, Current status, Description                  |
      | Tester checklist       | Checklist key, Flow key, Node key, Page name, Event name, Trigger, Obligation, Expected minimum, Expected maximum, Frequency note, Relationship group, Relationship expectation, Manual status, Actual count, Tester, Tested at, Notes, Observation links, Validation status                      |
      | Traceability           | Export key, Entity kind, Human name, Project revision, Release identity, Source keys, Used by keys, Provenance summary                                                                                                                                                                            |

  # Data layer Flow documentation export 004
  Scenario: Data layer Flow documentation export 004
    Given Retail Purchase is Required with expected minimum 1 and expected maximum 1
    And Apply coupon is Optional with expected minimum 0 and expected maximum 1
    When nodes and relationships are exported
    Then Nodes and Tester checklist retain each node obligation and multiplicity exactly
    And every Relationship Kind is expected next, alternative, parallel, or merge
    And Relationships contain no optionality, requiredness, minimum, maximum, or repetition field
    And the diagram derives obligation and multiplicity badges from the referenced node rather than a second relationship value

  # Data layer Flow documentation export 005
  Scenario Outline: Data layer Flow documentation export 005
    Given draft revision 24 contains canonical <record_kind> <export_key> named <human_name> with <semantic_values>
    When canonical graph and Assignment records are rendered into complete Retail and Trade Confluence and Spreadsheet outputs
    Then <export_key> occurs exactly once in its named table with <human_name> and <semantic_values>
    And every cross-link from <export_key> resolves to one canonical export record

    Examples:
      | record_kind | export_key                 | human_name       | semantic_values                                                                                                            |
      | Node        | node-retail-context        | Retail context    | flow-retail, event-virtual-page-view, context-setting, page-checkout, Required, 1, 1, contract-retail-context-r24, assignment-retail-context, Ready |
      | Node        | node-retail-payment        | Retail payment    | flow-retail, event-add-payment-info, interaction, page-checkout, Required, 1, 1, contract-retail-payment-r24, assignment-retail-payment, Ready     |
      | Node        | node-retail-purchase       | Retail Purchase   | flow-retail, event-purchase, interaction, page-confirmation, Required, 1, 1, contract-retail-purchase-r24, assignment-retail, Ready   |
      | Node        | node-trade-context         | Trade context     | flow-trade, event-virtual-page-view, context-setting, page-checkout, Required, 1, 1, contract-trade-context-r24, assignment-trade-context, Ready   |
      | Node        | node-trade-payment         | Trade payment     | flow-trade, event-add-payment-info, interaction, page-checkout, Required, 1, 1, contract-trade-payment-r24, assignment-trade-payment, Ready       |
      | Node        | node-trade-purchase        | Trade Purchase    | flow-trade, event-purchase, interaction, page-confirmation, Required, 1, 1, contract-trade-purchase-r24, assignment-trade, Ready      |
      | Event       | event-virtual-page-view    | virtual_page_view | virtual_page_view, event-history, payload, context-setting, establishes Page context, requirement-event-page-type, example-retail-context-valid and example-trade-context-invalid, node-retail-context and node-trade-context |
      | Event       | event-add-payment-info     | add_payment_info  | add_payment_info, event-history, payload, interaction, documents payment payload, requirement-event-payment-type, example-retail-payment-valid and example-trade-payment-invalid, node-retail-payment and node-trade-payment |
      | Event       | event-purchase             | Purchase          | purchase, event-history, payload, interaction, documents completed order, requirement-event-transaction-id, example-retail-purchase-valid and example-trade-purchase-invalid and example-retail-purchase-stale, node-retail-purchase and node-trade-purchase |
      | Relationship | edge-retail-context-payment | Retail context to payment | flow-retail, node-retail-context, expected next, node-retail-payment, manually expected                                      |
      | Relationship | edge-retail-payment-purchase | Retail payment to Purchase | flow-retail, node-retail-payment, expected next, node-retail-purchase, manually expected                                    |
      | Relationship | edge-trade-context-payment | Trade context to payment | flow-trade, node-trade-context, expected next, node-trade-payment, manually expected                                           |
      | Relationship | edge-trade-payment-purchase | Trade payment to Purchase | flow-trade, node-trade-payment, expected next, node-trade-purchase, manually expected                                         |
      | Assignment  | assignment-retail-context  | Retail context    | route channel retail, priority 100, contract-retail-context-r24, schema revision 24, Ready                                            |
      | Assignment  | assignment-retail-payment  | Retail payment    | route channel retail, priority 100, contract-retail-payment-r24, schema revision 24, Ready                                            |
      | Assignment  | assignment-retail          | Retail Purchase   | route channel retail, priority 100, contract-retail-purchase-r24, schema revision 24, Ready                                          |
      | Assignment  | assignment-trade-context   | Trade context     | route channel trade, priority 100, contract-trade-context-r24, schema revision 24, Ready                                              |
      | Assignment  | assignment-trade-payment   | Trade payment     | route channel trade, priority 100, contract-trade-payment-r24, schema revision 24, Ready                                              |
      | Assignment  | assignment-trade           | Trade Purchase    | route channel trade, priority 100, contract-trade-purchase-r24, schema revision 24, Ready                                            |
  # Data layer Flow documentation export 015
  Scenario Outline: Data layer Flow documentation export 015
    Given draft revision 24 contains Page <page_key> named <page_name> at <route>
    When Page records are rendered into complete Retail and Trade Confluence and Spreadsheet outputs
    Then <page_key> occurs once with requirements <requirement_keys>, Profile profile-sitewide, context nodes <context_node_keys>, and consumers <used_by_node_keys>
    And both Page requirement and consumer keys resolve without a raw identifier

    Examples:
      | page_key          | page_name    | route                              | requirement_keys                   | context_node_keys                       | used_by_node_keys                                                               |
      | page-checkout     | Checkout     | /{channel}/checkout                | requirement-page-checkout-type     | node-retail-context, node-trade-context | node-retail-context, node-retail-payment, node-trade-context, node-trade-payment |
      | page-confirmation | Confirmation | /{channel}/checkout/confirmation   | requirement-page-confirmation-type | blank                                   | node-retail-purchase, node-trade-purchase                                        |
  # Data layer Flow documentation export 016
  Scenario Outline: Data layer Flow documentation export 016
    Given draft revision 24 compiles requirement <requirement_key> for contract <contract_key>, node <node_key>, Page <page_key>, and Event <event_key>
    When effective requirements are rendered into complete Retail and Trade Confluence and Spreadsheet outputs
    Then <requirement_key> occurs once at <path> with <presence> presence, string type, exact value <exact_value>, allowed values <allowed_values>, condition or rule <condition_rule>, winning origin <winning_origin>, provenance <complete_provenance>, and schema revision 24
    And its node, Page, Event, contract, origin, and schema-revision cross-links resolve exactly

    Examples:
      | requirement_key                         | contract_key                 | node_key             | page_key          | event_key                 | path                             | presence    | exact_value | allowed_values | condition_rule                       | winning_origin         | complete_provenance                                             |
      | requirement-retail-context-site-id      | contract-retail-context-r24  | node-retail-context  | page-checkout     | event-virtual-page-view   | /site_id                         | Required    | blank       | blank          | blank                                | Profile Sitewide       | Base, Checkout Page, Event virtual_page_view, Sitewide, Retail  |
      | requirement-retail-context-page-type    | contract-retail-context-r24  | node-retail-context  | page-checkout     | event-virtual-page-view   | /page/type                       | Required    | checkout    | blank          | blank                                | Page Checkout          | Base, Checkout Page, Event virtual_page_view, Sitewide, Retail  |
      | requirement-retail-payment-site-id      | contract-retail-payment-r24  | node-retail-payment  | page-checkout     | event-add-payment-info    | /site_id                         | Required    | blank       | blank          | blank                                | Profile Sitewide       | Base, Checkout Page, Event add_payment_info, Sitewide, Retail   |
      | requirement-retail-payment-type         | contract-retail-payment-r24  | node-retail-payment  | page-checkout     | event-add-payment-info    | /ecommerce/payment_type          | Required    | blank       | card, wallet   | blank                                | Event add_payment_info | Base, Checkout Page, Event add_payment_info, Sitewide, Retail   |
      | requirement-retail-purchase-site-id     | contract-retail-purchase-r24 | node-retail-purchase | page-confirmation | event-purchase            | /site_id                         | Required    | blank       | blank          | blank                                | Profile Sitewide       | Base, Confirmation Page, Event Purchase, Sitewide, Retail       |
      | requirement-retail-transaction-id       | contract-retail-purchase-r24 | node-retail-purchase | page-confirmation | event-purchase            | /ecommerce/transaction_id        | Required    | blank       | blank          | blank                                | Event Purchase         | Base, Confirmation Page, Event Purchase, Sitewide, Retail       |
      | requirement-retail-customer-type        | contract-retail-purchase-r24 | node-retail-purchase | page-confirmation | event-purchase            | /customer/type                   | Required    | consumer    | blank          | blank                                | Profile Retail         | Base, Confirmation Page, Event Purchase, Sitewide, Retail       |
      | requirement-trade-context-site-id       | contract-trade-context-r24   | node-trade-context   | page-checkout     | event-virtual-page-view   | /site_id                         | Required    | blank       | blank          | blank                                | Profile Sitewide       | Base, Checkout Page, Event virtual_page_view, Sitewide, Trade   |
      | requirement-trade-context-page-type     | contract-trade-context-r24   | node-trade-context   | page-checkout     | event-virtual-page-view   | /page/type                       | Required    | checkout    | blank          | blank                                | Page Checkout          | Base, Checkout Page, Event virtual_page_view, Sitewide, Trade   |
      | requirement-trade-payment-site-id       | contract-trade-payment-r24   | node-trade-payment   | page-checkout     | event-add-payment-info    | /site_id                         | Required    | blank       | blank          | blank                                | Profile Sitewide       | Base, Checkout Page, Event add_payment_info, Sitewide, Trade    |
      | requirement-trade-payment-type          | contract-trade-payment-r24   | node-trade-payment   | page-checkout     | event-add-payment-info    | /ecommerce/payment_type          | Required    | blank       | invoice, card  | blank                                | Event add_payment_info | Base, Checkout Page, Event add_payment_info, Sitewide, Trade    |
      | requirement-trade-purchase-site-id      | contract-trade-purchase-r24  | node-trade-purchase  | page-confirmation | event-purchase            | /site_id                         | Required    | blank       | blank          | blank                                | Profile Sitewide       | Base, Confirmation Page, Event Purchase, Sitewide, Trade        |
      | requirement-trade-transaction-id        | contract-trade-purchase-r24  | node-trade-purchase  | page-confirmation | event-purchase            | /ecommerce/transaction_id        | Required    | blank       | blank          | blank                                | Event Purchase         | Base, Confirmation Page, Event Purchase, Sitewide, Trade        |
      | requirement-trade-customer-type         | contract-trade-purchase-r24  | node-trade-purchase  | page-confirmation | event-purchase            | /customer/type                   | Required    | business    | blank          | blank                                | Profile Trade          | Base, Confirmation Page, Event Purchase, Sitewide, Trade        |
      | requirement-trade-purchase-order-number | contract-trade-purchase-r24  | node-trade-purchase  | page-confirmation | event-purchase            | /ecommerce/purchase_order_number | Conditional | blank       | blank          | required when customer type business | Profile Trade          | Base, Confirmation Page, Event Purchase, Sitewide, Trade        |
  # Data layer Flow documentation export 017
  Scenario Outline: Data layer Flow documentation export 017
    Given draft revision 24 contains Example <example_key> for <event_case>, node <node_key>, and contract <contract_key>
    When Event examples are rendered into complete Retail and Trade Confluence and Spreadsheet outputs
    Then <example_key> occurs once with <outcome_kind>, context <observable_context>, payload <payload>, Assignment outcome <expected_assignment_outcome>, issues <expected_issue_codes>, required level, case revision <case_revision>, Assignment revision <result_assignment_revision>, schema revision <result_schema_revision>, validation-plan revision <result_plan_revision>, runner 3, status <current_status>, and description <description>
    And stale and current Example identities are never collapsed into an unqualified Last result

    Examples:
      | example_key                    | event_case               | node_key             | contract_key                 | outcome_kind | observable_context   | payload                                               | expected_assignment_outcome     | expected_issue_codes                            | case_revision | result_assignment_revision | result_schema_revision | result_plan_revision | current_status | description                         |
      | example-retail-context-valid   | case-retail-context-valid | node-retail-context  | contract-retail-context-r24  | Positive     | route channel retail  | page type checkout                                    | winner assignment-retail-context | none                                            | 5             | 7                          | 24                     | 24                   | Passing        | valid Retail context payload        |
      | example-trade-context-invalid  | case-trade-context-invalid | node-trade-context | contract-trade-context-r24   | Negative     | route channel trade   | page type account                                     | winner assignment-trade-context  | exact at /page/type                             | 5             | 7                          | 24                     | 24                   | Passing        | expected Trade context issue        |
      | example-retail-payment-valid   | case-retail-payment-valid | node-retail-payment  | contract-retail-payment-r24  | Positive     | route channel retail  | payment type card                                     | winner assignment-retail-payment | none                                            | 5             | 7                          | 24                     | 24                   | Passing        | valid Retail payment payload        |
      | example-trade-payment-invalid  | case-trade-payment-invalid | node-trade-payment | contract-trade-payment-r24   | Negative     | route channel trade   | payment type wallet                                   | winner assignment-trade-payment  | enum at /ecommerce/payment_type                 | 5             | 7                          | 24                     | 24                   | Passing        | expected Trade payment issue        |
      | example-retail-purchase-valid  | case-retail-current       | node-retail-purchase | contract-retail-purchase-r24 | Positive     | route channel retail  | transaction_id R100, currency GBP, customer consumer  | winner assignment-retail          | none                                            | 5             | 7                          | 24                     | 24                   | Passing        | valid Retail Purchase payload       |
      | example-trade-purchase-invalid | case-trade-missing-order  | node-trade-purchase  | contract-trade-purchase-r24  | Negative     | route channel trade   | transaction_id T100, customer business, no order      | winner assignment-trade           | conditional at /ecommerce/purchase_order_number | 5             | 7                          | 24                     | 24                   | Passing        | expected Trade conditional issue    |
      | example-retail-purchase-stale  | case-retail-stale         | node-retail-purchase | contract-retail-purchase-r24 | Positive     | route channel retail  | transaction_id R099, currency GBP, customer consumer  | winner assignment-retail          | none                                            | 4             | 6                          | 23                     | 23                   | Stale          | result predates the selected plan   |
  # Data layer Flow documentation export 018
  Scenario Outline: Data layer Flow documentation export 018
    Given draft revision 24 contains checklist row <checklist_key> for Flow <flow_key>, node <node_key>, Page <page_name>, and Event <event_name>
    When checklist rows are rendered into complete Retail and Trade Confluence and Spreadsheet outputs
    Then <checklist_key> occurs once with trigger <trigger>, Required obligation, minimum 1, maximum 1, exactly once frequency, blank relationship group, expectation <relationship_expectation>, Not checked status, blank count, tester, time, and observation links, notes <notes>, and Ready validation
    And blank manual fields remain blank rather than being inferred from automatic validation

    Examples:
      | checklist_key             | flow_key    | node_key             | page_name    | event_name        | trigger                  | relationship_expectation       | notes                       |
      | checklist-retail-context  | flow-retail | node-retail-context  | Checkout     | virtual_page_view | Retail checkout context  | expected before Retail payment | confirm Retail Page context |
      | checklist-retail-payment  | flow-retail | node-retail-payment  | Checkout     | add_payment_info  | Retail payment submitted | expected before Purchase       | inspect payment payload     |
      | checklist-retail-purchase | flow-retail | node-retail-purchase | Confirmation | Purchase          | Retail order confirmed   | expected after Retail payment  | inspect Purchase payload    |
      | checklist-trade-context   | flow-trade  | node-trade-context   | Checkout     | virtual_page_view | Trade checkout context   | expected before Trade payment  | confirm Trade Page context  |
      | checklist-trade-payment   | flow-trade  | node-trade-payment   | Checkout     | add_payment_info  | Trade payment submitted  | expected before Purchase       | inspect payment payload     |
      | checklist-trade-purchase  | flow-trade  | node-trade-purchase  | Confirmation | Purchase          | Trade order confirmed    | expected after Trade payment   | inspect purchase order data |
  # Data layer Flow documentation export 019
  Scenario Outline: Data layer Flow documentation export 019
    Given draft revision 24 contains traceability key <export_key> for <entity_kind> named <human_name>
    When the canonical dependency index builds the Traceability table in both developer output formats
    Then Traceability contains <export_key> exactly once with project revision 24, release identity Draft 24, sources <source_keys>, consumers <used_by_keys>, and provenance <provenance_summary>
    And each referenced source, consumer, Flow, and contract key resolves to one canonical export record

    Examples:
      | export_key                   | entity_kind         | human_name             | source_keys                                                               | used_by_keys                                                          | provenance_summary                       |
      | flow-retail                  | Flow                | Retail checkout        | page-checkout, page-confirmation                                          | all flow-retail node, relationship, and checklist keys                 | canonical Specification Flow             |
      | flow-trade                   | Flow                | Trade checkout         | page-checkout, page-confirmation                                          | all flow-trade node, relationship, and checklist keys                  | canonical Specification Flow             |
      | page-checkout                | Page                | Checkout               | requirement-page-checkout-type                                            | four Checkout node keys                                                | canonical shared Page                    |
      | page-confirmation            | Page                | Confirmation           | requirement-page-confirmation-type                                        | node-retail-purchase, node-trade-purchase                              | canonical shared Page                    |
      | profile-sitewide             | Profile             | Sitewide               | requirement-sitewide-site-id                                              | both Pages and all effective contracts                                 | canonical shared Profile                 |
      | profile-retail               | Profile             | Retail                 | route channel retail Applicability                                        | all Retail contracts and Assignments                                   | canonical variant Profile                |
      | profile-trade                | Profile             | Trade                  | route channel trade Applicability                                         | all Trade contracts and Assignments                                    | canonical variant Profile                |
      | requirement-page-checkout-type | Page requirement   | Checkout page type     | page-checkout                                                             | both context effective-requirement rows                                | Page-authored requirement                |
      | requirement-page-confirmation-type | Page requirement | Confirmation page type | page-confirmation                                                     | both Purchase effective contracts                                     | Page-authored requirement                |
      | requirement-sitewide-site-id | Profile requirement | Site identifier        | profile-sitewide                                                          | all 6 effective contracts                                              | Sitewide Profile requirement             |
      | requirement-event-page-type  | Event requirement   | Context page type      | event-virtual-page-view                                                    | both context effective-requirement rows                                | shared Event requirement                 |
      | requirement-event-payment-type | Event requirement | Payment type           | event-add-payment-info                                                     | both payment effective-requirement rows                                | shared Event requirement                 |
      | requirement-event-transaction-id | Event requirement | Transaction ID     | event-purchase                                                         | both Purchase effective contracts                                     | shared Event requirement                 |
      | contract-retail-context-r24  | Effective contract  | Retail context r24     | page-checkout, event-virtual-page-view, profile-sitewide, profile-retail   | node-retail-context, assignment-retail-context, Retail context examples | compiled Base, Page, Event, Sitewide, Retail |
      | contract-retail-payment-r24  | Effective contract  | Retail payment r24     | page-checkout, event-add-payment-info, profile-sitewide, profile-retail    | node-retail-payment, assignment-retail-payment, Retail payment examples | compiled Base, Page, Event, Sitewide, Retail |
      | contract-retail-purchase-r24 | Effective contract  | Retail Purchase r24    | page-confirmation, event-purchase, profile-sitewide, profile-retail        | node-retail-purchase, assignment-retail, all Retail Purchase examples  | compiled Base, Page, Event, Sitewide, Retail |
      | contract-trade-context-r24   | Effective contract  | Trade context r24      | page-checkout, event-virtual-page-view, profile-sitewide, profile-trade    | node-trade-context, assignment-trade-context, Trade context examples    | compiled Base, Page, Event, Sitewide, Trade |
      | contract-trade-payment-r24   | Effective contract  | Trade payment r24      | page-checkout, event-add-payment-info, profile-sitewide, profile-trade     | node-trade-payment, assignment-trade-payment, Trade payment examples    | compiled Base, Page, Event, Sitewide, Trade |
      | contract-trade-purchase-r24  | Effective contract  | Trade Purchase r24     | page-confirmation, event-purchase, profile-sitewide, profile-trade         | node-trade-purchase, assignment-trade, all Trade Purchase examples     | compiled Base, Page, Event, Sitewide, Trade |
      | example-retail-purchase-valid | Example            | Retail Purchase valid  | case-retail-current, contract-retail-purchase-r24                          | developer documentation and release review                             | current production case result           |
      | checklist-retail-purchase    | Checklist row       | Retail Purchase        | flow-retail, node-retail-purchase                                         | developer checklist template                                           | manual expectation only                  |
  # Data layer Flow documentation export 020
  Scenario: Data layer Flow documentation export 020
    When complete Retail and Trade Confluence and Spreadsheet outputs are parsed together
    Then each output contains exactly 6 Nodes, 3 Events, 4 Relationships, 2 Pages, 15 effective requirements, 6 Assignments, 7 Examples, and 6 Tester checklist rows
    And the 6 nodes link to the 3 shared Events and 6 distinct effective contracts without copying an Event definition
    And every named record has exactly one Traceability row and every source, consumer, Flow, and contract cross-link resolves

  # Data layer Flow documentation export 006
  Scenario Outline: Data layer Flow documentation export 006
    Given two <entity_kind> records have stable export keys <first_key> and <second_key>
    When both display labels are changed to <same_label>
    Then their export keys remain <first_key> and <second_key>
    And every cross-link is still unambiguous in preview, Confluence, Spreadsheet, and text alternative
    And neither export key exposes a raw storage UUID

    Examples:
      | entity_kind             | first_key                    | second_key                  | same_label            |
      | Event-occurrence node   | node-retail-purchase         | node-trade-purchase         | Purchase confirmation |
      | Event                   | event-retail-confirmation    | event-trade-confirmation    | Confirmation          |
      | documented relationship | edge-retail-complete        | edge-trade-complete         | Complete              |
      | Assignment              | assignment-retail-purchase  | assignment-trade-purchase   | Purchase route        |
      | Event validation case   | case-retail-purchase        | case-trade-purchase         | Purchase negative     |

  # Data layer Flow documentation export 007
  Scenario Outline: Data layer Flow documentation export 007
    Given the operator selects <snapshot>
    When documentation is generated at 2026-07-18T14:30:00Z and regenerated at 2026-07-18T14:35:00Z
    Then every representation identifies <identity>
    And documentation semantic equivalence compares snapshot identity, layout, record keys, semantic field values, omissions, and included sanitized-artwork digest
    And generated time may differ without changing semantic equivalence or the immutable selected snapshot

    Examples:
      | snapshot            | identity                                                        |
      | draft revision 24   | Draft, project revision 24, validation-plan revision 24          |
      | published release 3 | Published, release 3, validation-plan revision 18                |

  # Data layer Flow documentation export 008
  Scenario: Data layer Flow documentation export 008
    Given Include reference artwork is cleared by default
    And Checkout journey has sanitized reference artwork checkout-journey.svg with digest svg-42
    When outputs are generated with reference artwork cleared
    Then no reference-artwork bytes occur in either output
    And Overview states Reference artwork omitted by operator choice, checkout-journey.svg, and svg-42
    And the canonical diagram, text alternative, graph records, and semantic equivalence remain complete
    When the operator selects Include reference artwork
    Then an inclusion preview identifies checkout-journey.svg, source attribution, sanitized digest svg-42, removed executable and external content, Reference only treatment, and removal action
    When the operator confirms artwork inclusion
    Then the sanitized artwork and digest svg-42 are included as Reference only presentation
    And Overview and both output packages identify checkout-journey.svg, svg-42, and Included
    And no Page, Event, node, relationship, requirement, or Assignment record changes

  # Data layer Flow documentation export 009
  Scenario Outline: Data layer Flow documentation export 009
    Given imported SVG reference artwork contains <unsafe_content>
    When artwork safety processing runs
    Then <safe_outcome>
    And unsafe artwork is never rendered, copied, downloaded, or requested over the network
    And the prior safe backdrop and every semantic project record remain unchanged when safe output cannot be produced

    Examples:
      | unsafe_content                     | safe_outcome                                                        |
      | script and onload handler          | executable elements and event handlers are removed before storage   |
      | javascript navigation              | executable navigation is removed before storage                     |
      | external image and font references | every external reference is removed before storage                   |
      | malformed SVG                      | import is rejected with an actionable file error                     |

  # Data layer Flow documentation export 010
  Scenario Outline: Data layer Flow documentation export 010
    Given selected documentation omits <category>
    When preview and output are produced
    Then both identify <category> as lossy
    And direct the operator to complete documentation or full-fidelity project export

    Examples:
      | category                |
      | graph relationships     |
      | effective schemas       |
      | Assignments             |
      | provenance              |
      | tester expectations     |

  # Data layer Flow documentation export 011
  Scenario: Data layer Flow documentation export 011
    When full-fidelity project JSON is exported and reimported
    Then canonical graph, layout, sanitized reference-artwork content and metadata, references, schemas, Assignments, examples, checklist definitions, revisions, and releases round-trip
    And Confluence and Spreadsheet outputs are labelled documentation rather than interchange formats

  # Data layer Flow documentation export 012
  Scenario: Data layer Flow documentation export 012
    Given published release 3 contains project revision 18 and validation-plan revision 18 released at 2026-07-17T12:00:00Z
    When preview, Confluence, Spreadsheet, and text alternatives render that release at 2026-07-18T14:30:00Z
    Then every representation identifies project Shop, Flow Checkout journey, purpose Checkout implementation, Published, project revision 18, release 3, validation-plan revision 18, released time 2026-07-17T12:00:00Z, generated time 2026-07-18T14:30:00Z, manual-journey boundary, no omissions, and reference artwork state
    And generating it later may change only generated time while released time and every selected semantic record remain unchanged

  # Data layer Flow documentation export 013
  Scenario: Data layer Flow documentation export 013
    Given case-retail-current revision 5 has a result from Assignment content revision 7, schema revision 24, validation-plan revision 24, and runner version 3
    And case-retail-stale revision 4 has a result from Assignment content revision 6 while the selected revision uses 7
    When complete Examples records are exported
    Then case-retail-current is Passing with all 5 freshness identities
    And case-retail-stale is Stale with its old and current Assignment content revisions
    And neither result can be represented only as an unqualified Last result value

  # Data layer Flow documentation export 014
  Scenario: Data layer Flow documentation export 014
    Given normalized observation Purchase retail 101 is evaluated under immutable release 3
    When Event Test, the capture transaction, and Live expose its EventValidationResult
    Then each surface identifies content-addressed result evr-purchase-retail-101-r3
    And their serialized semantic content is byte-equivalent for observation identity, normalized context, Assignment candidates and evidence, winner, rejected candidates, Profiles, schema revision, issues, provenance, and release 3
    And comparison excludes only presentation channel, rendered time, expanded sections, and focus target
    And those presentation fields are outside the serialized EventValidationResult
    And no surface recomputes a reduced, legacy, draft, or temporal result

  # Data layer Flow documentation export 021
  Scenario: Data layer Flow documentation export 021
    Given published release 3 is selected and later draft revision 25 changes Purchase and graph layout
    When release 3 documentation is regenerated
    Then its selected semantic records, layout, release identity, validation-plan identity, and released time remain unchanged
    And draft revision 25 is available only from an explicitly selected draft export
