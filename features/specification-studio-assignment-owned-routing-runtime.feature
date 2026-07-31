# mutation-stamp: sha256=6709443aad491d68165eb4cdf8b7876a38ff2533d23f6df93907cf7d3339edea
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-31T23:54:33.499704167Z","feature_name":"Specification Studio assignment-owned routing runtime","feature_path":"features/specification-studio-assignment-owned-routing-runtime.feature","background_hash":"be0b5187119bb148388e49109403d955482eae9a2030c4dfa0fc107c2701c962","implementation_hash":"sha256:2f99a5a19ef7e2f91b13dab77e3731cc5f615526de17ff101c7c635a8d87b4b6","scenarios":[{"index":1,"name":"Specification Studio assignment-owned routing runtime 002","scenario_hash":"f84b7acd3c45793892658bd7a68fb657581fad647964e2c868341d2054453c58","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-31T23:54:33.499704167Z"},{"index":2,"name":"Specification Studio assignment-owned routing runtime 003","scenario_hash":"388e61f66d7b0da30b2e4609aac1e6ed444a308ac8b582af8b715917e9c3269d","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-31T23:54:33.499704167Z"}]}
# acceptance-mutation-manifest-end

Feature: Specification Studio assignment-owned routing runtime

  Background:
    Given the built extension is running with production Specification Studio and durable project storage
    And production Cart is a reusable Page schema context
    And production Page View and Purchase are observable Events

  # Specification Studio assignment-owned routing runtime 001
  Scenario: Specification Studio assignment-owned routing runtime 001
    When actual controls open a production Assignment
    Then the main workspace renders Schema target, Observed event, Applicability, Resolution, and Test assignment routing regions
    And target controls store contributor kind plus stable contributor identity
    And observation controls store source, Event identity, and payload or raw-input target
    And applicability controls select a stable reusable set or mount the shared condition builder
    And resolution controls associate priority with tied-candidate ambiguity guidance
    And DOM inspection finds no Assignment form in the Inspector

  # Specification Studio assignment-owned routing runtime 002
  Scenario Outline: Specification Studio assignment-owned routing runtime 002
    When actual controls add a <condition_kind> condition
    Then installed guided controls render <guided_input>
    And the rendered preview describes the resulting predicate with human names
    And DOM inspection finds no unlabelled free-form field-path, operator, value, or pattern input

    Examples:
      | condition_kind | guided_input                                                |
      | Environment    | configured-environment selector                            |
      | Host           | host-comparison selector and host value                    |
      | Pathname       | exact, starts-with, or pattern selector and path           |
      | Query          | parameter name, comparison, and typed value                |
      | Hash           | hash comparison and value                                  |
      | Context data   | schema-property, compatible-comparison, and typed-value controls |

  # Specification Studio assignment-owned routing runtime 003
  Scenario Outline: Specification Studio assignment-owned routing runtime 003
    Given production Cart Page View targets Cart for source browser with pathname /checkout/cart
    When the installed routing test evaluates <observation>
    Then rendered and evaluator evidence reports <result>
    And every production candidate includes Event and applicability acceptance or rejection evidence
    And repository bytes remain identical

    Examples:
      | observation                             | result                                 |
      | browser Page View at /checkout/cart     | Cart Page View is the sole winner      |
      | browser Page View at /checkout/shipping | Cart Page View is rejected by pathname |
      | server Page View at /checkout/cart      | Cart Page View is rejected by source   |
      | browser Purchase at /checkout/cart      | Cart Page View is rejected by Event    |

  # Specification Studio assignment-owned routing runtime 004
  Scenario: Specification Studio assignment-owned routing runtime 004
    Given production Cart Page View and Cart Page View alternative both match at priority 10
    When the installed routing test evaluates their shared observation
    Then the evaluator returns no winner and rendered ambiguity names both stable Assignment candidates
    When actual controls save Cart Page View at priority 20 and retest
    Then the evaluator winner is Cart Page View
    And rendered evidence retains Cart Page View alternative as a lower-priority match

  # Specification Studio assignment-owned routing runtime 005
  Scenario: Specification Studio assignment-owned routing runtime 005
    Given production Cart has no Assignment record
    When production authoring, Flow, documentation, and export consumers resolve Cart
    Then each consumes its memberships, inheritance recipes, local schema, and effective schema
    When actual controls create and then remove Cart Page View
    Then only automatic routing indexes and evidence change
    And hashes for Cart, its canonical schema, Flow graphs, and documentation configuration remain unchanged
