Feature: Data layer directional Flow specification graph

  Background:
    Given Shop project contains Pages Checkout, Confirmation, and Delivery options
    And Shop project contains Events route_view, add_shipping_info, add_payment_info, and Purchase
    And Specification Flow Checkout journey is open

  # Data layer directional Flow specification graph 001
  Scenario: Data layer directional Flow specification graph 001
    Given route_view is a context-setting Event definition
    When the operator adds a route_view context occurrence for Checkout
    And adds add_payment_info as an interaction occurrence using the human Page and Event selectors
    And connects route_view to add_payment_info as Expected next on the canvas
    Then both nodes persist stable Page and Event references without copying either definition
    And the graph and synchronized outline show the same names, roles, Pages, and identities
    And the canvas shows a directed arrow from the route_view source port to the add_payment_info target port
    When the operator moves add_payment_info to the Payment lane and saves
    And reopens Checkout journey
    Then its Payment lane, node coordinates, directed edge, source, and target are unchanged

  # Data layer directional Flow specification graph 002
  Scenario: Data layer directional Flow specification graph 002
    Given page_view has interaction role while route_view has context-setting role
    When occurrences of both Events are added to Checkout
    Then route_view establishes the authoring Page context
    And page_view does not establish context because of its emitted name
    And changing either emitted name leaves both roles unchanged

  # Data layer directional Flow specification graph 003
  Scenario: Data layer directional Flow specification graph 003
    Given shared Event route_view is used by Checkout and Confirmation context occurrences
    When interaction occurrences are added beneath both contexts
    Then each context occurrence retains the same stable route_view Event reference
    And each interaction occurrence persists its resolved stable Page reference
    And Where used lists every occurrence without creating copied Event schemas
    When the operator renames route_view to route_context and Confirmation to Order confirmation
    Then graph, outline, and Where used show the new human names
    And every Event, Page, and occurrence stable reference remains unchanged

  # Data layer directional Flow specification graph 004
  Scenario Outline: Data layer directional Flow specification graph 004
    Given add_shipping_info and add_payment_info are Event occurrences
    When the operator connects them as <relationship>
    Then graph, outline, and documentation preview identify <meaning>
    And one stable relationship stores the source, target, kind, group, label, and plain-language condition
    And the condition is labelled documentation rather than an executable query

    Examples:
      | relationship | meaning                                  |
      | expected next | normally expected ordering              |
      | alternative   | one documented alternative              |
      | parallel      | independently expected branches         |
      | merge         | documentary continuation after branches |

  # Data layer directional Flow specification graph 005
  Scenario Outline: Data layer directional Flow specification graph 005
    Given add_payment_info has one incoming expected-next relationship
    When the operator sets its obligation to <obligation> and multiplicity to <multiplicity>
    Then the Event occurrence is the only canonical owner of that expectation
    And graph, outline, and documentation preview render the saved occurrence expectation unchanged
    And no optional or repeated relationship kind is created

    Examples:
      | obligation    | multiplicity |
      | required      | exactly 1    |
      | optional      | 0 or 1       |
      | conditional   | 1 when known |
      | informational | any count    |

  # Data layer directional Flow specification graph 006
  Scenario: Data layer directional Flow specification graph 006
    Given Checkout splits into parallel Shipping and Payment branches
    When Shipping changes its Page context to Delivery options
    Then Payment retains Checkout as its Page context
    And both branch Page references remain explicit after reload
    When the branches merge and a following interaction has no unambiguous Page
    Then that occurrence is blocked with both incoming Page names
    And its repair action focuses the Page selector

  # Data layer directional Flow specification graph 007
  Scenario: Data layer directional Flow specification graph 007
    When Checkout journey is authored, inspected, or exported
    Then it states that Event payloads are validated independently through Assignments
    And it states that sequence, branch, and occurrence expectations are checked manually
    And it never describes the graph as an active, traversed, passed, or failed journey

  # Data layer directional Flow specification graph 008
  Scenario: Data layer directional Flow specification graph 008
    Given keyboard focus is on add_shipping_info in the synchronized outline
    When the operator adds a Parallel relationship to add_payment_info using only human-name controls
    Then exactly one canonical relationship is selected and focused after save
    And the same relationship appears in the graph without a drag operation
    And Arrow, Home, and End keys move through the outline without changing graph data

  # Data layer directional Flow specification graph 009
  Scenario: Data layer directional Flow specification graph 009
    Given Checkout journey contains no Event occurrences
    When its empty state opens
    Then it explains context-setting and interaction occurrences with one example of each
    And it explains reusable Page and Event references, the effective-schema layers, and Assignment-backed payload validation
    And its explanation distinguishes independent validation from manual topology and count expectations
    And Add a context-setting Event is the single recommended next action
