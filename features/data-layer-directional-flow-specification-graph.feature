# mutation-stamp: sha256=abc7eec415f8ee61097410d857e9b60995e20c406945e995fcd403305642a590
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-08-05T14:24:24.235397872Z","feature_name":"Data layer directional Flow specification graph","feature_path":"features/data-layer-directional-flow-specification-graph.feature","background_hash":"a96236892ad51ecb121bacee6b4454181bdf434f9b6c1780f92bb0f38a6b0012","implementation_hash":"sha256:4aa132c85291209a6e46f94b65b22c08082c7b426dffe575c60db743c86c95c2","scenarios":[{"index":0,"name":"Data layer directional Flow specification graph 001","scenario_hash":"dd6d8cc954d1e930b41901f0b63971b3c10a42d2a92e6f1eff53a923a6869f6b","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-08-05T14:24:24.235397872Z"},{"index":1,"name":"Data layer directional Flow specification graph 002","scenario_hash":"aafb999573d3557757521e79d4c9e6512fd8aae484a2b27dae181ae4e3611205","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-08-05T14:24:24.235397872Z"},{"index":4,"name":"Data layer directional Flow specification graph 005","scenario_hash":"5bb241c127e7ee7c4aaf9b067ad9de9dbd5cd282cc43ea30cc744f7dda9129c4","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-08-05T14:24:24.235397872Z"},{"index":8,"name":"Data layer directional Flow specification graph 009","scenario_hash":"fbe18755e692a17c95efaf73735a8b5a3f4b19bced4054bc77f3cf9d257e53c7","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-08-05T14:24:24.235397872Z"},{"index":9,"name":"Data layer directional Flow specification graph 010","scenario_hash":"99a0591cf2a753d954189c40ec247d1b87fd7afdf828dbd1541229c456f145b8","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-08-05T14:24:24.235397872Z"},{"index":18,"name":"Data layer directional Flow specification graph 019","scenario_hash":"051390e4dec2dd2ead42f0fc43e908307234004b42c6e2ad77fe7033d2ab354c","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-08-05T14:24:24.235397872Z"},{"index":19,"name":"Data layer directional Flow specification graph 020","scenario_hash":"3548bc1cd0b56502bb2751c886b3fc2a9c72a4d6f941170557d0726d175e9701","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-08-05T14:24:24.235397872Z"},{"index":22,"name":"Data layer directional Flow specification graph 023","scenario_hash":"9712128a24c18cee64a7b001ea11980f578b48d0965d5560321231f5827e4799","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-08-05T14:24:24.235397872Z"}]}
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
    And the canvas fills the available Flow route beneath one compact toolbar
    And Outline and Details are closed and reserve no canvas space
    And project navigation uses its remembered visibility without pushing the canvas below the initial viewport
    When the operator selects Cart, changes the viewport, and enters Focus Canvas
    Then project chrome is hidden while Add, camera controls, and Exit Focus remain available
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
    When the operator selects Sales
    Then contextual controls expose Rename, Move, Resize, Wrap selection, Remove Section, and Remove with contents without a raw geometry form
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
    When the operator removes Checkout Section
    Then Cart, its Events, and its relationships remain at the same canvas positions outside every Section
    And only the Section and Cart containment reference are removed in one undoable Flow command
    When the operator undoes and chooses Remove with contents
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
    When Sales is renamed Acquisition, Cart Page is renamed Basket page, and add_payment_info Event is renamed payment_details_added
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
