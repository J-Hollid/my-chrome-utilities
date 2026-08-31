# mutation-stamp: sha256=a37fc611e410af1eb45cab305582be9b7d6c753ec1cb4c2e073d1c641c2231ba
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-08-31T13:02:04.650195009Z","feature_name":"Verification receipt retention lifecycle","feature_path":"features/verification-receipt-retention-lifecycle.feature","background_hash":"3197673c983c442f444659423f38f43ffcabc19f9e80db56cbe7ce1385410cc0","implementation_hash":"sha256:bbb52924b971925def2af872bd6627b87120304e3b55b4be2b243c96078dc455","scenarios":[{"index":0,"name":"Verification receipt retention lifecycle 001","scenario_hash":"cc28452b42c2026a2232be07c2df581d7b74a7c9c6de78d3cf2393309886775a","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-08-31T13:02:04.650195009Z"},{"index":1,"name":"Verification receipt retention lifecycle 002","scenario_hash":"1df534934d3f9e2d8a692ed2d882c5ae9b8da6767e045cc340ba1fa085b380f8","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-08-31T13:02:04.650195009Z"}]}
# acceptance-mutation-manifest-end

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

  # Verification receipt retention lifecycle 006
  Scenario Outline: Verification receipt retention lifecycle 006
    Given master has advanced to the exact candidate recorded by the final Git note
    And repository temporary storage contains <runtime_data>
    When the specifier completes the integration record
    Then it produces <disposition>
    And the final Git note retains the compact checkpoint and incident identities
    And every unresolved incident and current unintegrated QA checkpoint remains unchanged

    Examples:
      | runtime_data                                           | disposition                                      |
      | a completed checkpoint attempt recorded by the note    | remove the raw attempt                           |
      | resolved incident receipts and package archives        | remove data with no unresolved incident consumer |
      | a checkpoint for the current unintegrated QA commit    | retain the reusable attempt                      |
      | evidence referenced by an unresolved incident          | retain the active obligation                     |
