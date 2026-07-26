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
    And columns show property, path, type, presence, description, allowed values, example, source, local or effective state, and validation state
    And common type, presence, description, allowed-values, and example controls are usable inline across multiple rows
    And one context-menu trigger beside each property identity provides root, child, sibling, rename, move, duplicate, and delete commands without a dedicated actions column
    When the operator changes article_name description and article_type example without leaving Table
    Then both rows retain their edits and remain visible together
    When the operator opens article_name advanced actions
    Then complex condition and rule builders open in a row-anchored overlay while the table and its other property rows remain unchanged
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

  # Data layer canonical Shared Profile schema authoring 023
  Scenario Outline: Data layer canonical Shared Profile schema authoring 023
    Given /lineOfCustomer is available for <contributor> in the <surface> schema editor
    When the operator opens its property actions
    Then one compact top-level blocking overlay opens beside the invoking property action
    And the overlay offers Definition, Rules, and Structure with provenance and legal ownership summaries
    And the editor behind the overlay cannot receive pointer, keyboard, or scrolling interaction
    And the surface scroll region does not clip or constrain the overlay
    And Presence, Expected values, Allowed values, Conditions, Documentation, and Example are not separate first-layer sections
    When Definition is activated from the first-layer menu
    Then one adjacent child overlay keeps the first layer open and contains type, a Required or Optional or Forbidden selector, Allowed values, display text, description, comments, and example method
    And Allowed values accepts zero, one, or many comma-separated typed values
    And allowed values render as comma-separated human text without square brackets
    And no Definition control requires another submenu, inserts controls below the property table, or requires scrolling to a detached panel
    When Escape or Cancel closes the Definition child layer
    Then only that layer closes and focus returns to its parent choice
    When the operator dismisses the first layer
    Then all staging is discarded and focus returns to the originating property action

    Examples:
      | contributor       | surface        |
      | Shared Profile    | standalone     |
      | Page Group        | standalone     |
      | Page              | standalone     |
      | Event             | standalone     |
      | Flow Page-instance | Flow workspace |
      | Event occurrence  | Flow workspace |
      | Shared Profile    | in-panel       |
      | Page Group        | in-panel       |
      | Page              | in-panel       |
      | Event             | in-panel       |
      | Flow Page-instance | in-panel       |
      | Event occurrence  | in-panel       |

  # Data layer canonical Shared Profile schema authoring 024
  Scenario: Data layer canonical Shared Profile schema authoring 024
    Given /lineOfCustomer has an ordinary definition, one inherited pattern rule, and local range and cardinality rules
    When the operator opens the Rules child overlay
    Then each rule is one compact stable-identity row showing its When condition, Then outcome, severity, message, source, and ownership state
    And View opens read-only details without entering edit mode
    And Edit opens a further overlay containing optional When controls plus only the selected outcome's fields
    When the operator adds a rule
    Then the rule initially applies Always and can be saved without a When condition
    And adding When uses a searchable property selector, type-valid operator, and typed value only when required
    And the rule's Then outcome is chosen before only that outcome's applicable fields appear
    And reusable rules use a searchable named selector rather than a raw identity input
    And there is no separate property-level Conditions editor or condition rule kind
    When the operator stages removal of the local cardinality rule
    Then a named impact confirmation previews the effective result and marks the rule Removed with Restore available
    When Review changes is invoked
    Then added, edited, removed, overridden, and reset facets and rules are listed with the prospective effective result and affected consumers
    When the operator confirms the review
    Then one property-scoped command saves the complete staged session and creates one Undo action

  # Data layer canonical Shared Profile schema authoring 025
  Scenario: Data layer canonical Shared Profile schema authoring 025
    Given the reusable Rule Library contains Postal code pattern and Customer tier range
    And neither reusable rule is attached to /lineOfCustomer
    When the operator chooses Add rule and searches reusable rules for Customer
    Then the named selector offers Customer tier range and excludes Postal code pattern
    And no raw reusable-rule identity is displayed or editable
    When the operator clears the search and selects Customer tier range
    Then both human-named choices return and the staged rule references Customer tier range by its stable library identity

  # Data layer canonical Shared Profile schema authoring 026
  Scenario Outline: Data layer canonical Shared Profile schema authoring 026
    Given Add rule applies Always and has no selected outcome
    When Add rule outcome changes to <rule_outcome>
    Then the builder shows only <applicable_fields>
    And the builder does not show <irrelevant_fields>

    Examples:
      | rule_outcome | applicable_fields                                                   | irrelevant_fields                    |
      | presence     | Required or Optional or Forbidden, severity, and issue message      | value, pattern, range, or cardinality |
      | value        | allowed-values field, severity, and issue message                    | presence, pattern, range, or cardinality |
      | pattern      | pattern, severity, and issue message                                 | presence, value, range, or cardinality |
      | range        | minimum, maximum, severity, and issue message                        | presence, value, pattern, or cardinality |
      | cardinality  | minimum items, maximum items, severity, and issue message            | presence, value, pattern, or range    |
      | reusable     | searchable reusable-rule name                                        | raw identity or unrelated fields      |

  # Data layer canonical Shared Profile schema authoring 027
  Scenario Outline: Data layer canonical Shared Profile schema authoring 027
    Given the operator selected <rule_outcome> in Add rule
    When the operator enters <invalid_definition>
    Then Add rule is blocked with <diagnostic>
    And no rule, property command, Draft token, persistence write, or Undo action is created

    Examples:
      | rule_outcome | invalid_definition                         | diagnostic                                      |
      | presence     | an enabled When with unresolved predicate  | Resolve or remove the When condition             |
      | value        | an empty allowed-values field              | Enter at least one allowed value                 |
      | pattern      | an empty pattern                           | Enter a regular expression                      |
      | range        | minimum 10 and maximum 2                   | Minimum must not exceed maximum                 |
      | cardinality  | minimum items 4 and maximum items 1        | Minimum items must not exceed maximum items     |

  # Data layer canonical Shared Profile schema authoring 028
  Scenario: Data layer canonical Shared Profile schema authoring 028
    Given /lineOfCustomer has type string, Required presence, description Customer classification, allowed value retail, example retail, inherited source Sitewide, and a local rule
    When the operator opens Table in each schema contributor editor
    Then columns show property, path, type, presence, description, allowed values, example, source, local or effective state, and validation state
    And each row has one compact context-menu trigger beside its property identity and no dedicated column of facet or ownership action buttons
    When the operator changes /lineOfCustomer description, allowed values, and example in their table cells
    Then the values remain editable in that row without opening a focused editor or leaving Table
    And each changed cell commits directly on Enter, Tab, Shift+Tab, or blur without opening property review
    And each commit creates one property-scoped command with the displayed base Draft token and one Undo action
    And Escape before commit restores that cell's saved effective value with no command
    When the operator opens /lineOfCustomer's context menu
    Then advanced property operations block above the editor beside that row
    And the overlay is not clipped or height-constrained by the property table or editor scroll region
    And the overlay neither inserts a control panel below the table nor expands, replaces, or hides any property row
    When the property-action overlay is closed through either dismissal control
    Then the unchanged table remains the primary editor and focus returns to /lineOfCustomer's context-menu trigger

  # Data layer canonical Shared Profile schema authoring 029
  Scenario Outline: Data layer canonical Shared Profile schema authoring 029
    Given <target_property> has <ordinary_definition>
    And one named rule says When <condition> Then <conditional_outcome>
    When an observation has <condition_state>
    Then <effective_result>
    And the ordinary definition remains unchanged

    Examples:
      | target_property | ordinary_definition       | condition                                | conditional_outcome                                  | condition_state | effective_result                                      |
      | error_message   | Optional                   | page_type Equals error                   | Required                                             | matching        | error_message is Required                             |
      | error_message   | Optional                   | page_type Equals error                   | Required                                             | not matching    | error_message is Optional                             |
      | form_step_name  | allowed value contact      | form_type Equals checkout                | allowed values contact, delivery, payment            | matching        | form_step_name allows contact, delivery, and payment  |
      | form_step_name  | allowed value contact      | form_type Equals checkout                | allowed values contact, delivery, payment            | not matching    | form_step_name allows contact                         |
      | aProducts       | minimum items 1            | page_name Contains multi product bundle  | minimum items 2                                     | matching        | aProducts requires at least 2 items                   |
      | aProducts       | minimum items 1            | page_name Contains multi product bundle  | minimum items 2                                     | not matching    | aProducts requires at least 1 item                    |

  # Data layer canonical Shared Profile schema authoring 030
  Scenario: Data layer canonical Shared Profile schema authoring 030
    Given two named rules on /form_step_name match the same observation
    When their conditional outcomes are evaluated
    Then compatible outcomes compose and supersede only their targeted ordinary-definition facets
    And contradictory outcomes block with both rule names and no list-order winner
    And when a rule condition stops matching its targeted ordinary-definition facet resumes

  # Data layer canonical Shared Profile schema authoring 031
  Scenario: Data layer canonical Shared Profile schema authoring 031
    Given /aProducts has no conditional rules
    When the operator adds cardinality minimum items 2 without adding When
    Then the rule summary says Always Then minimum items 2
    And the rule applies to every observation
    When the operator adds When pageType Exists
    Then the summary says pageType exists without /aProducts, a stable identity, or a schema path prefix
    And removing When returns the same rule to Always without changing its cardinality outcome

  # Data layer canonical Shared Profile schema authoring 032
  Scenario Outline: Data layer canonical Shared Profile schema authoring 032
    Given /lineOfCustomer has allowed values retail and wholesale
    When Definition changes Example method to <example_method>
    Then Definition shows <value_control>
    And the persistence result is <stored_result>

    Examples:
      | example_method | value_control                                      | stored_result                         |
      | Blank          | no example-value control                           | no example value                      |
      | Allowed value  | one dropdown containing retail and wholesale       | the selected typed allowed value      |
      | Custom value   | one type-valid custom input                         | the entered typed custom value        |

  # Data layer canonical Shared Profile schema authoring 033
  Scenario Outline: Data layer canonical Shared Profile schema authoring 033
    Given the <editor> Table contains <property_count> property rows in an editor scroll region shorter than the Rules child overlay
    And the bottom property action is near the browser viewport edge
    When the operator opens the Rules child overlay
    Then the blocking overlay stack remains visually anchored beside that property action
    And every overlay layer is outside the editor scroll region and uses the browser viewport as its placement boundary
    And the editor scroll position and row geometry remain unchanged
    And the complete active layer is visible without an editor scrollbar when its content fits the browser viewport
    And only the active layer gains vertical scrolling when its content exceeds the browser viewport
    And focus remains inside the blocking overlay stack
    When Add condition is activated inside the empty When builder
    Then one directly editable property, operator, optional value, and Remove row appears
    When the operator adds a group and chooses All, Any, or Not
    Then one group row exposes its relation, Add condition, Add group, and Remove actions
    And All and Any accept multiple predicate or group children while Not accepts exactly one child
    And predicate rows expose no View, Edit, or Add child actions
    When the operator closes the overlay stack
    Then focus returns to the invoking property action without changing the editor scroll position

    Examples:
      | editor             | property_count |
      | Shared Profile     | 2              |
      | Flow Page-instance | 3              |

  # Data layer canonical Shared Profile schema authoring 034
  Scenario: Data layer canonical Shared Profile schema authoring 034
    Given Sitewide defines /lineOfCustomer description Customer classification
    And Cart and Checkout inherit that description while Retail Cart has local description Retail classification
    When the operator edits Sitewide description to Customer segment in Table and leaves the cell
    Then one Sitewide property-scoped command advances its Draft token
    And Cart and Checkout immediately show inherited description Customer segment with Sitewide provenance
    And Retail Cart retains local description Retail classification while its parent provenance updates
    When inherited Cart description is changed to Cart customer segment and committed with Enter
    Then one sparse local description override is created automatically on Cart
    And Sitewide, Checkout, and Retail Cart remain unchanged
    When Sitewide description later changes to Customer audience
    Then Checkout inherits Customer audience while Cart retains Cart customer segment
    When the operator activates Reset to parent for Cart description
    Then only Cart's local description facet is removed and Cart immediately inherits Customer audience
    When the operator invokes Undo
    Then the same Cart local description override is restored without copying another parent facet

  # Data layer canonical Shared Profile schema authoring 035
  Scenario Outline: Data layer canonical Shared Profile schema authoring 035
    Given Sitewide defines <facet> as <parent_value> and Cart inherits it
    When the operator changes Sitewide <facet> to <new_parent_value> in Table and commits with <parent_commit>
    Then Sitewide shows Saved at the next Draft token and Cart immediately inherits <new_parent_value>
    When inherited Cart receives <child_value> in its <facet> cell and <child_commit> commits it
    Then Cart stores only a sparse local <facet> override and shows local provenance
    And Sitewide plus another inheriting child remain byte-identical
    When the operator leaves Cart and later returns after reload
    Then Cart still shows <child_value> while the other child inherits <new_parent_value>
    And neither edit required opening property actions, Definition, or Review changes

    Examples:
      | facet          | parent_value            | new_parent_value         | parent_commit | child_value            | child_commit |
      | description    | Customer classification | Customer segment         | blur          | Cart customer segment  | Enter        |
      | allowed values | retail                   | retail, wholesale        | Tab           | cart, guest            | blur         |
      | example        | retail                   | wholesale                | blur          | cart                    | Enter        |

  # Data layer canonical Shared Profile schema authoring 036
  Scenario Outline: Data layer canonical Shared Profile schema authoring 036
    Given quick-edit origin is <origin_cell>
    When the cell receives <edit_state> followed by <navigation_key>
    Then the keyboard transaction result is <command_result>
    And active quick-edit destination is <destination_cell>
    And read-only cells and the property context-menu trigger are skipped
    And repository rerendering creates no duplicate blur commit

    Examples:
      | origin_cell                            | edit_state          | navigation_key | command_result                             | destination_cell                         |
      | the first property's Description cell | a changed value      | Tab            | that cell commits one property command     | the same property's Allowed values cell  |
      | the first property's Allowed values cell | its unchanged value | Tab            | no property command is created             | the same property's Example cell         |
      | the first property's Example cell     | a changed value      | Tab            | that cell commits one property command     | the next property's Description cell     |
      | the next property's Description cell  | a changed value      | Shift+Tab       | that cell commits one property command     | the previous property's Example cell     |
      | an Allowed values cell                 | an invalid value     | Tab            | no command is created and a diagnostic renders | the same Allowed values cell          |
