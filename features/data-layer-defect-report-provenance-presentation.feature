# mutation-stamp: sha256=f4c5f0d8a3c833ccd9e4177aa63574caa7913f4d8bdeb1c22de2ed8fb6c51459
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T08:26:07.425061721Z","feature_name":"Data layer defect report provenance presentation","feature_path":"features/data-layer-defect-report-provenance-presentation.feature","background_hash":"0e13b5014a6f29a2d175889de946054154d99383d7c4322f1eb19bd346a77fe6","implementation_hash":"sha256:9b3a87f2a0099d7f2a08b1f8012d2368549c2222b42ddd8620101f16cc397d75","scenarios":[{"index":1,"name":"Data layer defect report provenance presentation 002","scenario_hash":"10f0fb1ee61ffe0f937a8180048595a8a34dc84545e7f096dce758fcbda44039","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-15T08:26:07.425061721Z"},{"index":4,"name":"Data layer defect report provenance presentation 005","scenario_hash":"04efafa9c312c27a7f329c72b7893b3969ace62e1c74e5c475ba235282f931a4","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-15T08:26:07.425061721Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer defect report provenance presentation

  Background:
    Given a captured-event defect report removes undeclared /action
    And it adds required /error_action from an exact-value schema rule
    And it adds required /error_message from an operator custom override
    And every correction retains its response source and rule provenance internally
    And Include validation rules covered is selected

  # Data layer defect report provenance presentation 001
  Scenario: Data layer defect report provenance presentation 001
    When Expected result is presented
    Then it contains the current expected-result explanation and expected payload
    And it contains no automatically generated response-source line
    And it contains no automatically generated value-rule-provenance line
    And correction provenance is not repeated as expected-result prose

  # Data layer defect report provenance presentation 002
  Scenario Outline: Data layer defect report provenance presentation 002
    Given correction provenance contains <metadata>
    When the report representation is generated
    Then automatically generated text <forbidden_text> is absent from every report section
    And the structured correction retains <metadata>

    Examples:
      | metadata                                      | forbidden_text                                      |
      | schema declared-property policy               | action response source: schema declared-property policy |
      | schema constraint                             | page_type response source: schema constraint         |
      | schema-provided value                         | error_action response source: assigned schema         |
      | operator custom override                      | error_message response source: operator custom override |
      | Exact value for error_action v1 from revision 7 | error_action value-rule provenance: Exact value for error_action v1 |

  # Data layer defect report provenance presentation 003
  Scenario: Data layer defect report provenance presentation 003
    When the operator reviews an expected-response control
    Then the control identifies schema declared-property policy, assigned schema, or operator custom override as applicable
    And schema-provided choices retain effective rule and schema revision provenance
    And changing the response updates structured provenance without injecting prose into Expected result
    And the presentation boundary does not remove assistance from the builder controls

  # Data layer defect report provenance presentation 004
  Scenario: Data layer defect report provenance presentation 004
    When Validation evidence is presented
    Then it retains assigned schema name and revision, failed rule identity and revision, severity, pointer, violation, expected constraint, and actual state
    And it does not add correction response-source or value-rule-provenance lines
    And correction provenance remains separately available to report editing and validation

  # Data layer defect report provenance presentation 005
  Scenario Outline: Data layer defect report provenance presentation 005
    Given Expected result explanation is <operator_text>
    When the report representation is generated
    Then explanation prose is <prose_outcome>
    And automatic provenance remains absent

    Examples:
      | operator_text                                                   | prose_outcome                                      |
      | Verify the schema mapping with the implementation team          | preserved verbatim                                 |
      | error_action response source: confirm with the implementation team | preserved verbatim because it is operator-authored |
      | whitespace                                                      | omitted                                            |

  # Data layer defect report provenance presentation 006
  Scenario: Data layer defect report provenance presentation 006
    Given the report contains removals, schema-value additions, custom additions, and replacements
    When Expected result, Differences, and Validation evidence are generated
    Then Expected result contains each expected payload value once
    And Differences contains semantic operation descriptions without response-source prose
    And Validation evidence contains validation facts without duplicating correction provenance
    And the report remains understandable from payload, differences, and validation evidence

  # Data layer defect report provenance presentation 007
  Scenario: Data layer defect report provenance presentation 007
    When live preview, Jira rich text, Jira plain text, saved defect presentation, reopened preview, and recopied output are compared
    Then none exposes automatically generated response-source or value-rule-provenance lines
    And each displays the same expected-result explanation and expected payload
    And the saved and reopened correction model retains response source, rule provenance, operation, and issue association
    And reopening does not convert retained metadata into report prose

  # Data layer defect report provenance presentation 008
  Scenario: Data layer defect report provenance presentation 008
    Given a saved captured-event report predates provenance suppression
    And its response sources and value-rule provenance are stored as structured correction metadata
    When it is reopened or recopied
    Then automatically generated provenance lines are suppressed from the current representation
    And the structured metadata remains available for editing and another save
    And operator-authored explanation text is not removed by matching its words against provenance labels

  # Data layer defect report provenance presentation 009
  Scenario: Data layer defect report provenance presentation 009
    Given captured-event and missing-event reports contain equivalent response provenance
    When their final representations are generated
    Then both suppress automatically generated response-source and rule-provenance prose
    And both retain structured provenance for their respective expected-value editors
    And defect kind does not change the provenance presentation boundary

  # Data layer defect report provenance presentation 010
  Scenario: Data layer defect report provenance presentation 010
    Given the captured event, validation result, schema, and correction model have been recorded
    When the report is previewed, copied, saved, reopened, or recopied
    Then provenance suppression changes only derived report presentation
    And no source event, validation evidence, schema, assignment, expected payload, response choice, or correction metadata is mutated
