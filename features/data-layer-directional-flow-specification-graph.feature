Feature: Data layer directional Flow specification graph

  Background:
    Given Shop project contains Page Groups Checkout, Delivery, and Confirmation
    And Checkout owns Pages Cart and Payment, Delivery owns Page Shipping, and Confirmation owns Page Thank you
    And every Page definition identifies its context-setting observed event such as pageview
    And ungrouped Pages Landing and Campaign and interaction Events button_click, form_submit, add_shipping_info, add_payment_info, and purchase exist
    And Specification Flow Checkout journey is open

  # Data layer directional Flow specification graph 001
  Scenario: Data layer directional Flow specification graph 001
    When the main Flow workspace opens
    Then its toolbar exposes Page Groups, Pages, and Events component catalogs beside the canvas
    And the synchronized outline is a secondary projection in the main workspace
    And the Inspector may be closed without hiding any creation, placement, connection, or relationship-detail action
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
    And top-to-bottom lane positions are derived from that order without changing Page Group identities
    When the operator attempts to remove Checkout while it contains a Page frame
    Then removal is blocked without changing the Flow revision
    And guidance identifies the contained Page by name and offers Move Page frame or Remove Page frame

  # Data layer directional Flow specification graph 004
  Scenario: Data layer directional Flow specification graph 004
    Given selected membership permits Cart in Checkout and Shipping in Delivery
    When the operator searches Pages for Cart and inserts it into Checkout
    Then one Cart Page frame appears in the Checkout lane with stable Checkout and Cart references
    And the Pages catalog identifies Cart as a Checkout member
    And Cart represents its context-setting pageview event without a nested pageview occurrence
    When the operator tries to insert Shipping into Checkout
    Then the gesture is rejected because Shipping belongs to Delivery
    And no Page, Page Group, Flow, or frame reference changes
    And guidance opens Shipping Page Group membership without offering a free-form lane value

  # Data layer directional Flow specification graph 005
  Scenario Outline: Data layer directional Flow specification graph 005
    Given <page> Page frame is selected and has no occurrence of <event>
    And predefined Event <event> has optional trigger <trigger>
    When the operator <insertion>
    Then one <event> occurrence appears immediately inside <page> on the canvas and synchronized outline
    And <page> is identified as a context-setting Page event while <event> is identified as a nested interaction Event
    And canonical storage retains stable Page-frame, Page Group, Event, and occurrence references plus optional trigger <trigger>
    And Event creation, Event editing, catalog insertion, and occurrence detail expose no Documentary role selector
    And no Event definition or occurrence stores a context-setting or interaction role, Page-context binding, copied schema, or lane-name string

    Examples:
      | page     | event             | trigger           | insertion                                                     |
      | Cart     | button_click      | Continue clicked  | activates button_click from the Events catalog by pointer     |
      | Shipping | add_shipping_info | Form submitted    | drags add_shipping_info onto the visible canvas Shipping frame |
      | Payment  | add_payment_info  | Payment submitted | activates add_payment_info from the Events catalog by keyboard |

  # Data layer directional Flow specification graph 006
  Scenario: Data layer directional Flow specification graph 006
    Given Cart and Shipping Page frames are visible in their owning lanes
    When the operator searches Events for add_shipping_info
    And places it by pointer in Cart and by keyboard in Shipping
    Then the new interaction occurrences are
      | container | Event reference   | occurrence identity |
      | Cart      | add_shipping_info | distinct            |
      | Shipping  | add_shipping_info | distinct            |
    And both occurrences are visible in their Page frames and the synchronized outline
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
    Given button_click and add_payment_info are positioned inside Cart
    When pointer drag places them side by side at distinct free positions inside Cart
    Then Cart expands to retain both nodes without forcing either into a vertical list
    And their saved presentation coordinates match the chosen positions after reload
    When the operator changes add_payment_info Page frame from Cart to Payment
    Then impact preview identifies the Page effective-schema branch that will change
    When the operator confirms the Page change
    Then the same add_payment_info occurrence identity, Event reference, trigger, local schema contribution, and configured examples move into Payment
    And its effective schema recompiles from Payment Page-instance plus Event and occurrence contributions
    And Cart, Payment, the reusable Event definition, and every other occurrence remain byte-identical

  # Data layer directional Flow specification graph 009
  Scenario Outline: Data layer directional Flow specification graph 009
    Given Customer details, ID verification, Payment, and Confirmation Page frames expose left, right, top, and bottom connection ports
    And their contained Event occurrences expose no relationship ports
    When the operator drags from the <source> Page <source_port> port toward <target> Page
    Then a live directed preview follows the pointer and the <target> <target_port> port is highlighted as a valid target
    When the pointer is released on the <target> Page <target_port> port
    Then one relationship persists with kind <kind> and stable source Page-frame, target Page-frame, and relationship identities
    And <kind> is inferred from the source and target ports without a relationship-kind selector
    And the relationship persists without a label
    And the canvas renders its directed edge without requiring a source or target form
    And an inline relationship popover opens at the new edge

    Examples:
      | source           | source_port | target          | target_port | kind          |
      | Customer details | right       | Payment         | left        | expected_next |
      | Customer details | top         | ID verification | bottom      | alternative   |
      | ID verification  | bottom      | Payment         | top         | merge         |
      | Payment          | right       | Confirmation    | left        | expected_next |

  # Data layer directional Flow specification graph 010
  Scenario: Data layer directional Flow specification graph 010
    Given relationship drawing started from the Customer details Page right port
    When the pointer reaches the same Page frame, empty canvas, an incompatible target, or a port pairing other than right to left, top to bottom, or bottom to top
    Then that target is identified as invalid
    When the operator releases the pointer or presses Escape
    Then the preview is removed, focus returns to Customer details Page, and canonical state remains byte-identical
    And no incomplete relationship record exists

  # Data layer directional Flow specification graph 011
  Scenario: Data layer directional Flow specification graph 011
    Given four positioned Page frames form a fork-and-join candidate
    When the operator draws two top-to-bottom splits from Decision to the branch Pages and two bottom-to-top returns from those Pages to Confirmation
    Then the first two relationships have inferred kind alternative and the latter two have inferred kind merge
    And graph and outline show two alternative branches and their merge with exact directed endpoints
    When the operator labels one alternative relationship Fulfilment choice and leaves the other three relationships unlabelled
    Then the optional label, inferred kinds, documentation conditions, and expectations persist once
    And no Parallel kind or relationship-kind selector is available
    And the graph makes no claim that either branch or the complete Flow executed

  # Data layer directional Flow specification graph 012
  Scenario: Data layer directional Flow specification graph 012
    Given keyboard focus is on the Cart Page right port
    When Enter starts connection mode
    And Arrow keys move the target indicator to Payment Page
    And Enter creates the relationship
    Then the created relationship has inferred kind expected_next
    And the inline relationship popover receives focus for optional label and documentation editing without a kind selector
    When the operator leaves the label blank, saves, and presses Escape
    Then focus returns to the created edge in the canvas
    And exactly one relationship exists without requiring pointer input or Inspector controls

  # Data layer directional Flow specification graph 013
  Scenario: Data layer directional Flow specification graph 013
    Given add_payment_info is nested in Cart while the Inspector is closed
    When the operator selects add_payment_info
    Then canvas handles and an inline summary expose Move within Page, Change Page, Duplicate occurrence, Remove, and Open schema contribution
    And no Event occurrence action offers Connect or a relationship port
    And opening schema contribution uses the canonical schema editor in the main workspace
    When the operator returns to Flow
    Then the same node, viewport, and canvas position are restored
    When the optional Inspector is opened
    Then it shows contextual details without becoming the only route to any graph action

  # Data layer directional Flow specification graph 014
  Scenario: Data layer directional Flow specification graph 014
    Given a rename fixture has Page relationships and two Page-contained Event occurrences
    When Page Group Checkout is renamed Basket, Page Cart is renamed Basket page, and Event add_payment_info is renamed payment_details_added
    Then canvas, catalogs, popover, and outline show the new human names
    And stored Page Group, Page, Event, occurrence, trigger, and relationship values remain byte-for-byte stable
    When the Flow is reloaded
    Then lane order, Page-frame containment, free positions, selection, directed endpoints, and relationship meaning are unchanged

  # Data layer directional Flow specification graph 015
  Scenario: Data layer directional Flow specification graph 015
    Given a fresh Checkout journey has no lanes, frames, occurrences, or relationships
    And predefined Customer details, ID verification, Payment, Summary, and Confirmation Pages and their Events have configured examples
    When the operator uses only main-workspace controls to add Checkout as a horizontal Page Group lane
    And the operator lays out Customer details, Payment, Summary, and Confirmation from left to right
    And places ID verification above the space between Customer details and Payment
    And positions multiple Event occurrences side by side inside their Page frames
    And draws only Page-to-Page relationships including the ID verification branch and Payment merge
    And expands the schema-derived JSON examples on Payment Page and its add_payment_info occurrence
    And reloads the project with the Inspector closed
    Then the canvas and outline restore the horizontal main route, vertical alternative branch, Page-only endpoints, free Event positions, and both derived JSON examples
    And no fixed lane, Inspector-authored graph item, raw ID, copied Event schema, stored example JSON, or executable transition was created
    And per-Event payload validation remains independent while journey expectations remain manual

  # Data layer directional Flow specification graph 016
  Scenario: Data layer directional Flow specification graph 016
    Given the movement fixture places free Landing before the lanes, free Campaign after the lanes, and grouped Cart in Checkout
    When the operator moves Landing through the after-lanes edge affordance
    Then no domain identity referenced by Landing changes
    And only its presentation region and coordinates change from before-lanes to after-lanes
    When keyboard controls place Landing before the lanes again
    Then focus returns to Landing at its persisted left-side position
    When pointer controls place Cart through the before-lanes edge affordance
    Then Cart keeps its frame, Page, Event-occurrence, relationship, and ordered Page Group membership identities
    And Cart stores before-lanes and the chosen coordinates with no placement-group reference
    And Cart continues to derive its effective schema from its applicable Page Group memberships with visible provenance
    When keyboard controls move the Cart frame to Checkout
    Then Checkout becomes Cart's placement group without changing membership order or effective schema meaning
    When the Flow reloads
    Then free frames render only in their saved edge regions and never enter Page Group lane order or documentation lane headings

  # Data layer directional Flow specification graph 017
  Scenario: Data layer directional Flow specification graph 017
    Given a saved legacy Checkout journey binds context-setting pageview to Cart and contains button_click and form_submit nodes with documentary roles
    When the operator opens the journey after the occurrence-model upgrade
    Then migration review names Cart, its pageview context identity, and each interaction Event occurrence without exposing raw IDs
    When the operator confirms migration
    Then migration stores observed event name pageview directly on Cart Page identity and creates zero context occurrence records
    And every button_click and form_submit occurrence keeps its identity, Page-frame containment, position, Event reference, and optional trigger
    And those contained occurrences are interactions without a role field
    And canonical Page, Event, and Flow records contain no contextEventBindings, contextBindingId, or documentary role field
    And one page-scoped Undo restores the complete pre-migration Saved Draft

  # Data layer directional Flow specification graph 018
  Scenario: Data layer directional Flow specification graph 018
    Given the eligible-lane fixture has Cart memberships Checkout and Retail Checkout with those lanes selected beside Delivery
    When the operator starts dragging Cart from Pages
    Then Checkout and Retail Checkout identify valid Page-frame targets and Delivery identifies an invalid target
    When Cart is released in Retail Checkout
    Then one Cart frame stores Retail Checkout as its presentation lane and retains the complete ordered membership stack
    When keyboard controls move the Cart frame to Checkout
    Then the frame, contained Events, relationships, and membership references keep their identities
    And effective schema content, contribution order, and provenance remain unchanged
    And only the frame placement-group reference and presentation coordinates change
    And placing Cart in Delivery remains a no-op with guidance to add Delivery membership

  # Data layer directional Flow specification graph 019
  Scenario: Data layer directional Flow specification graph 019
    Given Cart is placed in Retail Checkout with membership order Checkout, Retail Checkout, and Trade Checkout
    When the operator moves Trade Checkout before Retail Checkout in the Page Group rule stack
    Then the Cart frame remains in the Retail Checkout lane while its effective schema recompiles in the new order
    When the operator attempts to remove Retail Checkout membership
    Then the membership command leaves canonical project bytes and revision unchanged
    And impact guidance names the Checkout journey Cart frame with Move to Checkout and Remove Page frame actions
    When the operator moves the frame to Checkout and removes Retail Checkout membership
    Then Cart retains ordered Checkout and Trade Checkout memberships with Checkout as its placement lane
    And Retail Checkout is no longer an eligible Cart lane
    And the result states the changed membership, affected schema targets, stale evidence, Draft status, and one Undo action

  # Data layer directional Flow specification graph 020
  Scenario: Data layer directional Flow specification graph 020
    Given Checkout and Delivery are selected Page Group lanes in that order
    And Checkout contains Customer details, ID verification, Payment, Summary, and Confirmation Page frames
    When the operator lays out Customer details, Payment, Summary, and Confirmation from left to right
    And places ID verification above the space between Customer details and Payment
    Then Checkout renders as a horizontal band above Delivery and expands vertically around the branch
    And the Page coordinates remain operator-authored rather than snapping into fixed columns or a vertical list
    When the operator draws the main-route edge from Customer details right port to Payment left port
    And routes the upper branch from Customer details top port through ID verification bottom and bottom ports into Payment top port
    And connects Payment to Summary to Confirmation
    Then the direct main route has kind expected_next, the upper branch has kind alternative, and its return to Payment has kind merge
    And the graph shows a directional split above the main route and a merge at Payment
    And compact Place before lanes and Place after lanes regions remain left and right of all named lane bands
    And reload preserves lane order, branch geometry, Page coordinates, and directed endpoints

  # Data layer directional Flow specification graph 021
  Scenario: Data layer directional Flow specification graph 021
    Given Product view occurrence receives effective configured examples
      | contributor              | property             | configured value |
      | Sitewide                 | page_type            | product_detail   |
      | Product detail Page      | product_id           | SKU-BASE         |
      | Product view Event       | event                | view_item         |
      | Product view occurrence  | product_id           | SKU-42           |
      | Product view occurrence  | ecommerce.currency   | EUR              |
    And required product_name has no configured example
    And effective quantity has number type
    When the operator expands the Product view Event example in its node
    Then the node shows Event name Product view and status Incomplete
    And its read-only formatted JSON contains effective values
      | path                   | value          | effective source         |
      | /event                 | view_item      | Product view Event       |
      | /page_type             | product_detail | Sitewide                 |
      | /product_id            | SKU-42         | Product view occurrence  |
      | /ecommerce/currency    | EUR            | Product view occurrence  |
    And ecommerce is assembled as a nested object while forbidden properties are omitted
    And product_name is listed outside the JSON with Edit examples linked to its exact schema-instance field
    When the operator configures Product view occurrence example product_name as Phone
    Then the derived JSON updates to Phone and status becomes Complete without storing a copied JSON payload
    When quantity example becomes string many against its effective number type
    Then status becomes Invalid with the quantity path and issue
    When an inherited schema conflict blocks Product view
    Then status becomes Blocked and the node does not claim that its example is valid

  # Data layer directional Flow specification graph 022
  Scenario: Data layer directional Flow specification graph 022
    Given a saved Flow contains labelled and unlabelled relationships with legacy kind parallel
    When the operator opens the Flow after the relationship-kind upgrade
    Then one migration changes every parallel relationship to alternative
    And relationship identities, Page-frame endpoints, groups, optional labels, conditions, expectations, and graph geometry remain unchanged
    And the upgraded Flow contains no parallel relationship kind

  # Data layer directional Flow specification graph 023
  Scenario Outline: Data layer directional Flow specification graph 023
    Given a <kind> relationship from <source> to <target> has <label_state>
    And its canvas edge is selected with the inline popover open and the Inspector closed
    Then the popover exposes a Delete relationship button named <accessible_name>
    When the operator activates Delete relationship
    Then that relationship is absent from the canvas, synchronized outline, and canonical Flow storage
    And its source, target, every other relationship, and their canonical identities remain unchanged
    And feedback names the deleted relationship, Draft status, stale documentation export, and one Undo action
    And deletion places keyboard focus on <source>
    When the operator activates Undo
    Then the same relationship identity, ports, kind, optional label, group, condition, and expectation are restored once
    And the restored edge receives keyboard focus

    Examples:
      | kind          | source           | target          | label_state          | accessible_name                                         |
      | expected_next | Customer details | Payment         | label Checkout route | Delete relationship Checkout route, Customer details to Payment |
      | alternative   | Customer details | ID verification | no label             | Delete relationship Customer details to ID verification |

  # Data layer directional Flow specification graph 024
  Scenario Outline: Data layer directional Flow specification graph 024
    Given Confirmation Page belongs to Checkout and inherits confirmation_status expected value <parent_value>
    And Decision Page has Approved, Review, and Declined alternative branch ends
    When the operator inserts Confirmation from the Pages catalog three times into Checkout
    And positions one Confirmation instance at each branch end
    And connects Decision top port to each Confirmation bottom port
    Then the Pages catalog remains available after every insertion
    And the Flow stores three Page instances with distinct stable frame identities used as their schema contributor identities
    And all three instances retain the same Confirmation Page and Checkout references
    And the three alternative relationships target those distinct frame identities rather than the shared Page identity
    When the operator opens the schema contribution for the Approved Confirmation instance
    Then the canonical editor shows <parent_value> as inherited and offers Override here without copying inherited facets
    When the operator saves Approved <approved_value>, Review <review_value>, and Declined <declined_value> as sparse local expected-value overrides
    Then each instance composes Shared Profile, ordered Page Groups, Confirmation Page, and that Flow Page-instance in order
    And each instance has its own effective confirmation_status value while every other inherited property remains effective
    And each save leaves Confirmation Page and the other two instance contributions byte-identical
    When the operator resets the Review instance confirmation_status to parents
    Then Review inherits <parent_value> while Approved remains <approved_value> and Declined remains <declined_value>
    And the synchronized outline and selected-Flow documentation distinguish all three instance contexts and effective values

    Examples:
      | parent_value | approved_value | review_value  | declined_value |
      | pending      | approved       | manual_review | declined       |

  # Data layer directional Flow specification graph 025
  Scenario: Data layer directional Flow specification graph 025
    Given Payment Page frame represents the context-setting pageview event
    And Payment Page frame receives effective configured examples
      | contributor          | property           | configured value |
      | Sitewide             | page_type          | checkout         |
      | Checkout Page Group  | form_name          | checkout         |
      | Payment Page         | form_step_name     | payment          |
      | Payment Page frame   | error_message      | Payment declined |
    And Payment example inputs omit mandatory page_name
    When the operator expands the Payment Page example in its frame
    Then the Page frame shows status Incomplete
    And read-only derived JSON contains page_type checkout, form_name checkout, form_step_name payment, and error_message Payment declined with effective-source provenance
    And the Incomplete repair identifies /page_name and opens the Payment Page-frame contribution
    When the Page-instance editor saves payment for page_name
    Then recomposition renders Complete with page_name payment and no persisted JSON payload
    And a type violation produces Invalid while an inherited conflict produces Blocked
    And contained Event occurrence JSON continues to add its Event and occurrence contributors after the Payment Page-instance branch
