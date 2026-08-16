Feature: Data layer Excel documentation templates runtime

  Background:
    Given the built extension is running with the production Documentation workspace, template parser, OOXML renderer, project asset store, and download adapter
    And production Shop has configured sections of every documentation kind

  # Data layer Excel documentation templates runtime 001
  Scenario: Data layer Excel documentation templates runtime 001
    When actual controls download each Built-in starter
    Then independent OOXML parsing finds one worksheet and one matching contract-version-1 template Note in every workbook
    And production validation accepts every starter for its declared kind
    And rendering each starter produces the established Built-in section shape

  # Data layer Excel documentation templates runtime 002
  Scenario: Data layer Excel documentation templates runtime 002
    Given an actual Flow workbook contains scalar bindings and a rightward multi-cell flow.pages directive
    When the operator selects that file through the installed upload control
    Then production parsing reports its Flow kind, contract version, bindings, directive cell, rectangle, direction, and valid state
    When actual controls generate Checkout journey
    Then independent workbook parsing finds Cart, Shipping, Payment, and Confirmation pattern copies in configured order
    And each pattern contains production Page-context, contained Event, and property values from the immutable snapshot

  # Data layer Excel documentation templates runtime 003
  Scenario: Data layer Excel documentation templates runtime 003
    Given an actual Matrix workbook nests rightward row cells inside downward matrix rows
    And an actual Profile workbook nests configured rows inside concepts
    When production renderers generate both workbooks
    Then independent parsing finds exact matrix dimensions, aligned presence values, Profile concept order, selected columns, and stable path order
    And parser traces prove nested scopes resolve only their declared collection items
    And no direct state injection supplies expected workbook cells

  # Data layer Excel documentation templates runtime 004
  Scenario: Data layer Excel documentation templates runtime 004
    Given an actual prototype contains every supported style, merge, page, header, footer, and raster-image boundary
    When production rendering expands the prototype and downloads the workbook
    Then strict OOXML validation accepts every part, relationship, merge, style, image, and content type
    And an independent Excel-compatible reader opens it without repair or removed content
    And parsed copies preserve the prototype presentation without an external relationship

  # Data layer Excel documentation templates runtime 005
  Scenario: Data layer Excel documentation templates runtime 005
    Given the actual prototype binds the saved theme logo and production content includes formula-like prefixes and template delimiters
    When production rendering generates all selected sections
    Then independent parsing finds valid embedded logo bytes and aspect-ratio bounds on every requested worksheet
    And every project value is an inline literal with no formula element or new package relationship
    And generated files contain no tw directive Note or unresolved placeholder

  # Data layer Excel documentation templates runtime 006
  Scenario Outline: Data layer Excel documentation templates runtime 006
    Given the operator selects an actual workbook containing <invalid_boundary>
    When production validation runs through the installed upload control
    Then the visible finding identifies <finding_location>
    And durable inspection finds no saved template metadata or body

    Examples:
      | invalid_boundary                         | finding_location                        |
      | an unknown scoped binding                | its worksheet and cell                  |
      | crossing repeat rectangles               | both directive cells                    |
      | a formula and external workbook link     | the formula cell and relationship part  |
      | an unsafe package entry and size overflow | the package and violated limit          |
      | encrypted or malformed OOXML             | the selected workbook                   |

  # Data layer Excel documentation templates runtime 007
  Scenario: Data layer Excel documentation templates runtime 007
    Given actual expansion would exceed the worksheet row or column boundary
    When the operator requests sample-filled and assigned output
    Then both production paths block before the download adapter is called
    And visible feedback identifies the directive, requested size, and limit
    And repository bytes, assignment, template body, and prior preview remain unchanged

  # Data layer Excel documentation templates runtime 008
  Scenario: Data layer Excel documentation templates runtime 008
    Given a valid unassigned actual Flow workbook is selected
    When actual controls request a sample-filled Checkout journey workbook
    Then the production renderer consumes the current immutable snapshot and candidate bytes
    And the download adapter receives one valid sample workbook
    And repository tracing records no template save, assignment, project revision, or publication write
