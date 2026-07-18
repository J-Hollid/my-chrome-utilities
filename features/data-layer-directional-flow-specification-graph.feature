Feature: Data layer directional Flow specification graph

  Background:
    Given Shop project contains Pages Checkout, Confirmation, and Delivery options
    And Shop project contains Events virtual_page_view, add_shipping_info, add_payment_info, and Purchase
    And Specification Flow Checkout journey is open

  # Data layer directional Flow specification graph 001
  Scenario: Data layer directional Flow specification graph 001
    Given virtual_page_view is a context-setting Event definition used by Checkout
    When the operator adds add_payment_info as an interaction Event occurrence for Checkout
    Then each node displays its human Event and Page names
    And each node persists stable Event and Page references without copying either definition
    And the graph and synchronized outline contain the same two nodes

  # Data layer directional Flow specification graph 002
  Scenario Outline: Data layer directional Flow specification graph 002
    Given Event <event_name> is available
    When the operator configures its Event definition as context-setting
    And adds an occurrence for Checkout
    Then the node establishes Checkout for specification composition
    And emitted name <event_name> does not independently establish or prevent that role

    Examples:
      | event_name         |
      | page_view          |
      | virtual_page_view  |
      | checkout_step_view |

  # Data layer directional Flow specification graph 003
  Scenario: Data layer directional Flow specification graph 003
    Given add_payment_info is assigned to Checkout
    When the operator moves it to Confirmation
    Then an impact preview names the Page, effective schema, Assignment, documentation, and evidence changes
    And cancelling retains Checkout and its current project revision
    When the operator repeats the move and confirms it
    Then the stable Confirmation Page reference persists

  # Data layer directional Flow specification graph 004
  Scenario: Data layer directional Flow specification graph 004
    Given Retail Purchase and Trade Purchase are distinct Event-occurrence nodes
    When both nodes select shared Event Purchase
    Then each node retains a distinct stable identity
    And both nodes retain the same stable Purchase Event reference
    And Where used lists both occurrences without creating a copied Purchase schema

  # Data layer directional Flow specification graph 005
  Scenario Outline: Data layer directional Flow specification graph 005
    Given Checkout journey already has add_shipping_info as source occurrence and add_payment_info as target occurrence
    When the operator connects add_shipping_info to add_payment_info as <relationship>
    Then the canvas, outline, legend, checklist, and documentation preview identify <meaning>
    And source, target, group, label, optional plain-language condition, and manual meaning retain one stable relationship identity
    And the relationship is labelled as a human expectation rather than runtime validation

    Examples:
      | relationship | meaning                                      |
      | expected next | expected ordering                            |
      | alternative   | one documented path among alternatives      |
      | parallel      | independently expected branches             |
      | merge         | documentary continuation after branches     |

  # Data layer directional Flow specification graph 006
  Scenario: Data layer directional Flow specification graph 006
    Given Checkout splits into parallel Shipping and Payment branches
    When Shipping changes its Page context to Delivery options
    Then Payment retains Checkout as its Page context
    And both branch contexts and the documentary merge are explicit in the graph and outline
    And no active branch token or join-waiting status is created

  # Data layer directional Flow specification graph 007
  Scenario: Data layer directional Flow specification graph 007
    Given Shipping and Payment merge with different Page contexts
    When an interaction Event is added after the merge without an explicit Page
    Then specification compilation is blocked at that Event occurrence
    And the issue names both incoming Page contexts
    And the repair action focuses the Page selector or adds a context-setting Event

  # Data layer directional Flow specification graph 008
  Scenario Outline: Data layer directional Flow specification graph 008
    Given the graph contains <defect>
    When specification integrity is checked
    Then the exact named node or relationship reports <diagnostic>
    And repair action <repair> opens and focuses the exact named entity field
    And no journey Pass or Fail result is produced

    Examples:
      | defect                              | diagnostic                         | repair                           |
      | an Event occurrence without Event  | missing Event definition           | Select Event                     |
      | a connector without a target       | dangling documented relationship   | Select target                    |
      | a required isolated Event          | orphaned required occurrence        | Add relationship                 |
      | a merge with different Pages       | ambiguous Page context              | Select Page                      |
      | an automatic-validation Event without one Assignment | automatic validation is not ready | Make automatic validation ready |

  # Data layer directional Flow specification graph 009
  Scenario: Data layer directional Flow specification graph 009
    Given virtual_page_view and add_payment_info are existing Event-occurrence nodes in Checkout journey
    When the operator imports a Figma-exported SVG as reference artwork
    Then the artwork is a locked non-semantic backdrop with source name and replacement action
    And its alignment, visibility, attribution, and replacement history survive reload
    And scripts, links, and external resources in the artwork are inert
    And no Page, Event, node, relationship, schema, or Assignment is created from pixels or connector geometry
    When an unsupported replacement is selected
    Then the prior backdrop and presentation revision remain unchanged with an exact repair message
    When the operator traces one Event and one relationship
    Then only those reviewed canonical records are added

  # Data layer directional Flow specification graph 010
  Scenario: Data layer directional Flow specification graph 010
    Given Builder and side panel opened Checkout journey at the same base revision
    When Builder adds a relationship and the side panel refines Purchase requirements
    Then both command-scoped changes survive in the next project revision
    And a stale overlapping node edit requires visible resolution
    And Undo and Redo each apply one complete graph or requirement command

  # Data layer directional Flow specification graph 011
  Scenario Outline: Data layer directional Flow specification graph 011
    Given Checkout journey is displayed on <surface>
    And its selected editing view exposes add_shipping_info and add_payment_info as named occurrence rows
    When the operator selects, connects, moves, and inspects nodes using only the keyboard
    Then <editing_view> edits the same canonical graph
    And every operation is available without dragging or canvas coordinates
    And node role, Page, relationship kind, selection, and issues are exposed without color

    Examples:
      | surface               | editing_view                                      |
      | full-page workspace   | graph and synchronized outline                    |
      | 360 CSS px side panel | one active outline or inspector pane and one scroll owner |

  # Data layer directional Flow specification graph 012
  Scenario: Data layer directional Flow specification graph 012
    When Checkout journey is authored, inspected, or exported
    Then it states Event payloads are validated automatically through Assignments
    And it states sequence and occurrence expectations are checked manually
    And it never describes the graph as a passed, failed, active, or traversed journey

  # Data layer directional Flow specification graph 013
  Scenario: Data layer directional Flow specification graph 013
    Given Checkout journey contains no Event occurrences
    When the operator opens its guided empty state
    Then purpose, context-setting and interaction examples, prerequisites, and Used by relationships are explained
    And Automatic validation required is the explained default for a new occurrence
    And Add a context-setting Event is the single recommended next action
    And a worked Retail and Trade example can be opened without creating project records

  # Data layer directional Flow specification graph 014
  Scenario: Data layer directional Flow specification graph 014
    Given one SPA document uses shared context-setting Event virtual_page_view
    When separate occurrences bind it to Checkout and Confirmation
    Then both occurrences reference the same virtual_page_view Event and distinct stable Pages
    And interaction occurrences under each context persist their corresponding Page references
    And neither browser pageload nor a differently named Event definition is required

  # Data layer directional Flow specification graph 015
  Scenario Outline: Data layer directional Flow specification graph 015
    Given add_payment_info has one expected-next incoming relationship
    When the operator sets its obligation to <obligation> and multiplicity to <multiplicity>
    Then the Event-occurrence node is the sole canonical owner of <obligation> and <multiplicity>
    And no optional or repeated relationship record is created
    And canvas, outline, checklist, Confluence, and Spreadsheet show the same expectation

    Examples:
      | obligation   | multiplicity |
      | required     | exactly 1    |
      | optional     | 0 or 1       |
      | conditional  | 1 when known |
      | informational | any count   |

  # Data layer directional Flow specification graph 016
  Scenario: Data layer directional Flow specification graph 016
    Given an imported legacy connector marks add_payment_info optional and repeated
    When guided migration is reviewed
    Then the preview moves optional obligation and repeated multiplicity to add_payment_info
    And normalizes the connector to expected next without changing its source or target
    And declining the preview leaves the legacy record blocked and unchanged

  # Data layer directional Flow specification graph 017
  Scenario: Data layer directional Flow specification graph 017
    Given keyboard focus is on source node add_shipping_info in the outline
    And add_payment_info is an Event-occurrence node in Checkout journey
    When the operator invokes Add relationship, chooses target add_payment_info by human name, chooses Parallel, and saves
    Then one canonical Parallel relationship is selected in the outline
    And focus returns to its relationship row
    Given an accepted concurrent command then removes that target reference
    When its missing-target diagnostic opens repair and add_payment_info is saved again
    Then focus returns to that exact relationship row rather than the start of the Flow

  # Data layer directional Flow specification graph 018
  Scenario: Data layer directional Flow specification graph 018
    Given shared Event virtual_page_view is context-setting in 4 Event occurrences
    When the operator proposes changing its reusable Event role to interaction
    Then impact review names all 4 occurrences and their Page context, effective-schema, Assignment, documentation, and stale-evidence consequences
    And cancelling retains the Event role and project revision
    When the operator repeats the role change and confirms it
    Then one Event command updates every occurrence projection without changing any stable Event or node reference
