# mutation-stamp: sha256=9c233b81bf974fce4b5457027e02960a552e8d437286057754c91bb6d35c46f9
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-22T13:46:20.069606789Z","feature_name":"Data layer directional Flow specification graph runtime","feature_path":"features/data-layer-directional-flow-specification-graph-runtime.feature","background_hash":"d841c62b6eae057b12b924bd79261056f981b0d06095b10a64286e1ce8752ae3","implementation_hash":"148ce6b3fe","scenarios":[{"index":22,"name":"Data layer directional Flow specification graph runtime 023","scenario_hash":"5c69bf6450309296852e0e2da8af9b32413ea3c8abe33c01f19697ed969c1aa3","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-22T13:43:38.729708712Z"},{"index":8,"name":"Data layer directional Flow specification graph runtime 009","scenario_hash":"bdf578e52a739959f59baee7d7c10800938042136cf1932a9177a40d0bcbf197","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-07-22T12:14:43.316256227Z"}]}
# acceptance-mutation-manifest-end

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
    And closing the Inspector leaves every creation, placement, connection, and relationship-detail action operable
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
    And production top-to-bottom positions derive from that order without changing Page Group IDs
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
    Given the production Cart frame contains no Event occurrence
    And production page_view and route_view are context-setting Events
    When actual pointer controls insert page_view with trigger Initial load
    And installed keyboard controls insert route_view with trigger SPA route change
    Then both production records use the Page-contained Event occurrence shape used by interactions
    And canonical storage retains stable Cart, Checkout, Event, and occurrence IDs plus role and trigger
    And stored Page and Flow records contain no context-binding, copied schema, or lane-name field

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
    Given production Landing and Campaign have no Page Group reference or Event occurrence
    And the installed canvas contains no free Page frame
    When actual pointer events drag Landing beyond the selected lane bounds
    Then narrow Place before lanes and Place after lanes targets render at opposite canvas edges
    And computed target geometry is not lane-sized
    When pointerup places Landing before the lanes and Campaign after the lanes
    Then compact production frames render on opposite sides of the Page Group lanes
    And canonical records store before-lanes or after-lanes, coordinates, Page IDs, and frame IDs without Page Group or context-binding IDs
    And unused edge backgrounds leave the DOM while both frames accept Event drops and connection ports

  # Data layer directional Flow specification graph runtime 008
  Scenario: Data layer directional Flow specification graph runtime 008
    Given production Cart contains page_view and add_payment_info nodes
    When actual pointer drags place both nodes side by side at distinct positions inside Cart
    Then the installed Cart frame expands without rendering a forced vertical Event list
    And reload renders both saved coordinate pairs
    When an actual pointer drag or Arrow key moves add_payment_info across the Cart or Checkout boundary
    Then add_payment_info returns to its last valid transform
    And the Saved Draft plus Page Group, Page, Event, and occurrence IDs remain unchanged
    And installed guidance says to add the predefined Event to another Page frame

  # Data layer directional Flow specification graph runtime 009
  Scenario Outline: Data layer directional Flow specification graph runtime 009
    Given production Customer details and Payment Page frames plus page_view and add_payment_info occurrences expose left, right, top, and bottom ports
    When actual pointer events drag from the <source> <source_port> port toward <target>
    Then a temporary directed SVG edge follows the pointer and the <target> <target_port> port renders valid state
    When pointerup occurs on the <target> <target_port> port
    Then production storage contains one relationship with kind <kind> and typed stable endpoint and relationship IDs
    And production infers <kind> from the source and target ports without rendering a relationship-kind selector
    And canonical relationship storage has no label value
    And the installed canvas renders that edge without submitting a source or target form
    And a rendered inline relationship popover opens beside the edge

    Examples:
      | source                            | source_port | target                            | target_port | kind          |
      | Customer details Page             | right       | Payment Page                      | left        | expected_next |
      | Customer details Page             | top         | Customer details add_payment_info | bottom      | alternative   |
      | Customer details add_payment_info | bottom      | Payment Page                      | top         | merge         |
      | Customer details page_view        | right       | Customer details add_payment_info | left        | expected_next |

  # Data layer directional Flow specification graph runtime 010
  Scenario: Data layer directional Flow specification graph runtime 010
    Given production connection mode started from Customer details Page right port
    When the pointer reaches the source node, empty canvas, an incompatible endpoint, or a port pairing other than right to left, top to bottom, or bottom to top
    Then the installed target state is invalid
    When pointerup or Escape cancels the gesture
    Then the preview DOM is removed and focus returns to the Customer details Page frame
    And canonical project bytes remain identical with no partial relationship

  # Data layer directional Flow specification graph runtime 011
  Scenario: Data layer directional Flow specification graph runtime 011
    Given four production nodes form a fork-and-join candidate
    When actual pointer events draw two top-to-bottom splits from page_view to the branch Events and two bottom-to-top returns from those Events to purchase
    Then the first two production relationships have inferred kind alternative and the latter two have inferred kind merge
    And installed canvas and outline render the exact two alternative branches and merge endpoints
    When actual controls label one alternative relationship Fulfilment choice and leave the other three relationships unlabelled
    Then canonical relationships persist the optional label, inferred kinds, conditions, and expectations once
    And the installed editor exposes no Parallel kind or relationship-kind selector
    And no production graph state or output claims execution of a branch or complete Flow

  # Data layer directional Flow specification graph runtime 012
  Scenario: Data layer directional Flow specification graph runtime 012
    Given actual keyboard focus is on the page_view right port
    When Enter starts installed connection mode
    And Arrow keys target add_payment_info
    And Enter commits the edge
    Then the production relationship has inferred kind expected_next
    And the production inline popover receives focus for optional label and documentation editing without a kind selector
    When actual controls leave the label blank, save, and press Escape
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
    Given the production rename fixture has one context-setting Event node, one interaction Event node, and their directed edge
    When actual collection controls rename Checkout to Basket, Cart to Basket page, and add_payment_info to payment_details_added
    Then installed canvas, catalogs, popover, and outline render the new names
    And canonical Page Group, Page, Event, occurrence, relationship, role, and trigger values remain byte-identical
    When the built extension reloads
    Then production lane order, containment, coordinates, selection, endpoints, and relationship meaning are unchanged

  # Data layer directional Flow specification graph runtime 015
  Scenario: Data layer directional Flow specification graph runtime 015
    Given actual controls create a fresh Checkout journey with no graph content
    And production catalogs contain Customer details, ID verification, Payment, Summary, Confirmation, and their configured Event examples
    When only production main-workspace controls add Checkout as a horizontal lane
    And actual controls place Customer details, Payment, Summary, and Confirmation left to right
    And place ID verification above the gap between Customer details and Payment
    And actual pointer controls position multiple Event occurrences side by side in their Page frames
    And actual ports create all four Page and Event endpoint combinations plus the identity branch and Payment merge
    And installed controls expand the Payment Event's derived JSON example
    And the installed extension reloads with the Inspector closed
    Then production canvas and outline restore horizontal route, vertical branch, typed endpoints, Event coordinates, and derived JSON
    And canonical storage contains no fixed lane, Inspector-authored item, raw selector ID, copied Event schema, stored example JSON, or executable transition
    And installed per-Event payload validation remains independent while journey expectations remain manual

  # Data layer directional Flow specification graph runtime 016
  Scenario: Data layer directional Flow specification graph runtime 016
    Given the production movement fixture places free Landing before the lanes, free Campaign after the lanes, and grouped Cart in Checkout
    When actual pointer events move Landing through the after-lanes target
    Then no production domain identity referenced by Landing changes
    And stored presentation changes only region and coordinates from before-lanes to after-lanes
    When installed keyboard controls place Landing before the lanes again
    Then focus returns to Landing at its persisted left-side transform
    When actual pointer controls place Cart through the before-lanes target
    Then Cart frame, Page, occurrence, relationship, and ordered membership identities remain byte-identical
    And production stores Cart before-lanes and chosen coordinates without a placement-group ID
    And compiled Cart schema continues using applicable Page Group memberships with rendered provenance
    When installed keyboard controls move the Cart frame to Checkout
    Then production restores Checkout placement without changing membership order or effective schema meaning
    When actual Projects controls reopen the saved Flow
    Then each free frame renders in its saved edge region and is absent from canonical lane order and documentation lane headings

  # Data layer directional Flow specification graph runtime 017
  Scenario: Data layer directional Flow specification graph runtime 017
    Given the production migration fixture stores Cart page_view and route_view nodes through legacy Page binding records
    When the built extension opens that Checkout journey
    Then installed migration review renders each human Page, Event, trigger, and affected occurrence without raw IDs
    When actual controls confirm migration
    Then migration preserves the complete topology and layout under the original occurrence identities
    And migrated occurrences directly store Event IDs, context-setting roles, and triggers
    And serialized production Page and Flow records have no contextEventBindings or contextBindingId key
    When actual Undo runs once
    Then production storage equals the complete pre-migration revision

  # Data layer directional Flow specification graph runtime 018
  Scenario: Data layer directional Flow specification graph runtime 018
    Given production Cart has ordered Checkout and Retail Checkout memberships
    And the installed Flow renders Checkout, Retail Checkout, and Delivery lanes
    When actual pointer events start dragging Cart from Pages
    Then Checkout and Retail Checkout drop targets render valid while Delivery renders invalid
    When pointerup places Cart in Retail Checkout
    Then the canonical frame stores the Retail Checkout placement-group ID and Cart retains both ordered membership IDs
    When installed keyboard controls move the Cart frame to Checkout
    Then the saved Cart frame reuses its original frame, contained Event, relationship, and membership IDs
    And compiled schema content, contribution order, and provenance remain unchanged
    And production changes only placement-group ID and frame coordinates
    And an actual Delivery drop performs no write and renders guidance to add Delivery membership

  # Data layer directional Flow specification graph runtime 019
  Scenario: Data layer directional Flow specification graph runtime 019
    Given the production Cart frame is in Retail Checkout with membership order Checkout, Retail Checkout, and Trade Checkout
    When the production Page rule stack changes to Checkout, Trade Checkout, and Retail Checkout
    Then installed canvas keeps Cart in Retail Checkout and production recompiles its effective schema in the new order
    When actual controls attempt to remove Retail Checkout membership
    Then canonical project storage is byte-identical and its revision is unchanged
    And rendered impact guidance names the Checkout journey Cart frame with Move to Checkout and Remove Page frame actions
    When the frame is reassigned to Checkout before confirming the pending membership removal
    Then canonical Cart storage retains ordered Checkout and Trade Checkout memberships with Checkout frame placement
    And production lane eligibility excludes Retail Checkout for Cart
    And installed feedback names changed membership, affected targets, stale evidence, Draft status, and one Undo action

  # Data layer directional Flow specification graph runtime 020
  Scenario: Data layer directional Flow specification graph runtime 020
    Given the production canvas has a Checkout band above a Delivery band
    And Checkout contains Customer details, ID verification, Payment, Summary, and Confirmation frames
    When actual drags position the four-Page main route from left to right
    And place ID verification above the gap between Customer details and Payment
    Then measured Checkout geometry is a horizontal band above Delivery and grows vertically around the branch
    And serialized coordinates equal the operator positions without fixed-column or vertical-list normalization
    When actual ports draw the main-route edge from Customer details right to Payment left
    And route the upper branch from Customer details top through ID verification bottom and bottom into Payment top
    And connect Payment to Summary to Confirmation
    Then production stores the direct edge as expected_next, the upper branch as alternative, and its return as merge
    And installed SVG edges show an upper split and merge into Payment
    And compact production edge targets remain left and right of all named lane bands
    When the built extension reloads
    Then lane order, branch geometry, coordinates, and endpoint identities are unchanged

  # Data layer directional Flow specification graph runtime 021
  Scenario: Data layer directional Flow specification graph runtime 021
    Given production Product view effective example inputs are
      | contributor              | property             | configured value |
      | Sitewide                 | page_type            | product_detail   |
      | Product detail Page      | product_id           | SKU-BASE         |
      | Product view Event       | event                | view_item         |
      | Product view occurrence  | product_id           | SKU-42           |
      | Product view occurrence  | ecommerce.currency   | EUR              |
    And required product_name has no production example
    And production effective quantity has number type
    When actual controls expand the Product view Event node example
    Then the installed node renders Product view and status Incomplete
    And parsed read-only JSON contains effective values and provenance
      | path                   | value          | effective source         |
      | /event                 | view_item      | Product view Event       |
      | /page_type             | product_detail | Sitewide                 |
      | /product_id            | SKU-42         | Product view occurrence  |
      | /ecommerce/currency    | EUR            | Product view occurrence  |
    And production JSON nests ecommerce, omits forbidden fields, and lists missing product_name outside the payload
    And Edit examples routes to the exact canonical schema-instance field
    When actual occurrence controls save product_name example Phone
    Then rendered JSON updates to Phone and status becomes Complete without a stored payload copy
    When actual controls save quantity example string many against production number type
    Then installed status is Invalid with the quantity path and issue
    When a production inherited schema conflict blocks Product view
    Then installed status is Blocked and no valid-example claim renders

  # Data layer directional Flow specification graph runtime 022
  Scenario: Data layer directional Flow specification graph runtime 022
    Given production migration input contains labelled and unlabelled relationships with legacy kind parallel
    When the installed extension opens the owning Flow
    Then one repository migration changes every persisted parallel relationship to alternative
    And production relationship IDs, typed endpoints, groups, optional labels, conditions, expectations, and coordinates equal their pre-upgrade values
    And no stored relationship retains the legacy kind

  # Data layer directional Flow specification graph runtime 023
  Scenario Outline: Data layer directional Flow specification graph runtime 023
    Given production has a <kind> relationship from <source> to <target> with <label_state>
    When actual pointer or keyboard controls select its SVG edge with the Inspector closed
    Then the installed inline popover renders a Delete relationship button named <accessible_name>
    When actual controls activate Delete relationship
    Then the selected SVG edge, outline item, and canonical relationship record are absent
    And production source, target, every unrelated relationship, and their stable IDs remain byte-identical
    And the installed result reports relationship deletion, Draft state, an invalidated documentation snapshot, and Undo availability
    And document.activeElement identifies <source>
    When actual Undo runs once
    Then production restores the same relationship ID, ports, kind, optional label, group, condition, and expectation once
    And document.activeElement is the restored SVG edge

    Examples:
      | kind          | source           | target          | label_state          | accessible_name                                         |
      | expected_next | Customer details | Payment         | label Checkout route | Delete relationship Checkout route, Customer details to Payment |
      | alternative   | Customer details | ID verification | no label             | Delete relationship Customer details to ID verification |

  # Data layer directional Flow specification graph runtime 024
  Scenario Outline: Data layer directional Flow specification graph runtime 024
    Given production Confirmation Page belongs to Checkout and inherits confirmation_status expected value <parent_value>
    And production Decision Page has Approved, Review, and Declined alternative branch ends
    When actual controls insert Confirmation from the Pages catalog three times into Checkout
    And actual drags position one Confirmation instance at each branch end
    And actual ports connect Decision top to each Confirmation bottom
    Then the installed Pages catalog remains available after every insertion
    And canonical Flow storage has three distinct frame IDs used as their schema contributor IDs
    And all three frames share the Confirmation Page ID and Checkout ID
    And production stores three alternative relationships whose target endpoint IDs are those distinct frame IDs
    When actual controls open the Approved Confirmation instance schema contribution
    Then the installed canonical editor renders <parent_value> as inherited and Override here without copied inherited facets
    When actual canonical editors save Approved <approved_value>, Review <review_value>, and Declined <declined_value> as sparse local expected-value facets
    Then production composes Shared Profile, ordered Page Groups, Confirmation Page, and the owning Flow Page-instance in order
    And compiled instance values are Approved <approved_value>, Review <review_value>, and Declined <declined_value> with every other inherited property retained
    And each save leaves canonical Confirmation Page bytes and both unrelated instance contributions byte-identical
    When actual controls reset Review confirmation_status to parents
    Then production deletes that local facet and Review compiles <parent_value> while Approved compiles <approved_value> and Declined compiles <declined_value>
    And the installed outline and selected-Flow documentation render three distinct instance contexts with those effective values

    Examples:
      | parent_value | approved_value | review_value  | declined_value |
      | pending      | approved       | manual_review | declined       |
