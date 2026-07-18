Feature: Data layer Flow effective schema assignment

  Background:
    Given Shop project contains Base, Checkout Page, Confirmation Page, Purchase Event, Retail, and Trade requirement layers
    And Retail Purchase and Trade Purchase reference shared Event Purchase
    And Retail requires /customer/type equal consumer while Trade requires /customer/type equal business

  # Data layer Flow effective schema assignment 001
  Scenario: Data layer Flow effective schema assignment 001
    Given Base requires /site_id
    And Confirmation Page requires /page/type equal confirmation
    And Purchase requires /ecommerce/transaction_id
    And Retail Purchase requires /ecommerce/currency to be GBP or EUR
    When the Retail Purchase effective schema is compiled
    Then all 5 requirements are present with Base, Page, Event, Profile, and occurrence provenance
    And structural parent /ecommerce compiles with its children

  # Data layer Flow effective schema assignment 002
  Scenario: Data layer Flow effective schema assignment 002
    Given Trade additionally requires /account/id and /ecommerce/purchase_order_number
    When compilation produces the Retail and Trade effective schemas
    Then the schema difference states Retail excludes both Trade requirements while Trade includes both
    And both effective schemas reference one shared Purchase Event definition

  # Data layer Flow effective schema assignment 003
  Scenario Outline: Data layer Flow effective schema assignment 003
    Given Retail Purchase and Trade Purchase currently share Purchase revision 3
    When the operator chooses <edit_scope> and adds requirement <requirement>
    Then effective contract impact is <affected_contracts>
    And the confirmation preview identifies every changed Assignment, validation case, and documentation section

    Examples:
      | edit_scope               | requirement             | affected_contracts                                      |
      | Edit shared Purchase     | /ecommerce/value        | Retail and Trade include /ecommerce/value               |
      | Refine this occurrence   | /retail/loyalty_number  | only Retail includes /retail/loyalty_number             |

  # Data layer Flow effective schema assignment 004
  Scenario: Data layer Flow effective schema assignment 004
    Given Retail Purchase is assigned to Confirmation Page
    When the operator proposes moving it to Checkout Page
    Then the preview compares Page requirements, effective paths, Assignment selectors, and stale evidence
    And shared Purchase and Trade Purchase remain unchanged before confirmation

  # Data layer Flow effective schema assignment 005
  Scenario Outline: Data layer Flow effective schema assignment 005
    Given two contributing layers define <conflict>
    When the Event-occurrence schema is compiled
    Then compilation is blocked with both named origins and incompatible values
    And no Assignment can claim automatic validation readiness

    Examples:
      | conflict                          |
      | string and number types           |
      | Required and Forbidden presence   |
      | disjoint allowed-value sets       |
      | incompatible conditional rules    |

  # Data layer Flow effective schema assignment 006
  Scenario: Data layer Flow effective schema assignment 006
    Given Retail Purchase has no validation Assignment
    When the operator chooses Make automatic validation ready
    Then Event, Page, effective schema, and Profile selectors use human names
    And the named Assignment persists stable references and an observable matcher summary
    And the graph node displays exactly one Draft only Assignment until that compiled plan is published

  # Data layer Flow effective schema assignment 007
  Scenario: Data layer Flow effective schema assignment 007
    Given URL, source, target, Event, payload, environment, and available session inputs are identical
    When Assignment resolution runs
    Then both named candidates are displayed as a blocking tie
    And graph position, expected predecessor, Flow name, and manual checklist state do not select a winner

  # Data layer Flow effective schema assignment 008
  Scenario Outline: Data layer Flow effective schema assignment 008
    Given a captured Purchase violates <constraint>
    When its independently selected effective schema validates the payload
    Then one issue reports <path>, <code>, Error, <expected>, <actual>, and <origin>
    And the issue opens the exact contributing requirement

    Examples:
      | constraint                           | path                             | code        | expected          | actual | origin         |
      | transaction ID string type           | /ecommerce/transaction_id        | type        | string            | 42     | Purchase Event |
      | currency allowed values GBP and EUR  | /ecommerce/currency              | enum        | GBP or EUR        | USD    | Retail Profile |
      | forbidden coupon                     | /ecommerce/coupon                | forbidden   | absent            | SUMMER | Retail Profile |
      | required value                       | /ecommerce/value                 | required    | present           | absent | Purchase Event |
      | Trade purchase order condition       | /ecommerce/purchase_order_number | conditional | present for Trade | absent | Trade Profile  |

  # Data layer Flow effective schema assignment 009
  Scenario: Data layer Flow effective schema assignment 009
    Given a valid Purchase observation matches Retail using observable route channel retail
    And its documented context-setting Event was not observed
    And immutable release 3 contains the published Retail Assignment and effective schema
    When Event Test validates Purchase
    Then Retail is selected from the current observation and published Assignment
    And the payload result is unchanged by attaching or not attaching it to Retail Purchase
    And no predecessor, transition, or Flow-state result is produced

  # Data layer Flow effective schema assignment 010
  Scenario Outline: Data layer Flow effective schema assignment 010
    Given <change> is saved in the project draft
    And immutable release 3 remains current in Live
    When evidence and Live status are refreshed
    Then draft evidence effect is <draft_effect>
    And Live continues to identify the current published release

    Examples:
      | change                            | draft_effect                                      |
      | shared Purchase requirement       | affected Event validation evidence becomes stale |
      | Retail occurrence refinement      | Retail Event validation evidence becomes stale   |
      | Retail Applicability matcher      | Retail Event validation evidence becomes stale   |
      | required Retail Event-case assertion | that Event-case result becomes stale           |
      | node canvas position              | schema validation evidence remains current        |
      | relationship label                | schema validation evidence remains current        |

  # Data layer Flow effective schema assignment 011
  Scenario: Data layer Flow effective schema assignment 011
    Given Retail Purchase opens the rich requirement editor
    When the operator starts bulk authoring for Retail
    Then staging is locked to the named Retail layer and current base revision
    And repair, row exclusion, complete columns, paging, file or spreadsheet input, atomic commit, Undo, and Redo remain available
    And no lightweight graph-local schema table is created

  # Data layer Flow effective schema assignment 012
  Scenario Outline: Data layer Flow effective schema assignment 012
    Given Retail Purchase has <condition>
    When static automatic-validation readiness is calculated for its declared matcher domain
    Then its single displayed status is <status>
    And its next repair is <repair>

    Examples:
      | condition                                                                  | status               | repair                                  |
      | a composition conflict and Documentation only mode                         | Schema blocked       | resolve the named schema conflict       |
      | a valid schema, Documentation only mode, and overlapping Assignments       | Documentation only   | restore automatic validation if desired |
      | a valid schema and equal-priority overlapping draft Assignments             | Ambiguous Assignment | resolve the named matcher overlap       |
      | Retail A wins channel retail and Retail B wins channel outlet               | Ambiguous Assignment | choose one Assignment for the whole domain |
      | a valid schema and no enabled draft Assignment covering its domain          | No Assignment        | create or enable a named Assignment     |
      | unique winners except one uncovered route-channel region                    | No Assignment        | cover the named unmatched region        |
      | one deterministic draft Assignment that differs from the published plan     | Draft only           | preflight, review, and publish this plan |
      | one stable Assignment whose matcher content revision changed only in draft   | Draft only           | review and publish the compiled revision |
      | one deterministic Assignment identical to the published plan                | Ready                | inspect the published Assignment        |

  # Data layer Flow effective schema assignment 013
  Scenario: Data layer Flow effective schema assignment 013
    Given Retail Purchase has a valid effective schema and no Assignment
    And its Automatic validation required status is No Assignment
    When the operator chooses Documentation only
    Then impact review names Retail Purchase, its Assignment blocker, omitted Live claim, checklist and export labels, release effect, and Undo
    When the operator confirms the exception
    Then graph, outline, checklist, Confluence, and Spreadsheet label Retail Purchase Documentation only
    And release no longer requires an Assignment for Retail Purchase
    And no surface implies automatic payload validation for it
    When the operator restores Automatic validation required
    Then No Assignment and its release blocker return

  # Data layer Flow effective schema assignment 014
  Scenario: Data layer Flow effective schema assignment 014
    Given Retail Purchase has two enabled Assignments with equal priority and overlapping route-channel domains
    When the operator tests matcher value retail
    Then both human Assignment names and matching predicate evidence are displayed
    And there is no winner
    And changing graph position, predecessor, Flow label, or checklist state leaves the tie unchanged

  # Data layer Flow effective schema assignment 015
  Scenario Outline: Data layer Flow effective schema assignment 015
    Given Event validation case Purchase contract has <requirement> requirement and <content>
    When its assertions run through the production Assignment and validator
    Then the case status is <case_status>
    And release effect is <release_effect>

    Examples:
      | requirement | content                                              | case_status | release_effect        |
      | required    | no observable context, payload, or assertions        | Blocked     | publication is blocked |
      | required    | expected valid but actual enum issue USD             | Failing     | publication is blocked |
      | required    | expected Retail winner but actual winner is Trade     | Failing     | publication is blocked |
      | required    | expected an Assignment tie but actual winner is Retail | Failing    | publication is blocked |
      | required    | expected enum issue USD and received that exact issue | Passing     | publication is allowed |
      | required    | matching assertions from an older schema revision     | Stale       | publication is blocked |
      | optional    | no observable context, payload, or assertions        | Not run     | publication is allowed |

  # Data layer Flow effective schema assignment 016
  Scenario: Data layer Flow effective schema assignment 016
    Given Retail Purchase Assignment references named Applicability Set Retail route in Builder and side panel
    When either surface edits Retail route through its nested All, Any, and Not query builder over source, target, URL, Event, payload, environment, and available session fields
    Then both surfaces show the same human-readable matcher summary, priority, test result, and overlap diagnostics
    And saving from either surface produces one revisioned Applicability command while the Assignment retains the same stable reference
    And no embedded or copied Assignment condition tree is created

  # Data layer Flow effective schema assignment 017
  Scenario: Data layer Flow effective schema assignment 017
    Given observation Purchase retail 101 has route channel retail and currency USD
    When published release 3 independently validates it
    Then EventValidationResult identifies the observation, normalized observable context, and release 3
    And it identifies Retail Purchase Assignment as winner with matching evidence and Trade Purchase Assignment as rejected with reason
    And it identifies Sitewide and Retail Profiles and schema revision 8
    And it reports /ecommerce/currency, enum, Error, GBP or EUR, USD, and Retail Profile provenance
    And it contains no authoritative Flow, current-node, transition-outcome, temporal-occurrence verdict, active-branch, join-state, or journey-verdict field
