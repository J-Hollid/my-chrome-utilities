Feature: Data layer schema property type editing runtime

  Background:
    Given the built extension side panel is running with the production Schema Library, property editor, validation, documentation, rules, inheritance, and persistence
    And production Page view revision 3 has a working draft with Number order_id, Number price, Array of String tags, and Array of Object products

  # Data layer schema property type editing runtime 001
  Scenario: Data layer schema property type editing runtime 001
    When the production property rows render
    Then each local row has an Edit type control associated with its canonical path
    And the rendered type editor offers String, Number, Boolean, Object, and Array
    And Array alone selects Any item type while Array of String selects String item type
    And the rendered Type mismatch treatment control offers Error, Warning, and Ignore
    And a property without stored treatment renders Error
    And inherited rows identify their owning schema instead of permitting a conflicting local edit

  # Data layer schema property type editing runtime 002
  Scenario Outline: Data layer schema property type editing runtime 002
    When production order_id is changed from Number to <selected_type>
    Then the rendered review shows Number changing to <selected_type>
    And confirmation stores production type <stored_type> only in the working draft
    And production published revision 3 remains byte-for-byte unchanged

    Examples:
      | selected_type | stored_type |
      | String        | string      |
      | Boolean       | boolean     |
      | Object        | object      |

  # Data layer schema property type editing runtime 003
  Scenario Outline: Data layer schema property type editing runtime 003
    When production tags is saved as <selected_type>
    Then its persisted array definition has <item_definition>
    And production validation produces <validation_outcome>
    And the rendered property metadata displays <displayed_type>

    Examples:
      | selected_type    | item_definition       | validation_outcome                              | displayed_type   |
      | Array            | no items constraint   | mixed item types accepted                       | type array        |
      | Array of String  | string items          | non-string items fail at their concrete indexes | type array of string |
      | Array of Number  | number items          | non-number items fail at their concrete indexes | type array of number |
      | Array of Object  | object items          | Add item property is available                  | type array of object |

  # Data layer schema property type editing runtime 004
  Scenario: Data layer schema property type editing runtime 004
    Given production products has item properties, item documentation, required membership, and attached rules
    When the operator proposes changing products from Array of Object to Array
    Then the production impact review lists every descendant definition, documentation entry, required relationship, and rule that would be removed
    And production persistence remains unchanged before explicit destructive confirmation
    And cancelling restores focus and the unchanged products row

  # Data layer schema property type editing runtime 005
  Scenario: Data layer schema property type editing runtime 005
    Given production order_id has compatible requiredness and description plus incompatible Number example, Numeric range rule, and conditional dependency
    When production type editing proposes String
    Then the production review preserves compatible data and blocks confirmation on unresolved incompatible data
    And each incompatible artifact can be explicitly removed or replaced without changing reusable Rule Library definitions
    And no production value or rule is silently coerced

  # Data layer schema property type editing runtime 006
  Scenario: Data layer schema property type editing runtime 006
    Given production working draft stores String order_id and Array tags with Any item type
    When the side panel reloads, the draft is reopened, and Build specification is opened for the working draft
    Then production property metadata and specification rows display the edited types
    When the operator publishes the working draft
    Then production validation uses the edited type constraints in the new revision
    And historical revision 3 retains the original types
    And runtime coverage exercises rendered controls, impact review, persistence, validation, reload, publication, and specification output

  # Data layer schema property type editing runtime 007
  Scenario Outline: Data layer schema property type editing runtime 007
    Given production price is declared Number with Type mismatch treatment <treatment>
    When production validation receives price as String value 19.95
    Then the production payload retains the String value without coercion
    And the production validation details contain <type_evidence>
    And the production validation summary is <validation_summary>
    And production specification output continues to identify price as Number

    Examples:
      | treatment | type_evidence                              | validation_summary |
      | Error     | one error-severity Type mismatch at /price | 1 error            |
      | Warning   | one warning-severity Type mismatch at /price | 1 warning        |
      | Ignore    | no Type mismatch for /price                | Valid              |

  # Data layer schema property type editing runtime 008
  Scenario: Data layer schema property type editing runtime 008
    Given production tags is Array of String with Type mismatch treatment Warning
    When production validation receives a Number at /tags/1
    Then its validation details contain one warning-severity Type mismatch at /tags/1
    When production tags changes to Type mismatch treatment Ignore
    Then production validation suppresses property and item Type mismatch issues for tags
    And unrelated required, allowed-value, range, and conditional rules retain their own outcomes and severity

  # Data layer schema property type editing runtime 009
  Scenario: Data layer schema property type editing runtime 009
    Given production price is Number with Type mismatch treatment Warning in the working draft
    When the side panel reloads and the draft is reopened
    Then the production price row restores Number and Warning
    When the operator publishes the draft
    Then current events are revalidated with Warning treatment
    And production revision 3 remains immutable with Error treatment
    And runtime coverage exercises all three treatments for scalar, array, and array-item mismatches
