# mutation-stamp: sha256=bc12fea7ada055ef0ccc5a505b47f68b8556329b5c41ba294d81f64cbf8e9397
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-17T20:12:20.179582754Z","feature_name":"Data layer local rule editing runtime","feature_path":"features/data-layer-local-rule-editing-runtime.feature","background_hash":"b9db29e55d3263df92fa9ebd7b015cc3c886931b2ea7177d65744db976737919","implementation_hash":"sha256:cbd4fbe4396103a0ea2b34e6e194d1a04341156b97afffa4f8232bc4d52de9ce","scenarios":[{"index":2,"name":"Data layer local rule editing runtime 003","scenario_hash":"9bbe2ad887f4895fd364b72b0ceba01fa912629788bb40c495483ef40c1fa872","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-17T20:12:20.179582754Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer local rule editing runtime

  Background:
    Given the built extension is running with production schema editor, validation, and persistence systems
    And Page view revision 3 contains local rule stable id local-41 at /page_type

  # Data layer local rule editing runtime 001
  Scenario: Data layer local rule editing runtime 001
    Given local-41 allows page and product with severity warning
    When the operator activates Edit through the actual attached-rule row
    Then the production schema editor DOM displays editable allowed values page and product
    And it displays severity warning and stable path /page_type
    And no reusable-rule editor is opened

  # Data layer local rule editing runtime 002
  Scenario: Data layer local rule editing runtime 002
    When the operator adds checkout and saves through the actual DOM
    Then production persistence creates or updates one Page view working draft
    And local-41 remains at its stored attachment index and canonical path /page_type
    And Page view revision 3 and every other attachment are byte-for-byte unchanged
    And reloading storage restores checkout in local-41
    And production validation accepts checkout only in the working-draft preview

  # Data layer local rule editing runtime 003
  Scenario Outline: Data layer local rule editing runtime 003
    Given local-41 is open with unsaved configuration <configuration>
    When the operator performs <completion> through the actual DOM
    Then production storage has <stored_outcome>
    And the rendered editor has <editor_outcome>

    Examples:
      | configuration                  | completion | stored_outcome                         | editor_outcome                           |
      | page, product, and checkout    | Cancel     | the original local-41 bytes            | the original local-41 values after reopen |
      | malformed regular expression [ | Save       | the original local-41 bytes            | an inline configuration error            |

  # Data layer local rule editing runtime 004
  Scenario: Data layer local rule editing runtime 004
    Given local-40 and local-41 have the same display name
    When local-41 is edited, serialized, reloaded, and Page view revision 4 is published
    Then production mutation targeted local-41 by stable identity and canonical path
    And local-40 remains byte-for-byte unchanged
    And current validation uses the edited local-41 definition from revision 4
    And revision 3 validation evidence retains the former local-41 definition

  # Data layer local rule editing runtime 005
  Scenario: Data layer local rule editing runtime 005
    Given reusable stable id reusable-51 is attached to /page_name
    And its actual attached-rule row contains one enabled Edit control
    When the operator activates Edit through the actual attached-rule row
    Then the production Rule Library DOM displays the editor for reusable-51
    And no local rule configuration is displayed
