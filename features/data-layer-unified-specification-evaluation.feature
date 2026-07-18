# mutation-stamp: sha256=351f9ff073bbb330f4f0b36c96ea554e9f86b8fe51e3e99b1d07a37f6dace03b
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:34:10.721066077Z","feature_name":"Data layer unified specification evaluation","feature_path":"features/data-layer-unified-specification-evaluation.feature","background_hash":"8fc0075f2370e8a95ff5197c9380eb3e31759a6781ff0e264919ff8d9556e251","implementation_hash":"sha256:5eb3f2f686e30de7ed4a95f05f6ee8aee15fdd935ad201282461a54559a7c573","scenarios":[]}
# acceptance-mutation-manifest-end

Feature: Data layer unified specification evaluation

  Background:
    Given a canonical Specification Project draft can be compiled
    And all validation consumers use the compiled production evaluator

  # Data layer unified specification evaluation 001
  Scenario: Data layer unified specification evaluation 001
    When the project compiler resolves the project graph
    Then it emits one immutable executable plan with stable page, event, applicability, flow, step, profile, schema, and assignment references
    And unresolved or cyclic references are compiler blockers with exact source fields

  # Data layer unified specification evaluation 002
  Scenario: Data layer unified specification evaluation 002
    Given an assignment references a named applicability set and compiled schema revision
    When an observation is evaluated
    Then the result contains every candidate and rejection reason
    And it contains one winner or an explicit tie, active flow and step, effective profiles, schema revision, issues, and provenance
    And no embedded assignment condition is evaluated as a second matcher language

  # Data layer unified specification evaluation 003
  Scenario: Data layer unified specification evaluation 003
    Given one compiled plan, prior state, and observation are unchanged
    When the production evaluator runs twice
    Then both results are structurally identical and contain no hidden mutable input
    And evaluation does not write routing evidence or advance state outside its returned result

  # Data layer unified specification evaluation 004
  Scenario: Data layer unified specification evaluation 004
    Given draft revision 9 and published release 4 compile successfully
    When authoring preview and Live request executable plans
    Then preview names draft revision 9 and Live names immutable release 4
    And unpublished routing or schema changes cannot affect Live

  # Data layer unified specification evaluation 005
  Scenario: Data layer unified specification evaluation 005
    Given Live capture observes an event with persisted prior state
    When Live validates the observation through the production evaluator
    Then its visible result contains winner, flow step, effective schema revision, issues, and provenance from one evaluation
    And a routing evidence record is output only and is never used as routing input

  # Data layer unified specification evaluation 006
  Scenario: Data layer unified specification evaluation 006
    Given two equal highest-priority candidates match
    When the production evaluator runs
    Then it returns no winner and names both candidates and missing distinction evidence
    And the evaluator and visible Live result expose the same tie without legacy last-write-wins

  # Data layer unified specification evaluation 007
  Scenario: Data layer unified specification evaluation 007
    Given the last compiled plan is valid
    When a draft change introduces a dangling reference or invalid matcher
    Then compilation fails without replacing the valid plan
    And authoring shows the exact failing field while Live identifies the last published plan it continues to use

  # Data layer unified specification evaluation 008
  Scenario: Data layer unified specification evaluation 008
    Given an existing project has not passed compilation and Live parity under the unified evaluator
    When the operator opens Specification Builder
    Then the workspace is visibly labelled Preview with the unresolved parity reason
    And production publication is disabled until the same decisive observation passes fixture, preflight, release, and Live evaluation

  # Data layer unified specification evaluation 009
  Scenario: Data layer unified specification evaluation 009
    Given a published plan evaluates one Purchase observation
    When Fixture, matcher test, preflight evidence, release evidence, and Live display that evaluation
    Then each exposes the same result identity, assignment winner, rejected candidates, active Flow and step, effective Profiles, schema revision, issues, and provenance
    And no consumer substitutes a reduced or independently recomputed validation result

  # Data layer unified specification evaluation 010
  Scenario: Data layer unified specification evaluation 010
    Given release 1 is published and draft revision 24 changes Retail applicability and currency allowed values
    When a Retail Purchase is observed before another release
    Then Live uses release 1 assignment, schema revision, issues, and provenance
    And draft revision 24 affects only Preview and visibly identifies evidence made stale
    When revision 24 is published as release 2
    Then subsequent Live observations identify and use immutable release 2

  # Data layer unified specification evaluation 011
  Scenario: Data layer unified specification evaluation 011
    Given unified evaluation and legacy Live validation disagree
    When the Live event row is rendered
    Then only unified evaluation is labelled authoritative
    And legacy output is absent or explicitly labelled migration comparison and cannot affect status, issues, or release evidence
