Feature: Data layer project documentation workspace runtime

  Background:
    Given the built extension is running with the production project repository, canonical compiler, documentation renderer, clipboard, and Excel adapter
    And production Shop contains Checkout journey, Article journey, their schema contexts, Sitewide, and Opened Article

  # Data layer project documentation workspace runtime 001
  Scenario: Data layer project documentation workspace runtime 001
    When actual navigation opens the installed project-level Documentation tab
    Then the main workspace renders Documentation Sets, Content, Configure, Theme, Preview, and Export
    And DOM inspection finds no Flow-owned documentation configuration workspace
    And production Flow, schema, assignment, and publication bytes remain unchanged

  # Data layer project documentation workspace runtime 002
  Scenario: Data layer project documentation workspace runtime 002
    Given actual controls create Client specification with client theme Acme
    And select Checkout journey, Article journey, project capture matrix, Sitewide, and Opened Article
    When actual controls save the Documentation Set
    Then repository bytes contain one Draft-owned stable selection, order, per-section configuration, and project-local theme reference
    And published revision is unchanged
    When the installed extension reloads and performs portability export and import
    Then rendered Client specification and Acme reproduce the same stable configuration

  # Data layer project documentation workspace runtime 003
  Scenario: Data layer project documentation workspace runtime 003
    When actual controls configure Client specification content
    Then installed searchable selectors independently render Flows, capture-matrix schema contexts, and Site Profiles
    And one reorderable outline renders selected human names and section types
    And selecting each outline entry mounts only its relevant configuration controls
    And DOM inspection finds no eagerly mounted configuration form for every section

  # Data layer project documentation workspace runtime 004
  Scenario: Data layer project documentation workspace runtime 004
    Given production Checkout journey contains Cart, Shipping, Payment, and Confirmation instances with occurrences
    When actual controls select its Flow section
    Then installed controls configure only value-map contexts, property rows, metadata columns, documentation labels, and order
    And production preview cells derive from Page-instance and Event-occurrence effective compiler targets
    And DOM inspection finds no capture-matrix selector or preview in that Flow section

  # Data layer project documentation workspace runtime 005
  Scenario: Data layer project documentation workspace runtime 005
    When actual controls open the production capture-matrix selector
    Then a searchable hierarchy renders Pages, Events, Flow Page instances, and Event occurrences beneath human Flow and Page names
    And no Site Profile is a matrix choice
    And contexts remain selectable from a Flow without a value-map section
    When actual controls select Cart, Purchase, Checkout journey Cart instance, and Article journey Article Opened occurrence
    Then serialized matrix configuration stores four stable schema-context references
    And four human column headings distinguish definitions and instances without raw identities

  # Data layer project documentation workspace runtime 006
  Scenario: Data layer project documentation workspace runtime 006
    Given production matrix contexts have overlapping and distinct effective properties
    When actual controls render the matrix sample
    Then parsed rows equal the union of effective property paths
    And parsed columns equal the configured selected-context order
    And cells use only Mandatory, Optional, Conditional, Not expected, Not defined, or Blocked
    And the installed legend defines every state
    And compiler-target evidence preserves Page, Event, instance, and occurrence scope

  # Data layer project documentation workspace runtime 007
  Scenario: Data layer project documentation workspace runtime 007
    When actual controls select Sitewide and Opened Article
    Then each installed Profile section has independent property ordering
    And headings are Property, Description, Required, Allowed values, Example, and Comments
    And rendered rows equal each Profile's effective documented schema
    And serialized matrix configuration contains no Site Profile reference

  # Data layer project documentation workspace runtime 008
  Scenario: Data layer project documentation workspace runtime 008
    Given production Client specification includes Overview, two Flows, one matrix, and two Profiles
    When actual controls download the complete Excel workbook
    Then workbook parsing finds Overview, Checkout journey, Article journey, Data capture matrix, Sitewide, and Opened Article in configured order
    And each Flow sheet contains only its configured value map
    And exactly one matrix sheet contains all project-wide selected schema-context columns
    And each selected Profile has exactly one property-table sheet
    And parsed sheets and columns contain no diagnostics, provenance, source identity, revision hash, or repair content

  # Data layer project documentation workspace runtime 009
  Scenario: Data layer project documentation workspace runtime 009
    When actual export controls request current, selected, and complete scopes
    Then downloaded workbooks contain exactly their requested sheets
    And rich clipboard HTML contains exactly the requested tables in configured order
    And the clipboard also receives a semantically equivalent plain-text fallback
    And the installed Export region contains no plain spreadsheet, HTML-file, or PDF action

  # Data layer project documentation workspace runtime 010
  Scenario: Data layer project documentation workspace runtime 010
    Given production Acme configures client name, logo, colors, typography, density, borders, striping, highlighted headings, widths, header, and footer
    When actual controls render the Acme sample and apply that theme
    Then installed Flow, matrix, Profile, and Overview previews share the supported visual fingerprint
    And parsed Excel styles and rich clipboard styles match that fingerprint
    And controls are grouped into Brand, Typography, Table, and Header and footer with advanced groups initially collapsed
    And serialized theme data contains no executable CSS or workbook code

  # Data layer project documentation workspace runtime 011
  Scenario: Data layer project documentation workspace runtime 011
    Given actual controls copy Acme's structured values
    When they paste those values into another project's new local theme
    Then the installed preview reproduces supported branding without a global theme lookup
    And repository inspection finds independent theme identities and project ownership

  # Data layer project documentation workspace runtime 012
  Scenario: Data layer project documentation workspace runtime 012
    Given production selected content is stale, incomplete, or blocked
    When actual controls open export preflight
    Then compact installed diagnostics identify affected sections and operable repair links
    And export controls require explicit confirmation
    When actual controls confirm incomplete export
    Then parsed Excel and rich output headings contain Draft — incomplete
    And output inspection finds no diagnostic detail, provenance, internal identity, revision hash, or repair action

  # Data layer project documentation workspace runtime 013
  Scenario: Data layer project documentation workspace runtime 013
    Given the production preview records selected Flow, context, Profile, and theme revisions
    When a selected source or configuration changes
    Then the installed preview becomes stale and export actions are disabled
    When actual controls rebuild the stale snapshot
    Then one immutable snapshot hash supplies every requested Excel sheet and rich table
    And repository and published-revision bytes remain unchanged after generation and copy

  # Data layer project documentation workspace runtime 014
  Scenario: Data layer project documentation workspace runtime 014
    Given production documentation contains tabs, line breaks, markup, formula-like prefixes, long values, and colliding invalid sheet names
    When actual Excel and rich adapters generate output
    Then parsed cells remain literal and create no formulas, unintended rows, columns, or markup
    And generated human sheet names are deterministic, unique, and valid without raw identities
    And parsed wrapping, widths, headings, and styles match the configured readable theme

  # Data layer project documentation workspace runtime 015
  Scenario Outline: Data layer project documentation workspace runtime 015
    Given the production Client specification has a fresh preview for <export_scope>
    When actual controls download the <export_scope> Excel workbook
    Then the download adapter receives an .xlsx file with the OOXML workbook media type
    And independent package validation finds a complete OOXML workbook whose declared parts and relationships resolve
    And an independent Excel-compatible reader opens it without a file-format error or repair
    And parsed sheet names in order are <expected_sheets>

    Examples:
      | export_scope                              | expected_sheets                                                                                         |
      | current Checkout journey section          | Checkout journey                                                                                        |
      | selected Checkout journey and Sitewide sections | Checkout journey, Sitewide                                                                         |
      | complete Documentation Set                | Overview, Checkout journey, Article journey, Data capture matrix, Sitewide, Opened Article              |

  # Data layer project documentation workspace runtime 016
  Scenario: Data layer project documentation workspace runtime 016
    Given production Client specification includes literal Sitewide, Opened Article, Flows, and the matrix
    When actual controls configure concept documentation
    Then the installed Set controls render one ordered project-wide concept checklist plus Ungrouped
    And every checklist row has an independent Include control
    And a separate Include concept subheadings control is rendered
    And those controls target every selected Site Profile property-table section and the Data capture matrix
    And DOM inspection finds no concept configuration in Flow sections

  # Data layer project documentation workspace runtime 017
  Scenario Outline: Data layer project documentation workspace runtime 017
    Given production concept configuration includes ecommerce, page, and Ungrouped but excludes technical
    And Include concept subheadings is <headings>
    When actual preview, Excel, and rich-copy adapters render Sitewide, Opened Article, and the matrix
    Then parsed output contains no technical property row
    And parsed output retains ecommerce, page, and Ungrouped rows
    And parsed concept headings are <heading_result>
    And row identities follow configured concept order and path order within each concept
    And Excel, rich HTML, and plain-text fallback have equivalent row sets and order

    Examples:
      | headings | heading_result                                |
      | on       | one heading for each non-empty included group |
      | off      | no headings                                   |

  # Data layer project documentation workspace runtime 018
  Scenario: Data layer project documentation workspace runtime 018
    Given durable concept order is page, ecommerce, and Ungrouped
    And production Sitewide, Opened Article, and matrix rows occupy all three groups
    When actual controls request grouped concept output
    Then installed previews parse as PAGE, ECOMMERCE, and UNGROUPED sections in order
    And each parsed table contains one standard column-header record before its first concept
    And every concept record is followed directly by path-ordered property rows
    And no zero-row section exists
    And workbook parsing finds one merged styled concept row spanning each table width
    And clipboard parsing finds semantic concept headings and an equivalent plain-text fallback

  # Data layer project documentation workspace runtime 019
  Scenario: Data layer project documentation workspace runtime 019
    Given durable concept configuration orders ecommerce, page, and Ungrouped
    When production canonical properties add Acquisition and ACQUISITION with whitespace variations
    Then installed controls append one Acquisition entry after every durable entry
    And existing durable inclusion and order values remain unchanged
    When actual controls move Acquisition before ecommerce, exclude it, and save
    Then repository bytes store normalized identity, display spelling, order, and inclusion
    And reload, Undo, portability import, preview, workbook, and clipboard adapters retain that configuration
    And source or configuration revision changes invalidate the snapshot until actual refresh
    And a saved zero-row concept emits no output heading while its configuration bytes remain

  # Data layer project documentation workspace runtime 020
  Scenario: Data layer project documentation workspace runtime 020
    Given production technical concept is excluded and subheadings are enabled
    When actual controls generate the complete Documentation Set
    Then parsed Sitewide, Opened Article, and matrix output omit technical rows and contain included concept groups
    And Flow content hashes equal their hashes with no concept configuration
    And current, selected, and complete output manifests apply concept configuration whenever they contain a selected Site Profile or the matrix

  # Data layer project documentation workspace runtime 021
  Scenario: Data layer project documentation workspace runtime 021
    Given production concept subheadings are off and the immutable preview contains no concept-heading records
    And included non-empty concept groups are page, ecommerce, and Ungrouped
    When the installed Include concept subheadings checkbox is selected
    Then durable Documentation Set bytes store includeConceptSubheadings true
    And the prior snapshot is marked stale
    And installed rich-copy and Excel actions are disabled
    When the installed Refresh preview action is activated
    Then every parsed selected-Profile and matrix preview table contains PAGE, ECOMMERCE, and UNGROUPED rowgroup headings once in configured order
    And current, selected, and complete clipboard and workbook manifests contain the same headings whenever their scope contains an affected table
    And parsed plain text contains the same heading and property-row order
    When the installed checkbox is cleared and preview is refreshed
    Then heading records are absent from DOM, clipboard, plain text, and workbook XML
    And row-identity and ordering hashes equal their heading-on values

  # Data layer project documentation workspace runtime 022
  Scenario: Data layer project documentation workspace runtime 022
    Given durable concept order is ecommerce, page, and Ungrouped
    When actual controls activate Move concept earlier twice for Ungrouped
    Then installed checklist order and durable bytes are Ungrouped, ecommerce, and page
    And Ungrouped reorder-button disabled states depend only on its current first or last position
    And command and Undo counts increase once per move
    When actual controls refresh grouped output
    Then parsed Sitewide, Opened Article, matrix, clipboard, plain-text, and workbook group order is UNGROUPED, ECOMMERCE, and PAGE
    And reload, Undo, Redo, and portability restore the corresponding exact durable orders
    When production canonical properties add new concept Acquisition
    Then reconciliation appends Acquisition after page without changing Ungrouped position
    And durable inclusion hashes for existing entries remain unchanged

  # Data layer project documentation workspace runtime 023
  Scenario: Data layer project documentation workspace runtime 023
    Given production Opened Article is not named Sitewide and is absent from the durable Documentation Set
    And its effective properties occupy page, technical, and Ungrouped
    And the installed preview predates its Profile section
    When actual controls add the Opened Article Site Profile property-table section
    And exclude technical, move Ungrouped before page, and enable concept subheadings
    Then the installed preview is stale until actual refresh
    When the installed Refresh preview action is activated
    Then parsed Opened Article preview contains UNGROUPED and PAGE rowgroup headings in configured order
    And its parsed property rows omit technical
    And current, selected, and complete clipboard HTML, plain text, and workbook XML preserve that heading order and row set whenever Opened Article is in scope
    And Flow output hashes remain unchanged

  # Data layer project documentation workspace runtime 024
  Scenario: Data layer project documentation workspace runtime 024
    Given production concept subheadings are enabled for a table containing multiple non-empty concepts
    When the installed Refresh preview action is activated
    Then DOM parsing finds the section title before one table header and every concept rowgroup
    And computed concept-divider theme color, font size, and emphasis are subordinate to the section title
    And DOM parsing finds no concept-column repetition records
    And clipboard HTML and workbook XML each contain one standard column-heading row per table
    And their concept dividers retain the same subordinate theme treatment
    And parsed plain text contains one column-heading line and one label per non-empty concept

  # Data layer project documentation workspace runtime 025
  Scenario Outline: Data layer project documentation workspace runtime 025
    Given production Acme has no logo
    When the installed Choose logo control receives a readable <image_type> file whose converted data URL is within the supported limit
    Then the installed Brand controls render its human file name
    And DOM inspection finds the complete image contained without aspect-ratio distortion in the Brand sample
    And DOM text and editable controls contain no raw data URL
    When actual controls save Acme
    Then repository bytes contain a <media_type> Base64 data URL
    And refreshed preview HTML, clipboard HTML, and workbook media contain the same image bytes

    Examples:
      | image_type | media_type |
      | PNG        | image/png  |
      | JPEG       | image/jpeg |
      | GIF        | image/gif  |

  # Data layer project documentation workspace runtime 026
  Scenario Outline: Data layer project documentation workspace runtime 026
    Given production Acme has a saved valid logo
    When the installed Choose logo control receives <invalid_logo>
    Then the associated validation region renders <diagnostic>
    And the Brand sample and repository bytes retain the saved logo
    And activating Save theme cannot persist the rejected bytes

    Examples:
      | invalid_logo                                                | diagnostic                      |
      | an SVG file                                                 | Choose a PNG, JPEG, or GIF image |
      | a file that produces an image-read failure                  | The logo could not be read       |
      | an image whose converted data URL exceeds 250000 characters | The logo is too large            |

  # Data layer project documentation workspace runtime 027
  Scenario: Data layer project documentation workspace runtime 027
    Given production Acme has a saved valid logo
    When the installed Remove logo control is activated
    Then the Brand sample contains no logo image
    And the Choose logo control remains operable
    When actual controls save Acme
    And refresh the documentation preview
    Then repository bytes contain no Acme logo
    And parsed preview HTML, clipboard HTML, and workbook media contain no theme logo

  # Data layer project documentation workspace runtime 028
  Scenario Outline: Data layer project documentation workspace runtime 028
    Given production Acme has a saved valid 3000 by 2000 pixel <image_type> logo
    When actual controls refresh the complete Documentation Set and generate rich copy and Excel
    Then computed Brand-sample, preview-section, and clipboard-image dimensions are 96 by 64 CSS pixels
    And every installed or copied logo fits within 180 by 64 CSS pixels without exceeding its decoded intrinsic dimensions
    And parsed drawing extents on every workbook sheet are 1 by two-thirds inches within a 1.875 by two-thirds inch logo area
    And computed, parsed HTML, and drawing dimensions retain the three-to-two aspect ratio
    And DOM and worksheet geometry place the logo area before the section title and table without overlap
    And independent package validation resolves every drawing, relationship, content type, and real image part
    And an independent Excel-compatible reader opens the workbook without repair or removed drawing or image content

    Examples:
      | image_type |
      | PNG        |
      | JPEG       |
      | GIF        |

  # Data layer project documentation workspace runtime 029
  Scenario Outline: Data layer project documentation workspace runtime 029
    Given production Acme has a saved valid logo
    When the installed Choose logo control receives a file declared as <declared_type> whose bytes do not decode as <declared_type>
    Then the associated validation region renders <diagnostic>
    And the Brand sample and repository bytes retain the saved logo
    And activating Save theme cannot persist the rejected bytes

    Examples:
      | declared_type | diagnostic                |
      | PNG           | Choose a valid PNG image   |
      | JPEG          | Choose a valid JPEG image  |
      | GIF           | Choose a valid GIF image   |
