# mutation-stamp: sha256=ca21e62940ef98355e5279742c27adf667025161c542abc20abbff5cf85b9b12
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-08-01T13:02:33.468501901Z","feature_name":"Data layer Page Group structural authoring","feature_path":"features/data-layer-page-group-structural-authoring.feature","background_hash":"0e77c7b39c8fe132aa0c01de16e81d29224bc1297fef080d38492186a66d9f5f","implementation_hash":"architect-page-documentation-ownership","scenarios":[{"index":3,"name":"Data layer Page Group structural authoring 004","scenario_hash":"a186ab1d32f1b8732c6f5b24ac7a57b57e7b89a69184af4c9ea64f3519900029","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-31T03:21:04.183826868Z"},{"index":7,"name":"Data layer Page Group structural authoring 008","scenario_hash":"f8b94253ee10ddf46aeae9a25bcd47f48014cab9637095c5f45c3660a4f4534e","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-31T03:21:04.183826868Z"}]}
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
    Given Client specification selects Cart as a Page context in its project capture matrix
    And Cart's default preview composes every Page Group in membership order without an observation
    When the operator refreshes the Documentation workspace preview
    Then the Data capture matrix contains one Cart column and the union of Cart's effective property paths
    And each Cart cell describes the effective property as Mandatory, Optional, Conditional, Not expected, Not defined, or Blocked
    And the matrix does not evaluate an Applicability Set against an empty payload
    And it contains no Page-owned documentation action, provenance column, source identity, or Fixture-specific section

  # Data layer Page Group structural authoring 007
  Scenario: Data layer Page Group structural authoring 007
    Given Shared Profiles Commerce and Experience define canonical properties currency and locale
    And Checkout inherits Commerce and Experience and locally defines funnel_name
    And Cart locally defines page_name
    When the operator compares Effective schema at Checkout and Cart with Checkout participating
    Then effective schema properties are
      | workspace | properties                               |
      | Checkout  | currency, locale, funnel_name            |
      | Cart      | currency, locale, funnel_name, page_name |
    And inherited provenance routes are
      | property | route                                |
      | currency | Commerce through Checkout into Cart  |
      | locale   | Experience through Checkout into Cart |
    And no inherited Shared Profile property stops at the Page Group boundary

  # Data layer Page Group structural authoring 008
  Scenario Outline: Data layer Page Group structural authoring 008
    Given Shared Profile reachability into Cart is
      | profile  | routes                                      |
      | Commerce | Cart, Checkout, and Retail Checkout         |
      | Customer | Retail Checkout                             |
    When the operator sets the Retail applicability preview to <selection>
    Then Commerce appears once without a self-conflict and retains <Commerce routes>
    And Customer is <Customer outcome>
    And the Retail Checkout local contribution is <local outcome>

    Examples:
      | selection | Commerce routes                    | Customer outcome                           | local outcome                       |
      | unchecked | Cart and Checkout                  | absent                                     | absent                              |
      | checked   | Cart, Checkout, and Retail Checkout | present through Retail Checkout provenance | present at its membership position  |

  # Data layer Page Group structural authoring 009
  Scenario: Data layer Page Group structural authoring 009
    Given Cart inherits a Shared Profile property through a participating Page Group
    And Cart is used by a Flow Page instance and a matching Fixture
    And Client specification selects Cart as a Page context in its project capture matrix
    When the operator reviews the Page, Flow Page instance, Fixture result, and refreshed Data capture matrix
    Then every surface resolves the same inherited Shared Profile property from Cart's transitive effective schema
    And the Page, Flow Page instance, and Fixture result preserve their complete contributor provenance
    And the matrix identifies Cart by its human context heading and effective state without exporting provenance
    And no surface substitutes the Page Group's local-only schema for its effective schema
