Feature: Data layer layered schema constraints

  Background:
    Given Shop project contains Shared Profiles Sitewide and Opened Article
    And it contains Page Group Checkout, Pages Shipping and Article, and Events Purchase and Article Opened
    And Shipping and Article are context-setting pageview events while Purchase and Article Opened are interaction Events
    And the Flow instances are
      | Flow             | Page instance       | Page     | Event occurrence |
      | Checkout journey | Alternative shipping | Shipping | Purchase         |
      | Content journey  | Summer article       | Article  | Article Opened    |

  # Data layer layered schema constraints 001
  Scenario Outline: Data layer layered schema constraints 001
    Given the operator opens the schema contribution for <contributor>
    Then the same canonical composed-property table and expandable row editors are available
    And root, child, sibling, rename, move, duplicate, and delete actions are available
    And type, presence, condition, allowed-value, rule, documentation, example, and impact-review controls are available
    And inherited, local, effective, superseded, and conflicting definitions are distinguished
    And saving issues property-scoped commands against the contributor base revision
    And only the displayed contributor name, scope, applicability, and provenance differ

    Examples:
      | contributor                         |
      | Shared Profile Sitewide             |
      | Page Group Checkout                 |
      | Page Shipping                       |
      | Event Purchase                      |
      | Flow Page instance Alternative shipping |
      | Event occurrence Alternative shipping Purchase |

  # Data layer layered schema constraints 002
  Scenario: Data layer layered schema constraints 002
    Given the inherited Page-branch definitions are
      | contributor | property    | definition                              |
      | Sitewide    | funnel_name | optional string                         |
      | Sitewide    | funnel_step | optional string                         |
      | Checkout    | funnel_name | required with allowed value checkout    |
      | Checkout    | funnel_step | required                                |
      | Shipping    | funnel_step | required with allowed value 3a          |
    When Alternative shipping changes its local funnel_step allowed value to 3b
    Then the Alternative shipping Page effective result is
      | property    | effective definition                  |
      | funnel_name | required with allowed value checkout   |
      | funnel_step | required with allowed value 3b         |
    And every other applicable Sitewide property remains inherited
    And property provenance shows Sitewide, Checkout, Shipping, and Alternative shipping in composition order
    And the Shipping Page definition remains 3a outside Alternative shipping

  # Data layer layered schema constraints 003
  Scenario: Data layer layered schema constraints 003
    Given Opened Article defines required string properties event and article_name
    And Opened Article restricts event to article_opened
    And Event Article Opened inherits Shared Profile Opened Article
    And Event Article Opened documents article_name as the opened article title
    When the occurrence-specific title expectation is set to Summer sale
    Then its effective Event result is
      | property     | effective definition                          |
      | event        | required string restricted to article_opened  |
      | article_name | required string restricted to Summer sale     |
    And provenance distinguishes Opened Article, Article Opened, and the Summer article occurrence
    And reusable Article Opened has no Page Group membership and compiles its Shared Profile and Event branches before placement
    And its occurrence exists only inside Summer article Page context

  # Data layer layered schema constraints 004
  Scenario: Data layer layered schema constraints 004
    Given Summer article Article Opened receives inherited branch values
      | branch | property  | value          |
      | Page   | page_type | article        |
      | Event  | event     | article_opened |
    When the effective schema is compiled for Summer article Article Opened
    Then one property tree contains the applicable Shared Profile, Page Group, Page, Flow Page-instance, Event, and Event-occurrence contributions
    And each effective property and rule names its contributing branch and human contributor
    When the Page branch requires consent_state value granted and the Event branch requires consent_state value denied
    Then compilation blocks consent_state as a parallel-branch conflict
    And neither branch silently wins by contributor type or evaluation order
    When the operator resolves the conflict at the Article Opened occurrence with allowed value granted
    Then the effective schema is ready and records the explicit resolution against both conflicting definitions

  # Data layer layered schema constraints 005
  Scenario Outline: Data layer layered schema constraints 005
    Given an inherited property has <base contribution>
    When a more-specific contributor saves <specific contribution>
    Then effective compilation is <outcome>
    And the property result explains <explanation>

    Examples:
      | base contribution                | specific contribution       | outcome | explanation                                      |
      | type string                      | type number                 | blocked | type cannot change                               |
      | allowed values 3a and 3b         | allowed value 3b            | ready   | allowed values narrow to 3b                      |
      | allowed values 3a and 3b         | allowed value 4             | blocked | 4 is outside the inherited allowed universe      |
      | required                         | optional                    | blocked | required cannot be silently relaxed              |
      | forbidden                        | permitted                   | blocked | a forbidden property cannot be re-enabled        |
      | string matching the base pattern | a second compatible pattern | ready   | both patterns apply                              |
      | one conditional rule             | another conditional rule    | ready   | both conditions apply without a named replacement |
      | one named overridable expectation | a replacement for that name | ready   | the named expectation is explicitly superseded   |

  # Data layer layered schema constraints 006
  Scenario: Data layer layered schema constraints 006
    Given the contextual contribution scopes are
      | contributor                  | included contexts                                      |
      | Sitewide                     | every selected specification context                   |
      | Checkout                     | every member Page and its Page instances                |
      | Shipping                     | every instance of Page Shipping                         |
      | Event Purchase               | every Purchase occurrence independent of Page Group    |
      | Alternative shipping         | every Event occurrence contained by that Page instance |
      | Alternative shipping Purchase | that Event occurrence only                             |
    When effective schemas are compiled for Shipping Page event, Alternative shipping Page event, Alternative shipping Purchase occurrence, and reusable Purchase Event
    Then each schema contains exactly the contributions whose contextual scopes include it
    And every inclusion and exclusion names the contributor and contextual scope
    And changing an occurrence's containing Page preserves both Pages' memberships while recompiling against the selected Page branch
    And stable contributor, property, and occurrence references are persisted instead of names or generated paths

  # Data layer layered schema constraints 007
  Scenario: Data layer layered schema constraints 007
    Given Alternative shipping Purchase uses matcher-driven activation
    And its applicability is All of pathname matching /checkout/shipping, page_name equalling shipping, checkout_variant equalling alternative, and Event equalling Purchase
    When the operator tests one complete match and three observations each differing in one matched property
    Then the complete observation has Alternative shipping Purchase as its sole matching target
    And each rejected observation identifies its failed human-name predicate
    And automatic evaluation uses applicability evidence rather than inferred Flow sequence
    And Page context is resolved by assignment predicates without a Flow context-binding prerequisite
    When an equal-priority candidate also matches the complete observation
    Then automatic selection is blocked as ambiguous and names both candidates
    When the operator gives one candidate explicit higher priority and retests
    Then that candidate wins and the other remains visible as a rejected match

  # Data layer layered schema constraints 008
  Scenario: Data layer layered schema constraints 008
    Given Alternative shipping Purchase is available only through explicit operator selection
    When the operator validates a Purchase observation and selects Alternative shipping Purchase by Flow, Page, and Event names
    Then validation uses that compiled effective schema without evaluating automatic applicability
    And the result records manual selection, stable compiled target identity, effective schema revision, issues, and provenance
    And no automatic assignment winner is claimed

  # Data layer layered schema constraints 009
  Scenario: Data layer layered schema constraints 009
    Given Alternative shipping Purchase is marked as Documentation only
    When its effective schema and developer export are generated
    Then the schema compiles with complete property and provenance detail but is excluded from automatic and manual validation choices
    And the export states Alternative shipping, Shipping Page, Purchase Event, funnel_step value 3b, inherited funnel_name value checkout, and Documentation only
    And the export distinguishes inherited definitions, local differences, conditions, and activation
    And Documentation only creates no runtime assignment or automatic ambiguity

  # Data layer layered schema constraints 010
  Scenario: Data layer layered schema constraints 010
    Given the operator selects a Page Group, Page frame, or Event occurrence on the Flow canvas
    When the contextual Inspector opens its Schema summary
    Then it shows inherited, local, effective, conflict, and activation counts without replacing the canvas
    And one action opens the complete canonical schema editor in the main workspace at that contributor
    And the main editor provides the same authoring controls used for Shared Profiles
    And returning to the Flow restores the selected canvas item and viewport
    And consequential saves state affected scopes, stale compiled targets, Draft status, and one Undo action

  # Data layer layered schema constraints 011
  Scenario: Data layer layered schema constraints 011
    Given matcher evidence chose compiled target Alternative shipping Purchase
    And the selected rule fixes /funnel_step to string 3b
    When otherwise valid Purchase observations contain funnel_step 3b and 3a
    Then the 3b observation has no funnel_step issue
    And the 3a observation reports path /funnel_step, code EXPECTED_VALUE, severity error, expected 3b, actual 3a, and Alternative shipping provenance
    And each result identifies the selected target and effective schema revision
    And per-Event validation makes no claim that an expected Flow sequence or occurrence was completed

  # Data layer layered schema constraints 012
  Scenario: Data layer layered schema constraints 012
    Given the terminal selected context has canonical definitions
      | contributor    | property          | local definition             |
      | Sitewide       | page_type         | string                       |
      | Sitewide       | consent_state     | string                       |
      | Opened Article | event             | string                       |
      | Opened Article | article_name      | string                       |
      | Opened Article | metadata.category | nested string                |
      | Article        | page_type         | allowed value article        |
      | Summer article | consent_state     | allowed value granted        |
      | Article Opened | event             | allowed value article_opened |
    When its occurrence contributes article_name allowed value Summer sale and metadata.category allowed value News
    Then the selected-context developer export contains the complete effective Summer article Article Opened schema
    And inherited and local property values, conditions, documentation, examples, and provenance are distinguishable
    When matching valid and invalid Article Opened observations are validated
    Then the valid observation passes per-Event schema validation
    And the invalid observation reports every violated effective property rule with exact provenance
    And no result claims full Flow validation

  # Data layer layered schema constraints 013
  Scenario: Data layer layered schema constraints 013
    Given Page Cart belongs to Page Group Checkout
    When the operator opens Cart Page configuration
    Then a visible Add to Page Group action and the Cart context menu provide the same searchable command
    When the operator searches that command for Retail Checkout and Trade Checkout
    Then each result shows its human name, purpose, applicability summary, and prospective rule impact
    When the operator adds both groups
    Then Cart shows an ordered Page Group rule stack
      | position | Page Group     |
      | 1        | Checkout       |
      | 2        | Retail Checkout |
      | 3        | Trade Checkout |
    And guidance says rules apply from top to bottom and later groups may only make legal refinements
    And Cart stores those ordered stable references as the sole editable membership source
    And each Page Group derives its Cart membership without storing a competing editable order
    And each stack row offers Open Page Group, Move earlier, Move later, and Remove at 360px without horizontal page scrolling
    When keyboard controls move Trade Checkout before Retail Checkout
    Then only Cart membership order changes and focus returns to Trade Checkout in position 2
    And the impact preview identifies affected properties, Page instances, compiled targets, and stale exports before commit

  # Data layer layered schema constraints 014
  Scenario Outline: Data layer layered schema constraints 014
    Given Cart composition order is Checkout followed by <specific order>
    And Checkout requires funnel_name checkout and allows funnel_step 3a or 3b
    And Retail Checkout and Trade Checkout reference independently evaluable Applicability Sets
    And they define ordinary funnel_step values 3a and 3b respectively
    When both independently applicable Page Groups participate
    Then <winner> supplies effective funnel_step <effective value> as the later ordinary contribution
    And provenance identifies <superseded> as superseded
    And no Applicability Set priority or winner changes the stored Page Group order
    When Retail Checkout and Trade Checkout both match one observation
    Then both Page Groups participate without applicability ambiguity
    And only an invariant or structurally incompatible definition blocks ordered composition

    Examples:
      | specific order                      | winner          | effective value | superseded      |
      | Retail Checkout then Trade Checkout | Trade Checkout  | 3b              | Retail Checkout |
      | Trade Checkout then Retail Checkout | Retail Checkout | 3a              | Trade Checkout  |

  # Data layer layered schema constraints 015
  Scenario: Data layer layered schema constraints 015
    Given a legacy project lists Checkout then Retail Checkout on Cart and also lists Cart from Trade Checkout
    When the operator opens Cart after the ordered-membership upgrade
    Then migration review proposes Checkout, Retail Checkout, and Trade Checkout without losing a membership
    And Page-owned order is preserved before group-only memberships while missing groups block confirmation
    When the operator confirms the proposed order
    Then one atomic revision stores only Cart's ordered stable Page Group references
    And Checkout, Retail Checkout, and Trade Checkout member views derive Cart from that revision
    And one Undo restores the complete pre-migration membership state

  # Data layer layered schema constraints 016
  Scenario: Data layer layered schema constraints 016
    Given Sitewide contributes page_name, funnel_name, funnel_step, and page_type
    And Checkout refines funnel_name and funnel_step
    And Cart belongs to Checkout and contributes a local funnel_step override
    When the operator opens Checkout from the Page Groups overview
    Then Checkout opens as a full main-workspace configuration page without requiring the Inspector
    And its Effective schema at Checkout table composes Sitewide and Checkout with effective values and a compact Inheritance status in every row
    When the operator opens Cart from the Pages overview
    Then Cart opens as a full main-workspace configuration page with applicability, ordered memberships, and Effective schema at Cart
    And all four effective properties remain visible while their complete Shared Profile, Checkout, and Cart contribution stacks remain available in focused property details
    And inherited rows open directly editable ordinary Definition fields while item-specific Override here remains available only for structural ownership
    And the locally adjusted funnel_step row offers Reset to parents
    And the Inspector remains an optional summary and link to this same workspace rather than a different editor

  # Data layer layered schema constraints 017
  Scenario: Data layer layered schema constraints 017
    Given the ordinary parent universe for funnel_step contains 2, 3a, and 3b
    And the Page-level expectation on Cart is 2
    When the operator adds Retail Checkout which ordinarily expects funnel_step 3a
    Then the membership addition commits as Draft and Cart effective funnel_step remains 2
    And the funnel_step row reports Parent difference resolved by Cart override without blocking compilation
    And provenance shows Checkout and Retail Checkout as shadowed parents and Cart as the effective source
    And only the expected-value facet is resolved locally while every other facet continues to inherit
    When the operator activates Reset to parents on funnel_step
    Then impact preview shows the effective parent value, affected Page instances, stale outputs, and one Undo action
    When the operator confirms reset
    Then the Cart expected-value contribution is removed rather than replaced with a copied parent value
    And the row immediately recompiles from Checkout and Retail Checkout
    And a Cart-only property offers Remove local property instead of Reset to parents

  # Data layer layered schema constraints 018
  Scenario: Data layer layered schema constraints 018
    Given the Cart contribution covers funnel_step expected value but no other facet
    And Checkout declares funnel_name as an invariant string
    When the operator adds Partner Checkout with a number funnel_name and an incompatible funnel_step type
    Then the Page Group membership command still commits as Draft with a visible conflict summary
    And the local expectation survives solely within its declared facet
    And the uncovered funnel_step type and Checkout funnel_name invariant block the effective schema
    And each blocked row distinguishes winning local facets, unresolved parent facets, and invariant provenance
    And direct repairs offer adjust Cart override where permitted, edit Partner Checkout, or remove the membership
    And validation and developer export cannot report the blocked Page schema as ready or expose duplicate no-op controls

  # Data layer layered schema constraints 019
  Scenario: Data layer layered schema constraints 019
    Given Cart compilation includes a parent-only property, a local-only property, an inherited property with a local override, and one unresolved conflict
    And one property is inherited through Data layer v3 - All Events - All Properties → Datalayer v3 - Ecommerce Sales Pages · direct selection
    When the operator opens Cart at desktop width, 360 CSS pixels, or 200 percent browser zoom
    Then every effective property remains present in one contained table
    And the compact-width presentation retains one vertical scroll owner
    And the Effective schema at Cart table, its rows, and its cells remain inside the main-workspace content bounds without horizontal document or workspace scrolling
    And one Inheritance column replaces the separate Source and State columns
    And parent-only, local-only, and inherited-with-local rows show Inherited, Local, and Mixed / overridden respectively
    And validation issues remain identified independently from Inheritance status
    And the long contributor route is absent from the compact row but remains available in focused provenance details
    When the operator expands the funnel_step row
    Then its type, presence, expected or allowed values, conditions, rules, documentation, example, provenance, Override here, and Reset to parents controls appear as a stacked row detail
    And closing the row restores focus to funnel_step without hiding the other property rows

  # Data layer layered schema constraints 020
  Scenario Outline: Data layer layered schema constraints 020
    Given <target> has canonical schema contributions from <effective contributors>
    And no assignment is required to create, edit, inherit, compile, or document that target
    When the operator creates Retail Purchase assignment for Purchase observations and selects <target>
    Then the assignment identifies that stable contributor target and its kind
    And it stores no standalone Schema, schemaDraftId, or copied schema payload
    And automatic validation compiles the live effective schema from <effective contributors>
    And every other unassigned contributor remains available without a missing-assignment warning

    Examples:
      | target                                  | effective contributors                    |
      | Shared Profile Sitewide                 | Sitewide                                  |
      | Page Group Checkout                     | Sitewide and Checkout                     |
      | Page Cart                               | Sitewide, Checkout, and Cart              |
      | Event Purchase                          | Sitewide and Purchase                     |
      | Flow Page instance Alternative shipping | Sitewide, Shipping, Cart, and Alternative shipping |

  # Data layer layered schema constraints 021
  Scenario: Data layer layered schema constraints 021
    Given Checkout journey has the Checkout / Payment Page instance selected with its derived JSON open in contextual Details
    And its effective stack provides /oForm/formStepName payment and /oForm/formType checkout from parent contributors
    When the operator invokes Open schema contribution from the selected Page toolbar
    Then the same composed-schema workspace used by Property Sets and Pages is the primary authoring surface
    And compact rows show both effective definitions, Inherited status, and item-specific structural ownership actions
    And their exact parent sources and validation details remain available in the focused property editor
    And no advanced facet builder is expanded until its property row is selected
    And an empty local Tree or Table is not presented as the inherited schema
    And Add local property remains available without copying either inherited property
    And the workspace contains no Effective documentation, Compiled effective schema and documentation, Target Event, Activation, Priority, Applicability, Test observation, Manual Flow / Page / Event, Validation payload, or developer-export panel
    When the operator selects /oForm/formStepName and opens Definition
    Then the inherited ordinary fields are editable in that one open facet editor while /oForm/formType remains compact
    When the operator changes the inherited ordinary value to payment-review and confirms Review changes
    Then one property-scoped command stores only that sparse facet on the selected Page frame
    And contextual Details uses payment-review while the reusable Payment Page, another Payment frame, and unrelated contributors remain byte-identical
    When the operator invokes Reset to parents
    Then the sparse local facet is deleted and the effective and derived values return to payment without copying a parent definition
    When the operator returns to Flow
    Then Checkout journey restores the selected Page frame, viewport, open contextual Details, and focus on the originating Page toolbar button
    When Open schema contribution is invoked from contextual Page Details
    Then it resolves the same contributor identity and composed-schema workspace

  # Data layer layered schema constraints 022
  Scenario: Data layer layered schema constraints 022
    Given /lineOfCustomer has one inherited facet, one local facet, one local override, one inherited invariant rule, and one local rule
    When the operator opens each facet or rule's actions
    Then ordinary inherited Definition fields are directly editable with no preliminary Override here action
    And identity-bearing inherited items offer View, a legal item-specific ownership action, and Open source but no Remove action
    And local content offers View, Edit, and Remove local
    And a local override offers View, Edit, and Reset to parent
    And a conflict offers View conflict, Edit local resolution, and Open contributing sources
    When the operator views an inherited rule
    Then read-only detail shows its stable identity, complete definition, effective state, and source without copying it locally
    And an inherited invariant cannot be weakened or removed
    And a legally replaceable inherited rule offers Replace here with named replacement provenance
    When the operator stages removal of the local facet and local rule
    Then each item remains visible as Removed with Restore and the effective preview falls back independently to its parent or unset result
    When the operator restores the rule but confirms the property review
    Then one sparse property command removes only the local facet
    And parent, sibling, unrelated-facet, and restored-rule bytes remain unchanged
    And one Undo restores the removed local facet with its stable identity

  # Data layer layered schema constraints 023
  Scenario Outline: Data layer layered schema constraints 023
    Given the same inherited <rule_state> rule appears in canonical and composed contributor editors
    When its rule-specific action inventory is compared across those editors
    Then the available actions are exactly <available_actions>
    And the unavailable actions include <unavailable_actions>

    Examples:
      | rule_state  | available_actions                    | unavailable_actions                      |
      | ordinary    | View, Override here, and Open source | Replace, Edit, and Remove                 |
      | invariant   | View and Open source                 | Override, Replace, Edit, and Remove       |
      | replaceable | View, Replace here, and Open source | Override, Edit, and Remove                |

  # Data layer layered schema constraints 024
  Scenario: Data layer layered schema constraints 024
    Given composed authoring displays Parent checkout pattern as replaceable
    When the operator invokes Replace here in a composed contributor editor
    Then one staged local rule receives a new stable identity and names the replaced parent rule
    And the inherited rule remains byte-identical until the reviewed property command is confirmed

  # Data layer layered schema constraints 025
  Scenario: Data layer layered schema constraints 025
    Given Checkout is a Page Group with no local schema contribution
    And Checkout inherits every property from Shared Profile Sitewide
    When the operator opens Effective schema at Checkout
    Then every Sitewide property has the same effective facets at Checkout
    And the effective schema is Ready for validation and developer export
    And no property is marked as needing a decision

  # Data layer layered schema constraints 026
  Scenario Outline: Data layer layered schema constraints 026
    Given Checkout inherits ordinary <facet> <parent_value> for customer_status from Sitewide
    When Checkout stores only local <facet> <local_value>
    Then customer_status is a valid sparse Checkout override rather than a conflict
    And its row distinguishes Sitewide <parent_value> from effective Checkout <local_value>
    And the effective schema is Ready for validation and developer export

    Examples:
      | facet                 | parent_value          | local_value             |
      | Concept               | Customer              | Account                 |
      | Type                  | String                | Number                  |
      | Presence              | Optional              | Required                |
      | Allowed values        | active and pending    | closed and archived     |
      | Expected value        | active                | pending                 |
      | Description           | Parent description    | Checkout description    |
      | Example               | parent-example        | checkout-example        |
      | named validation rule | Parent account format | Checkout account format |
      | array item definition | String items          | Number items            |

  # Data layer layered schema constraints 027
  Scenario Outline: Data layer layered schema constraints 027
    Given two properties need decisions
    And customer_status has an unresolved <facet> issue between Checkout <local_value> and Sitewide <source_value>
    When the operator opens Effective schema at Checkout
    Then the summary says two properties need decisions before validation and developer export
    And Show properties needing decisions filters the existing table without opening another workspace
    And the customer_status row shows Needs decision and <facet> without displaying internal identities
    When the operator opens the property's regular advanced menu
    Then the <section> entry says that <facet> needs a decision
    When the operator activates that entry
    Then the editor opens <section> at the affected control or rule
    And the issue says Checkout uses <local_value>, Sitewide uses <source_value>, and <reason>
    And Concept is neither marked nor focused for this issue

    Examples:
      | facet                       | section    | local_value      | source_value       | reason                                  |
      | Type                        | Definition | Number           | String             | Sitewide protects this definition       |
      | Presence                    | Definition | Forbidden        | Required           | Sitewide protects this definition       |
      | Expected value              | Definition | closed           | active             | Sitewide keeps active fixed              |
      | Pattern rule                | Rules      | digits only      | letters only       | the rules cannot both match              |
      | Range rule                  | Rules      | 10 or more       | 5 or less          | the ranges do not overlap                |
      | Cardinality rule            | Rules      | at least 5 items | at most 2 items    | the item counts do not overlap           |
      | Conditional rule dependency | Rules      | exclude country  | requires country   | the rule needs the excluded property     |
      | Array item definition       | Structure  | Number items     | String items       | existing values do not fit Number items  |

  # Data layer layered schema constraints 028
  Scenario Outline: Data layer layered schema constraints 028
    Given customer_status's <facet> decision is caused by <issue_kind>
    When its targeted issue panel is displayed in <section>
    Then the issue panel offers <resolution_action>
    And it offers the legal named source actions without changing a contributor
    And no unavailable, duplicate, or ineffective resolution action is shown
    When the operator chooses <resolution_action>
    Then review shows that only <changed_content> will change
    And the prospective effective result is <prospective_result>
    When the operator confirms the reviewed repair
    Then the conflict is removed and the effective schema recompiles immediately
    And one property-scoped Saved Draft command creates one Undo action
    And Sitewide, siblings, unrelated Checkout facets, and Published state remain unchanged

    Examples:
      | issue_kind               | facet          | section    | resolution_action                    | changed_content                 | prospective_result       |
      | protected parent         | Type           | Definition | Use Sitewide Type                    | Checkout Type contribution      | Sitewide String           |
      | invariant parent         | Range rule     | Rules      | Remove Checkout Range rule           | Checkout Range rule             | Sitewide Range rule       |
      | ordinary parallel-parent | Allowed values | Definition | Use Checkout Allowed values here     | contextual Allowed values facet | Checkout allowed values   |
      | ordinary inherited-rule  | Pattern rule   | Rules      | Override Sitewide Pattern rule here  | contextual Pattern rule         | Checkout Pattern rule     |

  # Data layer layered schema constraints 029
  Scenario: Data layer layered schema constraints 029
    Given customer_status needs an Allowed values decision between two same-precedence Shared Profile recipes
    And customer_status needs one Range rule decision
    And order_total needs a decision for Type
    When the operator opens Effective schema at Checkout
    Then the summary says two properties need decisions before validation and developer export
    And customer_status says Needs decision with two affected facets
    And its regular advanced menu marks only Definition and Rules
    When the operator resolves the Allowed values decision
    Then the Range rule decision remains on customer_status without losing the table filter or position
    And no unrelated facet, rule, contributor, or property changes
    When the operator resolves the remaining decisions
    Then the Needs decision summary and filter action disappear
    And validation and developer export become available without a separate conflict-resolution screen

  # Data layer layered schema constraints 030
  Scenario Outline: Data layer layered schema constraints 030
    Given Sitewide defines customer_status with Concept Customer
    And an imported Checkout contribution for the same path has <local_concept>
    When Checkout's effective schema is compiled
    Then <effective_concept>
    And customer_status does not need a decision
    And validation and developer export remain available
    And import-created ownership or property identity differences do not become schema conflicts

    Examples:
      | local_concept          | effective_concept                            |
      | no local Concept facet | Sitewide Concept Customer remains effective |
      | local Concept Account  | Checkout Concept Account becomes effective  |

  # Data layer layered schema constraints 031
  Scenario Outline: Data layer layered schema constraints 031
    Given Sitewide supplies customer_status <facet> <original_parent_value>
    And Checkout owns sparse customer_status <facet> <local_value>
    And a sibling Page has no local customer_status <facet>
    When Sitewide changes customer_status <facet> to <updated_parent_value>
    Then Checkout keeps effective <facet> <local_value> without needing a decision
    And Checkout identifies the updated Sitewide value as a non-blocking parent difference
    And the sibling Page automatically receives <updated_parent_value>
    When the operator resets only Checkout customer_status <facet> to parent
    Then the sparse Checkout facet is deleted and <updated_parent_value> becomes effective
    And every other local facet, contributor, property, and Published revision remains unchanged

    Examples:
      | facet          | original_parent_value | updated_parent_value       | local_value         |
      | Allowed values | active and pending    | active, pending, and paused | closed and archived |
      | Presence       | Optional              | Required                   | Forbidden           |
      | Description    | Parent description    | Revised parent description | Checkout description |
