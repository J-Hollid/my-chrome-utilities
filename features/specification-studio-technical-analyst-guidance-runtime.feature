# mutation-stamp: sha256=a4ba8aa001d7f7df7c614c1da359122a7e137fef7c1a4d865153c4c85c8eb9fc
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-29T20:50:58.194682293Z","feature_name":"Specification Studio technical analyst guidance runtime","feature_path":"features/specification-studio-technical-analyst-guidance-runtime.feature","background_hash":"c8660f9d15d2ee101f3dff16f67c8ccb32beecdba47ce19f0493021e5bef5390","implementation_hash":"a0fd949b89","scenarios":[{"index":3,"name":"Specification Studio technical analyst guidance runtime 004","scenario_hash":"1fc091ecfecd5a7108b051b5731f7d8c4ed6d54f1ea131787ef975487fac4fe3","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-29T20:50:58.194682293Z"},{"index":5,"name":"Specification Studio technical analyst guidance runtime 006","scenario_hash":"adaea34a0e05f510d09905efa5543df2cb28fb32108a8b40ba1178b72ca4704a","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-29T20:50:58.194682293Z"},{"index":6,"name":"Specification Studio technical analyst guidance runtime 007","scenario_hash":"88e96c05e7385cc1827089954a20077fa76e788834a06be7eebb6e04b57746d4","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-29T20:50:58.194682293Z"},{"index":8,"name":"Specification Studio technical analyst guidance runtime 009","scenario_hash":"d2ada72e63110ab2c22c04873c30334a9aa939e882b33d04820320ba3dc07635","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-29T20:50:58.194682293Z"},{"index":9,"name":"Specification Studio technical analyst guidance runtime 010","scenario_hash":"863c898f72780c2af5b8a9eb927aa0965ab102e84ee30d00fe1885326ce938af","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-29T20:50:58.194682293Z"},{"index":10,"name":"Specification Studio technical analyst guidance runtime 011","scenario_hash":"0abea7d5a6d707ba1f9bffd750dfaf3877682a57b0102b79584d3e3638616735","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-29T20:50:58.194682293Z"},{"index":11,"name":"Specification Studio technical analyst guidance runtime 012","scenario_hash":"b32386523817de56a555c2a61ae8d397fd97932cff99a7a9734d120eb3071847","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-29T20:50:58.194682293Z"},{"index":0,"name":"Specification Studio technical analyst guidance runtime 001","scenario_hash":"39d0bf19405bebd82cb0b074a95323987803c4b3de27c1a5726997c2cc91e675","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-29T18:41:56.521274697Z"},{"index":1,"name":"Specification Studio technical analyst guidance runtime 002","scenario_hash":"650d4bd2f1a022345d111159a13ff41623c8d40f33f6531155a6fd64ccb65529","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-29T18:41:56.521274697Z"},{"index":2,"name":"Specification Studio technical analyst guidance runtime 003","scenario_hash":"06023340990b7fd4f4679153dbe244b21aad00cf64649f5bdfd371f2252612e7","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-29T18:41:56.521274697Z"},{"index":4,"name":"Specification Studio technical analyst guidance runtime 005","scenario_hash":"7bdbb80da1744d74916df95711461fa6f5491f4db13398479ad0f5f2bde303cd","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-29T18:41:56.521274697Z"}]}
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
    And its computed width is <displayed_width> instead of <previous_width>
    And the source aspect ratio and transparent pixels are preserved
    And computed <unchanged_surface> artwork is unchanged

    Examples:
      | horizontal_edge | displayed_width | previous_width | unchanged_surface     |
      | left            | 6.5rem          | 5.2rem         | no-project start-card |

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
      | Project overview  | Crikey! Pick a collection on the left to start shaping your specification.                    |
      | Shared Profiles   | Smashing! Put reusable fields here so Pages and Events can inherit them.                       |
      | Pages             | Jolly good! Give each Page its observed page event before refining its schema.                 |
      | Flows             | Cor! Add Pages to the canvas first, then place interaction Events inside them.                 |
      | Documentation     | Splendid! Refresh the preview after changing a Documentation Set.                              |

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
    And computed mustard and ink highlight is <highlight_state>
    And guidance-region and neighboring-control bounding boxes do not move or overlap

    Examples:
      | pointer_or_focus_state               | scale       | highlight_state |
      | pointer hover begins                 | 105 percent | visible         |
      | keyboard focus arrives               | 105 percent | visible         |
      | pointer hover or keyboard focus ends | 100 percent | absent          |

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
    Given installed analyst head geometry is on the left
    And installed bubble geometry is visible to its right
    Then the computed tail narrow endpoint is beside the right side of the head
    And sampled tail geometry travels rightward and curves downward
    And its wide endpoint joins the bubble's left edge
    And no sampled tail point falls outside reserved guidance geometry

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
    And active element, project bytes, Draft token, revision, and Undo count remain unchanged

    Examples:
      | motion_preference | output                                   | character_interval |
      | standard motion   | one complete visible character at a time | 20 milliseconds    |
      | reduced motion    | the complete tip immediately              | 0 milliseconds     |
