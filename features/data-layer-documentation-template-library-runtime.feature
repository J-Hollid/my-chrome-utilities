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
