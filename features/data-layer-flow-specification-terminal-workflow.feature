Feature: Data layer Flow specification terminal workflow

  Background:
    Given the operator uses visible product controls without project JSON, storage injection, or raw stable IDs

  # Data layer Flow specification terminal workflow 001
  Scenario Outline: Data layer Flow specification terminal workflow 001
    Given no Specification Project, Flow artwork, Event validation case, or captured traffic exists
    And Builder and side panel are each operated at <width> in turn
    When the operator creates a project, Base containers, shared Checkout and Confirmation Pages under /{channel}/checkout, shared Events virtual_page_view, add_payment_info, and Purchase, and Sitewide, Retail, and Trade Profiles
    And imports Figma-exported reference artwork and traces Retail and Trade directional Specification Flows
    And documents context and interaction nodes with required, optional, conditional, and informational obligations and multiplicities
    And documents expected-next, alternative, parallel, and merge topology
    And the rich editor declares Base paths /page, /ecommerce, and /customer as optional object containers that allow their declared children
    And Sitewide requires /site_id as a string on every occurrence
    And Checkout requires /page/type exact checkout while Confirmation requires /page/type exact confirmation
    And virtual_page_view requires /event exact virtual_page_view
    And add_payment_info requires /event exact add_payment_info and /ecommerce/payment_type as card, wallet, or invoice
    And Purchase requires /event exact purchase, string /ecommerce/transaction_id, GBP or EUR /ecommerce/currency, numeric /ecommerce/value, and forbids /ecommerce/coupon
    And Retail requires /customer/type exact consumer while Trade requires /customer/type exact business and conditionally requires string /ecommerce/purchase_order_number when customer type is business
    And the Retail payment occurrence narrows /ecommerce/payment_type to card or wallet while the Trade payment occurrence narrows it to invoice or card
    Then one shared Purchase Event is reused by distinct Retail Purchase and Trade Purchase occurrences
    And graph and outline show the same stable human-readable relationships
    When Base, Page, Event, Profile, and occurrence requirements are compiled
    Then Retail and Trade effective schemas and provenance are visible without duplicate schema files
    When human selectors create Retail context and Trade context Assignments for virtual_page_view on Checkout using route channels retail and trade
    And create Retail payment and Trade payment Assignments for add_payment_info on Checkout using route channels retail and trade
    And create Retail Purchase and Trade Purchase Assignments for Purchase on Confirmation using route channels retail and trade
    Then each automatic Event occurrence is Draft only and configuration-ready with its exact named Assignment
    When required positive and negative single-Event cases for virtual_page_view, add_payment_info, and Purchase prove type, enum, forbidden, required, and conditional rules
    Then every result contains exact issues and effective-schema provenance
    When the operator invokes Generate documentation for Confluence and Spreadsheet
    Then diagram, nodes, relationships, schemas, Assignments, examples, and manual tester checklist agree by revision
    When preflight produces compile:7K3M and that exact result is reviewed and published
    Then the immutable release contains the documentation graph and per-event validation plan from compile:7K3M
    And all six automatic occurrences display Ready with their published named Assignments
    When real Retail and Trade virtual_page_view, add_payment_info, and Purchase observations are captured across Checkout and Confirmation Pages
    Then all six observable Assignments select their published effective schemas and Live shows exact validation results
    And no current step, transition outcome, temporal occurrence verdict, active branch, join state, or journey verdict is shown
    And the Specification Flow label states Event payloads are validated automatically; sequence and occurrence expectations are checked manually
    When Builder and side panel each continue editing at <width> using only the keyboard
    Then rich schema capability, canonical revisions, focus, and one narrow scroll owner are preserved without lost updates

    Examples:
      | width       |
      | 360 CSS px  |
      | 1280 CSS px |

  # Data layer Flow specification terminal workflow 002
  Scenario: Data layer Flow specification terminal workflow 002
    Given an immutable published release contains Retail Purchase and Trade Purchase with different effective schemas
    And a captured Purchase has identical URL, source, target, Event, payload, environment, and available session inputs for both
    When the published Assignment resolver evaluates it
    Then both candidates and their predicate evidence are shown as a tie
    And neither Flow name, graph position, documented predecessor, nor manual checklist state selects a schema

  # Data layer Flow specification terminal workflow 003
  Scenario: Data layer Flow specification terminal workflow 003
    Given Live needs access to https://shop.example and no target permission exists
    When the operator reviews access onboarding
    Then it names the exact origin, observation data, purpose, persistence, revocation path, and read scope before Request access
    When the operator denies the browser prompt
    Then no observation starts, no page data is read, and retry remains available
    When the operator retries Request access and grants the origin-specific request
    Then only https://shop.example becomes eligible for target observation
    And Browse all tabs remains a separate expert action with its broader scope explained before its own prompt
