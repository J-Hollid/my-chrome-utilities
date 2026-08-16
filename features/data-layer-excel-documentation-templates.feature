Feature: Data layer Excel documentation templates

  Background:
    Given Shop has configured Overview, Flow, Data capture matrix, and Site Profile documentation sections
    And Excel template contract version 1 is selected

  # Data layer Excel documentation templates 001
  Scenario Outline: Data layer Excel documentation templates 001
    When the operator downloads the Built-in starter for <kind>
    Then one valid macro-free workbook contains exactly one prototype worksheet
    And exactly one Note declares tw:template with contract 1 and kind <kind_key>
    And its placeholders and directives recreate the Built-in <kind> structure
    And Template Library help lists every binding valid for <kind>

    Examples:
      | kind                | kind_key |
      | Overview            | overview |
      | Flow                | flow     |
      | Data capture matrix | matrix   |
      | Site Profile        | profile  |

  # Data layer Excel documentation templates 002
  Scenario: Data layer Excel documentation templates 002
    Given a Flow prototype cell contains Client {{project.name}} — {{section.name}}
    And its bindings are valid in the root Flow scope
    When the prototype renders Checkout journey for Shop
    Then the cell contains literal text Client Shop — Checkout journey
    And the generated worksheet has the deterministic safe name Checkout journey
    And no placeholder or template directive remains in generated cell content or Notes

  # Data layer Excel documentation templates 003
  Scenario: Data layer Excel documentation templates 003
    Given the Flow prototype has a Note tw:each items flow.pages as page to the right through D8
    And the marked pattern contains page step, Page name, primary event, contained Events, and Page-context property rows
    And Checkout journey contains Cart, Shipping, Payment, and Confirmation Page contexts in configured order
    When the operator downloads Checkout journey with the Flow prototype
    Then four complete pattern copies appear from left to right in configured order
    And each copy retains its own Page values and ordered contained Event values
    And repeated references to one canonical Page remain distinct Flow Page contexts
    And no raw Page or occurrence identity appears

  # Data layer Excel documentation templates 004
  Scenario: Data layer Excel documentation templates 004
    Given a Matrix prototype has a Note tw:each items matrix.rows as row downward through H10
    And the row pattern contains row property and a nested rightward repetition over row cells
    When the configured matrix has three context columns and five property rows
    Then five row patterns appear downward and each contains three cells to the right
    And every cell contains its aligned Mandatory, Optional, Conditional, Not expected, Not defined, or Blocked value
    And later static template content shifts below the expanded matrix without overlap

  # Data layer Excel documentation templates 005
  Scenario: Data layer Excel documentation templates 005
    Given a Site Profile prototype repeats profile concepts and nests each concept's configured rows
    And one included configured concept has no current rows
    When the prototype renders the Profile
    Then included non-empty concepts appear once in Documentation Set order
    And rows remain in stable configured path order beneath their concept
    And the empty concept produces no pattern copy
    And excluded concepts and unselected property columns cannot be recovered through a template binding

  # Data layer Excel documentation templates 006
  Scenario: Data layer Excel documentation templates 006
    Given a prototype contains fonts, fills, borders, alignment, number formats, row heights, column widths, merged cells, page setup, headers, footers, and embedded raster images
    And every merged cell is wholly inside or outside its repeat region
    When static and repeated regions render
    Then every generated copy preserves those supported presentation values
    And the resulting workbook opens without a repair, removed content, or external-content warning

  # Data layer Excel documentation templates 007
  Scenario: Data layer Excel documentation templates 007
    Given a prototype has a tw:image directive from theme.logo through C3
    When a valid project theme logo is present
    Then each rendered worksheet embeds the existing image bytes once for its logo presentation
    And the image fits within the marked rectangle with preserved aspect ratio and no enlargement
    When the same prototype renders without a theme logo
    Then the marked logo area is empty and the remaining layout is preserved

  # Data layer Excel documentation templates 008
  Scenario Outline: Data layer Excel documentation templates 008
    Given an uploaded workbook contains <invalid_content>
    When the operator validates it for Flow
    Then the workbook is rejected with <finding>
    And it cannot be assigned or used for sample, preview, or export

    Examples:
      | invalid_content                                      | finding                                      |
      | no tw:template Note                                  | Declare one Flow contract-version-1 template |
      | two worksheets                                       | Keep exactly one prototype worksheet         |
      | an unknown root binding                              | Identify the worksheet and cell binding      |
      | a crossing repeat region                             | Identify both conflicting directive cells    |
      | a merge crossing a repeat boundary                  | Keep the merge wholly inside or outside       |
      | a formula                                            | Remove workbook formulas                      |
      | an external link or data connection                 | Remove external workbook content              |
      | a macro, add-in, embedded package, or linked object | Use inert macro-free workbook content         |

  # Data layer Excel documentation templates 009
  Scenario Outline: Data layer Excel documentation templates 009
    Given a selected .xlsx violates <package_boundary>
    When the operator validates the upload
    Then validation stops with <diagnostic>
    And no template record or body is saved

    Examples:
      | package_boundary                          | diagnostic                         |
      | a source larger than 10 MiB               | The Excel template is too large     |
      | more than 2000 ZIP entries                | The workbook has too many parts     |
      | more than 50 MiB declared unpacked content | The workbook expands beyond 50 MiB |
      | an unsafe or duplicate ZIP entry path     | The workbook package is unsafe      |
      | encrypted or invalid OOXML content        | Choose a valid unencrypted .xlsx    |
      | a broken or unsupported relationship      | Identify the unsupported workbook part |

  # Data layer Excel documentation templates 010
  Scenario: Data layer Excel documentation templates 010
    Given project values begin with =, +, -, and @ and contain tabs, line breaks, markup, and template delimiters
    When scalar and repeated bindings write those values into a custom workbook
    Then every value is stored as literal cell content rather than a formula or directive
    And no value creates another cell, row, column, relationship, part, marker, or workbook instruction
    And deliberate line breaks remain within their intended literal cells

  # Data layer Excel documentation templates 011
  Scenario: Data layer Excel documentation templates 011
    Given repeat expansion would exceed an Excel row or column limit
    When the operator requests a sample, preview, or export
    Then generation blocks before download and identifies the directive, requested size, and applicable limit
    And no collection is truncated
    And the prior immutable preview and saved template remain unchanged

  # Data layer Excel documentation templates 012
  Scenario: Data layer Excel documentation templates 012
    Given a valid unassigned Flow prototype is selected in the Template Library
    When the operator downloads a sample-filled workbook for Checkout journey
    Then the sample uses the current immutable Checkout journey snapshot and the candidate prototype
    And the candidate remains unassigned and unsaved changes no project content
    And any validation or generation finding names its worksheet, cell, directive, or binding
