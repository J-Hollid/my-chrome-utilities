Feature: Data layer Flow specification terminal workflow runtime

  Background:
    Given a clean browser profile runs the built installed extension
    And a real observation target is available

  # Data layer Flow specification terminal workflow runtime 001
  Scenario Outline: Data layer Flow specification terminal workflow runtime 001
    Given production project listing and rendered empty state confirm there is no Specification Project
    And production Chrome permissions grant the exact target origin before authoring begins
    And actual Builder and side panel are each operated at <width> in turn
    When keyboard-operated rendered controls create the project, Pages, Events, and Sitewide, Retail, and Trade Profiles
    And actual Flow controls import a sanitized Figma-exported SVG as locked non-semantic reference artwork
    And keyboard-operated rendered controls trace graph nodes, node obligations and multiplicities, and expected-next, alternative, parallel, and merge topology
    And the production rich editor declares Base paths /page, /ecommerce, and /customer as optional object containers that allow their declared children
    And the production Sitewide Profile requires /site_id as a string on every occurrence
    And production Checkout and Confirmation Pages require /page/type exact checkout and exact confirmation
    And production virtual_page_view requires /event exact virtual_page_view
    And production add_payment_info requires /event exact add_payment_info and /ecommerce/payment_type as card, wallet, or invoice
    And production Purchase requires /event exact purchase, string /ecommerce/transaction_id, GBP or EUR /ecommerce/currency, numeric /ecommerce/value, and forbids /ecommerce/coupon
    And production Retail requires /customer/type exact consumer while Trade requires /customer/type exact business and conditionally requires string /ecommerce/purchase_order_number when customer type is business
    And production Retail and Trade payment occurrences narrow /ecommerce/payment_type to card or wallet and invoice or card respectively
    Then production graph and outline contain the same Retail and Trade context, interaction, expectation, and topology records
    And production compilation contains Base, Page, shared Event, Sitewide, Retail or Trade, and occurrence provenance without copied schemas
    When rendered human selectors create Retail context and Trade context Assignments for virtual_page_view on Checkout with route channels retail and trade
    And create Retail payment and Trade payment Assignments for add_payment_info on Checkout with route channels retail and trade
    And create Retail Purchase and Trade Purchase Assignments for Purchase on Confirmation with route channels retail and trade
    Then all six automatic occurrences display Draft only and configuration-ready with those exact names
    When rendered Event-case controls create and run required positive and negative cases for virtual_page_view, add_payment_info, and Purchase
    Then production Event cases return exact type, enum, forbidden, required, and conditional issues
    When actual Generate documentation controls create Confluence and Spreadsheet outputs
    Then parsed outputs contain the same graph, schemas, Assignments, examples, checklist, and project revision
    When production preflight creates compile:7K3M and review and publication consume compile:7K3M unchanged
    Then release metadata records compile:7K3M and all six automatic occurrences display Ready
    When the real permitted target emits Retail and Trade virtual_page_view, add_payment_info, and Purchase through its data-layer interface on Checkout and Confirmation Pages
    Then the production observer and Chrome messaging path deliver all six immutable observations to Live
    And all six observations select their published schemas from observable route channel with exact EventValidationResult fields
    And actual Flow and Live surfaces show no current step, transition outcome, temporal occurrence verdict, active branch, join state, or journey verdict
    And actual Flow and Live display Specification Flow — Event payloads are validated automatically; sequence and occurrence expectations are checked manually
    When keyboard controls save disjoint rich-schema edits from Builder and side panel at <width> in both orders
    Then production Builder and side panel preserve both changes, rich-schema parity, canonical revisions, exact focus, and one narrow scroll owner
    And no setup or assertion uses project import, direct storage mutation, raw IDs, direct observer callback invocation, replaced Chrome APIs, legacy validation, or a parallel model

    Examples:
      | width       |
      | 360 CSS px  |
      | 1280 CSS px |

  # Data layer Flow specification terminal workflow runtime 002
  Scenario: Data layer Flow specification terminal workflow runtime 002
    Given the installed extension publishes two different Purchase schemas with indistinguishable observable Assignment inputs
    And production Chrome permissions already cover the real observation target origin
    When a real Purchase observation reaches production Live
    Then actual Live renders both named candidates, their predicate evidence, and no selected schema
    And Flow name, graph position, documented predecessor, and checklist state are absent from Assignment evidence
    And the tie produces only Assignment ambiguity without temporal diagnostic fields

  # Data layer Flow specification terminal workflow runtime 003
  Scenario: Data layer Flow specification terminal workflow runtime 003
    Given production Chrome permissions report no access to https://shop.example
    When actual Choose target onboarding opens
    Then rendered content identifies https://shop.example, observation data, purpose, persistence, revocation, and exact origin read scope
    And Request access is the only action that invokes the origin-specific production Chrome permission API
    When the actual permission prompt is denied
    Then the production observer and messaging path attach to no target and read or capture no page data
    And retry guidance remains available without a validation result
    When actual Request access is retried and the origin-specific prompt is granted
    Then production target discovery and observation become eligible only for https://shop.example
    And Browse all tabs remains a separate expert control that explains broader scope before invoking a separate production permission request
    And no Chrome permission API, observer, or message transport is replaced
