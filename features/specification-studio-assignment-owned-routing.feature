# mutation-stamp: sha256=834b1349fb4acc22cc844875fa54f520f1700092e810f05b671ec3ee04679cfb
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-31T23:54:34.681854955Z","feature_name":"Specification Studio assignment-owned routing","feature_path":"features/specification-studio-assignment-owned-routing.feature","background_hash":"a1f1014c7dfd896c885ea0a5610d511ce3345a1d0d0429d9ad2d5c2ab8daae38","implementation_hash":"sha256:391a2d1f9b1343ac1a680930786171cad5167b773db0861469ced837cb4cac29","scenarios":[{"index":1,"name":"Specification Studio assignment-owned routing 002","scenario_hash":"1f69c51efc4039594adb62894a4b7e12e08168a1cae4e3ae7a997d1e273e4596","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-31T23:54:34.681854955Z"},{"index":2,"name":"Specification Studio assignment-owned routing 003","scenario_hash":"545e47c5eee66eb7874bef8c8ef5682502e44e31a86eedbf1d36276444ea7d43","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-31T23:54:34.681854955Z"}]}
# acceptance-mutation-manifest-end

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
