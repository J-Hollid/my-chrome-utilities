# mutation-stamp: sha256=361819800cce5c6da006820edfd45000460b2c95cfab32cf439f4257580f4127
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-29T20:43:26.833629861Z","feature_name":"Specification Studio technical analyst guidance","feature_path":"features/specification-studio-technical-analyst-guidance.feature","background_hash":"67a51519f2b0d0749043fabf24f5487caf0095c72f134ae6b2f3cc74c388867d","implementation_hash":"a0fd949b89","scenarios":[{"index":3,"name":"Specification Studio technical analyst guidance 004","scenario_hash":"188dcf3518f08d60728e18ecb050bc9260243eefd229782fef3bb5c815372e1e","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-29T20:43:26.833629861Z"},{"index":5,"name":"Specification Studio technical analyst guidance 006","scenario_hash":"22e578a6bb49768e47f0f2c38ae98931247ef80d54205828f7cd4aca31f330be","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-29T20:43:26.833629861Z"},{"index":6,"name":"Specification Studio technical analyst guidance 007","scenario_hash":"55f3a38ae6eea797b12fe8d6b13499a9c1541496b5e871a229d94ab299c8018b","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-29T20:43:26.833629861Z"},{"index":8,"name":"Specification Studio technical analyst guidance 009","scenario_hash":"cf35e28a89fc48af0face7204dfb31c42a6b4695aa43edd3b40bec850ab16b97","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-29T20:43:26.833629861Z"},{"index":9,"name":"Specification Studio technical analyst guidance 010","scenario_hash":"dbbb6e325a82c37d20c1aefe5d4d3ce9867599e1515b1206ba261fe13c35e7c3","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-29T20:43:26.833629861Z"},{"index":10,"name":"Specification Studio technical analyst guidance 011","scenario_hash":"a8ceae706062875d94a0f831dabcbbb471937f59ea51079c4ee1cb25d9f78cfd","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-29T20:43:26.833629861Z"},{"index":11,"name":"Specification Studio technical analyst guidance 012","scenario_hash":"3728b1612ceb571f3615a12a506ada65bab1d8ab86314d6a98c3623331102f38","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-29T20:43:26.833629861Z"},{"index":0,"name":"Specification Studio technical analyst guidance 001","scenario_hash":"ef4c3f80f1436cdf6a1c54c0a9d9d3e621e9612a7dc1cd2609d6a886610dfe19","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-29T18:33:49.987709123Z"},{"index":1,"name":"Specification Studio technical analyst guidance 002","scenario_hash":"2105176ad2cb9e68145c7d6e0ea1f2d209e7a10d9957d561c8ef2e38983aea68","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-29T18:33:49.987709123Z"},{"index":2,"name":"Specification Studio technical analyst guidance 003","scenario_hash":"86e504c6101e12b2fdc36ba0da70eebd5c980e3d9f011c85e5f654ac6a378495","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-29T18:33:49.987709123Z"},{"index":4,"name":"Specification Studio technical analyst guidance 005","scenario_hash":"77ac3ab506683a2c15ee8277e1bd75bfdb5b43820638c967e797b1b7dc52d3d5","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-29T18:33:49.987709123Z"}]}
# acceptance-mutation-manifest-end

