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

  # Modular browser runtime adapters 009
  Scenario Outline: Modular browser runtime adapters 009
    Given a changed file belongs to <layered_boundary>
    When focused browser verification is planned
    Then scheduled browser behavior is <scheduled_behavior>
    And the monolithic layered-schema adapter is not scheduled
    And terminal verification still executes every layered-schema target exactly once

    Examples:
      | layered_boundary              | scheduled_behavior                         |
      | canonical schema model        | canonical schema core targets              |
      | canonical schema editor       | canonical schema editor targets            |
      | layered schema composition    | layered schema composition targets         |
      | page group structure          | page group structure targets               |
      | selective profile inheritance | selective profile inheritance targets only |

  # Modular browser runtime adapters 010
  Scenario: Modular browser runtime adapters 010
    Given several browser observations use the same program and compatible harness configuration
    And those browser observations have one owning pack
    When registry validation and exact-pack planning run
    Then every compatible multi-observation group declares one non-empty session batch
    And the plan schedules one browser process per declared compatible group
    And the process launch count is lower than the logical observation count
    And every logical observation retains fresh page and storage state, its own timing, and its own pass or failure result

  # Modular browser runtime adapters 011
  Scenario Outline: Modular browser runtime adapters 011
    Given measured browser adapter is <runtime_outlier>
    And a browser adapter exceeds the declared maximum single-target p90
    When its registry declaration is validated
    Then that adapter declares at least two independently selectable behavior targets
    And a focused target excludes unrelated behavior in that adapter
    And compatible targets declare a reusable session batch

    Examples:
      | runtime_outlier                    |
      | layered schema workflow adapter    |
      | durable repository corpus adapter  |
      | branding workflow polish adapter   |

  # Modular browser runtime adapters 012
  Scenario: Modular browser runtime adapters 012
    Given a browser target owns an isolated Chrome profile
    When the target starts, finishes, or fails
    Then page and storage state are clean before its assertions run
    And profile cleanup retries bounded transient filesystem contention
    And exhausted cleanup reports the logical target and profile path
    And cleanup failure does not discard independent target results

  # Modular browser runtime adapters 013
  Scenario: Modular browser runtime adapters 013
    Given an installed browser workflow is divided into independently selectable targets
    When those targets replace the original adapter in exact verification
    Then every original acceptance assertion leaf is assigned to exactly one target
    And each target performs the production UI operation and observation for every assigned leaf
    And the union of target evidence equals the original installed workflow evidence without relaxed handler branches
    And a constant result, a renamed smoke observation, or one predicate reused for unrelated leaves blocks verification

  # Modular browser runtime adapters 014
  Scenario Outline: Modular browser runtime adapters 014
    Given <owning_pack> owns <logical_observations> compatible observations of the shared side-panel browser program
    When terminal browser verification is planned
    Then those observations are scheduled in one browser process
    And each observation receives its declared configuration
    And every logical observation retains fresh page and storage state, its own timing, and its own pass or failure result
    And the process emits every observation key required by that owning pack

    Examples:
      | owning_pack | logical_observations |
      | capture     | 5                    |
      | schemas     | 46                   |
      | defects     | 9                    |
