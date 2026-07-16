Feature: Data layer schema declared property exceptions

  Background:
    Given a Payload schema working draft enables Only declared properties are allowed
    And it declares object properties /metadata and /commerce
    And Allow undeclared properties is enabled for /metadata

  # Data layer schema declared property exceptions 001
  Scenario Outline: Data layer schema declared property exceptions 001
    Given property <property_path> has type <property_type>
    When compatible rule types are calculated
    Then Allow undeclared properties has availability <availability>

    Examples:
      | property_path | property_type | availability |
      | /metadata     | object        | available    |
      | /title        | string        | unavailable  |
      | /items        | array         | unavailable  |

  # Data layer schema declared property exceptions 002
  Scenario: Data layer schema declared property exceptions 002
    When an otherwise valid payload contains undeclared /metadata/source, /debug, and /commerce/internal
    Then /metadata/source produces no Undeclared property issue
    And Undeclared property issues identify /debug and /commerce/internal
    And Only declared properties are allowed remains enabled for the schema

  # Data layer schema declared property exceptions 003
  Scenario: Data layer schema declared property exceptions 003
    Given /metadata declares required string property /metadata/category
    And /metadata declares object property /metadata/settings
    When /metadata/category has number value 42 and /metadata/settings contains undeclared property debug
    Then the configured category validation issue identifies /metadata/category
    And one Undeclared property issue identifies /metadata/settings/debug
    And the exception does not suppress validation of declared children
    And the exception does not apply to a nested declared object boundary

  # Data layer schema declared property exceptions 004
  Scenario: Data layer schema declared property exceptions 004
    Given products is an array of objects that declare object property attributes
    And Allow undeclared properties is enabled for /products/*/attributes
    When two product attributes objects contain different undeclared properties
    Then neither dynamic attributes property produces an Undeclared property issue
    And Only declared properties are allowed remains active at each product item boundary
    And the exception retains wildcard template path /products/*/attributes

  # Data layer schema declared property exceptions 005
  Scenario: Data layer schema declared property exceptions 005
    When the exception is disabled or removed
    Then undeclared direct properties of /metadata produce Undeclared property issues again
    And other schema and property rules remain unchanged

  # Data layer schema declared property exceptions 006
  Scenario: Data layer schema declared property exceptions 006
    When the schema draft is saved and reopened
    Then the /metadata property row identifies the enabled exception
    And validation continues to allow undeclared direct properties of /metadata
    And the published schema remains unchanged until the draft is published
