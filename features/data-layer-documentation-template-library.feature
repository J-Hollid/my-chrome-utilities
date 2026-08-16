Feature: Data layer documentation template library

  Background:
    Given Shop has Documentation Set Client specification with Overview, two Flow sections, one Data capture matrix, and two Site Profile sections
    And Client specification has a current immutable documentation snapshot

  # Data layer documentation template library 001
  Scenario: Data layer documentation template library 001
    Given Client specification has no custom template assignment
    When the operator previews, copies, and downloads its documentation
    Then Built-in renders every Excel and rich section
    And section order, configured rows, columns, concepts, theme, output scopes, and incomplete-Draft behavior match the existing Documentation Set output
    And no template record or asset is required for Built-in

  # Data layer documentation template library 002
  Scenario: Data layer documentation template library 002
    When the operator opens Templates from the persistent Documentation context
    Then the Template Library groups Built-in and project templates by Excel or Rich page and by Overview, Flow, Matrix, or Site Profile
    And Build, Preview, and Export remain the only primary workspace tabs
    And the Library offers Download starter template, Upload Excel template, and New rich page template for the selected kind
    And it shows the bindings valid for the selected kind

  # Data layer documentation template library 003
  Scenario Outline: Data layer documentation template library 003
    Given project template <template_name> is valid for <format> <kind>
    When the operator assigns <template_name> to Client specification
    Then every <kind> section uses <template_name> for <format>
    And every other format and kind retains its existing assignment
    And the assignment creates no documentation section, Page document, schema, Flow, Site Profile, or publication revision

    Examples:
      | template_name       | format    | kind         |
      | Acme flow workbook  | Excel     | Flow         |
      | Acme profile page   | Rich page | Site Profile |

  # Data layer documentation template library 004
  Scenario: Data layer documentation template library 004
    Given Acme flow workbook is assigned to Excel Flow
    And Client specification contains Checkout journey and Article journey Flow sections
    When the complete Documentation Set is previewed and downloaded
    Then Acme flow workbook is applied separately to Checkout journey and Article journey in configured order
    And the generated worksheets use their deterministic section names
    And no per-section or whole-workbook template override is offered

  # Data layer documentation template library 005
  Scenario: Data layer documentation template library 005
    Given Client specification assigns custom and Built-in templates across its formats and kinds
    When current, selected, and complete output scopes are generated
    Then each requested section uses the assignment for its own format and kind
    And selected sections remain in Documentation Set order
    And templates cannot add an unselected section, context, property, column, concept, or row
    And one immutable snapshot supplies every requested Built-in and custom rendering

  # Data layer documentation template library 006
  Scenario: Data layer documentation template library 006
    Given a current preview used Acme flow workbook at digest first
    When the operator replaces its body with valid digest second
    Then Acme flow workbook retains its stable template identity and assignment
    And one reversible project command records the replacement
    And the former preview becomes visibly stale
    And Excel Flow export remains disabled until the operator refreshes the preview
    When the operator refreshes the preview
    Then snapshot identity binds digest second and the refreshed output uses only digest second

  # Data layer documentation template library 007
  Scenario: Data layer documentation template library 007
    Given Acme flow workbook is assigned to Excel Flow
    When the operator attempts to remove Acme flow workbook
    Then removal is blocked and identifies Client specification and Excel Flow
    When the operator assigns Built-in and removes Acme flow workbook
    Then its unreferenced template record is removed by one reversible project command
    And Client specification retains Built-in Excel Flow output

  # Data layer documentation template library 008
  Scenario: Data layer documentation template library 008
    Given Client specification uses Excel and Rich page templates for all four documentation kinds
    When the project reloads and completes portability export and import
    Then template names, kinds, formats, assignments, contract versions, validation state, rich block trees, and exact Excel bodies return
    And each Excel body occurs once in the portable project archive
    And imported output has the same visible content and ordering as output before portability
    And import failure leaves no partial project, template, assignment, or template body

  # Data layer documentation template library 009
  Scenario: Data layer documentation template library 009
    Given an assigned custom template is missing, incompatible, invalid, or unavailable
    When the operator previews or exports its affected format and kind
    Then the affected output is blocked with an exact template repair action
    And the renderer does not silently use Built-in or another template
    And unaffected formats and kinds remain available
    When the operator explicitly assigns Built-in
    Then the affected output uses the existing Built-in renderer

  # Data layer documentation template library 010
  Scenario: Data layer documentation template library 010
    Given a valid template requests only contract-version-1 public bindings
    When its context is prepared
    Then it receives the configured presentation values from the immutable snapshot
    And it receives no raw identity, revision hash, provenance, diagnostic, repair target, repository key, Blob URL, or template body
    And preparing or rendering the template changes no Documentation Set content, Flow, schema, assignment, project publication, or production revision

  # Data layer documentation template library 011
  Scenario Outline: Data layer documentation template library 011
    Given Templates is open at <viewport_width>
    When the operator selects, creates, uploads, assigns, or repairs a template
    Then <library_layout>
    And the persistent Documentation context and Build, Preview, and Export tabs remain reachable
    And the workspace introduces no horizontal page scrolling

    Examples:
      | viewport_width | library_layout                                      |
      | 1280 pixels    | the template list and selected detail appear together |
      | 360 pixels     | the template list and selected detail open one at a time |
