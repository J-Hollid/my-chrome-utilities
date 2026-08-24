# mutation-stamp: sha256=bbed48228cc39b16f077c7d1be881f3734d255b42daf357862721a7ab8dc8232
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-08-24T05:55:34.950197816Z","feature_name":"Data layer Excel documentation templates runtime","feature_path":"features/data-layer-excel-documentation-templates-runtime.feature","background_hash":"68be27a331ddecf95846570243727332aca14d9fa4d430f9dc5c3635a7d1fac7","implementation_hash":"sha256:2f7dc54ea1f7706ae6bdd0a9764fb4ae876b4de88d841dcc557bfa00df1d7bda","scenarios":[{"index":18,"name":"Data layer Excel documentation templates runtime 019","scenario_hash":"d07e2807ef0e2232224c358a63c572f4c2571d81fc6523d4c03934a8cef02dac","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-08-24T05:55:34.950197816Z"},{"index":19,"name":"Data layer Excel documentation templates runtime 020","scenario_hash":"601e4c5ee89d2313fe9270e563f02369e41e68ea6c92e654c0fd704d7eac4845","mutation_count":35,"result":{"Total":35,"Killed":35,"Survived":0,"Errors":0},"tested_at":"2026-08-24T05:55:34.950197816Z"},{"index":5,"name":"Data layer Excel documentation templates runtime 006","scenario_hash":"0a3fc75970bb55b405ffd1291c74615e9480a65ca9ff8a8419bc671d8831906c","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-08-21T14:26:16.768772951Z"},{"index":12,"name":"Data layer Excel documentation templates runtime 013","scenario_hash":"5327a208ae250eeb89ecf2216138e693aed3ed7578e5d84b9c700f72ee2ed51f","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-08-21T14:26:16.768772951Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer Excel documentation templates runtime

  Background:
    Given the built extension is running with the production Documentation workspace, template parser, OOXML renderer, project asset store, and download adapter
    And production Shop has configured sections of every documentation kind

  # Data layer Excel documentation templates runtime 001
  Scenario: Data layer Excel documentation templates runtime 001
    When actual controls download each guided starter
    Then independent OOXML parsing finds one Template worksheet and one visible Template Guide worksheet in every starter
    And it finds Excel tables TemplateSettings and TemplateAreas with Contract 3, the declared kind, and the exact Area, Type, Source, Direction, and Properties columns
    And it finds the kind-specific binding glossary, repeat examples, and named areas without a functional Note or Comment
    And production validation accepts every starter for its declared kind
    And rendering each starter produces the established Built-in section shape

  # Data layer Excel documentation templates runtime 002
  Scenario: Data layer Excel documentation templates runtime 002
    Given an actual Flow workbook contains scalar bindings and named multi-cell PageCard repeating flow.pages Across
    When the operator selects that file through the installed candidate control
    Then production parsing reports its Flow kind, contract, bindings, named area, collection, item prefix, direction, range, parent, and valid state
    And repository inspection finds no saved template metadata or body
    When actual controls generate populated Checkout journey output
    Then independent workbook parsing finds Cart, Shipping, Payment, and Confirmation PageCard copies in configured order
    And each copy contains production Page-context, contained Event, and property values from the immutable snapshot

  # Data layer Excel documentation templates runtime 003
  Scenario: Data layer Excel documentation templates runtime 003
    Given an actual Matrix workbook nests CellPattern Across inside RowPattern Down
    And an actual Profile workbook nests configured rows inside concepts
    When production renderers generate both workbooks
    Then independent parsing finds exact matrix dimensions, aligned presence values, Profile concept order, selected columns, and stable path order
    And parser traces prove nested bindings resolve only the data described as available within their containing named areas
    And no direct state injection supplies expected workbook cells

  # Data layer Excel documentation templates runtime 004
  Scenario: Data layer Excel documentation templates runtime 004
    Given an actual Template contains every supported style, merge, page, header, footer, and named raster-image area
    When production rendering expands the Template and downloads the workbook
    Then strict OOXML validation accepts every part, relationship, merge, style, image, and content type
    And an independent Excel-compatible reader opens it without repair or removed content
    And parsed copies preserve the Template presentation without an external relationship

  # Data layer Excel documentation templates runtime 005
  Scenario: Data layer Excel documentation templates runtime 005
    Given the actual Template binds the saved theme logo and production content includes formula-like prefixes and template delimiters
    When production rendering generates all selected sections
    Then independent parsing finds valid embedded logo bytes and aspect-ratio bounds on every requested worksheet
    And every project value is an inline literal with no formula element or new package relationship
    And generated files contain neither Template Guide nor unresolved placeholder

  # Data layer Excel documentation templates runtime 006
  Scenario Outline: Data layer Excel documentation templates runtime 006
    Given the operator selects an actual workbook containing <invalid_boundary>
    When production validation runs through the installed candidate control
    Then the visible primary finding identifies <finding_location>
    And it gives a specific allowed repair without edit-history speculation
    And technical details are initially collapsed
    And repository inspection finds no saved template metadata or body

    Examples:
      | invalid_boundary                          | finding_location                         |
      | an unknown binding                       | its Template worksheet and cell          |
      | a binding outside its required repeat    | its Template worksheet, cell, and required repeat |
      | a missing or crossing named repeat area  | every affected named area                |
      | a formula and external workbook link     | the formula cell and relationship part   |
      | an unsafe package entry and size overflow | the package and violated limit           |
      | encrypted or malformed OOXML             | the selected workbook                    |
      | an unrecognized or active binary part    | its binary package part                  |

  # Data layer Excel documentation templates runtime 007
  Scenario: Data layer Excel documentation templates runtime 007
    Given actual expansion would exceed the worksheet row or column boundary
    When the operator requests populated preview and assigned output
    Then both production paths block before the download adapter is called
    And visible feedback identifies the named area, requested size, and limit
    And repository bytes, assignment, template body, and prior preview remain unchanged

  # Data layer Excel documentation templates runtime 008
  Scenario: Data layer Excel documentation templates runtime 008
    Given a valid unassigned actual Flow workbook is selected
    When actual controls inspect its areas and download Populated preview — output only
    Then the production renderer consumes the current immutable snapshot and candidate bytes
    And the download adapter receives one valid output-only workbook
    And repository tracing records no template save, assignment, project revision, or publication write
    When the operator activates Save template
    Then production persistence records one template body and one Draft project command

  # Data layer Excel documentation templates runtime 009
  Scenario: Data layer Excel documentation templates runtime 009
    Given an actual guided starter contains a valid PageCard named repeat area
    When an Excel-compatible editor cuts the complete PageCard area and pastes it one column right and one row down
    And production validation inspects the changed workbook
    Then independent OOXML parsing finds the original collection, direction, nesting, and dimensions at the moved range
    And production validation accepts the workbook without an endpoint repair
    And generated copies are positioned from the moved range

  # Data layer Excel documentation templates runtime 010
  Scenario: Data layer Excel documentation templates runtime 010
    When actual controls open the Flow Excel template guide
    Then installed content exposes searchable value and repeatable-data entries with descriptions, examples, availability, and exact cell forms
    And the Down, Across, and nested examples use the same area and collection terms as the downloaded Template Guide
    And accessibility inspection finds labelled guide, candidate, finding, technical-detail, preview, and save controls

  # Data layer Excel documentation templates runtime 011
  Scenario: Data layer Excel documentation templates runtime 011
    Given an actual workbook contains tw instructions only in worksheet Notes or Comments
    When production validation runs through the installed candidate control
    Then parser tracing proves Notes and Comments supplied no template instruction
    And visible feedback offers the current guided starter instead of migration
    And no renderer, repository write, assignment, or download is invoked

  # Data layer Excel documentation templates runtime 012
  Scenario: Data layer Excel documentation templates runtime 012
    Given an actual guided starter contains documented Microsoft Purview sensitivity-label Custom File Properties without encryption
    When production validation and the installed candidate controls inspect and save it
    Then independent OOXML inspection proves the label properties are present and the workbook remains an unencrypted valid package
    And production validation accepts the guided contract without interpreting label properties as template behavior
    And repository inspection finds the exact candidate bytes with matching digest and byte length
    When the same guided workbook is protected by a sensitivity label that applies encryption
    Then production validation rejects it as encrypted before any candidate, template metadata, body, assignment, or project revision is saved

  # Data layer Excel documentation templates runtime 013
  Scenario Outline: Data layer Excel documentation templates runtime 013
    Given an actual guided Flow workbook saved by Excel contains standard printer settings for <worksheet>
    And independent OOXML inspection finds <printer_settings_part> with its standard content type and one internal relationship from <worksheet>
    When the operator selects it and requests Populated preview — output only through installed controls
    Then production validation accepts the guided workbook without interpreting the printer settings as macro or template behavior
    And the output preserves supported Template page setup, headers, and footers without consuming printer-specific instructions
    And repository tracing records no template save, assignment, project revision, or publication write
    When the operator activates Save template
    Then repository inspection finds the exact candidate bytes with matching digest and byte length

    Examples:
      | worksheet      | printer_settings_part                                |
      | Template       | xl/printerSettings/printerSettings1.bin              |
      | Template Guide | xl/printerSettings/printerSettings2.bin              |

  # Data layer Excel documentation templates runtime 014
  Scenario: Data layer Excel documentation templates runtime 014
    Given an actual Flow workbook nests page.concepts, concept.rows, and row.cells inside flow.pages
    And its Example cells distinguish Cart from Confirmation while both schemas share the same allowed values
    When production rendering generates populated output
    Then independent workbook parsing finds Ecommerce and Funnel headings once per Page with only their configured ordered rows
    And parsed Example cells contain each Page instance's documented example without a repeated allowed-values list
    And parser traces prove every nested collection and cell resolved within its own Page scope

  # Data layer Excel documentation templates runtime 015
  Scenario: Data layer Excel documentation templates runtime 015
    Given an actual Flow workbook places contextual image area PageVisual and visual metadata cells inside PageCard
    And production Checkout contains an actual durably saved WebP Page-instance visual and one Page without a visual
    When installed preview and assigned Excel export render the workbook
    Then independent OOXML parsing finds a compatible PNG conversion of the WebP only in its owning PageCard
    And durable repository inspection finds the exact original WebP body and attachment unchanged
    And parsed image anchors preserve aspect ratio within PageVisual with no external image relationship
    And parsed cells contain the matching literal description, caption, and source reference
    And the Page without a visual has an empty image area and metadata cells without layout loss
    And repository inspection finds Flow visuals, graph, schemas, Documentation configuration, Draft revision, and publication bytes unchanged

  # Data layer Excel documentation templates runtime 016
  Scenario: Data layer Excel documentation templates runtime 016
    Given an actual valid Contract 2 workbook has the exact four-column TemplateAreas table
    When production validation, preview, save, assignment, and rendering consume it
    Then production paths accept it without rewriting or migrating the candidate
    And repository inspection finds the exact selected workbook bytes after Save template
    And independent OOXML parsing finds the established scale-down, top-left, and zero-padding image anchors
    When actual controls open the Flow Excel template guide
    Then installed searchable guidance distinguishes Contract 2 compatibility from Contract 3 Properties
    And candidate inspection exposes each Contract 3 area's declarations and each Contract 2 area's implicit defaults

  # Data layer Excel documentation templates runtime 017
  Scenario: Data layer Excel documentation templates runtime 017
    Given an actual Contract 3 workbook has a 100 by 60 pixel generated-image area and a 40 by 20 pixel saved image
    And the Image row's one Properties cell contains fit: scale-down; position: center; padding: 8px
    When installed preview and assigned Excel export render the workbook
    Then independent OOXML parsing finds a 40 by 20 pixel image anchor within one renderer pixel
    And its top-left is 30 pixels right and 20 pixels down from the named area's top-left within one renderer pixel
    And strict package inspection finds the original aspect ratio, no crop, and no external image relationship

  # Data layer Excel documentation templates runtime 018
  Scenario: Data layer Excel documentation templates runtime 018
    Given an actual Contract 3 Flow workbook defines PageStep A1:B1 repeating flow.pages Across
    And its Properties cell names PageSeparator B1:B1 containing literal >>
    And A1 binds page.pageName while C1 contains Later content
    When production rendering consumes Cart, Shipping, and Payment in configured order
    Then independent workbook parsing finds Cart, >>, Shipping, >>, and Payment in A1:E1
    And it finds no trailing separator or empty separator column and finds Later content in F1
    And renderer tracing records three item emissions and two separator emissions
    And repository inspection finds no documentation, Flow, schema, Draft, or publication write

  # Data layer Excel documentation templates runtime 019
  Scenario Outline: Data layer Excel documentation templates runtime 019
    Given an actual Contract 3 candidate contains <invalid_properties>
    When production validation runs through the installed candidate control
    Then the visible primary finding identifies TemplateAreas <area> Properties and <reason>
    And it gives one supported repair while technical details remain collapsed
    And no renderer, repository write, assignment, or download is invoked

    Examples:
      | area      | invalid_properties                                  | reason                                      |
      | ThemeLogo | unsupported fit: cover                             | names scale-down and contain as valid fits  |
      | ThemeLogo | duplicate padding declarations                     | identifies the duplicate property           |
      | PageStep  | separator-area referring to a missing named range  | identifies PageSeparator as missing          |
      | PageStep  | an Across separator outside the complete right edge | identifies the required trailing geometry    |

  # Data layer Excel documentation templates runtime 020
  Scenario Outline: Data layer Excel documentation templates runtime 020
    Given production Checkout has effective <property_type> property <property> with one documented <typed_example>
    And an actual valid Flow workbook binds one cell exactly to {{row.example}} inside page.rows
    When installed controls generate unsaved populated preview and assigned Excel output
    Then independent workbook parsing finds exact inline text <rendered_example> for that property in both outputs
    And a JSON parser reconstructs the production effective example with parsed type <parsed_type> and no string coercion
    And compiler tracing finds the same text in row.example and its matching Documented example row.cells entry
    And a second parsed cell preserves that literal when {{row.example}} is combined with ordinary text and another binding
    And a production null example renders null while an absent example renders an empty cell
    And installed Flow template guidance identifies quoted strings, recursive arrays and objects, and unquoted numbers, booleans, and null
    And repository inspection finds no schema, Documentation configuration, template body, assignment, Draft, or publication write

    Examples:
      | property        | property_type    | typed_example                                      | rendered_example                         | parsed_type |
      | /text_code      | string           | typed string 12                                    | "12"                                     | string      |
      | /quantity       | number           | typed number 12                                    | 12                                       | number      |
      | /enabled        | boolean          | typed boolean false                                | false                                    | boolean     |
      | /optional_value | nullable         | typed null                                         | null                                     | null        |
      | /labels         | array of strings | typed array ["item1", "item2", "item3"]            | ["item1", "item2", "item3"]             | array       |
      | /quantities     | array of numbers | typed array [1, 2, 3]                              | [1, 2, 3]                                | array       |
      | /item           | object           | typed object {"id": 12, "label": "12"}              | {"id": 12, "label": "12"}               | object      |

  # Data layer Excel documentation templates runtime 021
  Scenario: Data layer Excel documentation templates runtime 021
    Given an actual Contract 3 Flow workbook defines FlowColumnHeader C2:D6 repeating flow.pages Across
    And PageSeparator D2:D6 is its separator-area and D4 contains literal >>
    And PropertyRow B6 repeats flow.rows Down, PropertyValue C6 repeats page.rows Down, and PageVisual is C3
    And multiple production Pages have differing row counts that expand PropertyValue below row 6
    And a tight finite OutputCanvas contains the prototype and declared margins with background-fill: #FFFFFF
    And no arbitrary A1:Z100 fill is present in the Template
    When installed controls generate unsaved populated preview and assigned Excel output
    Then independent XLSX parsing finds the aligned white separator presentation beside every generated Page property row including rows corresponding to D7:D9
    And it finds one >> between adjacent Pages with no final separator-width insertion or trailing >>
    And a generated Down fixture proves the symmetric expanded-width separator presentation
    And every otherwise unfilled cell in the exact final OutputCanvas and its margins has solid white fill
    And explicit authored fills remain unchanged and cells immediately outside OutputCanvas have no generated background fill
    And the number of background target cells equals the finite projected rectangle and does not exceed 250000
    And OOXML inspection finds one deduplicated background fill definition and no per-cell style-record growth
    And production tracing proves binding resolution, image anchors, snapshot values, repository state, and publication bytes are unchanged
