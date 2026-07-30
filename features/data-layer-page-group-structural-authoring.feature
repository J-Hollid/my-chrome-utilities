# mutation-stamp: sha256=99db7b3f0999e7bd07afbebfde57534d77971119f33e5d249e0f1cdbcd122b10
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-30T20:04:53.748787220Z","feature_name":"Data layer Page Group structural authoring","feature_path":"features/data-layer-page-group-structural-authoring.feature","background_hash":"ab6dddc359e2b1b17379bf09aadc4cd1352c0944cb80c6f84006991644c3f382","implementation_hash":"de4f33b240-architect","scenarios":[{"index":2,"name":"Data layer Page Group structural authoring 003","scenario_hash":"35d65c3b93339acb5d9047cdbd01872213668c088ee58ec14ac9d3120d3cfb5a","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-30T20:04:53.748787220Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer Page Group structural authoring

  Background:
    Given Shop project contains Page Cart and Page Groups Checkout, Retail Checkout, and Trade Checkout
    And Cart has ordered memberships Checkout, Retail Checkout, and Trade Checkout
    And Checkout always applies while Retail Checkout and Trade Checkout have named Applicability Sets

  # Data layer Page Group structural authoring 001
  Scenario: Data layer Page Group structural authoring 001
    Given no Fixture or captured observation is selected
    When the operator opens Cart in the Pages editor
    Then the Page Group rule stack shows Checkout, Retail Checkout, and Trade Checkout in stored order
    And the effective-schema workspace includes every membership's structural contribution
    And each conditional contribution retains its named Applicability Set and human-readable condition
    And no conditional membership is treated as inactive because observation values are absent
    And the Pages editor contains no applicability-observation selector, sample payload, or schema-evaluation control

  # Data layer Page Group structural authoring 002
  Scenario: Data layer Page Group structural authoring 002
    Given the Page Group definitions are
      | Page Group      | applicability                | contribution                       |
      | Checkout        | Always                       | funnel_name checkout               |
      | Retail Checkout | customer_type Equals retail  | funnel_step allowed value 3a       |
      | Trade Checkout  | customer_type Equals trade   | funnel_step allowed value 3b       |
    When the operator reviews Effective schema at Cart without a Fixture
    Then funnel_name is shown as an unconditional effective property from Checkout
    And funnel_step shows the Retail Checkout and Trade Checkout conditional branches
    And each branch shows its condition, contribution, and ordered provenance
    And neither conditional branch is discarded or presented as the unconditional winner
    And the structural result does not evaluate conditions against an empty payload

  # Data layer Page Group structural authoring 003
  Scenario Outline: Data layer Page Group structural authoring 003
    Given saved Fixture <fixture> targets Page Cart with customer_type <customer_type>
    When the operator evaluates <fixture> from the Fixtures workspace
    Then the applicable Page Group stack is <included_stack>
    And Page Group <excluded_group> is named as inactive because its Applicability Set did not match
    And validation uses the schema compiled from the Fixture payload
    And no generated Retail, Trade, or Overlapping observation is offered as project data

    Examples:
      | fixture             | customer_type | included_stack             | excluded_group   |
      | Retail Cart example | retail        | Checkout, Retail Checkout  | Trade Checkout   |
      | Trade Cart example  | trade         | Checkout, Trade Checkout   | Retail Checkout  |

  # Data layer Page Group structural authoring 004
  Scenario: Data layer Page Group structural authoring 004
    Given Cart has unconditional and conditional Page Group schema contributions
    And no Fixture-specific documentation context is selected
    When the operator generates Cart specification documentation
    Then the documented schema includes the unconditional contribution and every conditional branch
    And each conditional branch names its Applicability Set, condition, and Page Group provenance
    And documentation does not suppress a Page Group by evaluating its condition against an empty payload
    And a Fixture-specific result is identified as an evaluated example rather than the complete Cart specification
