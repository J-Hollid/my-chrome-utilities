Feature: Data layer staged multiformat bulk authoring

  Background:
    Given a Requirement Profile is open in its full-width authoring workspace

  # Data layer staged multiformat bulk authoring 001
  Scenario Outline: Data layer staged multiformat bulk authoring 001
    When the operator supplies a valid <input>
    Then candidate requirements appear in a staged grid before the project changes
    And source format, source location, inferred values, and provenance are retained
    Examples:
      | input |
      | JSON example |
      | JSON Schema |
      | CSV or spreadsheet file |
      | tabular clipboard paste |
      | reusable template |

  # Data layer staged multiformat bulk authoring 002
  Scenario: Data layer staged multiformat bulk authoring 002
    Given a 103-row paste contains 100 valid rows and 3 invalid cells
    When staging completes
    Then all 103 rows are reachable without changing the profile
    And each invalid cell names its raw value, normalized candidate, and actionable error

  # Data layer staged multiformat bulk authoring 003
  Scenario: Data layer staged multiformat bulk authoring 003
    Given staged rows include Path, Type, Required, Forbidden, Allowed values, Description, Example, Rule, Severity, and Origin
    When the operator repairs 2 invalid cells and excludes 1 row
    Then the preview contains 102 committable rows and no hidden error
    And excluded source data remains visible in the staging audit

  # Data layer staged multiformat bulk authoring 004
  Scenario: Data layer staged multiformat bulk authoring 004
    Given 25 staged requirements are selected
    When the operator applies Required, Severity, Description, Allowed values, and one reusable rule
    Then all 25 staged rows show all 5 changes through multi-selection actions
    And no unselected row changes

  # Data layer staged multiformat bulk authoring 005
  Scenario: Data layer staged multiformat bulk authoring 005
    Given a reusable ecommerce subtree is available
    When the operator inserts it as a shared reference and inserts another as an independent copy
    Then the staged grid distinguishes reference and copy semantics
    And Where used and provenance identify the shared subtree consumers

  # Data layer staged multiformat bulk authoring 006
  Scenario: Data layer staged multiformat bulk authoring 006
    Given 102 staged rows are valid
    When the operator confirms Commit
    Then one project transaction adds 102 requirements and recompiles the effective schema
    And selecting Undo once restores the exact pre-import project revision

  # Data layer staged multiformat bulk authoring 007
  Scenario: Data layer staged multiformat bulk authoring 007
    Given staging was based on project revision 20
    And another surface has committed revision 21
    When the operator attempts to commit the staged rows
    Then no staged row is partially committed
    And the operator can rebase the retained staging changes onto revision 21

  # Data layer staged multiformat bulk authoring 008
  Scenario: Data layer staged multiformat bulk authoring 008
    Given 500 staged and committed requirements exist
    When the operator uses keyboard selection, search, and scrolling to rows 41, 250, and 500
    Then each row becomes editable through real windowing
    And the permanent document does not contain every row control

  # Data layer staged multiformat bulk authoring 009
  Scenario: Data layer staged multiformat bulk authoring 009
    Given the timed acceptance input contains 100 valid rows and 3 repairable invalid rows
    When the operator stages, repairs 2 rows, excludes 1 row, multi-applies Required, Severity, Description, Allowed values, and one reusable rule, commits, verifies, and selects Undo once
    Then the complete visible workflow finishes within 2 minutes
    And timing does not exclude parsing, staging, repair, exclusion, multi-actions, review, commit, rendered verification, or Undo
    And Undo restores the exact pre-import revision
