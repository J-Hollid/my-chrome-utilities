Feature: SwarmForge role liveness and legacy unblockers

  Background:
    Given a SwarmForge role owns an approved task or queued handoff
    And handoff and evidence identities must remain auditable

  # SwarmForge role liveness and legacy unblockers 001
  Scenario Outline: SwarmForge role liveness and legacy unblockers 001
    Given the role reports <reported_state>
    And its activity evidence shows <activity_state>
    When queued ordinary handoff mail is evaluated
    Then the role is treated as <effective_state>
    And the workflow performs <mail_action>

    Examples:
      | reported_state | activity_state | effective_state | mail_action |
      | active | a live command or a current progress lease | working | keeps the handoff queued until the next idle boundary |
      | active | no live command and an expired progress lease | available | reads and processes the queued handoff |
      | idle | no live command | available | reads and processes the queued handoff |

  # SwarmForge role liveness and legacy unblockers 002
  Scenario: SwarmForge role liveness and legacy unblockers 002
    Given a valid priority unblocker arrives while a role is active
    When the role reaches the next safe command boundary
    Then it claims the unblocker before another planned action
    And it does not wait for idle state
    And it does not stop a running command destructively

  # SwarmForge role liveness and legacy unblockers 003
  Scenario: SwarmForge role liveness and legacy unblockers 003
    Given an architect handoff is queued for a role that reports active
    And no agent command or progress lease is active
    When liveness reconciliation runs
    Then the stale active claim does not block the architect handoff
    And the exact handoff becomes the role's next work
    And no new verification receipt or replacement handoff is created

  # SwarmForge role liveness and legacy unblockers 004
  Scenario Outline: SwarmForge role liveness and legacy unblockers 004
    Given a completed legacy unblocker record has <legacy_identity_state>
    When current handoff validation reads it
    Then validation <legacy_result>
    And it does not reopen completed work

    Examples:
      | legacy_identity_state | legacy_result |
      | a provable sender, recipient, task, active handoff, authority ancestry, completion result, and content identity | accepts an immutable compatibility projection |
      | a missing or ambiguous required identity | quarantines the record with its exact reason |
      | an identity that conflicts with current durable state | rejects the record without changing current work |

  # SwarmForge role liveness and legacy unblockers 005
  Scenario: SwarmForge role liveness and legacy unblockers 005
    Given a completed unblocker already permits the exact next role action
    When coder, refactorer, or architect follow-up rules evaluate the task
    Then they reuse the durable completion result
    And they do not request a new user decision, unblocker, handoff, or verification run
    And they continue the retained active task at its next bounded action

  # SwarmForge role liveness and legacy unblockers 006
  Scenario: SwarmForge role liveness and legacy unblockers 006
    Given a role state changes among working, waiting, blocked, and available
    When the workflow records the transition
    Then it records the task, handoff, command or lease identity, reason, and timestamp
    And delivery timing can separate active work from queue wait and stale-state delay
    And no additional telemetry service is required

  # SwarmForge role liveness and legacy unblockers 007
  Scenario: SwarmForge role liveness and legacy unblockers 007
    Given liveness recovery finds stale role state or compatible legacy data
    When it repairs routing state
    Then dedicated helpers make one atomic and audited transition
    And no agent edits or moves runtime files manually
    And current code, handoff, receipt, and candidate identities remain unchanged

  # SwarmForge role liveness and legacy unblockers 008
  Scenario: SwarmForge role liveness and legacy unblockers 008
    Given unrelated completed legacy unblockers contain retired header fields
    When a new unblocker binding is searched
    Then safe canonical binding fields are compared before strict record validation
    And each record with the requested binding remains subject to complete current validation
    And unrelated legacy records remain unchanged and do not block the new binding
    And no legacy record becomes current evidence through this compatibility rule
