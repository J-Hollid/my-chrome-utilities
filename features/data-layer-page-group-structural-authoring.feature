# mutation-stamp: sha256=01cb2aff1c24cd0982728e41ee236e159d4aa7d32cf70aaa1a90d35c3cc75c74
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-30T22:53:19.902122170Z","feature_name":"Data layer Page Group structural authoring","feature_path":"features/data-layer-page-group-structural-authoring.feature","background_hash":"0e77c7b39c8fe132aa0c01de16e81d29224bc1297fef080d38492186a66d9f5f","implementation_hash":"81c349b65b-architect","scenarios":[{"index":3,"name":"Data layer Page Group structural authoring 004","scenario_hash":"a186ab1d32f1b8732c6f5b24ac7a57b57e7b89a69184af4c9ea64f3519900029","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-30T22:53:19.902122170Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer Page Group structural authoring

  Background:
    Given Shop project contains Page Cart and Page Groups Checkout, Retail Checkout, Signed-in Checkout, and Trade Checkout
    And Cart has those Page Group memberships in that order
    And Retail Checkout, Signed-in Checkout, and Trade Checkout reference distinct Applicability Sets

  # Data layer Page Group structural authoring 001
  Scenario: Data layer Page Group structural authoring 001
    Given Checkout has no Applicability Set
    When the operator opens Cart in the Pages editor
    Then each distinct Applicability Set referenced by a Cart Page Group is presented once as a checked checkbox
    And Checkout is identified as always included without an applicability checkbox
    And all applicability checkboxes are checked by default
    And the Pages editor contains no observation selector or sample payload control
    When the operator edits Checkout
    Then its Applicability Set control offers None and every project Applicability Set
    And saving None leaves Checkout without an Applicability Set

  # Data layer Page Group structural authoring 002
  Scenario: Data layer Page Group structural authoring 002
    Given each Cart Page Group has canonical properties authored in its Page Group schema table
    And Cart has one Page-local canonical property
    When the operator reviews Effective schema at Cart in its default applicability preview
    Then the actual effective-schema table contains properties from Checkout, Retail Checkout, Signed-in Checkout, Trade Checkout, and Cart
    And every row names its ordered Page Group and Page provenance
    And no assigned Page Group is omitted because an observation or Applicability Set evaluation is absent
    When the operator saves, leaves, and reopens Cart
    Then the same canonical properties populate the effective-schema table
    And the applicability preview returns to every checkbox checked

  # Data layer Page Group structural authoring 003
  Scenario: Data layer Page Group structural authoring 003
    When the operator clears Retail customers while Signed-in visitors and Trade customers remain checked
    Then Retail Checkout is the only membership excluded from composition
    And its properties are absent with a visible unchecked-preview explanation
    And the remaining property rows retain Checkout, Signed-in Checkout, Trade Checkout, and Cart provenance
    And no membership, Applicability Set, schema, Fixture, or observation is changed
    When the operator checks Retail customers again
    Then Retail Checkout returns at its stored membership position
    And all independently selected Applicability Sets participate together

  # Data layer Page Group structural authoring 004
  Scenario Outline: Data layer Page Group structural authoring 004
    Given Retail customers and Trade customers are selected
    And Retail Checkout and Trade Checkout define different ordinary values for funnel_step
    When the operator sets selected membership order to <ordered groups>
    Then <winner> supplies effective funnel_step <effective value>
    And <superseded> remains visible as superseded provenance
    And the reorder impact preview names the changed property and both contributors before commit
    And an invariant rule or structurally incompatible property remains blocked with direct repair actions

    Examples:
      | ordered groups                       | winner          | effective value | superseded      |
      | Retail Checkout then Trade Checkout  | Trade Checkout  | 3b              | Retail Checkout |
      | Trade Checkout then Retail Checkout  | Retail Checkout | 3a              | Trade Checkout  |

  # Data layer Page Group structural authoring 005
  Scenario: Data layer Page Group structural authoring 005
    Given a Cart Fixture payload matches Retail customers and Signed-in visitors but not Trade customers
    When the operator runs that Fixture
    Then Retail customers and Signed-in visitors independently evaluate as matched
    And the compiled stack contains Checkout, Retail Checkout, Signed-in Checkout, and Cart in membership order
    And Trade Checkout is identified as not matched
    And simultaneous Applicability Set matches are not ambiguous
    And ambiguity is reported only when competing Assignments for the same routing decision remain tied

  # Data layer Page Group structural authoring 006
  Scenario: Data layer Page Group structural authoring 006
    Given Cart documentation uses the default applicability preview
    When the operator generates Cart specification documentation
    Then documentation contains the effective ordered composition and superseded provenance
    And it identifies the referenced Applicability Set for each Page Group
    And it does not evaluate any Applicability Set against an empty payload
    And Fixture-specific documentation identifies its independently matched sets as an evaluated example
