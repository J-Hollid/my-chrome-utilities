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
