Feature: Data layer directional Flow specification graph

  Background:
    Given Shop project contains Pages Checkout, Confirmation, and Delivery options
    And Specification Flow Checkout journey is open

  # Data layer directional Flow specification graph 001
  Scenario: Data layer directional Flow specification graph 001
    Given Page Group Checkout is the first lane and contains Checkout Page
    And Checkout Page binds route_view as its SPA context Event
    When visible controls create a Checkout page-context occurrence, an add_payment_info interaction occurrence, and a documented relationship
    And pointer drag moves the interaction occurrence vertically within the Checkout lane
    And an Arrow key moves that occurrence vertically
    And the outline editor changes that relationship's group, label, and documentation condition
    Then one persisted record exists for each authored occurrence and relationship
    And documentary graph authoring leaves executable Flow steps and transitions unchanged
    And no legacy transition selector or occurrence-level relationship group is exposed or stored
    And the per-occurrence relationship form is the sole relationship authoring path
    And the relationship keeps its stable ID without a duplicate
    And graph and outline expose the Checkout lane name, exact directed source, target, references, edited meaning, and saved vertical layout after reload

  # Data layer directional Flow specification graph 002
  Scenario: Data layer directional Flow specification graph 002
    Given Checkout journey uses its configured Page Group lanes
    And Checkout and Confirmation Pages each bind shared Event route_view as a context Event
    When visible controls reuse both route_view context bindings in one SPA Flow
    And create parallel Shipping and Payment interaction occurrences on Checkout
    And edit only Shipping to Delivery options
    And rename route_view to route_context, Delivery Page Group to Fulfilment, and Confirmation Page to Order confirmation
    Then exactly four named occurrences and two distinct parallel relationships retain their stable topology
    And Shipping Page and Page Group references are the sole occurrence delta while Payment and every other binding remain unchanged
    And Payment remains in the Checkout Page Group and bound to Checkout after reload
    And graph and outline show the renamed Event, Page Group, and Page after reload
    And captured Event, Page, Page Group, context-binding, occurrence, relationship endpoint, and branch references remain byte-for-byte stable across rename and reload

  # Data layer directional Flow specification graph 003
  Scenario: Data layer directional Flow specification graph 003
    Given rendered occurrence controls contain obligation and multiplicity choices
    And rendered relationship controls offer expected-next, alternative, parallel, and merge
    When those human-name controls create all four relationship kinds
    And graph and outline are compared
    Then both views contain the same stable topology and node expectations
    And no Flow verdict is stored or rendered
    And documentary topology is stored outside executable Flow entities
    And sequence, branch, and occurrence expectations remain explicitly manual

  # Data layer directional Flow specification graph 004
  Scenario: Data layer directional Flow specification graph 004
    Given keyboard focus is on add_shipping_info in the synchronized outline
    When keyboard controls create a Parallel relationship to add_payment_info and save
    Then exactly one stable relationship persists and focus returns to its outline row
    And graph and outline identify that same relationship without a pointer-only action

  # Data layer directional Flow specification graph 005
  Scenario: Data layer directional Flow specification graph 005
    Given Checkout journey contains no Event occurrences
    When its empty state opens
    Then it explains that Page Groups define lanes, Pages bind context Events, and Events own reusable payload schemas
    And it explains stable references, independent per-Event payload validation, and manual journey expectations
    And exactly one primary action starts Page-context occurrence authoring without adding an incomplete record

  # Data layer directional Flow specification graph 006
  Scenario: Data layer directional Flow specification graph 006
    When Checkout journey is selected from the Flows collection
    Then the project breadcrumb identifies Checkout journey as the active Flow
    And the main workspace replaces the Flow collection list with exactly one interactive directional canvas and one synchronized editable Flow outline
    And the contextual Inspector contains neither the canvas nor the outline
    And the Inspector identifies Checkout journey and exposes its Flow-level properties
    And executable-step authoring remains available only in a separately labelled Advanced section that explains it is independent of documentary journey expectations
    And the Advanced section does not duplicate documentary occurrences or relationships

  # Data layer directional Flow specification graph 007
  Scenario: Data layer directional Flow specification graph 007
    Given Checkout journey contains Checkout route and Purchase occurrences joined by an expected-next relationship
    When Checkout route is selected from the canvas
    Then the Inspector identifies Checkout route by its human name
    And the Inspector offers its Page Group, Page, context-event binding, derived page-context type, obligation, and occurrence bounds
    And the Inspector offers no editable occurrence-role or free-form lane control
    When the expected-next relationship is selected from the canvas or outline
    Then the Inspector identifies the relationship by its human source and target names
    And the Inspector offers its kind, target, group, label, documentation condition, and expectation
    And the main workspace has kept the same canvas and outline mounted at their saved layout throughout both selections
    When the selected relationship is saved
    Then the same stable relationship is updated without a duplicate
    And graph and outline refresh while focus returns to that relationship

  # Data layer directional Flow specification graph 008
  Scenario: Data layer directional Flow specification graph 008
    Given Page Groups Checkout, Delivery, and Confirmation have stable IDs and member Pages
    When visible Flow controls select them as lanes in that order
    Then Flow lane order persists the three stable Page Group references
    And the initial graph projections agree with the selected human-name order
    When Delivery is renamed Fulfilment and moved after Confirmation
    Then Fulfilment replaces Delivery as the third lane after Checkout and Confirmation in both graph projections
    And every occurrence retains its Page Group reference and vertical position
    And each horizontal position is derived from current lane order rather than persisted as semantic identity

  # Data layer directional Flow specification graph 009
  Scenario: Data layer directional Flow specification graph 009
    Given Checkout Page has initial-load page_view and route-change route_view context-event bindings
    And Purchase Event owns one reusable payload schema
    When visible controls add page-context occurrences for both Checkout bindings
    And add a Purchase interaction occurrence on Checkout
    Then both page-context records persist binding references while Purchase persists its Event reference and all three persist Checkout Page and Page Group references
    And stored occurrence semantics contain no role value, schema copy, or lane-name string
    And per-Event payload validation resolves the canonical Event schema independently of manual journey expectations

  # Data layer directional Flow specification graph 010
  Scenario: Data layer directional Flow specification graph 010
    Given Checkout Page belongs to Checkout and Trade Page Groups selected as Flow lanes
    And Purchase interaction is assigned to the Trade lane by stable Page Group reference
    When the operator attempts to remove Trade membership or the Trade lane
    Then the consequential-action review names Purchase, Checkout Page, Trade Page Group, and Checkout journey
    And removal is blocked until the occurrence is reassigned or removed
    And no occurrence is silently moved to another lane
    When the operator reassigns Purchase to Checkout and confirms removal
    Then one canonical transaction updates the occurrence, membership, and Flow lane order
    And one Undo restores the complete prior Page Group assignment
