# mutation-stamp: sha256=1d413656f35037a7c16fd28c0215f150a2a074bfa451432215523e165a00dd59
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-26T08:53:01.982887710Z","feature_name":"Data layer canonical Shared Profile schema authoring runtime","feature_path":"features/data-layer-canonical-shared-profile-schema-authoring-runtime.feature","background_hash":"472d7d719a76bf47270eb2580c2854fda6a3037551b5db5845d9adcb51ca716d","implementation_hash":"sha256:16a630b4d01aa732c0ed63d6ece7c6e19070a4c687f6751dda39ca84442c650c","scenarios":[{"index":6,"name":"Data layer canonical Shared Profile schema authoring runtime 007","scenario_hash":"37b063e26d5b3f51440eeccbfa03c8720332deec1fa287805b3dda7a5fe56ec7","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-26T08:53:01.982887710Z"},{"index":7,"name":"Data layer canonical Shared Profile schema authoring runtime 008","scenario_hash":"b48222ab9937d34e181fb714ec94b0fca77718e5301f0f9de21bbddffb54ba97","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-26T08:53:01.982887710Z"},{"index":14,"name":"Data layer canonical Shared Profile schema authoring runtime 015","scenario_hash":"e311bdb223dc8dfd7b504fb0d42e86948438e329ff4af691abccce8ea87c7258","mutation_count":21,"result":{"Total":21,"Killed":21,"Survived":0,"Errors":0},"tested_at":"2026-07-26T08:53:01.982887710Z"},{"index":18,"name":"Data layer canonical Shared Profile schema authoring runtime 019","scenario_hash":"34c9088664aaf7f6d7033d9e9031ce864615716268bdcdffe2c0a013b7aa1fa6","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-07-26T08:53:01.982887710Z"},{"index":20,"name":"Data layer canonical Shared Profile schema authoring runtime 021","scenario_hash":"7402caa88c1bbed1a5f2698ef24bf9ad7de706eb85b17a2866de9c22fbc37d01","mutation_count":22,"result":{"Total":22,"Killed":22,"Survived":0,"Errors":0},"tested_at":"2026-07-26T08:53:01.982887710Z"},{"index":25,"name":"Data layer canonical Shared Profile schema authoring runtime 026","scenario_hash":"1b1b4b365bfff745ac9dfd1329542003c1fbfd640c7e1850b0bd65ac50d6eb94","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-07-26T08:53:01.982887710Z"},{"index":26,"name":"Data layer canonical Shared Profile schema authoring runtime 027","scenario_hash":"0b9f66254abf52641925fc1705e834044f3e1b0d802f2e2c94060d81fdd8fa1a","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-07-26T08:53:01.982887710Z"},{"index":28,"name":"Data layer canonical Shared Profile schema authoring runtime 029","scenario_hash":"197839f2cff06311cbf8e91343a0bc10d6f826626f9beb79afc4a7ceef137b4c","mutation_count":36,"result":{"Total":36,"Killed":36,"Survived":0,"Errors":0},"tested_at":"2026-07-26T08:53:01.982887710Z"},{"index":31,"name":"Data layer canonical Shared Profile schema authoring runtime 032","scenario_hash":"f3124b8823c3b969360c4ad818eb22c818806058f91bfd30727827019df783eb","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-26T08:53:01.982887710Z"},{"index":34,"name":"Data layer canonical Shared Profile schema authoring runtime 035","scenario_hash":"287ff86d4e01d4a480307617bd5383b45e64317f29f84792b518c0c9a754269b","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-07-26T08:53:01.982887710Z"},{"index":35,"name":"Data layer canonical Shared Profile schema authoring runtime 036","scenario_hash":"b4315546ff1799a0ae40fe85d2d6ab4cfd0fad27ff493535048a7ff35c0731b6","mutation_count":25,"result":{"Total":25,"Killed":25,"Survived":0,"Errors":0},"tested_at":"2026-07-26T08:53:01.982887710Z"}]}
# acceptance-mutation-manifest-end

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
    And columns show property, path, type, presence, description, allowed values, example, source, local or effective state, and validation state
    And actual inline controls edit type, presence, description, allowed values, and example across multiple rows
    And one context-menu trigger beside each property identity provides root, child, sibling, rename, move, duplicate, and delete commands without a dedicated actions column
    When actual controls change article_name description and article_type example without leaving Table
    Then both rendered rows retain their edits and remain simultaneously visible
    When the installed Table opens article_name advanced actions
    Then complex condition and rule builders render in a row-anchored overlay without changing the table or its other property rows
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

  # Data layer canonical Shared Profile schema authoring runtime 020
  Scenario: Data layer canonical Shared Profile schema authoring runtime 020
    Given canonical Opened Article Draft article-8 has installed compact-panel and wide-workspace projections
    When actual side-panel selection opens the compact projection
    Then exactly one compact established editor renders its schema header, property filter, property sort, complete property tree, and assisted Add property controls
    And actual selection of metadata/category renders valid type, conditional presence, typed allowed values, rich rules, documentation, examples, copy, move, and remove controls in stacked panel detail
    And the side-panel editor contains no standalone wide table, Builder canonical editor landmark, or nested second schema form
    And at 360 CSS pixels one measured vertical scroll owner contains every selected-property control with no horizontal page overflow
    When actual controls open the same canonical Draft in the installed standalone workspace
    Then all property rows remain mounted in the wide table and expandable row detail contains the same complex operations
    And reopening the side panel retains its compact renderer, selected property, and panel scroll ownership
    When actual side-panel controls change metadata/category documentation
    And actual standalone row-detail controls change metadata/category conditional presence
    Then installed subscription evidence is
      | projection          | rendered facet        | opaque Draft token |
      | standalone table    | changed documentation | article-9          |
      | compact panel detail | changed condition     | article-10         |
    And telemetry attributes each token to its originating property-scoped command
    And repository inspection finds one canonical property identity with no panel-specific or standalone-specific schema payload

  # Data layer canonical Shared Profile schema authoring runtime 021
  Scenario Outline: Data layer canonical Shared Profile schema authoring runtime 021
    Given production Opened Article source JSON defines string property <property_path> without const or enum
    And its separate documentation record stores <display_text>, <description>, and <comments> at <property_path>
    And attached enabled <rule_kind> rule <rule_name> revision <rule_revision> supplies <configured_values> at <property_path> with severity <severity> and <issue_message>
    When actual controls review and confirm adding Opened Article to the project
    Then the production canonical node at <property_path> stores <display_text>, <description>, and <comments>
    And its effective <value_facet> is <configured_values> derived from the attached rule
    And the installed expanded builder identifies enabled origin <rule_name> v<rule_revision>, severity <severity>, and <issue_message>
    When actual controls switch the adopted Shared Profile to Table
    Then the installed <property_path> row renders that documentation and <configured_values> in the Expected or allowed values cell
    And production Tree, side panel, compiler, and validator read the same canonical property identity and effective value
    When the installed extension reloads
    Then rendered mapped facets, rule metadata, and source provenance remain present without a repair command
    And production Saved Schema Library bytes remain unchanged

    Examples:
      | property_path | display_text | description              | comments       | rule_kind      | rule_name                     | rule_revision | configured_values                                                               | severity | issue_message                                | value_facet    |
      | /article_type | Article type | Editorial classification | CMS taxonomy   | exact-value    | Required article type         | 3             | typed string News                                                               | warning  | issue message Use the required article type | Expected value |
      | /error_type   | Error type   | Error classification     | Error handling | allowed-values | Allowed values for error_type | 1             | typed strings technical, validation, authentication, login, and notification | error    | no issue message                             | Allowed values |

  # Data layer canonical Shared Profile schema authoring runtime 022
  Scenario: Data layer canonical Shared Profile schema authoring runtime 022
    Given production Opened Article source JSON defines string properties /page_type and /error_action without required presence
    And attached enabled required rule Required for error_action revision 1 targets /error_action with severity error
    And its All condition requires /page_type to Equal typed string error
    When actual controls review and confirm adding Opened Article to the project
    Then production rule mapping makes /error_action Required when
    When actual controls switch the adopted Shared Profile to Table
    Then the installed /error_action row renders Required when in Presence and page_type Equals error in Conditions
    And its production rule detail retains enabled origin Required for error_action v1, severity error, the required operator, target /error_action, and the All condition tree
    And production compiler and validator outcomes are
      | page_type | error_action | outcome |
      | error     | absent       | invalid |
      | error     | present      | valid   |
      | article   | absent       | valid   |
    When the installed extension reloads
    Then rendered mapped facets, rule metadata, and source provenance remain present without a repair command
    And production Saved Schema Library bytes remain unchanged

  # Data layer canonical Shared Profile schema authoring runtime 023
  Scenario: Data layer canonical Shared Profile schema authoring runtime 023
    Given production /lineOfCustomer is reachable from all six schema contributor editors
    When actual controls open its property actions in every editor
    Then one compact first-layer overlay renders Definition, Rules, and Structure with provenance and context-legal ownership summaries
    And DOM inspection finds no separate Presence, Expected values, Allowed values, Conditions, Documentation, or Example first-layer section
    When actual controls activate Definition
    Then one adjacent child overlay retains the first layer and renders type, a Required or Optional or Forbidden selector, Allowed values, display text, description, comments, and example method
    And Allowed values persists zero, one, or many comma-separated typed values
    And installed Table cells render allowed values as comma-separated human text without square brackets
    And DOM and geometry inspection find no further Definition submenu, below-table controls, or detached scroll destination
    When actual Escape and Cancel dismiss the active child layer
    Then only that layer closes and focus returns to its parent choice
    When actual controls dismiss the first layer
    Then staging is discarded and focus returns to the exact originating property action

  # Data layer canonical Shared Profile schema authoring runtime 024
  Scenario: Data layer canonical Shared Profile schema authoring runtime 024
    Given production /lineOfCustomer has an ordinary definition, inherited pattern rule, and local range and cardinality rules
    When actual controls open the Rules child overlay
    Then stable rule rows render When condition, Then outcome, severity, message, source, ownership, and context-valid actions
    And View is read-only while Edit opens a further overlay with optional When controls and only the selected outcome's fields
    When actual Add rule selects a kind
    Then the staged rule defaults to Always and remains valid without a When condition
    And adding When renders a searchable property, type-valid operator, and conditionally present typed value
    And its Then controls render only fields applicable to the selected outcome
    And reusable-rule selection is a searchable human-named control with no raw ID input
    And DOM inspection finds no separate property-level Conditions editor or condition rule kind
    When actual controls stage removal of the local cardinality rule
    Then impact review names that rule, previews the effective result, and changes its staged state to Removed with Restore
    When actual Review changes opens
    Then it lists every staged addition, edit, removal, override, and reset with effective-result and affected-consumer evidence
    When actual confirmation commits
    Then one durable property command contains the staged delta and production Undo contains one action

  # Data layer canonical Shared Profile schema authoring runtime 025
  Scenario: Data layer canonical Shared Profile schema authoring runtime 025
    Given the production reusable Rule Library contains Postal code pattern and Customer tier range
    And production /lineOfCustomer has neither reusable rule attached
    When actual Add rule controls search reusable rules for Customer
    Then the installed named selector renders Customer tier range and omits Postal code pattern
    And DOM inspection finds no displayed or editable raw reusable-rule identity
    When actual controls clear the query and select Customer tier range
    Then both named results render and the staged rule stores Customer tier range's stable library identity

  # Data layer canonical Shared Profile schema authoring runtime 026
  Scenario Outline: Data layer canonical Shared Profile schema authoring runtime 026
    Given production Add rule applies Always and has no selected outcome
    When the installed rule builder changes outcome to <rule_outcome>
    Then DOM inspection finds <applicable_fields> and excludes <irrelevant_fields>

    Examples:
      | rule_outcome | applicable_fields                                                   | irrelevant_fields                    |
      | presence     | Required or Optional or Forbidden, severity, and issue message      | value, pattern, range, or cardinality |
      | value        | allowed-values field, severity, and issue message                    | presence, pattern, range, or cardinality |
      | pattern      | pattern, severity, and issue message                                 | presence, value, range, or cardinality |
      | range        | minimum, maximum, severity, and issue message                        | presence, value, pattern, or cardinality |
      | cardinality  | minimum items, maximum items, severity, and issue message            | presence, value, pattern, or range    |
      | reusable     | searchable reusable-rule name                                        | raw identity or unrelated fields      |

  # Data layer canonical Shared Profile schema authoring runtime 027
  Scenario Outline: Data layer canonical Shared Profile schema authoring runtime 027
    Given actual Add rule controls selected <rule_outcome>
    When the invalid rule definition is <invalid_definition>
    Then installed Add rule is disabled with <diagnostic>
    And repository, Draft token, project transaction, and Undo inspection show no change

    Examples:
      | rule_outcome | invalid_definition                         | diagnostic                                      |
      | presence     | an enabled When with unresolved predicate  | Resolve or remove the When condition             |
      | value        | an empty allowed-values field              | Enter at least one allowed value                 |
      | pattern      | an empty pattern                           | Enter a regular expression                      |
      | range        | minimum 10 and maximum 2                   | Minimum must not exceed maximum                 |
      | cardinality  | minimum items 4 and maximum items 1        | Minimum items must not exceed maximum items     |

  # Data layer canonical Shared Profile schema authoring runtime 028
  Scenario: Data layer canonical Shared Profile schema authoring runtime 028
    Given production /lineOfCustomer has type string, Required presence, description Customer classification, allowed value retail, example retail, inherited source Sitewide, and a local rule
    When actual controls open Table in all six schema contributor editors
    Then columns show property, path, type, presence, description, allowed values, example, source, local or effective state, and validation state
    And DOM inspection finds one context-menu trigger beside each property identity and no dedicated column of facet or ownership action buttons
    When actual table cells change /lineOfCustomer description, allowed values, and example
    Then those controls stay in the same row without mounting a focused editor or leaving Table
    And each changed cell commits directly on actual Enter, Tab, Shift+Tab, or blur without mounting property review
    And each commit persists one property-scoped command with the displayed base Draft token and adds one production Undo action
    And actual Escape before commit restores the saved effective cell with unchanged repository and Undo state
    When the installed /lineOfCustomer context-menu trigger is activated
    Then one compact first-layer overlay renders Definition, Rules, and Structure with provenance and context-legal ownership summaries
    And bounding-box and DOM inspection show no below-table control panel, expanded property row, replaced table, or hidden sibling row
    When the property-action overlay is closed through both installed dismissal controls
    Then Table remains the primary editor and focus returns to the exact /lineOfCustomer context-menu trigger

  # Data layer canonical Shared Profile schema authoring runtime 029
  Scenario Outline: Data layer canonical Shared Profile schema authoring runtime 029
    Given production <target_property> has <ordinary_definition>
    And one persisted named rule says When <condition> Then <conditional_outcome>
    When production validation receives an observation with <condition_state>
    Then <effective_result>
    And persisted ordinary-definition bytes remain unchanged

    Examples:
      | target_property | ordinary_definition       | condition                                | conditional_outcome                                  | condition_state | effective_result                                      |
      | error_message   | Optional                   | page_type Equals error                   | Required                                             | matching        | error_message is Required                             |
      | error_message   | Optional                   | page_type Equals error                   | Required                                             | not matching    | error_message is Optional                             |
      | form_step_name  | allowed value contact      | form_type Equals checkout                | allowed values contact, delivery, payment            | matching        | form_step_name allows contact, delivery, and payment  |
      | form_step_name  | allowed value contact      | form_type Equals checkout                | allowed values contact, delivery, payment            | not matching    | form_step_name allows contact                         |
      | aProducts       | minimum items 1            | page_name Contains multi product bundle  | minimum items 2                                     | matching        | aProducts requires at least 2 items                   |
      | aProducts       | minimum items 1            | page_name Contains multi product bundle  | minimum items 2                                     | not matching    | aProducts requires at least 1 item                    |

  # Data layer canonical Shared Profile schema authoring runtime 030
  Scenario: Data layer canonical Shared Profile schema authoring runtime 030
    Given two persisted named rules on /form_step_name match one production observation
    When the production compiler evaluates their conditional outcomes
    Then compatible outcomes compose and supersede only their targeted ordinary-definition facets
    And contradictory outcomes return Blocked with both rule names and no list-order winner
    And a later observation that matches neither rule resumes the persisted ordinary definition

  # Data layer canonical Shared Profile schema authoring runtime 031
  Scenario: Data layer canonical Shared Profile schema authoring runtime 031
    Given production /aProducts has no conditional rules
    When actual controls add cardinality minimum items 2 without adding When
    Then the installed summary renders Always Then minimum items 2
    And production validation applies the rule to every observation
    When actual controls add When pageType Exists
    Then rendered summary text is pageType exists without /aProducts, a stable identity, or a schema path prefix
    And removing When restores Always without changing the persisted cardinality outcome

  # Data layer canonical Shared Profile schema authoring runtime 032
  Scenario Outline: Data layer canonical Shared Profile schema authoring runtime 032
    Given production /lineOfCustomer has typed allowed values retail and wholesale
    When installed Definition changes Example method to <example_method>
    Then the example-value region contains <value_control>
    And the repository result is <stored_result>

    Examples:
      | example_method | value_control                                      | stored_result                              |
      | Blank          | no mounted example-value control                   | repository stores no example value         |
      | Allowed value  | one select containing retail and wholesale         | repository stores the selected typed value |
      | Custom value   | one type-valid custom input                         | repository stores the entered typed value  |

  # Data layer canonical Shared Profile schema authoring runtime 033
  Scenario: Data layer canonical Shared Profile schema authoring runtime 033
    Given the installed bottom visible Table row opens a rule editor near the viewport edge
    When the active overlay layer opens or its content grows
    Then measured page scroll changes by the minimum amount that makes the complete active layer visible
    And property search, condition property, operator, value, and action bounding boxes stay within the overlay and 360-pixel viewport
    When Add condition is activated in the installed empty When builder
    Then one directly editable property, operator, conditionally mounted value, and Remove row renders
    When actual controls add a group and select All, Any, or Not
    Then one group row renders relation, Add condition, Add group, and Remove controls
    And All and Any accept multiple predicate or group children while Not accepts exactly one child
    And DOM inspection finds no predicate View, Edit, or Add child control

  # Data layer canonical Shared Profile schema authoring runtime 034
  Scenario: Data layer canonical Shared Profile schema authoring runtime 034
    Given production Sitewide defines /lineOfCustomer description Customer classification
    And production Cart and Checkout inherit it while Retail Cart stores local description Retail classification
    When actual Sitewide Table controls change description to Customer segment and dispatch blur
    Then repository inspection finds one Sitewide property command and the next Draft token
    And installed Cart and Checkout rows render inherited Customer segment with Sitewide provenance
    And installed Retail Cart retains local Retail classification with updated parent provenance
    When installed Table changes inherited Cart description to Cart customer segment and dispatches Enter
    Then repository bytes contain one sparse Cart local description override
    And Sitewide, Checkout, and Retail Cart hashes remain unchanged
    When a later production Sitewide command changes description to Customer audience
    Then installed Checkout renders Customer audience while Cart renders Cart customer segment
    When actual Cart controls invoke Reset to parent for description
    Then repository bytes remove only Cart's local description facet and installed Cart renders Customer audience
    When production Undo runs once
    Then the same Cart local description override and provenance return without any copied parent facet

  # Data layer canonical Shared Profile schema authoring runtime 035
  Scenario Outline: Data layer canonical Shared Profile schema authoring runtime 035
    Given production Sitewide defines <facet> as <parent_value> and Cart inherits it
    When <parent_commit> commits <new_parent_value> through the installed Sitewide <facet> cell
    Then installed Sitewide shows Saved at the next Draft token and Cart immediately renders inherited <new_parent_value>
    When <child_commit> commits <child_value> through Cart's inherited <facet> cell
    Then Cart's persisted contributor record has local provenance for only <facet>
    And hashes for Sitewide and another inheriting child remain unchanged
    When actual navigation leaves Cart and returns after an installed reload
    Then Cart renders <child_value> while the other child renders inherited <new_parent_value>
    And DOM inspection and command evidence find no opened property actions, Definition, or Review changes

    Examples:
      | facet          | parent_value            | new_parent_value         | parent_commit | child_value            | child_commit |
      | description    | Customer classification | Customer segment         | blur          | Cart customer segment  | Enter        |
      | allowed values | retail                   | retail, wholesale        | Tab           | cart, guest            | blur         |
      | example        | retail                   | wholesale                | blur          | cart                    | Enter        |

  # Data layer canonical Shared Profile schema authoring runtime 036
  Scenario Outline: Data layer canonical Shared Profile schema authoring runtime 036
    Given installed Table activeElement is <origin_cell>
    When actual controls enter <edit_state> and dispatch <navigation_key>
    Then installed keyboard transaction evidence is <command_result>
    And activeElement is <destination_cell>
    And traversal skipped every read-only cell and property context-menu trigger
    And command evidence finds no duplicate blur commit after each repository rerender

    Examples:
      | origin_cell                            | edit_state          | navigation_key | command_result                                      | destination_cell                         |
      | the first property's Description cell | a changed value      | Tab            | command and Undo counts each increase once          | the same property's Allowed values cell  |
      | the first property's Allowed values cell | its unchanged value | Tab            | command and Undo counts remain unchanged            | the same property's Example cell         |
      | the first property's Example cell     | a changed value      | Tab            | command and Undo counts each increase once          | the next property's Description cell     |
      | the next property's Description cell  | a changed value      | Shift+Tab       | command and Undo counts each increase once          | the previous property's Example cell     |
      | an Allowed values cell                 | an invalid value     | Tab            | counts remain unchanged and an exact diagnostic renders | the same Allowed values cell          |
