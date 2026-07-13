# mutation-stamp: sha256=20368e47bf14f509c935c841c75f521e5d3e3599ca77f2ecaa70fd8393633300
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-12T22:26:29.177739908Z","feature_name":"Data layer guided validation schema picker dialog","feature_path":"features/data-layer-guided-validation-schema-picker-dialog.feature","background_hash":"55641602a839f3adc896976d4485e27aaf8c277a851ce681d8b276eeeb013394","implementation_hash":"sha256:guided-schema-picker-architect-v1","scenarios":[{"index":1,"name":"Data layer guided validation schema picker dialog 002","scenario_hash":"70ac376e5b95e86e352a60758f3863f1103a95a5a96c854137c1e5fa2c62e186","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-12T22:26:29.177739908Z"},{"index":2,"name":"Data layer guided validation schema picker dialog 003","scenario_hash":"c420c5ef50320de27fcc13c857229a51b7a3fa82fc45daf48493ab230ad1ed99","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-12T22:26:29.177739908Z"},{"index":5,"name":"Data layer guided validation schema picker dialog 006","scenario_hash":"c95574841b409c5b6523ee058512f0373271113ffa92df185ccae4fbb86547d4","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-12T22:26:29.177739908Z"},{"index":6,"name":"Data layer guided validation schema picker dialog 007","scenario_hash":"097b3db02c11dd115793b90872234474fc9c62dd4f990239e3e7f844ef642640","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-12T22:26:29.177739908Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer guided validation schema picker dialog

  Background:
    Given the guided validation schema destination stage is displayed at 320 CSS px wide

  # Data layer guided validation schema picker dialog 001
  Scenario: Data layer guided validation schema picker dialog 001
    Given the schema picker is closed
    When the destination layout is inspected
    Then schema search and schema results are absent from the guided flow
    And existing schema rows do not expand or displace the destination stage

  # Data layer guided validation schema picker dialog 002
  Scenario Outline: Data layer guided validation schema picker dialog 002
    Given <schema_count> existing schemas are available
    When the operator activates Add to an existing schema
    Then a focused schema-picker dialog opens above the guided flow
    And the dialog contains schema search and the matching schema results
    And the result list scrolls within the bounded dialog
    And opening the dialog does not expand the guided flow to fit <schema_count> schemas
    And background guided-flow controls do not receive keyboard focus

    Examples:
      | schema_count |
      | 50           |

  # Data layer guided validation schema picker dialog 003
  Scenario Outline: Data layer guided validation schema picker dialog 003
    Given the schema-picker dialog contains unequal schema names, versions, targets, properties, events, domains, and paths
    When the operator enters <query> in schema search
    Then only schemas matching <matched_metadata> are displayed
    And the result count identifies the visible and total schema counts

    Examples:
      | query           | matched_metadata       |
      | Product listing | schema name            |
      | version 4       | schema version         |
      | payload         | validation target      |
      | page_type       | property path          |
      | shop.example    | assignment domain      |
      | /products/*     | assignment path        |

  # Data layer guided validation schema picker dialog 004
  Scenario: Data layer guided validation schema picker dialog 004
    Given query missing-schema filters the inventory to zero schemas
    When the empty result is displayed
    Then it states that no schemas match the current search
    And Clear search restores the unfiltered schema results
    And the guided validation draft remains unchanged

  # Data layer guided validation schema picker dialog 005
  Scenario: Data layer guided validation schema picker dialog 005
    Given the schema-picker dialog contains compatible and incompatible results
    When schema results are displayed
    Then each result presents schema name, version, target, property compatibility, and assignment scope summary
    And incompatible results identify why they cannot be selected
    And keyboard result navigation skips incompatible results

  # Data layer guided validation schema picker dialog 006
  Scenario Outline: Data layer guided validation schema picker dialog 006
    Given compatible schema Product listing version 3 has keyboard focus
    When the operator completes selection with <selection_input>
    Then Product listing becomes the existing schema destination by stable schema identity
    And the destination stage replaces the dialog
    And the destination stage shows a compact Product listing current version 3 summary
    And Change existing schema receives focus
    And schema-derived prefill rules are applied to the guided validation draft

    Examples:
      | selection_input |
      | Enter           |
      | Select button   |

  # Data layer guided validation schema picker dialog 007
  Scenario Outline: Data layer guided validation schema picker dialog 007
    Given the schema-picker dialog is open above an unchanged guided validation draft
    When the operator dismisses it with <dismissal>
    Then no schema destination or inferred value changes
    And the dialog is dismissed
    And keyboard position is restored to the picker launcher

    Examples:
      | dismissal   |
      | Escape      |
      | Close button |

  # Data layer guided validation schema picker dialog 008
  Scenario: Data layer guided validation schema picker dialog 008
    Given Product listing has current revision 4, 3 historical revisions, and a working draft
    When the schema-picker dialog is opened
    Then exactly 1 Product listing result is displayed
    And the result identifies current revision 4 and the pending working draft
    And historical revisions are absent from selectable results
    And selecting Product listing references its stable schema identity
