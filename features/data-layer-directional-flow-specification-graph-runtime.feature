Feature: Data layer directional Flow specification graph runtime

  Background:
    Given the built extension is running with the production project repository and Specification Flow editor
    And Shop project contains named Page and Event definitions

  # Data layer directional Flow specification graph runtime 001
  Scenario: Data layer directional Flow specification graph runtime 001
    Given production Page Group Checkout is the first lane and contains Checkout Page
    And Checkout Page binds route_view as its SPA context Event
    When actual controls create a Checkout page-context occurrence, an add_payment_info interaction occurrence, and a documented relationship
    And pointer drag moves the interaction occurrence vertically within the Checkout lane
    And an Arrow key moves that occurrence vertically
    And the rendered outline editor changes that relationship's group, label, and documentation condition
    Then production storage contains one persisted record for each authored occurrence and relationship
    And executable Flow steps and transitions remain unchanged
    And no visible legacy transition selector or occurrence-level relationship group exists or persists
    And the installed per-occurrence relationship form is the sole relationship authoring path
    And the relationship keeps its stable ID without a duplicate
    And rendered graph and outline expose the Checkout lane name, exact occurrence types, Page and Event references, endpoints, and edited relationship
    And the canvas renders one directed edge from the stored source port to the stored target port
    And reload preserves the same vertical node coordinates, Checkout Page Group reference, directed edge, source, and target

  # Data layer directional Flow specification graph runtime 002
  Scenario: Data layer directional Flow specification graph runtime 002
    Given Checkout journey uses its configured production Page Group lanes
    And Checkout and Confirmation Pages each bind shared Event route_view as a context Event
    When visible controls reuse both route_view context bindings in one SPA Flow
    And create parallel Shipping and Payment interaction occurrences on Checkout
    And edit only Shipping to Delivery options
    Then Page context bindings rather than Event names determine context-setting use
    And exactly four named occurrences and two distinct parallel relationships retain their stable topology
    And Shipping Page and Page Group references are the sole occurrence delta while Payment and every other binding remain unchanged
    And Payment remains unchanged in the Checkout Page Group and bound to Checkout
    When visible controls rename route_view to route_context, Delivery Page Group to Fulfilment, and Confirmation Page to Order confirmation
    Then graph and outline render the new Event, Page Group, and Page labels after reload
    And captured Event, Page, Page Group, context-binding, occurrence, relationship endpoint, and branch references remain byte-for-byte stable across rename and reload

  # Data layer directional Flow specification graph runtime 003
  Scenario: Data layer directional Flow specification graph runtime 003
    Given rendered occurrence controls contain obligation and multiplicity choices
    And rendered relationship controls offer expected-next, alternative, parallel, and merge
    When human-name controls create all four relationship kinds
    And the graph and outline are compared
    Then graph and outline contain the same stable topology and node expectations
    And no Flow verdict is stored or rendered
    And documentary topology is stored outside executable Flow entities
    And the installed graph and outline explain that sequence, branch, and occurrence expectations are checked manually

  # Data layer directional Flow specification graph runtime 004
  Scenario: Data layer directional Flow specification graph runtime 004
    Given production outline focus is on add_shipping_info
    When keyboard controls create a Parallel relationship to add_payment_info and save
    Then exactly one relationship persists and focus returns to its outline row
    And graph and outline identify the same stable relationship
    And no pointer-only action is required

  # Data layer directional Flow specification graph runtime 005
  Scenario: Data layer directional Flow specification graph runtime 005
    Given the selected production Flow has no occurrences
    When the installed empty state renders
    Then it explains that Page Groups define lanes, Pages bind context Events, and Events own reusable payload schemas
    And it explains stable references, independent per-Event payload validation, and manual journey expectations
    And exactly one primary action starts Page-context occurrence authoring without adding an incomplete record
    And no project record changes until that action is invoked

  # Data layer directional Flow specification graph runtime 006
  Scenario: Data layer directional Flow specification graph runtime 006
    When actual controls select Checkout journey from the Flows collection
    Then the rendered breadcrumb identifies Checkout journey as the active Flow
    And exactly one visible interactive directional canvas and one visible synchronized editable Flow outline are descendants of the production main workspace
    And no canvas or Flow outline is a descendant of the contextual Inspector
    And the Inspector identifies Checkout journey and renders its Flow-level controls
    And executable-step controls remain available only in a separately labelled Advanced section whose explanation distinguishes runtime sequence semantics from documentary journey expectations
    And no documentary occurrence or relationship control is duplicated in that Advanced section

  # Data layer directional Flow specification graph runtime 007
  Scenario: Data layer directional Flow specification graph runtime 007
    Given the installed canvas contains Checkout route and Purchase occurrences joined by an expected-next relationship
    When actual keyboard controls select Checkout route on the canvas
    Then the Inspector heading identifies Checkout route by its rendered human name
    And the Inspector renders its Page Group, Page, context-event binding, derived page-context type, obligation, and occurrence-bound controls
    And the Inspector renders no editable occurrence-role or free-form lane control
    When actual keyboard controls select the expected-next relationship in the canvas or outline
    Then the Inspector heading identifies the relationship by rendered source and target names
    And the Inspector renders its kind, target, group, label, documentation condition, and expectation controls
    And the installed main workspace has kept the same canvas and outline mounted at their saved coordinates throughout both selections
    When the selected relationship is changed and saved through the Inspector
    Then production storage updates the same stable relationship without a duplicate
    And rendered graph and outline refresh while focus returns to that relationship

  # Data layer directional Flow specification graph runtime 008
  Scenario: Data layer directional Flow specification graph runtime 008
    Given production Page Groups Checkout, Delivery, and Confirmation have stable IDs and member Pages
    When actual Flow controls select them as lanes in that order
    Then canonical Flow storage contains the three ordered Page Group references
    And the initial installed graph projections agree with the selected human-name order
    When actual controls rename Delivery to Fulfilment and move it after Confirmation
    Then Fulfilment replaces Delivery as the third installed lane after Checkout and Confirmation in both graph projections
    And canonical occurrences retain their Page Group references and vertical positions
    And rendered horizontal positions derive from current lane order rather than persisted semantic coordinates

  # Data layer directional Flow specification graph runtime 009
  Scenario: Data layer directional Flow specification graph runtime 009
    Given Checkout Page has initial-load page_view and route-change route_view context-event bindings
    And Purchase Event owns one reusable payload schema
    When actual controls add page-context occurrences for both Checkout bindings
    And add a Purchase interaction occurrence on Checkout
    Then both production page-context records persist binding references while Purchase persists its Event reference and all three persist Checkout Page and Page Group references
    And stored production occurrence semantics contain no role value, schema copy, or lane-name string
    And the production per-Event evaluator resolves the canonical Event schema independently of manual journey expectations

  # Data layer directional Flow specification graph runtime 010
  Scenario: Data layer directional Flow specification graph runtime 010
    Given Checkout Page belongs to Checkout Page Group and Purchase interaction is inside its production Page frame
    And Trade Page belongs to Trade Page Group in the same production Flow
    When actual pointer or keyboard movement attempts to move Purchase into the Trade lane or Trade Page frame
    Then the installed gesture is rejected and Purchase returns to its saved position inside Checkout Page
    And the canonical project bytes and revision remain unchanged after rejection
    And installed guidance explains that Event occurrences cannot cross Page or Page Group containment boundaries
    When the predefined Purchase Event is dragged from the production component palette into Trade Page
    Then canonical storage creates a distinct interaction occurrence inside Trade Page using the same stable Event reference
    And Checkout retains its original occurrence while Trade receives only the new occurrence

  # Data layer directional Flow specification graph runtime 011
  Scenario: Data layer directional Flow specification graph runtime 011
    Given ungrouped Landing Page has context binding page_view
    When actual controls drag Landing Page from the component palette into Ungrouped entry pages outside the named Flow lanes
    Then canonical storage contains one free Page frame with stable Page and context-binding references and no Page Group reference
    And the installed frame renders its page_view context occurrence and accepts interaction Events from the component palette
    And actual controls can draw a relationship from its Event occurrence into a grouped Page frame
    And free-frame creation does not edit Page Group entities or the Flow's ordered lane references
    When actual controls drop Landing Page over a named Page Group lane
    Then the installed move is rejected without changing canonical state
    And installed guidance deep-links to Landing Page's Page Group membership editor
