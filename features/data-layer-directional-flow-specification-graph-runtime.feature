Feature: Data layer directional Flow specification graph runtime

  Background:
    Given the built extension is running with the production project repository and Specification Flow editor
    And Shop project contains named Page and Event definitions

  # Data layer directional Flow specification graph runtime 001
  Scenario: Data layer directional Flow specification graph runtime 001
    When actual controls create a context occurrence, an interaction occurrence, and a documented relationship
    And actual canvas controls move the interaction occurrence to the Payment lane
    Then production storage contains one canonical record for each item with stable references
    And rendered graph and outline expose the same names, roles, Pages, and relationship
    And the canvas renders one directed edge from the stored source port to the stored target port
    And reload preserves the same node coordinates, Payment lane, directed edge, source, and target

  # Data layer directional Flow specification graph runtime 002
  Scenario: Data layer directional Flow specification graph runtime 002
    Given route_view is context-setting and page_view is interaction
    When production controls reuse route_view for Checkout and Confirmation in one SPA Flow
    And create parallel Shipping and Payment branches beneath Checkout
    And change only Shipping to Delivery options
    Then emitted names do not determine either Event role
    And each interaction occurrence stores its resolved Page reference
    And Payment remains bound to Checkout after reload
    When actual controls rename route_view to route_context and Confirmation to Order confirmation
    Then both installed views render the new labels without changing any Event, Page, or occurrence reference
    When the branches merge and actual controls add Purchase without selecting a Page
    Then production compilation blocks Purchase with Checkout and Delivery options as the incoming Page names
    When the installed repair action focuses the Page selector and the operator selects Order confirmation
    Then Purchase persists the stable renamed Confirmation Page reference after reload

  # Data layer directional Flow specification graph runtime 003
  Scenario: Data layer directional Flow specification graph runtime 003
    Given production graph data contains expected-next, alternative, parallel, and merge relationships
    And its nodes contain obligation and multiplicity values
    When the graph, outline, documentation projection, and per-event validation input are compared
    Then graph, outline, and documentation contain the same stable topology and node expectations
    And per-event validation input contains no predecessor, transition, branch token, join state, or occurrence counter
    And no Flow verdict is stored or rendered
    And the installed graph and outline state Event payloads are validated independently through Assignments. Sequence, branch, and occurrence expectations are checked manually.

  # Data layer directional Flow specification graph runtime 004
  Scenario: Data layer directional Flow specification graph runtime 004
    Given production outline focus is on add_shipping_info
    When keyboard controls create a Parallel relationship to add_payment_info and save
    Then exactly one relationship persists and focus returns to its outline row
    And graph and outline selections identify the same relationship
    And no pointer-only action is required

  # Data layer directional Flow specification graph runtime 005
  Scenario: Data layer directional Flow specification graph runtime 005
    Given the selected production Flow has no occurrences
    When the installed empty state renders
    Then it explains both Event roles, reusable Page and Event references, schema composition, independent validation, and manual journey expectations
    And exactly one primary action adds a context-setting Event
    And no project record changes until that action is invoked
