# mutation-stamp: sha256=1ce3b6fa2c10a45b7f82a88fd2f2c58383abf06a7cbc69a6112201fa5f642ecc
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-08-02T23:49:25.451672219Z","feature_name":"Data layer Property Set and Flow Section separation runtime","feature_path":"features/data-layer-property-set-and-flow-section-separation-runtime.feature","background_hash":"2ef7d1c7b99d5ba3e845264389ad9532da2337e474e364f499a8ac47a9e68f46","implementation_hash":"sha256:6e2734d38b0c7de0d3a4c6a84f227b9c756350bbdc481c27d34a33f010ab28af","scenarios":[{"index":2,"name":"Data layer Property Set and Flow Section separation runtime 003","scenario_hash":"2aba991e34bb4728fe4c1a24e91e89d6dcf71da0eb6f583a7198699b1a78d6a4","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-08-02T22:33:48.398678685Z"},{"index":7,"name":"Data layer Property Set and Flow Section separation runtime 008","scenario_hash":"7601203cb03af755697382026f1a3f3e55dd0e390f0ac525681ba856c75dcacd","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-08-02T22:33:48.398678685Z"},{"index":10,"name":"Data layer Property Set and Flow Section separation runtime 011","scenario_hash":"7fbe956736bdf8ac9aaab6480895aa545049607633536b7a1acc8f4ff76d25ea","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-08-02T22:33:48.398678685Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer Property Set and Flow Section separation runtime

  Background:
    Given the built extension is running with the production project repository, schema compiler, and Flow canvas
    And production Shop contains Sitewide, Commerce, Checkout base, Retail commerce, Cart, and Product detail under stable identities
    And production Cart and Product detail apply Checkout base and Retail commerce
    And production Checkout journey contains Cart and Product detail Page instances

  # Data layer Property Set and Flow Section separation runtime 001
  Scenario: Data layer Property Set and Flow Section separation runtime 001
    When actual controls open the installed project collections
    Then rendered navigation and lifecycle controls expose Property Sets as a top-level collection
    And repository inspection finds Flow Sections only inside their owning Flow graphs
    And rendered project navigation, creation, search, Assignment kinds, and schema categories contain no Page Groups
    When actual controls open Checkout base
    Then its installed workspace renders details, Shared Profile sources, canonical schema, and where-used Pages
    And DOM inspection finds no Flow lane, Section, or placement control in that workspace

  # Data layer Property Set and Flow Section separation runtime 002
  Scenario: Data layer Property Set and Flow Section separation runtime 002
    When actual controls open production Cart
    Then rendered Property composition lists applied Property Sets in stored order
    And each row exposes Property Set, applicability, contribution, provenance, and application actions
    And actual search can add a Property Set while reorder, remove, and open-source controls remain operable
    And visible and accessible copy never describes Cart as belonging to a Property Set
    And Shared Profile source inheritance remains separately labelled

  # Data layer Property Set and Flow Section separation runtime 003
  Scenario Outline: Data layer Property Set and Flow Section separation runtime 003
    Given production Checkout base and Retail commerce define different funnel_step values
    When actual controls set Cart Property composition order to <ordered sets>
    Then compiler output selects <winner> value <effective value>
    And rendered provenance retains <superseded> as superseded
    And the pre-commit review names funnel_step and both Property Sets
    And durable history records one Cart application-order command
    And compiler output keeps invariant or structural incompatibility blocked

    Examples:
      | ordered sets                        | winner          | effective value | superseded      |
      | Checkout base then Retail commerce  | Retail commerce | retail          | Checkout base   |
      | Retail commerce then Checkout base  | Checkout base   | checkout        | Retail commerce |

  # Data layer Property Set and Flow Section separation runtime 004
  Scenario: Data layer Property Set and Flow Section separation runtime 004
    Given serialized Retail commerce applications are unconditional on Cart and use Retail customers on Product detail
    When actual controls clear Retail customers in the Product detail preview
    Then rendered Product detail excludes Retail commerce and rendered Cart continues to include it
    And serialized Property Set, Applicability Set, and Page application bytes remain unchanged
    When the production evaluator runs a matching Product detail Test case
    Then compiler contributors include Retail commerce through that Product detail application
    And evaluator output reports no cross-Page applicability ambiguity

  # Data layer Property Set and Flow Section separation runtime 005
  Scenario: Data layer Property Set and Flow Section separation runtime 005
    Given production Cart has a local checkout_type Description over Checkout base
    When production commands change the Checkout base Description and add checkout_version
    Then installed Cart retains its local Description and renders checkout_version
    And another applying Page without that local facet renders the changed parent Description
    When production Commerce adds a property outside Checkout base's fixed selection
    Then Checkout base renders one Parent addition and downstream Pages omit that property
    When actual controls include that Parent addition
    Then applying Pages render the property through Checkout base without changing another Shared Profile selection

  # Data layer Property Set and Flow Section separation runtime 006
  Scenario: Data layer Property Set and Flow Section separation runtime 006
    Given production Assignment Retail checkout targets Checkout base
    When actual controls open Assignments and the side-panel Schema tree
    Then installed routing resolves Checkout base as a Property Set by its stable identity
    And rendered Property Sets contains Checkout base with Cart and Product detail references
    And rendered Pages retains one canonical row per Page
    And DOM inspection finds Flow Sections only on their owning Flow canvas and outline, never in the Schema tree
    And Assignment target options and compiler contributors contain no Flow Section

  # Data layer Property Set and Flow Section separation runtime 007
  Scenario: Data layer Property Set and Flow Section separation runtime 007
    Given the installed Checkout journey contains no Sections
    When actual canvas controls create Checkout phase and place Cart and Product detail inside it
    Then serialized Checkout phase has one Flow-owned identity, name, bounds, and presentation order
    And serialized Page frames reference Checkout phase while retaining their frame identities and relative coordinates
    And actual controls can place a Page with no shared Property Set in Checkout phase
    And pointer and keyboard controls can connect Page frames across the Section boundary
    And the installed Flow toolbar contains Sections, Pages, and Events without Property Sets or lane-order controls

  # Data layer Property Set and Flow Section separation runtime 008
  Scenario Outline: Data layer Property Set and Flow Section separation runtime 008
    Given production Cart Property composition and compiled schema are fingerprinted
    When actual controls <section action>
    Then serialized Cart applications, order, applicability, compiled schema, and provenance match the fingerprint
    And Assignment targets and production schema identities remain byte-identical
    And durable history records only one Flow-presentation command
    When actual Undo is activated
    Then the prior Section presentation returns with schema bytes unchanged

    Examples:
      | section action                                      |
      | move Cart from Checkout phase to Review phase       |
      | move Cart outside every Section                     |
      | move Checkout phase with its contained Page frames  |
      | resize and rename Checkout phase                    |

  # Data layer Property Set and Flow Section separation runtime 009
  Scenario: Data layer Property Set and Flow Section separation runtime 009
    Given installed Checkout phase contains Cart and Product detail
    When actual controls use the default Remove Section action
    Then DOM and repository inspection find both Page frames at their canvas positions without a Section
    And their Event occurrences and relationships retain exact identities and values
    When actual controls open remove-with-contents for Review phase
    Then the installed review names every affected Page frame and relationship
    And repository bytes remain unchanged before confirmation
    And confirmed removal creates one Undo entry that restores the same identities

  # Data layer Property Set and Flow Section separation runtime 010
  Scenario: Data layer Property Set and Flow Section separation runtime 010
    Given durable storage contains a legacy project with Page Group schemas, memberships, Assignment targets, lanes, and frame placement
    When the installed repository performs its verified project upgrade
    Then persisted Property Sets retain the legacy contributor identities and complete canonical bytes
    And persisted Page applications retain membership order and applicability
    And each legacy Flow lane maps to a new Flow-owned Section used by its existing Page frames
    And occurrence, relationship, Page, Event, Assignment, Property Set, and Page-frame identities remain byte-identical
    And compiled schema fingerprints and Flow topology equal the pre-upgrade results
    And active storage contains no duplicate Page Group representation
    When actual export and import round-trip the upgraded project
    Then repository inspection finds the same separated references without another migration write

  # Data layer Property Set and Flow Section separation runtime 011
  Scenario Outline: Data layer Property Set and Flow Section separation runtime 011
    Given the installed Property composition and two-Section Flow use <viewport width> CSS pixels
    When actual keyboard and pointer events apply a Property Set and organize Page frames
    Then accessibility inspection finds distinct names and visible focus for every application and Section action
    And measured Property Set search, Section controls, and Page frames remain reachable
    And measured layout has one vertical workspace scroll owner and no horizontal document overflow
    And reload restores application order, Section bounds, selection, and invoking focus

    Examples:
      | viewport width |
      | 360            |
      | 1440           |

  # Data layer Property Set and Flow Section separation runtime 012
  Scenario Outline: Data layer Property Set and Flow Section separation runtime 012
    Given production IndexedDB contains a previous-version project whose Cart memberships are Checkout base then Retail commerce
    And serialized Checkout base has <legacy applicability value>
    And serialized Retail commerce has applicabilitySetId applicability:retail
    When openIndexedDbProjectRepository performs the installed Property Set and Flow Section upgrade
    Then repository startup completes without a durable-repository-unavailable error
    And durable read-back stores Cart applications as Checkout base without applicabilitySetId then Retail commerce with applicability:retail
    And compiled Cart schema and every stable project identity match their pre-upgrade values
    And the verified receipt and checksummed backup retain the exact previous-version source bytes
    When openIndexedDbProjectRepository runs again
    Then durable Cart application identities and the migration receipt remain byte-identical without another upgrade write

    Examples:
      | legacy applicability value            |
      | no applicabilitySetId key             |
      | applicabilitySetId equal to empty text |
