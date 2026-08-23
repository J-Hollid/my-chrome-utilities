# mutation-stamp: sha256=69e3e80ee64ab4ff06db2fd14338afcd8396315c7e22a8702baa57c22e9eb3bd
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-08-23T05:12:19.291598234Z","feature_name":"Data layer documentation template library","feature_path":"features/data-layer-documentation-template-library.feature","background_hash":"95e3af67521ae8b8842b995db426d7d9d861cb2c52c3bcbda319a64f296793b7","implementation_hash":"sha256:d2af2dd1d3de51ace2eef58c55f6e4045fbbec8aef0e1ef300fa0399d4edc78f","scenarios":[{"index":11,"name":"Data layer documentation template library 012","scenario_hash":"0767f948a7f5026314f5dde00aaaabbf9ca12ae1cde61d8dedb26959e9c1c1bf","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-08-23T05:12:19.291598234Z"},{"index":17,"name":"Data layer documentation template library 018","scenario_hash":"bf890d44a99ec2df99ffd4e3570a977cd1404297d05108c699f04a0251c3b0ee","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-08-23T05:12:19.291598234Z"},{"index":2,"name":"Data layer documentation template library 003","scenario_hash":"ae1691e4d830ff044832269f5eb015e3318699e362643d210fe3024ecff06aac","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-08-23T05:10:59.350740876Z"},{"index":10,"name":"Data layer documentation template library 011","scenario_hash":"d1745655d44589dcd356d9fa813e7e2eff370f37080e65634c79b66c7996bb2a","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-08-23T05:10:59.350740876Z"}]}
# acceptance-mutation-manifest-end

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
    And the Library offers Download guided starter, Select Excel template, and New rich page template for the selected kind
    And Excel guidance separates single values from repeatable data for the selected kind
    And selecting an Excel workbook creates an unsaved candidate with inspection, populated preview, and Save template actions

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
    Given a valid template requests only public bindings allowed by its own contract
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

  # Data layer documentation template library 012
  Scenario Outline: Data layer documentation template library 012
    Given assigned Excel template Acme flow workbook was saved previously with <invalid_metadata>
    When the operator saves an unrelated project change
    Then the unrelated change is saved without changing Acme flow workbook, its exact body, or its assignment
    And Excel Flow preview and export remain blocked without silently using Built-in
    And other documentation formats, kinds, and project saves remain available
    And the Template Library identifies <invalid_metadata> as the reason Acme flow workbook is unavailable
    And the problem does not describe Acme flow workbook only by its internal identity

    Examples:
      | invalid_metadata                              |
      | a missing valid validation state              |
      | a body digest different from its record digest |
      | a nonpositive body byte length                |
      | an unsupported Excel contract version         |

  # Data layer documentation template library 013
  Scenario: Data layer documentation template library 013
    Given assigned Excel template Acme flow workbook has invalid stored metadata
    When the operator assigns Built-in to Excel Flow
    Then the assignment is saved even though the unchanged invalid template remains in the Library
    And Excel Flow uses Built-in only after that explicit assignment
    And Acme flow workbook is visibly unavailable and cannot be newly assigned, duplicated, previewed, or exported
    And removal becomes available when no Documentation Set assignment refers to Acme flow workbook

  # Data layer documentation template library 014
  Scenario: Data layer documentation template library 014
    Given the project already contains an invalid stored Excel template
    When an upload, replacement, or assignment would introduce another invalid template record
    Then the new operation is rejected atomically with its exact failing metadata invariant
    And no new template metadata, body, assignment, or project revision is saved
    And tolerating the unchanged existing record does not weaken workbook, body, assignment, or portability validation

  # Data layer documentation template library 015
  Scenario: Data layer documentation template library 015
    Given invalid template Quarterly flow workbook has an internal identity and is assigned to Excel Flow by several Documentation Sets
    And independent workbook validation and sample filling succeed for its exact body
    When the workspace reports the template problem
    Then the primary message names Quarterly flow workbook, Excel Flow, and the number of affected Documentation Sets
    And the primary message does not require the operator to recognize its internal identity
    And Go to problem opens Templates with Quarterly flow workbook selected and every affected Documentation Set assignment visible
    And the repair actions identify Revalidate saved workbook, Assign Built-in, and Replace workbook without requiring manual template lookup
    And collapsed technical details retain the internal identity and exact failed record invariant for diagnosis

  # Data layer documentation template library 016
  Scenario: Data layer documentation template library 016
    Given Quarterly flow workbook has invalid stored metadata but its exact saved body passes current guided Flow validation
    And several Documentation Sets assign Quarterly flow workbook to Excel Flow
    When the operator activates Revalidate saved workbook
    Then current validation rebuilds only its derived contract, digest, byte length, and validation metadata from the saved body
    And one atomic reversible project command preserves the exact body, template name, stable identity, and every assignment
    And the existing preview becomes visibly stale until the operator refreshes it
    When the operator refreshes the preview
    Then Quarterly flow workbook is available and Excel Flow uses its revalidated body

  # Data layer documentation template library 017
  Scenario: Data layer documentation template library 017
    Given Quarterly flow workbook has invalid stored metadata and its exact saved body fails current guided Flow validation
    When the operator activates Revalidate saved workbook
    Then no template metadata, body, assignment, preview, or project revision changes
    And the current workbook findings and Assign Built-in action remain available

  # Data layer documentation template library 018
  Scenario Outline: Data layer documentation template library 018
    Given Checkout Flow selects Example metadata
    And its shared page_type property allows cart or confirmation
    And Page instance <page_instance> has effective documented example <documented_example> for page_type
    When the Flow template context prepares <page_instance> rows
    Then page_type row.example is <documented_example>
    And its row.cells entry with columnKey example has heading Documented example and value <documented_example>
    And neither binding substitutes cart or confirmation from the allowed-values facet
    And a Page property without an effective documented example has an empty example value

    Examples:
      | page_instance | documented_example |
      | Cart          | cart               |
      | Confirmation  | confirmation       |

  # Data layer documentation template library 019
  Scenario: Data layer documentation template library 019
    Given Checkout Flow enables concept subheadings in Ecommerce then Funnel order
    And Cart has selected Ecommerce and Funnel property rows
    When the template groups Cart's prepared rows by configured concept
    Then page.concepts contains Ecommerce followed by Funnel exactly once
    And each concept exposes only its own selected rows in configured property order
    And page.rows retains the same selected rows and their concept values for existing templates
    And empty, excluded, and unselected concepts or rows are absent
    And contained Event contexts expose event.concepts by the same rules

  # Data layer documentation template library 020
  Scenario: Data layer documentation template library 020
    Given two Checkout Flow Page instances reference the same canonical Cart Page
    And the two instances store different visual attachments with description, caption, and source reference
    And Payment Page instance has no saved concept visual
    When the Flow template context is prepared from the current immutable snapshot
    Then each Cart instance exposes only its own page.visual image source, description, caption, and sourceReference
    And Payment exposes no page.visual image source or metadata
    And a saved PNG, JPEG, or WebP attachment remains present while its exact immutable body is loading
    And an unavailable attached body blocks refresh with a retry action rather than looking like Payment's absent attachment
    And image bytes are available only to a scoped image area or semantic image block
    And no attachment identity, asset identity, digest, repository key, Blob URL, or canonical Page visual is exposed
    When one Cart instance visual is replaced or removed
    Then the existing preview becomes stale until refreshed from the changed Flow snapshot
