# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-08-22T08:50:00.133133861Z","feature_name":"Data layer directional Flow specification graph","feature_path":"features/data-layer-directional-flow-specification-graph.feature","background_hash":"a96236892ad51ecb121bacee6b4454181bdf434f9b6c1780f92bb0f38a6b0012","implementation_hash":"sha256:c0baf12427082cf8dab8802247ce49c6c0757c137f5eec7bba540749f450ed56","scenarios":[{"index":27,"name":"Data layer directional Flow specification graph 028","scenario_hash":"10ee7c8f850bf8bde12d95b9904ef9b86e276a65cd31b29b0c2779b9517ff064","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-08-22T08:50:00.133133861Z"},{"index":28,"name":"Data layer directional Flow specification graph 029","scenario_hash":"e2aec7ce995d1a85969112277778e152e3069def72b5493cf8447b9df2355456","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-08-22T08:50:00.133133861Z"},{"index":47,"name":"Data layer directional Flow specification graph 048","scenario_hash":"c24047f18bf0599298540e0bd538e645e2e6def12c393c46d3ab64d18d58a5ec","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-08-22T08:50:00.133133861Z"},{"index":0,"name":"Data layer directional Flow specification graph 001","scenario_hash":"540d2802c19c9206c52c4255df2819f98809a78647e04438522c99c9f29ff5d8","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-08-12T16:43:55.556945026Z"},{"index":1,"name":"Data layer directional Flow specification graph 002","scenario_hash":"aafb999573d3557757521e79d4c9e6512fd8aae484a2b27dae181ae4e3611205","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-08-12T16:43:55.556945026Z"},{"index":4,"name":"Data layer directional Flow specification graph 005","scenario_hash":"5bb241c127e7ee7c4aaf9b067ad9de9dbd5cd282cc43ea30cc744f7dda9129c4","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-08-12T16:43:55.556945026Z"},{"index":8,"name":"Data layer directional Flow specification graph 009","scenario_hash":"fbe18755e692a17c95efaf73735a8b5a3f4b19bced4054bc77f3cf9d257e53c7","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-08-12T16:43:55.556945026Z"},{"index":9,"name":"Data layer directional Flow specification graph 010","scenario_hash":"99a0591cf2a753d954189c40ec247d1b87fd7afdf828dbd1541229c456f145b8","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-08-12T16:43:55.556945026Z"},{"index":18,"name":"Data layer directional Flow specification graph 019","scenario_hash":"051390e4dec2dd2ead42f0fc43e908307234004b42c6e2ad77fe7033d2ab354c","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-08-12T16:43:55.556945026Z"},{"index":19,"name":"Data layer directional Flow specification graph 020","scenario_hash":"c1117ffd296469d307f37a5cacc14fc39b5b66a18984f0bf9df49f854bbac5f4","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-08-12T16:43:55.556945026Z"},{"index":22,"name":"Data layer directional Flow specification graph 023","scenario_hash":"9712128a24c18cee64a7b001ea11980f578b48d0965d5560321231f5827e4799","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-08-12T16:43:55.556945026Z"},{"index":26,"name":"Data layer directional Flow specification graph 027","scenario_hash":"03368790bafa97db17ffccf81c89b8c9bbb30359b5bf5d591087b0b92fb0267a","mutation_count":40,"result":{"Total":40,"Killed":40,"Survived":0,"Errors":0},"tested_at":"2026-08-12T16:43:55.556945026Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer directional Flow specification graph

  Background:
    Given Shop project has Specification Flow Checkout journey open on its current Saved Draft
    And canonical Pages, interaction Events, and Property Sets are authored outside the Flow workspace

  # Data layer directional Flow specification graph 001
  Scenario Outline: Data layer directional Flow specification graph 001
    Given the viewport is <width> by <height>
    And project navigation has remembered <navigation> visibility
    And Checkout journey has a Cart Page instance
    When the main Flow workspace opens
    Then a bounded canvas is visible in the initial viewport without scrolling the outer document
    And the canvas left and right edges match the available Flow route while its top follows the compact toolbar and its bottom reaches the viewport bottom
    And no fixed height, maximum height, aspect ratio, or empty route region reduces that available canvas rectangle
    And Outline and Details are closed and reserve no canvas space
    And project navigation uses its remembered visibility without pushing the canvas below the initial viewport
    When the operator selects Cart, changes the viewport, and enters Focus Canvas
    Then project chrome is hidden while Add, camera controls, and Exit Focus remain immediately visible and operable
    And every required control hit target is contained by the viewport and toolbar before any horizontal toolbar scrolling
    And the canvas covers the complete viewport while those Focus Canvas controls overlay it without reserving canvas width or height
    And current selection and viewport remain unchanged
    When the operator exits Focus Canvas
    Then remembered navigation visibility and invoking focus are restored without changing selection or viewport
    And Structured executable flow remains separately labelled Advanced and does not duplicate the documentary graph

    Examples:
      | width | height | navigation |
      | 360   | 800    | hidden     |
      | 360   | 800    | visible    |
      | 1440  | 900    | hidden     |
      | 1440  | 900    | visible    |

  # Data layer directional Flow specification graph 002
  Scenario Outline: Data layer directional Flow specification graph 002
    Given the project contains <entity_count> available canonical Pages and interaction Events
    When the Flow opens with Add closed
    Then persistent canvas controls have a constant footprint independent of the entity count
    And no per-entity catalog, raw coordinate form, occurrence form, or relationship endpoint form precedes the canvas
    When the operator invokes Add at a canvas position
    Then one bounded searchable palette opens at that position with New Section, existing Pages, and existing Events
    And the palette renders a bounded result window rather than one permanent control per entity
    And existing Events are enabled only when a containing Page is selected or targeted
    When the operator chooses existing Page Cart
    Then one distinct Cart Flow Page instance is placed at the invocation position
    And the palette closes without changing the canonical Cart Page definition
    And Add offers no route to create a canonical Page or Event definition

    Examples:
      | entity_count |
      | 3            |
      | 300          |

  # Data layer directional Flow specification graph 003
  Scenario: Data layer directional Flow specification graph 003
    Given Product and Cart Page instances have independent canvas positions
    When the operator selects Product and creates Section Sales with Wrap selection
    And draws Section Checkout beside Sales and explicitly moves Cart into it
    Then both Sections retain stable Flow-owned identities and arbitrary two-dimensional bounds
    And each Page has explicit containment in exactly its chosen Section
    When the operator opens the context menu from Sales
    Then the Sales context menu exposes Rename, Move, Resize, Wrap selection, Remove Section, and Remove with contents without a raw geometry form
    When the operator moves Sales
    Then Product moves by the same offset while Cart remains fixed
    When the operator resizes Checkout across Product
    Then Checkout bounds change without capturing Product or releasing Cart
    And a Section cannot be contained by another Section
    And Section position, size, and presentation order do not change relationship topology or documentation order

  # Data layer directional Flow specification graph 004
  Scenario: Data layer directional Flow specification graph 004
    Given Sales and Checkout Sections exist and an unsectioned canvas position is available
    And Product, Cart, and Landing apply different ordered Property Sets
    When the operator inserts Product into Sales, Cart into Checkout, and Landing outside every Section
    Then all three placements are accepted independently of Property composition
    And each insertion creates one stable Flow Page instance at the chosen position
    And each Page frame represents its context-setting observed event without a nested context occurrence
    When the operator inserts Product into Checkout again
    Then a second Product instance is created with a distinct identity and the same canonical Page reference
    And no placement changes Property Set applications, effective schema, provenance, validation, or Assignment targets

  # Data layer directional Flow specification graph 005
  Scenario Outline: Data layer directional Flow specification graph 005
    Given <page> Page frame is selected and has no occurrence of <event>
    And predefined interaction Event <event> has optional trigger <trigger>
    When the operator <insertion>
    Then one <event> occurrence appears immediately inside <page> on the canvas
    And <page> remains the context-setting Page event while <event> is a nested interaction Event
    And canonical storage retains stable Page-frame, Event, and occurrence references plus optional trigger <trigger>
    And Event creation, editing, insertion, and occurrence detail expose no documentary role selector
    And no Event definition or occurrence stores a documentary role, Page-context binding, copied schema, or Section-name string

    Examples:
      | page     | event             | trigger           | insertion                                                   |
      | Cart     | button_click      | Continue clicked  | chooses button_click from Add by pointer                    |
      | Shipping | add_shipping_info | Form submitted    | drags add_shipping_info from Add onto Shipping              |
      | Payment  | add_payment_info  | Payment submitted | chooses add_payment_info from Add by keyboard               |

  # Data layer directional Flow specification graph 006
  Scenario: Data layer directional Flow specification graph 006
    Given Cart and Shipping Page frames are visible
    When the operator searches Add for add_shipping_info
    And places it by pointer in Cart and by keyboard in Shipping
    Then each Page contains one visible add_shipping_info occurrence with a distinct stable identity
    And the same reusable Event reference is used in both Page frames
    And neither Event definition, reusable schema, Page Property composition, nor the first occurrence changes

  # Data layer directional Flow specification graph 007
  Scenario: Data layer directional Flow specification graph 007
    Given Checkout Section contains Cart with Events and Page relationships
    When the operator opens the Checkout Section context menu and chooses Remove Section
    Then Cart, its Events, and its relationships remain at the same canvas positions outside every Section
    And only the Section and Cart containment reference are removed in one undoable Flow command
    When the operator undoes, reopens the Checkout Section context menu, and chooses Remove with contents
    Then named impact review identifies Checkout, Cart, its Events, and affected relationships before any write
    When the operator confirms the destructive action
    Then exactly the reviewed Section and contents are removed in one undoable Flow command
    And Undo restores their stable identities, containment, topology, and positions once

  # Data layer directional Flow specification graph 008
  Scenario: Data layer directional Flow specification graph 008
    Given button_click and add_payment_info are positioned inside Cart
    When the operator places them side by side at distinct free positions
    Then Cart expands to retain both mini-cards without forcing a vertical list
    And reload restores their chosen relative positions
    When the operator changes the containing Page of add_payment_info from Cart to Payment
    Then impact preview identifies the effective-schema branch that will change
    When the operator confirms the Page reassignment
    Then the occurrence identity, Event reference, trigger, sparse contribution, and configured examples move into Payment
    And the occurrence recompiles against Payment while both Pages, the reusable Event, and every sibling occurrence remain unchanged

  # Data layer directional Flow specification graph 009
  Scenario Outline: Data layer directional Flow specification graph 009
    Given the Page frames expose semantic left, right, top, and bottom connection ports
    And contained Event occurrences expose no relationship ports
    When the operator starts connecting <source> <source_port> toward <target>
    Then a live directed preview follows the gesture and identifies <target> <target_port> as valid
    When the operator commits on <target> <target_port>
    Then one relationship persists with stable identity, kind <kind>, Page-frame endpoints, and connected ports
    And <kind> is inferred from the semantic ports independently of visual edge routing
    And the directed edge renders without a source, target, or relationship-kind form
    And contextual relationship details open with an optional empty label

    Examples:
      | source           | source_port | target          | target_port | kind          |
      | Customer details | right       | Payment         | left        | expected_next |
      | Customer details | top         | ID verification | bottom      | alternative   |
      | ID verification  | bottom      | Payment         | top         | merge         |

  # Data layer directional Flow specification graph 010
  Scenario Outline: Data layer directional Flow specification graph 010
    Given connection drawing starts from Customer details <source_port> port
    When the operator releases the connection on empty canvas
    Then searchable existing-Page choices open at the release position without creating a partial relationship
    When the operator chooses Payment
    Then one Payment Page instance and one <kind> relationship using target <target_port> are created atomically at that position
    And one Undo removes both while preserving the canonical Payment Page
    When the operator repeats the gesture and cancels the Page choices
    Then focus returns to Customer details and canonical state remains unchanged
    When the operator targets the source Page, an Event, or an incompatible Page port
    Then the target is identified as invalid and release creates no relationship

    Examples:
      | source_port | target_port | kind          |
      | right       | left        | expected_next |
      | top         | bottom      | alternative   |
      | bottom      | top         | merge         |

  # Data layer directional Flow specification graph 011
  Scenario: Data layer directional Flow specification graph 011
    Given four positioned Page frames form a fork-and-join candidate
    When the operator draws two top-to-bottom splits from Decision to branch Pages
    And draws two bottom-to-top returns from those Pages to Confirmation
    Then the splits have kind alternative and the returns have kind merge
    And canvas and Outline show the exact directed branch and merge endpoints
    When one alternative receives label Fulfilment choice and the other relationships remain unlabelled
    Then labels, kinds, conditions, and expectations persist once
    And no Parallel kind or relationship-kind selector is available
    And the graph makes no claim that a branch or the Flow executed

  # Data layer directional Flow specification graph 012
  Scenario: Data layer directional Flow specification graph 012
    Given keyboard focus is on Cart right port
    When Enter starts connection mode
    And spatial navigation targets Payment left port
    And Enter creates the relationship
    Then the relationship has inferred kind expected_next
    And contextual details receive focus for optional documentation without a kind selector
    When the operator saves an empty label and presses Escape
    Then focus returns to the created edge
    And exactly one relationship exists without pointer input or an open Details surface

  # Data layer directional Flow specification graph 013
  Scenario: Data layer directional Flow specification graph 013
    Given Cart has Flow-specific name Basket, source Page Cart, status Incomplete, and two interaction Events
    When the canvas renders at normal zoom
    Then one compact Page card shows Basket prominently, Cart as subtle provenance, and Incomplete without expanded JSON
    And its Events render as compact mini-cards with name, optional trigger, and readiness
    And no duplicate pre-canvas Page card or list is rendered
    When the operator focuses or selects Basket
    Then semantic Page ports and a screen-sized toolbar expose Rename in Flow, Add Event, Connect, Duplicate, Details, Open schema contribution, and Remove
    When the operator selects an Event mini-card
    Then its toolbar exposes Move, Change Page, Duplicate, Details, Open schema contribution, and Remove without Connect
    And Details is optional contextual depth rather than the exclusive route to a graph command

  # Data layer directional Flow specification graph 014
  Scenario: Data layer directional Flow specification graph 014
    Given Sales Section contains Cart and add_payment_info with Page relationships
    When the operator renames Sales to Acquisition from its context menu
    And Cart Page is renamed Basket page and add_payment_info Event is renamed payment_details_added
    Then canvas, Add search, contextual details, and Outline show the current human names
    And stored Section, Page, Event, occurrence, trigger, and relationship identities remain unchanged
    When the Flow reloads
    Then Section containment, coordinates, selection, directed endpoints, and relationship meaning are unchanged

  # Data layer directional Flow specification graph 015
  Scenario: Data layer directional Flow specification graph 015
    Given a fresh Checkout journey has no Sections, Page instances, occurrences, or relationships
    And existing Customer details, ID verification, Payment, Summary, and Confirmation Pages have configured examples
    When the operator creates Sales and Checkout as side-by-side Sections from the canvas
    And explicitly places Customer details and ID verification in Sales and Payment, Summary, and Confirmation in Checkout
    And lays out the Pages left to right with ID verification above the main route
    And positions interaction Events side by side inside their Page cards
    And draws the Page-only main route, alternative branch, and merge across Section boundaries
    And opens Payment and add_payment_info derived examples in Details
    And reloads the project with Outline and Details closed
    Then the canvas restores the two-dimensional route, Page endpoints, Event positions, and readiness states
    And opening Details restores both derived examples without expanding canvas-card geometry
    And no raw geometry, endpoint form, copied schema, stored example JSON, Section-derived ordering, or executable transition was created

  # Data layer directional Flow specification graph 016
  Scenario: Data layer directional Flow specification graph 016
    Given Checkout journey has content wider and taller than its visible canvas
    And two offscreen Page instances are selected
    When the operator pans and zooms toward a chosen canvas point
    Then the canvas changes viewport without moving canonical graph items
    And a visible zoom percentage reports the resulting scale
    When the operator uses Zoom in, Zoom out, 100 percent, Fit Flow, Fit selection, and toggles and navigates the minimap
    Then each control produces the corresponding viewport result without changing selection identity
    When the operator leaves Checkout journey, opens another Flow, and returns
    Then Checkout restores its last viewport from project-scoped UI state
    And manual zoom stays between 25 and 200 percent while Fit Flow may use a lower scale to include all graph bounds
    And viewport, selection, navigation visibility, open surfaces, and minimap visibility are excluded from Saved Draft bytes, portable project data, Flow revisions, and Undo history

  # Data layer directional Flow specification graph 017
  Scenario: Data layer directional Flow specification graph 017
    Given a saved legacy journey binds context-setting pageview to Cart and contains button_click and form_submit nodes with documentary roles
    When the operator opens the journey after the occurrence-model upgrade
    Then migration review names Cart, its pageview identity, and each interaction occurrence without raw identities
    When the operator confirms migration
    Then pageview is stored directly on Cart Page identity with no context occurrence
    And every interaction occurrence retains its identity, Page containment, position, Event reference, and optional trigger without a role field
    And canonical Page, Event, and Flow records contain no context binding or documentary role field
    And one page-scoped Undo restores the complete pre-migration Saved Draft

  # Data layer directional Flow specification graph 018
  Scenario: Data layer directional Flow specification graph 018
    Given Outline is closed and reserves no canvas width
    When the operator opens Outline
    Then it projects Sections, their Page instances and Event occurrences, an Outside Sections group, and Page relationships from the same stable graph
    And Outline search can find an item that is outside the current viewport
    When the operator activates the search result
    Then the canvas pans to reveal and focus the exact item
    And selection changes in either projection synchronize without duplicating graph state
    When the operator closes Outline
    Then the canvas reclaims its space and focus returns to the invoking control

  # Data layer directional Flow specification graph 019
  Scenario Outline: Data layer directional Flow specification graph 019
    Given <scope> has several Page instances with authored positions and relationships
    When the operator previews Tidy <arrangement>
    Then the preview proposes new presentation positions and routed edges without a canonical write
    When the operator cancels the preview
    Then every Page position and relationship route remains unchanged
    When the operator previews Tidy <arrangement> again and confirms it
    Then one undoable presentation command applies the proposed Page positions
    And Page identities, Section containment, relationship endpoints and kinds, schema meaning, and documentation order remain unchanged
    And Tidy never runs automatically after another authoring action

    Examples:
      | scope            | arrangement  |
      | the selection    | horizontally |
      | the selection    | vertically   |
      | Checkout Section | horizontally |
      | Checkout Section | vertically   |

  # Data layer directional Flow specification graph 020
  Scenario Outline: Data layer directional Flow specification graph 020
    Given the Flow workspace is open at <width> by <height>
    When the operator uses Skip to canvas and navigates Sections, Pages, Events, ports, and relationships by keyboard
    Then focus order and spatial navigation are deterministic and every focused item has a visible labelled state
    And every pointer-only revealed action is also revealed by focus and operable without a pointer
    And the keyboard context-menu command opens the focused Section's action menu
    When Add, Outline, or Details opens
    Then it remains contained in the viewport and closing it restores invoking focus
    And canvas pan remains internal while the outer document has no horizontal or vertical overflow
    And status, containment, endpoints, and invalid targets are conveyed without relying on color

    Examples:
      | width | height |
      | 360   | 800    |
      | 1440  | 900    |

  # Data layer directional Flow specification graph 021
  Scenario: Data layer directional Flow specification graph 021
    Given Product view Event occurrence with trigger Viewed product is contained in Product detail Page
    And Product view receives effective configured examples
      | contributor             | property             | configured value |
      | Sitewide                | page_type            | product_detail   |
      | Product detail Page     | product_id           | SKU-BASE         |
      | Product view Event      | event                | view_item         |
      | Product view occurrence | product_id           | SKU-42           |
      | Product view occurrence | ecommerce.currency   | EUR              |
    And required product_name has no configured example while effective quantity has number type
    When the canvas is viewed at 25 percent zoom
    Then Product detail Page retains its Flow name while inner Event detail is omitted
    When the operator returns to normal zoom and selects Product view occurrence
    Then its Event mini-card shows Product view, Viewed product, and Incomplete
    When the operator opens contextual Event Details for Product view
    Then Product view Details render read-only occurrence JSON with effective values and provenance
      | path                | value          | effective source        |
      | /event              | view_item      | Product view Event      |
      | /page_type          | product_detail | Sitewide                |
      | /product_id         | SKU-42         | Product view occurrence |
      | /ecommerce/currency | EUR            | Product view occurrence |
    And ecommerce is nested while missing /product_name is outside the payload with an exact Edit examples route
    When the operator configures Product view product_name as Phone
    Then the mini-card and Details become Complete without storing copied JSON or changing card geometry
    When quantity is configured as string many against its effective number type
    Then Product view becomes Invalid and Details identify /quantity
    When an inherited schema conflict blocks Product view
    Then Product view readiness becomes Blocked without claiming a valid example

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
    When the operator selects its edge with Details closed
    Then a screen-sized relationship toolbar exposes Edit documentation and Delete relationship
    And Delete relationship is named <accessible_name>
    When the operator activates Delete relationship
    Then exactly that relationship is absent from canvas, Outline, and canonical Flow storage
    And its endpoints, every other relationship, and their identities remain unchanged
    And feedback names Draft status, stale documentation, and one Undo action while focus moves to <source>
    When the operator activates Undo
    Then the same relationship identity, ports, kind, optional label, group, condition, and expectation are restored once
    And the restored edge receives focus

    Examples:
      | kind          | source           | target          | label_state          | accessible_name                                                  |
      | expected_next | Customer details | Payment         | label Checkout route | Delete relationship Checkout route, Customer details to Payment |
      | alternative   | Customer details | ID verification | no label             | Delete relationship Customer details to ID verification         |

  # Data layer directional Flow specification graph 024
  Scenario: Data layer directional Flow specification graph 024
    Given Confirmation Page applies Checkout Property Set and inherits confirmation_status pending
    And Decision Page has Approved, Review, and Declined alternative branch ends
    When the operator inserts Confirmation into Checkout Section three times
    And positions one instance at each branch end
    And connects Decision top port to each Confirmation bottom port
    Then the Flow stores three distinct stable Page-instance contributor identities with one shared Confirmation Page reference
    And the relationships target those instance identities rather than the shared Page identity
    When the operator saves approved, manual_review, and declined as sparse instance overrides
    Then each instance composes Shared Profile, ordered Property Sets, Confirmation Page, and its Flow Page-instance
    And Checkout Section contributes no schema or provenance
    And each instance has its own effective confirmation_status while every other inherited property remains effective
    When the operator resets Review confirmation_status to parents
    Then Review inherits pending while Approved remains approved and Declined remains declined
    And Outline and selected-Flow documentation distinguish the three instance contexts

  # Data layer directional Flow specification graph 025
  Scenario: Data layer directional Flow specification graph 025
    Given Payment Page frame represents context-setting pageview and receives configured examples
      | contributor          | property       | configured value |
      | Sitewide             | page_type      | checkout         |
      | Checkout Property Set | form_name      | checkout         |
      | Payment Page         | form_step_name | payment          |
      | Payment Page frame   | error_message  | Payment declined |
    And mandatory page_name has no configured example
    When the canvas renders Payment
    Then its compact card shows Flow name, source Page, and Incomplete without rendering JSON
    When the operator opens contextual Page Details for Payment
    Then Payment Details render read-only context Page JSON with effective values and provenance
      | path            | value            | effective source      |
      | /page_type      | checkout         | Sitewide              |
      | /form_name      | checkout         | Checkout Property Set |
      | /form_step_name | payment          | Payment Page          |
      | /error_message  | Payment declined | Payment Page frame    |
    And missing /page_name is outside the payload with an exact Page-instance repair route
    When the Page-instance editor saves payment for page_name
    Then card readiness and Details become Complete with page_name payment and no persisted JSON payload
    And contained Event JSON extends the same Page branch with Event and occurrence contributors
    When form_step_name is configured with a value that violates its effective type
    Then Payment becomes Invalid and Details identify /form_step_name
    When an inherited schema conflict blocks Payment
    Then Payment readiness becomes Blocked without claiming a valid example

  # Data layer directional Flow specification graph 026
  Scenario: Data layer directional Flow specification graph 026
    Given Page Generic checkout page applies Checkout Property Set
    When the operator inserts Generic checkout page into Checkout Section four times
    And connects the four frames in insertion order
    Then all four cards initially show Generic checkout page without generated suffixes
    And each card offers an independent Rename in Flow action
    And the cards retain distinct stable identities with the same Generic checkout page reference
    When the operator names the first three instances Customer details, Payment, and Summary
    Then canvas, Outline, relationship controls, and contextual actions show those names and Generic checkout page
    And Add search and the Page editor continue to show Generic checkout page
    And no identity, Page reference, position, relationship, schema contribution, or configured value changes
    When Page Generic checkout page is renamed Reusable commerce page
    Then the unrenamed fourth instance follows Reusable commerce page while the three Flow-specific names remain
    When the operator resets Summary to its Page name
    Then only that instance changes to Reusable commerce page
    And the naming change marks affected Flow documentation stale and offers one Undo action

  # Data layer directional Flow specification graph 027
  Scenario Outline: Data layer directional Flow specification graph 027
    Given the Flow workspace is in <workspace_mode> with graph content beyond every canvas edge
    And no graph authoring tool is active
    When the operator <pan_gesture> by <horizontal_distance> CSS pixels horizontally and <vertical_distance> CSS pixels vertically
    Then the rendered graph translates by the same screen-space distances while the canvas reveals the corresponding offscreen region
    And canonical Section, Page, Event, and relationship coordinates remain unchanged
    And current selection remains unchanged while the gesture creates no Draft, revision, or Undo change
    When the operator ends the gesture and starts another pan
    Then camera movement resumes from the current viewport without snapping, fitting, or resetting zoom

    Examples:
      | workspace_mode      | pan_gesture                                      | horizontal_distance | vertical_distance |
      | the main workspace  | primary-drags from unoccupied canvas             | 120                 | 80                |
      | Focus Canvas        | primary-drags from unoccupied canvas             | -90                 | -60               |
      | the main workspace  | holds Space and primary-drags from a graph item  | 110                 | -70               |
      | Focus Canvas        | holds Space and primary-drags from a graph item  | -100                | 75                |
      | the main workspace  | middle-button-drags from unoccupied canvas       | 95                  | 65                |
      | Focus Canvas        | middle-button-drags from unoccupied canvas       | -85                 | -55               |
      | the main workspace  | uses one-finger touch pan                         | 105                 | -65               |
      | Focus Canvas        | uses one-finger touch pan                         | -95                 | 70                |
      | the main workspace  | uses the labelled keyboard pan command           | 80                  | 60                |
      | Focus Canvas        | uses the labelled keyboard pan command           | -80                 | -60               |

  # Data layer directional Flow specification graph 028
  Scenario Outline: Data layer directional Flow specification graph 028
    Given the canvas is at <zoom> percent zoom
    And pointer relationship drawing starts from <source> <source_port>
    When the pointer enters the snap halo around <target> <target_port> without touching the exact port
    Then the directed preview endpoint snaps to <target> <target_port>
    And only <target_port> is emphasized using an outline or shape change rather than color alone while <target>'s Page card remains unchanged
    And connection status names <target>, <target_port>, and inferred kind <kind>
    When the operator releases within that port's snap halo
    Then one relationship persists with stable identity, kind <kind>, Page-frame endpoints, and connected ports
    And no relationship endpoint, kind, canonical Page, or Event meaning was inferred from the enlarged port target

    Examples:
      | zoom | source           | source_port | target          | target_port | kind          |
      | 25   | Customer details | right       | Payment         | left        | expected_next |
      | 100  | Customer details | top         | ID verification | bottom      | alternative   |
      | 200  | ID verification  | bottom      | Payment         | top         | merge         |

  # Data layer directional Flow specification graph 029
  Scenario Outline: Data layer directional Flow specification graph 029
    Given the canvas is at <zoom> percent zoom
    And pointer relationship drawing starts from Customer details right port without highlighting an arbitrary target port
    And Payment and Summary left ports have non-overlapping snap halos
    When the pointer moves 24 CSS pixels from the center of Payment left port without touching it
    Then the preview endpoint remains snapped to Payment left port
    And only Payment left port shows valid-target feedback while the Payment Page card remains unchanged
    When the pointer moves 25 CSS pixels from that port center and is outside every port snap halo
    Then Payment's target highlights clear and the preview endpoint follows the pointer
    When the operator targets a Page body outside its port halos, the source Page, an Event, or an incompatible Page port
    Then no port snap is acquired and the direct target is identified as invalid
    When the pointer enters Summary left port's snap halo
    Then the preview and the only valid target highlights transfer to Summary left port without a relationship write
    When the connection is cancelled by <cancel_input>
    Then the preview and every valid or invalid target highlight clear
    And focus returns to Customer details right port without a Draft, revision, canonical state, or Undo change

    Examples:
      | zoom | cancel_input         |
      | 25   | Escape               |
      | 100  | pointer cancellation |
      | 200  | Escape               |

  # Data layer directional Flow specification graph 030
  Scenario Outline: Data layer directional Flow specification graph 030
    Given Checkout Section is <initial_width> by <initial_height> graph pixels with its corner resize handle visible
    When the operator presses that handle and the next pointer move jumps <horizontal_distance> graph pixels right and <vertical_distance> graph pixels down beyond the Section without an intermediate move inside it
    Then the visible Section bounds continue to follow the pointer outside the Section at <expected_width> by <expected_height> graph pixels
    When the operator releases the pointer at that outside position
    Then Checkout persists the same bounds in one undoable Flow command without requiring the pointer to return
    And Page containment and Page positions remain unchanged

    Examples:
      | initial_width | initial_height | horizontal_distance | vertical_distance | expected_width | expected_height |
      | 320           | 220            | 160                 | 100               | 480            | 320             |
      | 300           | 180            | 90                  | 140               | 390            | 320             |

  # Data layer directional Flow specification graph 031
  Scenario Outline: Data layer directional Flow specification graph 031
    Given Checkout Section is 500 by 440 graph pixels and contains distinct Cart and Summary Page instances
    And Cart is a 190 by 108 graph-pixel card placed 60 graph pixels from Checkout's left edge and <initial_top_offset> graph pixels from its top edge
    And the canvas is at <zoom> percent zoom
    When the operator drags Cart <vertical_pointer_distance> CSS pixels vertically from a fixed point on the card and releases within Checkout
    Then Cart follows the pointer to 60 graph pixels from Checkout's left edge and <expected_top_offset> graph pixels from its top edge without snapping after release
    And Cart's complete card remains inside Checkout at the chosen top, middle, or bottom position
    And Cart retains its Checkout membership at the persisted canvas position
    And one Undo restores Cart's initial position
    And Summary's position, every Section bound, relationship topology, and canonical Page and Event definitions remain unchanged

    Examples:
      | zoom | initial_top_offset | vertical_pointer_distance | expected_top_offset |
      | 50   | 300                | -130                      | 40                  |
      | 100  | 40                 | 120                       | 160                 |
      | 200  | 160                | 296                       | 308                 |

  # Data layer directional Flow specification graph 032
  Scenario: Data layer directional Flow specification graph 032
    Given Sales Section, Cart Page, add_payment_info Event, and Cart-to-Payment relationship are focusable canvas items
    And their complete contextual command sets are
      | item kind    | commands                                                                                           | editor commands         | destructive command |
      | Section      | Rename, Move, Resize, Wrap selection, Remove Section, Remove with contents                         | Rename                  | Remove with contents |
      | Page         | Rename in Flow, Add Event, Move, Connect, Duplicate, Details, Add visual, Open schema contribution, Remove     | Rename in Flow, Details, Add visual | Remove               |
      | Event        | Move, Change Page, Duplicate, Details, Add visual, Open schema contribution, Remove                            | Change Page, Details, Add visual    | Remove               |
      | Relationship | Edit documentation, Delete relationship                                                           | Edit documentation      | Delete relationship  |
    When keyboard focus visits each canvas item without activating it
    Then no action menu, editor, selection change, or focus transfer occurs
    When the operator selects each item in turn by primary click or Enter or Space
    Then only that item becomes selected and a nonmodal contextual toolbar exposes its labelled Actions menu button without moving focus from the item
    When the operator opens each item's actions through secondary click, Shift+F10, the Context Menu key, or its Actions menu button
    Then every entry point exposes the same ordered command set declared for that item
    And the menu contains commands rather than embedded editor fields, places its item-destructive command last, and remains inside the visible canvas viewport
    And opening or dismissing the menu creates no Draft, revision, canonical state, or Undo change
    When the operator dismisses an open menu with Escape
    Then focus returns to the invoking canvas item or Actions menu button while selection remains unchanged
    When the operator reopens the menu and activates each declared editor command
    Then the menu closes and a separate contextual editor opens for that item with focus on its first control

  # Data layer directional Flow specification graph 033
  Scenario Outline: Data layer directional Flow specification graph 033
    Given Checkout journey is at 100 percent zoom in <workspace_mode>
    And Cart is selected and the pointer is over a measured point on its visible canvas card
    When the operator sends <zoom_input> with vertical delta <vertical_delta>
    Then the viewport scale <direction> while the same Cart graph point remains beneath the pointer
    And the visible zoom percentage changes in the same direction without moving the outer document
    And focus, selection, canonical graph coordinates, Draft, revision, and Undo remain unchanged
    When the operator repeats that zoom input beyond its matching manual limit
    Then the camera stops at <limit> percent
    When wheel input occurs over a Flow contextual menu or editor, outside the canvas, or with no vertical delta
    Then the camera remains unchanged and that input retains native scrolling
    And touch pinch and visible camera controls retain their existing behavior

    Examples:
      | workspace_mode     | zoom_input                                  | vertical_delta | direction | limit |
      | the main workspace | an unmodified mouse-wheel event             | -120           | increases | 200   |
      | the main workspace | a browser-delivered laptop trackpad pinch   | 80             | decreases | 25    |
      | Focus Canvas       | an unmodified mouse-wheel event             | 120            | decreases | 25    |
      | Focus Canvas       | a browser-delivered laptop trackpad pinch   | -80            | increases | 200   |

  # Data layer directional Flow specification graph 034
  Scenario Outline: Data layer directional Flow specification graph 034
    Given <target> has no concept visual and is the only selected Flow item
    When an image is pasted while the canvas rather than a visual editor owns focus
    Then no visual attachment, Draft, revision, or Undo change occurs
    When the operator opens <target>'s Actions menu and chooses Add visual
    Then the menu closes and a separate contextual Visual editor opens with focus on its paste and drop target
    And Paste image, Choose image file, a preview, Description, Caption, Source reference, Save, and Cancel are keyboard operable
    When the operator <input_route> a readable <image_type> image
    Then the editor shows the complete validated original image that will be stored without cropping or exposing its encoded bytes
    And staging the image changes no project or history state
    When the operator attempts to save a blank Description
    Then Save remains unavailable and the editor identifies Description as required
    When the operator enters <description>, <caption>, and <source_reference> and saves
    Then <target> owns exactly one primary concept-visual attachment with that contextual metadata
    And the project stores one stable original raster asset with media type, intrinsic dimensions, byte length, and content digest
    And the reusable Page and Event definitions, graph topology, item position, and current visual-display mode remain unchanged
    And the saved item offers View visual, Edit visual, Replace visual, and Remove visual while one Undo removes the attachment

    Examples:
      | target                            | input_route                          | image_type | description                    | caption                 | source_reference       |
      | Cart Page instance                | pastes from the clipboard            | PNG        | Cart after address completion  | Checkout review         | a Figma design URL     |
      | add_payment_info Event occurrence | chooses through the file picker      | JPEG       | Payment form after submission  | no caption              | a live-site URL        |
      | Cart Page instance                | drops on the editor target           | WebP       | Mobile Cart concept            | Responsive concept      | no source reference    |

  # Data layer directional Flow specification graph 035
  Scenario: Data layer directional Flow specification graph 035
    Given Cart Page instance and add_payment_info Event occurrence each have a concept visual
    And Checkout journey and Returns journey have independent remembered visual-display modes
    When Checkout journey opens for the first time
    Then Badges is its selected visual-display mode
    And each attached item shows a labelled visual indicator without changing Page, Event, Section, or relationship geometry
    When the operator changes Checkout to Thumbnails
    Then each attached item shows a fixed 16-to-10 preview containing its complete image without cropping or distortion
    And presentation bounds and relationship anchors include the preview without moving stored item coordinates or invoking Tidy
    When the operator zooms Checkout to its distant semantic-detail level
    Then thumbnail pixels collapse to labelled badges while the selected mode remains Thumbnails
    When the operator changes Checkout to Hidden
    Then no canvas badge or thumbnail remains while each item's View visual action stays available
    And Returns retains its own mode while reopening Checkout restores Hidden
    And every mode change leaves project bytes, Draft, revision, documentation freshness, and Undo history unchanged
    When the operator activates View visual for Cart
    Then a named modal viewer opens with Cart's complete image, Description, optional Caption, fixed Fit, 100 percent, current-scale, zoom, pan, and visible Close controls
    And focus moves inside the viewer while background Flow controls are inert
    When the operator closes the viewer with Escape
    Then focus returns to the exact View visual invoker without changing selection or project state

  # Data layer directional Flow specification graph 036
  Scenario Outline: Data layer directional Flow specification graph 036
    Given Cart Page instance has a saved valid concept visual
    And the Visual editor is staging a replacement without changing the saved attachment
    When image validation receives <invalid_image>
    Then the editor reports <diagnostic>
    And the saved visual, its asset identity, attachment metadata, preview, and context-menu actions remain unchanged
    And no orphan asset, Draft, revision, documentation-staleness, or Undo change is created

    Examples:
      | invalid_image                                                     | diagnostic                                      |
      | an SVG file                                                       | Choose a PNG, JPEG, or WebP image                |
      | an animated GIF file                                              | Choose a PNG, JPEG, or WebP image                |
      | a file that cannot be read or decoded                             | The visual could not be read                     |
      | a file declared as PNG whose signature is not PNG                 | Choose a valid PNG image                         |
      | a source image larger than 5 MiB                                  | The visual is too large                          |
      | a decodable image wider than 4096 pixels                          | The visual dimensions exceed 4096 pixels         |
      | a decodable image within 4096 pixels per side but above 16 megapixels | The visual exceeds 16 megapixels               |
      | an image whose save exceeds available durable storage             | This project does not have enough durable storage for this visual |

  # Data layer directional Flow specification graph 037
  Scenario: Data layer directional Flow specification graph 037
    Given one project asset has two Flow-local attachment references with different descriptions
    Then the project stores one raster asset and two independent contextual attachments referencing it
    When the operator duplicates Cart
    Then the duplicate has a distinct Page-instance and attachment identity referencing the same asset with copied contextual metadata
    When the operator edits only the duplicate's Description
    Then Cart and add_payment_info retain their descriptions and no image bytes are duplicated
    When the Flow is saved and reopened
    Then every attachment, asset reference, description, caption, source reference, and decodable image remains exact
    When the operator removes the duplicate and add_payment_info visuals
    Then the shared asset remains stored for Cart and both removals are undoable
    When the operator removes Cart's last reference
    Then the unreferenced asset bytes are removed in that same transaction
    When the operator undoes the last removal
    Then the same asset and attachment identities, bytes, metadata, and Cart viewer are restored
    And canonical Page and Event definitions, Flow topology, positions, and visual-display mode remain unchanged throughout

  # Data layer directional Flow specification graph 038
  Scenario Outline: Data layer directional Flow specification graph 038
    Given Cart Page instance has a <image_dimensions> concept visual with Description, Caption, and Source reference
    And the viewport is <width> by <height>
    When the operator activates View visual for Cart
    Then the named modal viewer is contained by the visible viewport without scrolling the outer document
    And its visible heading, Close button, Fit, 100 percent, Zoom out, current scale, and Zoom in controls remain outside the image pan surface
    And those controls remain fully visible without scrolling the dialog, image canvas, or toolbar
    And a scrollbar-free image canvas consumes the viewer space not used by its fixed controls and bounded metadata
    And Fit initially centers Cart's complete image without cropping, distortion, or enlargement above actual size
    And the current scale reports the image's actual displayed percentage rather than a multiplier relative to Fit
    And Description, Caption, and Source reference remain available without moving the fixed controls or entering the image pan surface

    Examples:
      | width | height | image_dimensions   |
      | 360   | 800    | 4096 by 1600 pixels |
      | 1440  | 900    | 1600 by 4096 pixels |

  # Data layer directional Flow specification graph 039
  Scenario Outline: Data layer directional Flow specification graph 039
    Given Cart's concept-visual viewer is open in Fit with its image centered
    When the operator uses <zoom_route> to zoom in
    Then the actual displayed scale increases toward but never beyond 400 percent
    When the operator uses the same <zoom_route> family to zoom out
    Then the actual displayed scale decreases toward but never below Fit
    And both scale changes keep the image point under <zoom_anchor> at that anchor
    And unavailable zoom directions are disabled at their bounds
    And Flow camera, selection, project bytes, Draft, revision, and Undo history remain unchanged

    Examples:
      | zoom_route                     | zoom_anchor             |
      | toolbar controls               | the image-canvas center |
      | keyboard shortcuts             | the image-canvas center |
      | a modified wheel over Cart     | the pointer over Cart   |
      | a pinch gesture around Cart    | the gesture midpoint    |

  # Data layer directional Flow specification graph 040
  Scenario Outline: Data layer directional Flow specification graph 040
    Given Cart's concept-visual viewer is open away from Fit and 100 percent
    When the operator requests 100 percent through <actual_size_route>
    Then one image pixel occupies one CSS pixel and the image is centered
    When the operator requests Fit through <fit_route>
    Then the complete image is centered and contained again
    And Flow camera, selection, project bytes, Draft, revision, and Undo history remain unchanged

    Examples:
      | actual_size_route          | fit_route     |
      | the visible toolbar control | its Fit control |
      | the 1 keyboard shortcut     | the 0 shortcut  |

  # Data layer directional Flow specification graph 041
  Scenario: Data layer directional Flow specification graph 041
    Given Cart's concept-visual viewer is zoomed until its image exceeds the canvas on both axes
    When the operator mouse-drags or one-finger-drags the image
    Then the image follows that pointer on both axes with a grab interaction
    When the operator uses two-axis trackpad scrolling or the labelled arrow-key commands
    Then the viewport pans across the image in the requested horizontal and vertical directions
    And labelled Pan up, Pan down, Pan left, and Pan right controls provide single-click alternatives to every drag direction
    And each pan route stops at the image bounds without exposing empty space or losing the image
    And a non-overflowing image axis remains centered while its pan controls are unavailable
    And no horizontal or vertical scrollbar appears in the dialog or image canvas
    And Flow camera, selection, project bytes, Draft, revision, and Undo history remain unchanged

  # Data layer directional Flow specification graph 042
  Scenario Outline: Data layer directional Flow specification graph 042
    Given Cart's concept-visual viewer was opened from its exact View visual invoker
    When a pointer starts inside the viewer and ends on its backdrop
    Then the viewer remains open because that gesture was not a backdrop click
    When the operator closes the viewer through <close_route>
    Then the viewer closes and the background Flow workspace becomes operable
    And focus returns to the exact View visual invoker
    And Flow camera, selection, project bytes, Draft, revision, and Undo history remain unchanged

    Examples:
      | close_route                                      |
      | activates the visible Close button               |
      | presses Escape                                   |
      | presses and releases wholly on the dim backdrop  |

  # Data layer directional Flow specification graph 043
  Scenario Outline: Data layer directional Flow specification graph 043
    Given <target> is selected and focused at a recorded canvas position
    When the operator presses the primary mouse button on <target>, moves no farther than 3 CSS pixels, and releases
    Then <target> remains selected and focused without starting or committing a drag
    And its canvas position and presentation remain unchanged
    When the operator performs one secondary-pointer press, context-menu request, and release on <target>
    Then exactly <target>'s contextual menu remains open after release with its first command focused
    And no drag feedback, pointer-owned item movement, or canvas-position change occurs
    And the save status never enters Saving while Draft, revision, canonical project state, and Undo remain unchanged
    When the operator dismisses an open menu with Escape
    Then focus returns to the exact <target> invoker

    Examples:
      | target                                      |
      | Cart Page instance                          |
      | add_payment_info Event contained by Cart    |
      | purchase Event outside every Page instance  |

  # Data layer directional Flow specification graph 044
  Scenario Outline: Data layer directional Flow specification graph 044
    Given <target> Details is open with its surface scroll position and canvas position recorded
    And any committing control has a new valid staged value
    When the operator presses and releases the primary pointer on <control>
    Then only <effect> occurs
    And Details remains open at the same scroll position without starting or committing a parent item drag
    And focus remains on <focus_target>
    And the interaction creates <command_count> project commands without changing Flow topology or item position
    And the save status enters Saving exactly <command_count> times

    Examples:
      | target                                   | control                         | effect                                        | focus_target             | command_count |
      | Cart Page instance                       | Name in this Flow input         | the input receives caret focus                | that input               | 0             |
      | Cart Page instance                       | Derived JSON example disclosure | the JSON, provenance, and issues are revealed | that disclosure          | 0             |
      | Cart Page instance                       | Save Name in this Flow          | the entered Flow-local name is saved once     | its rendered replacement | 1             |
      | add_payment_info Event contained by Cart | Example value input             | the input receives caret focus                | that input               | 0             |
      | add_payment_info Event contained by Cart | Save example                    | the entered example value is saved once       | its rendered replacement | 1             |

  # Data layer directional Flow specification graph 045
  Scenario Outline: Data layer directional Flow specification graph 045
    Given <target> Details is open from its exact invoker at a recorded canvas position
    When the operator presses and releases the primary pointer on <control>
    Then <destination> opens exactly once with focus on <focus_target>
    And no parent item drag, move command, or canvas-position change occurs
    And the save status never enters Saving while Draft, revision, canonical project state, and Undo remain unchanged

    Examples:
      | target                                   | control                      | destination                                        | focus_target                    |
      | Cart Page instance                       | Open schema contribution     | its Page-frame schema contribution editor          | its first editor control        |
      | incomplete Cart Page instance            | Open Page-frame contribution | its missing property's schema contribution editor | the missing property's control |
      | add_payment_info Event contained by Cart | Edit examples                | its missing property's occurrence example editor  | the missing example control     |

  # Data layer directional Flow specification graph 046
  Scenario Outline: Data layer directional Flow specification graph 046
    Given <target> schema contribution editor is open from Checkout journey
    And the current Flow, contributor identity, canonical project state, Draft revision, and Undo depth are recorded
    When the operator leaves the Flow editor by activating <destination> without using Return to Flow
    Then the schema contribution editor closes and <destination> becomes the visible operable workspace with focus in its route
    And no stale Page-instance or Event-occurrence contributor context is rendered in the destination
    And the message Initialize the canonical contribution before editing is absent
    And navigation creates no project command and preserves the recorded canonical project state, Draft revision, and Undo depth
    When the operator navigates back to Checkout journey without refreshing the browser
    Then the Flow workspace is operable and the recorded Flow and contributor identities remain unchanged
    When the operator opens the same <target> schema contribution again
    Then its composed-schema workspace opens once for the same contributor and Return to Flow remains operable

    Examples:
      | target                                    | destination                    |
      | Cart Page instance                        | Applicability collection       |
      | add_payment_info Event contained by Cart  | Shared Profiles collection     |
      | Cart Page instance                        | Project overview               |
      | add_payment_info Event contained by Cart  | Documentation                  |
      | Cart Page instance                        | another Flow                   |

  # Data layer directional Flow specification graph 047
  Scenario Outline: Data layer directional Flow specification graph 047
    Given <target> schema contribution editor is open from Checkout journey
    And its property content places Return to Flow below the visible editor route at the upper scroll limit
    And the originating Flow camera, contributor identity, canonical project state, Draft revision, and Undo depth are recorded
    When the operator advances through the schema editor using <downward_input>
    Then exactly one vertical scroll owner in the visible schema editor route moves downward
    And Return to Flow becomes visible and keyboard operable at the lower scroll limit
    And the outer document does not scroll while the recorded Flow camera remains unchanged
    When the operator returns through the schema editor using <upward_input>
    Then the same scroll owner returns to its upper limit with the first schema property control visible and keyboard operable
    And the editor remains open for the same <target> contributor while canonical project state, Draft revision, and Undo depth remain unchanged

    Examples:
      | target                                   | downward_input                      | upward_input                      |
      | Cart Page instance                       | repeated downward mouse-wheel input | repeated upward mouse-wheel input |
      | add_payment_info Event contained by Cart | repeated Page Down keys              | repeated Page Up keys             |

  # Data layer directional Flow specification graph 048
  Scenario Outline: Data layer directional Flow specification graph 048
    Given <target> effective schema requires string properties <first_path> and <second_path>
    And configured examples set <first_value> at <first_path> and <second_value> at <second_path>
    When the operator expands <target> Derived JSON example disclosure in contextual Details
    Then the read-only payload is structurally equal to <expected_json>
    And validation resolves the examples at <first_concrete_path> and <second_concrete_path> with Complete readiness
    And each wildcard item segment produces one array whose example item retains both sibling values
    And no derived object contains a property named *
    And the Flow stores no copied JSON payload

    Examples:
      | target                                   | first_path                           | second_path                        | first_value | second_value | first_concrete_path                    | second_concrete_path                | expected_json                                                        |
      | Cart Page instance                       | /products/*/product_name             | /products/*/product_id             | test        | SKU-42       | /products/0/product_name               | /products/0/product_id              | {"products":[{"product_name":"test","product_id":"SKU-42"}]} |
      | add_payment_info Event contained by Cart | /groups/*/products/*/product_name    | /groups/*/products/*/product_id    | nested test | SKU-99       | /groups/0/products/0/product_name      | /groups/0/products/0/product_id     | {"groups":[{"products":[{"product_name":"nested test","product_id":"SKU-99"}]}]} |

  # Data layer directional Flow specification graph 049
  Scenario Outline: Data layer directional Flow specification graph 049
    Given <target> has no concept visual and Checkout uses Badges visual-display mode
    And the next concept-visual Draft save remains unsettled after accepting the image
    When the operator saves a valid PNG described as <description>
    When the operator changes Checkout to Thumbnails
    Then <target> shows an operable Preparing preview placeholder and labelled fallback badge while the save remains unsettled
    When <pending_invoker> receives operator activation
    Then the named viewer opens with the complete just-saved image and <description>
    When the operator closes the viewer and the matching Saved Draft settles
    Then the placeholder resolves without further input to a contained 16-to-10 preview for the same asset
    And no unavailable-original error or unhandled promise rejection occurs
    And reloading Checkout preserves the same attachment, original image bytes, and ready preview
    And the project stores one original body and at most one disposable thumbnail for the asset
    And changing visual-display mode creates no additional Draft or Undo entry

    Examples:
      | target                                    | description                     | pending_invoker          |
      | Cart Page instance                        | Cart save-settlement visual     | Preparing preview        |
      | add_payment_info Event contained by Cart  | Payment save-settlement visual  | the labelled visual badge |
