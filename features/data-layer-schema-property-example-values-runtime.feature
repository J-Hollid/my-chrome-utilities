# mutation-stamp: sha256=0c0b38b54e1dadaf8bbaa98b4160569c573cf97ddfb648c987b7e7d155cce921
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T11:24:37.534434398Z","feature_name":"Data layer schema property example values runtime","feature_path":"features/data-layer-schema-property-example-values-runtime.feature","background_hash":"f835fa1415b787381de2725d564d7739b2b895c9197d9f1eeb5a014b0e43fa2e","implementation_hash":"860b6639581bc5b1d4339c6e3547eb326af1359b0bc9cfe4e1007d4eff0d17e9","scenarios":[{"index":1,"name":"Data layer schema property example values runtime 002","scenario_hash":"5ed5302c9a19c2e277c2e70fec6e0b714219500897c7de8da4b0fd10ac473330","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-15T11:24:37.534434398Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema property example values runtime

  Background:
    Given the built extension side panel is running with production Schema Library persistence and defect report builders
    And Product detail current revision 3 defines /login_status with Allowed values not logged in and logged in

  # Data layer schema property example values runtime 001
  Scenario: Data layer schema property example values runtime 001
    When the operator opens the rendered /login_status documentation editor
    Then the Example value control renders typed choices not logged in and logged in and a custom alternative
    When logged in is selected and documentation is saved
    Then production persistence stores one /login_status example value with its JSON type and allowed-value selection method in the working draft
    And rerendering and reopening the editor restores the same selected value
    And the published schema revision, property definition, and attached rule are byte-for-byte unchanged

  # Data layer schema property example values runtime 002
  Scenario Outline: Data layer schema property example values runtime 002
    Given production property <property_path> has schema type <property_type>
    When custom example <custom_example> is entered and the documentation editor is saved and reopened
    Then the persisted example is <custom_example> with JSON type <json_type>
    And the custom control renders the same typed value

    Examples:
      | property_path | property_type | custom_example | json_type |
      | /product_name | string        | robot          | string    |
      | /product_id   | number        | 1              | number    |
      | /consent      | boolean       | false          | boolean   |
      | /category     | nullable      | null           | null      |

  # Data layer schema property example values runtime 003
  Scenario: Data layer schema property example values runtime 003
    Given production documentation maps /products/*/id to display name Product identifier, description Stable product identifier, and number example 1
    And the captured payload contains /products/2/id
    When the production Live inspector renders and opens that property's information
    Then it displays Product identifier, Stable product identifier, and example value 1 from the assigned schema revision
    And it does not alter the rendered observed value or production validation state

  # Data layer schema property example values runtime 004
  Scenario: Data layer schema property example values runtime 004
    Given captured pageview has a production validation issue at /login_status
    And the recorded assigned schema revision documents example value logged in at /login_status
    When the production validation-issue defect builder is opened
    Then its Custom value or response input is hidden and no expected correction is applied from the example
    When the rendered Custom value or response option is selected
    Then the input becomes visible with logged in prefilled once
    And the builder stores one typed expected correction at /login_status
    And report refresh does not duplicate the correction or reset the field

  # Data layer schema property example values runtime 005
  Scenario: Data layer schema property example values runtime 005
    Given the missing-event expected-payload builder uses production documentation mapping /products/*/id to number example 1
    And an expected products item exists at /products/0
    When the rendered custom value control for /products/0/id is selected
    Then its input is prefilled from the wildcard documentation mapping with typed number 1
    And production expected-payload assembly produces {"products":[{"id":1}]}
    And schema validation, preview, copy, save, reopen, and recopy use that same typed payload

  # Data layer schema property example values runtime 006
  Scenario: Data layer schema property example values runtime 006
    Given a defect builder custom response was prefilled from the recorded schema example
    When the operator edits it, triggers preview refresh, changes response method, and selects custom again
    Then the production builder retains the operator's edit instead of reapplying the example
    And focus, selection, disclosure, and report scroll remain associated with the custom control
    When a different issue without an effective example selects custom
    Then its input is empty and does not reuse another property's example

  # Data layer schema property example values runtime 007
  Scenario: Data layer schema property example values runtime 007
    Given inherited and local example values exist across current, historical, and working-draft schema definitions
    When production inheritance resolution, publication, schema duplication, property copy, export, import, reload, documentation removal, and Undo are exercised
    Then every resulting example retains its JSON type, selection method, canonical path, owner, and revision exactly once
    And legacy persisted schemas without example values load with empty example controls

  # Data layer schema property example values runtime 008
  Scenario: Data layer schema property example values runtime 008
    Given production documentation contains an example that conflicts with the applicable Allowed values rule
    When the validation-issue and missing-event defect builders prefill their rendered custom controls
    Then neither builder treats the prefill as schema-valid solely because it came from documentation
    And the validation-issue builder requires its ordinary explicit custom-override confirmation
    And the missing-event builder keeps completion actions unavailable while production schema validation fails
    And generated report representations omit standalone documentation source and example provenance text
