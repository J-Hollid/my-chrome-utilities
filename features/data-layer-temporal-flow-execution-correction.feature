# mutation-stamp: sha256=47d29261b683ccc94280c5ae0d1ea34a32e81b42bc0b1c994a2cefa5f7b9eb34
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:34:06.398909911Z","feature_name":"Data layer temporal flow execution correction","feature_path":"features/data-layer-temporal-flow-execution-correction.feature","background_hash":"2c210564f3086597aa9fa1ad2431e314a4ba8841048a4a0531b37d4ff0596e1b","implementation_hash":"sha256:53f2d69db9072511cbe88611a51406e7b78dd323851c2109bd099d00eb1b8fd9","scenarios":[{"index":1,"name":"Data layer temporal flow execution correction 002","scenario_hash":"7212d376a9b5a4ba3c1cf801197c8ab91b64ee68e4088668b4a0ceafa3c3af92","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:34:06.398909911Z"},{"index":2,"name":"Data layer temporal flow execution correction 003","scenario_hash":"7f5554c62b58669a1ad568a071045890743775962cbaa5dfd2fb21d02b848f50","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:34:06.398909911Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer temporal flow execution correction

  Background:
    Given a compiled Flow uses stable Page, Event, Profile, Applicability, Step, and Transition IDs

  # Data layer temporal flow execution correction 001
  Scenario: Data layer temporal flow execution correction 001
    Given Product has minimum 1 and maximum 10 occurrences
    When one Product observation is followed by a valid Checkout transition
    Then the flow advances to Checkout because the minimum is satisfied
    And Product is not held until its maximum

  # Data layer temporal flow execution correction 002
  Scenario Outline: Data layer temporal flow execution correction 002
    Given Product has minimum 1 and maximum 10 occurrences
    When <count> Product observations occur
    Then the Product occurrence result is <result>
    Examples:
      | count | result |
      | 0 | incomplete |
      | 1 | valid |
      | 10 | valid |
      | 11 | failed maximum |

  # Data layer temporal flow execution correction 003
  Scenario Outline: Data layer temporal flow execution correction 003
    Given Upsell is an optional step between Product and Checkout
    When the journey reaches Checkout with Upsell <presence>
    Then the valid transition path is <path>
    Examples:
      | presence | path |
      | absent | Product to Checkout |
      | present | Product to Upsell to Checkout |

  # Data layer temporal flow execution correction 004
  Scenario: Data layer temporal flow execution correction 004
    Given Retail has Upsell and No upsell branches that join before Confirmation
    When an observation satisfies the Upsell branch entry
    Then only the Upsell edge is taken and the join is reached once
    And bypassing the required join is a flow failure

  # Data layer temporal flow execution correction 005
  Scenario: Data layer temporal flow execution correction 005
    Given a transition requires checkout_started before purchase
    When purchase arrives without that transition evidence
    Then the instance fails with expected and observed transition evidence
    And no confirmation applicability winner is selected from that failed instance

  # Data layer temporal flow execution correction 006
  Scenario: Data layer temporal flow execution correction 006
    Given a flow has entry and exit conditions
    When entry does not match, no instance is started
    When entry matches and exit later matches, the instance becomes complete
    And a later purchase cannot revive the completed instance

  # Data layer temporal flow execution correction 007
  Scenario: Data layer temporal flow execution correction 007
    Given two transactions share one browser tab and use distinct configured correlation keys
    When their observations interleave
    Then each stable flow instance advances only from its correlated observations
    And reload preserves both instances and their step histories

  # Data layer temporal flow execution correction 008
  Scenario: Data layer temporal flow execution correction 008
    Given an active instance has a 30 minute timeout
    When its next observation arrives after 31 minutes
    Then the instance fails as timed out with last-step evidence
    And it cannot provide flow state to applicability

  # Data layer temporal flow execution correction 009
  Scenario: Data layer temporal flow execution correction 009
    Given two active instances are equally eligible for one markerless observation
    When the automaton evaluates the observation
    Then it returns an explicit multiple-instance ambiguity
    And it does not advance or select either instance arbitrarily

  # Data layer temporal flow execution correction 010
  Scenario: Data layer temporal flow execution correction 010
    Given a Page or Event is renamed while a Flow references its stable ID
    When the Flow is recompiled and reopened
    Then execution semantics and reference identity are unchanged
    And deleting the reference is blocked until the step is repaired

  # Data layer temporal flow execution correction 011
  Scenario: Data layer temporal flow execution correction 011
    Given Retail checkout has Product, optional Upsell, Checkout, and Confirmation steps
    When the Flow editor opens
    Then every step, occurrence bound, branch, join, and transition is editable in place
    And the editor, compiler, fixture runner, and runtime consume one transition representation
    And its sequence summary identifies entry, optional paths, joins, and exit

  # Data layer temporal flow execution correction 012
  Scenario: Data layer temporal flow execution correction 012
    Given Retail checkout steps are rendered and actionable
    When the operator switches directly to Trade checkout
    Then only Trade checkout steps and actions remain rendered
    And no stale Retail control can submit a command against Trade checkout
    And returning to Retail restores its current canonical steps rather than a cached list
