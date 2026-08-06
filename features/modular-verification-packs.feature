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

  # Modular verification packs 008
  Scenario Outline: Modular verification packs 008
    Given changed verification input is <verification_input>
    And its registered consumers are <registered_consumers>
    When impacted verification packs are selected
    Then selected packs are <selected_packs>
    And semantic dependant expansion is <dependant_expansion>

    Examples:
      | verification_input                    | registered_consumers | selected_packs | dependant_expansion |
      | layered schema usability helper       | layered schema       | layered schema | excluded            |
      | flow graph runtime helper             | flow graph           | flow graph      | excluded            |
      | shared headless Chrome harness        | every browser pack   | every browser pack | excluded         |

  # Modular verification packs 009
  Scenario: Modular verification packs 009
    Given registered tests import verification support helpers
    When verification-pack validation runs
    Then every imported helper declares each consuming pack
    And every declared consumer imports that helper through a registered test
    And an undeclared or stale helper consumer blocks verification with the helper path and pack identity

  # Modular verification packs 010
  Scenario Outline: Modular verification packs 010
    Given a changed file belongs to <layered_boundary>
    When impacted verification packs are selected
    Then the primary selected pack is <primary_pack>
    And selected downstream scope is <downstream_scope>
    And unrelated layered boundaries are excluded

    Examples:
      | layered_boundary              | primary_pack                  | downstream_scope       |
      | canonical schema model        | canonical schema core         | declared dependants    |
      | canonical schema editor       | canonical schema editor       | none                   |
      | layered schema composition    | layered schema composition    | declared dependants    |
      | page group structure          | page group structure          | declared dependants    |
      | selective profile inheritance | selective profile inheritance | none                   |

  # Modular verification packs 011
  Scenario: Modular verification packs 011
    Given delivery CSS and assets declare their runtime consumer packs
    When one delivery CSS or asset path changes
    Then impacted verification includes its declared runtime consumers and their semantic dependants
    And packs without a declared consumer path are excluded
    But a delivery path used by every pack remains globally impactful

  # Modular verification packs 012
  Scenario: Modular verification packs 012
    Given verification receipts include current and rejected runtime records
    When verification throughput is reported
    Then every runnable pack has an exact-pack and representative changed-path row
    And each row reports task counts, measured coverage, projected duration, and dependant fan-out
    And rejected receipts are counted by receipt version, runtime mismatch, and incomplete task result

  # Modular verification packs 013
  Scenario Outline: Modular verification packs 013
    Given measured verification metric is <metric_state>
    When verification performance budgets are checked
    Then the budget result is <budget_result>
    And diagnostic detail is <diagnostic_detail>

    Examples:
      | metric_state                                   | budget_result | diagnostic_detail                                  |
      | browser target p90 is within its declared limit | pass          | target identity and measured p90                  |
      | exact pack duration exceeds its declared limit  | fail          | pack identity, measured duration, and limit       |
      | changed path fan-out exceeds its declared limit | fail          | changed path, selected packs, and allowed fan-out |

  # Modular verification packs 014
  Scenario: Modular verification packs 014
    Given an exact verification plan and evidence contract are prepared
    When checkpoint preflight runs
    Then registry validation, canonical plan validation, receipt-schema validation, artifact validation, and evidence-recording validation finish before the first verification task starts
    And a preflight failure exits without starting unit, property, acceptance, or browser tasks
    And the failure identifies the incompatible contract field or recording limit

  # Modular verification packs 015
  Scenario Outline: Modular verification packs 015
    Given browser verification produces <generated_output>
    When it runs in <execution_mode>
    Then the output destination is <output_destination>
    And tracked delivery evidence is <tracked_evidence_result>

    Examples:
      | generated_output            | execution_mode          | output_destination                 | tracked_evidence_result |
      | screenshots and reports     | ordinary verification   | an isolated temporary run directory | unchanged              |
      | screenshots and reports     | explicit fixture update | the declared delivery evidence path | updated                |
      | Chrome profile and downloads | ordinary verification  | an isolated temporary run directory | unchanged              |

  # Modular verification packs 016
  Scenario Outline: Modular verification packs 016
    Given a checkpoint receipt contains independently identified passing tasks and <remaining_result>
    And the resumed checkpoint has <resume_identity>
    When bounded checkpoint resume runs
    Then prior passing tasks are <passing_task_result>
    And tasks selected to run are <selected_tasks>
    And the combined receipt records reused and fresh task provenance

    Examples:
      | remaining_result             | resume_identity                              | passing_task_result | selected_tasks                 |
      | one transient failed target  | identical commit, artifact, plan, and toolchain | reused            | the failed target only         |
      | one incomplete target        | identical commit, artifact, plan, and toolchain | reused            | the incomplete target only     |
      | one transient failed target  | a different commit, artifact, plan, or toolchain | rejected          | every required checkpoint task |

  # Modular verification packs 017
  Scenario: Modular verification packs 017
    Given accepted timing history exists for every runnable pack and registered browser target
    When verification performance budgets are refreshed
    Then each default budget is derived from the target's measured percentile and declared tolerance
    And an unmeasured target uses an explicit bootstrap budget identified as provisional
    And a permissive catch-all limit cannot hide a regression in a measured pack or target
    And the report compares current measurements with the accepted baseline
