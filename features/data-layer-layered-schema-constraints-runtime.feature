Feature: Data layer layered schema constraints runtime

  Background:
    Given the built extension is running with the production project repository, canonical schema editor, compiler, assignment resolver, and per-Event validator
    And production Shop contains Shared Profiles Sitewide and Opened Article
    And it contains Checkout, Shipping, Article, Purchase, Article Opened, Alternative shipping, and Summer article
    And production Shipping and Article are context-setting pageview events while Purchase and Article Opened are interaction Events

  # Data layer layered schema constraints runtime 001
  Scenario Outline: Data layer layered schema constraints runtime 001
    Given actual controls open the schema contribution for <contributor>
    Then the installed editor renders the same canonical composed-property table and expandable row editors
    And installed root, child, sibling, rename, move, duplicate, and delete actions are operable
    And production type, presence, condition, allowed-value, rule, documentation, example, and impact-review controls are operable
    And rendered inherited, local, effective, superseded, and conflicting definitions are distinguished
    And saving sends property-scoped commands with the displayed contributor base revision
    And only rendered contributor name, scope, applicability, and provenance differ

    Examples:
      | contributor                         |
      | Shared Profile Sitewide             |
      | Page Group Checkout                 |
      | Page Shipping                       |
      | Event Purchase                      |
      | Flow Page instance Alternative shipping |
      | Event occurrence Alternative shipping Purchase |

  # Data layer layered schema constraints runtime 002
  Scenario: Data layer layered schema constraints runtime 002
    Given production Page-branch definitions are
      | contributor | property    | definition                              |
      | Sitewide    | funnel_name | optional string                         |
      | Sitewide    | funnel_step | optional string                         |
      | Checkout    | funnel_name | required with allowed value checkout    |
      | Checkout    | funnel_step | required                                |
      | Shipping    | funnel_step | required with allowed value 3a          |
    When actual Alternative shipping controls change local funnel_step allowed value to 3b
    Then the production Alternative shipping Page effective result is
      | property    | effective definition                  |
      | funnel_name | required with allowed value checkout   |
      | funnel_step | required with allowed value 3b         |
    And every other applicable Sitewide property remains inherited
    And rendered provenance shows Sitewide, Checkout, Shipping, and Alternative shipping in composition order
    And 3a remains the effective funnel_step value for an ordinary Shipping context

  # Data layer layered schema constraints runtime 003
  Scenario: Data layer layered schema constraints runtime 003
    Given production Opened Article requires string properties event and article_name
    And Opened Article restricts event to article_opened
    And Article Opened inherits Opened Article and documents article_name as the opened article title
    When actual occurrence controls set the title expectation to Summer sale
    Then its production Event result is
      | property     | effective definition                          |
      | event        | required string restricted to article_opened  |
      | article_name | required string restricted to Summer sale     |
    And rendered provenance names Opened Article, Article Opened, and the Summer article occurrence
    And reusable Article Opened storage has no Page Group membership and compiles its Shared Profile and Event branches before placement
    And its production occurrence exists only inside Summer article Page context

  # Data layer layered schema constraints runtime 004
  Scenario: Data layer layered schema constraints runtime 004
    Given production Summer article Article Opened receives branch values
      | branch | property  | value          |
      | Page   | page_type | article        |
      | Event  | event     | article_opened |
    When the production compiler builds Summer article Article Opened
    Then one effective property tree contains applicable Shared Profile, Page Group, Page, Flow Page-instance, Event, and Event-occurrence contributions
    And rendered properties and rules name their branch and human contributor
    When the Page branch requires consent_state value granted and the Event branch requires consent_state value denied
    Then production compilation blocks consent_state as a parallel-branch conflict
    And persisted order does not silently select either branch
    When actual controls resolve the conflict at the Article Opened occurrence with allowed value granted
    Then the effective schema is ready and production provenance records the resolution against both definitions

  # Data layer layered schema constraints runtime 005
  Scenario Outline: Data layer layered schema constraints runtime 005
    Given a production inherited property has <base contribution>
    When actual controls save <specific contribution> on a more-specific contributor
    Then the production compiler returns <outcome>
    And the rendered property result explains <explanation>

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

  # Data layer layered schema constraints runtime 006
  Scenario: Data layer layered schema constraints runtime 006
    Given production contextual scopes are
      | contributor                  | included contexts                                      |
      | Sitewide                     | every selected specification context                   |
      | Checkout                     | every member Page and its Page instances                |
      | Shipping                     | every instance of Page Shipping                         |
      | Purchase                     | every Purchase occurrence independent of Page Group    |
      | Alternative shipping         | every Event occurrence contained by that Page instance |
      | Alternative shipping Purchase | that Event occurrence only                             |
    When production compiles Shipping Page event, Alternative shipping Page event, Alternative shipping Purchase occurrence, and reusable Purchase Event
    Then each effective schema contains exactly the contextually applicable contributions
    And rendered inclusion and exclusion evidence names contributor and scope
    And installed Page reassignment preserves both Pages' memberships while recompiling the occurrence against its selected Page branch
    And production storage uses stable contributor, property, and occurrence references rather than names or generated paths

  # Data layer layered schema constraints runtime 007
  Scenario: Data layer layered schema constraints runtime 007
    Given Alternative shipping Purchase is registered for matcher-driven production activation
    And its applicability is All of pathname matching /checkout/shipping, page_name equalling shipping, checkout_variant equalling alternative, and Event equalling Purchase
    When the installed matcher test receives one complete match and three observations each differing in one property
    Then exactly the complete match selects Alternative shipping Purchase
    And each rejected observation renders its failed human-name predicate
    And production assignment evidence uses applicability inputs without inferred Flow sequence
    And the production resolver consults no Flow context-binding record
    When an equal-priority production candidate also matches the complete observation
    Then automatic selection is blocked as ambiguous and renders both candidate names
    When actual controls give one candidate higher priority and retest
    Then that candidate wins and assignment evidence retains the rejected match

  # Data layer layered schema constraints runtime 008
  Scenario: Data layer layered schema constraints runtime 008
    Given validating against Alternative shipping Purchase requires explicit operator selection
    When actual validation controls select it by Flow, Page, and Event names
    Then the production validator uses that compiled schema without automatic applicability evaluation
    And unified evaluation records manual selection, stable target identity, effective schema revision, issues, and provenance
    And rendered output claims no automatic assignment winner

  # Data layer layered schema constraints runtime 009
  Scenario: Data layer layered schema constraints runtime 009
    Given Alternative shipping Purchase is registered as Documentation only
    When actual controls generate its effective schema and developer export
    Then production compilation returns complete property and provenance detail while excluding that target from automatic and manual validation choices
    And the rendered export states Alternative shipping, Shipping Page, Purchase Event, funnel_step value 3b, inherited funnel_name value checkout, and Documentation only
    And exported rows distinguish inherited definitions, local differences, conditions, and activation
    And production assignment indexes contain no Documentation-only target or resulting ambiguity

  # Data layer layered schema constraints runtime 010
  Scenario: Data layer layered schema constraints runtime 010
    Given actual controls select a Page Group, Page frame, or Event occurrence on the installed Flow canvas
    When the contextual Inspector renders its Schema summary
    Then inherited, local, effective, conflict, and activation counts render while the canvas remains mounted
    And one action opens the complete production schema editor in the main workspace at that contributor
    And the main editor exposes the same commands used for Shared Profiles
    And returning to Flow restores the selected canvas item and viewport
    And an actual save names affected scopes, stale compiled targets, Draft status, and one Undo action

  # Data layer layered schema constraints runtime 011
  Scenario: Data layer layered schema constraints runtime 011
    Given unified evaluation resolved the validation subject to Checkout journey, Alternative shipping, and Purchase
    And its selected rule fixes /funnel_step to string 3b
    When the production validator receives otherwise valid Purchase observations containing funnel_step 3b and 3a
    Then the 3b result contains no issue for /funnel_step
    And the 3a result contains path /funnel_step, code EXPECTED_VALUE, severity error, expected 3b, actual 3a, and Alternative shipping provenance
    And both results contain the selected stable target and effective schema revision
    And neither result claims that an expected Flow sequence or occurrence completed

  # Data layer layered schema constraints runtime 012
  Scenario: Data layer layered schema constraints runtime 012
    Given the production terminal context contains canonical definitions
      | contributor    | property          | local definition             |
      | Sitewide       | page_type         | string                       |
      | Sitewide       | consent_state     | string                       |
      | Opened Article | event             | string                       |
      | Opened Article | article_name      | string                       |
      | Opened Article | metadata.category | nested string                |
      | Article        | page_type         | allowed value article        |
      | Summer article | consent_state     | allowed value granted        |
      | Article Opened | event             | allowed value article_opened |
    When visible controls add the occurrence refinements
      | property          | allowed value |
      | article_name      | Summer sale   |
      | metadata.category | News          |
    Then the production selected-context export contains the complete effective Summer article Article Opened schema
    And inherited and local values, conditions, documentation, examples, and provenance are distinguishable
    When production validation receives matching valid and invalid Article Opened observations
    Then the valid observation passes per-Event schema validation
    And the invalid observation reports every violated effective property rule with exact provenance
    And neither result claims full Flow validation

  # Data layer layered schema constraints runtime 013
  Scenario: Data layer layered schema constraints runtime 013
    Given production Cart initially belongs only to Checkout
    When actual controls open Cart Page configuration
    Then the installed Page editor and Cart context menu expose the same Add to Page Group command
    When actual search finds Retail Checkout and Trade Checkout
    Then installed results render each name, purpose, applicability summary, and prospective rule impact
    When actual controls add both groups
    Then the production Page Group rule stack is
      | position | Page Group      |
      | 1        | Checkout        |
      | 2        | Retail Checkout |
      | 3        | Trade Checkout  |
    And rendered guidance explains top-to-bottom guarded refinement
    And canonical Cart storage contains one ordered stable-reference membership list
    And production Page Group member views derive Cart without a second editable membership collection
    And each row exposes Open Page Group, Move earlier, Move later, and Remove at 360px without horizontal page scroll
    When installed keyboard controls move Trade Checkout before Retail Checkout
    Then only the ordered Cart membership command is persisted and focus returns to Trade Checkout at position 2
    And the rendered impact preview names affected properties, Page instances, compiled targets, and stale exports before commit

  # Data layer layered schema constraints runtime 014
  Scenario: Data layer layered schema constraints runtime 014
    Given production Cart membership order is Checkout, Retail Checkout, and Trade Checkout
    And production Checkout requires funnel_name checkout and permits funnel_step 3a or 3b
    And production conditional group definitions are
      | Page Group      | applicability              | funnel_step refinement |
      | Retail Checkout | customer_type retail       | allowed value 3a       |
      | Trade Checkout  | customer_type trade        | allowed value 3b       |
    When the production compiler receives retail and trade observations for Cart
    Then compiled Page Group evidence is
      | observation | included stack              | funnel_step |
      | retail      | Checkout, Retail Checkout   | 3a          |
      | trade       | Checkout, Trade Checkout    | 3b          |
    And rendered evidence names inactive memberships without reordering active group IDs
    When production Retail Checkout proposes changing funnel_step from string to number
    Then compilation blocks at funnel_step regardless of stored membership position
    And the installed issue names Checkout, Retail Checkout, their order, the unsafe type change, and repair links
    When production Retail Checkout instead proposes allowed value 4
    Then compilation blocks at funnel_step with the unsafe allowed-value expansion
    When one production observation matches Retail Checkout and Trade Checkout
    Then assignment reports ambiguity without selecting the later membership

  # Data layer layered schema constraints runtime 015
  Scenario: Data layer layered schema constraints runtime 015
    Given production legacy storage lists Checkout then Retail Checkout on Cart and lists Cart from Trade Checkout
    When the installed upgrade opens Cart
    Then migration review proposes Checkout, Retail Checkout, and Trade Checkout without membership loss
    And it preserves Page-owned order before group-only memberships and blocks any missing group reference
    When actual controls confirm the proposed order
    Then one production transaction stores only Cart's ordered stable Page Group IDs
    And installed group member views derive Cart from that canonical Saved Draft
    When actual Undo runs once
    Then serialized membership state equals the complete legacy fixture

  # Data layer layered schema constraints runtime 016
  Scenario: Data layer layered schema constraints runtime 016
    Given production Sitewide contributes page_name, funnel_name, funnel_step, and page_type
    And canonical Page Group revision pg-checkout-r5 contributes local facets at both funnel paths
    And production Cart belongs to Checkout with a local funnel_step override
    When Checkout is activated from the installed Page Groups overview
    Then the installed Page Group route renders its complete configuration and schema in the main workspace without Inspector interaction
    And Effective schema at Checkout rows contain composed Sitewide and Checkout inherited, local, effective, and provenance values
    When Cart is activated from the installed Pages overview
    Then the installed Page route renders applicability, ordered memberships, and Effective schema at Cart in the main workspace
    And four production rows remain mounted with Shared Profile, Checkout, and Cart contribution stacks
    And inherited rows render Override here while local funnel_step renders Reset to parents
    And opening the optional Inspector shows a summary linking to the same route without mounting another editor model

  # Data layer layered schema constraints runtime 017
  Scenario: Data layer layered schema constraints runtime 017
    Given the production ordinary parent universe for funnel_step contains 2, 3a, and 3b
    And the canonical Page-level expectation on Cart is 2
    When actual Page controls add Retail Checkout with ordinary expected value 3a
    Then production commits the membership revision as Draft and compiles Cart funnel_step as 2
    And the installed row renders Parent difference resolved by Cart override as a non-blocking warning
    And provenance names Checkout and Retail Checkout as shadowed with Cart effective
    And canonical Cart storage overrides only expected value while inheriting every other property facet
    When actual controls activate Reset to parents for funnel_step
    Then installed impact preview shows the prospective effective value, affected instances, stale outputs, and Undo
    When the operator confirms removal of Cart's local expected value
    Then canonical Cart storage removes its expected-value contribution without copying a parent value
    And production recompiles the row from Checkout and Retail Checkout immediately
    And a rendered Cart-only property uses Remove local property instead of Reset to parents

  # Data layer layered schema constraints runtime 018
  Scenario: Data layer layered schema constraints runtime 018
    Given canonical Cart storage covers funnel_step expected value but no other facet
    And production Checkout marks string funnel_name invariant
    When actual controls add Partner Checkout with number funnel_name and an incompatible funnel_step type
    Then the membership transaction commits as Draft and installed conflict summary remains visible
    And the production local expectation survives solely within its declared facet
    And uncovered funnel_step type plus Checkout funnel_name invariant block effective compilation
    And rendered rows separate winning local facets, unresolved parent facets, and invariant provenance
    And installed repair links offer permitted Cart adjustment, Partner Checkout editing, or membership removal
    And production validation and developer export expose Blocked rather than Ready without duplicate no-op controls

  # Data layer layered schema constraints runtime 019
  Scenario: Data layer layered schema constraints runtime 019
    Given Cart production compilation includes parent inheritance, Page edits, and one unresolved conflict
    When the installed extension opens Cart at 360 pixels
    Then one production vertical scroll owner renders every effective property as a compact table row
    And each row exposes property, effective definition, source, local state, validation state, and actions without horizontal page scrolling
    When actual controls expand the funnel_step row
    Then type, presence, expected or allowed values, conditions, rules, documentation, example, provenance, Override here, and Reset to parents render as stacked row detail
    And closing the row returns focus to funnel_step while the other production rows remain mounted

  # Data layer layered schema constraints runtime 020
  Scenario Outline: Data layer layered schema constraints runtime 020
    Given production <target> has canonical contributions from <effective contributors>
    And it remains authorable, compilable, and documented with no assignment record
    When actual controls create Retail Purchase assignment for Purchase observations and select <target>
    Then persisted assignment data contains that stable contributor ID and kind
    And repository inspection finds no standalone Schema, schemaDraftId, or copied schema document
    And production validation compiles current effective values from <effective contributors>
    And every other unassigned contributor remains operable without a missing-assignment diagnostic

    Examples:
      | target                                  | effective contributors                    |
      | Shared Profile Sitewide                 | Sitewide                                  |
      | Page Group Checkout                     | Sitewide and Checkout                     |
      | Page Cart                               | Sitewide, Checkout, and Cart              |
      | Event Purchase                          | Sitewide and Purchase                     |
      | Flow Page instance Alternative shipping | Sitewide, Shipping, Cart, and Alternative shipping |
