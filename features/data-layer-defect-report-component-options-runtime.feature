Feature: Data layer defect report component options runtime

  Background:
    Given the built extension side panel is running with production validation, captured-event defect reporting, Jira export, and Defect Library persistence
    And production purchase has selected validation issues, corrected expected values, semantic differences, validation evidence, and capture metadata
    And the actual Create defect report action has opened the production builder

  # Data layer defect report component options runtime 001
  Scenario: Data layer defect report component options runtime 001
    When the production Report sections controls render
    Then actual checkboxes render Include differences list selected, Include validation rules covered cleared, and Include capture metadata cleared
    And the production preview renders Differences but no Validation evidence component
    And required report sections remain rendered

  # Data layer defect report component options runtime 002
  Scenario Outline: Data layer defect report component options runtime 002
    Given production Include validation rules covered is <rules_state>
    And production Include capture metadata is <capture_state>
    When the actual preview, rich representation, and plain representation render
    Then each optional evidence component is rendered exactly when its checkbox is selected
    And the Validation evidence heading is rendered exactly when at least one evidence checkbox is selected
    And all three representations agree

    Examples:
      | rules_state | capture_state |
      | cleared     | cleared       |
      | selected    | cleared       |
      | cleared     | selected      |
      | selected    | selected      |

  # Data layer defect report component options runtime 003
  Scenario: Data layer defect report component options runtime 003
    Given both production evidence checkboxes are selected
    When the actual Validation evidence component renders
    Then rules output contains schema revision and selected rule, severity, pointer, violation, constraint, and actual fields once
    And capture output contains event name, source, page URL, and capture time once
    And production correction provenance is not duplicated into either output

  # Data layer defect report component options runtime 004
  Scenario: Data layer defect report component options runtime 004
    Given the production Include differences list checkbox is cleared
    When actual preview, Jira rich text, and Jira plain text render
    Then none contains a Differences heading or semantic list
    And production Actual and Expected JSON retain their red and green pointer highlighting in rich output
    And the generated report retains byte-equivalent structured differences
    When the checkbox is selected again
    Then the production semantic list returns without missing, reordered, or duplicate lines

  # Data layer defect report component options runtime 005
  Scenario: Data layer defect report component options runtime 005
    Given production selection includes capture metadata and omits differences and validation rules covered
    When actual issue, expected-response, reproduction-step, and timeline controls refresh the report
    Then checkbox state, selected components, focus, and report scroll survive each rerender
    And no checkbox interaction changes production event, validation, schema, expected payload, correction, or timeline data
    When Copy for Jira Cloud, plain fallback, Save defect, reopen, edit, save again, and recopy are exercised through actual controls
    Then preview, rich clipboard, plain clipboard, saved preview, reopened preview, and recopied output contain only Capture metadata among optional components
    And stored component selections survive report-text and internal-note edits
    And structured differences and validation evidence remain stored but unrendered

  # Data layer defect report component options runtime 006
  Scenario: Data layer defect report component options runtime 006
    Given a production-compatible legacy saved defect has no component-selection data
    When it is opened and recopied through actual Defect Library controls
    Then its historical Differences and full Validation evidence remain rendered and copied
    And production restoration does not mutate the legacy record
    And opening a new actual builder uses the new evidence-off defaults
