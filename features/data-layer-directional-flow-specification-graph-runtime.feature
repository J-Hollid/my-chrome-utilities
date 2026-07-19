Feature: Data layer directional Flow specification graph runtime

  Background:
    Given the built extension is running with the production project repository and Specification Flow editor
    And Shop project contains named Page and Event definitions

  # Data layer directional Flow specification graph runtime 001
  Scenario: Data layer directional Flow specification graph runtime 001
    When actual controls create a context occurrence, an interaction occurrence, and a documented relationship
    And pointer drag moves the interaction occurrence to the Payment lane
    And an Arrow key moves that occurrence vertically
    And the rendered outline editor changes that relationship's group, label, and documentation condition
    Then production storage contains one persisted record for each item with stable references
    And executable Flow steps and transitions remain unchanged
    And no visible legacy transition selector or occurrence-level relationship group exists or persists
    And the installed per-occurrence relationship form is the sole relationship authoring path
    And the relationship keeps its stable ID without a duplicate
    And rendered graph and outline expose the exact names, roles, Page and Event references, endpoints, and edited relationship
    And the canvas renders one directed edge from the stored source port to the stored target port
    And reload preserves the same node coordinates, Payment lane, directed edge, source, and target

  # Data layer directional Flow specification graph runtime 002
  Scenario: Data layer directional Flow specification graph runtime 002
    Given route_view is context-setting and page_view is interaction
    When visible controls reuse route_view for Checkout and Confirmation in one SPA Flow
    And create parallel Shipping and Payment branches beneath Checkout
    And edit only Shipping to Delivery options
    Then emitted names do not determine either Event role
    And each interaction occurrence stores its resolved Page reference
    And exactly four named occurrences and two distinct parallel relationships retain their stable topology
    And Shipping Page binding is the sole occurrence delta while Payment and every other binding remain unchanged
    And Payment remains unchanged and bound to Checkout
    When visible controls rename route_view to route_context and Confirmation to Order confirmation
    Then graph and outline render the new labels after reload
    And captured Event, Page, occurrence, relationship endpoint, and branch bindings remain byte-for-byte stable across rename and reload

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
    Then it explains both Event roles, reusable Page and Event references, independent payload validation, and manual journey expectations
    And exactly one primary action starts context-setting Event authoring without adding an incomplete record
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
    And the Inspector renders its shared Page, shared Event, role, obligation, occurrence bounds, and lane controls
    When actual keyboard controls select the expected-next relationship in the canvas or outline
    Then the Inspector heading identifies the relationship by rendered source and target names
    And the Inspector renders its kind, target, group, label, documentation condition, and expectation controls
    And the installed main workspace has kept the same canvas and outline mounted at their saved coordinates throughout both selections
    When the selected relationship is changed and saved through the Inspector
    Then production storage updates the same stable relationship without a duplicate
    And rendered graph and outline refresh while focus returns to that relationship
