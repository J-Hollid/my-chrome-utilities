Feature: Verification receipt retention lifecycle

  Background:
    Given verification receipts are stored in project-local durable storage outside /tmp

  # Verification receipt retention lifecycle 001
  Scenario Outline: Verification receipt retention lifecycle 001
    Given one durable receipt is <evidence_state>
    When a specifier evaluates successful feature integration
    Then the specifier applies <retention_result>
    And the decision records the receipt identity, current consumer, and reason

    Examples:
      | evidence_state                                                     | retention_result                                              |
      | exact QA-ready evidence required by the pending QA fast-forward    | retain until that exact integration transaction completes     |
      | evidence required by an unresolved or terminal-deferred incident   | retain until the obligation receives a terminal disposition   |
      | consumed focused evidence with no remaining authorized consumer    | remove after compact integration facts are recorded            |
      | stale or identity-mismatched evidence with no historical obligation | remove without using it to avoid a verification run           |

  # Verification receipt retention lifecycle 002
  Scenario Outline: Verification receipt retention lifecycle 002
    Given a receipt was retained for <consumer>
    When <change> occurs
    Then the specifier records <result>
    And a stale receipt never prevents a required fresh verification run

    Examples:
      | consumer                       | change                                      | result                                                   |
      | QA integration                 | the candidate remains byte-identical         | consume the receipt for the exact QA fast-forward        |
      | QA integration                 | a behavior-bearing candidate change occurs   | invalidate and remove it after required history is safe  |
      | terminal incident resolution   | the incident receives a terminal disposition | release the receipt from retention                       |
      | master integration             | master advances to the exact final-ready tree | record compact release facts and release the raw receipt |

  # Verification receipt retention lifecycle 003
  Scenario: Verification receipt retention lifecycle 003
    Given one durable archive has content used by several active incidents
    When the incidents retain that content
    Then durable storage keeps one content identity rather than one complete copy per incident
    And each incident can validate the exact shared content
    And the content is removed only after no active incident, handoff, or integration transaction refers to it

  # Verification receipt retention lifecycle 004
  Scenario: Verification receipt retention lifecycle 004
    Given a successful feature integration has consumed its exact focused evidence
    When the specifier completes the integration record
    Then the specifier checks every receipt and archive created for the feature
    And it retains only evidence with a current authorized consumer
    And it removes consumed or invalid raw evidence that has no current obligation
    And it records enough compact facts for the delivery scorecard without retaining raw task output permanently

  # Verification receipt retention lifecycle 005
  Scenario: Verification receipt retention lifecycle 005
    Given cleanup is interrupted after a retention decision is recorded
    When the specifier or startup recovery resumes cleanup
    Then the same decision is applied idempotently
    And removal cannot change a retained receipt or an active obligation
    And no cleanup reference remains in /tmp after completion
