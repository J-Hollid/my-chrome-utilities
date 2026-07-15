Feature: Data layer schema specification builder runtime

  Background:
    Given the built extension side panel is running with the production Schema Library, schema editor, documentation, validation rules, inheritance, and clipboard controls
    And production Generic pageview revision 4 contains documented root, nested object, and object-array properties

  # Data layer schema specification builder runtime 001
  Scenario Outline: Data layer schema specification builder runtime 001
    Given production Generic pageview is opened from <entry_point>
    When the operator clicks Build specification
    Then the rendered builder identifies <source_label>
    And changing the source rebuilds property selection and preview from that immutable schema surface
    And production schema persistence is unchanged

    Examples:
      | entry_point                 | source_label                    |
      | Schema Library             | published revision 4            |
      | working-draft schema editor | working draft based on revision 4 |
      | revision history           | historical revision 2           |

  # Data layer schema specification builder runtime 002
  Scenario: Data layer schema specification builder runtime 002
    When the production property selector is rendered
    Then it contains searchable hierarchical local and inherited property controls
    And effective leaf rows are selected by default and container rows can be included independently
    And Select all, Clear selection, descendant refinement, and independent container-row inclusion operate on the preview
    And Schema order and Property name sorting produce the matching preview order
    And the rendered preview headings are Property name, Description, Mandatory, Type, Example value, and Allowed values in that order

  # Data layer schema specification builder runtime 003
  Scenario Outline: Data layer schema specification builder runtime 003
    Given production builder selects <canonical_path>
    When the production preview derives that row
    Then its readable path is <property_name>
    And its Mandatory cell is <mandatory>
    And its Type cell is <data_type>
    And its Allowed values cell contains <allowed_values> in order

    Examples:
      | canonical_path            | property_name           | mandatory                                                | data_type       | allowed_values                |
      | /page_type                | page_type               | Yes                                                      | String          | product_detail and product_list |
      | /commerce/currency        | commerce.currency       | Yes when commerce exists                                 | String          | EUR and GBP                    |
      | /products                 | products                | No                                                       | Array of Object | no values                      |
      | /products/*/duration      | products[].duration     | Yes when price_monthly exists for the same products item | Number          | 12 and 24                      |
      | /tracking_context         | tracking_context        | No                                                       | Unspecified     | no values                      |

  # Data layer schema specification builder runtime 004
  Scenario: Data layer schema specification builder runtime 004
    Given production effective schema data includes inherited documentation, overridden requirements, intersecting allowed values, and conditional rules
    When production row derivation completes
    Then only effective documentation and enabled non-overridden rules populate the preview
    And nested requirements and same-item wildcard conditions produce readable Mandatory cells
    And conditional allowed values retain their conditions
    And missing documentation remains blank while conflicting allowed values produce a visible conflict
    And the rendered completeness summary counts selected rows missing descriptions or examples

  # Data layer schema specification builder runtime 005
  Scenario: Data layer schema specification builder runtime 005
    Given production builder has selected nested and inherited rows in schema order
    When the operator clicks Copy specification table
    Then production clipboard writing receives text/html containing one six-column table
    And it receives text/plain containing matching tab-separated headings and rows
    And property content is escaped without changing its displayed meaning
    And fallback feedback identifies when only plain text was copied
    And no production schema, documentation, rule, source, or selection state is mutated
