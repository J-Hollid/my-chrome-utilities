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
    Then Product listing version 3 becomes the existing schema destination
    And the destination stage replaces the dialog
    And the destination stage shows a compact Product listing version 3 summary
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
