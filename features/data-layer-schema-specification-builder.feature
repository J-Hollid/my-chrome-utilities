# mutation-stamp: sha256=7a4c9614cdf97c03d2734aae9b640d5b054f60c78298e32697cb91afb912360f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T21:16:33.886514848Z","feature_name":"Data layer schema specification builder","feature_path":"features/data-layer-schema-specification-builder.feature","background_hash":"f022be2a83d79dcc4f6b82950b12546e803f1737ac1f71b529ffd4ffe83d5bd8","implementation_hash":"unknown","scenarios":[{"index":0,"name":"Data layer schema specification builder 001","scenario_hash":"3aa4ea1c06cea04fbce5bac042a1322ed3e26174b624b7622fce109d2caab493","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-15T21:16:33.886514848Z"},{"index":3,"name":"Data layer schema specification builder 004","scenario_hash":"f517cc541978cc9e5c52a344fa4a1617537989f26d1ea2bc667d0bb335e3e57a","mutation_count":49,"result":{"Total":49,"Killed":49,"Survived":0,"Errors":0},"tested_at":"2026-07-15T21:16:33.886514848Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema specification builder

  Background:
    Given Generic pageview revision 4 declares documented root, nested object, and object-array properties
    And its effective properties include local and inherited documentation, examples, required relationships, conditional rules, and allowed values

  # Data layer schema specification builder 001
  Scenario Outline: Data layer schema specification builder 001
    Given the operator is viewing Generic pageview on <schema_surface>
    When the operator activates Build specification
    Then the specification builder opens for Generic pageview <source_label>
    And the source can be changed among its published revisions and working draft when available
    And no schema, documentation, rule, or builder selection is persisted by opening the builder

    Examples:
      | schema_surface             | source_label              |
      | Schema Library revision 4  | published revision 4      |
      | schema editor working draft | working draft based on revision 4 |
      | revision history revision 2 | historical revision 2     |

  # Data layer schema specification builder 002
  Scenario: Data layer schema specification builder 002
    When the property selector is displayed
    Then it presents the effective property hierarchy with local and inherited origins
    And effective leaf properties are selected by default while container rows are excluded by default
    And search, Select all, and Clear selection are available
    And selected descendant properties can be refined independently after selecting a container
    And a container can be included as its own table row independently of its descendants
    And Schema order and Property name sorting control preview order
    And only selected property rows appear in the preview

  # Data layer schema specification builder 003
  Scenario: Data layer schema specification builder 003
    Given page_type and products product_name are selected
    When the specification preview is displayed
    Then its columns are ordered Property name, Description, Mandatory, Type, Example value, and Allowed values
    And property rows use readable full paths page_type and products[].product_name
    And each row is populated from the effective selected schema source
    And missing descriptions, examples, or allowed values produce blank cells without blocking copy
    And a completeness summary identifies selected rows with missing descriptions or examples

  # Data layer schema specification builder 004
  Scenario Outline: Data layer schema specification builder 004
    Given <canonical_path> is selected
    When its specification row is derived
    Then Property name is <property_name>
    And Description is <description>
    And Mandatory is <mandatory>
    And Type is <data_type>
    And Example value is <example_value>
    And Allowed values contains <allowed_values> in order

    Examples:
      | canonical_path                    | property_name                 | description                  | mandatory                                                | data_type       | example_value  | allowed_values                         |
      | /page_type                        | page_type                     | Page classification          | Yes                                                      | String          | product_detail | product_detail and product_list        |
      | /commerce/currency                | commerce.currency             | Transaction currency         | Yes when commerce exists                                 | String          | EUR            | EUR and GBP                            |
      | /products                         | products                      | Products in the event        | No                                                       | Array of Object | blank          | no values                              |
      | /products/*/product_name          | products[].product_name       | Displayed product name       | Yes when a products item exists                          | String          | Phone          | no values                              |
      | /products/*/duration              | products[].duration           | Contract duration in months  | Yes when price_monthly exists for the same products item | Number          | 24             | 12 and 24                              |
      | /site_id inherited from Base event | site_id                       | Site identifier              | Yes                                                      | String          | otelo          | otelo, hollandsnieuwe, and ben         |
      | /tracking_context without a type  | tracking_context              | Tracking integration context | No                                                       | Unspecified     | blank          | no values                              |

  # Data layer schema specification builder 005
  Scenario: Data layer schema specification builder 005
    Given products[].duration has enabled conditional Required rules in the same item context
    And products is optional and its item properties are evaluated per item
    When Mandatory is derived for products[].duration
    Then unconditional requiredness takes precedence when present
    And otherwise Mandatory begins Yes when and summarizes every effective condition
    And optional ancestor and array-item existence are included when necessary
    And disabled or overridden inherited requirements are excluded

  # Data layer schema specification builder 006
  Scenario: Data layer schema specification builder 006
    Given payment_method has effective unconditional and conditional Allowed values rules
    When Allowed values is derived
    Then values accepted by every enabled unconditional rule are separated by a space, vertical bar, and space
    And condition-specific values retain a readable when condition after their separated values
    And value groups use separate lines in rich cells and semicolons in plain cells
    And duplicate values and disabled or overridden inherited rules are excluded
    And an empty effective intersection produces a visible conflict for payment_method instead of a silent blank cell

  # Data layer schema specification builder 007
  Scenario: Data layer schema specification builder 007
    Given selected rows include commerce.currency and orders[].products[].product_id
    When the specification table is copied
    Then the clipboard receives one HTML table and one tab-separated plain-text table with the same six columns and row order
    And the HTML representation uses table headings and cells suitable for rich paste into Confluence or Jira
    And the plain representation pastes into six spreadsheet columns
    And HTML markup, tabs, line breaks, and vertical bars inside property content cannot corrupt table boundaries
    And a plain-text fallback remains available with visible feedback when rich clipboard writing fails
    And copying does not change the schema or builder selection
