Feature: Data layer missing-event expected payload hardening

  Background:
    Given Generic pageview revision 4 stores schema properties by canonical paths /page_levels, /page_levels/0, /page_type, /page_section, /login_status, and /b_id
    And /page_levels is an array whose /page_levels/0 descendant is a string
    And the schema has applicable Allowed values rules for /page_levels/*, /page_type, and /login_status
    And a missing pageview report is open with that exact schema revision

  # Data layer missing-event expected payload hardening 001
  Scenario Outline: Data layer missing-event expected payload hardening 001
    Given the schema workspace entry is <schema_entry>
    When the expected-payload model is derived
    Then the editor field is <editor_field>
    And its canonical payload pointer is <payload_pointer>
    And its payload shape is <payload_shape>

    Examples:
      | schema_entry                         | editor_field          | payload_pointer     | payload_shape                |
      | root path /page_type                 | page_type string      | /page_type          | property page_type           |
      | array path /page_levels              | page_levels array     | /page_levels        | property page_levels         |
      | indexed path /page_levels/0          | page_levels.0 string  | /page_levels/0      | item 1 of page_levels        |
      | wildcard path /products/*/name       | products.0.name string | /products/0/name   | name in item 1 of products   |

  # Data layer missing-event expected payload hardening 002
  Scenario: Data layer missing-event expected payload hardening 002
    When canonical path-keyed container and descendant definitions are combined
    Then /page_levels and /page_levels/0 form one nested array definition
    And required markers and attached rule paths resolve to the same canonical payload nodes
    And no schema entry beginning with slash becomes a literal payload property name
    And deriving the nested model does not mutate the stored schema revision

  # Data layer missing-event expected payload hardening 003
  Scenario: Data layer missing-event expected payload hardening 003
    Given page_levels has no expected items
    When the operator activates Add page_levels item
    Then one editable string item is created at /page_levels/0
    And the array action completes without an uncaught error
    And the item remains incomplete until a valid value is chosen or entered
    When the operator chooses schema value d
    Then the expected payload contains page_levels array with item d

  # Data layer missing-event expected payload hardening 004
  Scenario: Data layer missing-event expected payload hardening 004
    Given schema array path /untyped_list has no item definition or descendant definition
    When its expected-payload controls are displayed
    Then Add untyped_list item is unavailable
    And inline assistance states that the array item type must be defined
    And no click or keyboard action can throw an uncaught array error

  # Data layer missing-event expected payload hardening 005
  Scenario: Data layer missing-event expected payload hardening 005
    Given the custom input for /login_status has focus at caret position 0
    When the operator types logged in one character at a time
    Then every character is retained in order
    And focus remains in the same field after every character
    And the caret remains after the last typed character
    And preview refreshes do not reset the field, disclosure, or editor scroll position

  # Data layer missing-event expected payload hardening 006
  Scenario Outline: Data layer missing-event expected payload hardening 006
    Given applicable rule <rule_identity> provides <allowed_values> at <rule_path>
    When expected field <editor_field> is displayed
    Then schema-value choices are <allowed_values>
    And choosing <selected_value> stores <stored_value> with JSON type <json_type>
    And the response source identifies <rule_identity>
    And a custom type-aware value remains available

    Examples:
      | rule_identity          | rule_path         | editor_field       | allowed_values                 | selected_value | stored_value  | json_type |
      | Page level values v2   | /page_levels/*    | page_levels.0      | d and c                       | d              | d             | string    |
      | Indexed page level v4  | /page_levels/0    | page_levels.0      | d and e                       | e              | e             | string    |
      | Page type values v3    | /page_type        | page_type          | product_detail and content    | product_detail | product_detail | string   |
      | Login values v1        | /login_status     | login_status       | not logged in and logged in   | logged in      | logged in     | string    |
      | Consent values v1      | /consent          | consent            | boolean false and true        | boolean false  | boolean false | boolean   |

  # Data layer missing-event expected payload hardening 007
  Scenario: Data layer missing-event expected payload hardening 007
    Given a custom expected value does not satisfy an applicable schema rule
    When the expected payload is evaluated against Generic pageview revision 4
    Then the field displays the production validation issue at its canonical payload path
    And the custom value remains editable
    And Copy for Jira Cloud and save actions remain unavailable
    When every required field and rule becomes valid
    Then the expected payload evaluation is Valid
    And report completion actions become available without another creation step

  # Data layer missing-event expected payload hardening 008
  Scenario: Data layer missing-event expected payload hardening 008
    Given expected values are page_levels item d, page_type product_detail, page_section product, login_status logged in, and b_id 123
    When the expected payload is assembled
    Then it equals {"page_levels":["d"],"page_type":"product_detail","page_section":"product","login_status":"logged in","b_id":"123"}
    And no payload key contains slash, tilde pointer escaping, an array index, or a complete property path
    And property and array-item order follows the schema model

  # Data layer missing-event expected payload hardening 009
  Scenario: Data layer missing-event expected payload hardening 009
    Given the expected payload is valid
    When Expected result is presented
    Then pageview is fired with appears once as the narrative
    And one indented JSON payload block follows the narrative
    And compact JSON is not repeated before the formatted block
    And the JSON block uses the same monospace object and array presentation as an existing-event defect report

  # Data layer missing-event expected payload hardening 010
  Scenario: Data layer missing-event expected payload hardening 010
    Given the same valid missing-event report is visible, copied, and saved
    When its Expected result representations are compared
    Then preview, Jira text, and the Defect Library record contain the same narrative and payload
    And each representation contains the expected payload exactly once
    And reopening and recopying the defect preserves the nested array and primitive JSON types

  # Data layer missing-event expected payload hardening 011
  Scenario: Data layer missing-event expected payload hardening 011
    Given the operator has entered partial expected values
    When an array item is added, duplicated, or removed
    Then values and response sources outside the changed array position remain unchanged
    And field errors and completion state are recalculated from the current payload
    And focus returns to the structural action or the created item without moving to the top of the editor
