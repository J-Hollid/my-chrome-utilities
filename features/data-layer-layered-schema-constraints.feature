Feature: Data layer layered schema constraints

  Background:
    Given Shop project contains Shared Profiles Sitewide and Opened Article
    And it contains Page Group Checkout, Pages Shipping and Article, and Events Purchase and Article Opened
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
    And Article Opened has no Page Group membership
    And an Article Opened occurrence without Page containment compiles from the Shared Profile, Event, and occurrence branches only

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
    When effective schemas are compiled for Shipping, Alternative shipping, Alternative shipping Purchase, and Purchase outside a Page
    Then each schema contains exactly the contributions whose contextual scopes include it
    And every inclusion and exclusion names the contributor and contextual scope
    And moving an Event occurrence cannot change Page or Page Group membership
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
  Scenario: Data layer layered schema constraints 014
    Given Cart composition order is Checkout followed by Retail Checkout followed by Trade Checkout
    And Checkout requires funnel_name checkout and allows funnel_step 3a or 3b
    And conditional Page Group definitions are
      | Page Group      | applicability                     | funnel_step refinement |
      | Retail Checkout | customer_type Equals retail       | allowed value 3a       |
      | Trade Checkout  | customer_type Equals trade        | allowed value 3b       |
    When effective Cart schemas compile for one retail observation and one trade observation
    Then their Page Group provenance is
      | observation | included stack              | funnel_step |
      | retail      | Checkout, Retail Checkout   | 3a          |
      | trade       | Checkout, Trade Checkout    | 3b          |
    And inactive memberships are named as excluded without changing the relative order of active groups
    When Retail Checkout attempts type number for funnel_step
    Then compilation is blocked at funnel_step despite Retail Checkout's later position
    And the issue names Checkout, Retail Checkout, their order, the unsafe type change, and direct repair actions
    When its allowed-value editor instead adds 4
    Then compilation is blocked at funnel_step with the unsafe allowed-value expansion
    When Retail Checkout and Trade Checkout both match one observation
    Then applicability is blocked as ambiguous rather than allowing membership order to choose a winner

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
    And its Effective schema at Checkout table composes Sitewide and Checkout with inherited, local, effective, and provenance values in every row
    When the operator opens Cart from the Pages overview
    Then Cart opens as a full main-workspace configuration page with applicability, ordered memberships, and Effective schema at Cart
    And all four effective properties remain visible with their Shared Profile, Checkout, and Cart contribution stack
    And inherited rows offer Override here while the locally adjusted funnel_step row offers Reset to parents
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
    Given Cart compilation includes parent inheritance, Page edits, and one unresolved conflict
    When the operator opens Cart at a viewport width of 360 pixels
    Then one vertical scroll owner presents every effective property as a compact table row
    And each row exposes property, effective definition, source, local state, validation state, and actions without horizontal page scrolling
    When the operator expands the funnel_step row
    Then its type, presence, expected or allowed values, conditions, rules, documentation, example, provenance, Override here, and Reset to parents controls appear as a stacked row detail
    And closing the row restores focus to funnel_step without hiding the other property rows