Feature: Specification Studio technical analyst guidance

  Background:
    Given an operator is actively using a populated Specification Studio
    And technical analyst guidance uses dedicated space outside navigation content when the navigation rail is visible

  # Specification Studio technical analyst guidance 001
  Scenario Outline: Specification Studio technical analyst guidance 001
    Given the Studio navigation rail is visible
    When the Studio presents the technical analyst in the navigation rail
    Then the artwork is anchored at the <horizontal_edge> of its dedicated space
    And its displayed width is <displayed_width> instead of <previous_width>
    And its aspect ratio and transparent background are preserved
    And <unchanged_surface> artwork is unchanged

    Examples:
      | horizontal_edge | displayed_width | previous_width | unchanged_surface     |
      | left            | 6.5rem          | 5.2rem         | no-project start-card |

  # Specification Studio technical analyst guidance 002
  Scenario Outline: Specification Studio technical analyst guidance 002
    Given the Studio navigation rail is visible
    And the Studio has remained visible and active for <elapsed_time>
    And no dialog, menu, or blocking layer is open
    When the hint schedule is evaluated
    Then the hint bubble is <result>

    Examples:
      | elapsed_time                               | result                    |
      | less than 10 seconds after Studio is ready | not shown                 |
      | 10 seconds after Studio is ready            | shown once                |
      | less than 120 seconds after the prior hint  | not shown                 |
      | 120 seconds after the prior hint             | shown once when available |

  # Specification Studio technical analyst guidance 003
  Scenario Outline: Specification Studio technical analyst guidance 003
    Given the guidance scheduler has selected the next hint
    When the current Studio route is <route>
    Then the bubble says <hint>
    And its tail visibly points to the technical analyst
    And it uses a cheesy classic British-comic treatment inspired by Beano and Dandy
    And that treatment has bold irregular ink, cream paper, halftone texture, mustard accent, and playful lettering
    And the hint is not repeated in the same Studio session until every applicable hint has been presented

    Examples:
      | route             | hint                                                                                          |
      | Project overview  | Crikey! Pick a collection on the left to start shaping your specification.                    |
      | Shared Profiles   | Smashing! Put reusable fields here so Pages and Events can inherit them.                       |
      | Pages             | Jolly good! Give each Page its observed page event before refining its schema.                 |
      | Flows             | Cor! Add Pages to the canvas first, then place interaction Events inside them.                 |
      | Documentation     | Splendid! Refresh the preview after changing a Documentation Set.                              |

  # Specification Studio technical analyst guidance 004
  Scenario Outline: Specification Studio technical analyst guidance 004
    Given timed guidance is currently displayed
    When <event> occurs
    Then the hint bubble is <result>
    And focus remains on the operator's current control
    And focus, project state, revision, and Undo history remain unchanged

    Examples:
      | event                              | result                                 |
      | 10 seconds elapse                  | disappears automatically               |
      | the Studio document becomes hidden | disappears and pauses the hint interval |

  # Specification Studio technical analyst guidance 005
  Scenario Outline: Specification Studio technical analyst guidance 005
    Given the Studio guidance layout is evaluated at <presentation>
    Then the analyst and bubble are <visibility>
    And visible guidance occupies only its dedicated space
    And no navigation item, workspace control, or Inspector control is covered
    And no horizontal page scroll is introduced
    And an automatic hint is a polite advisory announcement
    And reduced-motion presentation uses no entrance or exit animation

    Examples:
      | presentation                          | visibility |
      | 1280 by 900 CSS pixel Studio          | visible    |
      | 200 percent browser zoom              | visible    |
      | narrow Studio with navigation hidden  | hidden     |

  # Specification Studio technical analyst guidance 006
  Scenario Outline: Specification Studio technical analyst guidance 006
    Given the technical analyst is visible as an interactive guidance control
    When <pointer_or_focus_state> applies
    Then the analyst is displayed at <scale>
    And a mustard and ink highlight is <highlight_state>
    And the visual change causes no layout movement or content overlap

    Examples:
      | pointer_or_focus_state             | scale       | highlight_state |
      | pointer hover begins               | 105 percent | visible         |
      | keyboard focus arrives             | 105 percent | visible         |
      | pointer hover or keyboard focus ends | 100 percent | absent          |

  # Specification Studio technical analyst guidance 007
  Scenario Outline: Specification Studio technical analyst guidance 007
    Given the technical analyst is visible
    When the operator activates him with <activation>
    Then the next unused tip for the current Studio part appears immediately
    And any visible tip is replaced
    And the ordinary hint interval restarts at 120 seconds
    And focus, project state, revision, and Undo history remain unchanged

    Examples:
      | activation |
      | click      |
      | Enter      |
      | Space      |

  # Specification Studio technical analyst guidance 008
  Scenario: Specification Studio technical analyst guidance 008
    Given the analyst's head is on the left
    And a hint bubble is visible to his right
    Then the tail's narrow end begins beside the right side of his head
    And the tail travels rightward and curves downward
    And its wide end joins the left edge of the bubble
    And the complete tail remains inside dedicated guidance space

  # Specification Studio technical analyst guidance 009
  Scenario Outline: Specification Studio technical analyst guidance 009
    Given the page being left has <current_tip_state>
    When the operator changes to a different Studio page
    Then the current bubble is hidden
    And the automatic hint timer restarts at 10 seconds
    And previously presented tip identities remain remembered for the session

    Examples:
      | current_tip_state |
      | no visible tip    |
      | a visible tip     |

  # Specification Studio technical analyst guidance 010
  Scenario Outline: Specification Studio technical analyst guidance 010
    Given the operator is using <studio_part>
    Then that part has at least 5 distinct general tips
    And every tip gives accurate advice specific to that part
    And automatic or requested tips rotate without repetition until that part's pool is exhausted

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

  # Specification Studio technical analyst guidance 011
  Scenario Outline: Specification Studio technical analyst guidance 011
    Given the pointer or keyboard focus remains on one visible named Studio control for <dwell_time>
    And no dialog, menu, or blocking layer is open
    When control guidance is considered
    Then a control-specific analyst tip is <result>
    And the tip uses the same reserved bubble without moving focus or covering content
    And showing control guidance starts a fresh 120-second wait for ordinary guidance
    And it does not retrigger until the pointer and keyboard focus leave that control

    Examples:
      | dwell_time                               | result      |
      | less than 3 seconds                      | not shown   |
      | 3 seconds of continuous pointer hover    | shown once  |
      | 3 seconds of continuous keyboard focus   | shown once  |

  # Specification Studio technical analyst guidance 012
  Scenario Outline: Specification Studio technical analyst guidance 012
    Given a complete analyst tip has been selected
    When its bubble uses <motion_preference>
    Then visible text presents <output>
    And the interval between successive visible characters is <character_interval>
    And space for the complete final text is reserved before the first character appears
    And replacing, hiding, or navigating away from the tip cancels its active print sequence
    And assistive technology receives the complete tip once rather than each partial string
    And focus, project state, revision, and Undo history remain unchanged

    Examples:
      | motion_preference | output                                   | character_interval |
      | standard motion   | one complete visible character at a time | 20 milliseconds    |
      | reduced motion    | the complete tip immediately              | 0 milliseconds     |
