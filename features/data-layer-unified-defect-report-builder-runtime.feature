Feature: Data layer unified defect report builder runtime

  Background:
    Given the built extension side panel is running with production defect reporting, schema validation, session chronology, Jira export, and Defect Library persistence
    And a production session contains /products and /checkout visits without the expected purchase event

  # Data layer unified defect report builder runtime 001
  Scenario Outline: Data layer unified defect report builder runtime 001
    Given the rendered report builder is opened for <defect_kind>
    When its production controls are inspected
    Then rendered common stages are Expected result, Steps to reproduce, Supporting timeline, Report details, report preview, copy, and save
    And the kind-specific evidence stage is <evidence_stage>

    Examples:
      | defect_kind               | evidence_stage                                       |
      | captured validation issue | validation issue selection and captured Actual result |
      | missing purchase event    | expected-event confirmation and absence verification  |

  # Data layer unified defect report builder runtime 002
  Scenario: Data layer unified defect report builder runtime 002
    Given production Checkout purchase revision 4 has required order_id and allowed currency values EUR and USD
    When the rendered missing-event builder selects that schema and confirms its expectation
    Then production Expected result renders the schema-derived event identity and required property constraints
    And schema values, generic constraints, and custom responses use the production expected-response controls
    And production Actual result renders no matching event pushed or observed without an invented payload or event id

  # Data layer unified defect report builder runtime 003
  Scenario: Data layer unified defect report builder runtime 003
    Given rendered reproduction start /products and endpoint /checkout are selected
    When the operator uses production controls to add Click component, Log in as user, Scroll, and Custom step entries
    Then the rendered numbered journey retains captured pathname anchors and a final expected-purchase assertion
    And production Adjust, Remove, local reorder, cancel, and focus restoration behaviors match the validation-issue composer
    And changing the endpoint reruns production absence verification without silently losing retained manual steps

  # Data layer unified defect report builder runtime 004
  Scenario: Data layer unified defect report builder runtime 004
    Given production session events surround the missing-event endpoint
    When the rendered Supporting timeline composer searches, selects, and configures an event
    Then the bounded production event chooser and Summary, Payload, and Validation details controls are used
    And the configured entry can be adjusted and removed without changing session events
    And no missing-event placeholder is available as a timeline event

  # Data layer unified defect report builder runtime 005
  Scenario: Data layer unified defect report builder runtime 005
    Given the rendered missing-event builder has selected Checkout purchase revision 4
    When production expected values, steps, timeline, and report detail fields are edited
    Then the rendered report preview updates after each edit with current Actual and Expected results
    And the preview is present before final report creation rather than appearing only after completion
    And production copy and save actions are disabled until expectation confirmation and absence verification succeed

  # Data layer unified defect report builder runtime 006
  Scenario: Data layer unified defect report builder runtime 006
    Given production absence verification finds a matching purchase event
    When the rendered warning is overridden and the missing-event report is saved, reopened, edited, and recopied
    Then the production preview and Jira representation retain the matching-event override, schema expectation, reproduction journey, timeline, and edits
    And navigation restores the selected page visit, common builder state, scroll, and focus
    And runtime coverage exercises production composers and rendered controls rather than source-string checks or acceptance-only state
