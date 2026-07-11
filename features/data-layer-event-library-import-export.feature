Feature: Data layer event Library import and export

  Background:
    Given the Data Layer Event templates Library is displayed

  # Data layer event Library import and export 001
  Scenario: Data layer event Library import and export 001
    Given the Library contains 3 saved event templates
    And the current search displays 1 of them
    When Library actions are displayed
    Then Export Library and Import Library are available
    When the operator activates Export Library
    Then exactly 1 local file containing all 3 saved templates is produced
    And the export is not limited by the current search, selection, or open editor
    And no captured event, template, or browser page is changed

  # Data layer event Library import and export 002
  Scenario: Data layer event Library import and export 002
    Given template Purchase confirmation has current version 4 and earlier saved revisions
    And template Scroll milestone has current version 2
    When the complete Library is exported
    Then the file contains a format name and supported format version
    And each template contains its stable identity, Template name, Event name, current version, and saved revisions
    And each template contains payload, validation state, tags, schema assignment, provenance, and captured-origin references when present
    And persisted execution settings include source adapter identity, destination path, and adapter-specific saved configuration
    And active target, permission grants, connection state, and unsaved editor drafts are absent
    And the file represents JSON without executable code

  # Data layer event Library import and export 003
  Scenario: Data layer event Library import and export 003
    Given the Library has no saved event templates
    When Library actions are displayed
    Then Export Library is disabled with reason Add or import an event before exporting
    And Import Library remains available

  # Data layer event Library import and export 004
  Scenario: Data layer event Library import and export 004
    Given the operator selects a supported Library export file containing 4 templates
    When import review opens
    Then no Library mutation has occurred
    And the review identifies the file format version, template count, revision count, and validation result
    And the review offers Replace entire Library and Append to Library
    And keyboard focus moves into the review while background Library actions are unavailable

  # Data layer event Library import and export 005
  Scenario: Data layer event Library import and export 005
    Given the current Library contains 3 templates
    And a validated import contains 4 templates
    When the operator chooses Replace entire Library
    Then a destructive confirmation states that 3 current templates will be removed and 4 imported templates will be added
    And no change occurs before final confirmation
    When the operator confirms Replace entire Library
    Then the Library contains exactly the 4 imported templates and their saved revisions
    And no prior template remains unless it is also present in the imported file
    And local feedback reports 4 imported and 3 replaced

  # Data layer event Library import and export 006
  Scenario: Data layer event Library import and export 006
    Given the current Library contains templates template-1 and template-2
    And a validated import contains templates template-2, template-3, and template-4
    When the operator confirms Append to Library
    Then all 2 current templates remain
    And all 3 imported templates are appended
    And imported template template-2 receives a new local stable identity because its identity collides
    And its Template name, Event name, revisions, payload, and execution settings remain unchanged
    And its provenance records the imported identity and identity remapping
    And local feedback reports 3 appended and 1 identity remapped

  # Data layer event Library import and export 007
  Scenario Outline: Data layer event Library import and export 007
    Given the selected import has problem <file_problem>
    When import validation completes
    Then Replace entire Library and Append to Library are unavailable
    And a visible error states <error_message>
    And the current Library remains byte-for-byte unchanged

    Examples:
      | file_problem                  | error_message                              |
      | invalid JSON                  | Select a valid Library JSON file            |
      | unsupported format version    | Export with a supported Library version     |
      | required template field absent | The import is missing required template data |
      | invalid revision history      | Correct the imported revision history       |

  # Data layer event Library import and export 008
  Scenario: Data layer event Library import and export 008
    Given an imported template has source adapter Event history and destination event.history
    When import commits in either mode
    Then its names, payload, revisions, and execution settings are restored
    And adapter, destination, schema, and Push readiness are re-evaluated against the current browser environment
    And unresolved dependencies are reported without discarding the imported template
    And importing never pushes an event or requests target permission automatically

  # Data layer event Library import and export 009
  Scenario: Data layer event Library import and export 009
    Given a new-event editor or saved-template editor has unsaved changes
    When the operator requests Replace entire Library
    Then the replace confirmation identifies the unsaved editor and the work that would be lost
    And choices are Keep editing, Save before replace, and Discard and replace
    And neither import nor draft mutation occurs until a choice completes

  # Data layer event Library import and export 010
  Scenario: Data layer event Library import and export 010
    Given a Library containing renamed events, multiple revisions, payload edits, and execution settings is exported
    When that file replaces an empty Library
    Then exporting the restored Library produces semantically equivalent Library data
    And every Template name, Event name, revision, payload, schema assignment, tag, provenance value, and execution setting round-trips
    And imported templates persist after the side panel reloads
