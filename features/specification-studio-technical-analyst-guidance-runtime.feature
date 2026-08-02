# mutation-stamp: sha256=33c96abb7e7f5ec33e73b8607781e60b90ca7b5ef7f5e67a949d0c80e0fd4f2c
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-08-02T19:37:12.712432500Z","feature_name":"Specification Studio technical analyst guidance runtime","feature_path":"features\\specification-studio-technical-analyst-guidance-runtime.feature","background_hash":"c8660f9d15d2ee101f3dff16f67c8ccb32beecdba47ce19f0493021e5bef5390","implementation_hash":"sha256:1a8a5e6b69d586db6af2d548b58a9dd93886f4b4a67f91a0077483a855b04cf3","scenarios":[{"index":0,"name":"Specification Studio technical analyst guidance runtime 001","scenario_hash":"8aecc10521f64a9f71d5f0541e0b7037c9c61e0974ed946a49d14dbf03b7cd84","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-08-02T19:37:12.712432500Z"},{"index":1,"name":"Specification Studio technical analyst guidance runtime 002","scenario_hash":"650d4bd2f1a022345d111159a13ff41623c8d40f33f6531155a6fd64ccb65529","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-08-02T19:37:12.712432500Z"},{"index":2,"name":"Specification Studio technical analyst guidance runtime 003","scenario_hash":"a745f08be10404e53d6475e51eaed62d6629c85bfc94246fc1943665a85fb327","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-08-02T19:37:12.712432500Z"},{"index":3,"name":"Specification Studio technical analyst guidance runtime 004","scenario_hash":"1fc091ecfecd5a7108b051b5731f7d8c4ed6d54f1ea131787ef975487fac4fe3","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-08-02T19:37:12.712432500Z"},{"index":4,"name":"Specification Studio technical analyst guidance runtime 005","scenario_hash":"7bdbb80da1744d74916df95711461fa6f5491f4db13398479ad0f5f2bde303cd","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-08-02T19:37:12.712432500Z"},{"index":5,"name":"Specification Studio technical analyst guidance runtime 006","scenario_hash":"ebc3d38db0d22e38261b49593246a63770b2125d1809220e08facdef1ffbf1e8","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-08-02T19:37:12.712432500Z"},{"index":6,"name":"Specification Studio technical analyst guidance runtime 007","scenario_hash":"88e96c05e7385cc1827089954a20077fa76e788834a06be7eebb6e04b57746d4","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-08-02T19:37:12.712432500Z"},{"index":8,"name":"Specification Studio technical analyst guidance runtime 009","scenario_hash":"d2ada72e63110ab2c22c04873c30334a9aa939e882b33d04820320ba3dc07635","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-08-02T19:37:12.712432500Z"},{"index":9,"name":"Specification Studio technical analyst guidance runtime 010","scenario_hash":"863c898f72780c2af5b8a9eb927aa0965ab102e84ee30d00fe1885326ce938af","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-08-02T19:37:12.712432500Z"},{"index":10,"name":"Specification Studio technical analyst guidance runtime 011","scenario_hash":"0abea7d5a6d707ba1f9bffd750dfaf3877682a57b0102b79584d3e3638616735","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-08-02T19:37:12.712432500Z"},{"index":11,"name":"Specification Studio technical analyst guidance runtime 012","scenario_hash":"42c57376744f30f098841ded290a545ee5427912690f09fb2feae32785f805db","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-08-02T19:37:12.712432500Z"},{"index":12,"name":"Specification Studio technical analyst guidance runtime 013","scenario_hash":"4032d1425f0b152ce3b62c378f8c39f53fc1ef0561f600412130fa0bb2e78d7b","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-08-02T19:37:12.712432500Z"},{"index":13,"name":"Specification Studio technical analyst guidance runtime 014","scenario_hash":"86e20297e976afbdf50a16d0a241ddc6057b194ff2ee110f8a781f0a06d3d93d","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-08-02T19:37:12.712432500Z"},{"index":14,"name":"Specification Studio technical analyst guidance runtime 015","scenario_hash":"6e521cad56af539c57f8a97969c13242563b4fb4b021113eaee75b6bbb99f8b1","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-08-02T19:37:12.712432500Z"},{"index":16,"name":"Specification Studio technical analyst guidance runtime 017","scenario_hash":"c80acea3b1432c79d4e5bee526cb68324eaca1ec3e252fefa7655fb3b897cfee","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-08-02T19:37:12.712432500Z"}]}
# acceptance-mutation-manifest-end


