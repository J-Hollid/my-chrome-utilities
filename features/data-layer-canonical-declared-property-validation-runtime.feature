Feature: Data layer canonical declared property validation runtime

  Background:
    Given the built extension side panel is running with production schema editing, validation, persistence, and Live event presentation
    And persisted Generic pageview working draft declares path-keyed properties /page_type, /login_status, and /page_levels
    And a production event payload contains page_type, login_status, and page_levels

  # Data layer canonical declared property validation runtime 001
  Scenario: Data layer canonical declared property validation runtime 001
    Given the production schema document JSON is recorded
    When the operator checks Only declared properties are allowed in the actual schema editor
    And production draft validation runs
    Then page_type, login_status, and page_levels produce no Undeclared property issue
    And production schema state stores additionalProperties false
    And the recorded property definitions remain byte-for-byte unchanged
    And no property definition is added, removed, renamed, or migrated

  # Data layer canonical declared property validation runtime 002
  Scenario: Data layer canonical declared property validation runtime 002
    Given the production payload also contains debug with boolean value true
    And Only declared properties are allowed is checked
    When production validation completes
    Then its issues contain exactly one Undeclared property issue at /debug
    And that issue displays expected declared property and actual boolean
    And no declared payload key appears in an Undeclared property issue

  # Data layer canonical declared property validation runtime 003
  Scenario Outline: Data layer canonical declared property validation runtime 003
    Given a production schema uses <schema_representation>
    And Only declared properties are allowed is checked
    When production validation receives <payload>
    Then canonical property <canonical_path> is recognized as declared
    And the production result contains <expected_undeclared_issues> Undeclared property issues

    Examples:
      | schema_representation                                  | payload                              | canonical_path    | expected_undeclared_issues |
      | nested property page_type                              | {"page_type":"product"}            | /page_type        | 0                          |
      | path-keyed property /page_type                         | {"page_type":"product"}            | /page_type        | 0                          |
      | flat array /page_levels and item /page_levels/0        | {"page_levels":["product"]}         | /page_levels      | 0                          |
      | inherited path-keyed property /site_id                 | {"site_id":"otelo"}                | /site_id          | 0                          |
      | path-keyed property /page_type                         | {"page_type":"product","debug":1} | /page_type        | 1                          |

  # Data layer canonical declared property validation runtime 004
  Scenario: Data layer canonical declared property validation runtime 004
    Given production path-keyed page_type has type string, is required, and allows product and content
    And Only declared properties are allowed is checked
    When the production validator evaluates missing, numeric, disallowed, and allowed page_type payloads
    Then the payloads respectively produce Required value, Type mismatch, Value is not allowed, and no page_type issue
    And none produces an Undeclared property issue for page_type
    And each issue and evaluation retains canonical property path /page_type and rule provenance

  # Data layer canonical declared property validation runtime 005
  Scenario: Data layer canonical declared property validation runtime 005
    Given production parent Generic event declares /site_id
    And production child Generic pageview declares /page_type and inherits Generic event
    And the child checks Only declared properties are allowed
    When production validation receives {"site_id":"otelo","page_type":"product","debug":true}
    Then production effective-schema validation accepts site_id and page_type as declared
    And reports only /debug as undeclared
    And parent and child persisted documents remain byte-for-byte unchanged

  # Data layer canonical declared property validation runtime 006
  Scenario: Data layer canonical declared property validation runtime 006
    Given Only declared properties are allowed has been saved and published through production controls
    And the current Live feed already contains declared-only and extra-property events
    When publication-triggered production revalidation completes
    Then the declared-only event is Valid unless another configured rule fails
    And each extra property produces one concrete Undeclared property issue
    And feed rows, event details, queries, and defect matching use the refreshed results
    And reopening the schema editor keeps the policy checked without changing property definitions

  # Data layer canonical declared property validation runtime 007
  Scenario: Data layer canonical declared property validation runtime 007
    Given the production schema editor has Only declared properties are allowed checked
    When the operator unchecks it and production validation reruns
    Then an extra debug property no longer produces an Undeclared property issue
    And type, required, allowed-value, and attached-rule validation remain active
    And runtime coverage exercises the production checkbox, effective schema, validator, persistence, publication refresh, and rendered Live results rather than source-string inspection
