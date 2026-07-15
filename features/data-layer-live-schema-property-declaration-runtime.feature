Feature: Data layer Live schema property declaration runtime

  Background:
    Given the built extension side panel is running with production Live inspection, Schema Library drafts, persistence, and validation
    And production product_view contains products item 0 with product_name Phone and product_id 42
    And Product detail revision 3 is the selected production working-draft continuation context

  # Data layer Live schema property declaration runtime 001
  Scenario: Data layer Live schema property declaration runtime 001
    When the production Live property tree renders product_name
    Then its row contains distinct Add to schema and Add validation controls
    And Add to schema identifies canonical destination Product detail
    And activating Add to schema does not invoke the production validation-rule flow

  # Data layer Live schema property declaration runtime 002
  Scenario Outline: Data layer Live schema property declaration runtime 002
    When the operator clicks production Add to schema for <concrete_path>
    Then the rendered declaration review shows <canonical_path>, <detected_type>, and Product detail revision 3
    And no requirement, scope, assignment, attached-rule, or reusable-rule control is rendered
    And production persistence remains unchanged before confirmation

    Examples:
      | concrete_path                 | canonical_path                  | detected_type |
      | /products/0/product_name      | /products/*/product_name        | String        |
      | /products/0/product_id        | /products/*/product_id          | Number        |

  # Data layer Live schema property declaration runtime 003
  Scenario: Data layer Live schema property declaration runtime 003
    Given production declaration review selects /products/*/product_name as String
    When the operator confirms Add property to Product detail draft
    Then production persistence adds the canonical nested definition and necessary structural ancestors
    And production attached-rule and assignment collections are byte-for-byte unchanged
    And the stored property has no required, allowed-value, exact-value, range, pattern, or conditional constraint
    And the originating Live inspector is restored with focus on product_name Add to schema

  # Data layer Live schema property declaration runtime 004
  Scenario: Data layer Live schema property declaration runtime 004
    Given production persistence already declares /products/*/product_name with sibling metadata and parent constraints
    When production declaration-only addition saves /products/*/product_id
    Then both properties are rendered beneath the same products item object
    And existing product_name, array, item-object, metadata, and rule data remain byte-for-byte unchanged
    And product_id has no attached rule

  # Data layer Live schema property declaration runtime 005
  Scenario: Data layer Live schema property declaration runtime 005
    Given production Only declared properties are allowed is enabled
    And production /products/*/product_name was added from Live without a validation rule
    When production validation checks payloads with product_name present and absent
    Then product_name produces neither an Undeclared property issue nor a Required value issue
    And no product_name attached-rule evaluation is rendered
    When the draft is published and the side panel reloads
    Then the production schema tree still identifies product_name as a declaration with 0 active rules
