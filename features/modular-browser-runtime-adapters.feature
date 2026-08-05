Feature: Modular browser runtime adapters

  Background:
    Given browser-runtime behavior is assigned to utility verification packs

  # Modular browser runtime adapters 001
  Scenario: Modular browser runtime adapters 001
    When a utility browser adapter is inspected
    Then it uses a shared browser and DOM harness
    And it imports only its utility's public browser entry point and declared platform contracts
    And its fixtures, observations, and assertions are owned by that utility's verification pack
    And it does not execute another utility's browser scenarios

  # Modular browser runtime adapters 002
  Scenario Outline: Modular browser runtime adapters 002
    Given browser scope is <browser_scope>
    When browser verification runs
    Then executed behavior is <executed_behavior>

    Examples:
      | browser_scope       | executed_behavior                                      |
      | schemas pack        | schema editor, validation, and schema transfer         |
      | event-library pack  | template editing, revisions, and template transfer     |
      | defect pack         | report composition, copy, and defect persistence       |
      | shell integration   | utility registration, navigation, focus, and shared layout |

  # Modular browser runtime adapters 003
  Scenario: Modular browser runtime adapters 003
    Given one utility browser adapter requires a local HTTP fixture
    When that adapter starts and stops
    Then the fixture lifecycle is owned by the shared harness
    And the selected utility receives the fixture endpoint through a platform contract
    And no other utility adapter must start to satisfy the selected adapter

  # Modular browser runtime adapters 004
  Scenario: Modular browser runtime adapters 004
    Given all utility browser adapters pass independently
    When shell integration verification runs
    Then the packaged side panel registers every utility once
    And shared navigation, focus, layout, Chrome API wiring, and storage adapters are exercised
    And shell integration does not repeat each utility's complete behavior suite

  # Modular browser runtime adapters 005
  Scenario: Modular browser runtime adapters 005
    Given a utility browser adapter is selected at 320 CSS px wide
    When its rendered workflow is exercised
    Then its own responsive, focus, visibility, and accessibility outcomes are verified
    And unrelated utility DOM fixtures are absent

  # Modular browser runtime adapters 006
  Scenario Outline: Modular browser runtime adapters 006
    Given adapter execution mode is <execution_mode>
    When registered browser targets are selected
    Then executed targets are <executed_targets>
    And Chrome session use is <session_use>
    And evidence identity is <evidence_identity>

    Examples:
      | execution_mode          | executed_targets                         | session_use                           | evidence_identity             |
      | focused correction      | only the requested behavior target       | one session for that target           | requested target              |
      | exact pack verification | every target owned by the selected pack  | compatible targets share one session  | each logical target           |
      | terminal verification   | every registered target exactly once     | compatible targets share one session  | each logical target and pack  |

  # Modular browser runtime adapters 007
  Scenario: Modular browser runtime adapters 007
    Given several browser observations use the same program and compatible harness configuration
    When their owning pack is verified
    Then the observation program starts once for the compatible batch
    And each observation receives fresh page and storage state
    And every required observation key is emitted under its logical observation identity
    And a failed observation identifies its own key without discarding independent observation results

  # Modular browser runtime adapters 008
  Scenario: Modular browser runtime adapters 008
    Given a browser adapter exceeds the declared maximum single-target p90
    When browser registry validation runs
    Then that adapter declares at least two independently selectable behavior targets
    And compatible targets declare a reusable session batch
    And selecting one target does not execute the adapter's unrelated behavior
