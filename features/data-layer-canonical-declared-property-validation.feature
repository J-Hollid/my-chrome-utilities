# mutation-stamp: sha256=8844e7cabd035f5b11be76050eb0b88eb9be2b0d3d44db4756ac932e903691f2
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T23:23:43.159265321Z","feature_name":"Data layer canonical declared property validation","feature_path":"features/data-layer-canonical-declared-property-validation.feature","background_hash":"02b9739204097fcce9d5a5d39f11d4e1eb4f91cafeb8c30d4c70525ec031ad21","implementation_hash":"unknown","scenarios":[{"index":2,"name":"Data layer canonical declared property validation 003","scenario_hash":"7529f4e874d76a6c806f381a009caa4864766a2a9551301ab0e4dec36189cad1","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-07-14T23:23:43.159265321Z"},{"index":3,"name":"Data layer canonical declared property validation 004","scenario_hash":"213cbeebd290fdae4d5c410f64ec570f4544f3dc7a7c3fca49a9cdee2f1b79bb","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-14T23:23:43.159265321Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer canonical declared property validation

  Background:
    Given Generic pageview revision 3 is assigned to history event pageview and target payload
    And its schema declares page_type, login_status, and page_levels
    And Only declared properties are allowed is enabled

  # Data layer canonical declared property validation 001
  Scenario: Data layer canonical declared property validation 001
    Given the declarations are stored by canonical paths /page_type, /login_status, and /page_levels
    When payload {"page_type":"product_detail","login_status":"logged in","page_levels":["product"]} is validated
    Then no declared property produces an Undeclared property issue
    And validation resolves each payload key to its canonical schema property
    And the stored schema revision remains unchanged

  # Data layer canonical declared property validation 002
  Scenario: Data layer canonical declared property validation 002
    Given the declarations are stored by canonical paths /page_type, /login_status, and /page_levels
    When payload {"page_type":"product_detail","login_status":"logged in","page_levels":["product"],"debug":true} is validated
    Then exactly one Undeclared property issue is produced
    And that issue identifies concrete path /debug, expected declared property, and actual boolean
    And page_type, login_status, and page_levels do not produce Undeclared property issues

  # Data layer canonical declared property validation 003
  Scenario Outline: Data layer canonical declared property validation 003
    Given <schema_representation> declares <canonical_path>
    When a payload containing <payload_property> is checked for undeclared properties
    Then <payload_property> is recognized as declared at <canonical_path>
    And no literal leading-slash property name is required in the payload

    Examples:
      | schema_representation                                  | canonical_path       | payload_property   |
      | nested root property page_type                         | /page_type           | page_type          |
      | path-keyed root property /page_type                    | /page_type           | page_type          |
      | flat array root /page_levels with item /page_levels/0  | /page_levels         | page_levels        |
      | nested array item products every item name             | /products            | products           |
      | inherited path-keyed property /site_id                 | /site_id             | site_id            |

  # Data layer canonical declared property validation 004
  Scenario Outline: Data layer canonical declared property validation 004
    Given path-keyed property /page_type has <additional_validation>
    When payload property page_type has <actual_state>
    Then page_type has validation outcome <validation_outcome>
    And page_type does not also produce an Undeclared property issue

    Examples:
      | additional_validation                    | actual_state             | validation_outcome                    |
      | type string                              | number 42                | one Type mismatch issue               |
      | Required rule                            | missing                  | one Required value issue              |
      | Allowed values product and content       | value internal           | one Value is not allowed issue        |
      | Allowed values product and content       | value product            | no issue                              |

  # Data layer canonical declared property validation 005
  Scenario: Data layer canonical declared property validation 005
    Given parent schema Generic event declares path-keyed property /site_id
    And child schema Generic pageview declares path-keyed property /page_type
    And the child enables Only declared properties are allowed
    When payload {"site_id":"otelo","page_type":"product_detail","debug":true} is validated with the child schema
    Then inherited site_id and local page_type are recognized as declared
    And exactly one Undeclared property issue identifies /debug
    And the parent and child schema documents remain unchanged

  # Data layer canonical declared property validation 006
  Scenario: Data layer canonical declared property validation 006
    When the operator disables Only declared properties are allowed
    And an otherwise valid payload contains undeclared property debug
    Then debug does not produce an Undeclared property issue
    And declared-property normalization does not impose a closed-object policy

  # Data layer canonical declared property validation 007
  Scenario: Data layer canonical declared property validation 007
    Given page_levels is declared by flat paths /page_levels and /page_levels/0
    And /page_levels/0 requires a string item
    When payload {"page_type":"product_detail","login_status":"logged in","page_levels":[42]} is validated
    Then page_levels is recognized as a declared root property
    And one Type mismatch issue identifies /page_levels/0
    And no Undeclared property issue is produced for page_levels or its item

  # Data layer canonical declared property validation 008
  Scenario: Data layer canonical declared property validation 008
    Given current Live events were validated before Only declared properties are allowed was published
    When Generic pageview revision 4 publishes the enabled policy
    Then every current Live event is revalidated against canonical declared properties
    And declared properties remain free of Undeclared property issues
    And each genuinely undeclared property is reported once
    And saved-session validation evidence remains associated with its original schema revision
