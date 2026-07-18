# mutation-stamp: sha256=122528db7c477b397f0a81b9df9b05573befa4494c87892ed35d1865797362f8
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:35:16.460266924Z","feature_name":"Data layer temporal flow execution correction runtime","feature_path":"features/data-layer-temporal-flow-execution-correction-runtime.feature","background_hash":"ca5d2f42bfe314d56a4cbbc1e70dc8a7c3c83fecb9963402b4f8cc38388dcb65","implementation_hash":"sha256:0498b3aed3a58348aa9fc0540a81d929a175ff2dcfe760e0e5524b3d41f2f869","scenarios":[{"index":1,"name":"Data layer temporal flow execution correction runtime 002","scenario_hash":"05b769b404c72612618ccc087f8d96905f4cf94006f42acf60edb4c07dfb8b98","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:35:16.460266924Z"},{"index":2,"name":"Data layer temporal flow execution correction runtime 003","scenario_hash":"eade9e8d5460e85920ce80bfad0b9c281e0a548779c156c4fee98c6d328d1130","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:35:16.460266924Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer temporal flow execution correction runtime

  Background:
    Given the built unpacked extension has a Flow authored through rendered stable-reference controls
    And production observation callbacks use the compiled flow automaton
    And Live evidence uses demo-page emission, the extension observer, Chrome messaging, and rendered results without direct callback invocation or a replaced Chrome API

  # Data layer temporal flow execution correction runtime 001
  Scenario: Data layer temporal flow execution correction runtime 001
    Given Product is visibly configured for 1 through 10 occurrences
    When one Product event and one valid Checkout event are captured
    Then Live shows Product count 1 and the active Checkout step
    And persisted runtime state did not wait for 10 Products

  # Data layer temporal flow execution correction runtime 002
  Scenario Outline: Data layer temporal flow execution correction runtime 002
    Given a fresh correlated journey is at Product
    When the real demo page emits <count> Product events through the extension observer and Chrome messaging
    Then Live displays <result>
    Examples:
      | count | result |
      | 0 | Product incomplete |
      | 1 | Product valid and transition-ready |
      | 10 | Product valid at maximum |
      | 11 | Product maximum exceeded |

  # Data layer temporal flow execution correction runtime 003
  Scenario Outline: Data layer temporal flow execution correction runtime 003
    Given the rendered Flow has an optional Upsell branch
    When the operator captures the journey with Upsell <presence>
    Then Live history displays <steps>
    Examples:
      | presence | steps |
      | absent | Product, Checkout |
      | present | Product, Upsell, Checkout |

  # Data layer temporal flow execution correction runtime 004
  Scenario: Data layer temporal flow execution correction runtime 004
    Given the rendered Flow has two branch edges and one required join
    When the captured observation selects the Upsell edge and attempts to bypass the join
    Then Live shows one selected branch and a join failure
    And the failure links to the rendered join field

  # Data layer temporal flow execution correction runtime 005
  Scenario: Data layer temporal flow execution correction runtime 005
    When purchase is captured before its required checkout_started transition
    Then Live shows the exact invalid transition and no validation schema winner
    And the same observation entered after checkout_started advances and validates

  # Data layer temporal flow execution correction runtime 006
  Scenario: Data layer temporal flow execution correction runtime 006
    Given two transaction correlation keys interleave in one actual tab session
    When the extension reloads between their observations
    Then Live restores two distinct stable instances with the correct histories
    And each final event resolves only from its own prior state

  # Data layer temporal flow execution correction runtime 007
  Scenario: Data layer temporal flow execution correction runtime 007
    Given one active instance is older than its rendered 30 minute timeout
    When the next event is captured
    Then Live marks that instance timed out and does not use it for routing
    And a fresh valid entry starts a different stable instance

  # Data layer temporal flow execution correction runtime 008
  Scenario: Data layer temporal flow execution correction runtime 008
    Given two active instances are equally eligible for a markerless purchase
    When the purchase is captured
    Then Live displays a two-instance ambiguity with both stable IDs
    And persisted state shows neither instance advanced

  # Data layer temporal flow execution correction runtime 009
  Scenario: Data layer temporal flow execution correction runtime 009
    Given a Flow step references a Page and Event selected by name
    When those entities are renamed and the extension reloads
    Then the rendered Flow and Live evaluator retain the same stable references and behavior

  # Data layer temporal flow execution correction runtime 010
  Scenario: Data layer temporal flow execution correction runtime 010
    Given a required referenced Event is selected in the Flow editor
    When the operator attempts to delete the Event
    Then deletion is blocked with a link to the exact step selector
    And repairing the step and retrying deletion leaves the Flow compiler clean

  # Data layer temporal flow execution correction runtime 011
  Scenario: Data layer temporal flow execution correction runtime 011
    Given the rendered Flow has explicit entry and exit conditions
    When an observation misses entry, no runtime instance is created
    When a valid entry and later exit are captured, Live marks one stable instance complete
    And a subsequent markerless purchase does not revive or route from the completed instance

  # Data layer temporal flow execution correction runtime 012
  Scenario: Data layer temporal flow execution correction runtime 012
    Given Retail and Trade Flow editors are available in the installed Builder
    When the operator switches from Retail to Trade and activates the first visible step action
    Then only a Trade step can change and every Retail step remains byte-for-byte unchanged
    And the rendered list, submitted command, compiled automaton, and persisted transition share the Trade Flow identity

  # Data layer temporal flow execution correction runtime 013
  Scenario: Data layer temporal flow execution correction runtime 013
    Given the operator authors an optional Retail branch and join through in-place step controls
    When the same journey runs as a Fixture and through the real observer
    Then both traverse the authored transition identities and return the same active steps and occurrence results
    And removing or changing an authored transition changes both results after publication
