Feature: Verification administration preflight

  Background:
    Given an exact committed candidate has a canonical review-evidence plan

  # Verification administration preflight 001
  Scenario Outline: Verification administration preflight 001
    Given final evidence requires <administrative_condition>
    When the runner prepares to launch the first planned verification task
    Then the same read-only validator used by final evidence checks that condition
    And an invalid condition reports its exact cause with zero planned tasks launched
    And a valid condition leaves all planned product, property, browser, package, and evidence checks unchanged
    And final evidence checks every administrative condition again before it records a result

    Examples:
      | administrative_condition                                      |
      | readable bounded Git-note and integrated-resolution identity  |
      | exact incident admission, binding, and disposition state      |
      | current conservation authority and canonical plan identity    |
      | available receipt, artifact, and promotion capabilities       |

  # Verification administration preflight 002
  Scenario: Verification administration preflight 002
    Given every planned verification task passed on an unchanged exact candidate
    When pending evidence creation, Git-note recording, or review recording does not complete
    Then the completed task receipt remains bound to the same candidate, plan, artifact, and toolchain
    And a compatible restart resumes only the unfinished promotion step
    And final evidence checks every administrative condition again before it records a result
    And no passed product, property, browser, package, or acceptance task runs again
    And an identity change blocks reuse and requires the normal fresh verification policy

  # Verification administration preflight 003
  Scenario Outline: Verification administration preflight 003
    Given the declared <governed_identity> does not equal its current canonical value
    When candidate-plan-authority administration preflight runs
    Then it reports the identity name and its expected and observed values
    And it rejects the candidate before a planned task, checkpoint attempt, or reliability observation starts
    And it does not create a receipt, checkpoint, incident, or repair-focused obligation
    And it does not change an existing administrative record

    Examples:
      | governed_identity                                           |
      | authenticated blocked-aggregate consumer-plan digest       |
      | Phase 2 receipt-bound acceptance-session destination digest |

  # Verification administration preflight 004
  Scenario Outline: Verification administration preflight 004
    Given <identity_state> prevents one canonical <governed_identity> from being derived
    When candidate-plan-authority administration preflight runs
    Then it reports the identity name and the exact invalid state
    And it rejects the candidate before a planned task, checkpoint attempt, or reliability observation starts
    And it does not create a receipt, checkpoint, incident, or repair-focused obligation
    And it does not change an existing administrative record

    Examples:
      | identity_state | governed_identity                                  |
      | missing        | blocked-aggregate consumer-plan authority          |
      | malformed      | blocked-aggregate consumer-plan authority          |
      | duplicate      | Phase 2 incident-scoped task-succession edge       |
      | ambiguous      | Phase 2 current acceptance-session task identity   |

  # Verification administration preflight 005
  Scenario: Verification administration preflight 005
    Given the blocked-aggregate consumer plan and Phase 2 succession destination have current canonical identities
    When candidate-plan-authority administration preflight runs
    Then it succeeds before a planned task or reliability observation starts
    And the complete exact focused plan stays unchanged
    And no existing product, property, browser, package, or evidence check is removed
    And final evidence checks every administrative condition again before it records a result

  # Verification administration preflight 006
  Scenario: Verification administration preflight 006
    Given an exact plan does not select verification_process or consume either governed identity
    When candidate-plan-authority administration preflight runs
    Then the new identity check is not applicable
    And the existing administration preflight stays unchanged
    And the exact focused plan can proceed without a false identity failure
