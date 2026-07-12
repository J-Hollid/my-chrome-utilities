Feature: Data layer schema workspace runtime completion

  Background:
    Given the rendered Data Layer Schemas workspace is displayed

  # Data layer schema workspace runtime completion 001
  Scenario Outline: Data layer schema workspace runtime completion 001
    Given <source_kind> <source_name> contains nested payload properties page_type, page_name, and commerce.order.id
    When the operator activates Create schema from this <source_kind>
    Then the schema editor renders expandable property rows for the observed payload hierarchy
    And each row offers Add validation rule and View attached rules for its complete property path
    And the operator does not have to type a property path into a free-form field
    And no observed value becomes an active rule before the operator accepts it

    Examples:
      | source_kind      | source_name             |
      | Live event       | captured event event-7  |
      | Library template | template Order complete |

  # Data layer schema workspace runtime completion 002
  Scenario: Data layer schema workspace runtime completion 002
    Given the schema draft contains string property page_type and nested property commerce.order.id
    When the operator adds, edits, disables, re-enables, and removes property rules through the rendered rule menus
    Then the affected property rows immediately show their active-rule counts and states
    And View attached rules identifies each rule's parameters, severity, origin, and version
    And keyboard focus returns to the originating property row when a rule menu closes
    And saving and reopening the schema preserves the rendered rule attachments

  # Data layer schema workspace runtime completion 003
  Scenario: Data layer schema workspace runtime completion 003
    Given Generic page view version 4 is the parent of an Order confirmation schema draft
    When inherited and general rules are displayed in the editor
    Then every inherited rule offers Inherit, Enabled in this schema, and Disabled in this schema
    And the editor separately renders active inherited, disabled inherited, explicitly re-enabled, and local rules
    And the operator can configure Only declared properties through General rules
    And the effective-rule preview identifies the originating schema and version for every rule

  # Data layer schema workspace runtime completion 004
  Scenario: Data layer schema workspace runtime completion 004
    Given the Schema Library contains schemas, reusable rules, assignments, revisions, inheritance exceptions, and examples
    When the operator activates Export Schema Library
    Then the browser downloads 1 versioned JSON file containing the complete Schema Library
    When the operator selects that file through Import Schema Library
    Then a rendered review offers Replace Schema Library and Append to Schema Library
    And no import occurs through a text prompt or before the operator confirms a choice
    And importing and reloading preserves the exported names, versions, rules, assignments, and exceptions

  # Data layer schema workspace runtime completion 005
  Scenario: Data layer schema workspace runtime completion 005
    Given reusable rule Approved page types version 1 is saved
    When the operator edits it to include confirmation
    Then a rendered Save revision review identifies the changed parameters and examples
    And confirming creates version 2 while existing schema attachments remain pinned to version 1
    And a schema attachment changes to version 2 only through its rendered update action
    And Rule Library rows provide separate Edit, Duplicate, Export, and Delete actions

  # Data layer schema workspace runtime completion 006
  Scenario: Data layer schema workspace runtime completion 006
    Given generic and order-confirmation page_view assignments are saved with priorities 10 and 100
    When page_view is captured from https://shop.example/order-confirmation
    Then the rendered event validation identifies the selected Order confirmation schema and exact version
    And it identifies the matching source, event name, domain, pathname, and priority assignment
    And the operator can select a different schema from the Live inspector for an explicit manual validation
    And the Event Library editor provides the same explicit schema attachment control for its template

  # Data layer schema workspace runtime completion 007
  Scenario: Data layer schema workspace runtime completion 007
    Given a schema validation produces inherited, local, warning, and error results at nested paths
    When validation details are opened from Live or the Event Library
    Then rendered issue rows show path, rule, message, expected value, actual value, severity, schema origin, and schema location
    And the summary distinguishes Valid, Warnings, Issues, Not checked, and Assignment error
    And validation refreshes after a Library draft change without mutating the draft
    And saved-session validation remains pinned to the schema version originally recorded

  # Data layer schema workspace runtime completion 008
  Scenario: Data layer schema workspace runtime completion 008
    When the schema workspace runtime acceptance suite is executed
    Then it completes schema creation, nested rule editing, inheritance exceptions, assignment, validation, export, import, and reload through rendered controls
    And it verifies browser storage, downloaded content, dialog visibility, focus restoration, and rendered validation details
    And it exercises production event capture and validation callbacks rather than acceptance-world flags or source-string assertions
    And the delivered extension bundle contains the same schema workspace behavior as the production source

  # Data layer schema workspace runtime completion 009
  Scenario Outline: Data layer schema workspace runtime completion 009
    Given the current Schema Library contains <schema_count> schemas and <rule_count> reusable rules
    When the complete Schema Library is exported and its downloaded JSON is inspected
    Then the export reports <schema_count> schemas and <rule_count> reusable rules
    And every exported schema and rule identity is present rather than a fixed fixture subset
    When that export replaces the Schema Library and the panel reloads
    Then <schema_count> schemas and <rule_count> reusable rules remain stored and rendered

    Examples:
      | schema_count | rule_count |
      | 1            | 3          |
      | 2            | 4          |
