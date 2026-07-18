# mutation-stamp: sha256=bfead3f0bdcc11128b6ca00a32cedc187aae1c7eb2e3fd14f0e67fc862db6574
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:34:04.648279869Z","feature_name":"Data layer staged multiformat bulk authoring","feature_path":"features/data-layer-staged-multiformat-bulk-authoring.feature","background_hash":"a08c8a5644678d8f1cfe5044ec24d86ece71726f2ffffaa210385d8642f6d9fe","implementation_hash":"sha256:dd91e5c555535219aaf59b526d9f410530b6cff4e58059d710403b3d43191f7e","scenarios":[{"index":0,"name":"Data layer staged multiformat bulk authoring 001","scenario_hash":"1468e629dfd44ab2b4ef1f72fcd9c351dca0fdc7c1e0272287da30d705639f48","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-18T12:34:04.648279869Z"}]}
# acceptance-mutation-manifest-end

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
