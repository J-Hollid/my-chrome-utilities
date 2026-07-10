# mutation-stamp: sha256=df216d553fb5e2c380bc65fb0d96f12a8c03b183513f2baa5305be5583b6bcc4
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T17:15:20.937557292Z","feature_name":"Data layer observation target access","feature_path":"features/data-layer-observation-target-access.feature","background_hash":"b8520da93b19d64a7d8f036bb610aeabd487d784f0629aa56893cfd13b3a4548","implementation_hash":"sha256:architect-semantic-review-v3","scenarios":[{"index":0,"name":"Data layer observation target access 001","scenario_hash":"5233c360cf4f9a0b4de6cf9491b0b9425134f25a27a127304676878c8f39179d","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:20.937557292Z"},{"index":1,"name":"Data layer observation target access 002","scenario_hash":"ed5ffe2acd7f3ed7de91f5f60311d9c97cb8241d3af91e813dfaef33d575ed5c","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:20.937557292Z"},{"index":2,"name":"Data layer observation target access 003","scenario_hash":"b0427c7585e8ef9d60adda9f4f0469a6214b7a24dd2da9659e1d2fa257743add","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:20.937557292Z"},{"index":3,"name":"Data layer observation target access 004","scenario_hash":"586833147bb23140f98831789f03a3d59f6f25524e16a6f2c0123dda0d775120","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:20.937557292Z"},{"index":4,"name":"Data layer observation target access 005","scenario_hash":"42c28452bcf1801882e3b976bca933cce1e6af7db3d4ff91b196198604c3a016","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:20.937557292Z"},{"index":5,"name":"Data layer observation target access 006","scenario_hash":"1bafaa40f785f238d3a372750bf927c9778f7b14d0988ff18f3c07cbbc023b8c","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:20.937557292Z"},{"index":6,"name":"Data layer observation target access 007","scenario_hash":"ce8f09e81a3da0d5fb45c0c981ad67978e1672ba6eeb0a02945a050cff28c989","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:20.937557292Z"},{"index":7,"name":"Data layer observation target access 008","scenario_hash":"8b76dc3599c4aa9052c7d1d31f47eb5061d326e21db816b95a25f8e28e4396de","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:20.937557292Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer observation target access

  Background:
    Given a repository for project <project_name>
    And the observation target picker is displayed

  # Data layer observation target access 001
  Scenario Outline: Data layer observation target access 001
    Given the extension was invoked by the user on active page <page_url>
    When that invocation registers its tab as an observation target
    Then the target records the invoking tab id, window id, title, <page_url>, origin, and temporary access state
    And the target can be checked and attached while its active-tab access remains valid
    And no permission prompt is shown solely to use the valid active-tab grant

    Examples:
      | project_name         | page_url                           |
      | my-chrome-utilities | https://shop.example.test/checkout |

  # Data layer observation target access 002
  Scenario Outline: Data layer observation target access 002
    Given permission to browse open-tab metadata is <permission_state>
    When the user chooses <discovery_action>
    Then the optional tab-metadata permission is requested from that user action when needed
    And result <discovery_result> is explained in the picker
    And declining the permission does not remove registered or recent targets

    Examples:
      | project_name         | permission_state | discovery_action | discovery_result                         |
      | my-chrome-utilities | not granted      | Browse all tabs  | All open tabs become available on grant  |
      | my-chrome-utilities | denied           | Browse all tabs  | Registered targets remain available      |

  # Data layer observation target access 003
  Scenario Outline: Data layer observation target access 003
    Given optional tab-metadata permission is granted
    When open target candidates are discovered
    Then titles and URLs are read only to present the target picker
    And restricted and unsupported schemes are identified before attachment is attempted
    And the complete open-tab inventory is not persisted as observation history
    And refreshing discovery removes tabs that have closed

    Examples:
      | project_name         |
      | my-chrome-utilities |

  # Data layer observation target access 004
  Scenario Outline: Data layer observation target access 004
    Given selected target <page_title> at origin <origin> requires site access
    When the user chooses Request access for <page_title>
    Then access is requested only for origin <origin> from that user action
    And the page is not probed before access is granted
    When access is granted
    Then target <page_title> is checked against the configured history path
    And another origin is not granted implicitly

    Examples:
      | project_name         | page_title | origin                    |
      | my-chrome-utilities | Checkout   | https://shop.example.test |

  # Data layer observation target access 005
  Scenario Outline: Data layer observation target access 005
    Given selected target <page_title> requires site access
    When the user declines the access request
    Then target <page_title> remains selected with state <access_state>
    And observation does not start on <page_title> or another tab
    And the extension does not repeat the permission prompt without another explicit user action

    Examples:
      | project_name         | page_title | access_state        |
      | my-chrome-utilities | Checkout   | Permission required |

  # Data layer observation target access 006
  Scenario Outline: Data layer observation target access 006
    Given candidate page <page_title> uses URL scheme <url_scheme>
    When target eligibility is evaluated
    Then the page has target state <target_state>
    And explanation <explanation> is shown
    And no script injection is attempted

    Examples:
      | project_name         | page_title       | url_scheme        | target_state | explanation                        |
      | my-chrome-utilities | Extensions       | chrome            | Restricted   | Chrome pages cannot be observed    |
      | my-chrome-utilities | Extension panel  | chrome-extension  | Restricted   | Extension pages cannot be observed |
      | my-chrome-utilities | New tab          | chrome             | Restricted   | Chrome pages cannot be observed    |

  # Data layer observation target access 007
  Scenario Outline: Data layer observation target access 007
    Given target resolution fails with condition <failure_condition>
    When data layer testing is requested
    Then no testing session is created with a fabricated tab id
    And no session or timeline URL uses the extension side-panel URL
    And target state <target_state> and recovery action <recovery_action> are shown

    Examples:
      | project_name         | failure_condition        | target_state       | recovery_action  |
      | my-chrome-utilities | tab metadata unavailable | Selection required | Choose target    |
      | my-chrome-utilities | script injection denied  | Permission required | Request access  |
      | my-chrome-utilities | tab closed                | Closed             | Choose target    |

  # Data layer observation target access 008
  Scenario Outline: Data layer observation target access 008
    Given persistent site access for origin <origin> was granted through observation target selection
    When the user removes access for <origin> from target settings
    Then the permission is revoked for <origin>
    And another granted origin remains unchanged
    And an attached observer on <origin> is detached before further page content is read

    Examples:
      | project_name         | origin                    |
      | my-chrome-utilities | https://shop.example.test |
