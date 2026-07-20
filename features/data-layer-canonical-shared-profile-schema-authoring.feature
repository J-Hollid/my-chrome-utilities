Feature: Data layer canonical Shared Profile schema authoring

  Background:
    Given Shop specification project is open
    And Saved Schema Library contains Opened Article revision 4 with nested properties, validation rules, documentation, and examples

  # Data layer canonical Shared Profile schema authoring 001
  Scenario: Data layer canonical Shared Profile schema authoring 001
    When the operator opens the Shared Profiles overview
    Then Add Shared Profile and Add saved schema to project are visible contextual actions in the main workspace
    And the overview explains that a Shared Profile is a reusable complete schema for generic or event-specific variables
    And creating a Profile does not require the unrelated global entity form or knowledge of an internal collection name

  # Data layer canonical Shared Profile schema authoring 002
  Scenario: Data layer canonical Shared Profile schema authoring 002
    When the operator creates blank Shared Profile Sitewide
    Then Sitewide opens in the wide schema workspace with one empty canonical property tree
    And its header shows Draft, no source revision, lineage, save state, Undo, and Redo
    And Add root property is the recommended next action
    And no editable requirements grid, free-text path list, or parallel schema draft is created

  # Data layer canonical Shared Profile schema authoring 003
  Scenario: Data layer canonical Shared Profile schema authoring 003
    When the operator reviews and confirms adding Opened Article to the project
    Then one project-owned Shared Profile named Opened Article preserves source identity, source revision 4, and adoption provenance
    And its canonical draft contains the complete source property tree, rules, documentation, and examples
    And the Saved Schema Library source remains byte-identical
    And the wide schema workspace opens the adopted profile at its first property
    And compilation, table rows, and side-panel editing consume that same canonical draft

  # Data layer canonical Shared Profile schema authoring 004
  Scenario: Data layer canonical Shared Profile schema authoring 004
    Given legacy Sitewide contains requirements, a structured schema draft, and path-based schema constraints
    When the operator opens Sitewide after the canonical-model upgrade
    Then a migration review maps every legacy property, rule, documentation entry, and example into one canonical tree
    And duplicate semantic entries are proposed once with all source provenance
    And incompatible definitions block migration at their generated property paths
    When the operator resolves the conflicts and confirms migration
    Then one atomic draft revision replaces the three editable representations
    And one Undo restores the complete pre-migration project state

  # Data layer canonical Shared Profile schema authoring 005
  Scenario: Data layer canonical Shared Profile schema authoring 005
    Given Opened Article is open in the wide schema workspace
    When the operator selects property article_name
    Then the workspace shows a property navigator, the complete schema table, expandable article_name details, and effective documentation without using the Inspector as its primary editor
    And search, filtering, revision comparison, object, array, item-type, scalar-type, presence, allowed-value, regular-expression, range, cardinality, conditional-rule, reusable-rule, documentation, example, and impact-review actions match the side-panel schema editor
    And Tree and Table are synchronized views of the same profile revision
    And advanced JSON is optional and cannot be the only complete authoring route

  # Data layer canonical Shared Profile schema authoring 006
  Scenario: Data layer canonical Shared Profile schema authoring 006
    Given Sitewide has no commerce property
    When the operator adds root object commerce, child object transaction, and child string transaction_id through tree actions
    Then the editor generates /commerce, /commerce/transaction, and /commerce/transaction_id without free-text path entry
    And each property has a stable identity independent of its generated path
    When the operator renames transaction to order
    Then the displayed descendant path becomes /commerce/order/transaction_id
    And rules, documentation, references, selection, and Undo continue to use the same stable property identities

  # Data layer canonical Shared Profile schema authoring 007
  Scenario Outline: Data layer canonical Shared Profile schema authoring 007
    Given the selected property has <current_definition>
    When the operator chooses <new_definition> from the valid type controls
    Then the impact review reports <impact>
    And confirmation stores <stored_definition> without accepting a free-text type

    Examples:
      | current_definition                         | new_definition  | impact                                    | stored_definition                   |
      | string without dependent rules             | number          | no incompatible dependent data            | number                              |
      | array of string without item documentation | array of number | every item changes from string to number   | array with number items             |
      | object with documented children            | string          | child definitions and documentation removed | string after destructive confirmation |

  # Data layer canonical Shared Profile schema authoring 008
  Scenario Outline: Data layer canonical Shared Profile schema authoring 008
    Given article_name is selected in Opened Article
    When the operator chooses <presence_mode> and configures <condition>
    Then the canonical property rule is <stored_rule>
    And the condition uses property selectors and typed operators rather than a raw expression

    Examples:
      | presence_mode  | condition                              | stored_rule                                      |
      | Required       | none                                   | article_name is always required                  |
      | Required when  | article_type Equals sponsored          | article_name is required when article_type is sponsored |
      | Forbidden      | none                                   | article_name is always forbidden                 |
      | Forbidden when | privacy_mode Equals anonymous          | article_name is forbidden when privacy_mode is anonymous |

  # Data layer canonical Shared Profile schema authoring 009
  Scenario: Data layer canonical Shared Profile schema authoring 009
    Given article_type is a string property
    When the operator builds Allowed values News, Guide, and Opinion
    Then each value has its own labelled string input and Remove action
    And Add value and keyboard reordering preserve News, Guide, and Opinion as distinct typed values
    When the operator opens Add rule for article_type
    Then the type-aware rule picker, conditional rule builder, severity, issue message, and reusable-rule attachment match the side-panel schema editor
    And saving does not store a comma-separated or JSON-only substitute for the structured values and rules

  # Data layer canonical Shared Profile schema authoring 010
  Scenario: Data layer canonical Shared Profile schema authoring 010
    Given article_type allows News and Guide
    When the operator documents article_type with display text Article type, description Editorial classification, comments Coordinate with CMS, and example Guide
    Then Guide is stored as a typed example selected from effective allowed values
    And Custom value and Blank remain available example choices
    And display text, description, comments, example value, selection method, property identity, and revision association persist together
    And documentation text is rendered as inert content

  # Data layer canonical Shared Profile schema authoring 011
  Scenario: Data layer canonical Shared Profile schema authoring 011
    Given Opened Article contains nested article metadata and article_name properties
    When the operator switches from Tree to Table
    Then one hierarchical row per effective property remains visible in the wide workspace
    And columns show property, path, type, presence, expected or allowed values, conditions, rules, documentation, example, source, local state, validation state, and actions
    And common type, presence, expected-value, allowed-value, documentation, example, and row actions are usable inline across multiple rows
    And root, child, sibling, rename, move, duplicate, and delete commands require no separate one-property screen
    When the operator changes article_name presence and article_type example without leaving Table
    Then both rows retain their edits and remain visible together
    When the operator expands the article_name row
    Then complex condition and rule builders open beneath that row while the other property rows remain available
    And an edit made in Table is immediately visible in Tree and the documentation preview

  # Data layer canonical Shared Profile schema authoring 012
  Scenario: Data layer canonical Shared Profile schema authoring 012
    Given Builder and side panel opened Opened Article at canonical revision 8
    When Builder adds property article_author and commits revision 9
    Then side panel receives revision 9 and displays article_author without reopening the project
    When a stale side-panel command based on revision 8 adds article_category
    Then the complete profile is never overwritten by the stale snapshot
    And the operator visibly merges, rejects, or retries only the article_category command against revision 9
    And both surfaces finish on one canonical revision containing every accepted command once

  # Data layer canonical Shared Profile schema authoring 013
  Scenario: Data layer canonical Shared Profile schema authoring 013
    Given Opened Article was adopted from revision 4
    When the operator adds nested metadata.category as string, makes it Required when article_type Equals News, allows World and Technology, documents it, and selects World as its example
    And the operator verifies the property in Table and edits its comments from the side panel
    And the project is reloaded
    Then Tree, Table, and side panel show one metadata.category property with the same type, conditional presence, values, documentation, example, comments, stable identity, and draft revision
    And compilation and validation consume exactly that canonical property definition

  # Data layer canonical Shared Profile schema authoring 014
  Scenario: Data layer canonical Shared Profile schema authoring 014
    Given Opened Article contains article_type, pathname, and consent_state properties
    When the operator builds an All group containing Any of article_type Equals News or pathname Starts with /news/ and Not consent_state Equals denied
    Then nested group controls render the condition in plain language
    And property selectors, type-compatible operators, and typed values persist stable references in a structured predicate tree
    And the same predicate builder is available for conditional presence, validation rules, and applicability
    When the operator tests matching and non-matching observations in the builder
    Then each result identifies the satisfied and failed predicate branches
    And unresolved properties or type-incompatible values block saving at the exact predicate control

  # Data layer canonical Shared Profile schema authoring 015
  Scenario Outline: Data layer canonical Shared Profile schema authoring 015
    Given the canonical schema for <contributor> is open in <surface> at <viewport_width>px with article_name and article_type visible
    When the operator focuses Canonical property search
    And types article_n one character at a time
    Then after every character focus remains in Canonical property search
    And its value is the complete typed prefix with the caret after the newest character
    And the property navigator updates to the matching article_name result without moving focus to a result, filter, view control, or property editor
    And search causes no canonical revision, project transaction, or persisted change

    Examples:
      | contributor       | surface        | viewport_width |
      | Shared Profile    | Builder        | 1280           |
      | Page Group        | Builder        | 1280           |
      | Page              | Builder        | 360            |
      | Event             | Builder        | 1280           |
      | Flow Page instance | Flow workspace | 360            |
      | Event occurrence  | Flow workspace | 1280           |
      | Shared Profile    | Side panel     | 360            |

  # Data layer canonical Shared Profile schema authoring 016
  Scenario: Data layer canonical Shared Profile schema authoring 016
    Given Canonical property search is focused in the Page editor with query article_type
    When the operator selects the _type suffix and types _name
    Then the search value is article_name and the caret remains after the final typed character
    When an input-method composition replaces the query with article_type
    Then focus and the composing text remain in the search control until composition ends
    And the matching article_type result appears without changing canonical state
    When the operator clears the query from the keyboard
    Then the complete property navigator returns while focus remains in Canonical property search
