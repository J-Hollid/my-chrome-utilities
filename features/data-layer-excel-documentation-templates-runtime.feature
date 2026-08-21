Feature: Data layer Excel documentation templates runtime

  Background:
    Given the built extension is running with the production Documentation workspace, template parser, OOXML renderer, project asset store, and download adapter
    And production Shop has configured sections of every documentation kind

  # Data layer Excel documentation templates runtime 001
  Scenario: Data layer Excel documentation templates runtime 001
    When actual controls download each guided starter
    Then independent OOXML parsing finds one Template worksheet and one visible Template Guide worksheet in every starter
    And it finds Excel tables TemplateSettings and TemplateAreas with Contract 2 and the declared kind
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
