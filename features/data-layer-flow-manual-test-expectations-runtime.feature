Feature: Data layer Flow manual test expectations runtime

  Background:
    Given the built extension is running with production observation, per-event validation, and tester-checklist systems
    And Checkout journey contains expected Event occurrences

  # Data layer Flow manual test expectations runtime 001
  Scenario: Data layer Flow manual test expectations runtime 001
    Given tester Alex and product time 2026-07-18T10:00:00Z are selected for ChecklistRun Retail test 1
    When actual checklist controls record Seen, Not seen, and Not applicable on separate rows
    Then production persistence retains each exact human status, note, tester Alex, product time, and checklist-run revision
    And no project revision, effective schema, Assignment, Event result, documentation snapshot, or release evidence changes

  # Data layer Flow manual test expectations runtime 002
  Scenario: Data layer Flow manual test expectations runtime 002
    Given Purchase is captured before its documented predecessor
    And immutable release 3 contains the matching Purchase Assignment and effective schema
    When the actual Assignment and validator process Purchase
    Then the rendered payload result equals independent Event validation
    And actual Flow surfaces contain no automatic order, transition, occurrence, branch, join, or journey result

  # Data layer Flow manual test expectations runtime 003
  Scenario: Data layer Flow manual test expectations runtime 003
    Given one immutable production observation is manually attached to Retail Purchase
    When it is opened from side panel, graph, checklist, and validation issue
    Then all surfaces retain the same observation, validation-result, occurrence, project-revision, and return-context identities
    And no copied payload or schema record is created

  # Data layer Flow manual test expectations runtime 004
  Scenario: Data layer Flow manual test expectations runtime 004
    Given 11 Product view observations each pass payload validation
    And the documented frequency is 1 through 10
    When actual count and checklist render
    Then actual count is 11 and every payload result remains valid
    And no production issue code claims an occurrence or Flow failure

  # Data layer Flow manual test expectations runtime 005
  Scenario: Data layer Flow manual test expectations runtime 005
    Given all actual checklist rows are Not checked
    And every non-manual reference, compiler, Assignment, ambiguity, and required Event-case publication gate passes
    When production preflight, review, and publication use one unchanged compilation result
    Then manual state remains Not checked in every surface
    And it neither manufactures evidence nor blocks publication by default

  # Data layer Flow manual test expectations runtime 006
  Scenario: Data layer Flow manual test expectations runtime 006
    Given production ChecklistRun Retail test 1 references immutable release 3 at run revision 1
    When actual controls record Purchase Seen, actual count 1, tester Alex, note Order 1001, and time 2026-07-18T10:00:00Z
    Then only Retail test 1 advances to run revision 2
    And release 3, project revision, validation-plan identity, developer-document snapshot, and checklist template remain byte-equivalent
    And its exported run is labelled execution evidence for release 3

  # Data layer Flow manual test expectations runtime 007
  Scenario: Data layer Flow manual test expectations runtime 007
    Given production ChecklistRun Draft test 1 references draft snapshot and template 24
    When actual specification controls create draft snapshot 25 with a changed Purchase expectation
    Then persisted Draft test 1 and every rendered row remain pinned to snapshot and template 24
    And actual UI labels it Older specification and offers a separate blank run from draft 25

  # Data layer Flow manual test expectations runtime 008
  Scenario: Data layer Flow manual test expectations runtime 008
    Given installed Builder and side panel opened production ChecklistRun Retail test 1 at run revision 2
    When actual controls save disjoint note and actual-count patches in both orders
    Then final run revision 4 contains both values exactly once
    When actual controls submit overlapping stale status patches
    Then production conflict UI prevents silent overwrite and leaves project and release bytes unchanged

  # Data layer Flow manual test expectations runtime 009
  Scenario: Data layer Flow manual test expectations runtime 009
    Given production checklist marks Shipping and Payment as parallel required expectations
    When actual controls record Shipping Seen and leave Payment Not checked
    Then both exact manual states persist and render independently
    And production UI and storage contain no active branch, waiting join, completed join, or journey Pass result
