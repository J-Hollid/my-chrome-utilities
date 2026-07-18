Feature: Data layer Flow effective schema assignment runtime

  Background:
    Given the built extension is running with production composition, Assignment, validation, and Live systems
    And Retail Purchase and Trade Purchase reference one shared Purchase Event

  # Data layer Flow effective schema assignment runtime 001
  Scenario: Data layer Flow effective schema assignment runtime 001
    When production compilation resolves Base, Page, Event, Profile, and occurrence layers
    Then the graph inspector, effective-schema preview, validation plan, and documentation projection contain identical paths, values, revisions, and provenance
    And neither occurrence creates a copied Purchase schema

  # Data layer Flow effective schema assignment runtime 002
  Scenario: Data layer Flow effective schema assignment runtime 002
    Given Retail route channel is retail and Trade route channel is trade
    And immutable release 3 contains both route-channel Assignments and effective schemas
    When byte-identical Purchase payloads are observed on both routes
    Then production Assignment resolution selects Retail for retail and Trade for trade
    And each result records rejected candidates, effective Profiles, schema revision, issues, and provenance
    And no prior Flow state participates

  # Data layer Flow effective schema assignment runtime 003
  Scenario: Data layer Flow effective schema assignment runtime 003
    Given Retail Purchase and Trade Purchase Assignments have different schemas, equal priority, and identical observable predicates
    And those compiled Assignments are in immutable release 3
    When one matching Purchase is observed
    Then actual Live renders both human names, matching predicate evidence, and an equal-priority tie
    And no Assignment or schema wins
    And no schema is selected by graph order, predecessor, Flow label, row order, or last edit

  # Data layer Flow effective schema assignment runtime 004
  Scenario Outline: Data layer Flow effective schema assignment runtime 004
    Given immutable release 3 production Purchase schema contains <constraint>
    When actual payload <payload_value> is observed
    Then the rendered issue is <issue_code> at <path> with expected <expected>, actual <actual>, severity Error, and origin <origin>
    And the repair target opens that exact independently authored requirement

    Examples:
      | constraint             | payload_value                   | issue_code  | path                             | expected          | actual | origin         |
      | string transaction ID  | transaction_id is 42            | type        | /ecommerce/transaction_id        | string            | 42     | Purchase Event |
      | GBP or EUR currency    | currency is USD                 | enum        | /ecommerce/currency              | GBP or EUR        | USD    | Retail Profile |
      | forbidden coupon       | coupon is SUMMER                | forbidden   | /ecommerce/coupon                | absent            | SUMMER | Retail Profile |
      | required value         | value is absent                 | required    | /ecommerce/value                 | present           | absent | Purchase Event |
      | Trade order condition  | purchase_order_number is absent | conditional | /ecommerce/purchase_order_number | present for Trade | absent | Trade Profile  |

  # Data layer Flow effective schema assignment runtime 005
  Scenario: Data layer Flow effective schema assignment runtime 005
    Given production Live release 3 validates Retail Purchase
    When shared Purchase changes only in draft revision 24
    Then the graph preview identifies draft revision 24 and stale evidence
    And the same observed payload remains byte-equivalent in Live under release 3
    And publication changes Live only after the new compilation result passes review

  # Data layer Flow effective schema assignment runtime 006
  Scenario: Data layer Flow effective schema assignment runtime 006
    Given a captured Purchase has a production validation result
    When it is attached to Retail Purchase and opened between side panel and Builder
    Then assignment winner, effective schema, issues, provenance, observation identity, and project revision remain identical
    And attaching it changes only the documented association and manual testing record

  # Data layer Flow effective schema assignment runtime 007
  Scenario: Data layer Flow effective schema assignment runtime 007
    When Retail Purchase requirements are opened on both production surfaces
    Then both render the same rich rows, columns, examples, conditions, customization, Spreadsheet output, and Rich table output
    And committing through either surface produces one canonical requirement command and one refreshed effective schema

  # Data layer Flow effective schema assignment runtime 008
  Scenario Outline: Data layer Flow effective schema assignment runtime 008
    Given a production Event occurrence has <condition>
    When the matcher-domain analyzer and schema compiler refresh its node
    Then the actual single status is <status>
    And the actual direct repair is <repair>

    Examples:
      | condition                                                        | status               | repair                            |
      | conflicting types and Documentation only mode                    | Schema blocked       | resolve schema conflict           |
      | valid schema, Documentation only mode, and equal-priority overlap | Documentation only   | restore automatic validation      |
      | valid schema and equal-priority overlap                           | Ambiguous Assignment | resolve matcher overlap           |
      | Retail A wins retail while Retail B wins outlet                   | Ambiguous Assignment | choose one whole-domain Assignment |
      | valid schema and no covering enabled Assignment                   | No Assignment        | create or enable Assignment       |
      | unique winners except one uncovered matcher-domain region         | No Assignment        | cover unmatched region            |
      | one deterministic draft contract absent from release 3            | Draft only           | review and publish the draft plan |
      | one stable Assignment with a draft-only matcher content revision   | Draft only           | publish the compiled revision     |
      | one deterministic contract identical to release 3                 | Ready                | inspect published Assignment      |

  # Data layer Flow effective schema assignment runtime 009
  Scenario: Data layer Flow effective schema assignment runtime 009
    Given a valid production occurrence has no Assignment and displays No Assignment
    When actual controls review and confirm Documentation only
    Then graph, outline, checklist, Confluence preview, and Spreadsheet preview show Documentation only
    And selected draft compilation permits publication without an Assignment for that occurrence
    When that exact draft compilation passes preflight, review, and publication
    Then the published validation plan contains no automatic-validation claim for it
    When actual controls restore Automatic validation required
    Then No Assignment and the publication blocker return

  # Data layer Flow effective schema assignment runtime 010
  Scenario: Data layer Flow effective schema assignment runtime 010
    Given one Assignment references the same named Applicability Set in Builder and side panel
    When actual controls save nested All, Any, and Not matcher groups for that named set from each surface in both orders
    Then both render the same canonical predicates, priority, summary, test result, and overlap diagnostics
    And the Assignment retains one stable Applicability reference without an embedded condition copy
    And Page, Event, node, relationship, Profile, Assignment, Event-case, checklist-run, schema, and release changes propagate without whole-collection replacement

  # Data layer Flow effective schema assignment runtime 011
  Scenario Outline: Data layer Flow effective schema assignment runtime 011
    Given production Event case Purchase contract is <requirement> and <content>
    When the actual Event-case runner uses the production Assignment and validator
    Then the rendered case status is <case_status>
    And the production release gate is <gate_status>

    Examples:
      | requirement | content                                               | case_status | gate_status |
      | required    | empty                                                 | Blocked     | blocked     |
      | required    | expected valid but receives enum issue USD            | Failing     | blocked     |
      | required    | expects Retail winner but receives Trade              | Failing     | blocked     |
      | required    | expects a tie but receives Retail winner              | Failing     | blocked     |
      | required    | expects and receives enum issue USD with exact fields | Passing     | allowed     |
      | required    | matching result from an older contract revision       | Stale       | blocked     |
      | optional    | empty                                                 | Not run     | allowed     |

  # Data layer Flow effective schema assignment runtime 012
  Scenario: Data layer Flow effective schema assignment runtime 012
    Given preflight produced content-addressed result compile:7K3M for project revision 24
    When review approves compile:7K3M and publication is requested without a semantic edit
    Then publication consumes compile:7K3M unchanged and release metadata records that identity
    When a semantic requirement changes after review
    Then compile:7K3M is invalidated and publication requires a new preflight and review

  # Data layer Flow effective schema assignment runtime 013
  Scenario: Data layer Flow effective schema assignment runtime 013
    Given release 3 observes Purchase retail 101 with route channel retail and currency USD
    When production Live opens its unified Event validation result
    Then observation identity, normalized context, release 3, Retail winner evidence, and Trade rejection reason are rendered
    And Sitewide and Retail Profiles and schema revision 8 are rendered
    And one issue renders path /ecommerce/currency, code enum, severity Error, expected GBP or EUR, actual USD, and Retail Profile provenance
    And serialized production result and rendered output omit authoritative Flow, current-node, transition-outcome, temporal-occurrence verdict, active-branch, join-state, and journey-verdict fields
