# mutation-stamp: sha256=8e8852bec8be0f0dc2033ae63a271a65e91eb47bc364e4a172f147efd1c861b1
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-29T18:34:38.699002499Z","feature_name":"Specification Studio technical analyst guidance","feature_path":"features/specification-studio-technical-analyst-guidance.feature","background_hash":"67a51519f2b0d0749043fabf24f5487caf0095c72f134ae6b2f3cc74c388867d","implementation_hash":"architect-pause-boundary-v1","scenarios":[{"index":3,"name":"Specification Studio technical analyst guidance 004","scenario_hash":"6057677168d7dc4cbd732f01c8ff52b401de8e8b6ce4ce339c53349e8c33377b","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-29T18:34:38.699002499Z"},{"index":0,"name":"Specification Studio technical analyst guidance 001","scenario_hash":"ef4c3f80f1436cdf6a1c54c0a9d9d3e621e9612a7dc1cd2609d6a886610dfe19","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-29T18:33:49.987709123Z"},{"index":1,"name":"Specification Studio technical analyst guidance 002","scenario_hash":"2105176ad2cb9e68145c7d6e0ea1f2d209e7a10d9957d561c8ef2e38983aea68","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-29T18:33:49.987709123Z"},{"index":2,"name":"Specification Studio technical analyst guidance 003","scenario_hash":"86e504c6101e12b2fdc36ba0da70eebd5c980e3d9f011c85e5f654ac6a378495","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-29T18:33:49.987709123Z"},{"index":4,"name":"Specification Studio technical analyst guidance 005","scenario_hash":"77ac3ab506683a2c15ee8277e1bd75bfdb5b43820638c967e797b1b7dc52d3d5","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-29T18:33:49.987709123Z"}]}
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
    And project state and Undo history remain unchanged

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
