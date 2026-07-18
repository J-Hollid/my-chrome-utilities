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
