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
    And no schema record is created before Save schema succeeds

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
    Then Save schema is disabled with reason <disabled_reason>
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
    When the operator activates Save schema
    Then Page view version 1 is persisted with a stable schema identity
    And its rule identities, target, parent reference, examples, and generated schema document are stored
    And subsequent edits use Save revision
    And Page view remains available after the side panel reloads

  # Data layer schema Library 007
  Scenario: Data layer schema Library 007
    Given Page view version 2 has a dirty schema draft
    When the operator activates Save revision
    Then a review identifies rules added, changed, disabled, re-enabled, and removed
    And it identifies parent, target, assignment, and example changes
    And no schema mutation occurs before confirmation
    When the operator confirms Save revision 3
    Then version 3 is persisted and version 2 remains available for historical validation

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
    Given schema Page view has a dirty draft
    When the operator closes the editor or selects another schema
    Then a confirmation offers Keep editing, Save revision, and Discard changes
    And no saved schema changes before Save revision is confirmed
    And discarding or reopening Page view restores its latest saved revision rather than the abandoned draft
