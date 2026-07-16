# mutation-stamp: sha256=852e3f726132b869427531ba4d9c9f7f9684856096e20b87db9bd633a9207782
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-16T17:15:54.980508181Z","feature_name":"Data layer Allowed values rule migration runtime","feature_path":"features/data-layer-allowed-values-rule-migration-runtime.feature","background_hash":"6355c75577542ec0512a01307ba6c5be3e71883c3f76ff21380bb7ab58d0e228","implementation_hash":"3e89a4421c73fcdc2fe2b662d64196c43f00f628","scenarios":[{"index":1,"name":"Data layer Allowed values rule migration runtime 002","scenario_hash":"d9879f7d7ed45a488ab526d633124a6fd77c9cc2a4cdb2dd8dbe73fc4ec94aa2","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-16T17:15:54.980508181Z"},{"index":2,"name":"Data layer Allowed values rule migration runtime 003","scenario_hash":"aa4c793babe9fb070b00fb0b4a3952a9929852256fcd3fb5ab42633cf8f2db78","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-16T17:15:54.980508181Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer Allowed values rule migration runtime

  Background:
    Given the built extension side panel is running with production schema storage, rule authoring, validation, and specification building
    And stored Generic pageview revision 4 contains parameter-backed Allowed values rules

  # Data layer Allowed values rule migration runtime 001
  Scenario: Data layer Allowed values rule migration runtime 001
    Given production /error_type has parameters technical,validation,authentication,login,notification and no allowedValues field
    When production Schema Library restoration runs
    Then persisted /error_type rule data contains those five structured String values in order and no value parameters
    And its identity, metadata, conditional configuration, attachment, and enabled state are byte-for-byte unchanged
    And no working draft, pending change, or revision is created
    When the production specification builder selects /error_type
    Then its Allowed values cell and example choices contain the same five values

  # Data layer Allowed values rule migration runtime 002
  Scenario Outline: Data layer Allowed values rule migration runtime 002
    Given production <schema_surface> stores <property_type> Allowed values as parameters <parameters>
    When restore and canonical persistence complete
    Then production stores <typed_values> in allowedValues
    And validation and specification derive values from the canonical field

    Examples:
      | schema_surface        | property_type | parameters | typed_values             |
      | current revision      | String        | a,b        | String a and b            |
      | historical revision   | Number        | 1,2        | Number 1 and 2            |
      | working draft         | Boolean       | true,false | Boolean true and false    |
      | inherited parent      | String        | parent,child | String parent and child  |

  # Data layer Allowed values rule migration runtime 003
  Scenario Outline: Data layer Allowed values rule migration runtime 003
    When production Allowed values are created through <authoring_surface>
    Then the stored attached or reusable rule uses allowedValues rather than value parameters
    And rerendering restores the typed choices from allowedValues
    And production validation evidence exposes those same choices

    Examples:
      | authoring_surface             |
      | property rule picker          |
      | guided validation             |
      | reusable Rule Library editor  |

  # Data layer Allowed values rule migration runtime 004
  Scenario: Data layer Allowed values rule migration runtime 004
    Given one production rule has both structured values and stale parameters
    And another typed rule contains a parameter token that cannot be converted safely
    When production migration runs
    Then the first rule preserves its structured values and removes its stale parameters
    And the second rule is retained without partial conversion and produces visible migration evidence
    And migration does not discard either rule or block restoration of the remaining library

  # Data layer Allowed values rule migration runtime 005
  Scenario: Data layer Allowed values rule migration runtime 005
    Given production parameter-backed rules cover conditions, inheritance, overrides, and nested wildcard paths
    When restore, validation, specification preview, example selection, both copy modes, export, import, and another restore are exercised
    Then every consumer uses the same canonical typed values and effective-rule semantics
    And the second restore is idempotent
    And runtime coverage proves the specification builder does not require parameter fallback for migrated rules

