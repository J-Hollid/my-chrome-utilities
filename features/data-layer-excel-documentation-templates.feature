Feature: Data layer Excel documentation templates

  Background:
    Given Shop has configured Overview, Flow, Data capture matrix, and Site Profile documentation sections
    And the guided Excel template contract is selected

  # Data layer Excel documentation templates 001
  Scenario Outline: Data layer Excel documentation templates 001
    When the operator downloads the guided starter for <kind>
    Then one valid macro-free workbook contains one Template worksheet and one visible Template Guide worksheet
    And Excel table TemplateSettings contains Contract 2 and documentation Kind <kind_key>
    And Excel table TemplateAreas exposes Area, Type, Source, and Direction
    And the Template Guide contains the binding glossary and repeat examples valid for <kind>
    And the Template worksheet recreates the Built-in <kind> structure

    Examples:
      | kind                | kind_key |
      | Overview            | overview |
      | Flow                | flow     |
      | Data capture matrix | matrix   |
      | Site Profile        | profile  |

  # Data layer Excel documentation templates 002
  Scenario: Data layer Excel documentation templates 002
    Given a Flow Template cell contains Client {{project.name}} — {{section.name}}
    And both values are described as available there by the Flow binding guide
    When the template renders Checkout journey for Shop
    Then the cell contains literal text Client Shop — Checkout journey
    And the generated worksheet has the deterministic safe name Checkout journey
    And the generated workbook contains neither the Template Guide nor unresolved template instructions

  # Data layer Excel documentation templates 003
  Scenario: Data layer Excel documentation templates 003
    Given the Flow Template contains a styled multi-cell named area PageCard
    And Template Guide maps PageCard to flow.pages Across
    And the area contains Page headings, Page values, and ordinary operator-authored labels
    And Checkout journey contains Cart, Shipping, Payment, and Confirmation Page contexts in configured order
    When the operator downloads populated output
    Then four complete PageCard copies appear from left to right in configured order
    And each copy retains its styles, labels, and values for its own Page context
    And repeated references to one canonical Page remain distinct Flow Page contexts
    And no raw Page or occurrence identity appears

  # Data layer Excel documentation templates 004
  Scenario: Data layer Excel documentation templates 004
    Given a Matrix RowPattern named area repeats matrix.rows Down
    And a CellPattern named area is wholly inside RowPattern and repeats row.cells Across
    When the configured matrix has three context columns and five property rows
    Then five RowPattern copies appear downward and each contains three CellPattern copies to the right
    And every cell contains its aligned Mandatory, Optional, Conditional, Not expected, Not defined, or Blocked value
    And later static template content shifts below the expanded matrix without overlap

  # Data layer Excel documentation templates 005
  Scenario: Data layer Excel documentation templates 005
    Given a Site Profile template repeats ConceptPattern over profile.concepts
    And RowPattern is contained by ConceptPattern and repeats concept.rows
    And one included configured concept has no current rows
    When the template renders the Profile
    Then included non-empty concepts appear once in Documentation Set order
    And rows remain in stable configured path order beneath their concept
    And the empty collection produces no RowPattern copy
    And excluded concepts and unselected property columns cannot be recovered through a template binding

  # Data layer Excel documentation templates 006
  Scenario: Data layer Excel documentation templates 006
    Given a Template contains fonts, fills, borders, alignment, number formats, row heights, column widths, merged cells, page setup, headers, footers, and embedded raster images
    And every merged cell is wholly inside or outside its named repeat area
    When static and repeated areas render
    Then every generated copy preserves those supported presentation values
    And the resulting workbook opens without a repair, removed content, or external-content warning

  # Data layer Excel documentation templates 007
  Scenario: Data layer Excel documentation templates 007
    Given Template Guide maps named area ThemeLogo to image source theme.logo
    When a valid project theme logo is present
    Then each rendered worksheet embeds the existing image bytes once in ThemeLogo
    And the image fits within the named area with preserved aspect ratio and no enlargement
    When the same template renders without a theme logo
    Then ThemeLogo is empty and the remaining layout is preserved

  # Data layer Excel documentation templates 008
  Scenario Outline: Data layer Excel documentation templates 008
    Given a selected Flow workbook contains <problem>
    When guided validation inspects the candidate
    Then its primary finding says <finding>
    And its suggested action says <repair>
    And the finding identifies the affected worksheet, cell, or named area
    And technical details are initially collapsed
    And no finding speculates about the operator's edit history
    And a dependent binding finding is hidden until its containing repeat area is valid

    Examples:
      | problem                                      | finding                                                        | repair                                                                           |
      | binding event.eventName in B6 outside a page.events repeat area | B6 cannot use event.eventName here                         | Put B6 inside a repeat of page.events or choose a field available here           |
      | EventRow extending partly outside PageCard   | EventRow must fit completely inside its parent area PageCard    | Resize EventRow or PageCard so the smaller area is completely contained          |
      | setup referring to missing area PageCard     | Repeat area PageCard cannot be found                            | Select the intended Template cells and define the named area PageCard            |
      | repeat PageCard using an unavailable collection | PageCard cannot repeat that data here                         | Choose a collection shown as available in the Flow guide                         |

  # Data layer Excel documentation templates 009
  Scenario Outline: Data layer Excel documentation templates 009
    Given a selected .xlsx violates <package_boundary>
    When guided validation inspects the candidate
    Then validation stops with <diagnostic>
    And the candidate cannot be previewed, saved, assigned, or used for export

    Examples:
      | package_boundary                           | diagnostic                              |
      | a source larger than 10 MiB                | The Excel template is too large          |
      | more than 2000 ZIP entries                 | The workbook has too many parts          |
      | more than 50 MiB declared unpacked content | The workbook expands beyond 50 MiB       |
      | an unsafe or duplicate ZIP entry path      | The workbook package is unsafe           |
      | encrypted or invalid OOXML content         | Choose a valid unencrypted .xlsx         |
      | a broken or unsupported relationship       | Identify the unsupported workbook part   |
      | a formula or external workbook connection  | Remove active or external workbook content |

  # Data layer Excel documentation templates 010
  Scenario: Data layer Excel documentation templates 010
    Given project values begin with =, +, -, and @ and contain tabs, line breaks, markup, and template delimiters
    When scalar and repeated bindings write those values into a custom workbook
    Then every value is stored as literal cell content rather than a formula or instruction
    And no value creates another cell, row, column, relationship, part, marker, or workbook instruction
    And deliberate line breaks remain within their intended literal cells

  # Data layer Excel documentation templates 011
  Scenario: Data layer Excel documentation templates 011
    Given repeat expansion would exceed an Excel row or column limit
    When the operator requests populated preview or assigned output
    Then generation blocks before download and identifies the named area, requested size, and applicable limit
    And no collection is truncated
    And the candidate, prior immutable preview, and saved template remain unchanged

  # Data layer Excel documentation templates 012
  Scenario: Data layer Excel documentation templates 012
    Given the operator selects a valid unassigned Flow workbook
    When candidate inspection completes
    Then the Library shows its kind, binding cells, named image areas, and every repeat's collection, item prefix, direction, range, and parent
    And no template metadata or body has been saved
    When the operator downloads Populated preview — output only for Checkout journey
    Then the preview uses the current immutable Checkout journey snapshot and candidate workbook
    And the downloaded workbook is clearly identified as output rather than a reusable template
    And the candidate remains unsaved and unassigned
    When the operator activates Save template
    Then one valid project template and its exact body are saved

  # Data layer Excel documentation templates 013
  Scenario Outline: Data layer Excel documentation templates 013
    Given <repeat_area> is a complete named repeat area in a guided starter
    When the operator cuts the complete area and pastes it one column right and one row down
    And the operator selects the changed workbook in the Template Library
    Then the candidate remains valid without editing an endpoint or hidden instruction
    And <repeat_area> retains its collection, direction, nesting, and original dimensions at the new location
    And populated output places every generated copy relative to the moved area

    Examples:
      | repeat_area |
      | PageCard    |
      | RowPattern  |

  # Data layer Excel documentation templates 014
  Scenario: Data layer Excel documentation templates 014
    When the operator opens the Flow Excel template guide
    Then it separates single values from repeatable data
    And each entry shows its exact cell form, plain-language meaning, example value, and where it is available
    And each repeatable collection shows its item prefix, supported directions, available fields, nested collections, empty-result behavior, and complete-area copy behavior
    And the guide can be searched by binding, collection, or ordinary-language description
    And it demonstrates one Down repeat, one Across repeat, and one nested repeat using the same terms as Template Guide
    And it presents these copyable TemplateAreas examples
      | Area      | Type   | Source       | Direction |
      | PageCard  | Repeat | flow.pages   | Across    |
      | EventRow  | Repeat | page.events  | Down      |
      | ThemeLogo | Image  | theme.logo   |           |

  # Data layer Excel documentation templates 015
  Scenario: Data layer Excel documentation templates 015
    Given a workbook contains only tw template instructions in worksheet Notes or Comments
    And it has no current Template Guide setup
    When the operator selects the workbook
    Then no Note or Comment is interpreted as template behavior
    And the candidate is rejected as not using the current guided template format
    And the finding offers Download guided starter
    And no legacy template migration or rendering is attempted

  # Data layer Excel documentation templates 016
  Scenario: Data layer Excel documentation templates 016
    Given Excel saved a valid guided starter with documented Microsoft Purview sensitivity-label Custom File Properties
    And the sensitivity label did not encrypt the workbook or add active content
    When guided validation inspects the candidate
    Then the label properties are treated as nonfunctional package metadata rather than template instructions
    And the candidate is accepted by the same contract, binding, area, relationship, and size rules as the unlabelled starter
    When the operator saves the candidate
    Then the exact labelled workbook bytes and their matching digest and byte length are saved atomically
    And no label property becomes a binding, repeat area, external relationship, or project field
