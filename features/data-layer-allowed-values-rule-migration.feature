# mutation-stamp: sha256=494f2b582141dc41014db6f626077b39eb21347d514b90e7aca96bd6fae8d37c
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-16T17:14:55.854443097Z","feature_name":"Data layer Allowed values rule migration","feature_path":"features/data-layer-allowed-values-rule-migration.feature","background_hash":"23890abc6a815907199b4feaff1a639371779356352f89aa03e33d2315b71f22","implementation_hash":"3e89a4421c73fcdc2fe2b662d64196c43f00f628","scenarios":[{"index":1,"name":"Data layer Allowed values rule migration 002","scenario_hash":"e9e42327fa76b517e173de8750f69eaf85f06acea592495aea7dc0d4e6190ba0","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-16T17:14:55.854443097Z"},{"index":2,"name":"Data layer Allowed values rule migration 003","scenario_hash":"152c603c8425482f4becf6271dc9907aae3e9fb5ba744b3d182850e24b8f5331","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-16T17:14:55.854443097Z"},{"index":3,"name":"Data layer Allowed values rule migration 004","scenario_hash":"abe820ac1e504f51e2eb60797ecc19d700706901e08d3648609b08c671b38dfb","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-16T17:14:55.854443097Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer Allowed values rule migration

  Background:
    Given Generic pageview revision 4 declares String error_type, Number quantity, and Boolean enabled properties
    And its stored rules may contain legacy comma-separated Allowed values parameters

  # Data layer Allowed values rule migration 001
  Scenario: Data layer Allowed values rule migration 001
    Given /error_type has local rule Allowed values for error_type version 1
    And the rule has parameters technical,validation,authentication,login,notification without structured allowed values
    And other enabled Required rules retain their severities and page_type conditions
    When the Schema Library is restored after the extension upgrade
    Then the rule has structured String values technical, validation, authentication, login, and notification in order
    And the obsolete Allowed values parameters are removed
    And its id, name, version, property path, severity, condition, and enabled state are unchanged
    And the normalized Schema Library is saved without creating a schema draft or revision
    When /error_type is selected in the specification builder
    Then Allowed values displays technical | validation | authentication | login | notification

  # Data layer Allowed values rule migration 002
  Scenario Outline: Data layer Allowed values rule migration 002
    Given <property_path> has declared type <property_type>
    And its legacy Allowed values parameters are <parameters>
    When the rule is migrated
    Then its structured allowed values are <typed_values>
    And validation of declared-type values has the same pass and fail outcomes as before migration

    Examples:
      | property_path | property_type | parameters             | typed_values                         |
      | /error_type   | String        | technical, validation  | String technical and validation      |
      | /quantity     | Number        | 1, 2                    | Number 1 and 2                        |
      | /enabled      | Boolean       | true, false             | Boolean true and false                |
      | /context      | Unspecified   | 1, true                  | String 1 and true                     |

  # Data layer Allowed values rule migration 003
  Scenario Outline: Data layer Allowed values rule migration 003
    Given a parameter-backed Allowed values rule exists in <schema_surface>
    When the complete Schema Library is migrated
    Then that surface stores the canonical structured rule exactly once
    And <source_behavior> uses the migrated values
    And no published or historical version number changes

    Examples:
      | schema_surface             | source_behavior                         |
      | current revision 4         | current validation and specification    |
      | historical revision 2      | revision 2 validation and specification |
      | working draft              | working-draft validation and specification |
      | inherited parent revision 3 | effective child validation and specification |

  # Data layer Allowed values rule migration 004
  Scenario Outline: Data layer Allowed values rule migration 004
    Given the operator configures Allowed values technical and validation through <authoring_surface>
    When the rule is saved
    Then the new rule stores structured String values technical and validation
    And it does not store those values as comma-separated parameters
    And reopening the authoring surface restores both choices

    Examples:
      | authoring_surface             |
      | schema property rule picker   |
      | guided validation authoring   |
      | reusable Rule Library editor  |

  # Data layer Allowed values rule migration 005
  Scenario: Data layer Allowed values rule migration 005
    Given an Allowed values rule has structured values technical and validation plus stale parameters legacy
    When the rule is normalized
    Then the structured values remain authoritative and unchanged
    And the stale parameters are removed
    Given another Number rule has parameters 1,not-a-number,2
    When that rule is considered for migration
    Then no partial structured values are written
    And the original rule remains available with a visible migration issue identifying not-a-number

  # Data layer Allowed values rule migration 006
  Scenario: Data layer Allowed values rule migration 006
    Given a legacy rule encodes its property path before its comma-separated values
    When the rule is migrated
    Then the canonical property path is stored separately from its typed allowed values
    And neither the property path nor its separator remains in the value list
    And wildcard nested property paths resolve against the owning schema definition

  # Data layer Allowed values rule migration 007
  Scenario: Data layer Allowed values rule migration 007
    Given unconditional, conditional, local, inherited, enabled, disabled, and overridden Allowed values rules have been migrated
    When effective Allowed values are derived
    Then intersections, condition labels, rule order, duplicate removal, disabling, and inheritance overrides behave as before migration
    And the specification preview, Allowed value example choices, Spreadsheet export, and Rich table export use the same effective structured values
    And Required and other non-Allowed-values rules are unchanged

  # Data layer Allowed values rule migration 008
  Scenario: Data layer Allowed values rule migration 008
    Given every migratable Allowed values rule is canonical
    When the Schema Library is restored, exported, imported, and restored again
    Then no additional migration change is produced
    And exported schemas and reusable rules contain structured allowed values without obsolete value parameters
    And rule identities, versions, attachments, conditions, severities, messages, and enabled states remain stable

