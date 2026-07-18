Feature: Data layer directional Flow specification graph runtime

  Background:
    Given the built extension is running with the production project repository and Specification Flow editor
    And Checkout journey contains named Page and Event definitions

  # Data layer directional Flow specification graph runtime 001
  Scenario: Data layer directional Flow specification graph runtime 001
    When actual controls add a context node, interaction node, and documented relationship
    Then production storage contains one canonical record for each item with stable references
    And the rendered canvas and outline expose the same names, roles, Pages, and relationship
    And reload renders those same canonical records

  # Data layer directional Flow specification graph runtime 002
  Scenario: Data layer directional Flow specification graph runtime 002
    Given virtual_page_view is configured as context-setting and pageview is configured as interaction
    And production nodes reference both Events and bind them to named Pages
    When both production nodes render
    Then their roles follow the referenced Event definitions rather than either emitted Event name
    And each interaction occurrence contains its own resolved stable Page reference

  # Data layer directional Flow specification graph runtime 003
  Scenario: Data layer directional Flow specification graph runtime 003
    Given production graph data contains expected-next, alternative, parallel, and merge relationships
    And its nodes contain required, optional, conditional, and informational obligations with multiplicities
    And an immutable release contains the matching documentation and per-event validation projections
    When the graph, outline, checklist, and documentation projection render
    Then all four representations contain the same topology, node expectations, identities, and human meanings
    And each relationship retains the same source, target, group, label, and plain-language condition
    And production storage contains no optional or repeated relationship kind
    And the published validation plan contains no transition, active-branch, join, or occurrence evaluator input

  # Data layer directional Flow specification graph runtime 004
  Scenario: Data layer directional Flow specification graph runtime 004
    Given an immutable release contains the published Purchase Assignment and effective schema
    And Purchase is captured before its documented predecessor and a parallel branch is absent
    When production per-event validation completes
    Then Purchase still receives its independently selected schema result
    And the actual UI shows no transition error, temporal-occurrence error, active branch, join state, or Flow verdict
    And graph and Live display Specification Flow — Event payloads are validated automatically; sequence and occurrence expectations are checked manually

  # Data layer directional Flow specification graph runtime 005
  Scenario: Data layer directional Flow specification graph runtime 005
    When a Figma-exported SVG is imported through production controls
    Then its sanitized backdrop, source, attribution, alignment, visibility, and import metadata render after reload
    And only the presentation revision changes
    When it is replaced with another supported SVG
    Then replacement metadata and the new inert backdrop persist after reload
    When a malformed or unsupported replacement is attempted
    Then the supported backdrop and presentation revision remain unchanged with an exact error
    When the backdrop is removed
    Then it disappears after reload while canonical diagram nodes remain
    Then project Page, Event, node, relationship, schema, and Assignment records remain byte-equivalent
    And no imported script, link, external request, or interactive DOM becomes active
    When one node is traced through production controls
    Then exactly one canonical Event-occurrence record is added

  # Data layer directional Flow specification graph runtime 006
  Scenario: Data layer directional Flow specification graph runtime 006
    Given Builder and side panel start from one production project revision
    When disjoint graph and requirement commands are saved in both orders
    Then both final revisions contain the exact union once
    When overlapping node fields are saved stale
    Then production conflict UI prevents either value from being silently overwritten

  # Data layer directional Flow specification graph runtime 007
  Scenario: Data layer directional Flow specification graph runtime 007
    Given Retail journey controls remain mounted while Trade journey becomes selected
    When the stale Retail control is invoked
    Then no Retail or Trade canonical record changes
    And the action reports that Retail is no longer the active editing context

  # Data layer directional Flow specification graph runtime 008
  Scenario Outline: Data layer directional Flow specification graph runtime 008
    Given the actual Flow workspace width is <width>
    When the complete graph is operated using only the keyboard
    Then <layout>
    And focus returns to the invoking node or relationship after edit, repair, and close

    Examples:
      | width | layout                                                        |
      | 360   | one outline or inspector pane has one vertical scroll owner   |
      | 720   | one active graph, outline, or inspector pane owns interaction  |
      | 1280  | graph, outline access, and contextual inspector remain available |

  # Data layer directional Flow specification graph runtime 009
  Scenario: Data layer directional Flow specification graph runtime 009
    Given the actual selected Flow contains no nodes
    When the production guided empty state renders
    Then it explains the graph purpose, automatic payload versus manual journey boundary, examples, prerequisites, and Used by relationships
    And exactly one enabled Continue action is Add a context-setting Event
    And the worked example changes no production project record until explicitly adopted
    When the operator invokes Continue
    Then one context-setting occurrence is created with Automatic validation required

  # Data layer directional Flow specification graph runtime 010
  Scenario: Data layer directional Flow specification graph runtime 010
    When production controls add shared virtual_page_view to Checkout and Confirmation in one SPA Flow
    Then production storage contains two node identities, one Event identity, and two stable Page references
    And each following interaction stores its own Page reference for independent Assignment compilation
    And no browser-navigation or temporal Flow-state record is created

  # Data layer directional Flow specification graph runtime 011
  Scenario: Data layer directional Flow specification graph runtime 011
    Given the actual graph splits Checkout into parallel Shipping and Payment branches
    When production controls bind Shipping to Delivery options
    Then Payment remains bound to Checkout in storage, canvas, and outline
    When the branches merge and a following interaction has no Page
    Then production compilation blocks that exact node with both incoming Page names
    And its repair focuses the Page selector and persists the selected stable Page reference

  # Data layer directional Flow specification graph runtime 012
  Scenario: Data layer directional Flow specification graph runtime 012
    Given production outline focus is on add_shipping_info
    When keyboard controls add a relationship to add_payment_info by human name and choose Parallel
    Then exactly one Parallel relationship row is selected and focused after save
    Given an accepted production command then removes that target reference
    When its exact target repair is completed using the keyboard
    Then focus returns to the same relationship row and no other relationship changes

  # Data layer directional Flow specification graph runtime 013
  Scenario: Data layer directional Flow specification graph runtime 013
    Given one production context-setting Event is referenced by 4 nodes on both installed surfaces
    When actual controls review and confirm changing its role to interaction
    Then the impact preview and completion message name all affected nodes, schema/readiness/documentation effects, stale evidence, revision, and Undo
    And both surfaces update from one canonical Event command without changing stable Event or node references

  # Data layer directional Flow specification graph runtime 014
  Scenario Outline: Data layer directional Flow specification graph runtime 014
    Given actual canonical graph commands create <defect>
    When the production specification compiler and installed diagnostic view refresh
    Then rendered diagnostic is <diagnostic> on the exact named node or relationship
    And invoking repair <repair> focuses the exact production entity field
    And no journey Pass or Fail result is stored or rendered

    Examples:
      | defect                                               | diagnostic                         | repair                           |
      | an Event occurrence without Event                   | missing Event definition           | Select Event                     |
      | a documented relationship without a target          | dangling documented relationship   | Select target                    |
      | a required isolated Event occurrence                | orphaned required occurrence       | Add relationship                 |
      | a merge whose incoming nodes bind different Pages   | ambiguous Page context             | Select Page                      |
      | an automatic-validation Event without an Assignment | automatic validation is not ready  | Make automatic validation ready |
