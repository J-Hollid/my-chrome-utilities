Feature: Data layer directional Flow specification graph

  Background:
    Given Shop project contains Pages Checkout, Confirmation, and Delivery options
    And Specification Flow Checkout journey is open

  # Data layer directional Flow specification graph 001
  Scenario: Data layer directional Flow specification graph 001
    When visible controls create a context occurrence, an interaction occurrence, and a documented relationship
    And pointer drag moves the interaction occurrence to the Payment lane
    And an Arrow key moves that occurrence vertically
    And the outline editor changes that relationship's group, label, and documentation condition
    Then one persisted record exists for each occurrence and relationship with stable Page and Event references
    And documentary graph authoring leaves executable Flow steps and transitions unchanged
    And no legacy transition selector or occurrence-level relationship group is exposed or stored
    And the per-occurrence relationship form is the sole relationship authoring path
    And the relationship keeps its stable ID without a duplicate
    And graph and outline expose the exact directed source, target, references, edited meaning, and saved layout after reload

  # Data layer directional Flow specification graph 002
  Scenario: Data layer directional Flow specification graph 002
    Given route_view is context-setting and page_view is interaction
    When visible controls reuse route_view for Checkout and Confirmation in one SPA Flow
    And create parallel Shipping and Payment branches beneath Checkout
    And edit only Shipping to Delivery options
    And rename route_view to route_context and Confirmation to Order confirmation
    Then exactly four named occurrences and two distinct parallel relationships retain their stable topology
    And Shipping Page binding is the sole occurrence delta while Payment and every other binding remain unchanged
    And Payment remains unchanged and bound to Checkout after reload
    And graph and outline show the renamed Event and Page after reload
    And captured Event, Page, occurrence, relationship endpoint, and branch bindings remain byte-for-byte stable across rename and reload

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
    Then it explains context-setting and interaction occurrences, stable Page and Event references, independent payload validation, and manual journey expectations
    And exactly one primary action starts context-setting Event authoring without adding an incomplete record
