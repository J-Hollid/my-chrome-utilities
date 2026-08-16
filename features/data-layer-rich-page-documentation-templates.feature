Feature: Data layer rich page documentation templates

  Background:
    Given Shop has configured Overview, Flow, Data capture matrix, and Site Profile documentation sections
    And Rich page template contract version 1 is selected

  # Data layer rich page documentation templates 001
  Scenario Outline: Data layer rich page documentation templates 001
    When the operator creates a Rich page template for <kind>
    Then it starts with the Built-in <kind> semantic block structure
    And the editor offers only root bindings and collections valid for <kind>
    And no raw HTML, CSS, JavaScript, expression, query, Confluence storage markup, or ADF source editor is offered

    Examples:
      | kind                |
      | Overview            |
      | Flow                |
      | Data capture matrix |
      | Site Profile        |

  # Data layer rich page documentation templates 002
  Scenario: Data layer rich page documentation templates 002
    Given Acme flow page contains a heading, paragraph bindings, divider, Theme logo, repeat collection, and data table
    When the operator edits its blocks
    Then each binding picker shows only values valid in that block's current scope
    And moving, copying, or removing a block changes presentation only
    And the template cannot select, sort, filter, or mutate documentation data

  # Data layer rich page documentation templates 003
  Scenario: Data layer rich page documentation templates 003
    Given Acme flow page repeats a Page block over flow.pages
    And the Page block repeats an Event block over page.events
    And Checkout journey contains Cart, Shipping, Payment, and Confirmation Page contexts with contained Events
    When the operator previews Checkout journey
    Then four Page blocks appear in configured Flow order
    And every Page block contains its own step, Page name, primary event, values, and ordered contained Event blocks
    And repeated canonical Page references remain distinct Flow Page contexts
    And no new Page documentation section or definition is created

  # Data layer rich page documentation templates 004
  Scenario Outline: Data layer rich page documentation templates 004
    Given a <kind> template contains its Built-in data-table block
    When the configured section is rendered
    Then the block contains <visible_content>
    And it cannot recover content excluded by Documentation Set configuration

    Examples:
      | kind                | visible_content                                                         |
      | Overview            | Name, Purpose, and Website fields in configured order                    |
      | Flow                | configured Flow columns, property rows, metadata, and literal values     |
      | Data capture matrix | configured contexts, concepts, property rows, presence marks, and legend |
      | Site Profile        | configured concepts, property rows, and selected Profile columns         |

  # Data layer rich page documentation templates 005
  Scenario: Data layer rich page documentation templates 005
    Given Acme profile page places Theme logo, client name, a Profile data table, header text, and footer text
    When the operator previews a selected Site Profile
    Then those values appear only at their explicit template positions
    And the applied Documentation theme styles the supported data-table block
    And omitted theme blocks or bindings produce no implicit logo, client, header, or footer content

  # Data layer rich page documentation templates 006
  Scenario: Data layer rich page documentation templates 006
    Given Client specification assigns different Rich page templates by documentation kind
    When the operator copies current, selected, and complete rich documentation
    Then each requested section is rendered once through its kind assignment in Documentation Set order
    And all requested sections form one semantic clipboard payload
    And the plain-text fallback contains the same visible values, headings, groups, and order

  # Data layer rich page documentation templates 007
  Scenario: Data layer rich page documentation templates 007
    Given a rich template repeats an allowed collection that contains no items
    When the section is previewed and copied
    Then that repeat block emits no child content
    And surrounding semantic blocks remain in template order
    And no empty concept heading or placeholder instruction appears

  # Data layer rich page documentation templates 008
  Scenario: Data layer rich page documentation templates 008
    Given project values contain markup, scripts, styles, event attributes, links, line breaks, and template delimiters
    When binding chips, repeat blocks, and data tables render those values
    Then semantic rich output escapes every value as inert content
    And deliberate line breaks remain visible without creating elements or attributes
    And values cannot add, remove, reorder, or restyle template blocks or table structure
    And the plain-text fallback contains the equivalent literal values

  # Data layer rich page documentation templates 009
  Scenario: Data layer rich page documentation templates 009
    Given Acme flow page contains an invalid out-of-scope binding or crossing repeat scope
    When the operator attempts to save or assign it
    Then the template is rejected with the exact block and binding or scope finding
    And its prior valid revision and assignment remain unchanged
    And no partial Rich page template is rendered

  # Data layer rich page documentation templates 010
  Scenario: Data layer rich page documentation templates 010
    Given a current preview used the first valid revision of Acme flow page
    When the operator edits and saves a second valid revision
    Then one reversible project command stores the semantic block tree
    And the former preview becomes stale and rich copy is disabled
    When the operator refreshes the preview
    Then the new immutable snapshot uses only the second revision
    And Excel template assignments and output remain unchanged

  # Data layer rich page documentation templates 011
  Scenario Outline: Data layer rich page documentation templates 011
    Given the Rich page editor is open at <viewport_width>
    When the operator navigates the template outline and selected block
    Then <editor_layout>
    And binding and collection controls remain labelled and keyboard reachable
    And the editor introduces no horizontal page scrolling

    Examples:
      | viewport_width | editor_layout                                      |
      | 1280 pixels    | outline and selected block detail appear together  |
      | 360 pixels     | outline and selected block detail open one at a time |
