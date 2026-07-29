# mutation-stamp: sha256=73d856e0b6f3198f9396c0651338f59c9030ecca6d152350191dea4b1a355917
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-29T10:26:58.197538958Z","feature_name":"Data layer project documentation workspace","feature_path":"features/data-layer-project-documentation-workspace.feature","background_hash":"6e9a3622de99090815714fa5d2fbae827c8feda287a062680b2f0de443e8da1f","implementation_hash":"sha256:0a3578f4d6e5792fd6e2585b2df27b332745538c05c362e047a22aa85096e6d3","scenarios":[{"index":16,"name":"Data layer project documentation workspace 017","scenario_hash":"e5dc5bbfb335ef940349ada74a7fb648286494f0bfdfffafaf1f57d4592c49a3","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-29T07:36:13.656972912Z"},{"index":14,"name":"Data layer project documentation workspace 015","scenario_hash":"4a89e82941719a62bee409628fb4f7d19c8c0bfb1e83a2ddec2cbe93f631eb0d","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-26T15:21:48.347536960Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer project documentation workspace

  Background:
    Given Shop contains Checkout journey and Article journey Flows
    And their Pages, Events, Flow Page instances, and Event occurrences have canonical effective schemas
    And Shop includes shared and article-specific profile contributors

  # Data layer project documentation workspace 001
  Scenario: Data layer project documentation workspace 001
    When the operator opens the project-level Documentation tab
    Then the main workspace offers Documentation Sets, Content, Configure, Theme, Preview, and Export
    And no Flow page contains its own documentation configuration workspace
    And opening Documentation changes no Flow, schema, assignment, or publication data

  # Data layer project documentation workspace 002
  Scenario: Data layer project documentation workspace 002
    Given the operator creates Client specification with client theme Acme
    And selects Checkout journey, Article journey, the project capture matrix, Sitewide, and Opened Article
    When the operator saves the Documentation Set
    Then one project Draft record stores its stable section selections, order, per-section configuration, and project-local theme reference
    And generation creates no project revision
    When the project reloads and completes portability export and import
    Then Client specification and Acme return with the same stable selections, order, and configuration

  # Data layer project documentation workspace 003
  Scenario: Data layer project documentation workspace 003
    When the operator configures Client specification content
    Then searchable selectors independently offer Flows, capture-matrix schema contexts, and Site Profiles
    And selected content appears in one reorderable outline with human names and section types
    And selecting an outline entry shows only controls relevant to that Flow, matrix, Profile, Overview, or Theme
    And unselected configuration groups are collapsed rather than rendered as one long form

  # Data layer project documentation workspace 004
  Scenario: Data layer project documentation workspace 004
    Given Checkout journey contains Cart, Shipping, Payment, and Confirmation Page instances with contained Event occurrences
    When the operator selects Checkout journey
    Then its section configures only its Flow value map contexts, property rows, metadata columns, documentation labels, and ordering
    And its preview derives Page-instance and Event-occurrence values from their effective schemas
    And no capture-matrix selection or preview appears inside the Flow section

  # Data layer project documentation workspace 005
  Scenario: Data layer project documentation workspace 005
    When the operator opens the project capture-matrix selector
    Then a searchable hierarchy offers Pages and Events plus Flow Page instances and Event occurrences grouped beneath human Flow and Page names
    And Site Profiles are absent from capture-matrix choices
    And the operator may select contexts from Flows that have no value-map section
    When Cart, Purchase, Checkout journey Cart instance, and Article journey Article Opened occurrence are selected
    Then one capture-matrix column is created for each stable selected schema context
    And repeated definitions and instances remain distinct through human headings without displaying raw identities

  # Data layer project documentation workspace 006
  Scenario: Data layer project documentation workspace 006
    Given the capture matrix selected schema contexts with overlapping and distinct properties
    When its preview is generated
    Then the union of effective property paths forms the rows
    And selected schema contexts form the columns in configured order
    And every cell is Mandatory, Optional, Conditional, Not expected, Not defined, or Blocked
    And the visible preview legend explains those states
    And Page, Event, Page-instance, and Event-occurrence effective values remain scoped to their selected contexts

  # Data layer project documentation workspace 007
  Scenario: Data layer project documentation workspace 007
    When Sitewide and Opened Article Site Profiles are selected
    Then each Profile has one independently ordered property-table section
    And its default columns are Property, Description, Required, Allowed values, Example, and Comments
    And every row derives from that Profile's effective documented schema
    And Site Profiles create no capture-matrix columns

  # Data layer project documentation workspace 008
  Scenario: Data layer project documentation workspace 008
    Given Client specification includes Overview, two Flows, one capture matrix, and two Site Profiles
    When the operator exports the complete Excel workbook
    Then one workbook contains sheets Overview, Checkout journey, Article journey, Data capture matrix, Sitewide, and Opened Article in configured order
    And each Flow sheet contains only that Flow's configured value map
    And exactly one Data capture matrix sheet contains every project-wide selected schema-context column
    And each selected Site Profile has exactly one property-table sheet
    And no diagnostics, provenance, source-identity, revision-hash, or repair sheet or column is exported

  # Data layer project documentation workspace 009
  Scenario: Data layer project documentation workspace 009
    When the operator exports the current section, selected sections, or complete Documentation Set
    Then Excel downloads contain only the requested sheets
    And rich copy contains the requested tables in configured section order
    And rich copy supplies semantic HTML plus a plain-text fallback suitable for Confluence or Jira
    And no plain spreadsheet, HTML-file, or PDF action is offered

  # Data layer project documentation workspace 010
  Scenario: Data layer project documentation workspace 010
    Given project-local theme Acme configures client name, logo, colors, typography, table density, borders, striping, highlighted headings, column widths, and header and footer text
    When the operator previews a sample and applies Acme to Client specification
    Then Flow, matrix, Profile, Overview, Excel, and rich-copy tables use the same supported visual decisions
    And theme controls are grouped into Brand, Typography, Table, and Header and footer
    And advanced groups remain collapsed until selected
    And the theme is structured data rather than executable CSS or workbook code

  # Data layer project documentation workspace 011
  Scenario: Data layer project documentation workspace 011
    Given the operator copied Acme's structured theme values
    When those values are pasted into a new project-local theme
    Then the preview reproduces the supported branding without a cross-project theme library
    And each project owns and may edit its copy independently

  # Data layer project documentation workspace 012
  Scenario: Data layer project documentation workspace 012
    Given selected content is stale, incomplete, or blocked
    When the operator opens export preflight
    Then compact tool-only diagnostics identify affected sections and direct repairs
    And export requires explicit confirmation
    When the operator confirms exporting incomplete documentation
    Then Excel and rich output show Draft — incomplete in their document heading
    And no diagnostic detail, provenance, internal identity, revision hash, or repair action appears in the shared output

  # Data layer project documentation workspace 013
  Scenario: Data layer project documentation workspace 013
    Given the preview was compiled from selected Flow, schema-context, Profile, and theme revisions
    When any selected source or configuration changes
    Then the affected preview becomes stale and export actions are disabled
    When the operator refreshes the preview
    Then one immutable export snapshot supplies every requested Excel sheet and rich table
    And generating or copying documentation changes no project content or publication revision

  # Data layer project documentation workspace 014
  Scenario: Data layer project documentation workspace 014
    Given documentation contains tabs, line breaks, markup, formula-like prefixes, long values, and duplicate or invalid Excel sheet-name characters
    When Excel and rich outputs are generated
    Then cell content remains literal and cannot create formulas, unintended rows, columns, or markup
    And deterministic human sheet names are unique and valid without exposing raw identities
    And wrapping, column widths, headings, and theme styling preserve readable tables

  # Data layer project documentation workspace 015
  Scenario Outline: Data layer project documentation workspace 015
    Given Client specification has a fresh preview for <export_scope>
    When the operator downloads the <export_scope> Excel workbook
    Then the download is an OOXML .xlsx workbook rather than a differently formatted file with an .xlsx name
    And Microsoft Excel opens it without a file-format error or repair warning
    And its sheets in order are <expected_sheets>

    Examples:
      | export_scope                              | expected_sheets                                                                                         |
      | current Checkout journey section          | Checkout journey                                                                                        |
      | selected Checkout journey and Sitewide sections | Checkout journey, Sitewide                                                                         |
      | complete Documentation Set                | Overview, Checkout journey, Article journey, Data capture matrix, Sitewide, Opened Article              |

  # Data layer project documentation workspace 016
  Scenario: Data layer project documentation workspace 016
    Given Client specification includes literal Sitewide, Opened Article, Flows, and the Data capture matrix
    When the operator configures concept documentation
    Then the Documentation Set offers one ordered checklist of project-wide concepts plus virtual Ungrouped
    And each entry independently controls whether its property rows are included
    And Include concept subheadings independently controls whether group headings are rendered
    And these controls apply to every selected Site Profile property-table section and the Data capture matrix
    And Flow sections expose no concept grouping or filtering control

  # Data layer project documentation workspace 017
  Scenario Outline: Data layer project documentation workspace 017
    Given the concept checklist includes ecommerce, page, technical, and Ungrouped
    And ecommerce, page, and Ungrouped are included while technical is excluded
    And Include concept subheadings is <headings>
    When Sitewide, Opened Article, and the Data capture matrix are previewed or exported
    Then technical property rows are absent
    And ecommerce, page, and Ungrouped property rows remain
    And visible concept subheadings are <heading_result>
    And included rows follow configured concept order and path order within each concept
    And Excel and rich document copy apply the same filtering and ordering

    Examples:
      | headings | heading_result                                  |
      | on       | rendered once before each non-empty concept     |
      | off      | absent while concept filtering remains active   |

  # Data layer project documentation workspace 018
  Scenario: Data layer project documentation workspace 018
    Given Client specification orders included concepts page, ecommerce, and Ungrouped
    And Sitewide, Opened Article, and the Data capture matrix contain rows in all three concepts
    When the operator requests grouped concept output
    Then each selected Profile table and the matrix render PAGE, ECOMMERCE, and UNGROUPED sections in that order
    And each concept heading spans the complete table width
    And the standard column headings occur once at the top of each table
    And each concept heading is followed directly by that concept's property rows in path order
    And no empty concept heading is emitted
    And Excel uses merged styled concept rows across the table width
    And rich document copy uses semantic concept headings with equivalent plain-text fallback

  # Data layer project documentation workspace 019
  Scenario: Data layer project documentation workspace 019
    Given Client specification has saved concept order ecommerce, page, and Ungrouped
    When canonical properties add Acquisition and ACQUISITION with whitespace variations
    Then the checklist contains one Acquisition entry after every saved entry
    And existing inclusion choices and order remain unchanged
    When Acquisition is moved before ecommerce and excluded
    Then the Documentation Set stores its normalized identity, display spelling, order, and inclusion choice
    And reload, Undo, project portability, preview, Excel, and rich document copy preserve that configuration
    And a source or concept-configuration change marks the preview stale until refreshed
    And a configured concept with no current exported rows emits no empty heading but retains its saved choice

  # Data layer project documentation workspace 020
  Scenario: Data layer project documentation workspace 020
    Given technical is excluded and concept subheadings are enabled
    When the complete Documentation Set is generated
    Then every selected Site Profile and the Data capture matrix omit technical rows and render included concept groups
    And every Flow sheet is byte-equivalent to output without concept configuration
    And current, selected, and complete export scopes apply concept configuration whenever they contain a selected Site Profile or the Data capture matrix

  # Data layer project documentation workspace 021
  Scenario: Data layer project documentation workspace 021
    Given Client specification has concept subheadings off and a fresh heading-free preview
    And included non-empty concepts are page, ecommerce, and Ungrouped
    When the operator selects Include concept subheadings
    Then the Documentation Set stores concept subheadings on
    And the existing preview is visibly stale until refreshed
    And stale rich-copy and Excel actions remain unavailable
    When the operator refreshes the preview
    Then every selected Site Profile and the Data capture matrix each render PAGE, ECOMMERCE, and UNGROUPED subheadings once in configured order
    And current, selected, and complete rich copy and Excel include those subheadings whenever their scope contains an affected table
    And the plain-text fallback contains the same subheadings and row order
    When the operator turns Include concept subheadings off and refreshes again
    Then every concept subheading is absent while the included row set and concept order remain unchanged

  # Data layer project documentation workspace 022
  Scenario: Data layer project documentation workspace 022
    Given Client specification has saved concept order ecommerce, page, and Ungrouped
    When the operator moves Ungrouped earlier twice
    Then the ordered checklist and Documentation Set store Ungrouped, ecommerce, and page
    And Ungrouped has the same enabled positional reorder controls as a named concept
    And each move creates one reversible project command
    When the operator refreshes grouped output
    Then every selected Site Profile, the Data capture matrix, rich copy, plain-text fallback, and Excel order their non-empty groups as UNGROUPED, ECOMMERCE, and PAGE
    And reload, Undo, Redo, and project portability preserve or reverse the exact order
    When canonical properties later add new concept Acquisition
    Then Acquisition appends after the complete saved sequence without moving Ungrouped
    And every existing inclusion choice remains unchanged

  # Data layer project documentation workspace 023
  Scenario: Data layer project documentation workspace 023
    Given a Site Profile named differently from Sitewide is absent from the Documentation Set
    And its effective properties occupy page, technical, and Ungrouped
    And the fresh preview was compiled before that Profile section was added
    When the operator adds that Site Profile property-table section
    And excludes technical, moves Ungrouped before page, and enables concept subheadings
    Then the existing preview is visibly stale until refreshed
    When the operator refreshes the preview
    Then that Profile table renders UNGROUPED and PAGE subheadings in configured order
    And its technical property rows are absent
    And current, selected, and complete rich copy, plain-text fallback, and Excel preserve that heading order and row set whenever they contain that Profile
    And Flow output remains unchanged

  # Data layer project documentation workspace 024
  Scenario: Data layer project documentation workspace 024
    Given concept subheadings are enabled for a table containing multiple non-empty concepts
    When the operator refreshes the documentation preview
    Then the table renders its section title as the strongest heading
    And it renders one standard column-heading row before the first concept
    And each concept renders as a full-width divider with a lighter theme color, smaller type, and less emphasis than the section title
    And no concept divider repeats the standard column headings
    And preview, rich copy, and Excel preserve that visual hierarchy
    And plain-text fallback emits the column headings once and each concept label once
