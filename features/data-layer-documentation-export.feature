# mutation-stamp: sha256=a34160b5f6afdabe5f7732bca8247f03a4ad736bc473ddbcb90cae1cec58d64d
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:33:43.068981284Z","feature_name":"Data layer documentation export","feature_path":"features/data-layer-documentation-export.feature","background_hash":"5a31a614da7506fcaf3d1b1a19273cd3568cb63b465bf310bef8005d22d020a8","implementation_hash":"sha256:fc8b6a40cb27bc8de5b8810ead8df6d738a6119598ac8beb1725156f93d9b9fc","scenarios":[{"index":1,"name":"Data layer documentation export 002","scenario_hash":"e2b598e7818212a4a6f66e49be56f37c4e82272a33039e9e7bfea5a4d1c8aeb0","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:02:58.526408431Z"},{"index":2,"name":"Data layer documentation export 003","scenario_hash":"2357f6988ee00ed08ee7acea7da0ac5461bef07e59232e4392a409bf88395b1f","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:02:58.526408431Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer documentation export

  Background:
    Given Shop data specification contains published requirements, applicability, flows, fixtures, and release metadata

  # Data layer documentation export 001
  Scenario: Data layer documentation export 001
    When product authoring actions are displayed
    Then Specification Builder opens the full Specification Project workspace
    And the former Build specification action is named Generate documentation table
    And its description identifies documentation export rather than project authoring

  # Data layer documentation export 002
  Scenario Outline: Data layer documentation export 002
    Given the operator selects documentation field <optional_field>
    When the property specification is generated
    Then the export includes <included_content>
    And property requirements remain unchanged

    Examples:
      | optional_field         | included_content                           |
      | requirement provenance | origin profile and precedence              |
      | applicability summary  | named pages and matcher summary             |
      | where used             | pages, events, and flow steps               |
      | release metadata       | project release identity and revision       |

  # Data layer documentation export 003
  Scenario Outline: Data layer documentation export 003
    Given documentation preview is opened on <surface>
    When a wide property table is generated
    Then <preview_mode>
    And horizontal page overflow is absent

    Examples:
      | surface               | preview_mode                                           |
      | 360 CSS px side panel | cards or selected columns are shown                    |
      | 520 CSS px side panel | cards or selected columns are shown                    |
      | 720 CSS px side panel | selected columns fit the active pane                   |
      | full-page workspace   | the complete table is available in a dedicated preview |

  # Data layer documentation export 004
  Scenario: Data layer documentation export 004
    Given selected output omits applicability, flows, fixtures, or release semantics
    When preview and copied output are produced
    Then each omitted semantic category is identified as lossy
    And the operator is directed to full-fidelity project export for complete interchange

  # Data layer documentation export 005
  Scenario: Data layer documentation export 005
    Given preview columns and properties are selected using only the keyboard
    When the operator copies the documentation table
    Then focus remains in the export workflow with a single result announcement
    And displayed and clipboard representations contain the same selected semantics
    And closing returns focus to Generate documentation table
