Feature: Data layer directional Flow specification graph runtime

  Background:
    Given the built extension is running with the production project repository and Specification Flow editor
    And production Shop contains Checkout, Delivery, Confirmation, Cart, Payment, Shipping, Thank you, and Landing definitions
    And production Events include page_view, route_view, add_shipping_info, add_payment_info, and purchase

  # Data layer directional Flow specification graph runtime 001
  Scenario: Data layer directional Flow specification graph runtime 001
    When actual controls open Checkout journey
    Then the production main workspace renders Page Groups, Pages, and Events catalogs beside the canvas
    And its synchronized outline renders as a secondary main-workspace projection
    And closing the Inspector leaves every creation, placement, connection, and relationship-kind action operable
    And the Inspector DOM contains no documentary occurrence or relationship form
    And installed Structured executable flow remains separately labelled Advanced without documentary duplicates

  # Data layer directional Flow specification graph runtime 002
  Scenario: Data layer directional Flow specification graph runtime 002
    Given production Checkout journey contains no Page Group or graph reference
    When actual controls create the lane sequence
      | position | Page Group   |
      | 1        | Checkout     |
      | 2        | Delivery     |
      | 3        | Confirmation |
    Then the installed canvas renders exactly those three lane labels in order
    And canonical production storage contains their ordered stable IDs
    And rendered and persisted Flow state contains no Context, Shipping, Payment, Merge, or other fallback lane
    And the installed next action says Add a Page from the Pages catalog

  # Data layer directional Flow specification graph runtime 003
  Scenario: Data layer directional Flow specification graph runtime 003
    Given production Flow lanes are Checkout, Delivery, and Confirmation
    When actual main-workspace controls move Confirmation before Delivery
    Then rendered lane order is Checkout, Confirmation, and Delivery
    And production horizontal positions derive from that order without changing Page Group IDs
    When actual controls attempt to remove Checkout while it contains a Page frame
    Then the production command is rejected without a revision change
    And installed guidance names the contained Page and offers Move Page frame or Remove Page frame

  # Data layer directional Flow specification graph runtime 004
  Scenario: Data layer directional Flow specification graph runtime 004
    Given production membership permits Cart in Checkout and Shipping in Delivery
    When actual Pages search finds Cart and inserts it into Checkout
    Then one rendered Cart frame and one canonical record contain stable Checkout and Cart references
    And the installed Pages catalog labels Cart as a Checkout member
    When the Shipping component is released over the production Checkout lane
    Then the production gesture is rejected because Shipping belongs to Delivery
    And project bytes and revision remain unchanged
    And installed guidance opens Shipping membership without a free-form lane control

  # Data layer directional Flow specification graph runtime 005
  Scenario: Data layer directional Flow specification graph runtime 005
    Given production Cart binds page_view for initial load and route_view for SPA route change
    And its Page frame is rendered
    When actual controls expand Context events on Cart
    Then page_view and route_view controls show binding names and trigger purposes
    When actual pointer and keyboard controls insert both bindings
    Then canonical storage contains two Page-context occurrences with stable Cart, Checkout, binding, and Event references
    And stored records contain no copied schema, editable Event role, or lane-name string

  # Data layer directional Flow specification graph runtime 006
  Scenario: Data layer directional Flow specification graph runtime 006
    Given production Cart and Shipping frames are rendered in their owning lanes
    When actual Events search finds add_shipping_info
    And production pointer and keyboard controls place it in Cart and Shipping
    Then canonical interaction records are
      | container | Event ID          | occurrence ID |
      | Cart      | add_shipping_info | distinct      |
      | Shipping  | add_shipping_info | distinct      |
    And the Event definition, reusable schema, memberships, and first occurrence bytes remain unchanged

  # Data layer directional Flow specification graph runtime 007
  Scenario: Data layer directional Flow specification graph runtime 007
    Given production Landing has page_view binding and no Page Group reference
    When actual controls drag Landing into Ungrouped entry pages
    Then one free Landing frame persists its Page and binding IDs without a Page Group ID
    And actual controls can add an interaction Event and start a relationship from that frame
    When the Landing component is released over the installed Checkout dropzone
    Then the production drop is rejected without a canonical write
    And rendered repair guidance links to Page Group membership

  # Data layer directional Flow specification graph runtime 008
  Scenario: Data layer directional Flow specification graph runtime 008
    Given the production movement fixture has an interaction node contained by Cart
    When an actual pointer drag repositions add_payment_info inside Cart
    Then reload renders the saved coordinates at that chosen position
    When an actual pointer drag or Arrow key crosses the Cart or Checkout boundary
    Then the node returns to its last valid transform
    And project revision plus Page Group, Page, Event, and occurrence IDs remain unchanged
    And installed guidance says to add the predefined Event to another Page frame

  # Data layer directional Flow specification graph runtime 009
  Scenario: Data layer directional Flow specification graph runtime 009
    Given rendered Cart page_view and add_payment_info nodes expose input and output ports
    When actual pointer events drag from page_view output toward add_payment_info
    Then a temporary directed SVG edge follows the pointer and the target port renders valid state
    When pointerup occurs on add_payment_info input
    Then production storage contains one expected-next relationship with stable source, target, and relationship IDs
    And the installed canvas renders that edge without submitting a source or target form
    And a rendered inline relationship popover opens beside the edge

  # Data layer directional Flow specification graph runtime 010
  Scenario: Data layer directional Flow specification graph runtime 010
    Given production connection mode started from page_view output
    When the pointer reaches the source node, empty canvas, or an incompatible port
    Then the installed target state is invalid
    When pointerup or Escape cancels the gesture
    Then the preview DOM is removed and focus returns to the page_view node
    And canonical project bytes remain identical with no partial relationship

  # Data layer directional Flow specification graph runtime 011
  Scenario: Data layer directional Flow specification graph runtime 011
    Given four production nodes form a fork-and-join candidate
    When actual ports complete two outgoing connections from page_view
    And each inline popover sets kind Parallel, group Fulfilment choice, and a distinct label
    And actual ports connect both branch nodes to purchase
    And those inline popovers set kind Merge and group Fulfilment choice
    Then installed canvas and outline render the exact two branches and merge endpoints
    And canonical relationships persist each kind, group, label, condition, and expectation once
    And no production graph state or output claims execution of a branch or complete Flow

  # Data layer directional Flow specification graph runtime 012
  Scenario: Data layer directional Flow specification graph runtime 012
    Given actual keyboard focus is on the page_view output port
    When Enter starts installed connection mode
    And Arrow keys target add_payment_info
    And Enter commits the edge
    Then the production inline popover receives focus for kind and documentation editing
    When actual controls save and press Escape
    Then focus returns to the created SVG edge
    And production storage contains exactly one relationship without pointer or Inspector input

  # Data layer directional Flow specification graph runtime 013
  Scenario: Data layer directional Flow specification graph runtime 013
    Given rendered add_payment_info and its outgoing edge remain visible with the Inspector closed
    When actual controls select add_payment_info
    Then installed canvas handles and inline summary expose Move, Connect, Duplicate occurrence, Remove, and Open schema contribution
    And Open schema contribution routes to the production canonical editor in the main workspace
    When actual controls return to Flow
    Then selected node, viewport, and canvas coordinates are restored
    When the optional Inspector opens
    Then it renders contextual detail without owning an exclusive graph command

  # Data layer directional Flow specification graph runtime 014
  Scenario: Data layer directional Flow specification graph runtime 014
    Given the production rename fixture has a Page-context node, an interaction node, and their directed edge
    When actual collection controls rename Checkout to Basket, Cart to Basket page, and add_payment_info to payment_details_added
    Then installed canvas, catalogs, popover, and outline render the new names
    And canonical Page Group, Page, binding, Event, occurrence, and relationship IDs remain byte-identical
    When the built extension reloads
    Then production lane order, containment, coordinates, selection, endpoints, and relationship meaning are unchanged

  # Data layer directional Flow specification graph runtime 015
  Scenario: Data layer directional Flow specification graph runtime 015
    Given actual controls create a fresh Checkout journey with no graph content
    When only production main-workspace controls add ordered Checkout and Confirmation lanes
    And actual controls insert Cart and Thank you from Pages
    And actual controls insert Cart page_view, add_payment_info, and Thank you purchase from bindings and Events
    And actual connection ports create a two-edge route through add_payment_info
    And the installed extension reloads with the Inspector closed
    Then production canvas and outline contain two derived lanes, two Page frames, three occurrences, and two directed relationships
    And canonical storage contains no fixed lane, Inspector-authored item, raw selector ID, copied Event schema, or executable transition
    And installed per-Event payload validation remains independent while journey expectations remain manual
