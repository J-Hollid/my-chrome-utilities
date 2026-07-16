Feature: Data layer schema specification builder customization runtime

  Background:
    Given the built extension side panel is running with the production specification builder and clipboard controls
    And production Generic pageview revision 4 has selected documented, allowed-value, and undocumented properties

  # Data layer schema specification builder customization runtime 001
  Scenario: Data layer schema specification builder customization runtime 001
    When the production specification builder renders
    Then a compact export bar renders Spreadsheet and Rich table for Confluence or Jira modes
    And Include headings is selected by default
    And Table style is hidden for Spreadsheet and available for Rich table
    And column movement and example editing affordances are disclosed from their preview cells
    And the rendered builder does not duplicate export controls around the property selector

  # Data layer schema specification builder customization runtime 002
  Scenario Outline: Data layer schema specification builder customization runtime 002
    Given production Copy as is <copy_mode>
    And production Include headings is <heading_setting>
    When the production Copy specification table button is clicked
    Then the clipboard receives <clipboard_output>
    And the output uses the rendered preview's current columns, rows, and cell values

    Examples:
      | copy_mode                       | heading_setting | clipboard_output                                      |
      | Spreadsheet                     | selected        | tab-separated plain text beginning with headings     |
      | Spreadsheet                     | cleared         | tab-separated plain text beginning with the first row |
      | Rich table for Confluence or Jira | selected      | rich HTML and matching headed plain-text fallback     |
      | Rich table for Confluence or Jira | cleared       | rich HTML and matching unheaded plain-text fallback   |

  # Data layer schema specification builder customization runtime 003
  Scenario Outline: Data layer schema specification builder customization runtime 003
    Given production Copy as is Rich table for Confluence or Jira
    When production Table style is <table_style>
    Then rendered clipboard HTML contains <style_evidence>
    And escaped property content cannot alter the copied table structure or styling

    Examples:
      | table_style                         | style_evidence                                      |
      | Plain                               | semantic table markup without added presentation   |
      | Bordered                            | inline borders and cell padding                     |
      | Bordered with highlighted headings | inline borders, padding, and emphasized headings   |

  # Data layer schema specification builder customization runtime 004
  Scenario: Data layer schema specification builder customization runtime 004
    When the production Type heading is dragged before Mandatory
    Then the rendered preview and both clipboard formats use the moved column order
    When the production keyboard movement action returns Type after Mandatory
    Then the rendered and copied order returns with it
    And first and last boundary actions are disabled
    And Reset column order restores all six production headings

  # Data layer schema specification builder customization runtime 005
  Scenario Outline: Data layer schema specification builder customization runtime 005
    Given production duration has documented example 24 and allowed values 12 and 24
    When its Example value source is changed to <example_choice>
    Then the rendered example cell and both clipboard formats contain <preview_value>
    And production schema documentation remains unchanged

    Examples:
      | example_choice   | preview_value |
      | Documentation    | 24            |
      | Allowed value 12 | 12            |
      | Custom value 18  | 18            |
      | Blank            | an empty cell |

  # Data layer schema specification builder customization runtime 006
  Scenario: Data layer schema specification builder customization runtime 006
    Given production product_name has no documented example or allowed value
    When its Example value cell is activated
    Then Blank and Custom value are available and Allowed value is unavailable with an explanation
    And only one example editor is expanded at a time
    And narrow side-panel layout keeps export controls operable and the preview horizontally accessible

  # Data layer schema specification builder customization runtime 007
  Scenario: Data layer schema specification builder customization runtime 007
    Given production columns, export options, and examples have been customized
    When property selection or copy mode changes
    Then applicable production customization remains in the open builder
    When the source revision changes
    Then row-specific example overrides reset while copy and column preferences remain
    And clipboard fallback retains the configured headings, columns, rows, and examples
    And closing the builder leaves production schemas, documentation, and rules unchanged

