Feature: Modular verification packs

  Background:
    Given every utility module has one registered verification pack

  # Modular verification packs 001
  Scenario: Modular verification packs 001
    When a verification pack is inspected
    Then it declares owned source paths, direct module dependencies, unit tests, property tests, acceptance features, acceptance handlers, and browser adapters
    And each declared path exists
    And each source file, test, feature, handler, and browser adapter has exactly one owning pack

  # Modular verification packs 002
  Scenario Outline: Modular verification packs 002
    Given changed files belong to <changed_boundary>
    When impacted verification packs are selected
    Then selected packs are <selected_packs>
    And unrelated packs are <unrelated_pack_result>

    Examples:
      | changed_boundary                   | selected_packs                         | unrelated_pack_result |
      | schema core                        | schemas and declared dependants        | excluded              |
      | event-library browser adapter      | event library and shell integration    | excluded              |
      | shared browser-storage platform    | every pack using browser storage       | excluded              |
      | shell utility registry             | every registered utility and shell integration | none excluded  |

  # Modular verification packs 003
  Scenario: Modular verification packs 003
    Given a verification session selects one or more packs
    When its tests run
    Then TypeScript is checked and compiled once before selected test processes start
    And child unit, property, acceptance, and browser commands do not start another build
    And no acceptance handler invokes a unit, property, acceptance, or build command
    And every selected test uses the same immutable build artifact

  # Modular verification packs 004
  Scenario Outline: Modular verification packs 004
    Given verification phase is <verification_phase>
    When verification gates are selected
    Then required scope is <required_scope>

    Examples:
      | verification_phase       | required_scope                                                      |
      | coder implementation     | impacted packs and their declared dependencies                      |
      | refactorer review        | impacted packs with relevant coverage and property checks           |
      | architect terminal review | every registered pack against one clean packaged artifact          |

  # Modular verification packs 005
  Scenario: Modular verification packs 005
    Given impacted-pack verification has passed during implementation and refactoring
    When architect terminal review runs
    Then every registered unit, property, acceptance, browser, and shell-integration gate runs once
    And differential mutation checks changed source and changed Gherkin examples
    And no successful focused result can replace the complete terminal regression gate

  # Modular verification packs 006
  Scenario Outline: Modular verification packs 006
    Given pack registry defect is <registry_defect>
    When registry validation runs
    Then verification is blocked with reason <blocked_reason>

    Examples:
      | registry_defect                         | blocked_reason                                  |
      | source path has no owner                | Assign every source path to one pack            |
      | feature has two owners                  | Assign every feature to exactly one pack        |
      | declared dependency pack is missing     | Register every direct dependency                |
      | test path does not exist                | Correct the missing test path                   |
      | changed shared path selects no dependant | Include every declared dependant pack          |

  # Modular verification packs 007
  Scenario: Modular verification packs 007
    Given a pack's unit test appears in focused and aggregate verification
    When the aggregate verification plan is created
    Then that test is scheduled once
    And suite composition references the owning pack instead of repeating test filenames

