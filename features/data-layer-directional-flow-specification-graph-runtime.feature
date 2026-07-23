Feature: Data layer directional Flow specification graph runtime

  Background:
    Given the built extension is running with the production project repository and Specification Flow editor
    And production Shop contains Checkout, Delivery, Confirmation, Cart, Payment, Shipping, Thank you, and Landing definitions
    And production Pages identify context-setting observed events such as pageview
    And the Events catalog contains only interactions including button_click, form_submit, add_shipping_info, add_payment_info, and purchase

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
    And the frame represents Cart's context-setting pageview event with no nested pageview occurrence
    When the Shipping component is released over the production Checkout lane
    Then the production gesture is rejected because Shipping belongs to Delivery
    And project bytes and revision remain unchanged
    And installed guidance opens Shipping membership without a free-form lane control

  # Data layer directional Flow specification graph runtime 005
  Scenario Outline: Data layer directional Flow specification graph runtime 005
    Given the production <page> Page frame is selected and has no <event> occurrence
    And production Event <event> has optional trigger <trigger>
    When the installed Events catalog performs <insertion>
    Then one rendered <event> occurrence appears inside <page> on the SVG canvas and synchronized outline
    And rendered node kinds are context-setting Page event <page> and nested interaction Event <event>
    And canonical storage contains stable Page-frame, Page Group, Event, and occurrence IDs plus optional trigger <trigger>
    And production Event creation, Event editing, catalog insertion, and occurrence detail contain no Documentary role selector
    And serialized Event definitions and occurrences contain no role, context binding, copied schema, or lane-name key

    Examples:
      | page     | event             | trigger           | insertion                                                         |
      | Cart     | button_click      | Continue clicked  | activate button_click from the Events catalog by pointer          |
      | Shipping | add_shipping_info | Form submitted    | drag add_shipping_info onto the visible SVG Shipping frame        |
      | Payment  | add_payment_info  | Payment submitted | activate add_payment_info from the Events catalog by keyboard     |

  # Data layer directional Flow specification graph runtime 006
  Scenario: Data layer directional Flow specification graph runtime 006
    Given production Cart and Shipping frames are rendered in their owning lanes
    When actual Events search finds add_shipping_info
    And production pointer and keyboard controls place it in Cart and Shipping
    Then canonical interaction records are
      | container | Event ID          | occurrence ID |
      | Cart      | add_shipping_info | distinct      |
      | Shipping  | add_shipping_info | distinct      |
    And both installed occurrences render in their Page frames and the synchronized outline
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
    Given production Cart contains button_click and add_payment_info nodes
    When actual pointer drags place both nodes side by side at distinct positions inside Cart
    Then the installed Cart frame expands without rendering a forced vertical Event list
    And reload renders both saved coordinate pairs
    When the installed occurrence Page selector changes add_payment_info from Cart to Payment
    Then production impact preview names the changed Page effective-schema branch
    When the installed impact review approves Page reassignment
    Then production preserves the occurrence ID, Event ID, trigger, local schema contribution, and examples under Payment frame ID
    And the compiler receives Payment Page-instance, Event, and occurrence contributors
    And unrelated canonical entities remain byte-identical

  # Data layer directional Flow specification graph runtime 009
  Scenario Outline: Data layer directional Flow specification graph runtime 009
    Given production Customer details, ID verification, Payment, and Confirmation Page frames expose four relationship ports
    And installed Event occurrences expose no relationship port
    When actual pointer events drag from the <source> Page <source_port> port toward <target> Page
    Then a temporary directed SVG edge follows the pointer and the <target> <target_port> port renders valid state
    When pointerup occurs on the <target> Page <target_port> port
    Then production storage contains one relationship with kind <kind>, stable Page-frame endpoints, and relationship ID
    And production infers <kind> from the source and target ports without rendering a relationship-kind selector
    And canonical relationship storage has no label value
    And the installed canvas renders that edge without submitting a source or target form
    And a rendered inline relationship popover opens beside the edge

    Examples:
      | source           | source_port | target          | target_port | kind          |
      | Customer details | right       | Payment         | left        | expected_next |
      | Customer details | top         | ID verification | bottom      | alternative   |
      | ID verification  | bottom      | Payment         | top         | merge         |
      | Payment          | right       | Confirmation    | left        | expected_next |

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
    Given four production Page frames form a fork-and-join candidate
    When actual pointer events draw two top-to-bottom splits from Decision to branch Pages and two bottom-to-top returns from those Pages to Confirmation
    Then the first two production relationships have inferred kind alternative and the latter two have inferred kind merge
    And installed canvas and outline render the exact two alternative branches and merge endpoints
    When actual controls label one alternative relationship Fulfilment choice and leave the other three relationships unlabelled
    Then canonical relationships persist the optional label, inferred kinds, conditions, and expectations once
    And the installed editor exposes no Parallel kind or relationship-kind selector
    And no production graph state or output claims execution of a branch or complete Flow

  # Data layer directional Flow specification graph runtime 012
  Scenario: Data layer directional Flow specification graph runtime 012
    Given actual keyboard focus is on the Cart Page right port
    When Enter starts installed connection mode
    And Arrow keys target Payment Page
    And Enter commits the edge
    Then the production relationship has inferred kind expected_next
    And the production inline popover receives focus for optional label and documentation editing without a kind selector
    When actual controls leave the label blank, save, and press Escape
    Then focus returns to the created SVG edge
    And production storage contains exactly one relationship without pointer or Inspector input

  # Data layer directional Flow specification graph runtime 013
  Scenario: Data layer directional Flow specification graph runtime 013
    Given rendered add_payment_info remains nested in Cart with the Inspector closed
    When actual controls select add_payment_info
    Then installed canvas handles and inline summary expose Move within Page, Change Page, Duplicate occurrence, Remove, and Open schema contribution
    And production renders no Event relationship port or Connect action
    And Open schema contribution routes to the production canonical editor in the main workspace
    When actual controls return to Flow
    Then selected node, viewport, and canvas coordinates are restored
    When the optional Inspector opens
    Then it renders contextual detail without owning an exclusive graph command

  # Data layer directional Flow specification graph runtime 014
  Scenario: Data layer directional Flow specification graph runtime 014
    Given the production rename fixture has Page relationships and two contained Event interactions
    When actual collection controls rename Checkout to Basket, Cart to Basket page, and add_payment_info to payment_details_added
    Then installed canvas, catalogs, popover, and outline render the new names
    And canonical Page Group, Page, Event, occurrence, relationship, and trigger values remain byte-identical
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
    And actual ports create only Page relationships including the identity branch and Payment merge
    And installed controls expand the Payment Page and add_payment_info occurrence derived JSON examples
    And the installed extension reloads with the Inspector closed
    Then production canvas and outline restore horizontal route, vertical branch, Page endpoints, Event coordinates, and both derived JSON examples
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
    Given the production migration fixture binds context-setting pageview to Cart and contains button_click and form_submit nodes with documentary roles
    When the built extension opens that Checkout journey
    Then installed migration review renders Cart, its pageview context identity, and each interaction occurrence without raw IDs
    When actual controls confirm migration
    Then migrated Cart storage carries observed event name pageview on its Page record and occurrence records exclude that identity
    And migration preserves topology and layout plus the original button_click and form_submit occurrence identities
    And migrated interaction occurrences directly store Event IDs and optional triggers without role keys
    And serialized production Page, Event, and Flow records have no contextEventBindings, contextBindingId, or documentary role key
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
    And production relationship IDs, Page-frame endpoints, groups, optional labels, conditions, expectations, and coordinates equal their pre-upgrade values
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

  # Data layer directional Flow specification graph runtime 025
  Scenario: Data layer directional Flow specification graph runtime 025
    Given production Payment Page frame represents context-setting pageview
    And it has inherited and local configured examples plus one missing required page_name
    When actual controls expand its Page example
    Then installed status is Incomplete
    And rendered read-only JSON contains effective page_type, form_name, form_step_name, and error_message values with contributor provenance
    And the missing page_name repair opens the exact Payment Page-instance schema field
    When actual controls save page_name payment on that instance
    Then production renders Complete with page_name payment without a stored JSON payload
    And production renders Invalid for a typed example violation and Blocked for an unresolved inherited conflict
    And the contained Event example compiler input extends the same Page branch with Event and occurrence contributors
