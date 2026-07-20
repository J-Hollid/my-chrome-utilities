Feature: Data layer Flow table documentation export

  Background:
    Given Checkout journey contains Cart page_view, Shipping add_shipping_info, Payment add_payment_info, and Confirmation purchase contexts
    And Shipping and Payment are parallel branches that merge before Confirmation
    And every selected context has a canonical effective schema with property provenance

  # Data layer Flow table documentation export 001
  Scenario: Data layer Flow table documentation export 001
    When the operator opens Documentation export from Checkout journey
    Then the main workspace offers Flow value map and Data capture matrix views
    And the preview identifies Shop project, Checkout journey, Draft state, graph revision, and effective-schema revisions
    And Spreadsheet, Download Excel workbook, and Rich table for Confluence or Jira are visible export actions
    And opening export does not alter the Flow, schemas, assignments, or graph viewport

  # Data layer Flow table documentation export 002
  Scenario: Data layer Flow table documentation export 002
    When the operator includes documentation columns
      | Page         | Event                | Event role      |
      | Cart         | page_view            | context-setting |
      | Shipping     | add_shipping_info    | interaction     |
      | Payment      | add_payment_info     | interaction     |
      | Confirmation | purchase             | interaction     |
    Then every selected column shows its Step label, Page name, and Event name
    And human selectors persist stable Page-frame and Event-occurrence references
    And every column compiles the effective Page and Event branches at that occurrence
    And context-setting is explanatory Event metadata rather than a binding or separate compiler path
    And raw IDs are absent from headings and selection controls

  # Data layer Flow table documentation export 003
  Scenario: Data layer Flow table documentation export 003
    Given the selected contexts have exact effective expected values
    When Flow value map is previewed with Property name as the row heading
    Then the table heading is Checkout journey
    And Flow value cells are
      | Property name  | Step 1 Cart / page_view | Step 2a Shipping / add_shipping_info | Step 2b Payment / add_payment_info | Step 3 Confirmation / purchase |
      | page_name      | cart                    | shipping                             | payment                           | confirmation                   |
      | form_name      | checkout                | checkout                             | checkout                          | checkout                       |
      | form_step_name | cart                    | shipping                             | payment                           | confirmation                   |
      | form_status    | started                 | active                               | active                            | completed                      |
      | page_type      | checkout                | checkout                             | checkout                          | confirmation                   |
    And every value is derived from the selected context's effective schema rather than a copied table value

  # Data layer Flow table documentation export 004
  Scenario Outline: Data layer Flow table documentation export 004
    Given an effective property is <definition>
    When its Flow value-map cell is rendered
    Then the cell contains <display>
    And activating the cell identifies <detail>

    Examples:
      | definition                           | display                         | detail                                      |
      | fixed to checkout                    | checkout                        | exact effective value and provenance        |
      | allowed to be guest or logged_in     | guest or logged_in              | both allowed values and provenance           |
      | required without an expected value   | Required value not specified    | missing documentation value                  |
      | fixed to active when form_name exists | active when form_name exists   | structured condition and provenance          |
      | forbidden                            | Not expected                    | forbidden rule and provenance                |
      | blocked by conflicting definitions   | Blocked conflicting definitions | both contributors and direct repair links    |

  # Data layer Flow table documentation export 005
  Scenario: Data layer Flow table documentation export 005
    Given the graph forks from Cart into Shipping and Payment before merging at Confirmation
    When documentation order is generated
    Then proposed Step labels are 1, 2a, 2b, and 3
    And parallel columns remain adjacent beneath their shared branch group
    When the operator renames 2a to Delivery choice and moves Payment before Shipping for documentation
    Then preview and exports use the custom label and order
    And graph coordinates, directed relationships, branch meaning, and manual journey semantics remain unchanged

  # Data layer Flow table documentation export 006
  Scenario: Data layer Flow table documentation export 006
    Given effective properties across the selected contexts include page_name, form_name, transaction_id, error_message, and debug_message
    When Data capture matrix is previewed
    Then the union of effective property paths forms the rows
    And matrix states are
      | Variable       | Cart / page_view | Shipping / add_shipping_info | Payment / add_payment_info | Confirmation / purchase |
      | page_name      | M                | M                            | M                          | M                       |
      | form_name      | O                | M                            | M                          | O                       |
      | transaction_id | —                | —                            | —                          | M                       |
      | error_message  | N                | C                            | C                          | N                       |
      | debug_message  | !                | —                            | —                          | —                       |
    And the visible legend defines M Mandatory, O Optional, C Conditional, N Not expected, — Not defined, and ! Blocked

  # Data layer Flow table documentation export 007
  Scenario: Data layer Flow table documentation export 007
    Given Shipping error_message is Required when form_status Equals failed
    When the operator activates its Conditional matrix cell
    Then detail names Shipping add_shipping_info and property error_message
    And it shows Required when form_status Equals failed with inherited and local provenance
    And direct actions open the exact effective property or contributing schema definition
    And the matrix remains a presence summary without discarding the structured condition

  # Data layer Flow table documentation export 008
  Scenario: Data layer Flow table documentation export 008
    When the operator searches and selects property rows
    And adds Description, Type, Allowed values, Documented example, and Comments metadata columns
    And reorders metadata columns and context columns by drag or keyboard controls
    Then both previews and every export preserve the selected rows and orders
    And Reset property columns and Reset context order restore their respective defaults independently
    And the configuration reuses Include headings and Plain, Bordered, or Bordered with highlighted headings
    And export-only ordering or labels do not modify canonical documentation or schema data

  # Data layer Flow table documentation export 009
  Scenario Outline: Data layer Flow table documentation export 009
    Given the configured preview is <view>
    And Include headings is <heading_setting>
    When the operator copies as <copy_mode>
    Then the clipboard receives <output>
    And current row order, context order, metadata columns, cell values, symbols, and visible legend are preserved

    Examples:
      | view                | heading_setting | copy_mode                       | output                                      |
      | Flow value map      | selected        | Spreadsheet                     | headed tab-separated plain text             |
      | Flow value map      | cleared         | Spreadsheet                     | unheaded tab-separated plain text           |
      | Data capture matrix | selected        | Rich table for Confluence or Jira | semantic rich HTML and headed plain fallback |
      | Data capture matrix | cleared         | Rich table for Confluence or Jira | semantic rich HTML and unheaded plain fallback |

  # Data layer Flow table documentation export 010
  Scenario: Data layer Flow table documentation export 010
    Given both preview definitions have been finalized
    When the operator downloads Excel workbook
    Then one .xlsx file contains sheets Flow values, Capture matrix, Legend and provenance, and Export diagnostics
    And the first two sheets match their current previews and context order
    And Legend and provenance expands matrix symbols and names effective contributors and revisions
    And Export diagnostics identifies draft state, incomplete contexts, conflicts, and generation time
    And opening the workbook does not require network access or extension-specific software

  # Data layer Flow table documentation export 011
  Scenario: Data layer Flow table documentation export 011
    Given property documentation contains tabs, line breaks, HTML markup, and text beginning with =, +, -, or @
    When Spreadsheet, Excel workbook, and Rich table outputs are generated
    Then tabs and line breaks cannot create unintended spreadsheet rows or columns
    And spreadsheet and workbook cells remain literal text rather than executable formulas
    And rich output escapes markup while preserving deliberate line breaks
    And the exported table structure and style remain unchanged

  # Data layer Flow table documentation export 012
  Scenario: Data layer Flow table documentation export 012
    Given Payment has an unresolved property reference and Shipping has a compiler conflict
    When the operator previews either documentation view
    Then affected cells and columns show Blocked or Incomplete without invented values
    And Export diagnostics names each human context, property path, issue, and repair action
    When the operator confirms Export labelled incomplete
    Then copied and downloaded outputs contain Draft — incomplete in their title and diagnostics
    And no incomplete export can be mistaken for complete published documentation

  # Data layer Flow table documentation export 013
  Scenario: Data layer Flow table documentation export 013
    Given the preview was compiled from graph revision 7 and effective-schema revision set 12
    When an included occurrence or schema changes
    Then the preview becomes stale and export actions are disabled
    And the operator sees which contexts changed
    When the operator refreshes the preview
    Then one new immutable export snapshot is compiled from the current graph and schema revisions
    And every output from that snapshot uses the same cells, provenance, and diagnostics

  # Data layer Flow table documentation export 014
  Scenario: Data layer Flow table documentation export 014
    Given Checkout journey has the parallel Shipping and Payment branches with exact values, conditional presence, optional properties, forbidden properties, and one unresolved draft property
    When the operator configures Flow value map and Data capture matrix through visible controls
    And copies each as Spreadsheet and Rich table
    And requests the configured multi-sheet file
    Then all five outputs agree on selected contexts, property paths, expected values, matrix states, branch labels, and Draft — incomplete status
    And the workbook contains the four required sheets
    And the project, graph, canonical schemas, documentation, assignments, and per-Event validation behavior remain byte-identical
    And no output claims that the documented Flow executed successfully
