# mutation-stamp: sha256=7ba0fe191b8a5466300b712bc4f361f8a3673df2747d9248261b2533075450ae
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-08-24T05:53:54.522606716Z","feature_name":"Data layer Excel documentation templates","feature_path":"features/data-layer-excel-documentation-templates.feature","background_hash":"a7b8dd72d5c4c8de98551347cc50e770fb560c3f7d1322c9bc2083628b60c83a","implementation_hash":"sha256:28325a80f01fe4f1e9be883b1091ff5fcd26dfab45f7ea1d3db8bae390226bd5","scenarios":[{"index":25,"name":"Data layer Excel documentation templates 026","scenario_hash":"be68c14f3670cc617d7cb660e03b2ae41972e2abd4692ea560e7e077d9f75796","mutation_count":28,"result":{"Total":28,"Killed":28,"Survived":0,"Errors":0},"tested_at":"2026-08-24T05:53:54.522606716Z"},{"index":0,"name":"Data layer Excel documentation templates 001","scenario_hash":"8e28ce62175ac89b6578383e72b4b542b1a9a136e07824ea997fbb8588c4a13c","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-08-24T05:52:31.739865264Z"},{"index":17,"name":"Data layer Excel documentation templates 018","scenario_hash":"10ba63a30678cbf0ea0584515150807ce053c244cc00d01bbc84ac46152a7eb4","mutation_count":25,"result":{"Total":25,"Killed":25,"Survived":0,"Errors":0},"tested_at":"2026-08-24T05:52:31.739865264Z"},{"index":21,"name":"Data layer Excel documentation templates 022","scenario_hash":"7b78492ea6c4ba55d7cd8db245c8b3835053cb58a7e0e4b5d72db87437e410e4","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-08-24T05:52:31.739865264Z"},{"index":23,"name":"Data layer Excel documentation templates 024","scenario_hash":"c1c5b513dbd1df31db45e025d066e851d580d5bc55ca85a9fe029dd85963a42e","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-08-24T05:52:31.739865264Z"},{"index":24,"name":"Data layer Excel documentation templates 025","scenario_hash":"13ae75ec01a9e0a458beb014fad5558d2a1c2d3829f5988f63707455234f5408","mutation_count":36,"result":{"Total":36,"Killed":36,"Survived":0,"Errors":0},"tested_at":"2026-08-24T05:52:31.739865264Z"},{"index":27,"name":"Data layer Excel documentation templates 028","scenario_hash":"d3ae03bc6ec61154cc697b7dce09fa4837c0a772dd929c6fc4cf25c04135d101","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-08-24T05:52:31.739865264Z"},{"index":7,"name":"Data layer Excel documentation templates 008","scenario_hash":"12ba03daf98fc102de2cc65075ed2fabd52878b7c6ff85c95bbf6aa0230a6f09","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-08-21T14:26:09.570679505Z"},{"index":8,"name":"Data layer Excel documentation templates 009","scenario_hash":"f599ca167949b7362d1e4ea0dd1b9c081092750ecb718286186fa55d9a1347b3","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-08-21T14:26:09.570679505Z"},{"index":12,"name":"Data layer Excel documentation templates 013","scenario_hash":"1c7fa4b24107294c4da1e6176d0664dc49bb0e634c6591699a782b845744c27c","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-08-21T14:26:09.570679505Z"},{"index":16,"name":"Data layer Excel documentation templates 017","scenario_hash":"0fe75fcdb444d7d01c56be476932dbc50e3fc5e5da0b2c468ec5ebc9ed19b26d","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-08-21T14:26:09.570679505Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer Excel documentation templates

  Background:
    Given Shop has configured Overview, Flow, Data capture matrix, and Site Profile documentation sections
    And the guided Excel template contract is selected

  # Data layer Excel documentation templates 001
  Scenario Outline: Data layer Excel documentation templates 001
    When the operator downloads the guided starter for <kind>
    Then one valid macro-free workbook contains one Template worksheet and one visible Template Guide worksheet
    And Excel table TemplateSettings contains Contract 3 and documentation Kind <kind_key>
    And Excel table TemplateAreas exposes Area, Type, Source, Direction, and Properties
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
      | an unrecognized or active binary part      | Use inert macro-free workbook content    |

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
      | Area      | Type   | Source       | Direction | Properties                                         |
      | PageCard  | Repeat | flow.pages   | Across    |                                                    |
      | PageStep  | Repeat | flow.pages   | Across    | separator-area: PageSeparator                     |
      | EventRow  | Repeat | page.events  | Down      |                                                    |
      | ThemeLogo | Image  | theme.logo   |           | fit: scale-down; position: center; padding: 8px   |

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
    Then the exact candidate workbook bytes and their matching digest and byte length are saved atomically
    And no label property becomes a binding, repeat area, external relationship, or project field

  # Data layer Excel documentation templates 017
  Scenario Outline: Data layer Excel documentation templates 017
    Given Excel saved a valid guided workbook with standard printer settings for <worksheet>
    And <printer_settings_part> has the standard printer-settings content type and one internal relationship from <worksheet>
    When guided validation inspects the candidate
    Then the printer settings are treated as inert presentation metadata rather than macro or template behavior
    And the candidate can be previewed, saved, assigned, and rendered under the ordinary guided contract
    And only supported Template page setup, headers, and footers can affect populated output
    When the operator saves the candidate
    Then the exact candidate workbook bytes and their matching digest and byte length are saved atomically

    Examples:
      | worksheet      | printer_settings_part                                |
      | Template       | xl/printerSettings/printerSettings1.bin              |
      | Template Guide | xl/printerSettings/printerSettings2.bin              |

  # Data layer Excel documentation templates 018
  Scenario Outline: Data layer Excel documentation templates 018
    Given Checkout has exactly one selected Flow documentation section
    And that section selects Example and Allowed values metadata
    And Page instance <page_instance> has property <property> with <example_source> and effective allowed values <allowed_values>
    And FlowColumnHeader repeats flow.pages Across in C4:D6 with no parent
    And PropertyRow repeats flow.rows Down in B6 with no parent
    And PropertyValue repeats page.rows Down in C6:D6 within FlowColumnHeader
    And C4 binds page.pageName, B6 binds row.property, and C6 binds row.property, row.example, and row.allowedValues
    When the operator generates Populated preview output for the unsaved candidate
    Then the <page_instance> Page column contains <property> with row.example <rendered_example>
    And row.allowedValues contains <allowed_values> independently of row.example
    And neither binding substitutes an allowed value, another Page's example, or empty text for an available effective example

    Examples:
      | page_instance | property               | example_source                                | allowed_values       | rendered_example     |
      | Cart          | page_name              | a direct documented example                   | cart or category     | "cart-page"             |
      | Cart          | ecommerce_order_id     | an inherited documented example               | draft or paid        | "ORDER-100"             |
      | Cart          | currency               | a mixed inherited and local documented example | EUR or USD           | "Euro checkout"         |
      | Confirmation  | page_type              | an overridden documented example               | cart or confirmation | "confirmation-example" |
      | Cart          | coupon_code            | no effective documented example                | WELCOME or SAVE10    | empty text              |

  # Data layer Excel documentation templates 019
  Scenario: Data layer Excel documentation templates 019
    Given PageCard repeats flow.pages and contains named image area PageVisual
    And Template Guide maps PageVisual to image source page.visual.image within PageCard
    And PageCard cells bind page.visual description, caption, and sourceReference
    And two Page instances of canonical Cart have different saved PNG, JPEG, or WebP visuals while Payment has none
    When the operator downloads populated output
    Then each Cart PageCard embeds only its own saved PNG or JPEG bytes or a renderer-local PNG conversion of its saved WebP in PageVisual
    And WebP conversion changes neither the saved body nor its attachment identity and preserves its decoded content
    And each image preserves aspect ratio, is not enlarged, and stays inside its named area
    And each Cart PageCard contains its own literal description, caption, and source reference
    And Payment leaves PageVisual and its visual metadata cells empty without changing the remaining layout
    And no image uses an external relationship or another Page instance's attachment

  # Data layer Excel documentation templates 020
  Scenario: Data layer Excel documentation templates 020
    Given the Flow Template contains PageCard
    And Template Guide maps PageCard to flow.pages Across
    And ConceptPattern inside PageCard repeats page.concepts Down
    And RowPattern is contained by ConceptPattern and repeats concept.rows
    And a CellPattern named area is wholly inside RowPattern and repeats row.cells Across
    And Checkout configures Example metadata with Ecommerce before Funnel
    When the workbook renders Cart and Confirmation Page instances
    Then each PageCard contains one Ecommerce heading followed by its Ecommerce rows and one Funnel heading followed by its Funnel rows
    And every row remains in configured property order beneath its concept
    And each example cell contains that Page instance's effective documented example rather than its allowed-values list or another Page's example
    And existing page.rows, row.allowedValues, and allowedValues cells remain available unchanged
    And empty or excluded concepts produce no heading or row copy

  # Data layer Excel documentation templates 021
  Scenario: Data layer Excel documentation templates 021
    Given a valid Contract 2 workbook has the exact TemplateAreas columns Area, Type, Source, and Direction
    When candidate inspection and the preview, save, assignment, and render paths consume that workbook
    Then every path accepts it without requiring a Properties column or migration
    And saving preserves the exact selected workbook bytes
    And every generated image keeps the legacy scale-down, top-left, and zero-padding behavior
    When the operator downloads a new guided starter
    Then Contract 3 exposes one Properties cell per area
    And that cell accepts one or more semicolon-separated declarations in any order with an optional trailing semicolon
    And blank Properties preserve the Contract 2 result
    And the Template Guide and searchable Library guide explain the supported keys, values, defaults, and combined examples

  # Data layer Excel documentation templates 022
  Scenario Outline: Data layer Excel documentation templates 022
    Given a Contract 3 Image area is 100 pixels wide and 60 pixels high
    And its source image has natural size <natural_size>
    And its one Properties cell contains <properties>
    When populated output renders the image
    Then it preserves aspect ratio at size <rendered_size>
    And its top-left is <offset> pixels from the area's top-left
    And no image pixel is cropped or leaves the padded usable rectangle

    Examples:
      | natural_size | properties                                                     | rendered_size | offset |
      | 40 by 20     | fit: scale-down; position: center; padding: 8px                 | 40 by 20      | 30, 20 |
      | 20 by 20     | fit: contain; position: right bottom; padding: 4px 8px 12px 16px | 44 by 44      | 48, 4  |
      | 40 by 20     | fit: scale-down; position: 25% 75%; padding: 0px                | 40 by 20      | 15, 30 |

  # Data layer Excel documentation templates 023
  Scenario: Data layer Excel documentation templates 023
    Given PageStep A1:B1 repeats flow.pages Across with Properties separator-area: PageSeparator
    And PageSeparator is the complete trailing column B1:B1 of PageStep
    And A1 contains {{page.pageName}}, B1 contains literal >>, and C1 contains Later content
    And the configured Pages are Cart, Shipping, and Payment in that order
    When populated output renders the repeat
    Then A1:E1 contains Cart, >>, Shipping, >>, and Payment in order
    And no separator or empty separator column follows Payment
    And Later content shifts to F1 without overlap
    And the source collection order and project state remain unchanged

  # Data layer Excel documentation templates 024
  Scenario Outline: Data layer Excel documentation templates 024
    Given a Repeat area's separator is its complete <trailing_edge>
    And removing that separator leaves one non-empty rectangular item area
    When an ordered collection of <source_count> items renders <direction>
    Then the output contains <source_count> item areas and <separator_count> separator areas
    And no separator appears before the first item or after the last item
    And later Template content shifts by the exact combined output size

    Examples:
      | direction | trailing_edge               | source_count | separator_count |
      | Across    | full-height rightmost column | 0            | 0               |
      | Across    | full-height rightmost column | 1            | 0               |
      | Across    | full-height rightmost column | 3            | 2               |
      | Down      | full-width bottom row        | 3            | 2               |

  # Data layer Excel documentation templates 025
  Scenario Outline: Data layer Excel documentation templates 025
    Given a Contract 3 candidate contains <problem>
    When guided validation inspects the candidate
    Then the primary finding identifies TemplateAreas <area> Properties
    And it says <finding>
    And it recommends <repair>
    And the candidate cannot be previewed, saved, assigned, or used for export
    And the candidate, prior preview, saved template, assignment, and project remain unchanged

    Examples:
      | area       | problem                                                   | finding                                                    | repair                                                   |
      | ThemeLogo  | Image Properties fit: cover                              | ThemeLogo has unsupported image fit cover                  | Use scale-down or contain                                |
      | ThemeLogo  | Image Properties padding: 8px; padding: 4px              | ThemeLogo declares padding more than once                  | Keep one padding declaration                             |
      | ThemeLogo  | Image Properties margin: 8px                             | ThemeLogo has unsupported image property margin            | Use padding for space inside the image area              |
      | ThemeLogo  | Image Properties separator-area: LogoGap                 | separator-area cannot be used for an Image                 | Use fit, position, or padding                            |
      | ThemeLogo  | padding that leaves no usable width or height             | ThemeLogo padding leaves no room for its image              | Reduce padding or enlarge ThemeLogo                      |
      | PageStep   | Repeat Properties position: center                       | position cannot be used for a Repeat                       | Use separator-area or leave Properties blank             |
      | PageStep   | separator-area naming no workbook-defined range           | separator area PageSeparator cannot be found               | Define PageSeparator or correct the Properties value     |
      | PageStep   | Across separator that is not the complete trailing edge   | PageSeparator must be the complete right edge of PageStep  | Resize PageSeparator to the full-height rightmost columns |
      | PageStep   | separator containing a binding, image, or nested repeat   | PageSeparator contains unsupported template behavior       | Keep only literal cells and presentation in the separator |

  # Data layer Excel documentation templates 026
  Scenario Outline: Data layer Excel documentation templates 026
    Given Checkout Page instance has effective <property_type> property <property> with one documented <typed_example>
    And a valid Flow workbook binds one cell exactly to {{row.example}} inside page.rows
    When the operator generates unsaved populated preview and assigned Excel output
    Then row.example contains the readable single-line JSON value <rendered_example> in both outputs
    And parsing <rendered_example> as JSON reconstructs the effective example with every scalar, member, and container type unchanged
    And the matching Documented example entry in row.cells contains the same literal text
    And strings and object keys use JSON double quoting and escaping while structural commas and colons are followed by one space
    And the same literal is substituted without loss when {{row.example}} appears beside ordinary text or another binding
    And no type is inferred from how an example's text looks
    And another selected property with no effective documented example exposes empty text rather than the JSON null literal
    And the Flow template guide describes row.example as a type-faithful JSON value and shows quoted-string and array examples
    And schemas, Documentation configuration, template bytes, Draft state, and Published state remain unchanged

    Examples:
      | property          | property_type    | typed_example                                      | rendered_example                         |
      | /text_code        | string           | typed string 12                                    | "12"                                     |
      | /quantity         | number           | typed number 12                                    | 12                                       |
      | /enabled          | boolean          | typed boolean false                                | false                                    |
      | /optional_value   | nullable         | typed null                                         | null                                     |
      | /labels           | array of strings | typed array ["item1", "item2", "item3"]            | ["item1", "item2", "item3"]             |
      | /quantities       | array of numbers | typed array [1, 2, 3]                              | [1, 2, 3]                                |
      | /item             | object           | typed object {"id": 12, "label": "12"}              | {"id": 12, "label": "12"}               |

  # Data layer Excel documentation templates 027
  Scenario: Data layer Excel documentation templates 027
    Given a Contract 3 Flow workbook defines FlowColumnHeader C2:D6 repeating flow.pages Across
    And its Properties cell contains separator-area: PageSeparator for PageSeparator D2:D6
    And D4 contains literal >> while PropertyValue C6 repeats page.rows Down
    And the configured Pages have differing non-empty page.rows collections that expand below row 6
    And OutputCanvas is one finite root named area containing the prototype and intentional blank margins
    And its Output row has blank Source and Direction and Properties background-fill: #FFFFFF
    And the Template does not paint an arbitrary broad rectangle for its background
    When populated output renders the workbook
    Then each inter-Page separator keeps its authored width and projects presentation through every nested generated row of the preceding Page
    And cells aligned with the expanded PropertyValue rows receive separator presentation without repeated literal content
    And literal >> appears once between adjacent Pages with no separator slot or empty separator column after the final Page
    And a Down separator symmetrically projects presentation through nested Across columns of its preceding item
    And the final OutputCanvas bounds include every root, nested, Across, Down, and separator geometry delta plus the declared margins
    And every otherwise unfilled cell inside those bounds has solid white fill while explicit authored cell fills take precedence
    And no cell outside the final OutputCanvas receives the generated background
    And Contract 2 and Contract 3 workbooks without an Output row retain their established presentation
    And bindings, image layout, collection order, immutable snapshot data, template bytes, assignments, Draft state, and Published state remain unchanged

  # Data layer Excel documentation templates 028
  Scenario Outline: Data layer Excel documentation templates 028
    Given a Contract 3 candidate declares <output_problem>
    When guided validation or bounded render preflight evaluates it
    Then the primary finding identifies <location>
    And it says <finding>
    And it recommends <repair>
    And no workbook generation, download, template save, assignment, project revision, or publication write occurs

    Examples:
      | output_problem                                             | location                                  | finding                                                  | repair                                                        |
      | OutputCanvas background-fill: white                       | TemplateAreas OutputCanvas Properties     | background-fill must be six-digit #RRGGBB                | Use a value such as #FFFFFF                                   |
      | two Output rows                                            | TemplateAreas OutputCanvas Properties     | Contract 3 allows at most one Output area                 | Keep one finite Output area                                   |
      | OutputCanvas that omits PageVisual                         | TemplateAreas OutputCanvas Properties     | OutputCanvas does not contain all generated output       | Resize OutputCanvas to contain PageVisual                     |
      | an Output row with nonblank Source or Direction            | TemplateAreas OutputCanvas                | Output Source and Direction must be blank                 | Clear Source and Direction                                    |
      | an OutputCanvas projected to 250001 background cells       | generated OutputCanvas                    | the generated background exceeds the 250000-cell budget  | Reduce the Output area or the number of generated repeat items |
