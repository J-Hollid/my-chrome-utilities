Feature: Data layer directional Flow specification graph runtime

  Background:
    Given the built extension is running with the production project repository and Specification Flow editor
    And production canonical Pages, interaction Events, and Property Sets are authored outside the Flow workspace

  # Data layer directional Flow specification graph runtime 001
  Scenario Outline: Data layer directional Flow specification graph runtime 001
    Given the browser viewport is <width> by <height>
    And project-navigation UI state is <navigation>
    And production Checkout journey has a Cart Page frame
    When actual controls open Checkout journey
    Then the installed canvas bounding rectangle intersects the initial viewport without document scrolling
    And its left and right edges equal the measured Flow-route content edges, its top edge equals the compact toolbar bottom, and its bottom edge equals the viewport bottom
    And no installed fixed height, maximum height, aspect ratio, or empty Flow-route track reduces that rectangle
    And closed Outline and Details surfaces are absent from layout
    And project navigation matches saved UI state without displacing the canvas below the viewport
    When actual controls select Cart, set a non-default camera transform, and enter Focus Canvas
    Then measured project chrome disappears while installed Add, camera, and Exit Focus controls remain operable
    And the installed canvas bounding rectangle equals <width> by <height> at viewport origin while Focus Canvas controls overlay it without consuming layout space
    And production selection ID and camera transform remain unchanged
    When actual controls exit Focus Canvas
    Then saved project-navigation visibility and invoking document focus return without changing selection or camera
    And the installed Advanced structured-flow route remains separate from the documentary graph

    Examples:
      | width | height | navigation |
      | 360   | 800    | hidden     |
      | 360   | 800    | visible    |
      | 1440  | 900    | hidden     |
      | 1440  | 900    | visible    |

  # Data layer directional Flow specification graph runtime 002
  Scenario Outline: Data layer directional Flow specification graph runtime 002
    Given the production repository exposes <entity_count> available Page and Event definitions
    When the built Flow route renders with Add closed
    Then persistent canvas control count and measured footprint equal the small-fixture baseline
    And no entity catalog, coordinate form, occurrence form, or endpoint form precedes the canvas in document order
    When actual controls invoke Add at a measured canvas point
    Then one bounded palette opens at that point with New Section and searchable existing Page and Event results
    And its result viewport does not exceed the same configured maximum height
    And Event results are enabled only while a containing Page is selected or targeted
    When actual controls choose existing Page Cart
    Then production stores one new Cart frame at the invoked graph coordinates and closes the palette
    And serialized Cart Page definition remains byte-identical
    And the installed Add surface has no Create Page or Create Event command

    Examples:
      | entity_count |
      | 3            |
      | 300          |

  # Data layer directional Flow specification graph runtime 003
  Scenario: Data layer directional Flow specification graph runtime 003
    Given production Product and Cart frames have independent coordinates
    When actual controls select Product and create Sales with Wrap selection
    And actual pointer controls draw Checkout beside Sales and explicitly move Cart into it
    Then canonical Flow state contains two stable Section IDs with independent x, y, width, and height values
    And Product and Cart each store the explicit selected Section reference
    When actual controls select Sales
    Then the installed Section toolbar exposes Rename, Move, Resize, Wrap selection, Remove Section, and Remove with contents without numeric geometry inputs
    When actual pointer controls move Sales
    Then stored Product coordinates change by the same delta while Cart coordinates are byte-identical
    When actual resize handles cross Product with the Checkout boundary
    Then only Checkout bounds change and both Page Section references remain byte-identical
    And production rejects Section nesting without a canonical write
    And Section geometry and order leave relationship and documentation-order evidence unchanged

  # Data layer directional Flow specification graph runtime 004
  Scenario: Data layer directional Flow specification graph runtime 004
    Given production Sales and Checkout Sections exist and an unsectioned graph position is available
    And Product, Cart, and Landing have different Property Set applications
    When actual Add controls place Product in Sales, Cart in Checkout, and Landing outside Sections
    Then production accepts all three placements and stores distinct Page-frame identities and chosen coordinates
    And each installed Page card represents its Page observed-event identity without a context occurrence
    When actual Add controls place Product in Checkout again
    Then production stores a second Product frame ID with the same Page ID
    And serialized Property Set applications, effective schemas, provenance, validation, and Assignment targets remain byte-identical

  # Data layer directional Flow specification graph runtime 005
  Scenario Outline: Data layer directional Flow specification graph runtime 005
    Given rendered <page> is selected without an occurrence of <event>
    And production Event <event> carries optional trigger <trigger>
    When actual controls <insertion>
    Then one installed <event> mini-card appears immediately inside <page>
    And accessibility state identifies <page> as the context-setting Page and <event> as an interaction
    And production stores stable Page-frame, Event, and occurrence IDs plus optional trigger <trigger>
    And installed Event-definition and occurrence routes expose no documentary role control
    And serialized Event and occurrence records contain no documentary-role, Page-context-binding, copied-schema, or Section-name key

    Examples:
      | page     | event             | trigger           | insertion                                              |
      | Cart     | button_click      | Continue clicked  | choose button_click from Add by pointer                |
      | Shipping | add_shipping_info | Form submitted    | drag add_shipping_info from Add onto Shipping          |
      | Payment  | add_payment_info  | Payment submitted | choose add_payment_info from Add by keyboard           |

  # Data layer directional Flow specification graph runtime 006
  Scenario: Data layer directional Flow specification graph runtime 006
    Given installed Cart and Shipping Page cards are visible
    When actual controls search Add for add_shipping_info
    And use pointer placement in Cart and keyboard placement in Shipping
    Then production stores two occurrence IDs with one shared Event ID and different Page-frame IDs
    And both installed mini-cards are visible in their containing Pages
    And canonical Event definition, Page Property composition, reusable schema, and the first occurrence remain byte-identical

  # Data layer directional Flow specification graph runtime 007
  Scenario: Data layer directional Flow specification graph runtime 007
    Given production Checkout Section contains Cart, its occurrences, and connected relationships
    When actual controls activate Remove Section
    Then production removes only Checkout and Cart's Section reference while retaining graph coordinates and topology
    And one Undo entry restores Checkout and its containment exactly once
    When actual controls undo and activate Remove with contents
    Then installed impact review names Checkout, Cart, its occurrences, and affected relationships before storage changes
    When actual controls confirm Section content removal
    Then production removes exactly the reviewed graph records in one command
    And actual Undo restores their original IDs, containment, endpoints, and coordinates once

  # Data layer directional Flow specification graph runtime 008
  Scenario: Data layer directional Flow specification graph runtime 008
    Given installed button_click and add_payment_info mini-cards are inside Cart
    When actual pointer controls position them side by side
    Then measured Cart bounds contain both and production stores distinct relative coordinates
    And a built-extension reload reproduces those positions
    When actual Change Page controls choose Payment for add_payment_info
    Then installed impact review identifies the new effective-schema branch before mutation
    When actual controls confirm Page reassignment
    Then production preserves occurrence ID, Event ID, trigger, sparse contribution, and examples while changing its Page-frame ID
    And compiled Payment occurrence changes while both Page definitions, reusable Event, and sibling occurrences remain byte-identical

  # Data layer directional Flow specification graph runtime 009
  Scenario Outline: Data layer directional Flow specification graph runtime 009
    Given installed Page cards expose labelled left, right, top, and bottom ports while Event mini-cards expose none
    When actual pointer events drag from <source> <source_port> toward <target>
    Then a temporary directed edge follows the pointer and <target> <target_port> renders valid state
    When pointerup occurs on <target> <target_port>
    Then production stores one stable relationship ID with kind <kind>, Page-frame endpoint IDs, and semantic port values
    And changing routed edge geometry leaves inferred kind <kind> unchanged
    And the installed directed edge was created without a source, target, or kind form
    And its contextual details open with no required label value

    Examples:
      | source           | source_port | target          | target_port | kind          |
      | Customer details | right       | Payment         | left        | expected_next |
      | Customer details | top         | ID verification | bottom      | alternative   |
      | ID verification  | bottom      | Payment         | top         | merge         |

  # Data layer directional Flow specification graph runtime 010
  Scenario Outline: Data layer directional Flow specification graph runtime 010
    Given production connection mode starts from Customer details <source_port> port
    When pointerup occurs on empty canvas
    Then an existing-Page search surface opens at the release coordinates with no partial relationship record
    When actual controls choose Payment
    Then one command stores a new Payment frame and one <kind> edge using target <target_port> at those coordinates
    And actual Undo removes both records while the canonical Payment Page remains byte-identical
    When the same gesture is repeated and the search surface is cancelled
    Then document focus returns to Customer details and canonical project bytes remain identical
    When actual pointer events target Customer details, an Event mini-card, or an incompatible Page port
    Then installed invalid state renders and pointerup produces no relationship write

    Examples:
      | source_port | target_port | kind          |
      | right       | left        | expected_next |
      | top         | bottom      | alternative   |
      | bottom      | top         | merge         |

  # Data layer directional Flow specification graph runtime 011
  Scenario: Data layer directional Flow specification graph runtime 011
    Given four production Page frames form a fork-and-join candidate
    When actual pointer events draw two top-to-bottom splits from Decision and two bottom-to-top returns to Confirmation
    Then production stores two alternative and two merge relationships with exact Page-frame endpoints
    And installed canvas and Outline render the same branch and merge topology
    When actual controls label one alternative Fulfilment choice and leave the other edges unlabelled
    Then canonical labels, kinds, conditions, and expectations persist once
    And no installed control or serialized record offers a distinct Parallel kind
    And no production output claims graph execution

  # Data layer directional Flow specification graph runtime 012
  Scenario: Data layer directional Flow specification graph runtime 012
    Given document focus is on Cart right port
    When Enter starts installed connection mode
    And spatial keyboard controls target Payment left port
    And Enter commits the edge
    Then production stores one expected_next relationship inferred from those ports
    And contextual relationship details receive document focus without a kind selector
    When actual controls save an absent label and press Escape
    Then document focus returns to the installed edge
    And production contains exactly one relationship without pointer input or an open Details drawer

  # Data layer directional Flow specification graph runtime 013
  Scenario: Data layer directional Flow specification graph runtime 013
    Given production Cart frame is named Basket in this Flow, has source Page Cart, status Incomplete, and two occurrences
    When the installed canvas renders at 100 percent
    Then one compact Page card renders Basket, subdued Cart provenance, and Incomplete without JSON
    And its compact Event cards render names, optional triggers, and readiness without a duplicate Page list
    When actual pointer hover, keyboard focus, or selection targets Basket
    Then labelled semantic ports and an unscaled toolbar expose Rename in Flow, Add Event, Connect, Duplicate, Details, Open schema contribution, and Remove
    When actual controls select an Event card
    Then its unscaled toolbar exposes Move, Change Page, Duplicate, Details, Open schema contribution, and Remove without Connect
    And closing Details leaves every graph command reachable from installed contextual controls

  # Data layer directional Flow specification graph runtime 014
  Scenario: Data layer directional Flow specification graph runtime 014
    Given production Sales contains Cart and add_payment_info with Page relationships
    When actual collection controls rename Sales to Acquisition, Cart to Basket page, and add_payment_info to payment_details_added
    Then installed canvas, Add results, Details, and Outline render the current names
    And canonical Section, Page, Event, occurrence, trigger, and relationship IDs remain byte-identical
    When the built extension reloads
    Then stored containment, coordinates, selection UI state, endpoints, and inferred kinds are restored

  # Data layer directional Flow specification graph runtime 015
  Scenario: Data layer directional Flow specification graph runtime 015
    Given production Checkout journey has no Section, Page-frame, occurrence, or relationship records
    And canonical Customer details, ID verification, Payment, Summary, and Confirmation Pages have examples
    When actual canvas controls create side-by-side Sales and Checkout Sections
    And explicitly place Customer details and ID verification in Sales and Payment, Summary, and Confirmation in Checkout
    And place the Pages left to right with ID verification above the main route
    And position interaction Event cards side by side inside Page cards
    And draw the Page-only main route, alternative branch, and merge across Sections
    And open Payment and add_payment_info examples in Details
    And reload the built extension with Outline and Details closed
    Then measured canvas geometry restores the two-dimensional route, Page endpoints, Event positions, and readiness
    And reopening Details renders both examples without changing Page-card bounds
    And serialized state contains no raw-form artifact, copied schema, example payload, Section-derived order, or executable transition

  # Data layer directional Flow specification graph runtime 016
  Scenario: Data layer directional Flow specification graph runtime 016
    Given production graph bounds exceed the visible canvas in both axes
    And two offscreen Page-frame IDs are selected
    When actual Space-drag, middle-button drag, touch-pan, and keyboard camera inputs change the viewport
    And modifier-wheel and pinch inputs zoom toward a measured canvas point
    Then installed camera transform changes without changing stored graph-item coordinates
    And the visible percentage reports the resulting camera scale
    When actual controls use Zoom in, Zoom out, 100 percent, Fit Flow, Fit selection, and minimap toggle and navigation
    Then measured viewport results match each command while selected graph identity remains stable
    When actual controls switch Flows and return to Checkout
    Then project-scoped UI state restores Checkout camera transform
    And manual camera percentage stays between 25 and 200 while Fit Flow may use a lower scale to include measured graph bounds
    And Saved Draft and portable export bytes, Flow revision, and Undo depth exclude camera, selection, navigation visibility, open surfaces, and minimap visibility

  # Data layer directional Flow specification graph runtime 017
  Scenario: Data layer directional Flow specification graph runtime 017
    Given production migration input binds pageview to Cart and gives button_click and form_submit documentary roles
    When the built extension opens that legacy journey
    Then installed migration review renders human Page, observed-event, and interaction names without raw IDs
    When actual controls confirm migration
    Then Cart stores pageview directly and no context occurrence record exists
    And production preserves interaction occurrence IDs, Page-frame IDs, coordinates, Event IDs, and optional triggers without role keys
    And serialized Page, Event, and Flow records have no context-binding or documentary-role key
    When one page-scoped Undo reverses the migration
    Then production storage equals the complete pre-migration Saved Draft

  # Data layer directional Flow specification graph runtime 018
  Scenario: Data layer directional Flow specification graph runtime 018
    Given installed Outline is closed and its bounding box reserves no width
    When actual controls open Outline
    Then one tree projects Sections, nested Page instances and occurrences, Outside Sections, and Page relationships from canonical IDs
    And installed Outline search finds an item beyond the current viewport
    When actual controls activate that result
    Then the camera pans to reveal it and document focus moves to its exact canvas element
    And selecting either projection updates one shared selection identity
    When actual controls close Outline
    Then measured canvas width grows into the released space and focus returns to the Outline toggle

  # Data layer directional Flow specification graph runtime 019
  Scenario Outline: Data layer directional Flow specification graph runtime 019
    Given production <scope> has Page frames with saved positions and relationships
    When actual controls preview Tidy <arrangement>
    Then installed ghost positions and routed-edge previews render without changing canonical bytes
    When actual controls cancel
    Then measured Page transforms and edge routes equal the saved values
    When actual controls preview Tidy <arrangement> again and confirm
    Then one production Undo entry stores the presentation-position command
    And Page IDs, Section references, relationship endpoints and kinds, effective schemas, and documentation order remain byte-identical
    And subsequent authoring controls do not invoke Tidy implicitly

    Examples:
      | scope            | arrangement  |
      | selection        | horizontally |
      | selection        | vertically   |
      | Checkout Section | horizontally |
      | Checkout Section | vertically   |

  # Data layer directional Flow specification graph runtime 020
  Scenario Outline: Data layer directional Flow specification graph runtime 020
    Given the browser viewport is <width> by <height> with the Flow route installed
    When actual controls activate Skip to canvas and keyboard-navigate Sections, Pages, Events, ports, and edges
    Then focus traversal and spatial targets follow a deterministic order with visible accessible names
    And controls revealed by pointer hover are also rendered by keyboard focus and can be activated
    When actual controls open and close Add, Outline, and Details
    Then each surface stays within viewport bounds and closing restores its invoking element
    And internal canvas navigation changes only its camera while document scroll width and height do not exceed the viewport
    And accessibility state names readiness, containment, endpoints, and invalid targets without color-only meaning

    Examples:
      | width | height |
      | 360   | 800    |
      | 1440  | 900    |

  # Data layer directional Flow specification graph runtime 021
  Scenario: Data layer directional Flow specification graph runtime 021
    Given production Product view occurrence with trigger Viewed product is contained in Product detail Page
    And production effective example inputs are
      | contributor             | property             | configured value |
      | Sitewide                | page_type            | product_detail   |
      | Product detail Page     | product_id           | SKU-BASE         |
      | Product view Event      | event                | view_item         |
      | Product view occurrence | product_id           | SKU-42           |
      | Product view occurrence | ecommerce.currency   | EUR              |
    And required product_name lacks an example while effective quantity has number type
    When actual zoom controls set 25 percent
    Then the installed Product detail Page card retains its Flow name while occurrence interiors are suppressed
    When actual controls return to 100 percent and select Product view occurrence
    Then its mini-card renders Product view, Viewed product, and Incomplete
    When actual controls open contextual Event Details for Product view
    Then installed Product view Details render parsed occurrence JSON with effective values and sources
      | path                | value          | effective source        |
      | /event              | view_item      | Product view Event      |
      | /page_type          | product_detail | Sitewide                |
      | /product_id         | SKU-42         | Product view occurrence |
      | /ecommerce/currency | EUR            | Product view occurrence |
    And ecommerce is nested while /product_name renders outside the payload with its exact editor target
    When actual schema controls save Product view product_name Phone
    Then installed mini-card and Details render Complete without a payload copy or geometry change
    When production quantity example is string many against number type
    Then installed readiness is Invalid and Details identify /quantity
    When a production inherited conflict blocks Product view
    Then installed Product view readiness is Blocked without valid-example state

  # Data layer directional Flow specification graph runtime 022
  Scenario: Data layer directional Flow specification graph runtime 022
    Given production migration input has labelled and unlabelled relationships with kind parallel
    When the built extension opens the owning Flow
    Then one repository migration changes every persisted parallel kind to alternative
    And production relationship IDs, Page-frame endpoints, groups, labels, conditions, expectations, and coordinates equal pre-upgrade values
    And no serialized relationship retains kind parallel

  # Data layer directional Flow specification graph runtime 023
  Scenario Outline: Data layer directional Flow specification graph runtime 023
    Given production has a <kind> relationship from <source> to <target> with <label_state>
    When actual pointer or keyboard controls select its edge with Details closed
    Then an unscaled toolbar renders Edit documentation and Delete relationship
    And its delete button accessible name is <accessible_name>
    When actual controls activate Delete relationship
    Then the selected edge, Outline item, and canonical relationship record are absent
    And production endpoints, every other relationship, and their stable IDs remain byte-identical
    And installed feedback reports Draft state, stale documentation, and one Undo while focus moves to <source>
    When actual Undo runs once
    Then production restores the same relationship ID, ports, kind, optional label, group, condition, and expectation once
    And document focus is the restored edge

    Examples:
      | kind          | source           | target          | label_state          | accessible_name                                                  |
      | expected_next | Customer details | Payment         | label Checkout route | Delete relationship Checkout route, Customer details to Payment |
      | alternative   | Customer details | ID verification | no label             | Delete relationship Customer details to ID verification         |

  # Data layer directional Flow specification graph runtime 024
  Scenario: Data layer directional Flow specification graph runtime 024
    Given production Confirmation Page applies Checkout Property Set and inherits confirmation_status pending
    And production Decision Page has Approved, Review, and Declined branch ends
    When actual controls insert Confirmation into Checkout Section three times and connect all three from Decision
    Then production stores three Page-frame contributor IDs with one shared Confirmation Page ID
    And each relationship targets a distinct frame ID
    When actual schema controls save approved, manual_review, and declined as sparse instance overrides
    Then compilation orders Shared Profile, Property Sets, Confirmation Page, and owning Flow Page-instance
    And Checkout Section is absent from compiled contributors and provenance
    And the three effective confirmation_status values differ while unrelated inherited properties remain
    When actual controls reset Review confirmation_status to parents
    Then Review compiles pending while Approved compiles approved and Declined compiles declined
    And installed Outline and selected-Flow documentation distinguish all three contexts

  # Data layer directional Flow specification graph runtime 025
  Scenario: Data layer directional Flow specification graph runtime 025
    Given production Payment Page frame represents pageview and receives configured examples
      | contributor           | property       | configured value |
      | Sitewide              | page_type      | checkout         |
      | Checkout Property Set | form_name      | checkout         |
      | Payment Page          | form_step_name | payment          |
      | Payment Page frame    | error_message  | Payment declined |
    And mandatory page_name lacks a configured example
    When the installed canvas renders Payment
    Then its compact card shows Flow name, source Page, and Incomplete without JSON content
    When actual controls open contextual Page Details for Payment
    Then installed Payment Details render parsed context Page JSON with effective values and sources
      | path            | value            | effective source      |
      | /page_type      | checkout         | Sitewide              |
      | /form_name      | checkout         | Checkout Property Set |
      | /form_step_name | payment          | Payment Page          |
      | /error_message  | Payment declined | Payment Page frame    |
    And /page_name renders outside the payload with its exact Page-instance editor target
    When the production Page-instance editor saves page_name payment
    Then installed card and Details render Complete with payment and serialized Flow contains no JSON payload copy
    And the Event occurrence compiler extends the same Page branch with Event and occurrence contributors
    When production form_step_name violates its effective type
    Then installed Payment readiness is Invalid and Details identify /form_step_name
    When a production inherited conflict blocks Payment
    Then installed Payment readiness is Blocked without valid-example state

  # Data layer directional Flow specification graph runtime 026
  Scenario: Data layer directional Flow specification graph runtime 026
    Given production Page Generic checkout page applies Checkout Property Set
    When actual controls insert Generic checkout page into Checkout Section four times and connect the frames in order
    Then all four cards render Generic checkout page without generated suffixes
    And each card exposes an independent Rename in Flow action with a distinct frame ID and shared Page ID
    When actual controls name the first three instances Customer details, Payment, and Summary
    Then installed canvas, Outline, relationship controls, and contextual actions render those names and Generic checkout page
    And installed Add results and Page editor retain Generic checkout page
    And canonical identities, positions, relationships, schema contributions, and configured values remain byte-identical
    When actual Page controls rename Generic checkout page to Reusable commerce page
    Then the fourth card follows Reusable commerce page while all Flow-specific names remain
    When actual controls reset Summary to its Page name
    Then only that card changes to Reusable commerce page
    And production marks affected Flow documentation stale with one Undo entry

  # Data layer directional Flow specification graph runtime 027
  Scenario Outline: Data layer directional Flow specification graph runtime 027
    Given production Checkout journey is rendered in <workspace_mode> with graph bounds beyond every canvas edge
    And no production graph authoring tool is active
    When actual input <pan_gesture> by <horizontal_distance> CSS pixels horizontally and <vertical_distance> CSS pixels vertically
    Then the installed camera translation changes by the same screen-space distances and exposes the corresponding offscreen graph region
    And serialized Section, Page-frame, Event-occurrence, and relationship coordinates remain byte-identical
    And production selection, Saved Draft bytes, Flow revision, and Undo depth remain unchanged
    When actual input ends and repeats a nonzero pan
    Then the camera continues from its current translation with the same zoom and without invoking Fit Flow

    Examples:
      | workspace_mode     | pan_gesture                                           | horizontal_distance | vertical_distance |
      | the main workspace | sends primary-pointer drag from empty canvas          | 120                 | 80                |
      | Focus Canvas       | sends primary-pointer drag from empty canvas          | -90                 | -60               |
      | the main workspace | sends Space plus primary-pointer drag from a Page card | 110                 | -70               |
      | Focus Canvas       | sends Space plus primary-pointer drag from a Page card | -100                | 75                |
      | the main workspace | sends auxiliary-pointer drag from empty canvas        | 95                  | 65                |
      | Focus Canvas       | sends auxiliary-pointer drag from empty canvas        | -85                 | -55               |
      | the main workspace | sends one-contact touch pan                            | 105                 | -65               |
      | Focus Canvas       | sends one-contact touch pan                            | -95                 | 70                |
      | the main workspace | activates the labelled keyboard pan command           | 80                  | 60                |
      | Focus Canvas       | activates the labelled keyboard pan command           | -80                 | -60               |
