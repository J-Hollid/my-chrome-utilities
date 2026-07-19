Feature: Data layer layered schema constraints runtime

  Background:
    Given the built extension is running with the production project repository, canonical schema editor, compiler, assignment resolver, and per-Event validator
    And production Shop contains Shared Profiles Sitewide and Opened Article
    And it contains Checkout, Shipping, Article, Purchase, Article Opened, Alternative shipping, and Summer article

  # Data layer layered schema constraints runtime 001
  Scenario Outline: Data layer layered schema constraints runtime 001
    Given actual controls open the schema contribution for <contributor>
    Then the installed editor renders the same canonical property tree and selected-property editor
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
    Then the production Alternative shipping Page-context result is
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
    And canonical Article Opened storage has no Page Group membership
    And production compilation outside Page containment uses only the Shared Profile, Event, and occurrence branches

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
    When production compiles Shipping, Alternative shipping, Alternative shipping Purchase, and Purchase outside a Page
    Then each effective schema contains exactly the contextually applicable contributions
    And rendered inclusion and exclusion evidence names contributor and scope
    And the installed canvas cannot move an Event occurrence into different Page or Page Group containment
    And production storage uses stable contributor, property, and occurrence references rather than names or generated paths

  # Data layer layered schema constraints runtime 007
  Scenario: Data layer layered schema constraints runtime 007
    Given Alternative shipping Purchase is registered for matcher-driven production activation
    And its applicability is All of pathname matching /checkout/shipping, page_name equalling shipping, checkout_variant equalling alternative, and Event equalling Purchase
    When the installed matcher test receives one complete match and three observations each differing in one property
    Then exactly the complete match selects Alternative shipping Purchase
    And each rejected observation renders its failed human-name predicate
    And production assignment evidence uses applicability inputs without inferred Flow sequence
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
