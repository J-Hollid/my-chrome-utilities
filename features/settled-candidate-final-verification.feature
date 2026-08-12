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
    When the architect seals that tree for QA integration
    Then the role runs only focused checks that can observe its changes
    And only that exact tree may receive a QA-ready handoff with bound focused evidence
    And the specifier may fast-forward that exact tree into QA
    And no full regression or master completion is claimed

  # Settled candidate final verification 003
  Scenario Outline: Settled candidate final verification 003
    Given a sealed candidate has passing final verification evidence
    When <later_change> occurs before master promotion
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
      | QA integration after an exact architect QA-ready handoff | permit only the QA fast-forward              |
      | integration into master                           | block because final evidence is absent             |
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

  # Settled candidate final verification 009
  Scenario: Settled candidate final verification 009
    Given the user explicitly requests master integration and QA contains one or more QA-ready tasks after master
    When the specifier freezes the exact QA head as a release candidate based on current master
    Then the architect starts a clean release lineage at that exact candidate
    And one fresh canonical run executes all 20 packs with properties and the package check
    And its durable evidence binds the master base, release task, candidate tree, complete plan, artifact, toolchain, receipt, and timestamps
    And only that passing sealed tree may advance master
    And QA and master finish on the same verified commit

  # Settled candidate final verification 010
  Scenario: Settled candidate final verification 010
    Given QA-integrated tasks and a master promotion have durable approval, handoff, receipt, and integration timestamps
    When the pilot scorecard is reported
    Then it reports approval-to-QA, QA queue, and approval-to-master time for every included feature
    And it accounts for every focused check, terminal attempt, failure, repair, revert, rerun, and the terminal cost per included task
    And it compares actual master-promotion time with the per-task terminal baseline
    And the user decides when another master integration phase begins

  # Settled candidate final verification 011
  Scenario Outline: Settled candidate final verification 011
    Given a QA feature slice approves focused scope <approved_scope>
    And its current candidate contains <candidate_change>
    When exact changed-path preflight selects <planned_scope> before any task launches
    Then <authorization_result>
    And the preflight reports the approved and planned packs, task count, critical-path estimate, expansion-causing paths, and remaining effort ceiling
    And no owned pack is omitted, no terminal result is claimed, and no task starts before authorization

    Examples:
      | approved_scope | candidate_change                                  | planned_scope         | authorization_result                                                                                              |
      | flow_graph     | only the approved Flow product and evidence paths | flow_graph            | the exact focused plan is authorized once                                                                         |
      | flow_graph     | an incidental shared verification-runner repair   | all 20 runnable packs | execution stops for a user choice to restore product scope or approve and integrate a standalone infrastructure slice |

  # Settled candidate final verification 012
  Scenario: Settled candidate final verification 012
    Given the architect has committed the last QA-candidate change
    And one focused plan can verify that exact tree and produce its review-ready receipt
    When QA-ready evidence is requested
    Then one evidence-producing invocation executes the focused plan and supplies the receipt used to record review-ready evidence
    And no preliminary invocation of the same plan is required for the same tree
    And the evidence binds the task, base, commit, tree, changed paths, plan, result, and timestamps
    And any later behavior, test, build, registry, runner, workflow, or mutation-metadata change requires one new evidence-producing invocation

  # Settled candidate final verification 013
  Scenario Outline: Settled candidate final verification 013
    Given the current candidate has an unresolved reliability incident with an eligible causal repair, deterministic regression, exact focused review-ready evidence, and package proof
    When a <readiness> handoff is evaluated in <integration_mode>
    Then the incident gate produces <gate_result>
    And a QA-eligible incident is recorded as terminal-verification-deferred with its failure, repair candidate and tree, regression, focused receipt, package receipt, and lineage intact
    And terminal-verification-deferred is neither incident resolution nor lineage abandonment
    And an unrepaired incident, failing regression, stale focused receipt, failing package, or changed bound identity remains blocking
    And only one passing master-integration all-20 checkpoint with properties and package proof resolves the deferred incident and supplies final evidence

    Examples:
      | readiness         | integration_mode    | gate_result                                                                     |
      | an approved specification | feature integration | permit coder start from current QA while retaining the ancestor deferral |
      | review-ready      | feature integration | permit the next named focused review and retain terminal verification deferred |
      | qa-ready          | feature integration | permit only QA integration and retain terminal verification deferred           |
      | release-candidate | master integration  | permit only architect terminal review of the frozen QA candidate               |
      | final-ready       | master integration  | block until the deferred incident is resolved by the exact terminal checkpoint |
