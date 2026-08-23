# mutation-stamp: sha256=538e2da74d9d0043055979f3104a446e69d0eb035d76932b0fa46efe80bf7f16
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-08-23T05:12:58.573221269Z","feature_name":"Data layer rich page documentation templates runtime","feature_path":"features/data-layer-rich-page-documentation-templates-runtime.feature","background_hash":"dd2da51202c6fced6f7e2baf8d5af861e1cf9e21b9e1b95690d299e26ba2674e","implementation_hash":"sha256:bd86ee0433f8a051ad8e15cdf5dde6e237a8753b3e2305b781a764c58f5c59db","scenarios":[{"index":7,"name":"Data layer rich page documentation templates runtime 008","scenario_hash":"db21a2aee3a5574b65de7074060b7a64fa3d73827905982333c424f284e1588d","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-08-23T05:12:58.573221269Z"}]}
# acceptance-mutation-manifest-end

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

  # Data layer rich page documentation templates runtime 009
  Scenario: Data layer rich page documentation templates runtime 009
    Given actual Rich page controls add Page concept groups and a Page visual block inside flow.pages
    And production Checkout has Page-specific examples, ordered Ecommerce and Funnel rows, an actual saved WebP Cart-instance visual, and one Page without a visual
    When installed Rich output is generated for that configured Flow Page pattern
    Then parsed semantic HTML contains each concept heading once with its own ordered rows and Page-specific Example cells
    And each rendered image uses its matching saved Page-instance visual and accessible description without exposing its bytes as text
    And the Page without a visual emits no image or placeholder
    And the plain fallback contains equivalent headings, rows, descriptions, captions, and order
    And serialized visual attachments, graph topology, schema definitions, Documentation configuration, Draft sequence, and publication bytes equal their pre-render values
