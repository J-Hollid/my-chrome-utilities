# Verification registration review preflight 001 through 006
Feature: Verification registration review preflight

  Background:
    Given review preparation has a candidate, specification commit, received work base, evidence base, and intended handoff base
    And the selected plan retains historical task authority and final evidence validation

  # Verification registration review preflight 001
  Scenario Outline: Verification registration review preflight 001
    Given a selected acceptance feature has <registration>
    When existing review preflight resolves the feature step routes
    Then preparation reports <result> with the affected feature and pack
    And it launches no product check or expensive verification task

    Examples:
      | registration                 | result                |
      | no loaded step route         | missing registration  |
      | two matching step routes     | ambiguous registration|
      | one complete loaded route    | valid registration    |

  # Verification registration review preflight 002
  Scenario Outline: Verification registration review preflight 002
    Given the selected current task population contains <change>
    When existing review preflight compares the governed historical projection
    Then preparation reports <result>
    And no historical snapshot, evidence record, or authority digest changes

    Examples:
      | change                                  | result                        |
      | an authorized fully declared addition   | a conserved population        |
      | a missing authorized addition           | the missing task identity     |
      | an unauthorized extra task              | the unauthorized task identity|
      | an altered historical executable        | the differing executable field|
      | a duplicate task identity               | the duplicate task identity   |

  # Verification registration review preflight 003
  Scenario: Verification registration review preflight 003
    Given current registration and authorized additions use one canonical command builder
    When an execution argument is altered without historical authority
    Then an independent historical expectation rejects the altered argument
    And shared construction cannot turn the change into a conserved identity

  # Verification registration review preflight 004
  Scenario: Verification registration review preflight 004
    Given the evidence base precedes the specification commit
    And the intended handoff base is the specification commit
    When existing review preflight compares the two canonical change sets
    Then preparation stops and identifies both bases and the specification path difference
    And no build, browser run, acceptance session, or package task starts
    And no receipt, incident, or portfolio record is created

  # Verification registration review preflight 005
  Scenario: Verification registration review preflight 005
    Given the evidence base and intended handoff base are equal
    And the received work base and specification commit are distinct valid ancestors
    When existing review preflight accepts registration, conservation, and ancestry
    Then preparation prints one exact candidate and evidence-base binding
    And the verification, record-review, and handoff inputs use that same binding
    And the selected executable task population is unchanged
    And preparation alone supplies no review-ready proof

  # Verification registration review preflight 006
  Scenario Outline: Verification registration review preflight 006
    Given a valid review preparation exists
    When <identity> changes before <boundary>
    Then that boundary rejects the stale binding
    And any completed receipt retains its original immutable identity

    Examples:
      | identity         | boundary            |
      | candidate tree   | review execution    |
      | evidence base    | evidence recording  |
      | handoff base     | handoff validation  |
