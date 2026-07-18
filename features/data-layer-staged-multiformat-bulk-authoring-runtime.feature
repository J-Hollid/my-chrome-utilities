Feature: Data layer staged multiformat bulk authoring runtime

  Background:
    Given the built unpacked extension has an empty Profile open in the rendered grid
    And no project state has been directly populated

  # Data layer staged multiformat bulk authoring runtime 001
  Scenario Outline: Data layer staged multiformat bulk authoring runtime 001
    When the operator uses the actual <mechanism> to supply requirements
    Then the rendered staging grid appears before the Profile changes
    And the browser-visible provenance names <format>
    Examples:
      | mechanism | format |
      | clipboard paste | spreadsheet paste |
      | file chooser | CSV |
      | file chooser | JSON example |
      | file chooser | JSON Schema |
      | template selector | reusable template |

  # Data layer staged multiformat bulk authoring runtime 002
  Scenario: Data layer staged multiformat bulk authoring runtime 002
    When the operator pastes 100 valid rows and 3 malformed rows through the actual clipboard
    Then 103 staged rows and 3 exact cell errors are rendered
    And reopening the Profile before commit shows zero added requirements

  # Data layer staged multiformat bulk authoring runtime 003
  Scenario: Data layer staged multiformat bulk authoring runtime 003
    Given the 103-row stage is visible
    When the operator repairs 2 cells, excludes 1 row, selects 25 rows, and applies Required, Severity, Description, Allowed values, and a reusable rule
    Then 102 rows are committable and exactly 25 show all 5 bulk changes
    And keyboard review reaches every changed and excluded row

  # Data layer staged multiformat bulk authoring runtime 004
  Scenario: Data layer staged multiformat bulk authoring runtime 004
    Given 102 staged rows are committable
    When the operator activates Commit once
    Then the rendered Profile and canonical browser state contain 102 requirements in one revision
    When the operator activates Undo once
    Then both return to zero requirements and the prior revision identity

  # Data layer staged multiformat bulk authoring runtime 005
  Scenario: Data layer staged multiformat bulk authoring runtime 005
    Given staging was created before a second extension page saved a newer project revision
    When the operator activates Commit
    Then a visible stale-stage conflict prevents every row from committing
    And Rebase preserves all repairs, exclusions, selections, and provenance

  # Data layer staged multiformat bulk authoring runtime 006
  Scenario: Data layer staged multiformat bulk authoring runtime 006
    Given the rendered Profile contains 500 requirements
    When the operator searches and scrolls to rows 41, 250, and 500
    Then each requested row is rendered and editable
    And computed layout and DOM inspection show bounded windowing rather than a fixed first-40 slice
    And measured interaction tasks remain within 100 milliseconds

  # Data layer staged multiformat bulk authoring runtime 007
  Scenario: Data layer staged multiformat bulk authoring runtime 007
    Given a reusable ecommerce subtree is visible in the template selector
    When the operator inserts one shared reference and one independent copy
    Then the rendered stage distinguishes both semantics and provenance
    And editing the reusable source updates only the shared reference after review
    And one Undo restores the prior source and consumer states

  # Data layer staged multiformat bulk authoring runtime 008
  Scenario: Data layer staged multiformat bulk authoring runtime 008
    Given the actual clipboard contains 100 valid rows and 3 repairable invalid rows
    When the operator stages, repairs 2 rows, excludes 1 row, multi-applies Required, Severity, Description, Allowed values, and one reusable rule, commits, verifies, and activates Undo once through rendered controls
    Then recorded monotonic time for the complete workflow is under 2 minutes
    And the timing record includes parsing, staging, repair, exclusion, multi-actions, review, commit, rendered verification, and Undo
    And visible and persisted state equal the exact pre-import revision
