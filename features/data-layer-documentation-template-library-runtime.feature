# mutation-stamp: sha256=f0725da32e3f17da85230d53c1577f9675d1c1292b1a55ed0073bd996c02a49e
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-08-24T05:52:15.708168174Z","feature_name":"Data layer documentation template library runtime","feature_path":"features/data-layer-documentation-template-library-runtime.feature","background_hash":"d28c2c079e14cdbd9cc406703e3395f1a7f17ec34ec737fb6d15bf22cf70bdd4","implementation_hash":"sha256:f554e1fee5bcb4ff2cec7886a3273a3c3c69365c29f17f8fe765ed78fa1daeb2","scenarios":[{"index":7,"name":"Data layer documentation template library runtime 008","scenario_hash":"5ae4f0b58175e60ed34fd4e658346ef698f864c0097197495eb04fa4707b77a5","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-08-23T12:10:56.324058054Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer documentation template library runtime

  Background:
    Given the built extension is running with the production project repository, documentation compiler, template asset store, portable archive, clipboard, and download adapters
    And production Shop has Documentation Set Client specification with all four documentation kinds

  # Data layer documentation template library runtime 001
  Scenario: Data layer documentation template library runtime 001
    Given production Client specification has no custom template assignment
    When actual controls refresh and export every scope as Excel and rich documentation
    Then the installed Built-in adapters produce the established sheets, semantic HTML, plain fallback, theme, and incomplete-Draft protection
    And repository inspection finds no synthetic template record or body

  # Data layer documentation template library runtime 002
  Scenario: Data layer documentation template library runtime 002
    When actual controls open Templates from Documentation
    Then the installed Template Library exposes format and kind groups without adding a primary workspace tab
    And its Excel guidance exposes searchable single values, repeatable data, examples, and availability
    When actual controls select, inspect, preview, and save Acme flow workbook and create Acme profile page
    Then production validation records their format, kind, contract version, digest, and validation state
    And actual assignment controls bind them to Excel Flow and Rich page Site Profile
    And no direct state injection or component-only fixture creates those records

  # Data layer documentation template library runtime 003
  Scenario: Data layer documentation template library runtime 003
    Given installed assignments mix Built-in and custom templates across all four kinds
    When actual current, selected, and complete preview and export controls run
    Then captured renderer calls use each requested section's exact format-and-kind assignment
    And every renderer receives the same immutable snapshot hash and its assigned template digest
    And downloaded worksheets and clipboard sections remain in durable Documentation Set order

  # Data layer documentation template library runtime 004
  Scenario: Data layer documentation template library runtime 004
    Given the current production preview binds first digest of Acme flow workbook
    When actual file controls replace it with valid second digest
    Then installed preview freshness reports out of date and Excel Flow export is disabled
    When actual controls refresh the preview and export again
    Then production snapshot identity and workbook bytes bind second digest
    And Undo and Redo restore the exact template body, digest, assignment, and stale state

  # Data layer documentation template library runtime 005
  Scenario: Data layer documentation template library runtime 005
    Given production Client specification assigns one Excel body and one rich block tree
    When the browser reloads and actual project export and import controls complete
    Then IndexedDB metadata restores both templates without parsing the Excel body during ordinary project load
    And the portable archive contains one digest-addressed copy of the Excel body
    And actual preview and export lazily read only the assigned body
    And imported outputs match their pre-export visible values and order

  # Data layer documentation template library runtime 006
  Scenario: Data layer documentation template library runtime 006
    Given an assigned production template body is unavailable or fails validation
    When the operator inspects the affected format in installed Preview and Export
    Then the installed workspace blocks only that format and kind with a working repair action
    And no Built-in renderer call occurs until the operator explicitly assigns Built-in

  # Data layer documentation template library runtime 007
  Scenario: Data layer documentation template library runtime 007
    Given production templates render project content containing internal identities, revisions, diagnostics, provenance, and repairs
    When actual custom Excel and rich outputs are captured
    Then independent parsing finds configured public values but no private identity, revision hash, diagnostic, provenance, repair target, repository key, Blob URL, or template source
    And serialized project definitions and publication bytes are unchanged

  # Data layer documentation template library runtime 008
  Scenario Outline: Data layer documentation template library runtime 008
    Given actual navigation opens the installed Template Library at <viewport_width>
    When actual controls select a template and its detail
    Then <rendered_layout>
    And accessibility inspection finds one labelled active surface with no focusable control in its hidden companion
    And browser geometry finds no horizontal document overflow

    Examples:
      | viewport_width | rendered_layout                                      |
      | 1280 pixels    | list and detail are both visible                     |
      | 360 pixels     | list and detail are mutually exclusive visible views |

  # Data layer documentation template library runtime 009
  Scenario: Data layer documentation template library runtime 009
    Given production storage contains an assigned Excel template record with invalid body metadata and its previously saved body
    When an actual unrelated project control saves a change
    Then repository inspection finds that change committed and the invalid template record, exact body, and assignment unchanged
    And installed Preview and Export block only the affected Excel kind without invoking Built-in
    And the Template Library exposes the exact invalid metadata invariant with working Go to problem and Assign Built-in actions
    When actual controls assign Built-in and then remove the unreferenced template
    Then both Draft commands commit through the production repository
    And reload retains Built-in output without the invalid template record or a recurring save error

  # Data layer documentation template library runtime 010
  Scenario: Data layer documentation template library runtime 010
    Given production storage already contains an unchanged invalid Excel template record
    When actual upload, replacement, and assignment controls each propose invalid new template metadata
    Then the production repository rejects every new invalid transition atomically with its exact invariant
    And repository inspection finds no new body, template, assignment, revision, or partial recovery

  # Data layer documentation template library runtime 011
  Scenario: Data layer documentation template library runtime 011
    Given one invalid production Excel template has a readable workbook body and assignments in several Documentation Sets
    When an actual workspace control exposes its problem and the operator activates Go to problem
    Then the visible message uses the template name, Excel kind, and affected Documentation Set count without requiring its internal identity
    And installed navigation opens Templates with the exact template selected and every referencing assignment visible
    And keyboard focus reaches the first applicable repair action
    And the internal identity and failed record invariant appear only in collapsed technical details

  # Data layer documentation template library runtime 012
  Scenario: Data layer documentation template library runtime 012
    Given an invalid production template record refers to a saved body that passes current guided validation and sample filling
    When actual controls activate Revalidate saved workbook
    Then production validation reads the stored body and one atomic Draft command repairs only its derived template metadata
    And repository inspection finds the exact body bytes, stable template identity, name, and all assignments preserved
    And installed preview becomes stale and returns to custom Excel output only after Refresh preview

  # Data layer documentation template library runtime 013
  Scenario: Data layer documentation template library runtime 013
    Given an invalid production template record refers to a saved body that fails current guided validation
    When actual controls activate Revalidate saved workbook
    Then visible workbook findings and Assign Built-in remain available
    And repository inspection finds no metadata, body, assignment, preview, or revision change

  # Data layer documentation template library runtime 014
  Scenario: Data layer documentation template library runtime 014
    Given production Checkout has exactly one selected Flow documentation section with Example and Allowed values metadata
    And its selected Page properties have direct, inherited, mixed, overridden, and absent effective examples with distinct allowed values
    And Checkout has Ecommerce and Funnel concepts, two distinct Cart-instance visuals, and one Page without a visual
    And an unsaved valid Flow workbook repeats flow.pages Across in C4:D6, flow.rows Down in B6, and page.rows Down in C6:D6 within the Page repeat
    And its Page, property, and diagnostic cells bind page.pageName, row.property, row.example, and row.allowedValues
    When actual controls upload the workbook and activate Populated preview — output only
    Then the parsed candidate workbook contains each Page column's exact property, effective example, and allowed values
    And direct page_name is "cart-page", inherited ecommerce_order_id is "ORDER-100", mixed currency is "Euro checkout", and overridden page_type is "confirmation-example"
    And coupon_code has empty example text while its WELCOME or SAVE10 allowed values remain present
    And repository inspection finds no metadata, body, assignment, preview, or revision change
    And schema, Documentation configuration, and publication bytes remain unchanged
    When actual controls refresh its Documentation preview through the production compiler
    Then captured Page and contained Event rows expose their own Example cells rather than another context's allowed values or example
    And captured Page and Event concept collections contain only configured non-empty groups and their ordered rows
    And captured Cart image sources and presentation metadata remain bound to their own Flow Page instances while the Page without a visual remains empty
    And changing one attachment makes the installed preview stale until Refresh preview
    And context inspection finds no private visual identity, digest, repository key, Blob URL, canonical mutation, or publication write
