Feature: Settled candidate final verification

  Background:
    Given one user-approved task has a specification commit and a stable task name

  # Settled candidate final verification 001
  Scenario Outline: Settled candidate final verification 001
    Given <review_role> receives a candidate that may still change
    When that role completes <review_work>
    Then the role runs only focused checks that can observe its changes
    And the candidate advances as review-ready to <next_role>
    And review-ready evidence records the task, base, candidate, changed paths, focused scope, result, and timestamps
    And the candidate does not claim final regression evidence

    Examples:
      | review_role | review_work                         | next_role  |
      | coder       | implementation and focused repair  | refactorer |
      | refactorer  | structure and property review      | architect  |

  # Settled candidate final verification 002
  Scenario: Settled candidate final verification 002
    Given the architect has completed architecture review, applicable quality analysis, focused checks, and every resulting repair on one candidate tree
    When the architect seals that tree for final verification
    Then one fresh canonical run executes all 20 packs with properties and the package check
    And its durable evidence binds the specification base, task, candidate tree, complete plan, artifact, toolchain, receipt, and timestamps
    And only that passing sealed tree may receive the completion handoff for integration

  # Settled candidate final verification 003
  Scenario Outline: Settled candidate final verification 003
    Given a sealed candidate has passing final verification evidence
    When <later_change> occurs before integration
    Then the evidence effect is <evidence_effect>
    And the required next action is <required_action>

    Examples:
      | later_change                                                        | evidence_effect                         | required_action                                      |
      | production, test, build, registry, runner, or workflow input changes | final evidence is invalid               | settle the changed tree and run all 20 packs freshly |
      | documentation-only recording preserves every bound identity          | final product evidence remains eligible | promote or integrate without another product run     |

  # Settled candidate final verification 004
  Scenario: Settled candidate final verification 004
    Given one task in the fresh final run fails
    When the exact cause is recorded, repaired, and proved with its smallest causal regression
    Then the changed candidate runs all 20 packs with properties and the package check freshly
    And the failed result remains recorded
    And no retry, lower-concurrency run, carried passing leaf, or unrelated receipt can turn the failure green

  # Settled candidate final verification 005
  Scenario Outline: Settled candidate final verification 005
    Given a candidate is review-ready without passing final evidence
    When <requested_action> is requested
    Then the workflow result is <workflow_result>

    Examples:
      | requested_action                                  | workflow_result                                   |
      | focused refactorer or architect review            | permit the next named review role                 |
      | integration into the accepted branch              | block because final evidence is absent             |
      | completion broadcast to the specifier             | block because final evidence is absent             |
      | promotion of another task or base receipt as final | block because its bound identity does not match    |

  # Settled candidate final verification 006
  Scenario Outline: Settled candidate final verification 006
    Given the historical <lineage> used <successful_full_runs> successful full runs before safety completion
    When the same role changes are scheduled through settled candidate final verification
    Then focused checks run while the candidate is changing
    And one successful full run occurs after the last review change
    And the modeled avoided successful full runs are <avoided_full_runs>

    Examples:
      | lineage                    | successful_full_runs | avoided_full_runs |
      | Command Palette controller | 3                    | 2                  |
      | workspace-tabs controller  | 2                    | 1                  |

  # Settled candidate final verification 007
  Scenario: Settled candidate final verification 007
    Given approval, role handoffs, verification receipts, repairs, and integration already have durable timestamps
    When a VTD-015 delivery or its next applicable slice completes
    Then the scorecard reports approval-to-integration time and elapsed role intervals
    And it reports focused verification time, successful and invalidated full runs, failures, repairs, reruns, and final-gate time
    And it confirms every terminal evidence leaf and the package check remain present
    And a VTD slice adds zero to completed-feature count
    And the user receives a continue, adjust, or stop recommendation before another enabling slice is activated

  # Settled candidate final verification 008
  Scenario: Settled candidate final verification 008
    Given VTD-015 must change the workflow that governs its own delivery
    When the VTD-015 candidate moves through coder, refactorer, architect, and specifier
    Then its handoffs obey the previously integrated verification protocol
    And the new review-ready protocol remains inactive until VTD-015 is integrated
    And VTD-017 shared-artifact parallel execution is the first live payback measurement
    And no bootstrap exception bypasses current durable evidence or integration safety
