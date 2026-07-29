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
    And project bytes, Draft token, revision, and Undo count remain unchanged

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
