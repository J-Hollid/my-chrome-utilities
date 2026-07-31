Feature: Specification Studio assignment-owned routing

  Background:
    Given Cart is a reusable Page schema context
    And Page View and Purchase are observable Events
    And Assignments apply effective contributor schemas to matching observations

  # Specification Studio assignment-owned routing 001
  Scenario: Specification Studio assignment-owned routing 001
    When the operator opens an Assignment
    Then one main-workspace editor groups Schema target, Observed event, Applicability, Resolution, and Test assignment routing
    And Schema target selects a contributor kind and stable contributor target
    And Observed event selects source, Event, and payload or raw-input validation target
    And Applicability selects an existing reusable set or starts a new structured condition
    And Resolution explains priority and tied-candidate ambiguity
    And the Inspector contains no second Assignment form

  # Specification Studio assignment-owned routing 002
  Scenario Outline: Specification Studio assignment-owned routing 002
    When the operator adds a <condition_kind> applicability condition
    Then guided controls request <guided_input>
    And the condition preview states its human-readable matching consequence
    And no field path, operator, typed value, or pattern syntax must be guessed

    Examples:
      | condition_kind | guided_input                                           |
      | Environment    | one configured project environment                     |
      | Host           | host comparison and host value                         |
      | Pathname       | exact, starts-with, or pattern comparison and path     |
      | Query          | parameter name, comparison, and typed value            |
      | Hash           | hash comparison and value                              |
      | Context data   | schema property, compatible comparison, and typed value |

  # Specification Studio assignment-owned routing 003
  Scenario Outline: Specification Studio assignment-owned routing 003
    Given Cart Page View applies Cart for source browser and pathname /checkout/cart
    When Test assignment routing receives <observation>
    Then it reports <result>
    And it shows every candidate's Event and applicability evidence
    And it changes no Assignment, Page, schema, or project data

    Examples:
      | observation                             | result                                 |
      | browser Page View at /checkout/cart     | Cart Page View is the sole winner      |
      | browser Page View at /checkout/shipping | Cart Page View is rejected by pathname |
      | server Page View at /checkout/cart      | Cart Page View is rejected by source   |
      | browser Purchase at /checkout/cart      | Cart Page View is rejected by Event    |

  # Specification Studio assignment-owned routing 004
  Scenario: Specification Studio assignment-owned routing 004
    Given Cart Page View and Cart Page View alternative both match one observation at priority 10
    When the operator tests that observation
    Then routing is blocked as ambiguous and names both Assignments
    When the operator changes Cart Page View to priority 20 and retests
    Then Cart Page View wins
    And Cart Page View alternative remains visible with lower-priority evidence

  # Specification Studio assignment-owned routing 005
  Scenario: Specification Studio assignment-owned routing 005
    Given Cart has no Assignment
    When the operator authors, uses in a Flow, documents, or exports Cart
    Then its Page Group memberships, Shared Profile inheritance, local schema, and effective schema remain available
    When Cart Page View is later created or removed
    Then only automatic observation routing changes
    And Cart, its schema identity, Flows, and documentation remain unchanged
