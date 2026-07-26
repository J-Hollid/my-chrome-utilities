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
