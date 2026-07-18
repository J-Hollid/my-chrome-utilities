# mutation-stamp: sha256=502155cb43b34ec55e2c37c49c0a0d2763419ad73e90d85005f56bf14f576322
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:34:22.963116991Z","feature_name":"Data layer project fixtures and preflight runtime","feature_path":"features/data-layer-project-fixtures-preflight-runtime.feature","background_hash":"0041570f578588c696fc8c4c79779b4d813880734c206e8652b7f9163f8a53fb","implementation_hash":"sha256:6bc84f3c932df34b6dec2ce8d490a386922946bd32b955f84652887914fde919","scenarios":[]}
# acceptance-mutation-manifest-end

Feature: Data layer project fixtures and preflight runtime

  Background:
    Given the built extension is running with production fixture runner, temporal evaluator, coverage, preflight, and navigation systems

  # Data layer project fixtures and preflight runtime 001
  Scenario: Data layer project fixtures and preflight runtime 001
    Given no target tab or captured event exists
    When single-event and journey fixtures are pasted and run through actual workspace controls
    Then production evaluation records applicability, flow step, profiles, transitions, occurrences, validation, and expected differences
    And no browser capture callback supplies fixture results

  # Data layer project fixtures and preflight runtime 002
  Scenario: Data layer project fixtures and preflight runtime 002
    Given production project data contains uncovered, ambiguous, unreachable, conflicting, missing, invalid-pin, fixture, and breaking-change cases
    When actual whole-project preflight runs
    Then rendered diagnostics and production results agree for every category
    And release readiness distinguishes errors, policy blockers, warnings, and waivers

  # Data layer project fixtures and preflight runtime 003
  Scenario: Data layer project fixtures and preflight runtime 003
    Given Retail and Trade applicability deliberately tie at shared confirmation
    When production journey fixtures reach the markerless final purchase
    Then actual preflight blocks release and renders both candidates with flow-state evidence
    And correcting the matcher removes only that diagnostic and makes both fixture winners deterministic

  # Data layer project fixtures and preflight runtime 004
  Scenario: Data layer project fixtures and preflight runtime 004
    Given the actual coverage matrix has issues in every supported pivot
    When keyboard-only navigation opens and returns from each issue
    Then the exact production editor field is reached in no more than 2 actions
    And matrix filters, pivot, focus, and scroll geometry are restored

  # Data layer project fixtures and preflight runtime 005
  Scenario: Data layer project fixtures and preflight runtime 005
    Given the benchmark project contains 500 properties and 50 flows
    When production coverage filtering, pivoting, and scrolling are measured
    Then DOM cells remain bounded by visible content and overscan
    And measured interaction tasks satisfy the 100 millisecond budget
    And no hidden matrix renders the entire project
