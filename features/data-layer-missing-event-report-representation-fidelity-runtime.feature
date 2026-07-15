# mutation-stamp: sha256=e6701bf44d8ebd47097bec1b18073478b2ae91c9eb986c1642b3920f9c7af98a
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T23:52:25.361669170Z","feature_name":"Data layer missing-event report representation fidelity runtime","feature_path":"features/data-layer-missing-event-report-representation-fidelity-runtime.feature","background_hash":"262e27bf6936d8e3112de14368be18ebf316985fcea3106068e4204ade0a4857","implementation_hash":"unknown","scenarios":[]}
# acceptance-mutation-manifest-end

Feature: Data layer missing-event report representation fidelity runtime

  Background:
    Given the built extension side panel is running with the production missing-event builder, report preview, Jira copy, and Defect Library persistence
    And the actual expected-payload editor contains page_type product_detail and products item id 1 with name robot
    And actual response provenance includes Page type requirement revision 1

  # Data layer missing-event report representation fidelity runtime 001
  Scenario: Data layer missing-event report representation fidelity runtime 001
    Given the production missing-event report is not yet complete
    When the actual Final report preview is rendered
    Then Expected result contains one preformatted JSON block with multiple rendered lines
    And the block represents {"page_type":"product_detail","products":[{"id":1,"name":"robot"}]}
    And no whitespace-collapsing paragraph contains the JSON payload
    When the report becomes complete
    Then the same Expected result DOM structure and formatting are retained

  # Data layer missing-event report representation fidelity runtime 002
  Scenario: Data layer missing-event report representation fidelity runtime 002
    When the production Report details controls are rendered
    Then Expected result additional text is an empty textarea marked optional
    And its value does not contain pageview is fired with, JSON, schema text, or response provenance
    When unrelated expected values and reproduction steps refresh the preview
    Then the same unedited textarea remains empty
    And it does not introduce content into the production report model

  # Data layer missing-event report representation fidelity runtime 003
  Scenario: Data layer missing-event report representation fidelity runtime 003
    Given the operator enters Checkout should emit a pageview as Expected result additional text
    When the production report becomes complete
    Then the actual preview contains that text once before pageview is fired with
    And pageview is fired with appears once
    And the nested payload appears once in one preformatted multiline JSON block
    And generated expectation and schema text do not duplicate the narrative

  # Data layer missing-event report representation fidelity runtime 004
  Scenario: Data layer missing-event report representation fidelity runtime 004
    Given production expected fields contain schema-provided and operator custom response sources
    When the actual preview and Jira clipboard text are generated
    Then neither contains response source, schema-provided value, operator custom response, or a provenance revision line
    And the production draft and saved report retain response-source metadata for re-editing the expected payload

  # Data layer missing-event report representation fidelity runtime 005
  Scenario: Data layer missing-event report representation fidelity runtime 005
    Given actual reproduction steps are Visit /products, Click Robot, Visit /checkout, and Expect pageview to be pushed
    When the production Final report preview is rendered
    Then Steps to reproduce is an ordered list with four list items in that order
    And no paragraph contains all four steps
    When Jira plain text is copied
    Then the four steps occupy separate numbered lines in the same order

  # Data layer missing-event report representation fidelity runtime 006
  Scenario: Data layer missing-event report representation fidelity runtime 006
    Given the production missing-event report has optional additional text and four reproduction steps
    When Copy for Jira Cloud, Save defect, reopen, and recopy are performed through actual controls
    Then the Expected result and Steps to reproduce section content from every operation is equivalent to the current Final report preview
    And the saved and reopened nested payload retains its object, array, number, and string types
    And reopening does not synthesize additional text or expose stored provenance

  # Data layer missing-event report representation fidelity runtime 007
  Scenario: Data layer missing-event report representation fidelity runtime 007
    Given the actual report preview is visible
    When a nested expected value, additional text, and manual reproduction step are edited one at a time
    Then production preview content refreshes after each input event
    And it retains one multiline expected payload and one ordered reproduction list
    And no stale or duplicate content remains after any refresh

  # Data layer missing-event report representation fidelity runtime 008
  Scenario: Data layer missing-event report representation fidelity runtime 008
    Given expected values and additional text contain angle brackets, ampersands, quotes, and line breaks
    When production HTML preview and Jira plain text are generated
    Then HTML-significant content is escaped in the preview and remains literal text
    And Jira text preserves payload indentation, additional-text line breaks, and numbered reproduction lines
    And runtime coverage exercises actual incomplete and complete previews, form input, report generation, clipboard output, persistence, reopening, and recopy rather than source-string inspection
