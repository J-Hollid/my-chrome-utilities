Feature: Data layer directional Flow specification graph

  Background:
    Given Shop project contains Page Groups Checkout, Delivery, and Confirmation
    And Checkout owns Pages Cart and Payment, Delivery owns Page Shipping, and Confirmation owns Page Thank you
    And ungrouped Pages Landing and Campaign and Events page_view, route_view, add_shipping_info, add_payment_info, and purchase exist
    And Specification Flow Checkout journey is open

  # Data layer directional Flow specification graph 001
  Scenario: Data layer directional Flow specification graph 001
    When the main Flow workspace opens
    Then its toolbar exposes Page Groups, Pages, and Events component catalogs beside the canvas
    And the synchronized outline is a secondary projection in the main workspace
    And the Inspector may be closed without hiding any creation, placement, connection, or relationship-kind action
    And no documentary occurrence or relationship form is mounted in the Inspector
    And Structured executable flow remains separately labelled Advanced and does not duplicate the documentary graph

  # Data layer directional Flow specification graph 002
  Scenario: Data layer directional Flow specification graph 002
    Given Checkout journey contains no selected Page Groups or graph items
    When the operator adds available groups to the Flow lane order
      | position | Page Group   |
      | 1        | Checkout     |
      | 2        | Delivery     |
      | 3        | Confirmation |
    Then the canvas renders exactly those three lanes in that order
    And canonical Flow storage contains their ordered stable references
    And no Context, Shipping, Payment, Merge, or other fallback lane is rendered or stored
    And the recommended next action is Add a Page from the Pages catalog

  # Data layer directional Flow specification graph 003
  Scenario: Data layer directional Flow specification graph 003
    Given the Flow lanes are Checkout, Delivery, and Confirmation
    When the operator moves Confirmation before Delivery from the main-workspace lane controls
    Then the canvas order becomes Checkout, Confirmation, and Delivery
    And horizontal lane positions are derived from that order without changing Page Group identities
    When the operator attempts to remove Checkout while it contains a Page frame
    Then removal is blocked without changing the Flow revision
    And guidance identifies the contained Page by name and offers Move Page frame or Remove Page frame

  # Data layer directional Flow specification graph 004
  Scenario: Data layer directional Flow specification graph 004
    Given selected membership permits Cart in Checkout and Shipping in Delivery
    When the operator searches Pages for Cart and inserts it into Checkout
    Then one Cart Page frame appears in the Checkout lane with stable Checkout and Cart references
    And the Pages catalog identifies Cart as a Checkout member
    When the operator tries to insert Shipping into Checkout
    Then the gesture is rejected because Shipping belongs to Delivery
    And no Page, Page Group, Flow, or frame reference changes
    And guidance opens Shipping Page Group membership without offering a free-form lane value

  # Data layer directional Flow specification graph 005
  Scenario: Data layer directional Flow specification graph 005
    Given Cart Page frame has no Event occurrences
    And page_view and route_view are predefined as context-setting Events
    When the operator inserts page_view by pointer with trigger Initial load
    And inserts route_view by keyboard with trigger SPA route change
    Then both use the same Page-contained Event occurrence model as interaction Events
    And each persists stable Cart, Checkout, Event, and occurrence references with its role and trigger
    And no Page-context binding, copied schema, or lane-name string is stored

  # Data layer directional Flow specification graph 006
  Scenario: Data layer directional Flow specification graph 006
    Given Cart and Shipping Page frames are visible in their owning lanes
    When the operator searches Events for add_shipping_info
    And places it by pointer in Cart and by keyboard in Shipping
    Then the new interaction occurrences are
      | container | Event reference   | occurrence identity |
      | Cart      | add_shipping_info | distinct            |
      | Shipping  | add_shipping_info | distinct            |
    And neither Event definition, reusable schema, Page membership, nor the first occurrence changes

  # Data layer directional Flow specification graph 007
  Scenario: Data layer directional Flow specification graph 007
    Given Landing and Campaign have neither Page Group membership nor Event occurrences
    And no free Page frame is present
    When the operator starts dragging Landing outside the selected Page Group lanes
    Then narrow Place before lanes and Place after lanes affordances appear at the left and right canvas edges
    And neither affordance occupies a lane-sized background
    When Landing is released on Place before lanes and Campaign is released on Place after lanes
    Then compact free Landing and Campaign frames sandwich the Page Group lanes
    And each frame persists its before-lanes or after-lanes region, coordinates, Page, and frame references without a Page Group or context-binding reference
    And empty edge backgrounds collapse while both frames remain available for Events and relationships

  # Data layer directional Flow specification graph 008
  Scenario: Data layer directional Flow specification graph 008
    Given add_payment_info is positioned inside Cart
    When pointer drag places add_payment_info at a new free position inside Cart
    Then its saved presentation coordinates match the chosen position after reload
    When pointer drag or Arrow keys attempt to move it outside Cart or across the Checkout lane boundary
    Then it returns to its last valid position
    And no Page Group, Page, Event, occurrence identity, or canonical revision changes
    And guidance says to add the predefined Event to another Page frame instead

  # Data layer directional Flow specification graph 009
  Scenario: Data layer directional Flow specification graph 009
    Given Cart contains page_view and add_payment_info occurrences with visible connection ports
    When the operator drags from the page_view output port toward add_payment_info
    Then a live directed preview follows the pointer and add_payment_info is highlighted as a valid target
    When the pointer is released on the add_payment_info input port
    Then one expected-next relationship persists with stable source, target, and relationship identities
    And the canvas renders its directed edge without requiring a source or target form
    And an inline relationship popover opens at the new edge

  # Data layer directional Flow specification graph 010
  Scenario: Data layer directional Flow specification graph 010
    Given relationship drawing started from the page_view output port
    When the pointer reaches the same occurrence, empty canvas, or an incompatible target
    Then that target is identified as invalid
    When the operator releases the pointer or presses Escape
    Then the preview is removed, focus returns to page_view, and canonical state remains byte-identical
    And no incomplete relationship record exists

  # Data layer directional Flow specification graph 011
  Scenario: Data layer directional Flow specification graph 011
    Given four positioned nodes form a fork-and-join candidate
    When two outgoing connections are completed from page_view
    And uses each inline popover to set kind Parallel, group Fulfilment choice, and its human label
    And draws expected-next relationships from both branch Events to purchase
    And changes those two edges to Merge in group Fulfilment choice
    Then graph and outline show two parallel branches and their merge with exact directed endpoints
    And relationship labels, kinds, group, documentation conditions, and expectations persist once
    And the graph makes no claim that either branch or the complete Flow executed

  # Data layer directional Flow specification graph 012
  Scenario: Data layer directional Flow specification graph 012
    Given keyboard focus is on the page_view output port
    When Enter starts connection mode
    And Arrow keys move the target indicator to add_payment_info
    And Enter creates the relationship
    Then the inline relationship popover receives focus for kind and documentation editing
    When the operator saves and presses Escape
    Then focus returns to the created edge in the canvas
    And exactly one relationship exists without requiring pointer input or Inspector controls

  # Data layer directional Flow specification graph 013
  Scenario: Data layer directional Flow specification graph 013
    Given add_payment_info and its outgoing relationship are visible while the Inspector is closed
    When the operator selects add_payment_info
    Then canvas handles and an inline summary expose Move, Connect, Duplicate occurrence, Remove, and Open schema contribution
    And opening schema contribution uses the canonical schema editor in the main workspace
    When the operator returns to Flow
    Then the same node, viewport, and canvas position are restored
    When the optional Inspector is opened
    Then it shows contextual details without becoming the only route to any graph action

  # Data layer directional Flow specification graph 014
  Scenario: Data layer directional Flow specification graph 014
    Given a rename fixture has one context-setting Event node, one interaction Event node, and their directed edge
    When Page Group Checkout is renamed Basket, Page Cart is renamed Basket page, and Event add_payment_info is renamed payment_details_added
    Then canvas, catalogs, popover, and outline show the new human names
    And stored Page Group, Page, Event, occurrence, role, trigger, and relationship values remain byte-for-byte stable
    When the Flow is reloaded
    Then lane order, Page-frame containment, free positions, selection, directed endpoints, and relationship meaning are unchanged

  # Data layer directional Flow specification graph 015
  Scenario: Data layer directional Flow specification graph 015
    Given a fresh Checkout journey has no lanes, frames, occurrences, or relationships
    When the operator uses only main-workspace controls to add ordered Checkout and Confirmation lanes
    And inserts Cart and Thank you from Pages
    And inserts Cart page_view, add_payment_info, and Thank you purchase from the Events catalog
    And uses connection ports to create the two-edge route through add_payment_info
    And reloads the project with the Inspector closed
    Then the canvas and outline contain two Page Group-derived lanes, two Page frames, three occurrences, and two directed relationships
    And no fixed lane, Inspector-authored graph item, raw ID, copied Event schema, or executable transition was created
    And per-Event payload validation remains independent while journey expectations remain manual

  # Data layer directional Flow specification graph 016
  Scenario: Data layer directional Flow specification graph 016
    Given the movement fixture places free Landing before the lanes, free Campaign after the lanes, and grouped Cart in Checkout
    When the operator moves Landing through the after-lanes edge affordance
    Then Landing keeps its frame, Page, Event-occurrence, and relationship identities
    And only its presentation region and coordinates change from before-lanes to after-lanes
    When keyboard controls place Landing before the lanes again
    Then focus returns to Landing at its persisted left-side position
    When pointer or keyboard controls try to move Cart outside the Page Group lanes
    Then the move is rejected without a canonical revision change
    And guidance links to Cart Page Group membership
    When the Flow reloads
    Then free frames render only in their saved edge regions and never enter Page Group lane order or documentation lane headings

  # Data layer directional Flow specification graph 017
  Scenario: Data layer directional Flow specification graph 017
    Given a saved legacy Checkout journey has Cart page_view and route_view nodes that reference Page-owned binding records
    When the operator opens the journey after the occurrence-model upgrade
    Then migration review names each Page, Event, trigger, and affected occurrence without exposing raw IDs
    When the operator confirms migration
    Then every affected occurrence keeps its identity, Page-frame containment, position, and relationship endpoints
    And each occurrence directly stores its Event reference, context-setting role, and trigger
    And canonical Page and Flow records contain no contextEventBindings or contextBindingId field
    And one Undo restores the complete pre-migration project revision
