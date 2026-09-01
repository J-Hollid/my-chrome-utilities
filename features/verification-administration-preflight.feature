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
