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
