Feature: Data layer Flow table documentation export runtime

  Background:
    Given the built extension is running with the production Flow editor, canonical compiler, table exporter, clipboard, and download adapter
    And production Checkout journey contains Cart page_view, Shipping add_shipping_info, Payment add_payment_info, and Confirmation purchase
    And production Shipping and Payment branches merge before Confirmation

  # Data layer Flow table documentation export runtime 001
  Scenario: Data layer Flow table documentation export runtime 001
    When actual controls open Documentation export from Checkout journey
    Then the production main workspace renders Flow value map and Data capture matrix choices
    And the preview renders project, Flow, Draft state, graph revision, and schema revisions
    And installed actions include Spreadsheet, Download Excel workbook, and Rich table for Confluence or Jira
    And production Flow, schema, assignment, and viewport bytes remain unchanged

  # Data layer Flow table documentation export runtime 002
  Scenario: Data layer Flow table documentation export runtime 002
    When actual selectors include documentation columns
      | Page         | Event                | Event role      |
      | Cart         | page_view            | context-setting |
      | Shipping     | add_shipping_info    | interaction     |
      | Payment      | add_payment_info     | interaction     |
      | Confirmation | purchase             | interaction     |
    Then each rendered column heading contains Step label, Page name, and Event name
    And production configuration stores Page-frame and Event-occurrence IDs
    And the compiler receives combined effective Page and Event branches for every column
    And production context-setting metadata creates no binding lookup or alternate compiler route
    And the installed UI exposes no raw ID as a heading or selector label

  # Data layer Flow table documentation export runtime 003
  Scenario: Data layer Flow table documentation export runtime 003
    Given production selected contexts compile exact expected values
    When actual controls preview Flow value map with Property name rows
    Then the rendered table heading is Checkout journey
    And rendered Flow value cells are
      | Property name  | Step 1 Cart / page_view | Step 2a Shipping / add_shipping_info | Step 2b Payment / add_payment_info | Step 3 Confirmation / purchase |
      | page_name      | cart                    | shipping                             | payment                           | confirmation                   |
      | form_name      | checkout                | checkout                             | checkout                          | checkout                       |
      | form_step_name | cart                    | shipping                             | payment                           | confirmation                   |
      | form_status    | started                 | active                               | active                            | completed                      |
      | page_type      | checkout                | checkout                             | checkout                          | confirmation                   |
    And production compiler output rather than DOM-local copies supplies every expectation cell

  # Data layer Flow table documentation export runtime 004
  Scenario Outline: Data layer Flow table documentation export runtime 004
    Given production effective property is <definition>
    When its installed value-map cell renders
    Then rendered text is <display>
    And activating the cell renders <detail>

    Examples:
      | definition                           | display                         | detail                                      |
      | fixed to checkout                    | checkout                        | exact effective value and provenance        |
      | allowed to be guest or logged_in     | guest or logged_in              | both allowed values and provenance           |
      | required without an expected value   | Required value not specified    | missing documentation value                  |
      | fixed to active when form_name exists | active when form_name exists   | structured condition and provenance          |
      | forbidden                            | Not expected                    | forbidden rule and provenance                |
      | blocked by conflicting definitions   | Blocked conflicting definitions | both contributors and direct repair links    |

  # Data layer Flow table documentation export runtime 005
  Scenario: Data layer Flow table documentation export runtime 005
    Given production graph forks from Cart into Shipping and Payment and merges at Confirmation
    When installed documentation order is generated
    Then rendered Step labels are 1, 2a, 2b, and 3 with adjacent branch columns
    When actual controls rename 2a to Delivery choice and move Payment before Shipping
    Then production previews and exports use that documentation label and order
    And canonical coordinates, relationships, branch semantics, and graph revision remain unchanged

  # Data layer Flow table documentation export runtime 006
  Scenario: Data layer Flow table documentation export runtime 006
    Given production context schemas include page_name, form_name, transaction_id, error_message, and debug_message
    When actual controls preview Data capture matrix
    Then rendered rows are the union of effective property paths
    And rendered matrix states are
      | Variable       | Cart / page_view | Shipping / add_shipping_info | Payment / add_payment_info | Confirmation / purchase |
      | page_name      | M                | M                            | M                          | M                       |
      | form_name      | O                | M                            | M                          | O                       |
      | transaction_id | —                | —                            | —                          | M                       |
      | error_message  | N                | C                            | C                          | N                       |
      | debug_message  | !                | —                            | —                          | —                       |
    And the installed legend defines every symbol with its full meaning

  # Data layer Flow table documentation export runtime 007
  Scenario: Data layer Flow table documentation export runtime 007
    Given production Shipping error_message is Required when form_status Equals failed
    When actual controls activate its C matrix cell
    Then rendered detail names Shipping add_shipping_info and error_message
    And it renders the structured condition with inherited and local provenance
    And production links open the exact effective property or contributing schema node
    And canonical condition storage remains unchanged

  # Data layer Flow table documentation export runtime 008
  Scenario: Data layer Flow table documentation export runtime 008
    When actual controls select property rows and add Description, Type, Allowed values, Documented example, and Comments
    And pointer and keyboard controls reorder metadata and context columns
    Then production previews and exports retain both selections and orders
    And installed reset actions independently restore property-column and context defaults
    And Include headings plus all three existing table styles remain operable
    And closing export leaves canonical documentation and schema bytes unchanged

  # Data layer Flow table documentation export runtime 009
  Scenario Outline: Data layer Flow table documentation export runtime 009
    Given production preview is <view>
    And installed Include headings is <heading_setting>
    When actual controls copy as <copy_mode>
    Then the clipboard adapter receives <output>
    And observed rows, contexts, metadata, cell values, symbols, and visible legend match the preview

    Examples:
      | view                | heading_setting | copy_mode                       | output                                      |
      | Flow value map      | selected        | Spreadsheet                     | headed tab-separated plain text             |
      | Flow value map      | cleared         | Spreadsheet                     | unheaded tab-separated plain text           |
      | Data capture matrix | selected        | Rich table for Confluence or Jira | semantic rich HTML and headed plain fallback |
      | Data capture matrix | cleared         | Rich table for Confluence or Jira | semantic rich HTML and unheaded plain fallback |

  # Data layer Flow table documentation export runtime 010
  Scenario: Data layer Flow table documentation export runtime 010
    Given production definitions for both previews are finalized
    When actual controls download Excel workbook
    Then the download adapter receives one valid .xlsx file
    And workbook parsing returns sheets Flow values, Capture matrix, Legend and provenance, and Export diagnostics
    And parsed first and second sheets equal their rendered previews and context order
    And parsed legend and diagnostics contain contributor revisions, draft state, issues, and generation time
    And workbook generation performs no network request

  # Data layer Flow table documentation export runtime 011
  Scenario: Data layer Flow table documentation export runtime 011
    Given production documentation contains tabs, line breaks, HTML markup, and values beginning with =, +, -, or @
    When actual controls generate all three output formats
    Then parsed spreadsheet output retains the intended row and column counts
    And parsed workbook cells contain literal strings with no executable formulas
    And clipboard HTML contains escaped content and deliberate line breaks
    And no production markup, style, or worksheet structure is injected by cell content

  # Data layer Flow table documentation export runtime 012
  Scenario: Data layer Flow table documentation export runtime 012
    Given production Payment has an unresolved reference and Shipping has a compiler conflict
    When actual controls preview either documentation view
    Then installed cells and columns render Blocked or Incomplete without fabricated values
    And Export diagnostics renders human context, property path, issue, and repair link
    When actual controls confirm Export labelled incomplete
    Then clipboard and workbook outputs contain Draft — incomplete in titles and diagnostics
    And no output presents incomplete content as published or complete

  # Data layer Flow table documentation export runtime 013
  Scenario: Data layer Flow table documentation export runtime 013
    Given production preview was compiled from graph revision 7 and schema revision set 12
    When an included occurrence or schema command commits
    Then the installed preview renders stale and all export actions are disabled
    And changed contexts are named
    When actual controls refresh
    Then one immutable production export snapshot uses current graph and schema revisions
    And clipboard and workbook adapters receive identical cells, provenance, and diagnostics from that snapshot

  # Data layer Flow table documentation export runtime 014
  Scenario: Data layer Flow table documentation export runtime 014
    Given production Checkout has parallel Shipping and Payment branches with exact, conditional, optional, forbidden, and unresolved effective properties
    When actual controls configure both documentation views
    And copy each view in Spreadsheet and Rich table modes
    And request the production multi-sheet file
    Then all five captured outputs agree on contexts, paths, expectations, matrix states, branch labels, and Draft — incomplete status
    And the downloaded workbook satisfies the required four-sheet contract
    And project, graph, schema, documentation, assignment, and per-Event validation bytes remain identical
    And no installed output claims successful Flow execution
