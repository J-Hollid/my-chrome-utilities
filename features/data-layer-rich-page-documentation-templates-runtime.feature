Feature: Data layer rich page documentation templates runtime

  Background:
    Given the built extension is running with the production Documentation workspace, rich template editor, renderer, clipboard, and project repository
    And production Shop has configured sections of every documentation kind

  # Data layer rich page documentation templates runtime 001
  Scenario: Data layer rich page documentation templates runtime 001
    When actual controls create a Rich page template for every kind
    Then the installed editor starts each from its Built-in semantic block tree
    And rendered controls expose only valid block, binding, collection, and movement operations
    And DOM inspection finds no raw markup, style, script, expression, query, storage-format, or ADF editor

  # Data layer rich page documentation templates runtime 002
  Scenario: Data layer rich page documentation templates runtime 002
    Given actual controls build Acme flow page with a flow.pages repeat and nested page.events repeat
    When production preview renders Checkout journey
    Then parsed preview HTML contains Cart, Shipping, Payment, and Confirmation Page blocks in configured order
    And each Page block contains its own production values and contained Event blocks
    And repository inspection finds no new Page document, documentation section, schema, Flow, or publication revision

  # Data layer rich page documentation templates runtime 003
  Scenario: Data layer rich page documentation templates runtime 003
    Given actual Rich page templates contain Built-in data-table blocks for all four kinds
    When production preview and clipboard adapters render each configured section
    Then parsed tables match the immutable snapshot's selected columns, rows, concepts, contexts, values, and legends
    And rich HTML and plain text have equivalent visible content and order
    And no component-local expected data substitutes for production compiler output

  # Data layer rich page documentation templates runtime 004
  Scenario: Data layer rich page documentation templates runtime 004
    Given Client specification mixes Rich page assignments across all four kinds
    When actual controls copy current, selected, and complete scopes
    Then the clipboard adapter receives one semantic payload per action
    And parsed sections use their exact kind assignments once in Documentation Set order
    And the current Built-in incomplete-Draft confirmation still blocks and labels custom rich output

  # Data layer rich page documentation templates runtime 005
  Scenario: Data layer rich page documentation templates runtime 005
    Given production project values contain markup, scripts, styles, event attributes, unsafe links, line breaks, and marker text
    When the installed renderer writes bindings, repeats, and data tables
    Then DOM parsing finds literal visible values and deliberate line breaks but no injected element, attribute, style, script, link, or extra table cell
    And the plain fallback contains matching inert values

  # Data layer rich page documentation templates runtime 006
  Scenario: Data layer rich page documentation templates runtime 006
    Given the current production preview binds first revision of Acme flow page
    When actual editor controls save a valid second revision
    Then installed freshness reports out of date and rich-copy controls are disabled
    When actual controls refresh and copy again
    Then captured snapshot identity and clipboard output bind only the second revision
    And Undo and Redo restore the exact block tree, assignment, and stale state

  # Data layer rich page documentation templates runtime 007
  Scenario: Data layer rich page documentation templates runtime 007
    Given the operator creates an out-of-scope binding and a crossing repeat scope through actual editor controls
    When actual controls attempt to save and assign the template
    Then installed validation identifies the exact block and invalid scope
    And repository inspection retains the prior valid revision without a partial save

  # Data layer rich page documentation templates runtime 008
  Scenario Outline: Data layer rich page documentation templates runtime 008
    Given actual navigation opens the installed Rich page editor at <viewport_width>
    When keyboard controls move between the outline and selected block detail
    Then <rendered_layout>
    And accessibility inspection finds labelled bindings, collections, block actions, selected state, and focus return
    And browser geometry finds no horizontal document overflow

    Examples:
      | viewport_width | rendered_layout                                       |
      | 1280 pixels    | outline and selected block detail are both visible    |
      | 360 pixels     | outline and selected block detail are exclusive views |
