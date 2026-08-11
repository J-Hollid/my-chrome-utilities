# mutation-stamp: sha256=4ddd4d07c7360bab93ef07fe47ab5ffed485198df555ecac676653ce416b7bf9
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-08-11T22:13:50.246190390Z","feature_name":"Verification shared artifact parallel execution","feature_path":"features/verification-shared-artifact-parallel-execution.feature","background_hash":"3cdaaaf3126d0ed3c7fec6152d9d4da7f93a71c794c2db1c1edc5ded4a8485a3","implementation_hash":"sha256:30d3791d82d2464e8ce74b388315b3f2729d693bd43a8102a244ff73d70e8da2","scenarios":[{"index":2,"name":"Verification shared artifact parallel execution 003","scenario_hash":"96458492560008142beb62c6880004e39a55c0586c62b47ba9c2aadef9164906","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-08-11T22:13:50.246190390Z"},{"index":0,"name":"Verification shared artifact parallel execution 001","scenario_hash":"21cb0080b02a086eeff80df2768bdac56838616f8ebcb2431950262cc30fae66","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-08-11T22:10:12.504193311Z"}]}
# acceptance-mutation-manifest-end

Feature: Verification shared artifact parallel execution

  Background:
    Given one verification coordinator has prepared and validated an immutable build artifact

  # Verification shared artifact parallel execution 001
  Scenario Outline: Verification shared artifact parallel execution 001
    Given a <plan_mode> plan contains two independent read-only browser tasks
    When the coordinator runs the plan with two browser workers
    Then both tasks use the coordinator's exact artifact identity
    And both tasks start before either task completes
    And neither task waits for the other task to release the artifact
    And the combined result records each task once

    Examples:
      | plan_mode |
      | focused   |
      | final     |

  # Verification shared artifact parallel execution 002
  Scenario: Verification shared artifact parallel execution 002
    Given the coordinator currently serves its artifact to two concurrent readers
    When an external writer requests permission to replace the artifact
    Then the writer remains blocked until the coordinator releases the artifact
    And every browser task observes the validated artifact digest
    And an attempted reader mutation fails the verification run

  # Verification shared artifact parallel execution 003
  Scenario Outline: Verification shared artifact parallel execution 003
    Given parallel scheduling receives a browser task with <isolation_state>
    When the scheduler evaluates concurrent eligibility
    Then <scheduling_result>

    Examples:
      | isolation_state                                                             | scheduling_result                                  |
      | private profile, debugging port, temporary data, evidence path, and cleanup | it assigns an independent browser worker           |
      | shared writable state or an unproved dependency                             | it keeps the task in one worker or runs it serially |

  # Verification shared artifact parallel execution 004
  Scenario: Verification shared artifact parallel execution 004
    Given the two-worker schedule has useful overlap and no per-task artifact wait
    When a three-worker candidate is compared using the exact layered_schema focused plan
    Then the normal sample is at least 60 seconds faster than the accepted two-worker sample
    And a loaded sample introduces no timeout, cleanup, port, profile, evidence, or artifact collision
    And three workers become the default only when both results pass

  # Verification shared artifact parallel execution 005
  Scenario: Verification shared artifact parallel execution 005
    Given three workers do not satisfy the speed and stability threshold
    When the worker decision is recorded
    Then two workers remain the default
    And the artifact-overlap improvement remains eligible for delivery
    And no failed result is retried at lower concurrency to turn it green

  # Verification shared artifact parallel execution 006
  Scenario: Verification shared artifact parallel execution 006
    Given one parallel browser task fails
    When the coordinator completes the remaining independent work
    Then the combined verification result fails
    And the failed task retains its original identity, output, timing, and failure record
    And repair requires focused causal proof followed by a fresh final run on the changed candidate

  # Verification shared artifact parallel execution 007
  Scenario: Verification shared artifact parallel execution 007
    Given the settled VTD-017 candidate is ready for final verification
    When the architect runs the canonical final gate once
    Then all 20 packs, properties, every existing evidence leaf, and packaging run against one artifact
    And the receipt reports worker count, useful overlap, artifact wait, browser-stage time, and complete-gate time
    And the passing evidence remains bound to the exact task, base, commit, tree, plan, artifact, and toolchain
