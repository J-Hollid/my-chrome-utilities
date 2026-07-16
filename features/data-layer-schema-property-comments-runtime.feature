Feature: Data layer schema property comments runtime

  Background:
    Given the built extension side panel is running with production schema documentation, Live inspection, specification building, and clipboard controls
    And production Product detail revision 3 declares documented nested properties

  # Data layer schema property comments runtime 001
  Scenario: Data layer schema property comments runtime 001
    When the production property documentation editor opens
    Then it renders an accessible multiline Comments field after Description
    When multiline comments are saved and the working draft is reopened
    Then production persistence and the rendered editor retain the comment text and internal line breaks
    And saving comments alone retains one documentation entry
    And clearing the last documentation field follows the existing confirmed-removal workflow

  # Data layer schema property comments runtime 002
  Scenario: Data layer schema property comments runtime 002
    Given inherited, local, current, historical, and working-draft property comments exist
    When production inheritance, publication, duplication, property copy, export, import, reload, removal, and Undo are exercised
    Then every effective comment retains its canonical path, text, owner, revision, and provenance exactly once
    And restoring inherited documentation restores the parent's comments without mutating the parent
    And legacy persisted entries without comments render a blank Comments field

  # Data layer schema property comments runtime 003
  Scenario: Data layer schema property comments runtime 003
    Given production comments map /products/*/product_id and contain markup-like text
    And a captured event contains /products/2/product_id
    When the production Live inspector searches for and opens the property's documentation
    Then comment search finds the concrete property and its details render the comments as inert text
    And the collapsed property row, payload, observed value, and validation result are unchanged

  # Data layer schema property comments runtime 004
  Scenario: Data layer schema property comments runtime 004
    Given production specification rows include local, inherited, nested, and blank comments
    When the production specification preview renders in default order
    Then its seventh heading is Comments
    And each row's seventh cell contains its effective source comment or is blank
    And the completeness summary does not count blank comments
    And Spreadsheet and Rich table output contain the same seventh column when headings are included

  # Data layer schema property comments runtime 005
  Scenario: Data layer schema property comments runtime 005
    Given production comments contain line breaks, tabs, vertical bars, and markup-like text
    When Spreadsheet, styled Rich table, and plain fallback representations are produced
    Then each representation contains one escaped Comments cell per property without structural injection
    And rich comment line breaks remain inside their cells
    And styled borders and headings include the Comments column
    When Comments is reordered and headings are included or excluded
    Then every production preview and clipboard representation retains aligned Comments in the selected position
    And Reset column order restores Comments last

