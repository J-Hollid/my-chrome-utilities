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
    Then the same canonical property tree and selected-property editor are available
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
