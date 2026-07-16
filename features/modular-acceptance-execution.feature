Feature: Modular acceptance execution

  Background:
    Given acceptance features and handlers are assigned to verification packs

  # Modular acceptance execution 001
  Scenario Outline: Modular acceptance execution 001
    Given acceptance scope is <acceptance_scope>
    When acceptance execution is planned
    Then selected features are <selected_features>
    And selected handlers are <selected_handlers>

    Examples:
      | acceptance_scope | selected_features                  | selected_handlers                 |
      | one feature      | that feature                       | its owning pack handlers          |
      | one pack         | every feature owned by that pack  | that pack handlers                |
      | terminal full    | every registered feature          | handlers from every registered pack |

  # Modular acceptance execution 002
  Scenario: Modular acceptance execution 002
    Given a feature is assigned to the schemas verification pack
    When its generated acceptance entry point runs
    Then it loads schema handlers and declared shared handlers
    And command-palette, hotkey, event-library, defect, and replay handlers are not loaded
    And an unsupported step still fails the acceptance execution

  # Modular acceptance execution 003
  Scenario: Modular acceptance execution 003
    Given several selected features share one runtime observation
    When those features execute sequentially in one acceptance session
    Then their generated entry points run in deterministic feature order
    And the runtime observation is created once for that build artifact and pack
    And each scenario receives fresh scenario state
    And a failed scenario stops the session with its feature and scenario identity

  # Modular acceptance execution 004
  Scenario: Modular acceptance execution 004
    When the normal acceptance pipeline runs
    Then feature parsing and entry-point generation complete before acceptance execution starts
    And generation and execution remain sequential
    And generated entry points do not import a global all-feature handler registry
    And acceptance execution does not invoke unit or build commands

  # Modular acceptance execution 005
  Scenario: Modular acceptance execution 005
    Given a feature or handler is added without a verification-pack assignment
    When acceptance planning runs
    Then acceptance execution is blocked
    And the unassigned feature or handler is identified

  # Modular acceptance execution 006
  Scenario: Modular acceptance execution 006
    Given changed Gherkin belongs to one verification pack
    When focused acceptance is requested for the change
    Then every changed feature in that pack is parsed, generated, and executed
    And unchanged unrelated feature packs are not executed
    And terminal full acceptance still executes every registered feature

