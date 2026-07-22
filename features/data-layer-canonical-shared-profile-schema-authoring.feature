# mutation-stamp: sha256=35172ea2f04ba17de6ffebc6697bd04332475b451b2bc825d62078247d31cbf9
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-22T16:37:17.533836428Z","feature_name":"Data layer canonical Shared Profile schema authoring","feature_path":"features/data-layer-canonical-shared-profile-schema-authoring.feature","background_hash":"9e8225c80de52bee679ebd2c1ee0ad618b61eb14a35a45ad9378b67a90e8c5ec","implementation_hash":"617bdd99e4","scenarios":[{"index":6,"name":"Data layer canonical Shared Profile schema authoring 007","scenario_hash":"4e1e629613f3377678a704de7fb49aa24b7666f7d6fd8f7336c5848a2481c5e1","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-22T16:27:51.760576697Z"},{"index":7,"name":"Data layer canonical Shared Profile schema authoring 008","scenario_hash":"1f66844909f9a2d8d4fb2e63db0a5ac2dbe8c763ce946f0d7dfa416bf3d7fab8","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-22T16:27:51.760576697Z"},{"index":14,"name":"Data layer canonical Shared Profile schema authoring 015","scenario_hash":"bb47aa3c9d43d49581aefe99b5084c921b7ac3b3925f65993047d6866f42c60b","mutation_count":21,"result":{"Total":21,"Killed":21,"Survived":0,"Errors":0},"tested_at":"2026-07-22T16:27:51.760576697Z"},{"index":18,"name":"Data layer canonical Shared Profile schema authoring 019","scenario_hash":"c8f16f48f38cc55fd9a94975c60aac7d763058989e5d44c3401164eb45f1e27e","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-07-22T16:27:51.760576697Z"},{"index":20,"name":"Data layer canonical Shared Profile schema authoring 021","scenario_hash":"436ca4c0421bc4737cfbc2375dea273640631dacdd87154dfc0df8a582bc8d30","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-07-22T16:27:51.760576697Z"}]}
# acceptance-mutation-manifest-end

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
    Then one atomic Saved Draft transaction replaces the three editable representations
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
    Given Builder and side panel opened Opened Article at Draft token article-8
    When Builder adds property article_author and commits Draft token article-9
    Then side panel receives token article-9 and displays article_author without reopening the project
    When a stale side-panel command based on token article-8 adds article_category
    Then the complete profile is never overwritten by the stale snapshot
    And the operator visibly merges, rejects, or retries only the article_category command against token article-9
    And both surfaces finish on one canonical Saved Draft containing every accepted command once

  # Data layer canonical Shared Profile schema authoring 013
  Scenario: Data layer canonical Shared Profile schema authoring 013
    Given Opened Article was adopted from revision 4
    When the operator adds nested metadata.category as string, makes it Required when article_type Equals News, allows World and Technology, documents it, and selects World as its example
    And the operator verifies the property in Table and edits its comments from the side panel
    And the project is reloaded
    Then Tree, Table, and side panel show one metadata.category property with the same type, conditional presence, values, documentation, example, comments, stable identity, and Saved Draft
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
    And search causes no Draft token, project transaction, or persisted change

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

  # Data layer canonical Shared Profile schema authoring 017
  Scenario: Data layer canonical Shared Profile schema authoring 017
    Given the established Schema editor is open in the side panel
    And Shop contains Shared Profile Sitewide, Page Group Checkout, Page Cart, Event Purchase, Flow Page instance Cart step, and Event occurrence Cart Purchase
    When the operator opens the Schema list
    Then one list groups schema records and contributors as
      | group          | entry             |
      | Saved schemas  | Opened Article     |
      | Shared         | Sitewide           |
      | Page Groups    | Checkout           |
      | Pages          | Cart               |
      | Events         | Purchase           |
      | Flow instances | Cart step          |
      | Occurrences    | Cart Purchase      |
    And each entry shows its human name, role, scope, lineage, revision, and Draft or saved state
    When the operator selects Sitewide
    Then the same single in-panel Schema editor displays Sitewide through the established property navigator, controls, and documentation area
    And Shared Profile changes role, scope, inheritance, and provenance without selecting another schema model
    And no second Shared Profile editor, requirements grid, composed-schema form, or duplicate property controls appear beside the regular editor

  # Data layer canonical Shared Profile schema authoring 018
  Scenario: Data layer canonical Shared Profile schema authoring 018
    Given Sitewide defines funnel_name and funnel_step
    And Checkout inherits Sitewide and Cart inherits Checkout
    When the operator selects Cart from the side-panel Schema list
    Then the regular Schema editor shows Sitewide, Checkout, and Cart contributions in composition order
    And each property distinguishes inherited, local, effective, shadowed, conflicting, and provenance values within that editor
    And canonical storage represents inheritance with stable contributor references and sparse local property facets
    When the operator overrides Cart funnel_step expected value with 2
    Then one property-scoped Cart command produces the same effective value and provenance in the side panel, standalone workspace, compiler, and validator
    When the operator activates Reset to parents for funnel_step
    Then Cart's local expected-value facet is removed and both editors immediately derive the effective value from Sitewide and Checkout
    And no parent property, inherited value, or composed snapshot is copied into Cart storage

  # Data layer canonical Shared Profile schema authoring 019
  Scenario Outline: Data layer canonical Shared Profile schema authoring 019
    Given both schema surfaces subscribe to canonical Opened Article Draft token article-8
    When the operator completes <operation> in <authoring_surface>
    Then <observing_surface> shows <result> at Draft token article-9
    And both surfaces offered the same purpose-built controls and emitted the same property-scoped command
    And neither surface required raw JSON or stored a surface-specific schema representation

    Examples:
      | operation                                                        | authoring_surface | observing_surface | result                                      |
      | add object metadata and nested string category                    | side panel        | standalone        | generated path /metadata/category           |
      | change tags to array with string item type                        | standalone        | side panel        | typed array and item definition              |
      | make article_name Required when article_type Equals News          | side panel        | standalone        | structured conditional presence              |
      | add allowed values News and Guide plus a conditional reusable rule | standalone        | side panel        | typed values and structured rule references  |
      | document article_type and select Guide as its example             | side panel        | standalone        | documentation and typed example              |
      | duplicate, move, rename, and delete a nested property             | standalone        | side panel        | identical property lifecycle and page-scoped Undo result |

  # Data layer canonical Shared Profile schema authoring 020
  Scenario: Data layer canonical Shared Profile schema authoring 020
    Given canonical Opened Article Draft article-8 has compact-panel and wide-workspace projections
    When the operator opens Opened Article in the side panel
    Then the sole editor retains the compact established schema header, property filter, property sort, complete property tree, and assisted Add property controls
    And selecting metadata/category exposes valid type, conditional presence, typed allowed values, rich rules, documentation, examples, copy, move, and remove actions in stacked panel detail
    And no standalone wide table, Builder canonical editor, or second schema form is embedded inside the side-panel editor
    When the operator opens the same Opened Article Draft in the standalone workspace
    Then the workspace keeps all property rows visible in its wide table and exposes the same complex operations in expandable row detail
    And the standalone renderer does not replace or reconfigure the side-panel renderer
    When the operator changes metadata/category documentation through the compact side-panel control
    And the operator changes metadata/category conditional presence through the standalone row detail
    Then canonical subscription results are
      | projection          | rendered facet       | Draft token |
      | standalone table    | changed documentation | article-9   |
      | compact panel detail | changed condition     | article-10  |
    And each result identifies its originating property-scoped command
    And both surfaces persist one canonical property identity without a presentation-specific schema representation

  # Data layer canonical Shared Profile schema authoring 021
  Scenario Outline: Data layer canonical Shared Profile schema authoring 021
    Given Opened Article source JSON defines string property <property_path> without const or enum
    And its separate property documentation stores display text <display_text>, description <description>, and comments <comments> at <property_path>
    And attached enabled <rule_kind> rule <rule_name> revision <rule_revision> supplies <configured_values> at <property_path> with severity <severity> and <issue_message>
    When the operator reviews and confirms adding Opened Article to the project
    Then the adopted canonical property preserves <display_text>, <description>, and <comments>
    And its effective <value_facet> is <configured_values> derived from the attached rule
    And the expanded builder identifies enabled origin <rule_name> v<rule_revision>, severity <severity>, and <issue_message>
    When the operator switches the adopted Shared Profile to Table
    Then the <property_path> row shows that documentation and <configured_values> in the Expected or allowed values column
    And Tree, side panel, compiler, and validator consume the same documented canonical property and rule-derived value
    When the project is reloaded
    Then the mapped facets, rule metadata, and source provenance remain visible without re-entry or migration
    And the Saved Schema Library source remains byte-identical

    Examples:
      | property_path | display_text | description              | comments       | rule_kind      | rule_name                     | rule_revision | configured_values                                                               | severity | issue_message                                | value_facet    |
      | /article_type | Article type | Editorial classification | CMS taxonomy   | exact-value    | Required article type         | 3             | typed string News                                                               | warning  | issue message Use the required article type | Expected value |
      | /error_type   | Error type   | Error classification     | Error handling | allowed-values | Allowed values for error_type | 1             | typed strings technical, validation, authentication, login, and notification | error    | no issue message                             | Allowed values |

  # Data layer canonical Shared Profile schema authoring 022
  Scenario: Data layer canonical Shared Profile schema authoring 022
    Given Opened Article source JSON defines string properties /page_type and /error_action without required presence
    And attached enabled required rule Required for error_action revision 1 targets /error_action with severity error
    And its All condition requires /page_type to Equal typed string error
    When the operator reviews and confirms adding Opened Article to the project
    Then imported rule mapping makes /error_action Required when
    When the operator switches the adopted Shared Profile to Table
    Then the /error_action row shows Required when in Presence and page_type Equals error in Conditions
    And its rule detail retains enabled origin Required for error_action v1, severity error, the required operator, target /error_action, and the All condition tree
    And compiler and validator outcomes are
      | page_type | error_action | outcome |
      | error     | absent       | invalid |
      | error     | present      | valid   |
      | article   | absent       | valid   |
    When the project is reloaded
    Then the mapped facets, rule metadata, and source provenance remain visible without re-entry or migration
    And the Saved Schema Library source remains byte-identical
