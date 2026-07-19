Feature: Data layer Flow specification terminal workflow runtime

  Background:
    Given a clean browser profile runs the built installed extension
    And source-aware automated acceptance uses only rendered production controls and extension boundaries

  # Data layer Flow specification terminal workflow runtime 001
  Scenario: Data layer Flow specification terminal workflow runtime 001
    Given production project listing opens a blank Shop Specification Project
    When actual controls create Pages with observable path matchers
      | Page         | path matcher  |
      | Checkout     | /checkout     |
      | Confirmation | /confirmation |
    And actual controls create the four Events including Purchase with emitted value purchase, Retail Profile, parallel Checkout graph, node expectations, and manual notes
    And actual controls bind the two route_view occurrences and Retail Purchase to their named Pages and apply Retail Profile to Retail Purchase
    And production Base declares /page and /ecommerce as objects
    And production Confirmation Page requires /page/type equal confirmation
    And production Purchase requires string /ecommerce/transaction_id
    And production Retail Profile allows /ecommerce/currency to be GBP or EUR
    And production Retail Purchase forbids /ecommerce/coupon as its occurrence refinement
    Then production graph and outline contain the same canonical stable references and relationships
    And production compilation renders the five-layer effective schema and provenance
    When actual human-name controls create Assignment Retail Purchase with Page Confirmation and Event Purchase for observable path /confirmation and emitted Event value purchase
    And actual controls create and save Event examples
      | Example                          | page type    | transaction ID | currency | coupon |
      | Retail Purchase valid            | confirmation | R-100          | GBP      | absent |
      | Retail Purchase invalid currency | confirmation | R-101          | USD      | absent |
    And actual controls run both saved Event examples with path /confirmation and Event purchase
    Then production Assignment resolution selects the named Assignment from observable Page and Event inputs
    And production validation renders no issue for the valid Event
    And it renders enum at /ecommerce/currency with expected GBP or EUR, actual USD, and Retail Profile provenance for the invalid Event
    And production output contains no temporal Flow verdict
    When actual export controls create Confluence-ready content, Spreadsheet tables, and full project JSON
    Then parsed outputs agree with the saved production revision, graph, Base, Profiles, authored requirements, effective contracts, effective requirements, provenance, Assignment, examples, and manual expectations
    When the installed extension reloads and actual controls continue from Builder and side panel
    Then both surfaces render the same full rich requirements, Assignment query, effective schema, and saved Event-example results
    And no direct storage mutation, imported project, raw ID, replaced production API, legacy parallel model, or reduced side-panel capability participates
