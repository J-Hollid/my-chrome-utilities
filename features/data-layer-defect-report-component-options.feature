Feature: Data layer defect report component options

  Background:
    Given captured purchase has selected validation issues for /commerce/currency and /order_id
    And its defect report contains Actual result, corrected Expected result, semantic differences, validation-rule evidence, and capture metadata
    And the captured-event defect report builder is open

  # Data layer defect report component options 001
  Scenario: Data layer defect report component options 001
    When Report sections are displayed
    Then Include differences list is selected by default
    And Include validation rules covered is cleared by default
    And Include capture metadata is cleared by default
    And the preview contains Summary, Description, Steps to reproduce, Actual result, Expected result, and Differences
    And the preview omits Validation evidence, Validation rules covered, and Capture metadata

  # Data layer defect report component options 002
  Scenario Outline: Data layer defect report component options 002
    Given Include validation rules covered is <rules_state>
    And Include capture metadata is <capture_state>
    When the preview refreshes
    Then Validation rules covered is displayed exactly when its checkbox is selected
    And Capture metadata is displayed exactly when its checkbox is selected
    And Validation evidence is displayed exactly when at least one evidence checkbox is selected

    Examples:
      | rules_state | capture_state |
      | cleared     | cleared       |
      | selected    | cleared       |
      | cleared     | selected      |
      | selected    | selected      |

  # Data layer defect report component options 003
  Scenario: Data layer defect report component options 003
    Given both evidence checkboxes are selected
    When Validation evidence is generated
    Then Validation rules covered contains assigned schema name and revision
    And each selected issue contributes rule identity and revision, severity, pointer, violation, constraint, and actual state once
    And Capture metadata contains event name, source, page URL, and capture time once
    And deselected issues and correction response provenance are absent from both components
    And the report's structured validation evidence and captured event remain unchanged

  # Data layer defect report component options 004
  Scenario: Data layer defect report component options 004
    Given Include differences list is cleared
    When the report representation is generated
    Then the Differences heading and semantic difference list are omitted
    And Actual result retains invalid-field highlighting and Expected result retains correction highlighting
    And both JSON comparisons remain unchanged and readable without the list
    And structured Actual and Expected differences remain available for report editing, highlighting, and defect matching
    When Include differences list is selected again
    Then one deterministic semantic line per included Actual and Expected difference is restored

  # Data layer defect report component options 005
  Scenario: Data layer defect report component options 005
    Given the operator selects Include capture metadata and clears Include differences list
    When the report refreshes after issue, expected-response, reproduction-step, and timeline edits
    Then all three component checkbox states remain unchanged
    And focus and report scroll remain associated with the operated control
    When the report is previewed, copied as rich and plain Jira content, saved, reopened, edited, saved again, and recopied
    Then the component selections are stored with the defect report
    And every representation contains only Capture metadata among the optional components
    And Summary, Description, Steps to reproduce, Actual result, and Expected result remain included
    And saving report text or internal notes does not reset component selections
    And no omitted structured difference, evidence, or capture data is deleted

  # Data layer defect report component options 006
  Scenario: Data layer defect report component options 006
    Given a legacy saved captured-event defect has no stored component selections
    When it is reopened or recopied
    Then Differences, Validation rules covered, and Capture metadata retain their historical included presentation
    And the legacy record is not mutated until an explicit save
    And a newly created report still starts with only Include differences list selected
