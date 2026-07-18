# mutation-stamp: sha256=74ac97311bbbb2d44fcb6ad22886a9305ebf77b445a6eb95a327c37dfb8cef9f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:34:50.558081081Z","feature_name":"Data layer production fixture execution runtime","feature_path":"features/data-layer-production-fixture-execution-runtime.feature","background_hash":"155f8477ed27ecdebf89b6772bb4863c58e5e949d43603f8494bcd9a0c532489","implementation_hash":"sha256:5dace47c60b90a6d76176a22a03d68b296d2e439992eda8acbeb5e8a74e9ebfc","scenarios":[]}
# acceptance-mutation-manifest-end

Feature: Data layer production fixture execution runtime

  Background:
    Given the built unpacked extension has fixtures authored through rendered controls
    And the actual production evaluator is instrumented by scenario identity
    And every Live comparison uses demo-page emission, the extension observer, Chrome messaging, and rendered results without direct callback invocation or a replaced Chrome API

  # Data layer production fixture execution runtime 001
  Scenario: Data layer production fixture execution runtime 001
    When the operator runs a passing Retail event fixture from its editor
    Then the rendered result shows its actual applicability winner, confirmation step, Retail schema revision, zero issues, and Pass
    And persisted fixture evidence names the compiled revision used

  # Data layer production fixture execution runtime 002
  Scenario: Data layer production fixture execution runtime 002
    When the operator runs a Trade event fixture missing account_id and purchase_order_number
    Then the rendered result shows exactly those 2 Required issues and Fail
    And changing the fixture's declared expectation to Pass does not change the actual result

  # Data layer production fixture execution runtime 003
  Scenario: Data layer production fixture execution runtime 003
    When the operator runs a Retail journey with Product, optional Upsell, Checkout, and markerless Purchase observations
    Then the rendered timeline shows each production automaton transition and the Retail schema winner
    And an invalid-transition copy fails at the exact observation and transition

  # Data layer production fixture execution runtime 004
  Scenario: Data layer production fixture execution runtime 004
    Given the real demo page emits one authored fixture observation through the extension observer and Chrome messaging
    When both visible results are opened
    Then candidate IDs, winner, flow step, effective schema revision, provenance, issues, and next state match exactly
    And the fixture runner did not call a simplified validation path

  # Data layer production fixture execution runtime 005
  Scenario: Data layer production fixture execution runtime 005
    Given a passing fixture result belongs to compiled revision 8
    When the operator changes a contributing Profile and simulates a failed recompile
    Then the result is visibly Stale and cannot satisfy release policy
    And the prior evidence remains inspectable without being labelled current

  # Data layer production fixture execution runtime 006
  Scenario: Data layer production fixture execution runtime 006
    Given a required failing fixture unexpectedly passes under a deliberately permissive evaluator mutation
    When the fixture corpus and release gate run
    Then the exact fixture scenario fails and publication remains blocked
    And the mutation cannot be hidden by trusting the declared expected result

  # Data layer production fixture execution runtime 007
  Scenario: Data layer production fixture execution runtime 007
    Given the fixture editor contains an unsaved observation repair
    When a rerender, navigation, reload, and one failed save occur
    Then the repair and its field-level status survive
    And rerunning after Retry records one current result for the new canonical revision

  # Data layer production fixture execution runtime 008
  Scenario Outline: Data layer production fixture execution runtime 008
    Given the installed Fixture editor contains <empty_case>
    When the operator selects Run Fixture
    Then no Pass result or coverage evidence is created
    And the exact missing guided field is focused with a repair explanation
    Examples:
      | empty_case |
      | no observations |
      | no assertions |
      | empty payload and empty expected result |

  # Data layer production fixture execution runtime 009
  Scenario: Data layer production fixture execution runtime 009
    Given positive and negative Retail and Trade Fixtures were created only through guided controls
    When the operator runs them in the installed extension
    Then each result includes assertions and actual-versus-expected differences from the production evaluator
    And their evidence can populate only matching Page, Event, Flow step, and requirement coverage cells
