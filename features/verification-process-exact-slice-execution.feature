Feature: Verification process exact slice execution

  Background:
    Given a process-only candidate changes no product behavior
    And the complete master integration gate remains unchanged

  # Verification process exact slice execution 001
  Scenario: Verification process exact slice execution 001
    Given changed paths have declared verification-process slice ownership
    When readiness creates the canonical candidate plan
    Then the plan includes the owned slice tasks and their exact prerequisites, consumers, property checks, and package check
    And it includes no unrelated task from the verification-process parent pack
    And readiness, execution, receipt recording, and review use the same task identities

  # Verification process exact slice execution 002
  Scenario Outline: Verification process exact slice execution 002
    Given exact-slice readiness has <plan_condition>
    When the runner evaluates launch eligibility
    Then the launch decision is <launch_result>
    And the fallback decision is <fallback_result>

    Examples:
      | plan_condition | launch_result | fallback_result |
      | proved complete closure within the five-minute forecast limit | one start for each exact selected task | no added parent-pack task |
      | an unowned changed path | zero task starts and an unowned-path report | no parent-pack use |
      | a forecast above five minutes | zero task starts and a limiting-task report | no parent-pack use |
      | a required parent-pack fallback | zero task starts and an unresolved-boundary report | no fallback start |

  # Verification process exact slice execution 003
  Scenario: Verification process exact slice execution 003
    Given a selected aggregate names child contracts that are independent selected tasks
    When the candidate plan executes
    Then each child contract executes once as its own task
    And the aggregate validates the bound child identities and results without executing them again
    And a missing, changed, failed, or duplicate child result fails the aggregate

  # Verification process exact slice execution 004
  Scenario: Verification process exact slice execution 004
    Given one contract file serves more than one declared observable boundary
    When its verification-process tasks are prepared for exact selection
    Then the contract is split into independently runnable boundary-owned modules
    And any compatibility entry point only routes to those modules
    And no compatibility entry point repeats a selected child task

  # Verification process exact slice execution 005
  Scenario Outline: Verification process exact slice execution 005
    Given mutation discovery finds <mutant_population> in one selected process source
    When the exact mutation check runs
    Then it performs <mutation_action>
    And it does not start the legacy verification-process acceptance workload

    Examples:
      | mutant_population | mutation_action |
      | zero applicable mutants | records an empty successful result without a test command |
      | applicable mutants | runs only the declared target-specific command |

  # Verification process exact slice execution 006
  Scenario: Verification process exact slice execution 006
    Given a settled candidate has one complete exact task plan
    When its final focused proof runs
    Then durable run identity prevents a second start for the same candidate, tree, plan, toolchain, and task
    And one receipt binds every selected result and the package artifact
    And an unchanged reviewer validates that receipt without repeating its tasks

  # Verification process exact slice execution 007
  Scenario: Verification process exact slice execution 007
    Given the complete master gate selects every verification-process slice
    When the child-task union is compared with the former parent-pack closure
    Then every semantic unit, property, acceptance, evidence, and package obligation remains present
    And no obligation executes more than once
    And a missing or additional obligation blocks the gate

  # Verification process exact slice execution 008
  Scenario: Verification process exact slice execution 008
    Given the completed bootstrap authority has expired on QA
    And no production route consumes the integrated bootstrap controls
    When the canonical exact-slice route is integrated
    Then one fixed successor transition plan verifies only this exact approved phase
    And the successor plan does not run the old verification-process parent workload
    And the successor authority expires when its accepted candidate reaches QA
    And the canonical slice runner becomes the only route for later process changes

  # Verification process exact slice execution 009
  Scenario Outline: Verification process exact slice execution 009
    Given <aggregate_contract> owns cases from <child_boundary_group>
    When Phase 2 splits the aggregate into independently runnable child contracts
    Then conservation records the aggregate owner as historical provenance
    And each child contract owns its exact cases and module-setup occurrences
    And each child owner maps to one declared verification-process slice
    And no other owner transition is authorized

    Examples:
      | aggregate_contract | child_boundary_group |
      | evidence-promotion-contract-test | evidence-promotion child boundaries |
      | execution-checkpoint-contract-test | execution child boundaries |
      | ownership-impact-contract-test | ownership child boundaries |
      | registry-inventory-contract-test | registry child boundaries |
      | reliability-run-intent-contract-test | reliability child boundaries |
      | timing-performance-contract-test | timing child boundaries |
