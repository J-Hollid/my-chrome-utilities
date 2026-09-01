Feature: Verification process bootstrap fast path

  Background:
    Given a user-approved process-only transition has an exact base commit and stable task
    And the transition changes no product behavior

  # Verification process bootstrap fast path 001
  Scenario: Verification process bootstrap fast path 001
    Given the old evidence route would execute the full verification-process parent workload
    When the coder verifies the bootstrap candidate
    Then an independent transition harness selects the affected process slices from the exact base and candidate plans
    And it includes every changed-path owner, prerequisite, consumer, property check, and package check
    And it executes no unselected parent-pack, product, browser, or all-runnable-pack task
    And the transition authority expires when the exact accepted candidate reaches QA

  # Verification process bootstrap fast path 002
  Scenario: Verification process bootstrap fast path 002
    Given readiness has produced the exact bootstrap task plan and calibrated duration forecast
    When the bootstrap runner prepares, executes, and records the candidate proof
    Then the forecast, launch set, task receipt, and review record contain the same task identities
    And every selected task starts at most once for that exact run
    And a task-set or identity mismatch launches zero planned tasks and reports the exact mismatch

  # Verification process bootstrap fast path 003
  Scenario Outline: Verification process bootstrap fast path 003
    Given bootstrap eligibility depends on <early_condition>
    When the independent preflight checks the exact candidate
    Then an invalid condition reports its exact cause before an expensive task starts
    And a valid condition does not add a parent-pack task

    Examples:
      | early_condition                                      |
      | conservation generation and source identity          |
      | acceptance command ownership and handler closure     |
      | incident, regression, and repair-protocol task keys  |
      | mutation inventory and target command scope          |
      | durable run, receipt, and promotion state            |

  # Verification process bootstrap fast path 004
  Scenario Outline: Verification process bootstrap fast path 004
    Given mutation discovery finds <mutant_population> for one selected Clojure source
    When the bootstrap mutation check runs
    Then it performs <mutation_action>
    And it does not start the legacy verification-process acceptance workload

    Examples:
      | mutant_population        | mutation_action                                      |
      | zero applicable mutants  | record the empty result without a test command       |
      | applicable mutants       | run only the declared target-specific test command   |

  # Verification process bootstrap fast path 005
  Scenario: Verification process bootstrap fast path 005
    Given a selected aggregate names child contracts that are also selected tasks
    When the exact bootstrap plan executes
    Then each child contract executes once as its own task
    And the aggregate validates the bound child identities and results without executing them again
    And a missing, changed, failed, or duplicate child result fails the aggregate

  # Verification process bootstrap fast path 006
  Scenario Outline: Verification process bootstrap fast path 006
    Given a client loses output for an exact bootstrap run in <durable_state>
    When recovery queries the candidate, plan, incident, and run identities
    Then recovery performs <recovery_action>
    And it does not start a duplicate run
    And a candidate, tree, plan, toolchain, or task identity change blocks reuse

    Examples:
      | durable_state  | recovery_action                                      |
      | running        | attach to or wait for the existing run               |
      | completed      | validate and use the existing exact receipt          |
      | failed         | report the stored failure once for bounded repair    |

  # Verification process bootstrap fast path 007
  Scenario: Verification process bootstrap fast path 007
    Given the process candidate is not settled for final proof
    When implementation or required structure review changes its behavior-bearing tree
    Then only direct bootstrap development checks run for that intermediate candidate
    And the final bootstrap proof starts once after the last required repair
    And an unchanged refactorer or architect validates the bound receipt without repeating its tasks

  # Verification process bootstrap fast path 008
  Scenario: Verification process bootstrap fast path 008
    Given the bootstrap forecast exceeds five minutes or falls back to the parent verification-process workload
    When the workflow evaluates launch eligibility
    Then it launches zero planned tasks
    And it reports the exact task or ownership expansion
    And the coder performs bounded slice decomposition under the same approved task
    And the workflow does not automatically use the old broad route

  # Verification process bootstrap fast path 009
  Scenario: Verification process bootstrap fast path 009
    Given the exact settled candidate passes the independent bootstrap proof and package check
    When the architect and specifier validate its receipt for QA integration
    Then the receipt binds the base, candidate, tree, task plan, toolchain, artifact, and task results
    And the candidate can advance only to QA without the old parent-pack run
    And the ordinary user-requested master gate remains unchanged
