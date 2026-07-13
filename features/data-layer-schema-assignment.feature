Feature: Data layer schema assignment

  Background:
    Given Generic page view version 4 and Order confirmation version 2 are saved schemas

  # Data layer schema assignment 001
  Scenario: Data layer schema assignment 001
    When the operator creates an automatic assignment
    Then the editor provides source, event name, validation target, domain condition, pathname condition, priority, schema, version policy, and enabled state
    And an assignment cannot save without source, event name, target, priority, and schema
    And domain and pathname conditions are optional

  # Data layer schema assignment 002
  Scenario: Data layer schema assignment 002
    Given these automatic assignments are enabled
      | assignment          | source        | event name | domain condition | pathname condition | priority | schema                      |
      | generic-page-view   | event-history | page_view  | any              | any                | 10       | Generic page view version 4 |
      | order-confirmation  | event-history | page_view  | shop.example     | /order-confirmation | 100      | Order confirmation version 2 |
    When page_view is captured from https://shop.example/order-confirmation?order=42#complete
    Then order-confirmation is selected because priority 100 exceeds 10
    And validation uses Order confirmation version 2
    And Generic page view rules apply only through Order confirmation's explicit inheritance rather than a second stacked schema result
    And the match uses captured domain shop.example and pathname /order-confirmation
    And query and fragment do not alter the pathname condition

  # Data layer schema assignment 003
  Scenario Outline: Data layer schema assignment 003
    Given an assignment has <condition_kind> condition <condition>
    When the captured page URL is <page_url>
    Then the condition result is <match_result>

    Examples:
      | condition_kind | condition           | page_url                                      | match_result |
      | domain exact   | shop.example        | https://shop.example/products                 | match        |
      | domain wildcard | *.shop.example     | https://uk.shop.example/products              | match        |
      | pathname exact | /order-confirmation | https://shop.example/order-confirmation       | match        |
      | pathname glob  | /products/*         | https://shop.example/products/field-notebook  | match        |
      | pathname exact | /products           | https://shop.example/products/field-notebook  | no match     |

  # Data layer schema assignment 004
  Scenario: Data layer schema assignment 004
    Given 2 enabled matching assignments have equal highest priority 100
    When automatic assignment resolves for a captured event
    Then no schema is selected automatically
    And validation state is Assignment error
    And the result identifies both conflicting assignments and offers Edit priorities
    And array order or last-edited time does not break the tie

  # Data layer schema assignment 005
  Scenario: Data layer schema assignment 005
    Given an automatic assignment selects Generic page view version 4 for event event-7
    When the operator manually selects Order confirmation version 2 for event-7
    Then the manual selection overrides automatic assignment for that validation
    And the validation record identifies manual selection and the superseded assignment
    And other events continue using automatic assignment

  # Data layer schema assignment 006
  Scenario: Data layer schema assignment 006
    Given captured event event-7 has source event-history, event page_view, and page URL https://shop.example/order-confirmation
    When the operator chooses Create assignment from this event
    Then a draft assignment is prefilled with source event-history, event page_view, domain shop.example, and pathname /order-confirmation
    And no assignment becomes active before review and save
    And the operator must choose schema, priority, target, and version policy

  # Data layer schema assignment 007
  Scenario: Data layer schema assignment 007
    Given Library template Order confirmation has event page_view
    When the operator attaches Order confirmation schema version 2
    Then the template stores the explicit schema identity, version policy, and validation target
    And template validation uses that manual attachment before automatic assignments
    And changing the template event name triggers assignment and attachment compatibility review

  # Data layer schema assignment 008
  Scenario Outline: Data layer schema assignment 008
    Given assignment version policy is <version_policy> for schema version 4
    When schema version 5 is published as the current revision
    Then assignment behavior is <assignment_behavior>
    And every validation record stores the exact schema version actually used
    And the schema remains 1 choice for assignment

    Examples:
      | version_policy | assignment_behavior                              |
      | pinned         | continue using version 4                         |
      | follow latest  | use version 5 after explicit compatibility review |

  # Data layer schema assignment 009
  Scenario: Data layer schema assignment 009
    Given an archived event was captured from https://shop.example/order-confirmation
    And the active browser target is now https://shop.example/products
    When the archived event is revalidated automatically or manually
    Then assignment uses the archived event's captured URL
    And the active target URL and extension URL are ignored

  # Data layer schema assignment 010
  Scenario: Data layer schema assignment 010
    Given assignments have unequal priority, conditions, schemas, versions, and enabled states
    When the Assignments subview is displayed
    Then each row separately presents name, source/event, URL conditions, priority, target, schema version policy, and enabled state
    And rows are ordered by descending priority then name
    And Edit, Duplicate, Disable, and Delete occupy a dedicated action group
