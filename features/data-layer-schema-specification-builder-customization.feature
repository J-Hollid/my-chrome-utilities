# mutation-stamp: sha256=7371b3662612ae04552d60c6af771bf0c45cc684079230793d76d2344ebe3d86
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-16T14:17:10.110366721Z","feature_name":"Data layer schema specification builder customization","feature_path":"features/data-layer-schema-specification-builder-customization.feature","background_hash":"7093328853f8eae4a9df6fdd200bc97a593c8675a27f2bcf2fd32a0667804737","implementation_hash":"2bf31ebbb091b81d5f8232353fd0b39bdddf062c","scenarios":[{"index":1,"name":"Data layer schema specification builder customization 002","scenario_hash":"55f52ebe56b044dadc138e43124f1ca8a3e2d1ec0975cdfd9978aa1e07b31646","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-16T14:17:10.110366721Z"},{"index":2,"name":"Data layer schema specification builder customization 003","scenario_hash":"2f2922db904ec61eb43d72fa740733a660b2ec0bae46fc09420164763dd591e8","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-16T14:17:10.110366721Z"},{"index":6,"name":"Data layer schema specification builder customization 007","scenario_hash":"20160e038902ef40160be7be270af7b33aec6b9d3eb5035389895ef71126f0e6","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-16T14:17:10.110366721Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema specification builder customization

  Background:
    Given the specification builder is open for Generic pageview revision 4
    And page_type, products[].duration, and products[].product_name are selected
    And the preview has the default seven columns in their default order
    And duration has documented example 24 and allowed values 12 and 24
    And product_name has neither a documented example nor allowed values

  # Data layer schema specification builder customization 001
  Scenario: Data layer schema specification builder customization 001
    When the specification preview is displayed
    Then one compact export bar offers Copy as Spreadsheet or Rich table for Confluence or Jira
    And Spreadsheet is selected by default to preserve the existing spreadsheet workflow
    And Include headings is selected by default
    And Table style is shown only for Rich table
    And column movement controls appear when a heading is focused or dragged
    And example controls appear when an Example value cell is activated
    And property selection, completeness, and the preview remain the primary builder content

  # Data layer schema specification builder customization 002
  Scenario Outline: Data layer schema specification builder customization 002
    Given Copy as is Spreadsheet
    And Include headings is <heading_setting>
    When the operator copies the specification table
    Then the clipboard receives tab-separated plain text in the current preview column and row order
    And <first_line> is the first copied line
    And pasting into a spreadsheet produces one cell per preview column
    And copied property content cannot create an extra row or column

    Examples:
      | heading_setting | first_line                                      |
      | selected        | the current preview headings                    |
      | cleared         | the first selected property row without headings |

  # Data layer schema specification builder customization 003
  Scenario Outline: Data layer schema specification builder customization 003
    Given Copy as is Rich table for Confluence or Jira
    And Include headings is selected
    When the operator chooses Table style <table_style> and copies
    Then the rich clipboard table has <presentation>
    And its semantic headings, cells, column order, and row order match the preview
    And a matching plain-text representation is available as clipboard fallback

    Examples:
      | table_style                         | presentation                                                   |
      | Plain                               | no added borders or heading highlight                          |
      | Bordered                            | visible table and cell borders with readable cell padding      |
      | Bordered with highlighted headings | visible borders and padding plus bold shaded column headings   |

  # Data layer schema specification builder customization 004
  Scenario: Data layer schema specification builder customization 004
    Given Rich table uses Bordered with highlighted headings
    When Include headings is cleared
    Then preview headings remain available for configuring and understanding the table
    And the copied rich and fallback plain tables omit the heading row
    And border and cell-padding styling remains on copied data cells
    And no empty heading row or heading-only styling is copied

  # Data layer schema specification builder customization 005
  Scenario: Data layer schema specification builder customization 005
    When the operator drags Type before Mandatory in the preview heading
    Then the preview columns are ordered Property name, Description, Type, Mandatory, Example value, Allowed values, and Comments
    And every preview row and copied representation uses that column order
    And property row order is unchanged
    When the operator uses a heading's Move left or Move right action
    Then the same column movement is available without dragging
    And unavailable movement beyond the first or last position is disabled
    And Reset column order restores the default seven-column order with Comments last

  # Data layer schema specification builder customization 006
  Scenario: Data layer schema specification builder customization 006
    When the operator activates the duration Example value cell
    Then Documentation is selected as its example source and displays 24
    And Allowed value offers the distinct effective values 12 and 24 in rule order
    And Custom value permits an export-only value
    And Blank permits the example cell to be deliberately empty
    When the operator activates the product_name Example value cell
    Then its default is Blank
    And Allowed value is unavailable with an explanation that no allowed values exist
    And Custom value remains available

  # Data layer schema specification builder customization 007
  Scenario Outline: Data layer schema specification builder customization 007
    Given the duration Example value editor is open
    When the operator chooses <example_choice>
    Then the duration preview example is <preview_value>
    And copied Spreadsheet and Rich table output use <preview_value>
    And the completeness summary reflects the resulting preview value
    And the schema's documented example remains 24

    Examples:
      | example_choice   | preview_value |
      | Documentation    | 24            |
      | Allowed value 12 | 12            |
      | Custom value 18  | 18            |
      | Blank            | blank         |

  # Data layer schema specification builder customization 008
  Scenario: Data layer schema specification builder customization 008
    Given an allowed value is conditional or inherited
    When it is offered as an example choice
    Then its condition or origin is identified without adding that label to the chosen cell value
    And duplicate effective values are offered once
    And a conflict with no effective allowed value offers no conflicting value as an example

  # Data layer schema specification builder customization 009
  Scenario: Data layer schema specification builder customization 009
    Given the operator has reordered columns, selected Rich table styling, and overridden examples
    When properties are selected or cleared or the copy mode changes
    Then the current column order, styling preference, heading preference, and applicable example overrides remain
    When the builder source changes to another schema revision
    Then row-specific example overrides reset to that source's documentation
    And the current copy and column preferences remain for the open builder
    When the builder is closed
    Then no schema, documentation, rule, or allowed value has changed

  # Data layer schema specification builder customization 010
  Scenario: Data layer schema specification builder customization 010
    Given the preview contains reordered columns and overridden examples
    When rich clipboard writing fails
    Then the plain-text fallback retains the selected heading setting, column order, row order, and example values
    And visible feedback states that only plain text was copied
    When all clipboard writing fails
    Then the configured preview remains available for manual selection and copy
    And no builder configuration is lost

  # Data layer schema specification builder customization 011
  Scenario Outline: Data layer schema specification builder customization 011
    Given the operator configured property selection, column order, heading inclusion, table style, and example overrides on <origin_surface>
    When Continue on <destination_surface> is selected
    Then the same canonical schema revision and complete open-builder configuration appear on <destination_surface>
    And the operator can refine every configuration choice and create Spreadsheet or Rich table output there
    And Back restores the origin configuration and focus without changing schema or project semantics
    Examples:
      | origin_surface | destination_surface |
      | side panel | standalone Builder |
      | standalone Builder | side panel |
