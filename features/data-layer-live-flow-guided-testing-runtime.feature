# mutation-stamp: sha256=fac7da58829c5e7416a5e703cbf8193668bfef6a7b575a639901d7303503eb15
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-23T11:26:03.937326144Z","feature_name":"Data layer Live Flow guided testing runtime","feature_path":"features/data-layer-live-flow-guided-testing-runtime.feature","background_hash":"fec4a146e3265a166a3fc8ed4172a3853912c9ea3c918e8a675b8ed1258d86f6","implementation_hash":"sha256:fac4d2ff182b6cf88f9a952973c8be8797287738218e7653ad0dbbbe7cf91c5c","scenarios":[{"index":4,"name":"Data layer Live Flow guided testing runtime 005","scenario_hash":"f0678d62cd93a37965a003d35f118f6d11fe60d36356ea0c0664da93dc4efac9","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-23T11:24:36.108292090Z"},{"index":5,"name":"Data layer Live Flow guided testing runtime 006","scenario_hash":"6cfc90b1c8979a3d68133f69d8940d19e5a91ff62c015e18eadf64a5d9c97589","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-23T11:24:36.108292090Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer Live Flow guided testing runtime

  Background:
    Given the installed extension has active project Retail website
    And production Live capture receives data-layer events
    And persisted Checkout journey contains connected Page-frame and Event-occurrence nodes

  # Data layer Live Flow guided testing runtime 001
  Scenario: Data layer Live Flow guided testing runtime 001
    When actual controls open Flow test in Live
    Then the installed Flow selector renders only project-retail Flows by human name
    And visible guidance states that graph-step and feed-event selection is manual and assignment-free
    And repository order, inactive projects, and prior session state select no Flow
    When active-project storage is absent
    Then the production control offers Open project and Create project without a project-bound query

  # Data layer Live Flow guided testing runtime 002
  Scenario: Data layer Live Flow guided testing runtime 002
    Given production Checkout journey has root Cart plus distinct repeated frames Confirmation A and Confirmation B
    When production run state adopts Checkout journey as its Flow
    Then the installed start control renders every Page frame with Page name, lane, and stable frame ID
    And Cart renders as a recommended root while later Page frames remain selectable for partial testing
    And Confirmation A and Confirmation B have separate control values
    And no Event-occurrence value is present in the initial Page control

  # Data layer Live Flow guided testing runtime 003
  Scenario: Data layer Live Flow guided testing runtime 003
    Given production Cart frame is selected and no Assignment targets it
    When production commits live-101 as the start-step observation
    Then the installed validator records selection mode Manual Flow test without calling automatic assignment
    And compiled input is Cart frame effective schema with Shared Profile, Page Group, Page, and instance provenance
    And stored run evidence names Checkout journey, Cart frame, live-101, effective revision, issues, and provenance
    And production Assignment, contributor, Flow, and captured-payload bytes remain unchanged
    And any automatic live-101 validation record remains separately byte-identical

  # Data layer Live Flow guided testing runtime 004
  Scenario: Data layer Live Flow guided testing runtime 004
    Given production Cart page_view occurrence is selected as the next graph step
    When production occurrence validation receives live-102
    Then the production compiler combines Cart frame, page_view Event, and occurrence contributions
    And persisted result target is the stable Event-occurrence identity
    And installed feed and inspector render the ordinary property issue presentation
    And result data contains no automatic assignment winner

  # Data layer Live Flow guided testing runtime 005
  Scenario Outline: Data layer Live Flow guided testing runtime 005
    Given the selected production node has an outgoing <relationship_kind> relationship to <next_step>
    And persisted relationship label state is <label_state>
    When its matched feed event finishes validation
    Then the installed guide renders <next_step>, <relationship_kind>, and <display_name>
    When the operator confirms the offered target
    Then production Live results offer matching observed events for that Page or Event node
    And controls reject a node absent from the current node's outgoing relationship IDs

    Examples:
      | relationship_kind | next_step                       | label_state         | display_name                                  |
      | expected_next     | Payment Page                    | no label            | Cart to Payment                              |
      | alternative       | Cart PayPal Event occurrence    | label PayPal route  | PayPal route                                 |
      | merge             | Confirmation Page               | no label            | Cart PayPal to Confirmation                  |

  # Data layer Live Flow guided testing runtime 006
  Scenario Outline: Data layer Live Flow guided testing runtime 006
    Given live-102 is the last event persisted in production Flow-test history
    And production matching is requested for <step_kind> node <step_name>
    When the installed feed derives matching candidates
    Then eligible IDs contain only unmatched events captured after live-102
    And rendered candidate evidence uses <matching_evidence> without programmatic selection
    And ineligible rows remain rendered with chronological, already-matched, or compatibility reasons
    When actual controls confirm live-103
    Then run storage links live-103 once to <step_name> and excludes it from later candidate IDs

    Examples:
      | step_kind | step_name                 | matching_evidence                         |
      | Page      | Payment                   | observed Page context evidence            |
      | Event     | Payment add_payment_info  | Event identity and observation source     |

  # Data layer Live Flow guided testing runtime 007
  Scenario: Data layer Live Flow guided testing runtime 007
    Given production live-103 fails Payment effective-schema validation
    When Manual Flow test validation resolves
    Then installed validation issue actions open the standard defect report builder
    And report state contains captured payload, issues, target revision, provenance, Flow, graph step, matched path, and capture times
    And production save and clipboard adapters are the same ones used by automatic-validation reports
    And failed run history remains visible while outgoing relationship controls stay enabled

  # Data layer Live Flow guided testing runtime 008
  Scenario: Data layer Live Flow guided testing runtime 008
    Given production run history follows Cart, page_view, Payment, and add_payment_info through persisted relationship IDs
    When add_payment_info has no selected outgoing relationship and actual controls complete the test
    Then saved-session storage contains ordered graph steps, relationships, feed IDs, schema revisions, statuses, and defect references
    And the installed summary reads Completed selected path and marks unchosen alternatives Not tested
    And reopening that saved session restores the summary without restarting capture or event matching
    And production Assignment, canonical contributor, and Checkout journey hashes equal their pre-run values