Feature: Specification Studio technical analyst guidance runtime

  Background:
    Given the built extension is running with a populated production Specification Studio
    And installed technical analyst guidance uses dedicated space outside navigation content when the navigation rail is visible

  # Specification Studio technical analyst guidance runtime 001
  Scenario Outline: Specification Studio technical analyst guidance runtime 001
    Given the production Studio navigation rail is visible
    When the installed Studio renders the technical analyst in the navigation rail
    Then its computed <horizontal_edge> edge is anchored to the <horizontal_edge> of its dedicated space
    And its computed width is at least <minimum_width>
    And all installed analyst sources decode on the same <pose_canvas> transparent canvas and registered baseline
    And the computed <start_card_surface> uses the same generated idle source

    Examples:
      | horizontal_edge | minimum_width | pose_canvas        | start_card_surface    |
      | left            | 8rem          | 587 by 822 pixels  | no-project start-card |

  # Specification Studio technical analyst guidance runtime 002
  Scenario Outline: Specification Studio technical analyst guidance runtime 002
    Given the production Studio navigation rail is visible
    And the installed Studio remains visible and active for <elapsed_time>
    And production dialog, menu, and blocking-layer state is clear
    When the guidance scheduler is observed
    Then the production hint bubble is <result>

    Examples:
      | elapsed_time                               | result                       |
      | less than 10 seconds after Studio is ready | not rendered                 |
      | 10 seconds after Studio is ready            | rendered once                |
      | less than 120 seconds after the prior hint  | not rendered                 |
      | 120 seconds after the prior hint             | rendered once when available |

  # Specification Studio technical analyst guidance runtime 003
  Scenario Outline: Specification Studio technical analyst guidance runtime 003
    Given an installed hint bubble is due on a Studio route
    When the production Studio route is <route>
    Then the visible bubble says <hint>
    And computed bubble and tail geometry connect the bubble to the technical analyst
    And computed presentation uses a cheesy classic British-comic treatment with bold irregular ink, cream paper, halftone texture, mustard accent, and playful lettering
    And the same hint identity is not rendered again in that Studio session until all applicable hint identities have rendered

    Examples:
      | route             | hint                                                                                          |
      | Project overview  | A project with no collection is merely a clipboard with ambitions. Pick one on the left and give the specification somewhere to begin.                              |
      | Shared Profiles   | If Pages keep borrowing the same fields, stop issuing duplicates like raffle tickets. Put them in a Shared Profile and let inheritance do the legwork.               |
      | Pages             | Give each Page its observed page event before polishing the schema. Even a splendid room needs a doorbell before anyone can prove they visited.                       |
      | Flows             | Pages are the rooms; Events are the custard pies. Add the rooms first, then put each splat where it actually happened.                                                 |
      | Documentation     | Refresh the preview after changing a Documentation Set. Yesterday's snapshot is beautifully formatted and completely unaware of today.                               |

  # Specification Studio technical analyst guidance runtime 004
  Scenario Outline: Specification Studio technical analyst guidance runtime 004
    Given an installed hint bubble is visible
    When <event> occurs
    Then the production hint bubble is <result>
    And document active element remains the operator's prior control
    And active element, project bytes, Draft token, revision, and Undo count remain unchanged

    Examples:
      | event                              | result                                  |
      | 10 seconds elapse                  | is removed                              |
      | the Studio document becomes hidden | is removed and its interval timer pauses |

  # Specification Studio technical analyst guidance runtime 005
  Scenario Outline: Specification Studio technical analyst guidance runtime 005
    Given installed analyst guidance is exercised at <presentation>
    Then the analyst and bubble are <visibility>
    And visible guidance bounding boxes remain inside dedicated guidance space
    And hit testing finds no navigation, workspace, or Inspector control beneath the bubble
    And document horizontal overflow is zero
    And an automatic bubble exposes a polite advisory announcement
    And reduced-motion computed styles contain no entrance or exit transition or animation

    Examples:
      | presentation                         | visibility |
      | 1280 by 900 CSS pixel Studio         | visible    |
      | 200 percent browser zoom             | visible    |
      | narrow Studio with navigation hidden | hidden     |

  # Specification Studio technical analyst guidance runtime 006
  Scenario Outline: Specification Studio technical analyst guidance runtime 006
    Given the installed technical analyst is a visible interactive guidance control
    When <pointer_or_focus_state> is dispatched
    Then its computed transform displays it at <scale>
    And computed mustard and ink interaction outline is <outline_state>
    And computed border, backing, and box-shadow evidence is absent
    And guidance-region and neighboring-control bounding boxes do not move or overlap

    Examples:
      | pointer_or_focus_state               | scale       | outline_state |
      | resting state                        | 100 percent | absent        |
      | pointer hover begins                 | 105 percent | visible       |
      | keyboard focus arrives               | 105 percent | visible       |
      | pointer hover or keyboard focus ends | 100 percent | absent        |

  # Specification Studio technical analyst guidance runtime 007
  Scenario Outline: Specification Studio technical analyst guidance runtime 007
    Given the installed technical analyst is a visible interactive guidance control
    When production activation uses <activation>
    Then the next unused production tip for the current Studio part renders without scheduler delay
    And any rendered tip is replaced
    And the production ordinary interval becomes 120 seconds
    And active element, project bytes, Draft token, revision, and Undo count remain unchanged

    Examples:
      | activation |
      | click      |
      | Enter      |
      | Space      |

  # Specification Studio technical analyst guidance runtime 008
  Scenario: Specification Studio technical analyst guidance runtime 008
    Given installed bubble geometry spans the footer above the analyst
    Then the computed broad open tail root melds into the bubble's lower edge without a closing stroke
    And its two tapered edges form one monotonic simple outline with no curl, loop, or self-intersection
    And sampled tail geometry travels downward and leftward
    And its rounded point enters the analyst control's upper-right transparent canvas and aims toward the speaker
    And sampled pixels under the complete painted tail remain transparent in every analyst pose
    And the complete painted tail remains inside reserved guidance geometry

  # Specification Studio technical analyst guidance runtime 009
  Scenario Outline: Specification Studio technical analyst guidance runtime 009
    Given the production page being left contains <current_tip_state>
    When production navigation opens a different Studio page
    Then the installed bubble is hidden
    And scheduler time until the next automatic hint is 10 seconds
    And the session's presented-tip identities are retained

    Examples:
      | current_tip_state |
      | no rendered tip   |
      | a rendered tip    |

  # Specification Studio technical analyst guidance runtime 010
  Scenario Outline: Specification Studio technical analyst guidance runtime 010
    Given the installed operator route is <studio_part>
    Then production guidance exposes at least 5 distinct general tip identities for that part
    And every rendered text describes a production action or concept owned by that part
    And scheduler selection does not repeat an identity until that part's pool is exhausted

    Examples:
      | studio_part      |
      | Project overview |
      | Shared Profiles  |
      | Pages            |
      | Page Groups      |
      | Events           |
      | Applicability    |
      | Flows            |
      | Fixtures         |
      | Assignments      |
      | Documentation    |

  # Specification Studio technical analyst guidance runtime 011
  Scenario Outline: Specification Studio technical analyst guidance runtime 011
    Given production pointer or keyboard focus remains on one visible named Studio control for <dwell_time>
    And production dialog, menu, and blocking-layer state is clear
    When the installed control-guidance observer is inspected
    Then a control-specific production analyst tip is <result>
    And bubble, focus, and control bounding boxes prove reserved non-overlapping presentation
    And a rendered control tip sets the ordinary scheduler interval to 120 seconds
    And the same control does not retrigger until pointer and keyboard focus both leave it

    Examples:
      | dwell_time                               | result        |
      | less than 3 seconds                      | not rendered  |
      | 3 seconds of continuous pointer hover    | rendered once |
      | 3 seconds of continuous keyboard focus   | rendered once |

  # Specification Studio technical analyst guidance runtime 012
  Scenario Outline: Specification Studio technical analyst guidance runtime 012
    Given production guidance has selected a complete analyst tip
    When installed bubble presentation uses <motion_preference>
    Then sampled visible text renders <output>
    And successive visible-character samples are separated by <character_interval>
    And bubble geometry equals complete-text geometry before the first character renders
    And replacement, hide, and route-change events cancel the prior print scheduler
    And the polite live region exposes the complete tip exactly once without partial announcements
    And standard-motion computed styles alternate the two speaking sources only during printing
    And reduced-motion computed styles expose one static speaking source
    And hide, route-change, and disposal evidence restore the idle source
    And active element, project bytes, Draft token, revision, and Undo count remain unchanged

    Examples:
      | motion_preference | output                                   | character_interval |
      | standard motion   | one complete visible character at a time | 20 milliseconds    |
      | reduced motion    | the complete tip immediately              | 0 milliseconds     |

  # Specification Studio technical analyst guidance runtime 013
  Scenario Outline: Specification Studio technical analyst guidance runtime 013
    Given production navigation inventory is <navigation_inventory>
    When production layout renders the analyst guidance region
    Then bounding boxes anchor the framed analyst to the visible rail's bottom-left corner
    And its left and bottom offsets are invariant from the final navigation button
    And the navigation list owns the remaining space above the reserved guidance footer
    And overflow metrics show the navigation list scrolling without moving or covering the analyst
    And bubble geometry spans the framed footer above him without intersecting navigation controls

    Examples:
      | navigation_inventory                       |
      | a short list ending well above the footer  |
      | a long list requiring navigation scrolling |

  # Specification Studio technical analyst guidance runtime 014
  Scenario Outline: Specification Studio technical analyst guidance runtime 014
    Given production rotation selects a previously unused general tip for <route>
    When automatic and analyst-requested presentation paths render it
    Then the complete tip text is <hint>
    And semantic inspection finds accurate route advice plus a configured playful British-comic flourish
    And DOM and computed styles retain the cream, ink, halftone, mustard, connected-tail, generated-pose, and typewriter presentation
    And the complete additional pool contains no neutral documentation-only tip without configured character voice

    Examples:
      | route            | hint                                                                                                                                                      |
      | Project overview | Lost an entity in the filing-cabinet jungle? Global search finds it without rearranging a single saved Draft.                                             |
      | Shared Profiles  | Concepts arrange Profile properties into sensible documentation gangs. Validation remains unmoved; it has its own clipboard.                             |
      | Pages            | Path conditions are the Page's doorman: they inspect each observed location and politely—or firmly—decide whether it belongs.                            |
      | Assignments      | Run preflight before testing. Missing targets and tied candidates are easier to catch before they put on matching moustaches.                              |
      | Documentation    | Generate rich copy or Excel only after refreshing the preview. Exporting stale work merely gives yesterday better stationery.                             |

  # Specification Studio technical analyst guidance runtime 015
  Scenario Outline: Specification Studio technical analyst guidance runtime 015
    Given production pointer hover and keyboard focus dwell for 3 seconds on <control> in <route>
    When the control-specific scheduler result is presented
    Then rendered control guidance is <tip>
    And semantic evidence identifies the action, its consequence, and when or why to use it
    And text inspection excludes the generic available-here and use-it-here templates
    And DOM and scheduler evidence uses the same comic bubble, tail, and typewriter path as general tips
    When an unregistered visible named control completes the same dwell
    Then scheduler evidence presents no fabricated generic control tip

    Examples:
      | route            | control        | tip                                                                                                                                                            |
      | Pages            | Add Page       | Every grand journey needs somewhere for the trouble to begin. Add Page creates a real location before you send it marching onto a Flow.                       |
      | Project overview | Run preflight   | Run preflight before publishing. It is considerably cheaper than discovering a missing target while the brass band is already playing.                       |
      | Project overview | Coverage matrix | The Coverage matrix catches untested properties hiding behind the curtains. Open it when surely something covers that stops sounding scientific.            |
      | Pages            | Undo            | Made a magnificent blunder? Undo rewinds the latest change on this page while the published revision remains safely behind glass.                             |
      | Project overview | Publish release | Publish release turns today's Draft into an immutable revision. Give the review one heroic squint first; even boffins check the parachute.                    |

  # Specification Studio technical analyst guidance runtime 016
  Scenario: Specification Studio technical analyst guidance runtime 016
    Given the installed approved technical-analyst copy catalogue
    When every production catalogue entry is inspected
    Then every stable tip identity maps to its exact catalogue text
    And catalogue evidence associates each tip with accurate action, consequence, concept, or timing advice
    And each text contains its curated situation-specific comic device
    And the catalogue uses one cheerful, overconfident specification-detective voice
    And no character assertion depends on matching a prefixed-exclamation list
    And text inspection finds no operator mockery or tip longer than 180 characters

  # Specification Studio technical analyst guidance runtime 017
  Scenario Outline: Specification Studio technical analyst guidance runtime 017
    Given production guidance exposes the <route> general-tip pool
    Then at least 5 stable distinct tip identities remain
    And the installed catalogue maps those identities to <topics>
    And each topic maps to a different tip identity and production action or concept

    Examples:
      | route            | topics                                                                                          |
      | Project overview | collection selection, project context, global search, preflight, and Inspector                  |
      | Shared Profiles  | reusable fields, canonical authoring, Saved Schema adoption, concepts, and closed fields        |
      | Pages            | observed event, path conditions, Page Group order, Shared Profiles, and effective schema        |
      | Page Groups      | membership, conditions, inherited fields, contribution order, and conflict repair               |
      | Events           | observed name, observation source, payload target, Page and Flow use, and canonical contributors |
      | Applicability    | priority, observable conditions, fallback, overlap preflight, and Assignment selection          |
      | Flows            | Page insertion, Page frames, Event containment, relationships, and Documentation refresh        |
      | Fixtures         | observations, expected outcomes, context, guided validation, and advisory coverage              |
      | Assignments      | Event selection, Applicability, contributor target, priority, and preflight                     |
      | Documentation    | preview refresh, section selection, concepts, theme save, and export                            |

  # Specification Studio technical analyst guidance runtime 018
  Scenario: Specification Studio technical analyst guidance runtime 018
    Given the prior production catalogue supports Add Page, Run preflight, Coverage matrix, Undo, and Publish release
    When the installed comic catalogue replaces its text
    Then all 5 stable control targets still return curated control guidance
    And all 50 prior general-tip identities remain on their original routes
    And scheduler constants, rotation order, dwell behavior, session history, copy semantics, and live-region behavior are unchanged
    And installed R02 title art, analyst sources, stacked bubble, and speaking cycle intentionally replace the prior R01 artwork and side-by-side geometry
