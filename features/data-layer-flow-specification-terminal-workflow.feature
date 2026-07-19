Feature: Data layer Flow specification terminal workflow

  Background:
    Given the operator uses visible product controls without project JSON, storage injection, raw stable IDs, or facilitator role-play

  # Data layer Flow specification terminal workflow 001
  Scenario: Data layer Flow specification terminal workflow 001
    Given a blank Shop Specification Project is open
    When the operator creates Pages with observable path matchers
      | Page         | path matcher  |
      | Checkout     | /checkout     |
      | Confirmation | /confirmation |
    And creates context-setting Event route_view, interaction Events add_shipping_info and add_payment_info, and interaction Event Purchase with emitted value purchase
    And creates Retail Profile
    And creates Checkout journey with Checkout route_view, parallel Shipping and Payment branches, a merge, Confirmation route_view, and Retail Purchase
    And binds Checkout route_view to Checkout, Confirmation route_view and Retail Purchase to Confirmation, and applies Retail Profile to Retail Purchase
    And documents each occurrence obligation, multiplicity, trigger, developer note, and tester note
    Then graph and outline contain the same stable human-readable Page, Event, occurrence, and relationship records
    And the workspace states that payloads are validated independently while journey expectations are checked manually
    When Base declares /page and /ecommerce as objects
    And Confirmation Page requires /page/type equal confirmation
    And Purchase requires string /ecommerce/transaction_id
    And Retail Profile allows /ecommerce/currency to be GBP or EUR
    And Retail Purchase forbids /ecommerce/coupon as its occurrence refinement
    Then Retail Purchase effective schema shows all 5 layers and complete provenance
    When the operator creates Assignment Retail Purchase using human Page Confirmation and Event Purchase selectors with observable path /confirmation and emitted Event value purchase
    And creates and saves Event examples
      | Example                          | path          | emitted Event | page type    | transaction ID | currency | coupon |
      | Retail Purchase valid            | /confirmation | purchase      | confirmation | R-100          | GBP      | absent |
      | Retail Purchase invalid currency | /confirmation | purchase      | confirmation | R-101          | USD      | absent |
    And runs both saved Event examples through Assignment Retail Purchase
    Then the valid Event has no issue
    And the invalid Event reports enum at /ecommerce/currency with expected GBP or EUR, actual USD, and Retail Profile provenance
    And neither result contains a Flow ordering, branch, join, occurrence, or journey verdict
    When the operator exports Confluence-ready content, Spreadsheet tables, and full project JSON
    Then all outputs identify the same saved project revision and graph semantics
    And the documentation outputs contain Base, Profiles, authored requirements, effective contracts, effective requirements, provenance, Assignment, examples, and manual expectations
    When the project is reloaded and Retail Purchase is opened from Builder and side panel
    Then both surfaces retain the graph, full rich requirements, Assignment query, effective schema, and both saved Event-example results
