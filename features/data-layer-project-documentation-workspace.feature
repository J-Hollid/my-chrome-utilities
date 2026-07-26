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
