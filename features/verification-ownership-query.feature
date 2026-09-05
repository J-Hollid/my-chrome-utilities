# Verification ownership query 001
# Verification ownership query 002
# Verification ownership query 003
# Verification ownership query 004
# Verification ownership query 005
# Verification ownership query 006
# Verification ownership query 007
Feature: Verification ownership query

  Background:
    Given the ownership query uses the repository registry and canonical planning APIs
    And every successful answer identifies the worktree, HEAD, registry content, mode, and dirty state

  # Verification ownership query 001
  Scenario Outline: Verification ownership query 001
    Given a repository path has ownership state <state>
    When the caller requests its current ownership
    Then the answer reports <result>
    And successful declared ownership includes provenance, declared consumers, and direct check identities

    Examples:
      | state | result |
      | one eligible slice | its parent pack and exact slice |
      | one parent without an eligible slice | its parent fallback and the reason |
      | a quarantined slice | the quarantine restriction and conservative parent fallback |
      | a proposed file under one declared source prefix | its declared owner and file-existence status |
      | no declared owner | explicit unowned status without a safe-scope claim |
      | conflicting owners at the controlling priority | a nonzero ambiguity error |

  # Verification ownership query 002
  Scenario Outline: Verification ownership query 002
    Given a committed task change contains <change>
    When the caller requests changes from its ancestor base to HEAD
    Then the answer preserves canonical behavior <behavior>
    And it retains classification, next stage, expansion reasons, and terminal obligations

    Examples:
      | change | behavior |
      | a rename between owners | plan both old and new paths |
      | deletion of an owned file | retain its historical owner |
      | a narrower mapping in the candidate | retain the required base and current ownership union |
      | a declared consumer with prerequisites | retain the complete consumer and prerequisite closure |
      | a quarantined selected slice | retain the conservative parent closure |
      | a property-bearing selected boundary | include its required property checks |

  # Verification ownership query 003
  Scenario Outline: Verification ownership query 003
    Given the canonical readiness classification is <classification>
    When the caller requests the task change explanation
    Then it reports the existing next action <action>
    And the query does not perform that action or reduce the canonical plan

    Examples:
      | classification | action |
      | bounded-ready | continue with the canonical bounded plan |
      | coarse-boundary | mandatory independent ownership preparation |
      | granularity-assessment-required | structured bounded judgment |
      | coarse-within-pack | structured bounded judgment |

  # Verification ownership query 004
  Scenario Outline: Verification ownership query 004
    Given the selected answer has <count> entries in its <list> list and one blocking restriction
    When the caller requests default output as <format>
    Then it lists <shown> entries and reports <omitted> omitted entries
    And it includes every selected pack and slice identity and the blocking restriction
    And it gives a command to expand the complete requested list

    Examples:
      | count | list | format | shown | omitted |
      | 2 | checks | text | 2 | 0 |
      | 12 | checks | text | 10 | 2 |
      | 15 | consumers | JSON | 10 | 5 |

  # Verification ownership query 005
  Scenario Outline: Verification ownership query 005
    Given the caller has a valid ownership answer
    When the caller requests expansion <target>
    Then the output contains <detail>
    And it does not include unrelated source bodies or receipt bodies

    Examples:
      | target | detail |
      | slice:pack_a/slice_a for a selected slice | that slice declaration and provenance |
      | consumers | the complete declared consumer list and provenance |
      | checks | all direct, prerequisite, and consumer checks with their reasons |
      | slice:pack_a/unknown | a nonzero unknown-target error |

  # Verification ownership query 006
  Scenario Outline: Verification ownership query 006
    Given the requested query has input condition <condition>
    When the ownership query runs
    Then it produces <outcome>
    And it does not invent missing authority or silently repair inputs

    Examples:
      | condition | outcome |
      | an invalid or non-ancestral changes base | a nonzero base error |
      | an absolute or escaping repository path | a nonzero path error |
      | stale generated registry bytes | a nonzero stale-registry error |
      | missing authoritative registry input | a nonzero missing-authority error |
      | valid uncommitted registry content for a path query | an advisory answer marked with current content identity and dirty state |
      | registry inputs differ from HEAD for a changes query | a nonzero registry-revision error |
      | uncommitted source edits for a changes query | the committed answer with an explicit working-tree exclusion |

  # Verification ownership query 007
  Scenario Outline: Verification ownership query 007
    Given the invocation selects operation <operation>
    When the ownership query runs
    Then repository files, evidence, quarantine, dispositions, and queue state are unchanged
    And no test runner, indexer, registry writer, or network request was started

    Examples:
      | operation |
      | path |
      | changes |
      | an invalid expansion |
