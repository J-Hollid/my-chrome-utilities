Feature: Data layer Flow documentation export runtime

  Background:
    Given the built extension is running with production graph, schema composition, and documentation export systems
    And Checkout journey is complete at draft revision 24 and published release 3

  # Data layer Flow documentation export runtime 001
  Scenario: Data layer Flow documentation export runtime 001
    When the actual complete documentation preview is generated for draft revision 24 at 2026-07-18T14:30:00Z
    Then rendered Overview contains Shop, Checkout journey, Checkout implementation, Draft, project revision 24, release revision Not applicable, validation-plan revision 24, released time Not applicable, documentation snapshot identity, generated time 2026-07-18T14:30:00Z, no omissions, reference artwork state, and the manual-journey boundary
    And production output contains Overview, Nodes, Events, Relationships, Pages, Effective requirements, Assignments, Examples, Tester checklist, and Traceability with their specified fixed columns
    And graph storage and validation-plan bytes remain unchanged

  # Data layer Flow documentation export runtime 002
  Scenario: Data layer Flow documentation export runtime 002
    When production Confluence and Spreadsheet outputs are generated from the same selected snapshot
    Then parsed metadata, node, Event, relationship, Page, effective-requirement, Assignment, example, checklist, and traceability records are structurally equal by export key
    And rich clipboard and spreadsheet escaping do not add, remove, split, or reinterpret a semantic value
    And generated time is excluded from semantic comparison while snapshot identity, layout, semantic records, omissions, and included sanitized-artwork digest are included

  # Data layer Flow documentation export runtime 003
  Scenario Outline: Data layer Flow documentation export runtime 003
    Given production contains canonical <record_kind> <export_key> with <semantic_evidence>
    When actual Confluence and Spreadsheet outputs are parsed
    Then <export_key> occurs exactly once in its named table with <semantic_evidence> in both outputs
    And every source, consumer, Flow, contract, origin, schema-revision, and provenance link from <export_key> resolves to one canonical export key

    Examples:
      | record_kind          | export_key                        | semantic_evidence                                                                                                        |
      | Node                 | node-retail-context               | flow-retail, Retail context, event-virtual-page-view, page-checkout, context-setting, Required, 1 through 1, contract-retail-context-r24, assignment-retail-context |
      | Node                 | node-retail-payment               | flow-retail, Retail payment, event-add-payment-info, page-checkout, interaction, Required, 1 through 1, contract-retail-payment-r24, assignment-retail-payment      |
      | Node                 | node-retail-purchase              | flow-retail, Retail Purchase, event-purchase, page-confirmation, Required, 1 through 1, contract-retail-purchase-r24, assignment-retail |
      | Node                 | node-trade-context                | flow-trade, Trade context, event-virtual-page-view, page-checkout, context-setting, Required, 1 through 1, contract-trade-context-r24, assignment-trade-context     |
      | Node                 | node-trade-payment                | flow-trade, Trade payment, event-add-payment-info, page-checkout, interaction, Required, 1 through 1, contract-trade-payment-r24, assignment-trade-payment          |
      | Node                 | node-trade-purchase               | flow-trade, Trade Purchase, event-purchase, page-confirmation, Required, 1 through 1, contract-trade-purchase-r24, assignment-trade     |
      | Event                | event-virtual-page-view           | virtual_page_view, event-history, payload, context-setting, requirement-event-page-type, example-retail-context-valid and example-trade-context-invalid, node-retail-context and node-trade-context |
      | Event                | event-add-payment-info            | add_payment_info, event-history, payload, interaction, requirement-event-payment-type, example-retail-payment-valid and example-trade-payment-invalid, node-retail-payment and node-trade-payment |
      | Event                | event-purchase                    | Purchase, purchase, event-history, payload, interaction, requirement-event-transaction-id, example-retail-purchase-valid and example-trade-purchase-invalid and example-retail-purchase-stale, node-retail-purchase and node-trade-purchase |
      | Relationship         | edge-retail-context-payment       | node-retail-context, expected next, node-retail-payment, manually expected                                               |
      | Relationship         | edge-retail-payment-purchase      | node-retail-payment, expected next, node-retail-purchase, manually expected                                              |
      | Relationship         | edge-trade-context-payment        | node-trade-context, expected next, node-trade-payment, manually expected                                                 |
      | Relationship         | edge-trade-payment-purchase       | node-trade-payment, expected next, node-trade-purchase, manually expected                                                |
      | Page                 | page-checkout                      | Checkout, /{channel}/checkout, requirement-page-checkout-type, profile-sitewide, node-retail-context and node-trade-context, node-retail-context and node-retail-payment and node-trade-context and node-trade-payment |
      | Page                 | page-confirmation                  | Confirmation, /{channel}/checkout/confirmation, requirement-page-confirmation-type, profile-sitewide, no context nodes, node-retail-purchase and node-trade-purchase |
      | Effective requirement | requirement-retail-context-site-id | node-retail-context, page-checkout, event-virtual-page-view, /site_id, Required, string, Profile Sitewide, Base Page Event Sitewide Retail provenance, schema revision 24 |
      | Effective requirement | requirement-retail-context-page-type | node-retail-context, page-checkout, event-virtual-page-view, /page/type, Required, string, exact checkout, Page Checkout, schema revision 24 |
      | Effective requirement | requirement-retail-payment-site-id | node-retail-payment, page-checkout, event-add-payment-info, /site_id, Required, string, Profile Sitewide, Base Page Event Sitewide Retail provenance, schema revision 24 |
      | Effective requirement | requirement-retail-payment-type  | node-retail-payment, page-checkout, event-add-payment-info, /ecommerce/payment_type, Required, string, card or wallet, Event add_payment_info, schema revision 24 |
      | Effective requirement | requirement-retail-purchase-site-id | node-retail-purchase, page-confirmation, event-purchase, /site_id, Required, string, Profile Sitewide, Base Page Event Sitewide Retail provenance, schema revision 24 |
      | Effective requirement | requirement-retail-transaction-id | node-retail-purchase, page-confirmation, event-purchase, /ecommerce/transaction_id, Required, string, Event Purchase, schema revision 24 |
      | Effective requirement | requirement-retail-customer-type | node-retail-purchase, page-confirmation, event-purchase, /customer/type, Required, string, exact consumer, Profile Retail, schema revision 24 |
      | Effective requirement | requirement-trade-context-site-id | node-trade-context, page-checkout, event-virtual-page-view, /site_id, Required, string, Profile Sitewide, Base Page Event Sitewide Trade provenance, schema revision 24 |
      | Effective requirement | requirement-trade-context-page-type | node-trade-context, page-checkout, event-virtual-page-view, /page/type, Required, string, exact checkout, Page Checkout, schema revision 24 |
      | Effective requirement | requirement-trade-payment-site-id | node-trade-payment, page-checkout, event-add-payment-info, /site_id, Required, string, Profile Sitewide, Base Page Event Sitewide Trade provenance, schema revision 24 |
      | Effective requirement | requirement-trade-payment-type   | node-trade-payment, page-checkout, event-add-payment-info, /ecommerce/payment_type, Required, string, invoice or card, Event add_payment_info, schema revision 24 |
      | Effective requirement | requirement-trade-purchase-site-id | node-trade-purchase, page-confirmation, event-purchase, /site_id, Required, string, Profile Sitewide, Base Page Event Sitewide Trade provenance, schema revision 24 |
      | Effective requirement | requirement-trade-transaction-id | node-trade-purchase, page-confirmation, event-purchase, /ecommerce/transaction_id, Required, string, Event Purchase, schema revision 24 |
      | Effective requirement | requirement-trade-customer-type | node-trade-purchase, page-confirmation, event-purchase, /customer/type, Required, string, exact business, Profile Trade, schema revision 24 |
      | Effective requirement | requirement-trade-purchase-order-number | node-trade-purchase, page-confirmation, event-purchase, /ecommerce/purchase_order_number, Conditional, string, required when customer type business, Profile Trade, schema revision 24 |
      | Assignment           | assignment-retail-context         | route channel retail, priority 100, contract-retail-context-r24, Ready                                                    |
      | Assignment           | assignment-retail-payment         | route channel retail, priority 100, contract-retail-payment-r24, Ready                                                    |
      | Assignment           | assignment-retail                 | route channel retail, priority 100, contract-retail-purchase-r24, Ready                                                   |
      | Assignment           | assignment-trade-context          | route channel trade, priority 100, contract-trade-context-r24, Ready                                                      |
      | Assignment           | assignment-trade-payment          | route channel trade, priority 100, contract-trade-payment-r24, Ready                                                      |
      | Assignment           | assignment-trade                  | route channel trade, priority 100, contract-trade-purchase-r24, Ready                                                     |
      | Example              | example-retail-context-valid      | case-retail-context-valid, node-retail-context, contract-retail-context-r24, Positive, route channel retail, page type checkout, winner assignment-retail-context, no issues, required, case revision 5, Assignment content revision 7, schema revision 24, validation-plan revision 24, runner version 3, Passing |
      | Example              | example-trade-context-invalid     | case-trade-context-invalid, node-trade-context, contract-trade-context-r24, Negative, route channel trade, page type account, winner assignment-trade-context, exact issue at /page/type, required, case revision 5, Assignment content revision 7, schema revision 24, validation-plan revision 24, runner version 3, Passing |
      | Example              | example-retail-payment-valid      | case-retail-payment-valid, node-retail-payment, contract-retail-payment-r24, Positive, route channel retail, payment type card, winner assignment-retail-payment, no issues, required, case revision 5, Assignment content revision 7, schema revision 24, validation-plan revision 24, runner version 3, Passing |
      | Example              | example-trade-payment-invalid     | case-trade-payment-invalid, node-trade-payment, contract-trade-payment-r24, Negative, route channel trade, payment type wallet, winner assignment-trade-payment, enum issue at /ecommerce/payment_type, required, case revision 5, Assignment content revision 7, schema revision 24, validation-plan revision 24, runner version 3, Passing |
      | Example              | example-retail-purchase-valid     | case-retail-current, node-retail-purchase, contract-retail-purchase-r24, Positive, route channel retail, transaction_id R100, currency GBP, customer consumer, winner assignment-retail, no issues, required, case revision 5, Assignment content revision 7, schema revision 24, validation-plan revision 24, runner version 3, Passing |
      | Example              | example-trade-purchase-invalid    | case-trade-missing-order, node-trade-purchase, contract-trade-purchase-r24, Negative, route channel trade, transaction_id T100, customer business, no order, winner assignment-trade, conditional issue at /ecommerce/purchase_order_number, required, case revision 5, Assignment content revision 7, schema revision 24, validation-plan revision 24, runner version 3, Passing |
      | Example              | example-retail-purchase-stale     | case-retail-stale, node-retail-purchase, contract-retail-purchase-r24, Positive, route channel retail, transaction_id R099, currency GBP, customer consumer, winner assignment-retail, no issues, required, case revision 4, result Assignment content revision 6 versus current revision 7, result schema revision 23 versus current revision 24, result validation-plan revision 23 versus current revision 24, runner version 3, Stale |
      | Tester checklist     | checklist-retail-context          | flow-retail, node-retail-context, Checkout, virtual_page_view, Retail checkout context, Required, 1 through 1, exactly once, expected before Retail payment, Not checked, no actual count, no tester, no tested time, confirm Retail Page context, no observation links, Ready |
      | Tester checklist     | checklist-retail-payment          | flow-retail, node-retail-payment, Checkout, add_payment_info, Retail payment submitted, Required, 1 through 1, exactly once, expected before Purchase, Not checked, no actual count, no tester, no tested time, inspect payment payload, no observation links, Ready |
      | Tester checklist     | checklist-retail-purchase         | flow-retail, node-retail-purchase, Confirmation, Purchase, Retail order confirmed, Required, 1 through 1, exactly once, expected after Retail payment, Not checked, no actual count, no tester, no tested time, inspect Purchase payload, no observation links, Ready |
      | Tester checklist     | checklist-trade-context           | flow-trade, node-trade-context, Checkout, virtual_page_view, Trade checkout context, Required, 1 through 1, exactly once, expected before Trade payment, Not checked, no actual count, no tester, no tested time, confirm Trade Page context, no observation links, Ready |
      | Tester checklist     | checklist-trade-payment           | flow-trade, node-trade-payment, Checkout, add_payment_info, Trade payment submitted, Required, 1 through 1, exactly once, expected before Purchase, Not checked, no actual count, no tester, no tested time, inspect payment payload, no observation links, Ready |
      | Tester checklist     | checklist-trade-purchase          | flow-trade, node-trade-purchase, Confirmation, Purchase, Trade order confirmed, Required, 1 through 1, exactly once, expected after Trade payment, Not checked, no actual count, no tester, no tested time, inspect purchase order data, no observation links, Ready |
      | Traceability         | flow-retail                       | Flow, Retail checkout, project revision 24, Draft 24, page-checkout and page-confirmation, every flow-retail node relationship and checklist key, canonical Specification Flow |
      | Traceability         | flow-trade                        | Flow, Trade checkout, project revision 24, Draft 24, page-checkout and page-confirmation, every flow-trade node relationship and checklist key, canonical Specification Flow |
      | Traceability         | page-checkout                     | Page, Checkout, project revision 24, Draft 24, requirement-page-checkout-type, four Checkout node keys, canonical shared Page |
      | Traceability         | page-confirmation                 | Page, Confirmation, project revision 24, Draft 24, requirement-page-confirmation-type, node-retail-purchase and node-trade-purchase, canonical shared Page |
      | Traceability         | profile-sitewide                  | Profile, Sitewide, project revision 24, Draft 24, requirement-sitewide-site-id, both Page keys and all effective contracts, canonical shared Profile |
      | Traceability         | profile-retail                    | Profile, Retail, project revision 24, Draft 24, route channel retail Applicability, every Retail contract and Assignment, canonical variant Profile |
      | Traceability         | profile-trade                     | Profile, Trade, project revision 24, Draft 24, route channel trade Applicability, every Trade contract and Assignment, canonical variant Profile |
      | Traceability         | requirement-page-checkout-type    | Page requirement, Checkout page type, project revision 24, Draft 24, page-checkout, both context effective-requirement keys, Page-authored requirement |
      | Traceability         | requirement-page-confirmation-type | Page requirement, Confirmation page type, project revision 24, Draft 24, page-confirmation, both Purchase effective-contract keys, Page-authored requirement |
      | Traceability         | requirement-sitewide-site-id      | Profile requirement, Site identifier, project revision 24, Draft 24, profile-sitewide, all 6 effective contracts, Sitewide Profile requirement |
      | Traceability         | requirement-event-page-type       | Event requirement, Context page type, project revision 24, Draft 24, event-virtual-page-view, both context effective-requirement keys, shared Event requirement |
      | Traceability         | requirement-event-payment-type    | Event requirement, Payment type, project revision 24, Draft 24, event-add-payment-info, both payment effective-requirement keys, shared Event requirement |
      | Traceability         | requirement-event-transaction-id | Event requirement, Transaction ID, project revision 24, Draft 24, event-purchase, both Purchase effective-contract keys, shared Event requirement |
      | Traceability         | contract-retail-context-r24       | Effective contract, Retail context r24, project revision 24, Draft 24, page-checkout and event-virtual-page-view and profile-sitewide and profile-retail, node-retail-context and assignment-retail-context and Retail context examples, compiled Base Page Event Sitewide Retail provenance |
      | Traceability         | contract-retail-payment-r24       | Effective contract, Retail payment r24, project revision 24, Draft 24, page-checkout and event-add-payment-info and profile-sitewide and profile-retail, node-retail-payment and assignment-retail-payment and Retail payment examples, compiled Base Page Event Sitewide Retail provenance |
      | Traceability         | contract-retail-purchase-r24      | Effective contract, Retail Purchase r24, project revision 24, Draft 24, page-confirmation and event-purchase and profile-sitewide and profile-retail, node-retail-purchase and assignment-retail and all Retail Purchase examples, compiled Base Page Event Sitewide Retail provenance |
      | Traceability         | contract-trade-context-r24        | Effective contract, Trade context r24, project revision 24, Draft 24, page-checkout and event-virtual-page-view and profile-sitewide and profile-trade, node-trade-context and assignment-trade-context and Trade context examples, compiled Base Page Event Sitewide Trade provenance |
      | Traceability         | contract-trade-payment-r24        | Effective contract, Trade payment r24, project revision 24, Draft 24, page-checkout and event-add-payment-info and profile-sitewide and profile-trade, node-trade-payment and assignment-trade-payment and Trade payment examples, compiled Base Page Event Sitewide Trade provenance |
      | Traceability         | contract-trade-purchase-r24       | Effective contract, Trade Purchase r24, project revision 24, Draft 24, page-confirmation and event-purchase and profile-sitewide and profile-trade, node-trade-purchase and assignment-trade and all Trade Purchase examples, compiled Base Page Event Sitewide Trade provenance |
      | Traceability         | example-retail-purchase-valid     | Example, Retail Purchase valid, project revision 24, Draft 24, case-retail-current and contract-retail-purchase-r24, developer documentation and release review, current production case result |
      | Traceability         | checklist-retail-purchase         | Checklist row, Retail Purchase, project revision 24, Draft 24, flow-retail and node-retail-purchase, developer checklist template, manual expectation only |
  # Data layer Flow documentation export runtime 014
  Scenario: Data layer Flow documentation export runtime 014
    When actual Retail and Trade Confluence and Spreadsheet outputs are parsed together
    Then each output contains exactly 6 Nodes, 3 Events, 4 Relationships, 2 Pages, 15 effective requirements, 6 Assignments, 7 Examples, and 6 Tester checklist rows
    And the 6 nodes resolve to 3 shared Events and 6 distinct effective contracts without copied definitions
    And production Traceability contains exactly one row per exported key with no dangling source, consumer, Flow, contract, origin, schema-revision, or provenance link

  # Data layer Flow documentation export runtime 004
  Scenario: Data layer Flow documentation export runtime 004
    Given production nodes contain Required, Optional, Conditional, and Informational obligations with different multiplicities
    And production graph contains expected next, alternative, parallel, and merge relationships
    When graph, outline, checklist, Confluence, and Spreadsheet projections render
    Then node obligation and multiplicity values equal the production node records in every projection
    And every relationship projection contains only source, target, kind, group, label, plain-language condition, and human expectation semantics
    And no relationship record stores or overrides node obligation or multiplicity
    And no output contains runtime fork tokens, join state, transition outcomes, temporal-occurrence verdicts, or a Flow verdict

  # Data layer Flow documentation export runtime 005
  Scenario: Data layer Flow documentation export runtime 005
    Given draft revision 25 changes Purchase and moves a node
    When published release 3 documentation is generated at 2026-07-18T14:30:00Z and 2026-07-18T14:35:00Z
    Then both outputs have the release 3 documentation snapshot identity, layout, record keys, semantic values, omissions, and included-artwork digest
    And only their generated-time metadata differs
    And generating draft revision 25 identifies both draft changes without changing release 3

  # Data layer Flow documentation export runtime 006
  Scenario Outline: Data layer Flow documentation export runtime 006
    Given production <entity_kind> records have export keys <first_key> and <second_key>
    When actual controls change both display labels to <same_label>
    Then <first_key> and <second_key> remain unique and unchanged after Save and reload
    And every Confluence, Spreadsheet, diagram-text, requirement, Assignment, and traceability link resolves to the intended canonical entity
    And no exported key exposes a raw storage UUID

    Examples:
      | entity_kind             | first_key                    | second_key                  | same_label            |
      | Event-occurrence node   | node-retail-purchase         | node-trade-purchase         | Purchase confirmation |
      | Event                   | event-retail-confirmation    | event-trade-confirmation    | Confirmation          |
      | documented relationship | edge-retail-complete        | edge-trade-complete         | Complete              |
      | Assignment              | assignment-retail-purchase  | assignment-trade-purchase   | Purchase route        |
      | Event validation case   | case-retail-purchase        | case-trade-purchase         | Purchase negative     |

  # Data layer Flow documentation export runtime 007
  Scenario: Data layer Flow documentation export runtime 007
    Given production reference artwork checkout-journey.svg has sanitized digest svg-42
    And Include reference artwork has its default cleared state
    When actual Confluence and Spreadsheet outputs are generated
    Then neither output contains reference-artwork bytes
    And both identify checkout-journey.svg, svg-42, and Omitted by operator choice
    And parsed graph and semantic records remain complete and equal
    When Include reference artwork is selected
    Then actual inclusion preview identifies source attribution, svg-42 sanitization and removed unsafe content, Reference only treatment, and removal action
    When actual controls confirm inclusion and regenerate both outputs
    Then both include only the sanitized svg-42 asset as Reference only presentation
    And every semantic record and the published validation-plan identity remain unchanged

  # Data layer Flow documentation export runtime 008
  Scenario Outline: Data layer Flow documentation export runtime 008
    Given imported production SVG contains <unsafe_content>
    When production artwork safety processing runs
    Then artwork safety outcome is <safe_result>
    And no executable content, navigation, external request, Page, Event, node, relationship, schema, or Assignment is introduced

    Examples:
      | unsafe_content                     | safe_result                                                |
      | script and onload handler          | the sanitized stored asset contains no script or onload attribute |
      | javascript navigation              | the sanitized stored asset contains no executable link     |
      | external image and font references | the sanitized stored asset contains no external reference   |
      | malformed SVG                      | the prior safe backdrop remains with an actionable error    |

  # Data layer Flow documentation export runtime 009
  Scenario Outline: Data layer Flow documentation export runtime 009
    Given the actual documentation preview width is <width>
    When a complete multi-section Flow dossier is operated using only the keyboard
    Then responsive documentation layout is <layout>
    And every named table, artwork toggle, copy, download, close, and exact focus restoration action remains available

    Examples:
      | width | layout                                                        |
      | 360   | one active cards or table pane has one vertical scroll owner  |
      | 720   | selected columns fit the active pane                          |
      | 1280  | diagram and complete dedicated tables are available           |

  # Data layer Flow documentation export runtime 010
  Scenario: Data layer Flow documentation export runtime 010
    When production full-fidelity JSON is exported, imported into a fresh project, and reexported
    Then graph, layout, sanitized reference-artwork content and metadata, references, effective-schema inputs, Assignments, examples, checklist definitions, revisions, and immutable releases are identical
    And documentation outputs remain explicitly lossy unless every semantic category is selected

  # Data layer Flow documentation export runtime 011
  Scenario: Data layer Flow documentation export runtime 011
    Given production release 3 contains project revision 18 and validation-plan revision 18 released at 2026-07-17T12:00:00Z
    When its complete preview, Confluence output, Spreadsheet output, and text alternative are generated at 2026-07-18T14:30:00Z
    Then each parsed representation identifies Shop, Checkout journey, Checkout implementation, Published, project revision 18, release 3, validation-plan revision 18, released time 2026-07-17T12:00:00Z, generated time 2026-07-18T14:30:00Z, manual-journey boundary, no omissions, and reference artwork state
    And another generation changes only generated time without mutating production release 3

  # Data layer Flow documentation export runtime 012
  Scenario: Data layer Flow documentation export runtime 012
    Given one production Event case result is current at case revision 5, Assignment content revision 7, schema revision 24, validation-plan revision 24, and runner version 3
    And another result records Assignment content revision 6 while the selected revision uses 7
    When actual Confluence and Spreadsheet Examples records are parsed
    Then the first record is Passing with every freshness identity and the second is Stale with both Assignment revisions
    And production output contains no unqualified Last result field

  # Data layer Flow documentation export runtime 013
  Scenario: Data layer Flow documentation export runtime 013
    Given immutable release 3 can evaluate normalized observation Purchase retail 101
    When production Event Test, the actual capture transaction, and rendered Live process that identical normalized input
    Then each production consumer identifies content-addressed EventValidationResult evr-purchase-retail-101-r3
    And serialized semantic content is byte-equivalent for observation identity, normalized context, Assignment candidates and evidence, winner, rejected candidates, Profiles, schema revision, issues, provenance, and release 3
    And the comparison excludes only presentation channel, rendered time, expanded sections, and focus target
    And those excluded fields are absent from the serialized EventValidationResult
    And no direct callback, replaced Chrome API, legacy validator, mutable draft, or temporal result participates
