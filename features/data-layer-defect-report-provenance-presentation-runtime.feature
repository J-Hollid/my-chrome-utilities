Feature: Data layer defect report provenance presentation runtime

  Background:
    Given the built extension side panel is running with production validation, captured-event defect reporting, Jira export, and Defect Library persistence
    And a production report removes undeclared /action, adds schema-provided /error_action, and adds custom /error_message
    And production corrections retain response sources and effective rule provenance

  # Data layer defect report provenance presentation runtime 001
  Scenario: Data layer defect report provenance presentation runtime 001
    When the operator activates the actual Create defect report action
    Then the production Final report preview contains the expected payload corrections
    And it contains no response source: text
    And it contains no value-rule provenance: text
    And it contains no schema declared-property policy, schema-provided value, or operator custom override prose generated from correction metadata

  # Data layer defect report provenance presentation runtime 002
  Scenario Outline: Data layer defect report provenance presentation runtime 002
    Given a production correction contains <source_kind>
    And its expected payload operation is <operation>
    When actual rich HTML and plain text representations are generated
    Then neither representation contains <generated_line>
    And both retain the corrected payload and semantic <operation> difference

    Examples:
      | source_kind                       | operation | generated_line                                               |
      | schema declared-property policy   | remove    | action response source: schema declared-property policy      |
      | schema constraint                 | replace   | page_type response source: schema constraint                 |
      | schema-provided value             | add       | error_action response source: assigned schema                |
      | operator custom override          | add       | error_message response source: operator custom override      |
      | exact-value rule revision metadata | add       | error_action value-rule provenance: Exact value rule v1      |

  # Data layer defect report provenance presentation runtime 003
  Scenario: Data layer defect report provenance presentation runtime 003
    Given the actual expected-response controls are rendered
    When removal, schema value, and custom response choices are inspected and changed
    Then their rendered controls identify the response sources needed to make the choice
    And the production correction model records typed response, source, rule provenance, operation, and issue association
    And every preview refresh omits generated provenance prose

  # Data layer defect report provenance presentation runtime 004
  Scenario: Data layer defect report provenance presentation runtime 004
    Given production Expected result explanation contains operator text error_action response source: confirm with the implementation team
    When the actual preview and Jira representations are generated
    Then that operator-authored sentence is preserved verbatim
    And generated correction provenance remains absent
    And suppression operates on structured presentation fields rather than filtering report text

  # Data layer defect report provenance presentation runtime 005
  Scenario: Data layer defect report provenance presentation runtime 005
    Given production validation evidence and correction provenance identify the same schema and rule
    When the actual report is rendered
    Then Validation evidence contains the validation schema, rule, severity, pointer, violation, constraint, and actual state once
    And Expected result and Differences contain no duplicated response-source or provenance line
    And structured correction provenance remains available after rendering

  # Data layer defect report provenance presentation runtime 006
  Scenario: Data layer defect report provenance presentation runtime 006
    Given the production report contains all supported correction source kinds
    When Copy for Jira Cloud, plain-text fallback, Save as reported defect, reopen, and recopy are exercised through actual controls
    Then preview, rich clipboard, plain clipboard, saved presentation, reopened preview, and recopied output all suppress generated provenance prose
    And every operation retains the same expected payload and operator explanation
    And the persisted and reopened correction model retains all response sources and rule provenance

  # Data layer defect report provenance presentation runtime 007
  Scenario: Data layer defect report provenance presentation runtime 007
    Given a production-compatible legacy saved report has structured correction provenance
    When it is opened and recopied through actual Defect Library controls
    Then current rendered and copied representations suppress generated provenance lines
    And builder controls can still reconstruct response-source assistance from the stored corrections
    And the legacy record is unchanged until an explicit operator save

  # Data layer defect report provenance presentation runtime 008
  Scenario: Data layer defect report provenance presentation runtime 008
    Given production captured-event and missing-event reports use schema and custom response sources
    When both actual builders preview, copy, save, reopen, and recopy their reports
    Then neither defect kind exposes generated response-source or rule-provenance prose
    And both retain structured provenance for re-editing and validation
    And runtime coverage exercises production correction creation, controls, preview generation, rich and plain export, persistence, reopening, and recopy rather than source-string inspection

  # Data layer defect report provenance presentation runtime 009
  Scenario: Data layer defect report provenance presentation runtime 009
    Given the actual captured-event builder is 320 CSS pixels wide
    When the operator reviews response assistance and the final report using keyboard controls
    Then response-source assistance remains reachable at the relevant correction controls
    And the report stays readable without provenance noise or horizontal page scrolling
    And focus and report scroll remain stable across provenance-changing rerenders
