Feature: Modular Chrome utility architecture

  Background:
    Given the extension contains independently useful Chrome workflow utilities

  # Modular Chrome utility architecture 001
  Scenario: Modular Chrome utility architecture 001
    When the extension shell is composed
    Then each utility is registered through one public module entry point
    And the module entry point declares its identity, commands, panels, lifecycle, and storage ownership
    And the shell depends on utility entry points rather than utility implementation modules
    And adding an unrelated utility does not require editing another utility's implementation

  # Modular Chrome utility architecture 002
  Scenario Outline: Modular Chrome utility architecture 002
    Given utility module <utility_module> owns <owned_capability>
    When module boundaries are inspected
    Then <owned_capability> is reachable through <utility_module>'s public entry point
    And unrelated utility modules do not import its internal files

    Examples:
      | utility_module  | owned_capability                          |
      | command palette | command discovery and execution          |
      | hotkeys         | key bindings and hotkey editing          |
      | data layer      | capture and data-layer workflow entry    |

  # Modular Chrome utility architecture 003
  Scenario Outline: Modular Chrome utility architecture 003
    Given data-layer module <data_layer_module> owns <owned_capability>
    When data-layer boundaries are inspected
    Then <owned_capability> is exposed through that module's public interface
    And its core behavior is testable without constructing the complete side panel

    Examples:
      | data_layer_module | owned_capability                    |
      | capture           | source observation and sessions     |
      | live inspection   | event feed and event inspection     |
      | event library     | templates and template revisions    |
      | schemas           | authoring, assignment, and validation |
      | defect reporting  | report composition and defect storage |
      | replay            | sequence definition and execution   |

  # Modular Chrome utility architecture 004
  Scenario Outline: Modular Chrome utility architecture 004
    Given code belongs to architectural layer <layer>
    When its imports are inspected
    Then allowed dependencies are <allowed_dependencies>
    And forbidden dependencies are <forbidden_dependencies>

    Examples:
      | layer               | allowed_dependencies                         | forbidden_dependencies                         |
      | core                | same-module core                             | DOM, Chrome APIs, storage, and browser adapters |
      | application         | same-module core and declared contracts      | concrete DOM, Chrome, and storage implementations |
      | browser adapter     | same-module application, core, and platform contracts | another utility's internal modules       |
      | shell composition   | public utility entry points and platform adapters | utility implementation modules              |

  # Modular Chrome utility architecture 005
  Scenario: Modular Chrome utility architecture 005
    Given each utility owns persistent state
    When storage boundaries are inspected
    Then each utility has an explicit storage namespace
    And storage serialization is hidden behind that utility's public contract
    And one utility cannot read or mutate another utility's storage representation directly
    And shared browser storage access is supplied through a platform adapter

  # Modular Chrome utility architecture 006
  Scenario: Modular Chrome utility architecture 006
    When an import crosses a forbidden module or layer boundary
    Then architecture verification fails with the importing file and forbidden dependency
    And no allow-list entry is added without declaring the required module contract

  # Modular Chrome utility architecture 007
  Scenario: Modular Chrome utility architecture 007
    Given the current extension behavior is captured by unit, acceptance, and browser tests
    When utilities are moved behind modular entry points
    Then commands, hotkeys, panels, storage, schema workflows, event workflows, defect workflows, and replay remain available
    And the packaged extension retains the same manifest capabilities and browser entry points
    And restructuring does not alter stored user data or published schema semantics

