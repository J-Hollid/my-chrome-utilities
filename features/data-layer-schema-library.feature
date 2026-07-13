# mutation-stamp: sha256=3d1aa191cd70207385c3d6a0bb70703d49e5e94142dfefe75f6ded7d9583cb29
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-13T21:06:32.933615630Z","feature_name":"Data layer schema Library","feature_path":"features/data-layer-schema-library.feature","background_hash":"70173ad00b28c1d3426ab0b037ac638e267465dcc24ccbc22b862fa9f3253ee5","implementation_hash":"sha256:596d5be53e06155329ff2252193fd0efca28eca3d2adb0f56e7d989e03aacf8d","scenarios":[{"index":2,"name":"Data layer schema Library 003","scenario_hash":"b512f42361300ee2c468be5cf6785e6900ca6cb4e54170bc6845e01e52af6a7a","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-13T21:06:32.933615630Z"},{"index":4,"name":"Data layer schema Library 005","scenario_hash":"7561596af6df9ae6167bb051f6be9f8888410fbbaae75d2520526df7de56e317","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-13T21:06:32.933615630Z"},{"index":7,"name":"Data layer schema Library 008","scenario_hash":"1559e06bd4916409ec14cf9cd49076df583f095e1991c7ad9d9d4ed7e4c4759b","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-13T21:06:32.933615630Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema Library

  Background:
    Given the Data Layer Schemas workspace is displayed

  # Data layer schema Library 001
  Scenario: Data layer schema Library 001
    When Schemas workspace navigation is displayed
    Then subviews are ordered Schemas, Rule Library, and Assignments
    And only 1 subview is active at a time
    And each subview has its own search, item count, creation action, and empty state

  # Data layer schema Library 002
  Scenario: Data layer schema Library 002
    Given no schema is selected
    When the operator activates Create schema
    Then an unpersisted schema editor opens with Name empty, target Payload, no parent, and no active rules
    And the editor status is Unsaved new schema
    And keyboard focus moves to Name
    And no schema record is created before Publish schema succeeds

  # Data layer schema Library 003
  Scenario Outline: Data layer schema Library 003
    Given <source_object> contains nested payload properties page_type, page_name, and commerce.order.id
    When the operator activates Create schema from this <source_kind>
    Then a new schema draft opens with the observed property tree and value types
    And the draft retains <source_kind> as a validation example
    And observed types and values are suggestions rather than active rules until accepted
    And creating the draft does not modify <source_object>

    Examples:
      | source_kind       | source_object          |
      | Live event        | captured event event-7 |
      | Library template  | template template-4    |

  # Data layer schema Library 004
  Scenario: Data layer schema Library 004
    Given schema Page view is open for editing
    When the schema editor is displayed
    Then identity, target, and parent schema appear before rule authoring
    And Property rules and General rules are the primary editing sections
    And Validation examples, Assignments, generated schema document, and Revision history are separate disclosures
    And the generated schema document and Revision history start collapsed
    And changing disclosure state does not save or discard the schema draft

  # Data layer schema Library 005
  Scenario Outline: Data layer schema Library 005
    Given the new schema draft has readiness problem <readiness_problem>
    When schema actions are displayed
    Then Publish schema is disabled with reason <disabled_reason>
    And the reason is associated with <affected_field>

    Examples:
      | readiness_problem         | affected_field    | disabled_reason                   |
      | Name empty                | Name              | Enter a schema name               |
      | no validation target      | Validation target | Select payload or raw input       |
      | no active rules           | Rules             | Add at least one validation rule  |
      | rule configuration invalid | Rules            | Correct invalid validation rules  |

  # Data layer schema Library 006
  Scenario: Data layer schema Library 006
    Given new schema Page view has target Payload and at least 1 valid active rule
    When the operator activates Publish schema
    Then Page view version 1 is persisted with a stable schema identity
    And its rule identities, target, parent reference, examples, and generated schema document are stored
    And subsequent edits use the Page view working draft
    And Page view remains available after the side panel reloads

  # Data layer schema Library 007
  Scenario: Data layer schema Library 007
    Given Page view version 2 has a dirty schema draft
    When the operator activates Publish revision
    Then a review identifies rules added, changed, disabled, re-enabled, and removed
    And it identifies parent, target, assignment, and example changes
    And no schema mutation occurs before confirmation
    When the operator confirms Publish revision 3
    Then version 3 replaces version 2 as the current revision of Page view
    And version 2 remains available only in read-only Revision history
    And Page view remains 1 schema available for assignment

  # Data layer schema Library 008
  Scenario Outline: Data layer schema Library 008
    Given saved schemas include Page view, Purchase, and Product detail
    When the operator searches schemas for <query>
    Then the results contain <expected_schemas>
    And the result count reflects only matching schemas

    Examples:
      | query                    | expected_schemas       |
      | Page view                | Page view              |
      | event-history purchase   | Purchase               |
      | payload                  | Page view, Purchase    |
      | version 2                | Product detail         |

  # Data layer schema Library 009
  Scenario: Data layer schema Library 009
    Given schema Page view version 3 has assignments and recorded validation usage
    When the operator requests Delete Page view
    Then a confirmation identifies all versions, assignments, child schemas, templates, and recorded usage
    And deleting does not remove immutable validation records
    And no deletion occurs before final confirmation

  # Data layer schema Library 010
  Scenario: Data layer schema Library 010
    Given schemas, reusable rules, assignments, revisions, and examples are saved
    When the complete Schema Library is exported
    Then 1 versioned JSON file contains all Schema Library data
    And importing that file offers Replace Schema Library and Append to Schema Library
    And round-trip import preserves rule identities, inheritance exceptions, assignments, and revisions
    And transient validation results and target permissions are not exported as schema definitions

  # Data layer schema Library 011
  Scenario: Data layer schema Library 011
    Given Page view version 2 has a dirty schema draft
    When the operator closes the editor or selects another schema
    Then the working draft is retained without publishing
    And no current revision changes
    And reopening Page view restores the same draft for guided and advanced editing
    And Discard draft remains available as an explicit action

  # Data layer schema Library 012
  Scenario: Data layer schema Library 012
    Given Page view has current revision 3, 2 historical revisions, and 4 pending draft changes
    When schemas are displayed
    Then 1 Page view row identifies current revision 3
    And it identifies 4 pending draft changes and 2 historical revisions
    And Revision history is accessed from the Page view row
    And historical revisions are not displayed as schema rows
