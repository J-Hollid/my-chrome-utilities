# mutation-stamp: sha256=6a495087a6e69ac27f5135ebf3181344e1a212a971719d2a8a8a97ffdf3b5c68
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T23:52:14.967621057Z","feature_name":"Data layer missing-event report representation fidelity","feature_path":"features/data-layer-missing-event-report-representation-fidelity.feature","background_hash":"90f0dfc5f993ac16d0614f2f7c6f9d81ba939071a717775ae8e6c8cdb31d680c","implementation_hash":"unknown","scenarios":[{"index":3,"name":"Data layer missing-event report representation fidelity 004","scenario_hash":"39728f41875bb7d0f913e1dbf6dfa2287afe2121527aed2f4b369fc64c893b72","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-14T23:52:14.967621057Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer missing-event report representation fidelity

  Background:
    Given a missing pageview report is being built from Generic pageview revision 4
    And its expected payload is {"page_type":"product_detail","products":[{"id":1,"name":"robot"}]}
    And schema-value response provenance is retained for the expected properties

  # Data layer missing-event report representation fidelity 001
  Scenario: Data layer missing-event report representation fidelity 001
    When Expected result is previewed
    Then it contains pageview is fired with exactly once
    And one indented multiline JSON block contains the expected payload
    And object properties and array items retain their nested line structure
    And no compact one-line copy of the payload is displayed
    And no generated payload text is repeated as explanation prose

  # Data layer missing-event report representation fidelity 002
  Scenario: Data layer missing-event report representation fidelity 002
    Given required expected values are still incomplete
    When the live report preview refreshes
    Then the current expected payload uses the same multiline JSON presentation as a complete report
    And its line breaks do not collapse into a paragraph
    And completing expectation confirmation or absence verification does not switch to a different Expected result format

  # Data layer missing-event report representation fidelity 003
  Scenario: Data layer missing-event report representation fidelity 003
    When Report details are first displayed
    Then Expected result additional text is an empty optional multiline field
    And the field is not populated from the event narrative, expected payload, schema, or response provenance
    And preview refreshes leave the unedited field empty
    And an empty field contributes no blank prose or duplicate content to the report

  # Data layer missing-event report representation fidelity 004
  Scenario Outline: Data layer missing-event report representation fidelity 004
    Given Expected result additional text has <field_state>
    When Expected result is generated
    Then additional prose is <prose_outcome>
    And pageview is fired with appears once after any additional prose
    And the expected payload appears once as indented multiline JSON

    Examples:
      | field_state                                     | prose_outcome                                      |
      | never been edited                               | omitted                                            |
      | operator-entered text Checkout should emit it   | Checkout should emit it appears once               |
      | operator-entered whitespace                     | omitted                                            |

  # Data layer missing-event report representation fidelity 005
  Scenario: Data layer missing-event report representation fidelity 005
    Given /page_type uses schema-provided value product_detail from Page type requirement revision 1
    And /products/0/id uses operator custom response 1
    When the report is previewed, copied, saved, reopened, or recopied
    Then no response-source or rule-provenance line is included in any report section
    And /page_type response source and /products/0/id response source are absent
    And response-source and rule-provenance data remain available internally for expected-payload editing and validation

  # Data layer missing-event report representation fidelity 006
  Scenario: Data layer missing-event report representation fidelity 006
    Given reproduction steps are Visit /products, Click Robot, Visit /checkout, and Expect pageview to be pushed
    When Steps to reproduce is previewed
    Then the four steps are displayed as a multiline numbered list in that order
    And each pathname anchor and manual step occupies its own list item
    And the steps are not collapsed into one paragraph

  # Data layer missing-event report representation fidelity 007
  Scenario: Data layer missing-event report representation fidelity 007
    Given the missing-event report is complete
    When the live preview, Jira clipboard text, saved defect representation, reopened preview, and recopied text are compared
    Then Expected result has the same optional prose, narrative, payload values, indentation, and line order in every representation
    And Steps to reproduce has the same numbering, text, and line order in every representation
    And Schema expectation and Capture evidence remain separate from Expected result

  # Data layer missing-event report representation fidelity 008
  Scenario: Data layer missing-event report representation fidelity 008
    Given the operator changes a nested expected value, additional text, and a reproduction step
    When the report preview refreshes
    Then each edit appears once in its corresponding report section
    And unchanged JSON indentation and reproduction numbering are preserved
    And stale generated narrative, payload, additional text, and step content are absent

  # Data layer missing-event report representation fidelity 009
  Scenario: Data layer missing-event report representation fidelity 009
    Given expected string values and additional text contain HTML-significant characters and line breaks
    When rich preview and plain-text report representations are generated
    Then the preview displays the literal operator content without interpreting it as markup
    And the plain-text representation preserves meaningful line breaks
    And formatting does not change expected payload values
