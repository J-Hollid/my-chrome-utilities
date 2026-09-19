Feature: Deterministic baseline evidence

  Background:
    Given a focused review has an exact base, candidate, and selected plan
    And historical candidates and evidence remain unchanged

  # Deterministic baseline evidence 001
  Scenario Outline: Deterministic baseline evidence 001
    Given the baseline failure proof is <proof>
    When baseline admission is evaluated
    Then the admission result is <result>

    Examples:
      | proof | result |
      | authenticated evidence of the same deterministic failure on unchanged relevant base and candidate inputs | eligible for a bound baseline obligation |
      | missing source evidence | blocked |
      | changed relevant failure inputs | blocked |
      | a different candidate failure | blocked |
      | an unproved claim that the failure predates the candidate | blocked |

  # Deterministic baseline evidence 002
  Scenario Outline: Deterministic baseline evidence 002
    Given one exact baseline failure is eligible for deferral
    And fresh focused review completion is <completion>
    When review evidence is recorded
    Then the recording result is <result>

    Examples:
      | completion | result |
      | all other selected checks and properties passed with final package proof | review-ready with the failure retained as an unresolved obligation |
      | an additional failure in the admitted acceptance session | blocked |
      | another selected check failed | blocked |
      | Shell work was cancelled | blocked |
      | a selected result is missing | blocked |
      | final package proof is absent | blocked |
      | the receipt has no completion time | blocked |
      | the admitted check has no fresh result | blocked |
      | the admitted check result was copied from the historical run | blocked |
      | the admitted check ran freshly and produced a different failure | blocked |

  # Deterministic baseline evidence 003
  Scenario Outline: Deterministic baseline evidence 003
    Given a complete fresh review has an eligible baseline obligation
    When atomic evidence recording <outcome>
    Then durable evidence contains <record>

    Examples:
      | outcome | record |
      | succeeds | both the bound review-ready claim and unresolved baseline obligation |
      | fails | neither a usable review-ready claim nor a partial baseline deferral |

  # Deterministic baseline evidence 004
  Scenario Outline: Deterministic baseline evidence 004
    Given recorded baseline evidence is consumed with <binding>
    When the consumer validates the evidence
    Then the validation result is <result>

    Examples:
      | binding | result |
      | the exact recorded task, commits, trees, inputs, failure, source evidence, and plan | accepted for focused review and QA only |
      | a different candidate tree | blocked |
      | a different selected plan | blocked |
      | a changed source evidence digest | blocked |
      | a different failure identity | blocked |

  # Deterministic baseline evidence 005
  Scenario: Deterministic baseline evidence 005
    Given a historical incomplete review has a baseline failure and missing results
    When separately identified diagnostic proof and a fresh complete review are recorded
    Then the historical review remains incomplete with its original identity and results
    And diagnostic proof remains diagnostic and is not promoted to review evidence
    And the fresh review does not convert the baseline failure into a passed check

  # Deterministic baseline evidence 006
  Scenario: Deterministic baseline evidence 006
    Given focused QA evidence contains a deferred baseline failure
    When the later master integration gate evaluates that obligation
    Then the obligation still requires terminal verification
    And the focused deferral alone cannot produce final-ready evidence

  # Deterministic baseline evidence 007
  Scenario Outline: Deterministic baseline evidence 007
    Given historical source evidence is unavailable
    And a separate exact base-and-candidate diagnostic pair has <condition>
    When source proof for baseline classification is authenticated
    Then the classification result is <result>

    Examples:
      | condition | result |
      | authenticated durable source receipts with bound diagnostic intent, commits, trees, toolchain, check, unchanged input closure, timestamps, and matching failure digests | eligible source proof without changing historical evidence |
      | a source receipt absent from its durable path | blocked |
      | source bytes that do not match the recorded digest | blocked |
      | a missing relevant input from the bound closure | blocked |
      | different diagnostic failure results on base and candidate | blocked |
      | a caller assertion instead of authenticated source receipts | blocked |
