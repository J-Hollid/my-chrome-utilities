# mutation-stamp: sha256=646ec9064a7d4a88fb89d3c1b9ce65a3d19a93dad02a2583f8b96a23c22e3a32
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-16T16:02:10.871996345Z","feature_name":"Data layer schema property type editing","feature_path":"features/data-layer-schema-property-type-editing.feature","background_hash":"4d5e29200ad481f0d25a4b89b7eaae5bedfdebbda9f01e949c413d48cfc6deed","implementation_hash":"98ffc0ff265060c88d1ad13c762472a8e01a318a","scenarios":[{"index":1,"name":"Data layer schema property type editing 002","scenario_hash":"f49483764d00f659861b65fc6b795cc341ca4be303e935ad301ee829ed574dec","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-16T16:02:10.871996345Z"},{"index":2,"name":"Data layer schema property type editing 003","scenario_hash":"6b9948f3a3a04eda026fdd10abf5caddc350afca2a427535e56b58324893da6f","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-16T16:02:10.871996345Z"},{"index":4,"name":"Data layer schema property type editing 005","scenario_hash":"1d08414b93160908c7e7ef31286de3112cf42fced4abad5a012f2c15ed581567","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-16T16:02:10.871996345Z"},{"index":9,"name":"Data layer schema property type editing 010","scenario_hash":"ae005b346047d3e2398e29ef69d8b18bb3188b14dd89ce8f2591d7e6f8e0eb11","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-16T16:02:10.871996345Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema property type editing

  Background:
    Given Page view revision 3 has an open working draft
    And its local property order_id was observed as Number
    And its local property price is specified as Number
    And its local property tags is an Array of String
    And its local property products is an Array of Object with item properties

  # Data layer schema property type editing 001
  Scenario: Data layer schema property type editing 001
    When the schema property tree is displayed
    Then each local property row offers Edit type with its current type
    And Value type offers String, Number, Boolean, Object, and Array
    And selecting Array reveals Item type with Any item type, String, Number, Boolean, and Object
    And selecting another value type hides Item type
    And Type mismatch treatment offers Error, Warning, and Ignore with Error selected by default
    And no type change is saved before review confirmation

  # Data layer schema property type editing 002
  Scenario Outline: Data layer schema property type editing 002
    Given order_id has no type-incompatible rule, example, or descendant
    When the operator changes order_id from Number to <new_type>
    Then the review identifies Number changing to <new_type>
    And confirmation stores order_id as <stored_type> in the working draft
    And order_id documentation and required membership remain unchanged
    And Page view revision 3 remains current

    Examples:
      | new_type | stored_type |
      | String   | string      |
      | Boolean  | boolean     |
      | Object   | object      |

  # Data layer schema property type editing 003
  Scenario Outline: Data layer schema property type editing 003
    Given tags has no item documentation, item rule, or item descendant
    When the operator changes tags from <current_type> to <selected_type>
    Then the review identifies item validation as <item_validation>
    And confirmation stores tags as <stored_definition>
    And tags remains an array property in the working draft

    Examples:
      | current_type    | selected_type    | item_validation                  | stored_definition                  |
      | Array of String | Array            | no item type validation          | array without an items constraint  |
      | Array           | Array of String  | every item must be a string      | array with string items            |
      | Array of String | Array of Number  | every item must be a number      | array with number items            |
      | Array           | Array of Object  | every item must be an object      | array with object items            |

  # Data layer schema property type editing 004
  Scenario: Data layer schema property type editing 004
    Given tags is changed to Array with Any item type
    When payloads containing string, number, boolean, object, and mixed tags items are validated
    Then each tags value is accepted as array content
    And a non-array tags value still produces a Type mismatch issue
    When tags is changed to Array of String
    Then each non-string item produces one Type mismatch issue at its concrete array index
    And string items remain valid

  # Data layer schema property type editing 005
  Scenario Outline: Data layer schema property type editing 005
    Given <property_path> has <dependent_schema_data>
    When the operator proposes <new_type>
    Then the impact review identifies <affected_data>
    And no property definition, documentation, rule, or required relationship changes before confirmation
    And destructive confirmation is required before affected data can be removed

    Examples:
      | property_path | dependent_schema_data                                      | new_type        | affected_data                                               |
      | /products     | object items with item properties, rules, and documentation | Array           | item definitions, item rules, and item documentation        |
      | /products     | object items with item properties, rules, and documentation | Array of String | item definitions, item rules, and item documentation        |
      | /commerce     | object children with required membership and documentation  | String          | child definitions, required membership, and documentation   |

  # Data layer schema property type editing 006
  Scenario: Data layer schema property type editing 006
    Given order_id has required membership, documentation, a Number example, a Numeric range rule, and a conditional rule that reads order_id as Number
    When the operator proposes changing order_id to String
    Then required membership and type-neutral documentation are marked compatible and retained
    And the Type mismatch treatment is marked compatible and retained
    And the Number example, Numeric range rule, and Number conditional dependency are marked incompatible
    And saving is blocked until every incompatible item is explicitly removed, replaced, or the change is cancelled
    And no example value, rule parameter, or condition value is converted automatically
    And removing a reusable-rule attachment does not change its Rule Library definition

  # Data layer schema property type editing 007
  Scenario: Data layer schema property type editing 007
    Given site_id is inherited from Base event as String
    When the operator activates its type action in the Page view editor
    Then Page view does not offer a conflicting local type change
    And the action identifies Base event as the type origin
    And the operator can open Base event to edit the owning property
    And Page view and Base event remain unchanged until an owning-schema draft is confirmed

  # Data layer schema property type editing 008
  Scenario: Data layer schema property type editing 008
    Given order_id was changed from Number to String in the Page view working draft
    And tags was changed from Array of String to Array with Any item type
    When the side panel reloads and the working draft is reopened
    Then both edited type definitions are restored with pending changes
    And the specification builder displays String for order_id and Array for tags from the working draft
    When the working draft is published
    Then the new revision validates and documents the edited types
    And revision 3 retains the previous Number and Array of String definitions

  # Data layer schema property type editing 009
  Scenario: Data layer schema property type editing 009
    Given a type edit review is open with resolved impacts
    When the operator cancels or persistence fails
    Then the selected property and every dependent schema artifact remain unchanged
    And cancellation returns focus to Edit type on the property row
    And persistence failure keeps the review and resolutions available for retry

  # Data layer schema property type editing 010
  Scenario Outline: Data layer schema property type editing 010
    Given price is specified as Number with Type mismatch treatment <treatment>
    And price has no other failing validation rule
    When an event containing price as String value 19.95 is validated
    Then the captured price remains the String value 19.95 without coercion
    And the declared price type remains Number
    And price produces <type_outcome>
    And the event validation summary is <validation_summary>
    And an event containing price as Number value 19.95 has no price type mismatch

    Examples:
      | treatment | type_outcome                       | validation_summary |
      | Error     | one error-severity Type mismatch   | 1 error            |
      | Warning   | one warning-severity Type mismatch | 1 warning          |
      | Ignore    | no Type mismatch issue             | Valid              |

  # Data layer schema property type editing 011
  Scenario: Data layer schema property type editing 011
    Given tags is specified as Array of String with Type mismatch treatment Warning
    When an event contains a non-array tags value
    Then one warning-severity Type mismatch identifies /tags
    When an event contains a Number item at tags index 1
    Then one warning-severity Type mismatch identifies /tags/1
    When the tags Type mismatch treatment is changed to Ignore
    Then neither the non-array value nor the Number item produces a Type mismatch issue
    And the tags declaration remains Array of String

  # Data layer schema property type editing 012
  Scenario: Data layer schema property type editing 012
    Given price has a required rule with Error severity and Type mismatch treatment Ignore
    When an event omits price
    Then the required rule still produces its Error-severity issue
    And Ignore does not suppress required, allowed-value, range, or conditional-rule outcomes
    And each non-type rule retains its own applicability, severity, and message

  # Data layer schema property type editing 013
  Scenario: Data layer schema property type editing 013
    Given price is specified as Number with Type mismatch treatment Warning in the working draft
    When the side panel reloads and the working draft is reopened
    Then price displays type Number and Type mismatch treatment Warning
    And the specification builder continues to display Number as the specified price type
    When the working draft is published
    Then new validation uses Warning for price type mismatches
    And revision 3 retains Error treatment
