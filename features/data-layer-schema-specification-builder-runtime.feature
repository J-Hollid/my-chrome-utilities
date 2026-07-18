# mutation-stamp: sha256=256156554c0afa6d4e9a63673787a1e361e7721b2785b12150f3888dc1be501a
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-16T12:00:57.445434474Z","feature_name":"Data layer schema specification builder runtime","feature_path":"features/data-layer-schema-specification-builder-runtime.feature","background_hash":"026203ad1df42e722497c88eaa6078e7255438e48c0ff67c68db657421143827","implementation_hash":"6157b973c78b7c2290c36634945b5d4b3a262cdb","scenarios":[{"index":2,"name":"Data layer schema specification builder runtime 003","scenario_hash":"8357194ced65caaa7d51ae52c1be3651d450303663a6b0ab40fc9641050228b8","mutation_count":30,"result":{"Total":30,"Killed":30,"Survived":0,"Errors":0},"tested_at":"2026-07-16T08:58:05.198704504Z"},{"index":0,"name":"Data layer schema specification builder runtime 001","scenario_hash":"7b3cf7576b120f78b02f9e8798462d5cb7da8572e68f21e9eff8c7f5a1220dc4","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-15T21:16:47.874216068Z"}]}
# acceptance-mutation-manifest-end

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
    And effective leaf, Object container, and Array container rows are selected by default
    And every default-selected local or inherited container appears once in the rendered preview
    And Select all, Clear selection, descendant refinement, and independent container-row inclusion operate on the preview
    And Schema order and Property name sorting produce the matching preview order
    And the rendered preview headings are Property name, Description, Mandatory, Type, Example value, Allowed values, and Comments in that order

  # Data layer schema specification builder runtime 003
  Scenario Outline: Data layer schema specification builder runtime 003
    Given production builder selects <canonical_path>
    When the production preview derives that row
    Then its readable path is <property_name>
    And its Mandatory cell is <mandatory>
    And its Type cell is <data_type>
    And its Allowed values cell contains <allowed_values> in order
    And its Comments cell is <comments>

    Examples:
      | canonical_path       | property_name       | mandatory                                                | data_type       | allowed_values                  | comments              |
      | /page_type           | page_type           | Yes                                                      | String          | product_detail and product_list | Used for page routing |
      | /commerce/currency   | commerce.currency   | Yes when commerce exists                                 | String          | EUR and GBP                     | ISO 4217 code         |
      | /products            | products            | No                                                       | Array of Object | no values                       | One row per product   |
      | /products/*/duration | products[].duration | Yes when price_monthly exists for the same products item | Number          | 12 and 24                       | Whole months          |
      | /tracking_context    | tracking_context    | No                                                       | Unspecified     | no values                       | blank                 |

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
    Then production clipboard writing receives text/html containing one seven-column table
    And it receives text/plain containing matching tab-separated headings and rows
    And property content is escaped without changing its displayed meaning
    And fallback feedback identifies when only plain text was copied
    And no production schema, documentation, rule, source, or selection state is mutated

  # Data layer schema specification builder runtime 006
  Scenario: Data layer schema specification builder runtime 006
    Given side panel and standalone Builder open the same canonical project effective schema revision
    When the production specification builder is invoked on both installed surfaces
    Then both render the same hierarchical selection, rich seven-column rows, effective conditions, conflicts, completeness, and export modes
    And equivalent Spreadsheet and Rich table copies contain structurally identical cells and ordering
    And the standalone surface does not substitute its lightweight requirement grid or a parallel derivation model
