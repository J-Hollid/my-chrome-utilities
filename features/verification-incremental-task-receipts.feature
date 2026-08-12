Feature: Verification incremental task receipts

  Background:
    Given one verification coordinator owns a deduplicated plan and an immutable run identity

  # Verification incremental task receipts 001
  Scenario Outline: Verification incremental task receipts 001
    Given a <plan_mode> task reaches a <task_outcome> outcome
    When the coordinator makes the completed result durable
    Then it writes one complete task record without rewriting earlier task records
    And the record binds the run identity, task identity, result, output, digest, and timing
    And recovery can distinguish that completed result from unfinished work

    Examples:
      | plan_mode | task_outcome |
      | focused   | passing      |
      | focused   | failing      |
      | final     | passing      |
      | final     | failing      |

  # Verification incremental task receipts 002
  Scenario: Verification incremental task receipts 002
    Given two independent tasks complete concurrently for the same run
    When both results become durable
    Then each task has one complete record under its own identity
    And neither completion loses, replaces, or duplicates the other result
    And the plan can recover both results after an immediate interruption

  # Verification incremental task receipts 003
  Scenario Outline: Verification incremental task receipts 003
    Given recovery finds a task result whose durable state is <record_state>
    When the coordinator resumes the same run identity
    Then the recovery result is <recovery_result>
    And the task action is <task_action>

    Examples:
      | record_state                  | recovery_result                          | task_action                                  |
      | complete passing record       | accept the bound passing result          | do not execute the completed task again      |
      | absent or incomplete record   | reject it as evidence                     | execute the unfinished task                  |
      | complete failing record       | preserve the bound failure               | keep the combined run failed                 |

  # Verification incremental task receipts 004
  Scenario: Verification incremental task receipts 004
    Given one task has a complete failing record in the current run
    When later work completes or the coordinator restarts
    Then the combined run remains failed
    And no passing result overwrites that failure within the same run identity
    And a repaired candidate requires a new run with its own complete evidence

  # Verification incremental task receipts 005
  Scenario: Verification incremental task receipts 005
    Given every planned task has one complete record bound to the same run identity
    When the coordinator reaches the final boundary
    Then it assembles the canonical receipt once
    And the receipt contains every planned result exactly once with unchanged identities, outputs, hashes, timings, and artifact binding
    And the existing evidence validator accepts the receipt without weaker evidence rules

  # Verification incremental task receipts 006
  Scenario Outline: Verification incremental task receipts 006
    Given final assembly encounters <invalid_record>
    When the coordinator validates the durable task results
    Then finalization fails with <rejection_reason>
    And the invalid record never becomes a passing task or final receipt

    Examples:
      | invalid_record                                      | rejection_reason                                  |
      | a torn record or a record with a mismatched digest  | incomplete or corrupt task evidence               |
      | a record bound to another run, plan, or artifact    | foreign task evidence                             |
      | conflicting records for the same task identity      | ambiguous task evidence                           |

  # Verification incremental task receipts 007
  Scenario: Verification incremental task receipts 007
    Given a verification run has completed its final boundary
    When its canonical receipt and final evidence are recorded
    Then they preserve exact complete-gate start, finish, and elapsed time
    And they preserve per-stage task work, recording time, durable bytes, and final compaction time
    And they preserve worker count, useful overlap, artifact wait, failures, repairs, reruns, and every bound evidence identity

  # Verification incremental task receipts 008
  Scenario Outline: Verification incremental task receipts 008
    Given the accepted baseline has <task_count> parse and generation tasks with <baseline_bookkeeping> outside task execution
    When the incremental persistence fixture and one settled final gate run in the accepted environment class
    Then pre-compaction durable bytes fall by <minimum_byte_reduction> from repeated whole-receipt rewriting
    And fixture recording and recovery bookkeeping does not exceed <maximum_bookkeeping>
    And the exact complete-gate elapsed time does not exceed <complete_gate_target>
    And every planned result, property, failure record, evidence identity, and package result remains present

    Examples:
      | task_count | baseline_bookkeeping | minimum_byte_reduction | maximum_bookkeeping | complete_gate_target |
      | 534        | about 230 seconds     | at least 90 percent    | 30 seconds          | 14 minutes 43 seconds |
