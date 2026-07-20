Feature: Data layer canonical Shared Profile schema authoring runtime

  Background:
    Given the built extension is running with production project storage and the production schema editor
    And production Saved Schema Library contains Opened Article revision 4 with nested properties, validation rules, documentation, and examples

  # Data layer canonical Shared Profile schema authoring runtime 001
  Scenario: Data layer canonical Shared Profile schema authoring runtime 001
    When actual controls open the Shared Profiles overview
    Then visible main-workspace actions are Add Shared Profile and Add saved schema to project
    And rendered guidance describes Shared Profiles as reusable complete schemas for generic or event-specific variables
    And the installed workflow does not require the global entity form or an internal collection name

  # Data layer canonical Shared Profile schema authoring runtime 002
  Scenario: Data layer canonical Shared Profile schema authoring runtime 002
    When actual controls create blank Shared Profile Sitewide
    Then the production main workspace opens Sitewide with one empty canonical property tree
    And its rendered header shows Draft, no source revision, lineage, save state, Undo, and Redo
    And Add root property is the rendered next action
    And canonical storage contains no second editable requirements grid, path list, or schema draft for Sitewide

  # Data layer canonical Shared Profile schema authoring runtime 003
  Scenario: Data layer canonical Shared Profile schema authoring runtime 003
    When actual controls review and confirm adding Opened Article to the project
    Then canonical project storage contains one Opened Article profile with source identity, source revision 4, and adoption provenance
    And its canonical draft is structurally equal to the source property tree, rules, documentation, and examples
    And production Saved Schema Library bytes remain unchanged
    And the installed wide workspace opens the adopted profile at its first property
    And production compilation, table rows, and side-panel commands read that draft identity

  # Data layer canonical Shared Profile schema authoring runtime 004
  Scenario: Data layer canonical Shared Profile schema authoring runtime 004
    Given persisted Sitewide contains legacy requirements, a structured schema draft, and path-based schema constraints
    When the installed upgrade opens Sitewide
    Then the rendered migration review maps every legacy property, rule, documentation entry, and example into one tree
    And repeated semantic entries have one proposed result with all source provenance
    And incompatible definitions block the production commit at generated property paths
    When actual controls resolve the conflicts and confirm migration
    Then one canonical transaction replaces the three editable representations
    And one installed Undo restores the byte-identical pre-migration project state

  # Data layer canonical Shared Profile schema authoring runtime 005
  Scenario: Data layer canonical Shared Profile schema authoring runtime 005
    Given actual controls open Opened Article in the wide schema workspace
    When article_name is selected
    Then the main workspace renders a property navigator, complete schema table, expandable article_name details, and effective documentation outside the Inspector
    And production search, filtering, revision comparison, object, array, item-type, scalar-type, presence, allowed-value, regular-expression, range, cardinality, conditional-rule, reusable-rule, documentation, example, and impact-review actions match the side-panel schema editor
    And installed Tree and Table views share the selected property and canonical Saved Draft
    And complete authoring succeeds without editing advanced JSON

  # Data layer canonical Shared Profile schema authoring runtime 006
  Scenario: Data layer canonical Shared Profile schema authoring runtime 006
    Given production Sitewide has no commerce property
    When actual tree actions add root object commerce, child object transaction, and child string transaction_id
    Then production storage contains generated paths /commerce, /commerce/transaction, and /commerce/transaction_id
    And each stored property has a stable identity separate from its path
    When actual controls rename transaction to order
    Then the rendered descendant path is /commerce/order/transaction_id
    And persisted rules, documentation, references, selection, and Undo retain their property identities

  # Data layer canonical Shared Profile schema authoring runtime 007
  Scenario Outline: Data layer canonical Shared Profile schema authoring runtime 007
    Given the production selected property has <current_definition>
    When actual controls choose <new_definition> from the type selectors
    Then the rendered impact review reports <impact>
    And confirmation persists <stored_definition> without a free-text type value

    Examples:
      | current_definition                         | new_definition  | impact                                    | stored_definition                   |
      | string without dependent rules             | number          | no incompatible dependent data            | number                              |
      | array of string without item documentation | array of number | every item changes from string to number   | array with number items             |
      | object with documented children            | string          | child definitions and documentation removed | string after destructive confirmation |

  # Data layer canonical Shared Profile schema authoring runtime 008
  Scenario Outline: Data layer canonical Shared Profile schema authoring runtime 008
    Given actual controls select article_name in Opened Article
    When the operator chooses <presence_mode> and builds <condition>
    Then canonical storage contains <stored_rule>
    And the installed condition builder stores stable property references and typed operators instead of raw expressions

    Examples:
      | presence_mode  | condition                              | stored_rule                                      |
      | Required       | none                                   | article_name is always required                  |
      | Required when  | article_type Equals sponsored          | article_name is required when article_type is sponsored |
      | Forbidden      | none                                   | article_name is always forbidden                 |
      | Forbidden when | privacy_mode Equals anonymous          | article_name is forbidden when privacy_mode is anonymous |

  # Data layer canonical Shared Profile schema authoring runtime 009
  Scenario: Data layer canonical Shared Profile schema authoring runtime 009
    Given production article_type is a string property
    When actual controls build Allowed values News, Guide, and Opinion
    Then the DOM contains one labelled string input and Remove action per value
    And Add value plus keyboard reordering persist three distinct typed values
    When actual controls open Add rule for article_type
    Then the production type-aware picker, condition builder, severity, issue message, and reusable-rule attachment are available
    And stored rules contain structured values and references rather than comma-separated or JSON-only substitutes

  # Data layer canonical Shared Profile schema authoring runtime 010
  Scenario: Data layer canonical Shared Profile schema authoring runtime 010
    Given production article_type allows News and Guide
    When actual controls save display text Article type, description Editorial classification, comments Coordinate with CMS, and example Guide
    Then canonical documentation stores typed Guide with allowed-value selection method
    And the rendered example editor also offers Custom value and Blank
    And reload preserves documentation content, selection method, property identity, and revision association
    And markup-like documentation is displayed as inert text

  # Data layer canonical Shared Profile schema authoring runtime 011
  Scenario: Data layer canonical Shared Profile schema authoring runtime 011
    Given production Opened Article contains nested article metadata and article_name properties
    When actual controls switch from Tree to Table
    Then the wide workspace renders one hierarchical row for every effective property
    And headings include property, path, type, presence, expected or allowed values, conditions, rules, documentation, example, source, local state, validation state, and actions
    And actual inline controls edit common fields across multiple rows
    And production root, child, sibling, rename, move, duplicate, and delete commands open no separate one-property screen
    When actual controls change article_name presence and article_type example without leaving Table
    Then both rendered rows retain their edits and remain simultaneously visible
    When the installed Table reveals article_name complex row detail
    Then complex condition and rule builders render beneath that row without unmounting the other rows
    And an actual Table edit immediately updates Tree and documentation preview

  # Data layer canonical Shared Profile schema authoring runtime 012
  Scenario: Data layer canonical Shared Profile schema authoring runtime 012
    Given installed Builder and side panel opened Opened Article at Draft token article-8
    When Builder commits article_author with Draft token article-9
    Then the subscribed side panel renders article_author without reopening the project
    When a side-panel command based on token article-8 proposes article_category
    Then production persistence never replaces the complete token article-9 profile with the stale snapshot
    And the installed conflict flow merges, rejects, or retries only the article_category command
    And final canonical storage contains every accepted command exactly once in one Saved Draft

  # Data layer canonical Shared Profile schema authoring runtime 013
  Scenario: Data layer canonical Shared Profile schema authoring runtime 013
    Given actual controls adopted Opened Article from revision 4
    When visible controls add nested metadata.category as string, make it Required when article_type Equals News, allow World and Technology, document it, and select World as its example
    And Table verifies the property and the side panel changes its comments
    And the installed extension reloads
    Then production Tree, Table, and side panel show one metadata.category definition with identical semantics and stable identity
    And the production compiler and validator consume that exact canonical Saved Draft

  # Data layer canonical Shared Profile schema authoring runtime 014
  Scenario: Data layer canonical Shared Profile schema authoring runtime 014
    Given production Opened Article contains article_type, pathname, and consent_state properties
    When actual controls build an All group containing Any of article_type Equals News or pathname Starts with /news/ and Not consent_state Equals denied
    Then installed nested group controls render the predicate in plain language
    And canonical storage contains stable property references, typed operators, and typed values in one structured predicate tree
    And production conditional presence, validation rules, and applicability use the same predicate commands
    When actual controls test matching and non-matching observations
    Then rendered evidence identifies satisfied and failed predicate branches
    And unresolved properties or type-incompatible values block the production command at the exact predicate control

  # Data layer canonical Shared Profile schema authoring runtime 015
  Scenario Outline: Data layer canonical Shared Profile schema authoring runtime 015
    Given the production canonical editor for <contributor> is rendered in <surface> at <viewport_width>px with article_name and article_type rows
    When actual keyboard events focus Canonical property search
    And enter article_n as separate input events
    Then after each event document.activeElement is the same connected search input
    And its observed value is the full prefix with selectionStart and selectionEnd after the newest character
    And production rows narrow to article_name without focusing a result, filter, view control, or property editor
    And Draft token, project bytes, page-scoped Undo, and persisted storage remain unchanged

    Examples:
      | contributor       | surface        | viewport_width |
      | Shared Profile    | Builder        | 1280           |
      | Page Group        | Builder        | 1280           |
      | Page              | Builder        | 360            |
      | Event             | Builder        | 1280           |
      | Flow Page instance | Flow workspace | 360            |
      | Event occurrence  | Flow workspace | 1280           |
      | Shared Profile    | Side panel     | 360            |

  # Data layer canonical Shared Profile schema authoring runtime 016
  Scenario: Data layer canonical Shared Profile schema authoring runtime 016
    Given the installed Page editor has focused Canonical property search containing article_type
    When actual selection APIs select the _type suffix and keyboard events enter _name
    Then the connected search input contains article_name with both selection offsets after the final character
    When production compositionstart, compositionupdate, input, and compositionend events replace the query with article_type
    Then the same input remains active and retains composing text through compositionend
    And the rendered result is article_type without a canonical command or storage write
    When actual keyboard controls clear the query
    Then all production property rows return and document.activeElement remains Canonical property search

  # Data layer canonical Shared Profile schema authoring runtime 017
  Scenario: Data layer canonical Shared Profile schema authoring runtime 017
    Given the installed side panel has opened its established Schema editor
    And production Shop contains Shared Profile Sitewide, Page Group Checkout, Page Cart, Event Purchase, Flow Page instance Cart step, and Event occurrence Cart Purchase
    When actual controls open the Schema list
    Then the installed list groups entries as
      | group          | entry             |
      | Saved schemas  | Opened Article     |
      | Shared         | Sitewide           |
      | Page Groups    | Checkout           |
      | Pages          | Cart               |
      | Events         | Purchase           |
      | Flow instances | Cart step          |
      | Occurrences    | Cart Purchase      |
    And every rendered entry shows human name, role, scope, lineage, revision, and Draft or saved state
    When actual controls select Sitewide
    Then exactly one schema-editor region remains mounted with the established property navigator, controls, and documentation area
    And production selection changes contributor role, scope, inheritance, and provenance without changing schema model
    And the DOM contains no adjacent Shared Profile editor, requirements grid, composed-schema form, or duplicate property controls

  # Data layer canonical Shared Profile schema authoring runtime 018
  Scenario: Data layer canonical Shared Profile schema authoring runtime 018
    Given production Sitewide defines funnel_name and funnel_step
    And canonical Checkout references Sitewide while Cart references Checkout
    When actual side-panel controls select Cart from the Schema list
    Then the established editor renders Sitewide, Checkout, and Cart contributions in composition order
    And rows distinguish inherited, local, effective, shadowed, conflicting, and provenance values in that editor
    And serialized inheritance contains stable contributor references plus sparse Cart property facets
    When actual controls override Cart funnel_step expected value with 2
    Then one production property command yields value 2 with identical provenance in panel, standalone workspace, compiler, and validator
    When actual controls activate Reset to parents for funnel_step
    Then canonical Cart storage removes the local expected-value facet and both installed editors recompile from Sitewide and Checkout
    And serialized Cart contains no copied parent property, inherited value, or composed snapshot

  # Data layer canonical Shared Profile schema authoring runtime 019
  Scenario Outline: Data layer canonical Shared Profile schema authoring runtime 019
    Given the two installed schema projections subscribe to canonical record Opened Article at Draft token article-8
    When actual controls complete <operation> in <authoring_surface>
    Then <observing_surface> renders <result> at Draft token article-9
    And command telemetry identifies the same purpose-built control and property-scoped command for both surfaces
    And canonical bytes contain neither raw-JSON substitution nor a surface-specific schema representation

    Examples:
      | operation                                                        | authoring_surface | observing_surface | result                                      |
      | add object metadata and nested string category                    | side panel        | standalone        | generated path /metadata/category           |
      | change tags to array with string item type                        | standalone        | side panel        | typed array and item definition              |
      | make article_name Required when article_type Equals News          | side panel        | standalone        | structured conditional presence              |
      | add allowed values News and Guide plus a conditional reusable rule | standalone        | side panel        | typed values and structured rule references  |
      | document article_type and select Guide as its example             | side panel        | standalone        | documentation and typed example              |
      | duplicate, move, rename, and delete a nested property             | standalone        | side panel        | identical property lifecycle and page-scoped Undo result |
