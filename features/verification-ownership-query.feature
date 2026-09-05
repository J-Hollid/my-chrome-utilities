# mutation-stamp: sha256=afac6302ccf6aa48ec2c7b0d411b0155a8c05826f51530f84a7673d851986ae8
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-09-05T21:23:09.301635894Z","feature_name":"Verification ownership query","feature_path":"features/verification-ownership-query.feature","background_hash":"85d79b81b6a5031b54e894fe08f55b193bb2287fca0212cbabeed55da78a961f","implementation_hash":"sha256:20229fe0f308308edb0e419260bf1660666fd0514d539f335abbd6a7b2f866e4","scenarios":[{"index":0,"name":"Verification ownership query 001","scenario_hash":"32efa1b5f19cc5eb9a84f41516fd9c1bc26645700364a50cddf2afccce6cfcdc","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-09-05T21:23:09.301635894Z"},{"index":1,"name":"Verification ownership query 002","scenario_hash":"571aa3aa8d2ff8324194cf4acf1bd7946322e6d0b9d7c38b190106be63832824","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-09-05T21:23:09.301635894Z"},{"index":2,"name":"Verification ownership query 003","scenario_hash":"fb5ea65ed215ac5f3cfb4852a03472a763d45b11e808fcc8a57aed1480d6bdd1","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-09-05T21:23:09.301635894Z"},{"index":3,"name":"Verification ownership query 004","scenario_hash":"f96793e48fef96005abbab30b99daae4b2d3e048f6c3212478ae9a99b41409bb","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-09-05T21:23:09.301635894Z"},{"index":4,"name":"Verification ownership query 005","scenario_hash":"979bdff9a4214a1d0974f09afdaef76af51b21574e3a58f5bbcdb5cef573c63f","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-09-05T21:23:09.301635894Z"},{"index":5,"name":"Verification ownership query 006","scenario_hash":"95885196b08c2f70da54d553b51b4df869c9aef56f321b4e88a0bac3477dd502","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-09-05T21:23:09.301635894Z"},{"index":6,"name":"Verification ownership query 007","scenario_hash":"2a4bcb91a770a12ab819e2f7e4de0560830f949d19148bd4ee698000ad5e5e41","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-09-05T21:23:09.301635894Z"}]}
# acceptance-mutation-manifest-end

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
