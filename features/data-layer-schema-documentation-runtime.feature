# mutation-stamp: sha256=4da2cd2c4ca36d2c23614fb6f7c5ae0e4353935ff5fe2ac37e28040b6c2c247d
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T13:46:47.600837567Z","feature_name":"Data layer schema documentation runtime","feature_path":"features/data-layer-schema-documentation-runtime.feature","background_hash":"d470cce8b8d725f29ef4ffe61fa695238353f1cc5c001c26a8c1132403b12aa5","implementation_hash":"sha256:5cbac9629825700b69009125e6861df78e9b53b724632a6cd35061ed390c17dd","scenarios":[{"index":1,"name":"Data layer schema documentation runtime 002","scenario_hash":"da2baab02c65c67d59a3acff70a90f2a0be8055bf29e57329263bc325cf4561e","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-07-14T13:46:47.600837567Z"},{"index":3,"name":"Data layer schema documentation runtime 004","scenario_hash":"be931f27137f49c050677cfd87a4e64e48406bce63d5a679610530b11b8075a9","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-14T13:43:14.564833716Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema documentation runtime

  Background:
    Given the built extension side panel is running with production Schema Library persistence and Live inspection
    And schema Product detail current revision 3 is assigned to captured event product_detail

  # Data layer schema documentation runtime 001
  Scenario: Data layer schema documentation runtime 001
    Given Product detail contains schema property /oOrder/aProducts/*/product_id
    When the operator uses the rendered schema editor to add a schema description
    And uses the property row to save display name Product identifier and description Stable identifier used by fulfilment
    Then production persistence stores 1 documentation entry at canonical path /oOrder/aProducts/*/product_id in the working draft
    And reopening the editor renders the same schema and property documentation
    And the current published revision and property validation configuration are unchanged

  # Data layer schema documentation runtime 002
  Scenario Outline: Data layer schema documentation runtime 002
    Given production schema documentation maps <mapping_path> to <display_name> and <description>
    And the captured payload has <payload_state>
    When the production Live inspector renders the Properties tree
    Then <rendered_path> has documentation presentation <presentation>
    And the captured payload and validation result are unchanged

    Examples:
      | mapping_path        | display_name        | description                     | payload_state                     | rendered_path       | presentation                     |
      | /page_type          | Page classification | Business classification of page | observed /page_type               | /page_type          | mapped name and description      |
      | /items/*/product_id | Product identifier  | Stable product identifier       | observed /items/0/product_id      | /items/0/product_id | wildcard mapped information      |
      | /oOrder/order_id    | Order identifier    | Stable order identifier         | missing expected /oOrder/order_id | /oOrder/order_id    | mapped synthetic-row information |
      | no matching path    | none                 | none                            | observed /currency                | /currency           | no documentation control         |

  # Data layer schema documentation runtime 003
  Scenario: Data layer schema documentation runtime 003
    Given /page_type documentation contains text that resembles HTML and JavaScript
    When its rendered information control receives pointer hover, keyboard focus, click, Enter, and Escape
    Then the preview and persistent information expose the same plain-text description
    And no imported markup or script is interpreted or executed
    And property search finds /page_type by its mapped display name or description
    And focus returns to the information control when persistent information closes
    And the control has an accessible name, description, state, and keyboard operation

  # Data layer schema documentation runtime 004
  Scenario Outline: Data layer schema documentation runtime 004
    Given Product detail revision 3 describes /page_type as Revision 3 description
    And Product detail revision 4 describes /page_type as Revision 4 description
    When the production inspector resolves documentation for <event_context>
    Then the rendered description is <expected_description>
    And the rendered documentation source is <expected_source>

    Examples:
      | event_context                                      | expected_description   | expected_source           |
      | automatic assignment pinned to revision 3          | Revision 3 description | Product detail revision 3 |
      | automatic assignment following current revision 4 | Revision 4 description | Product detail revision 4 |
      | manual schema selection of revision 3              | Revision 3 description | Product detail revision 3 |
      | saved event recorded with revision 3               | Revision 3 description | Product detail revision 3 |

  # Data layer schema documentation runtime 005
  Scenario: Data layer schema documentation runtime 005
    Given Generic commerce revision 2 documents /currency
    And the Product detail working draft inherits Generic commerce and locally overrides /currency documentation
    When the production schema editor and Live inspector resolve effective documentation
    Then each surface renders exactly 1 /currency documentation entry from Product detail
    And the entry identifies its local origin
    When the local override is removed
    Then each surface renders exactly 1 inherited entry from Generic commerce revision 2
    And no parent definition is mutated

  # Data layer schema documentation runtime 006
  Scenario: Data layer schema documentation runtime 006
    Given Product detail has documentation in current revision 3, a historical revision, and a working draft
    When the working draft is published, the complete Schema Library is exported, replaced by that import, and reloaded
    Then production persistence retains every documentation mapping exactly once in its owning revision
    And the Live inspector resolves the same effective descriptions after reload
    And loading a legacy Schema Library without documentation mappings succeeds without fabricated entries

  # Data layer schema documentation runtime 007
  Scenario: Data layer schema documentation runtime 007
    Given /oOrder/aProducts/*/product_id has production documentation and an attached validation rule
    When the operator confirms property removal in the rendered schema editor
    Then the stored working draft removes the property, rule attachment, and documentation entry atomically
    When the operator uses the rendered Undo property removal action
    Then production persistence restores all 3 with their previous identities and content
