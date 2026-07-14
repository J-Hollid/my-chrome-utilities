Feature: Data layer Live allowed-value expansion runtime

  Background:
    Given the built extension is running with production schema, validation, and Live event systems
    And captured event page_view is assigned to Otelo - Generic Pageview revision 2
    And property /page_type fails an Allowed values rule in the Live event inspector

  # Data layer Live allowed-value expansion runtime 001
  Scenario Outline: Data layer Live allowed-value expansion runtime 001
    Given the stored validation evidence identifies <rule_identity> and <rule_origin>
    And the actual property value is <actual_value>
    When the operator opens the actual DOM rule details
    Then one Add this value to schema as an allowed value control has <action_state>
    And an available control targets the evidenced rule identity rather than a display-label lookup

    Examples:
      | rule_identity | rule_origin            | actual_value        | action_state |
      | stable id 41  | local schema rule      | string product_test | enabled      |
      | stable id 42  | reusable rule revision | number 7             | enabled      |
      | stable id 43  | inherited schema rule  | boolean false        | enabled      |
      | absent        | unresolved             | string product_test | absent       |
      | stable id 44  | local schema rule      | object value         | absent       |

  # Data layer Live allowed-value expansion runtime 002
  Scenario: Data layer Live allowed-value expansion runtime 002
    Given local rule stable id 41 allows product and content
    And Otelo - Generic Pageview has a working draft with one unrelated pending change
    When the operator confirms product_test through the actual quick-action review
    Then the persisted working draft contains product, content, and product_test exactly once in that order
    And the pre-existing pending change remains unchanged
    And one new change references /page_type, stable id 41, and string product_test
    And the published revision, condition, severity, message, and other rule configuration remain unchanged
    And storage reload does not create another schema draft, rule, or value

  # Data layer Live allowed-value expansion runtime 003
  Scenario Outline: Data layer Live allowed-value expansion runtime 003
    Given local rule stable id 41 does not allow <actual_value>
    When <actual_value> is added and the extension state is serialized and reloaded
    Then the working draft contains one allowed value with JSON type <json_type> and value <stored_value>
    And validation after reload distinguishes it from <different_value>

    Examples:
      | actual_value        | json_type | stored_value | different_value |
      | number 1            | number    | 1            | string 1        |
      | string 1            | string    | 1            | number 1        |
      | boolean false       | boolean   | false        | string false    |
      | null                | null      | null         | missing         |
      | string New York, NY | string    | New York, NY | two strings     |

  # Data layer Live allowed-value expansion runtime 004
  Scenario Outline: Data layer Live allowed-value expansion runtime 004
    Given stable rule 41 has <rule_origin>
    When the operator chooses <destination> and confirms product_test
    Then the persisted mutation is <expected_mutation>
    And no other published schema or reusable-rule revision is mutated

    Examples:
      | rule_origin            | destination              | expected_mutation                                                   |
      | local schema rule      | assigned schema draft    | widen stable rule 41 in the assigned schema working draft           |
      | inherited schema rule  | parent schema draft      | widen stable rule 41 in the parent schema working draft             |
      | inherited schema rule  | assigned schema override | replace the inherited constraint with one widened local constraint  |
      | reusable rule revision | reusable rule revision   | create the next reusable revision and stage its attachment update    |
      | reusable rule revision | assigned schema override | replace the attachment constraint with one widened local constraint |

  # Data layer Live allowed-value expansion runtime 005
  Scenario: Data layer Live allowed-value expansion runtime 005
    Given /page_type fails Allowed values rules with stable ids 41 and 42
    And the opened issue evidence identifies stable id 41
    When the operator adds product_test from that issue and publishes the draft
    Then persisted rule 41 allows product_test
    And persisted rule 42 is byte-for-byte unchanged
    And no third Allowed values rule exists at /page_type
    And production validation still reports stable id 42 when product_test violates it

  # Data layer Live allowed-value expansion runtime 006
  Scenario: Data layer Live allowed-value expansion runtime 006
    Given the current captured event fails stable rule 41 for product_test
    When the operator adds product_test and publishes the affected schema draft
    Then production publication refresh revalidates the existing captured event without recapture
    And the DOM no longer shows stable rule 41 as failed
    And the DOM no longer offers its Add this value to schema as an allowed value control
    And feed summaries, property details, rule-revision queries, and defect matching use the new evaluation
    And the original captured payload and capture evidence are unchanged

  # Data layer Live allowed-value expansion runtime 007
  Scenario: Data layer Live allowed-value expansion runtime 007
    Given the quick action is visible in a 320 pixel wide side panel
    And the Live inspector is scrolled to /page_type for the selected captured event
    When the operator opens the review, cancels it, reopens it, confirms it, and returns from the working draft
    Then every action remains operable in the actual DOM at 320 pixels
    And the selected event, /page_type disclosure, and scroll position are restored when available
    And keyboard focus returns to the originating control or its working-draft continuation
    And the exercised path uses production validation evidence, schema drafts, persistence, publication, and Live revalidation code
