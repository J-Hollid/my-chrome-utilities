# mutation-stamp: sha256=803cb0df363c8ed7ecb0b5439d06e84f650473344d4b6abb2053ca9a79de3c95
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T13:22:05.422001779Z","feature_name":"Data layer unified defect report builder runtime","feature_path":"features/data-layer-unified-defect-report-builder-runtime.feature","background_hash":"f6ee3e970891aa153dcb36f40b0750c0702df2610e23ac0198173630887e3e10","implementation_hash":"sha256:6e1a64fe114a25ae94a2f16266a00dca323e0f9639f92e8f6cf89df57ae757a3","scenarios":[{"index":6,"name":"Data layer unified defect report builder runtime 007","scenario_hash":"76d777153ba0de097bb3036246a8d7b96bcf21b200811216644793feaec1e410","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-15T13:22:05.422001779Z"},{"index":0,"name":"Data layer unified defect report builder runtime 001","scenario_hash":"b7d4fe0327a07747c230bedb3c27f304fabe5ddabdf0245f6b5c0ce7c7ac7b23","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-14T18:38:05.958032512Z"}]}
# acceptance-mutation-manifest-end

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
    Given production Generic pageview revision 4 has required page_name and products array items requiring numeric id and string name
    When the rendered missing-event builder selects that schema and confirms its expectation
    Then the production editor renders the complete recursive schema tree with canonical paths and types
    When the operator enters page_name test, adds one products item with id 1 and name robot, duplicates it, and removes the duplicate
    Then production Expected result renders pageview is fired with {"page_name":"test","products":[{"id":1,"name":"robot"}]}
    And the rendered preview uses the same indented JSON object and array presentation as a captured Live event
    And production Actual result renders no matching event pushed or observed without an invented payload or event id
    And no Observation interval controls or timestamp range appear

  # Data layer unified defect report builder runtime 003
  Scenario: Data layer unified defect report builder runtime 003
    Given rendered reproduction start /products and endpoint /checkout are selected
    When the operator generates the journey and uses its between-path controls to add Click component, Log in as user, Scroll, and Custom step entries
    Then production From pathname and To pathname controls remain visible with /products and /checkout
    And the rendered numbered journey retains captured pathname anchors and a final expected-purchase assertion
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
    And no Create missing-event report control exists
    And production copy and save actions are disabled only until required expected values, expectation confirmation, and absence verification succeed

  # Data layer unified defect report builder runtime 006
  Scenario: Data layer unified defect report builder runtime 006
    Given the rendered missing-event report is complete with a nested expected payload
    When Copy for Jira Cloud runs through the side-panel clipboard boundary
    Then the current preview is written once and success appears only after the write resolves
    When Save defect runs through production persistence
    Then the Defect Library count increases by 1 and the saved defect can be opened
    When that defect is edited and recopied
    Then the production preview and Jira representation retain the nested expected payload, schema expectation, reproduction journey, timeline, and edits
    And navigation restores the selected page visit, common builder state, scroll, and focus
    And runtime coverage exercises production composers and rendered controls rather than source-string checks or acceptance-only state

  # Data layer unified defect report builder runtime 007
  Scenario Outline: Data layer unified defect report builder runtime 007
    Given the rendered missing-event report is complete
    And the production <boundary> rejects its operation
    When the operator activates <report_action>
    Then rendered feedback is <failure_feedback>
    And no success feedback or persisted partial defect exists
    And the expected payload and report preview remain available for retry

    Examples:
      | boundary                   | report_action            | failure_feedback |
      | Jira clipboard adapter     | Copy for Jira Cloud      | Copy failed      |
      | Defect Library persistence | Save defect              | Save failed      |

  # Data layer unified defect report builder runtime 008
  Scenario: Data layer unified defect report builder runtime 008
    Given production absence verification finds a matching purchase event in the selected page visit
    When the rendered warning is overridden without an observation interval
    Then the matching-event evidence and operator override remain in preview, Jira copy, and saved defect
    And changing To pathname reruns verification against that distinct page visit
    And same-URL visits remain distinct by page-visit identity rather than an editable timestamp range
