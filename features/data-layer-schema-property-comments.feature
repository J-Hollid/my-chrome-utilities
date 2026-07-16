Feature: Data layer schema property comments

  Background:
    Given Product detail revision 3 declares /products/*/product_id and /page_type
    And its property documentation can contain display name, description, example value, and comments

  # Data layer schema property comments 001
  Scenario: Data layer schema property comments 001
    Given Product detail revision 3 has no working draft
    When the operator edits /products/*/product_id documentation
    Then an optional multiline Comments field is available after Description
    When the operator saves comments Sent by checkout and Do not derive from position on separate lines
    Then one working draft is created from revision 3
    And its canonical /products/*/product_id documentation entry stores both comment lines in order
    And surrounding whitespace is removed without removing meaningful internal line breaks
    And the property definition, description, example, validation rules, and revision 3 remain unchanged

  # Data layer schema property comments 002
  Scenario: Data layer schema property comments 002
    Given /page_type has comments as its only local property documentation
    When the operator clears Comments and saves
    Then documentation-removal confirmation is required
    When the operator cancels removal
    Then the comments and documentation entry remain
    When the operator confirms removal
    Then the local documentation entry is removed without removing /page_type or its rules
    Given /products/*/product_id also has a description
    When only its Comments field is cleared and saved
    Then its documentation entry and description remain without removal confirmation

  # Data layer schema property comments 003
  Scenario: Data layer schema property comments 003
    Given Generic commerce revision 2 comments on /currency as Shared currency convention
    And Product detail inherits Generic commerce revision 2
    When effective Product detail documentation is displayed
    Then /currency shows Shared currency convention from Generic commerce revision 2
    When the operator saves local comments Checkout currency exception
    Then one Product detail working-draft override is effective and the parent remains unchanged
    When the operator restores inherited documentation
    Then Shared currency convention is effective again without duplication

  # Data layer schema property comments 004
  Scenario: Data layer schema property comments 004
    Given Product detail revision 3 comments on /page_type as Legacy routing input
    And its working draft changes the comments to Current routing input
    When the working draft is published as revision 4
    Then revision 3 retains Legacy routing input and revision 4 owns Current routing input
    And events and specification tables resolved to either revision use that revision's comments

  # Data layer schema property comments 005
  Scenario: Data layer schema property comments 005
    Given /products/*/product_id has effective comments
    When Product detail is duplicated, the property is copied, or the Schema Library is exported, imported, and reloaded
    Then the comments retain their canonical path, content, owner, revision association, and inheritance provenance
    And property removal and Undo remove and restore the comments with the other property documentation
    And a legacy Schema Library without comments loads with blank Comments fields
    And comment text resembling markup or script remains inert text

  # Data layer schema property comments 006
  Scenario: Data layer schema property comments 006
    Given an assigned schema revision comments on an observed or missing nested property
    When the property documentation is opened in the Live inspector
    Then Comments is available in the existing documentation details without adding text to the collapsed property row
    And property search matches the comments
    And wildcard comments resolve to the concrete array-item path
    And comments do not change the observed value, payload, or validation result

  # Data layer schema property comments 007
  Scenario: Data layer schema property comments 007
    Given the specification builder selects documented local, inherited, nested, and undocumented properties
    When the specification preview is derived
    Then Comments is the seventh and final column in the default order
    And each Comments cell uses effective comments from the selected published, historical, or working-draft source
    And a property without comments has a blank Comments cell
    And missing comments do not increase the missing-documentation completeness counts
    And Reset column order returns Comments to the final position

  # Data layer schema property comments 008
  Scenario: Data layer schema property comments 008
    Given a selected property has comments containing multiple lines, tabs, vertical bars, and text resembling markup
    When the specification table is copied for Spreadsheet
    Then Comments is the final tab-separated cell when the default column order is used
    And comment content cannot create an extra spreadsheet row or column
    When the table is copied as a Rich table for Confluence or Jira
    Then meaningful comment line breaks are retained within one escaped Comments cell
    And table borders and heading formatting extend through the Comments column

  # Data layer schema property comments 009
  Scenario: Data layer schema property comments 009
    Given Comments has been moved from its default position by dragging or a keyboard movement action
    When the preview is copied with headings included or excluded
    Then Spreadsheet, Rich table, and plain fallback output use the preview's current Comments position
    And the heading and each property comment remain aligned
    And changing copy mode or example overrides does not reset the Comments position

