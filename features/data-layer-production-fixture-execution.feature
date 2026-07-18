# mutation-stamp: sha256=1bcd58160a75fcc666d54928b686c0b7a8454f564fb0846c4ef8f40067666cdd
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:33:57.533525033Z","feature_name":"Data layer production fixture execution","feature_path":"features/data-layer-production-fixture-execution.feature","background_hash":"eb6fdfe9e62b4b23550ba34b28724325235909470a6836db9ef6cc3b3ceb45f1","implementation_hash":"sha256:7db14f584b58e12b64ad9900b808e55a505e2445544b8d9608a5bb7a123588fa","scenarios":[{"index":2,"name":"Data layer production fixture execution 003","scenario_hash":"7647cf571c553e41c5f59df434fd126e21ef7e529bc3ef40ebb1903996ff730f","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:33:57.533525033Z"},{"index":3,"name":"Data layer production fixture execution 004","scenario_hash":"5529e931079f86117f630db8a1a85b4d76c4743dd376db7032fe6aba3ad22031","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:33:57.533525033Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer production fixture execution

  Background:
    Given fixtures execute the compiled production evaluator used by Live capture

  # Data layer production fixture execution 001
  Scenario: Data layer production fixture execution 001
    Given a single-event fixture contains context, payload, and expected applicability, flow step, schema revision, issues, and result
    When the fixture runs
    Then actual and expected values are compared field by field
    And its declared expectation is not treated as the execution result

  # Data layer production fixture execution 002
  Scenario: Data layer production fixture execution 002
    Given a journey fixture contains ordered observations and correlation data
    When the fixture runs
    Then each observation advances the production flow automaton
    And each step plus the terminal result shows actual winner, flow step, schema, and issues

  # Data layer production fixture execution 003
  Scenario Outline: Data layer production fixture execution 003
    Given a Retail confirmation event fixture omits <field>
    When the fixture runs
    Then it fails with exactly <issue>
    Examples:
      | field | issue |
      | transaction_id | /ecommerce/transaction_id Required |
      | value | /ecommerce/value Required |
      | currency | /ecommerce/currency Required |

  # Data layer production fixture execution 004
  Scenario Outline: Data layer production fixture execution 004
    Given a Trade confirmation event fixture omits <field>
    When the fixture runs
    Then it fails with exactly <issue>
    Examples:
      | field | issue |
      | account_id | /account_id Required |
      | purchase_order_number | /purchase_order_number Required |

  # Data layer production fixture execution 005
  Scenario: Data layer production fixture execution 005
    Given a failing journey fixture declares an invalid Checkout to Confirmation transition
    When the observed journey unexpectedly reaches validation
    Then the fixture remains failed with an unexpected transition outcome
    And the mismatch blocks release

  # Data layer production fixture execution 006
  Scenario: Data layer production fixture execution 006
    Given a fixture and Live observation use identical context, payload, and prior state
    When each executes
    Then their candidate IDs, winner, flow step, effective schema revision, provenance, issues, and state transition are identical

  # Data layer production fixture execution 007
  Scenario: Data layer production fixture execution 007
    Given a fixture was last run against compiled revision 8
    When the project changes to revision 9
    Then its result is visibly Stale until rerun
    And a compilation or storage failure retains the previous result and editable fixture without presenting it as current
