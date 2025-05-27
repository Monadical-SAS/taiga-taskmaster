import { ParseResult, Redacted, Schema } from "effect"
import { bang, castPositiveInteger, PositiveInteger, type Prettify } from './index.js';
import { Unexpected } from "effect/ParseResult";

const TaskId = PositiveInteger.pipe(
  Schema.brand("TaskId")
);

const SubtaskId = PositiveInteger.pipe(
  Schema.brand("SubtaskId")
);

const SubtaskIdFull = Schema.Tuple(
  TaskId, SubtaskId
);

export type SubtaskIdFull = Schema.Schema.Type<typeof SubtaskIdFull>;



// task-master denotes subtasks ids in arbitrary way: it can be integer 1 or a string "2.1" - both equals to each other
// we throw away the task number here in that case to conform to their docs
const SubtaskIdFromString = Schema.transformOrFail(Schema.String, Schema.RedactedFromSelf(SubtaskId), {
  strict: true,
  decode: (s) => {
    const a = s.split('.');
    if (a.length !== 2) return ParseResult.fail(new Unexpected(`subtasks length isn't 2: ${a.length}`));
    return ParseResult.map(ParseResult.decode(Schema.compose(Schema.NumberFromString, SubtaskId))(bang(a[1])), Redacted.make)
  },
  encode: (n, _, ast) => {
    return ParseResult.fail(
      new ParseResult.Forbidden(
        ast,
        n,
        "Encoding bugged subtask string back is prohibited."
      )
    )
  }
})

const TaskStatus = Schema.Literal('done', 'pending', 'in-progress');

const SubtaskFileContent = Schema.Struct({
  id: SubtaskIdFromString,
  title: Schema.NonEmptyString,
  description: Schema.String,
  status: TaskStatus,
  dependencies: TaskId,
  details: Schema.String,
  testStrategy: Schema.String
})

const TaskFileContent = Schema.Struct({
  id: TaskId,
  title: Schema.NonEmptyString,
  description: Schema.String,
  status: TaskStatus,
  dependencies: TaskId,
  details: Schema.String,
  testStrategy: Schema.String,
  subtasks: Schema.Array(SubtaskFileContent)
})

// mix https://github.com/eyaltoledano/claude-task-master/blob/main/docs/task-structure.md and real data that are different from each other
const TasksFileContent = Schema.Struct({
  tasks: Schema.Array(
    TaskFileContent
  )
})

const example = {
  "tasks": [
    {
      "id": 1,
      "title": "Setup Project Repository and Development Environment",
      "description": "Initialize the project repository and set up the development environment with Vite, React, TypeScript, and Phaser 3.",
      "status": "done",
      "dependencies": [],
      "priority": "high",
      "details": "1. Create a new Git repository\n2. Initialize the project using Vite with React and TypeScript template\n3. Install Phaser 3 (latest version, e.g., 3.60.0)\n4. Configure Vite for Phaser 3 support, including static asset handling\n5. Set up ESBuild-based development server\n6. Install and configure modern ESLint with TypeScript support\n7. Set up Prettier for code formatting\n8. Configure TypeScript compiler options\n9. Set up environment variable handling\n10. Create basic folder structure (src/components, src/game, src/utils)\n11. Set up a basic React component to host the Phaser game\n12. Initialize a simple Phaser game scene\n13. Configure production builds with code splitting\n14. Set up development tools (VSCode settings, debugging configuration)\n15. Ensure hot module replacement (HMR) works for both React and Phaser components",
      "testStrategy": "1. Verify all dependencies are correctly installed\n2. Ensure the Vite development server runs without errors\n3. Confirm HMR works for both React and Phaser changes\n4. Run ESLint to check for any code style issues\n5. Test production build for optimizations and code splitting\n6. Verify proper loading of static assets in Phaser\n7. Check environment variable handling in different modes (development/production)\n8. Test VSCode debugging configuration",
      "subtasks": [
        {
          "id": "1.1",
          "title": "Initialize Vite project with React and TypeScript",
          "status": "done"
        },
        {
          "id": "1.2",
          "title": "Configure Vite for Phaser 3 support",
          "status": "done"
        },
        {
          "id": "1.3",
          "title": "Set up ESBuild-based development server",
          "status": "done"
        },
        {
          "id": "1.4",
          "title": "Configure modern ESLint with TypeScript support",
          "status": "done"
        },
        {
          "id": "1.5",
          "title": "Set up environment variable handling",
          "status": "done"
        },
        {
          "id": "1.6",
          "title": "Configure production builds with code splitting",
          "status": "done"
        },
        {
          "id": "1.7",
          "title": "Set up development tools (VSCode settings, debugging)",
          "status": "done"
        }
      ]
    },
    {
      "id": 2,
      "title": "Implement Core Game Systems",
      "description": "Develop the foundational game systems including character stats, leveling, and basic game state management.",
      "details": "1. Create a PlayerStats class with properties for Strength, Agility, Vitality, and Intelligence\n2. Implement the XP and leveling system using the provided formulas\n3. Create a GameState class to manage overall game state\n4. Implement LocalStorage save/load functionality\n5. Use Redux for state management (redux@4.2.1, react-redux@8.1.0)\n6. Create actions and reducers for updating player stats and game state\n7. Implement the stat allocation system\n8. Create utility functions for combat calculations (damage, dodge chance, etc.)",
      "testStrategy": "1. Unit test the PlayerStats class methods\n2. Test XP calculation and leveling logic\n3. Verify LocalStorage save/load functionality\n4. Test Redux actions and reducers\n5. Create mock battles to test combat calculations",
      "priority": "high",
      "dependencies": [
        1
      ],
      "status": "done",
      "subtasks": [
        {
          "id": 1,
          "title": "Create PlayerStats class with TypeScript interfaces",
          "description": "Design and implement the PlayerStats class with proper TypeScript interfaces for all player attributes and methods",
          "dependencies": [],
          "details": "Define interfaces for base stats (strength, dexterity, intelligence, etc.), derived stats (health, mana, damage), and implement the PlayerStats class with proper type safety. Include methods for stat calculation, modification, and validation. Use private properties with getters/setters where appropriate.",
          "status": "done"
        },
        {
          "id": 2,
          "title": "Implement XP/leveling system with progression curves",
          "description": "Create a flexible experience and leveling system with configurable progression curves",
          "dependencies": [
            1
          ],
          "details": "Implement XP accumulation, level-up detection, and stat point allocation on level-up. Design a configurable XP curve formula. Create interfaces for level requirements and rewards. Include methods for gaining XP, calculating level from XP, and determining available stat points. Add event emitters for level-up events.",
          "status": "done"
        },
        {
          "id": 3,
          "title": "Design GameState management system with TypeScript types",
          "description": "Create a comprehensive game state management system with proper TypeScript typing",
          "dependencies": [
            1,
            2
          ],
          "details": "Define interfaces for all game state components (player, enemies, world, inventory, quests, etc.). Implement state transitions with proper validation. Create a GameState class that manages the overall state with type-safe access patterns. Include methods for saving/loading state snapshots.",
          "status": "done"
        },
        {
          "id": 4,
          "title": "Implement LocalStorage integration with serialization",
          "description": "Create a persistence layer using LocalStorage with proper serialization/deserialization",
          "dependencies": [
            3
          ],
          "details": "Implement save/load functionality using LocalStorage. Create serialization/deserialization helpers for complex objects. Add versioning for saved data to handle migrations. Implement auto-save functionality with configurable intervals. Include error handling for storage quota exceeded and data corruption scenarios.",
          "status": "done"
        },
        {
          "id": 5,
          "title": "Set up Redux Toolkit with TypeScript configuration",
          "description": "Configure Redux Toolkit with proper TypeScript typing for the game state",
          "dependencies": [
            3
          ],
          "details": "Set up Redux Toolkit with configureStore. Define RootState and AppDispatch types. Create typed hooks (useAppDispatch, useAppSelector). Implement middleware for logging, thunks, and persistence. Configure the Redux DevTools extension for development debugging.",
          "status": "done"
        },
        {
          "id": 6,
          "title": "Create Redux slices for game state components",
          "description": "Implement Redux Toolkit slices for various game state components with proper typing",
          "dependencies": [
            5
          ],
          "details": "Create separate slices for player, inventory, combat, quests, and world state. Implement reducers and actions for each slice using createSlice. Define selectors for derived state. Use proper TypeScript typing throughout. Implement thunks for async operations like saving/loading.",
          "status": "done"
        },
        {
          "id": 7,
          "title": "Implement stat allocation system with validation",
          "description": "Create a system for allocating stat points with proper validation and constraints",
          "dependencies": [
            1,
            2,
            6
          ],
          "details": "Implement UI-independent logic for allocating stat points. Create validation rules for minimum/maximum stat values. Implement stat point costs (e.g., higher stats cost more points). Add methods for previewing stat changes before committing. Create undo functionality for recent allocations.\n<info added on 2025-05-26T01:41:40.561Z>\nImplementation complete. All requirements met:\n- UI-independent logic in PlayerStats class\n- Validation rules: MIN_STAT_VALUE=1, MAX_STAT_VALUE=100\n- Scaling stat point costs (increases after 50)\n- Preview method: previewStatAllocation()\n- Undo functionality with 10-allocation history\n- React component with UI integration\n- Comprehensive test coverage for model and component\n\nAdditional features:\n- Progressive cost scaling\n- Complete allocation validation\n- Preview system for anticipated changes\n- FIFO queue for undo history\n- TypeScript typing throughout\n- Event emission for stat changes\n- Redux state management integration\n\nAll tests passing. Task fully functional and ready for review.\n</info added on 2025-05-26T01:41:40.561Z>",
          "status": "done"
        },
        {
          "id": 8,
          "title": "Develop combat utility functions and damage calculation",
          "description": "Create a comprehensive set of combat utility functions with proper typing",
          "dependencies": [
            1,
            3,
            6
          ],
          "details": "Implement damage calculation formulas based on stats. Create hit chance and critical hit calculations. Implement status effect application and duration tracking. Add combat log generation utilities. Create helper functions for calculating derived combat stats (DPS, effective health, etc.). Ensure all functions are properly typed and tested.\n<info added on 2025-05-26T01:47:57.137Z>\nCombat utility functions implementation completed successfully:\n\n- Comprehensive damage calculation formulas implemented for physical and magic damage, including defense reduction, variance, and critical hit multipliers with minimum damage enforcement.\n- Hit chance and critical hit calculations added, featuring evasion-based dodge mechanics, critical chance capped at 50%, and hit chance bounded between 5% and 95%.\n- Status effect system created with support for creation, application, and expiration management of buffs/debuffs for all stat types, including automatic cleanup of expired effects.\n- Combat log generation utilities implemented with formatted timestamp entries, detailed action logging, and a flexible templating system.\n- Derived combat stats helper functions created for DPS calculation (considering critical rate), effective health (accounting for defense), damage reduction, and dodge chance calculations.\n- Extensive test suite developed with 27 comprehensive tests covering all functionality, including edge cases and boundary conditions. All tests are passing successfully.\n\nThe combat utility module is now fully implemented and ready for integration with the game's combat system.\n</info added on 2025-05-26T01:47:57.137Z>",
          "status": "done"
        }
      ]
    },
    {
      "id": 3,
      "title": "Develop Character Progression System",
      "description": "Implement the stat-driven character progression system with equipment requirements.",
      "details": "1. Create an Equipment class with properties for requirements and stat bonuses\n2. Implement logic for checking equipment requirements based on player stats\n3. Create an InventoryManager class to handle item storage and equipment\n4. Implement methods to calculate total stats including equipment bonuses\n5. Create a UI component for displaying and allocating stat points\n6. Implement the leveling up process, including stat point allocation\n7. Use Immer (immer@10.0.2) for immutable state updates in Redux",
      "testStrategy": "1. Unit test Equipment and InventoryManager classes\n2. Test equipment requirement checks with various player stats\n3. Verify stat calculations with different equipment loadouts\n4. Test the leveling up process and stat point allocation\n5. Create integration tests for the character progression flow",
      "priority": "high",
      "dependencies": [
        2
      ],
      "status": "done",
      "subtasks": [
        {
          "id": 1,
          "title": "Create Equipment Class Structure",
          "description": "Design and implement the Equipment class with properties for stats, requirements, and equipment slots",
          "dependencies": [],
          "details": "Define the Equipment class with properties for name, type, slot, stat bonuses, level requirements, and other attributes. Include methods for checking if a player meets requirements to equip items. Create an enum for equipment slots (Head, Chest, Legs, etc.) and equipment types.",
          "status": "done"
        },
        {
          "id": 2,
          "title": "Implement Equipment Requirement Logic",
          "description": "Create logic to validate if a player meets the requirements to equip specific items",
          "dependencies": [
            1
          ],
          "details": "Develop functions to check if player stats meet minimum requirements for equipment. Include level requirements, stat requirements (strength, intelligence, etc.), and any special conditions. Integrate with the existing PlayerStats and PlayerLevel systems to perform validation checks.",
          "status": "done"
        },
        {
          "id": 3,
          "title": "Develop InventoryManager System",
          "description": "Create a system to manage player inventory including equipment and items",
          "dependencies": [
            1
          ],
          "details": "Implement an InventoryManager class that handles adding, removing, and organizing equipment and items. Include methods for equipping/unequipping items, checking inventory space, and sorting. Design data structures to efficiently store and access inventory items.\n<info added on 2025-05-26T01:55:08.405Z>\nThe InventoryManager system has been fully implemented with comprehensive functionality:\n\n- Complete inventory management with add/remove items, stacking of identical items, and configurable max slots\n- Equipment management including equip/unequip functionality with requirement validation and a slot-based equipment system\n- Advanced features such as item moving, inventory sorting (by name/type/rarity), and comprehensive statistics\n- Robust serialization/deserialization with proper Equipment instance reconstruction\n- 23 comprehensive tests covering all functionality including edge cases\n- Proper TypeScript typing throughout with interfaces for InventoryItem, EquippedItems, and serialization\n\nKey features implemented:\n- Inventory slots with automatic slot assignment and manual moving\n- Equipment requirement validation using existing PlayerStats and PlayerLevel\n- Smart equipment swapping when equipping new items to same slot\n- Inventory full protection when unequipping items\n- Comprehensive statistics and debugging tools\n- Export added to models/index.ts for easy importing\n\nAll tests are passing, and the system is ready for integration with game state and UI components.\n</info added on 2025-05-26T01:55:08.405Z>",
          "status": "done"
        },
        {
          "id": 4,
          "title": "Create Stat Calculation System",
          "description": "Implement logic to calculate final player stats based on base stats and equipment bonuses",
          "dependencies": [
            1,
            2,
            3
          ],
          "details": "Develop a system that calculates the player's effective stats by combining base stats from PlayerStats with bonuses from equipped items. Include methods to recalculate stats when equipment changes. Consider different stat types (additive vs. multiplicative bonuses).\n<info added on 2025-05-26T01:59:17.514Z>\nThe StatCalculator system has been fully implemented with the following features:\n\n1. Comprehensive StatCalculator class integrating PlayerStats and InventoryManager\n2. Equipment bonus and multiplier calculations with proper stat accumulation\n3. Final stat calculations applying base stats + equipment bonuses * multipliers\n4. Detailed stat breakdown showing contribution of each component\n5. Equipment simulation system for preview of equip/unequip effects\n6. Integration with PlayerStats modifier system for real-time stat updates\n7. Derived stats recalculation using equipment-enhanced base stats\n\nKey functionalities include:\n- Real-time calculation of equipment bonuses from all equipped items\n- Support for both additive bonuses and multiplicative effects\n- Equipment contribution tracking for each individual item\n- Simulation capabilities for previewing stat changes\n- Automatic modifier management for PlayerStats integration\n- Comprehensive stat breakdown for UI display\n- Edge case handling and proper rounding\n\n20 comprehensive tests have been created and passed, covering all functionality including complex scenarios with multiple equipment pieces and overlapping bonuses. The system is now ready for integration with UI components and game state management.\n</info added on 2025-05-26T01:59:17.514Z>",
          "status": "done"
        },
        {
          "id": 5,
          "title": "Design Stat Allocation UI",
          "description": "Create user interface for players to allocate stat points earned through leveling",
          "dependencies": [
            4
          ],
          "details": "Design and implement UI components for stat allocation, showing current stats, available points, and allowing players to distribute points. Include visual feedback for stat changes and validation to prevent invalid allocations. Ensure the UI updates when stats change from equipment or leveling.",
          "status": "done"
        },
        {
          "id": 6,
          "title": "Enhance Leveling Process Integration",
          "description": "Connect the existing PlayerLevel system with new progression components",
          "dependencies": [
            4,
            5
          ],
          "details": "Extend the PlayerLevel system to grant stat points on level up. Implement events or callbacks that trigger when a player levels up to update UI, grant rewards, and potentially unlock new equipment options. Create a cohesive flow between leveling, stat allocation, and equipment requirements.",
          "status": "done"
        },
        {
          "id": 7,
          "title": "Integrate Immer for State Management",
          "description": "Implement Immer for immutable state management across the progression system",
          "dependencies": [
            3,
            4,
            6
          ],
          "details": "Set up Immer to handle state updates for player stats, inventory, and equipment in an immutable way. Create producer functions for all state-changing operations. Ensure proper state management when equipping items, allocating stats, and leveling up to maintain data integrity and enable features like undo/redo.",
          "status": "done"
        }
      ]
    },
    {
      "id": 4,
      "title": "Implement Real-Time Combat Mechanics",
      "description": "Develop the core real-time combat system including click-to-attack and projectile mechanics.",
      "details": "1. Implement click-to-attack functionality using Phaser's input system\n2. Create a CombatManager class to handle attack calculations and damage application\n3. Implement melee combat with the 2.5m range restriction\n4. Develop projectile system using Phaser's Arcade Physics\n5. Implement the projectile arc calculation using the provided formula\n6. Create an AOEManager class for handling area of effect spells like Flame Nova\n7. Implement dodge chance calculations\n8. Add visual feedback for attacks, hits, and dodges using Phaser's particle system\n9. Implement an input buffering system to improve responsiveness",
      "testStrategy": "1. Unit test CombatManager and AOEManager classes\n2. Create test scenarios for melee and ranged combat\n3. Verify projectile arcs match the expected trajectories\n4. Test AOE spell effects with different player stats\n5. Perform playtests to ensure combat feels responsive and satisfying",
      "priority": "high",
      "dependencies": [
        2,
        3
      ],
      "status": "done",
      "subtasks": [
        {
          "id": 1,
          "title": "Implement Melee Combat Mechanics",
          "description": "Develop the core melee combat system, including strike, block, dodge, parry, and counterattack mechanics. Ensure risk-reward trade-offs and integrate with player and enemy hit detection.",
          "dependencies": [],
          "details": "Focus on real-time collision detection, animation triggers, and balancing damage, poise, and recovery times. Include support for different melee weapon types and their unique properties.\n<info added on 2025-05-26T02:39:40.092Z>\nGreat progress on the melee combat system! For the projectile combat system, we should:\n\nImplement a ProjectileCombatManager class to handle ranged attacks.\nAdd mouse-based aiming and firing mechanics in MainScene.\nDevelop projectile physics and trajectory calculations.\nCreate collision detection for projectiles, considering both static obstacles and moving targets.\nDesign a variety of projectile types (e.g., arrows, thrown weapons, magic projectiles) with unique properties.\nImplement visual effects for projectile flight, impact, and status effects.\nBalance projectile damage, speed, and cooldown times.\nIntegrate with the existing CombatManager for seamless transition between melee and ranged combat.\nAdd appropriate sound effects for firing and impact of projectiles.\nEnsure proper networking support for multiplayer projectile combat.\nImplement an inventory system for managing ammunition and different projectile types.\nCreate AI behaviors for ranged enemies using the projectile system.\nDevelop a comprehensive test suite for the projectile combat system.\n</info added on 2025-05-26T02:39:40.092Z>",
          "status": "done"
        },
        {
          "id": 2,
          "title": "Develop Projectile Combat System",
          "description": "Create a system for handling projectile-based attacks, including physics calculations for trajectory, collision, and impact effects.",
          "dependencies": [
            1
          ],
          "details": "Support various projectile types (arrows, bullets, magic bolts), implement launch mechanics, and ensure projectiles interact correctly with the environment and characters.",
          "status": "done"
        },
        {
          "id": 3,
          "title": "Implement Area-of-Effect (AOE) Effects",
          "description": "Design and implement AOE attack mechanics, including targeting, effect radius, and damage application over an area.",
          "dependencies": [
            1,
            2
          ],
          "details": "Handle visual indicators for AOE zones, apply effects to all entities within range, and manage overlapping AOE interactions.",
          "status": "done"
        },
        {
          "id": 4,
          "title": "Integrate Combat Feedback Systems",
          "description": "Add visual, audio, and haptic feedback for all combat actions to enhance player immersion and clarity.",
          "dependencies": [
            1,
            2,
            3
          ],
          "details": "Include hit sparks, damage numbers, sound effects, screen shakes, and enemy hit reactions. Ensure feedback is context-sensitive and communicates combat outcomes clearly.\n<info added on 2025-05-26T03:19:37.602Z>\nSuccessfully implemented comprehensive combat feedback system with the following features:\n\n- FeedbackManager Architecture: Centralized system with AudioManager, CameraManager, and ParticleManager\n- Visual Feedback: Enhanced damage numbers, hit sparks, status text with configurable colors and animations\n- Audio System: Sound effects for hits, misses, dodges, blocks, explosions, and projectiles with volume control\n- Screen Shake & Camera Effects: Shake intensity based on hit type, flash effects for explosions, zoom effects\n- Enemy Reactions: Color flashing (red for damage, blue for blocks), knockback animation, recoil effects\n- Particle Systems: Burst particles for impacts, tween-based expanding circles, configurable particle counts\n- Integration: All combat systems (melee, projectile, AOE) now use unified feedback system\n- Configuration: Audio, screen shake, and particles can be individually enabled/disabled\n\nTechnical implementation includes FeedbackManager with factory pattern, pre-loaded sound effects, camera effects, particle management with fallback graphics, and enemy reaction system with color tinting and animation tweens. Old hardcoded feedback methods replaced with new unified system.\n\nIntegration completed in MainScene, projectile hits, AOE effects, and enemy sprites. Build successful with all 220 tests passing, including 19 new FeedbackManager tests.\n</info added on 2025-05-26T03:19:37.602Z>",
          "status": "done"
        },
        {
          "id": 5,
          "title": "Implement Combat Input Handling",
          "description": "Develop robust input handling for all combat actions, ensuring responsive and intuitive controls for melee, projectile, and AOE attacks.",
          "dependencies": [
            1,
            2,
            3,
            4
          ],
          "details": "Map player inputs to combat actions, support input buffering and combos, and handle edge cases such as simultaneous actions or input conflicts.",
          "status": "done"
        }
      ]
    },
    {
      "id": 5,
      "title": "Design and Implement Enemy Archetypes",
      "description": "Create the Wraith, Iron Golem, and Carrion Bats enemy types with their unique behaviors and attributes.",
      "details": "1. Create an abstract Enemy class as a base for all enemy types\n2. Implement the Wraith class with flee behavior and life drain attack\n3. Develop the Iron Golem class with taunt and ground slam AOE abilities\n4. Create the Carrion Bats class with swarm behavior and poison DoT\n5. Implement a behavior tree system using TypeScript-FSM (typescript-fsm@1.7.0)\n6. Design and implement the unique attack patterns for each enemy type\n7. Create factory functions for spawning enemies\n8. Implement enemy spawning logic for different zones\n9. Add visual effects for enemy abilities using Phaser's particle system",
      "testStrategy": "1. Unit test individual enemy classes and their unique behaviors\n2. Test behavior trees for each enemy type\n3. Verify enemy spawning logic and factory functions\n4. Create test scenarios to ensure enemies use their abilities correctly\n5. Perform integration tests with the combat system",
      "priority": "medium",
      "dependencies": [
        4
      ],
      "status": "done",
      "subtasks": [
        {
          "id": 1,
          "title": "Design Abstract Enemy Class",
          "description": "Create a base abstract class that defines common properties and methods for all enemy types, such as health, movement, and basic attack interface.",
          "dependencies": [],
          "details": "Specify virtual methods for behaviors to be overridden by subclasses. Include basic state management and event hooks.",
          "status": "done"
        },
        {
          "id": 2,
          "title": "Implement Wraith Enemy Type",
          "description": "Develop the Wraith enemy class inheriting from the abstract Enemy class, implementing unique attributes and behaviors.",
          "dependencies": [
            1
          ],
          "details": "Define Wraith-specific stats, movement (e.g., phasing or teleporting), and attack logic.",
          "status": "done"
        },
        {
          "id": 3,
          "title": "Implement Iron Golem Enemy Type",
          "description": "Develop the Iron Golem enemy class with its own unique properties and behaviors, extending the abstract Enemy class.",
          "dependencies": [
            1
          ],
          "details": "Include heavy armor, slow movement, and powerful melee attacks.",
          "status": "done"
        },
        {
          "id": 4,
          "title": "Implement Carrion Bats Enemy Type",
          "description": "Create the Carrion Bats enemy class, inheriting from the abstract Enemy class and implementing swarm and flight behaviors.",
          "dependencies": [
            1
          ],
          "details": "Add group movement, aerial attacks, and evasion logic.",
          "status": "done"
        },
        {
          "id": 5,
          "title": "Develop Behavior Tree System",
          "description": "Design and implement a modular behavior tree system to control enemy AI decision-making and state transitions.",
          "dependencies": [
            1
          ],
          "details": "Allow for flexible definition of behaviors such as patrolling, chasing, attacking, and retreating. Integrate with blackboard data for context-aware decisions.\n<info added on 2025-05-26T14:20:59.412Z>\nImplementation of behavior tree system underway. Key components:\n\n1. Node-based architecture with Composite, Decorator, and Leaf nodes\n2. Blackboard system for shared data across nodes\n3. Seamless integration with existing Enemy class, maintaining current functionality\n4. TypeScript implementation for enhanced type safety\n\nThis system will replace manual state handling in updateAI method for Wraith, IronGolem, and CarrionBats enemies, providing more flexible and sophisticated AI decision-making. The new architecture will build upon the existing state management and behavior system, allowing for more complex and adaptable enemy behaviors.\n</info added on 2025-05-26T14:20:59.412Z>\n<info added on 2025-05-26T14:28:41.619Z>\nImplementation of the behavior tree system is now complete. Key features include:\n\n1. Comprehensive behavior tree architecture with composite, decorator, and leaf nodes\n2. Enhanced blackboard system for efficient data sharing\n3. Fluent builder API for intuitive tree construction\n4. Seamless integration with existing Enemy class, maintaining backward compatibility\n5. Pre-built AI templates for various enemy types (Basic, Advanced, Swarm, Defensive)\n6. Extensive testing suite with 261 passing tests\n7. TypeScript implementation for improved type safety and maintainability\n\nThe system replaces manual state handling in the updateAI method for enemies, providing more flexible and sophisticated AI decision-making. It allows for easy modification of AI behaviors without code changes and offers improved modularity, debuggability, and performance. The implementation is fully compatible with existing enemy types and ready for immediate use in expanding and refining enemy behaviors.\n</info added on 2025-05-26T14:28:41.619Z>",
          "status": "done"
        },
        {
          "id": 6,
          "title": "Define Unique Attack Patterns for Each Enemy",
          "description": "Implement distinct attack patterns and abilities for Wraith, Iron Golem, and Carrion Bats, leveraging the behavior tree system.",
          "dependencies": [
            2,
            3,
            4,
            5
          ],
          "details": "Ensure each enemy type has signature attacks and AI-driven tactics (e.g., Wraith teleport strike, Golem ground slam, Bat swarm dive).\n<info added on 2025-05-26T14:56:08.301Z>\nUnique attack patterns implemented for all enemy types:\n\nWraith:\n- PhaseStrike: Teleport behind target, life-draining attack (priority 8, 6s cooldown)\n- SpiritBarrage: 5 homing spirit projectiles, magical damage (priority 6, 10s cooldown)\n\nIron Golem:\n- Earthquake: Multi-wave ground attack, screen shake and debris (priority 9, 15s cooldown)\n- MeteorStrike: 4 meteors with warning indicators, triggers below 50% health (priority 10, 20s cooldown)\n\nCarrion Bats:\n- VenomStorm: 5 poison clouds in cross pattern, swirling particles (priority 7, 12s cooldown)\n- SwarmBlitz: Leader-only coordinated attack, 3 waves of 4 bat silhouettes (priority 9, 18s cooldown)\n\nImplementation features:\n- Behavior tree-driven pattern execution with complex decision logic\n- Priority-based pattern selection with cooldown management\n- Context-aware conditions (mana, health, distance, leader status)\n- Rich visual effects and screen feedback\n- Seamless integration with existing enemy behavior systems\n- Comprehensive test suite with 18 passing tests\n- Full TypeScript type safety and error handling\n</info added on 2025-05-26T14:56:08.301Z>",
          "status": "done"
        },
        {
          "id": 7,
          "title": "Create Enemy Factory and Spawning Logic",
          "description": "Develop a factory system to instantiate enemies and manage spawning logic based on game events or level design.",
          "dependencies": [
            2,
            3,
            4
          ],
          "details": "Support dynamic spawning, pooling, and configuration for different enemy types.\n<info added on 2025-05-26T14:40:53.408Z>\nImplementation complete for enemy factory and spawning system:\n- EnemyFactory: Implements factory pattern with object pooling\n- EnemySpawner: Comprehensive system for zones and waves\n- SpawnConfiguration: Difficulty presets and level unlocking\n- Test suite created (minor fixes needed)\n\nCore functionality operational. Robust foundation for dynamic enemy spawning with configurable zones, waves, and difficulty scaling. Some test failures related to mocking and timing issues require attention.\n</info added on 2025-05-26T14:40:53.408Z>",
          "status": "done"
        },
        {
          "id": 8,
          "title": "Integrate Visual Effects for Enemy Actions",
          "description": "Design and implement visual effects for enemy attacks, movement, and death animations to enhance gameplay feedback.",
          "dependencies": [
            2,
            3,
            4,
            6
          ],
          "details": "Coordinate with attack patterns and behaviors to trigger appropriate VFX (e.g., Wraith mist, Golem shockwave, Bat swarm particles).\n<info added on 2025-05-26T16:53:15.714Z>\nVisual effects for enemy actions have been successfully implemented and integrated. Enhancements include:\n\nWraith:\n- PhaseStrike: Spiral particle phase-out/in effects, enemy sprite fading, dark energy bursts\n- SpiritBarrage: Curved projectile paths with pulsing glow, trail particles, enhanced impact effects with spirit explosion\n- Death: Ethereal dissolution with expanding rings, spirit essence escaping upward, ethereal whisper effects\n\nIron Golem:\n- Earthquake: Ground cracks during charge, dust particles, multi-wave shockwaves with ground upheaval, debris scattering, progressive screen shake\n- Death: Mechanical breakdown with sparks, metal fragments, steam eruption, collapse animation, ground impact crater\n\nCarrion Bats:\n- VenomStorm: Layered poison clouds with bubbling effects, swirling particles with varying speeds, secondary toxic vapors\n- SwarmBlitz: Wing flutter trails, swooping dive paths with wing beating effects, feather particles on impact, air distortion rings\n- Death: Falling from sky with feathers scattering, blood splatter, tumbling fall animation, ground impact dust, special leader death effects\n\nTechnical implementation includes seamless integration with behavior tree system and attack patterns, enhanced particle systems with proper cleanup and performance considerations, type-safe implementations with Phaser integration, comprehensive visual feedback (screen shake, camera flash, dynamic particle systems), and enemy-specific death animations matching archetype themes.\n</info added on 2025-05-26T16:53:15.714Z>",
          "status": "done"
        }
      ]
    },
    {
      "id": 6,
      "title": "Develop Village and Shop System",
      "description": "Implement the central village with functional shops including the Blacksmith and Apothecary.",
      "details": "1. Create a Village class to manage the central hub area\n2. Implement a Shop class as a base for different shop types\n3. Create Blacksmith and Apothecary classes extending the Shop class\n4. Implement inventory systems for shops with the specified items\n5. Create UI components for shop interfaces using React and Phaser\n6. Implement the gold system and transaction logic\n7. Add the 500g unlock requirement for the Blacksmith\n8. Create a ShopManager to handle player interactions with shops\n9. Implement the Tavern with HP regeneration functionality\n10. Use React Context API for managing shop state across components",
      "testStrategy": "1. Unit test Shop, Blacksmith, and Apothecary classes\n2. Verify shop inventories and pricing\n3. Test gold transactions and unlock requirements\n4. Create integration tests for the entire shopping process\n5. Verify HP regeneration in the Tavern",
      "priority": "medium",
      "dependencies": [
        2,
        3
      ],
      "status": "done",
      "subtasks": [
        {
          "id": 1,
          "title": "Design Core Class Architecture",
          "description": "Create the foundational class hierarchy for the Village and Shop system, including base classes and inheritance structure.",
          "dependencies": [],
          "details": "Design and implement the base Village class and Shop interface. Create specialized shop classes (Blacksmith, Apothecary, Tavern) that inherit from the Shop base class. Define relationships between classes using appropriate design patterns like Strategy or Decorator. Document class responsibilities, properties, and methods.",
          "status": "done"
        },
        {
          "id": 2,
          "title": "Implement Inventory Management System",
          "description": "Develop a robust inventory system for shops and player interaction.",
          "dependencies": [
            1
          ],
          "details": "Create inventory classes for tracking items in shops and player inventory. Implement methods for adding, removing, and updating items. Design data structures for storing item information (name, description, price, effects, etc.). Develop filtering and sorting capabilities for inventory display. Include quantity tracking and stock management for shop inventories.",
          "status": "done"
        },
        {
          "id": 3,
          "title": "Develop Gold and Transaction Logic",
          "description": "Create the economic system for buying and selling items between player and shops.",
          "dependencies": [
            1,
            2
          ],
          "details": "Implement currency management for player gold. Create transaction methods for purchasing and selling items. Add validation logic to ensure sufficient funds and inventory space. Develop price modifiers based on player reputation or game events. Include transaction history tracking for debugging and player reference.",
          "status": "done"
        },
        {
          "id": 4,
          "title": "Create Shop Unlock Mechanics",
          "description": "Implement progression-based shop unlock system with requirements and validation.",
          "dependencies": [
            1
          ],
          "details": "Design unlock requirements for each shop type (quests, level, items, etc.). Implement validation logic to check if unlock conditions are met. Create visual indicators for locked/unlocked shops. Develop notification system for newly unlocked shops. Include persistence of unlock states across game sessions.",
          "status": "done"
        },
        {
          "id": 5,
          "title": "Implement Tavern HP Regeneration System",
          "description": "Create specialized functionality for the Tavern to provide health regeneration services.",
          "dependencies": [
            1
          ],
          "details": "Design HP regeneration mechanics (instant vs. over time). Implement cost calculation based on amount healed. Create visual feedback for healing process. Add cooldown or usage limitations if needed. Integrate with player health system and ensure proper synchronization.",
          "status": "done"
        },
        {
          "id": 6,
          "title": "Develop React UI Components for Shops",
          "description": "Create React components for displaying and interacting with the shop system.",
          "dependencies": [
            1,
            2,
            3
          ],
          "details": "Design and implement shop interface components (shop menu, item list, item details). Create transaction UI elements (buy/sell buttons, confirmation dialogs). Develop inventory display components with filtering and sorting. Implement visual feedback for successful/failed transactions. Ensure responsive design for different screen sizes.",
          "status": "done"
        },
        {
          "id": 7,
          "title": "Integrate Phaser with Shop System",
          "description": "Connect the Phaser game engine with the shop system for seamless gameplay integration.",
          "dependencies": [
            1,
            6
          ],
          "details": "Create Phaser objects for village and shop representations in the game world. Implement player collision detection with shop entrances. Design transitions between game world and shop interfaces. Add visual indicators for shops in the game world. Ensure proper event handling between Phaser and React components.",
          "status": "done"
        },
        {
          "id": 8,
          "title": "Implement Shop State Management with React Context API",
          "description": "Create a state management solution using React Context API for shop data and interactions.",
          "dependencies": [
            6
          ],
          "details": "Design Context providers for shop state (inventory, prices, availability). Implement reducers for handling shop-related actions. Create custom hooks for accessing shop functionality. Ensure proper state updates and re-rendering optimization. Implement persistence of shop state across game sessions.",
          "status": "done"
        },
        {
          "id": 9,
          "title": "Design Player Interaction Flows",
          "description": "Create comprehensive user journeys for all shop-related player interactions.",
          "dependencies": [
            3,
            4,
            5,
            6,
            7
          ],
          "details": "Document all possible player interactions with shops. Create flowcharts for buying, selling, and special services. Implement proper error handling and user feedback. Design intuitive UI navigation between different shop sections. Add tooltips and help information for new players.",
          "status": "done"
        },
        {
          "id": 10,
          "title": "Implement Comprehensive Testing",
          "description": "Develop and execute thorough testing for all shop system components.",
          "dependencies": [
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9
          ],
          "details": "Create unit tests for individual classes and methods. Implement integration tests for shop interactions. Develop UI tests for React components. Create end-to-end tests for complete player journeys. Test edge cases like insufficient funds, inventory limits, and unlock conditions. Document test results and fix identified issues.",
          "status": "done"
        },
        {
          "id": 11,
          "title": "Design Village Environment and Layout",
          "description": "Create the visual and interactive village environment with proper layout and navigation.",
          "details": "Design the village map layout with shop locations, pathways, and interactive areas. Create visual assets for the village environment (buildings, decorations, signage). Implement collision detection for buildings and boundaries. Design entrance/exit points for each shop. Add ambient elements like NPCs, lighting, or environmental details. Ensure proper scaling and camera positioning for the village view.",
          "status": "done",
          "dependencies": [
            1
          ],
          "parentTaskId": 6
        },
        {
          "id": 12,
          "title": "Create Detailed Shop UI Components",
          "description": "Break down shop UI into granular, reusable React components with proper styling and accessibility.",
          "details": "Create individual components: ShopHeader, ItemGrid, ItemCard, PurchaseModal, InventoryPanel, TransactionHistory, SearchFilter, CategoryTabs, PriceDisplay, and QuantitySelector. Implement proper CSS modules or styled-components for consistent theming. Add accessibility features (ARIA labels, keyboard navigation). Create loading states and error boundaries. Implement responsive design patterns for different screen sizes. Add animation and transition effects for smooth user experience.",
          "status": "done",
          "dependencies": [
            6
          ],
          "parentTaskId": 6
        }
      ]
    },
    {
      "id": 7,
      "title": "Implement Quest System",
      "description": "Develop the quest system including side quests and chain quests.",
      "details": "1. Create a Quest class to represent individual quests\n2. Implement a QuestManager to handle quest tracking and completion\n3. Create a QuestGiver class for NPCs that provide quests\n4. Implement the 'Tavernkeeper's Dilemma' repeatable quest\n5. Develop the 'Blacksmith's Request' chain quest\n6. Create UI components for the quest log and quest dialogs\n7. Implement quest reward distribution\n8. Add quest-related events to the game state\n9. Use InkJS (inkjs@2.2.2) for implementing branching dialogue trees\n10. Integrate with the Redux store for quest state management",
      "testStrategy": "1. Unit test Quest and QuestManager classes\n2. Verify quest completion logic and reward distribution\n3. Test repeatable and chain quest mechanics\n4. Create integration tests for the full quest lifecycle\n5. Verify quest state persistence across game sessions",
      "priority": "medium",
      "dependencies": [
        2,
        5,
        6
      ],
      "status": "pending",
      "subtasks": [
        {
          "id": 1,
          "title": "Design and Implement Quest Class",
          "description": "Create a robust Quest class to encapsulate quest data, states, objectives, and completion logic.",
          "dependencies": [],
          "details": "Define quest properties (ID, title, description, objectives, state, rewards). Implement state tracking (active, completed, failed) and support for optional/required objectives.",
          "status": "pending"
        },
        {
          "id": 2,
          "title": "Develop QuestManager System",
          "description": "Build a QuestManager to handle quest registration, activation, progression, and completion.",
          "dependencies": [
            1
          ],
          "details": "Manage active and completed quests, trigger quest events, and interface with other systems for quest updates.",
          "status": "pending"
        },
        {
          "id": 3,
          "title": "Implement QuestGiver Component",
          "description": "Create QuestGiver entities that can assign quests to players and interact with the QuestManager.",
          "dependencies": [
            1,
            2
          ],
          "details": "Allow NPCs or objects to offer quests, check quest prerequisites, and trigger dialogue or UI prompts.",
          "status": "pending"
        },
        {
          "id": 4,
          "title": "Support Repeatable Quests",
          "description": "Extend the Quest and QuestManager systems to allow quests to be repeatable with configurable cooldowns or limits.",
          "dependencies": [
            1,
            2
          ],
          "details": "Track repeat counts, reset quest state after completion, and handle reward redistribution for repeatable quests.",
          "status": "pending"
        },
        {
          "id": 5,
          "title": "Implement Chain Quest Functionality",
          "description": "Enable support for quest chains, where completing one quest unlocks subsequent quests.",
          "dependencies": [
            1,
            2,
            3
          ],
          "details": "Define quest dependencies, update QuestManager to unlock new quests upon completion of prerequisites, and ensure narrative coherence.",
          "status": "pending"
        },
        {
          "id": 6,
          "title": "Develop Quest Log UI",
          "description": "Design and implement a user interface for displaying active, completed, and available quests.",
          "dependencies": [
            1,
            2,
            5
          ],
          "details": "Show quest details, objectives, progress, and rewards. Allow players to track and review quest history.",
          "status": "pending"
        },
        {
          "id": 7,
          "title": "Implement Reward Distribution System",
          "description": "Create a system to distribute rewards upon quest completion, supporting items, experience, currency, or custom rewards.",
          "dependencies": [
            1,
            2,
            5
          ],
          "details": "Integrate with inventory and player stats systems. Ensure rewards are granted only once per completion (or per repeat, if repeatable).",
          "status": "pending"
        },
        {
          "id": 8,
          "title": "Integrate Quest Events and Triggers",
          "description": "Implement event-driven quest progression, allowing quests to respond to in-game actions and triggers.",
          "dependencies": [
            1,
            2,
            3,
            5
          ],
          "details": "Support triggers such as entering areas, defeating enemies, collecting items, or dialogue choices. Ensure events update quest state appropriately.",
          "status": "pending"
        },
        {
          "id": 9,
          "title": "Integrate InkJS Dialogue with Quest System",
          "description": "Connect InkJS dialogue system to quest logic for dynamic quest assignment, updates, and branching narrative.",
          "dependencies": [
            3,
            5,
            8
          ],
          "details": "Allow dialogue to start, update, or complete quests. Pass quest state to InkJS for conditional dialogue branches.",
          "status": "pending"
        },
        {
          "id": 10,
          "title": "Integrate Quest State with Redux",
          "description": "Synchronize quest data and state with Redux for global state management and UI reactivity.",
          "dependencies": [
            2,
            6,
            7,
            8,
            9
          ],
          "details": "Ensure quest progress, log, and rewards are reflected in Redux store. Enable UI components to react to quest state changes.",
          "status": "pending"
        }
      ]
    },
    {
      "id": 8,
      "title": "Design and Implement Game Zones",
      "description": "Create the different game zones including the Forgotten Crypt, Scrapheap Canyon, and Bloodmire Swamp.",
      "details": "1. Create a Zone class to represent different game areas\n2. Implement zone-specific enemy spawning logic\n3. Design and create tile maps for each zone using Tiled Map Editor\n4. Implement zone transitions and loading\n5. Add zone-specific environmental hazards or effects\n6. Create a ZoneManager to handle zone state and transitions\n7. Implement resource gathering mechanics for zones (e.g., Iron Ore in Scrapheap Canyon)\n8. Add ambient sounds and music for each zone using Howler.js (howler@2.2.3)\n9. Implement a mini-map system for zone navigation",
      "testStrategy": "1. Verify correct enemy spawning in each zone\n2. Test zone transitions and loading times\n3. Verify resource gathering mechanics\n4. Test environmental hazards and effects\n5. Perform playtests to ensure each zone feels unique and engaging",
      "priority": "medium",
      "dependencies": [
        4,
        5
      ],
      "status": "pending",
      "subtasks": []
    },
    {
      "id": 9,
      "title": "Implement Equipment and Inventory System",
      "description": "Develop the equipment and inventory management system with drag-and-drop functionality.",
      "details": "1. Create an Item class to represent equipment and consumables\n2. Implement an Inventory class to manage player items\n3. Create UI components for the inventory screen\n4. Implement drag-and-drop functionality for item management\n5. Add equipment slots with click-to-equip/unequip functionality\n6. Implement item comparison tooltips\n7. Create a crafting system for gear conversion\n8. Add visual representations of equipped items on the player character\n9. Implement inventory sorting and filtering options\n10. Use React DnD (react-dnd@16.0.1) for drag-and-drop functionality",
      "testStrategy": "1. Unit test Item and Inventory classes\n2. Verify drag-and-drop functionality\n3. Test equipping and unequipping items\n4. Verify item comparison tooltips\n5. Test crafting system\n6. Perform usability tests on the inventory UI",
      "priority": "high",
      "dependencies": [
        3,
        6
      ],
      "status": "in-progress",
      "subtasks": [
        {
          "id": 1,
          "title": "Design and Implement Item Class",
          "description": "Define the structure and properties of items, including attributes like name, type, stats, stackability, and unique identifiers.",
          "dependencies": [],
          "details": "Ensure the Item class supports extensibility for future item types and behaviors.",
          "status": "done"
        },
        {
          "id": 2,
          "title": "Develop Inventory Class",
          "description": "Create a class to manage a collection of Item instances, supporting add, remove, stack, and query operations.",
          "dependencies": [
            1
          ],
          "details": "Implement logic for inventory limits, slot management, and error handling for invalid operations.",
          "status": "done"
        },
        {
          "id": 3,
          "title": "Create Inventory UI Components",
          "description": "Design and build React components to visually represent the inventory grid, slots, and items.",
          "dependencies": [
            2
          ],
          "details": "Ensure the UI updates in real time with inventory changes and supports responsive layouts.",
          "status": "done"
        },
        {
          "id": 4,
          "title": "Implement Drag-and-Drop Functionality",
          "description": "Enable users to drag items between inventory slots, equipment slots, and other UI elements using React DnD.",
          "dependencies": [
            3
          ],
          "details": "Handle drag events, drop validation, and visual feedback for valid/invalid drops.",
          "status": "done"
        },
        {
          "id": 5,
          "title": "Add Equipment Slot Logic",
          "description": "Develop logic and UI for equipping items to specific character slots (e.g., weapon, armor).",
          "dependencies": [
            4
          ],
          "details": "Ensure only compatible items can be equipped in each slot and update character stats accordingly.\n<info added on 2025-05-26T19:27:10.719Z>\nAnalyzed codebase structure and identified key components for implementation:\n- EquipmentSlots.tsx component needs equipment logic implementation\n- Bridge required between Redux state and new Equipment/InventoryManager models\n- Update GameState to use InventoryManager\n- Implement equipment actions in inventorySlice.ts\n- Ensure Redux state reflects equipment slot changes and updates character stats\n- Verify compatibility checks when equipping items in slots\n\nNext steps:\n1. Update GameState interface to incorporate InventoryManager\n2. Implement equipment logic in EquipmentSlots.tsx\n3. Create action creators and reducers for equipment-related actions in inventorySlice.ts\n4. Connect EquipmentSlots component to Redux state\n5. Implement stat updates when equipping/unequipping items\n6. Add compatibility checks for item-slot combinations\n</info added on 2025-05-26T19:27:10.719Z>\n<info added on 2025-05-26T19:31:11.682Z>\nImplementation of equipment slot logic completed successfully:\n\n- GameState updated with InventoryManager integration\n- Redux state management enhanced with new equipment-related actions\n- EquipmentSlots component implemented with drag-and-drop and click-to-unequip functionality\n- Inventory integration updated to work with new Equipment/InventoryManager models\n- Equipment compatibility validation implemented with proper error handling\n- Key features working: drag-and-drop equipping, unequipping, tooltips, visual feedback, stat bonuses, inventory full detection\n- All existing tests pass (337/337), build compiles without errors, and TypeScript compilation is clean\n\nNext steps:\n1. Conduct thorough testing of equipment system in various game scenarios\n2. Optimize performance for large inventories and frequent equipment changes\n3. Implement additional visual polish for equipment slots and item representations\n4. Create user documentation for the new equipment system\n5. Plan for potential future enhancements (e.g., set bonuses, enchantments)\n</info added on 2025-05-26T19:31:11.682Z>",
          "status": "done"
        },
        {
          "id": 6,
          "title": "Integrate Tooltips for Items",
          "description": "Display detailed information about items when hovered over in the inventory or equipment slots.",
          "dependencies": [
            3
          ],
          "details": "Include item stats, descriptions, and any special effects in the tooltip display.",
          "status": "pending"
        },
        {
          "id": 7,
          "title": "Develop Crafting System",
          "description": "Implement a system allowing players to combine items to create new ones, with UI for recipe selection and result preview.",
          "dependencies": [
            2,
            3
          ],
          "details": "Support recipe validation, ingredient consumption, and output item generation.",
          "status": "pending"
        },
        {
          "id": 8,
          "title": "Implement Visual Representation for Items",
          "description": "Assign and render icons or sprites for each item type within the inventory and equipment UI.",
          "dependencies": [
            3
          ],
          "details": "Ensure visual consistency and clarity for different item categories and rarities.",
          "status": "pending"
        },
        {
          "id": 9,
          "title": "Add Sorting and Filtering Features",
          "description": "Allow users to sort and filter inventory items by type, rarity, or other attributes through the UI.",
          "dependencies": [
            3
          ],
          "details": "Implement efficient sorting algorithms and intuitive filter controls.",
          "status": "pending"
        },
        {
          "id": 10,
          "title": "Integrate and Test React DnD Functionality",
          "description": "Ensure seamless integration of React DnD with inventory, equipment, and crafting UIs, and test for usability and performance.",
          "dependencies": [
            4,
            5,
            7
          ],
          "details": "Address edge cases such as invalid drops, rapid item movement, and accessibility concerns.",
          "status": "pending"
        }
      ]
    },
    {
      "id": 10,
      "title": "Implement Save/Load System",
      "description": "Develop a robust save and load system using LocalStorage.",
      "details": "1. Design a save data structure that includes all necessary game state\n2. Implement functions to serialize and deserialize game state\n3. Create a SaveManager class to handle saving and loading operations\n4. Implement auto-save functionality at key game events\n5. Create a UI for manual save/load operations\n6. Implement save slot management\n7. Add error handling and data validation for corrupt save files\n8. Implement save data compression using LZ-string (lz-string@1.5.0)\n9. Create a system for handling version changes in save data structure",
      "testStrategy": "1. Unit test serialization and deserialization functions\n2. Verify auto-save triggers\n3. Test manual save/load operations\n4. Verify data integrity after loading saves\n5. Test backward compatibility with older save versions\n6. Perform stress tests with large save files",
      "priority": "high",
      "dependencies": [
        2,
        3,
        7,
        9
      ],
      "status": "pending",
      "subtasks": []
    },
    {
      "id": 11,
      "title": "Implement UI and HUD",
      "description": "Design and implement the user interface and heads-up display for the game.",
      "details": "1. Design the overall UI layout and style\n2. Implement a HUD component showing player health, mana, and experience\n3. Create a main menu interface\n4. Implement in-game menus (inventory, character stats, options)\n5. Create dialog boxes for NPC interactions and quest information\n6. Implement tooltips for items and abilities\n7. Add visual feedback for player actions and combat\n8. Create a mini-map component\n9. Implement a quest tracker\n10. Use Styled Components (styled-components@6.0.0-rc.3) for React component styling\n11. Utilize the Rex UI Plugin for Phaser to create dynamic in-game menus",
      "testStrategy": "1. Perform usability tests on all UI components\n2. Verify responsiveness of the UI on different screen sizes\n3. Test accessibility features\n4. Verify correct display of game information in the HUD\n5. Test integration with game systems (inventory, quests, etc.)",
      "priority": "medium",
      "dependencies": [
        2,
        3,
        4,
        6,
        7,
        9
      ],
      "status": "pending",
      "subtasks": [
        {
          "id": 1,
          "title": "Design Core HUD Components",
          "description": "Create essential HUD elements that display critical gameplay information while maintaining readability and minimal screen clutter.",
          "dependencies": [],
          "details": "Design health/mana bars, score indicators, and inventory quick-access using high-contrast colors and familiar icons. Ensure elements are positioned around screen edges without obstructing gameplay. Implement customizable positioning and scaling options for player preferences. Test readability across different gameplay scenarios.",
          "status": "pending"
        },
        {
          "id": 2,
          "title": "Implement Responsive Menu Systems",
          "description": "Develop main menu, pause menu, and settings interfaces that work across different platforms and screen sizes.",
          "dependencies": [
            1
          ],
          "details": "Create consistent visual style across all menu screens. Design for both controller and touchscreen inputs. Implement responsive layouts that adapt to different aspect ratios and device capabilities. Include audio feedback for menu navigation. Ensure menus can be accessed without disrupting gameplay flow.",
          "status": "pending"
        },
        {
          "id": 3,
          "title": "Create Dialogue and Notification System",
          "description": "Build interfaces for character dialogues, quest information, and temporary notifications/alerts.",
          "dependencies": [
            1
          ],
          "details": "Design dialogue boxes with character portraits and text display options. Implement a notification system for achievements, quest updates, and game events that appears temporarily without disrupting gameplay. Create toast notifications for less critical information. Ensure all text is easily readable and properly scaled.",
          "status": "pending"
        },
        {
          "id": 4,
          "title": "Develop Tooltip and Contextual Help System",
          "description": "Create an information system that provides players with contextual help and item descriptions.",
          "dependencies": [
            2,
            3
          ],
          "details": "Design tooltips that appear when hovering over items, abilities, or UI elements. Implement a help system that provides contextual information based on the player's current situation. Ensure tooltips don't obstruct critical gameplay elements. Create a consistent visual style that matches the overall UI theme.",
          "status": "pending"
        },
        {
          "id": 5,
          "title": "Implement Mini-map and Navigation Features",
          "description": "Design and integrate a mini-map system that helps players navigate the game world.",
          "dependencies": [
            1
          ],
          "details": "Create a mini-map that displays the player's current location, objectives, and points of interest. Implement zoom functionality and customization options. Ensure the mini-map is positioned optimally and can be toggled or resized. Design clear icons for different map elements. Test the mini-map's effectiveness across different game environments.",
          "status": "pending"
        }
      ]
    },
    {
      "id": 12,
      "title": "Implement Audio System",
      "description": "Develop the audio system for background music, sound effects, and ambient sounds.",
      "details": "1. Set up Howler.js for audio management\n2. Implement a sound effect manager for combat and UI sounds\n3. Create an ambient sound system for different zones\n4. Implement background music management with smooth transitions\n5. Add volume controls for music and sound effects\n6. Implement audio muting functionality\n7. Create positional audio for enemy sounds\n8. Implement audio fading for zone transitions\n9. Add audio caching to improve performance",
      "testStrategy": "1. Verify correct playback of all sound effects\n2. Test ambient sound changes between zones\n3. Verify music transitions\n4. Test volume controls and muting\n5. Verify positional audio accuracy\n6. Perform performance tests with multiple audio sources",
      "priority": "low",
      "dependencies": [
        1,
        4,
        8
      ],
      "status": "pending",
      "subtasks": []
    },
    {
      "id": 13,
      "title": "Implement Particle Systems and Visual Effects",
      "description": "Design and implement particle systems and visual effects to enhance the game's atmosphere.",
      "details": "1. Set up a particle system manager using Phaser's particle system\n2. Create particle effects for spells and abilities\n3. Implement environmental particle effects for different zones\n4. Add impact effects for attacks and projectiles\n5. Create death animations for enemies\n6. Implement visual effects for status ailments (e.g., poison)\n7. Add particle effects for item pickups and level-ups\n8. Implement a weather system with particle effects\n9. Optimize particle systems for performance",
      "testStrategy": "1. Verify visual quality of all particle effects\n2. Test performance with multiple particle systems active\n3. Verify correct triggering of effects in combat\n4. Test weather system in different zones\n5. Perform visual inspections in various game scenarios",
      "priority": "low",
      "dependencies": [
        4,
        5,
        8
      ],
      "status": "pending",
      "subtasks": []
    },
    {
      "id": 14,
      "title": "Game Balancing and Tuning",
      "description": "Balance and tune game systems based on playtesting feedback.",
      "details": "1. Implement analytics tracking for player progression and item usage\n2. Create a configuration file for easily adjusting game parameters\n3. Develop tools for visualizing player statistics and progression\n4. Implement A/B testing functionality for different balance configurations\n5. Adjust XP curves based on playtesting data\n6. Balance enemy difficulty and spawn rates\n7. Tune item prices and crafting requirements\n8. Adjust combat formulas for better game feel\n9. Implement difficulty settings with scaling factors",
      "testStrategy": "1. Analyze player progression data from playtests\n2. Conduct surveys for player feedback on game balance\n3. Perform extensive playtesting with different configurations\n4. Verify progression speed matches design intentions\n5. Test game balance across different difficulty settings",
      "priority": "medium",
      "dependencies": [
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9
      ],
      "status": "pending",
      "subtasks": [
        {
          "id": 1,
          "title": "Implement Analytics System",
          "description": "Develop a comprehensive data collection and analysis framework to gather player statistics, performance metrics, and gameplay patterns",
          "dependencies": [],
          "details": "Create systems to track player progress, success rates, time spent on challenges, and resource usage. Implement heatmaps for spatial analysis and tools similar to Playtracer to visualize player journeys. Include survey mechanisms and potentially biometric data collection for deeper insights.",
          "status": "pending"
        },
        {
          "id": 2,
          "title": "Develop Balance Configuration Tools",
          "description": "Create tools that allow designers to adjust game parameters and visualize the impact of changes across game systems",
          "dependencies": [
            1
          ],
          "details": "Build a mathematical modeling system to express the power of game elements quantitatively. Implement visualization tools to show balance parameters across variations and identify trends. Ensure tools support quick iteration of values while maintaining awareness of cross-system dependencies.",
          "status": "pending"
        },
        {
          "id": 3,
          "title": "Establish Playtesting Methodology",
          "description": "Design a structured approach to playtesting that combines traditional observation with data-driven analysis",
          "dependencies": [
            1,
            2
          ],
          "details": "Create protocols for interviews, observation sessions, and feedback collection. Develop methods to analyze the gap between expert and novice play to understand the roles of strategy versus tactics. Implement an iterative testing cycle that incorporates both provisional and true balancing phases.",
          "status": "pending"
        },
        {
          "id": 4,
          "title": "Implement Difficulty Scaling System",
          "description": "Design and implement mechanisms for adjusting game difficulty based on player performance and progression",
          "dependencies": [
            2,
            3
          ],
          "details": "Create systems for both positive and negative feedback loops to control player progression. Develop algorithms to dynamically adjust challenge levels based on player skill. Ensure difficulty curves maintain player engagement while avoiding dominant strategies and unintended consequences across subsystems.",
          "status": "pending"
        }
      ]
    },
    {
      "id": 15,
      "title": "Optimization and Performance Tuning",
      "description": "Optimize the game for performance and implement efficiency improvements.",
      "details": "1. Implement asset loading optimization techniques\n2. Use texture atlases for sprites to reduce draw calls\n3. Implement object pooling for frequently created/destroyed objects\n4. Optimize WebGL render calls\n5. Implement level-of-detail systems for distant objects\n6. Use Web Workers for offloading heavy computations\n7. Implement efficient collision detection algorithms\n8. Optimize React component rendering using memoization\n9. Implement code splitting and lazy loading for better initial load times\n10. Use the React Profiler to identify and fix performance bottlenecks",
      "testStrategy": "1. Perform frame rate tests in various game scenarios\n2. Measure and compare load times before and after optimization\n3. Use browser developer tools to profile CPU and memory usage\n4. Test performance on various devices and browsers\n5. Verify that optimizations don't introduce new bugs",
      "priority": "medium",
      "dependencies": [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        11,
        12,
        13
      ],
      "status": "pending",
      "subtasks": [
        {
          "id": 1,
          "title": "Optimize Asset Loading",
          "description": "Implement techniques to improve asset loading efficiency, such as asset compression, lazy loading, and dynamic loading strategies to reduce initial load times and memory usage.",
          "dependencies": [],
          "details": "Apply asset compression, use lazy loading for non-critical assets, and consider dynamic loading based on game state or user interaction. Evaluate the use of spritesheets or atlases to minimize draw calls and optimize GPU memory usage.",
          "status": "pending"
        },
        {
          "id": 2,
          "title": "Enhance Rendering Performance",
          "description": "Analyze and optimize rendering methods, including experimenting with different rendering backends (WebGL vs Canvas), culling off-screen objects, and optimizing draw calls.",
          "dependencies": [
            1
          ],
          "details": "Profile rendering performance across devices, implement object culling, and test switching between WebGL and Canvas to determine the best performance for target devices. Optimize the use of large images and backgrounds to balance quality and memory usage.",
          "status": "pending"
        },
        {
          "id": 3,
          "title": "Improve Memory Management",
          "description": "Implement memory management strategies such as object pooling, removing unused textures, and monitoring GPU memory usage to prevent leaks and ensure smooth gameplay.",
          "dependencies": [
            2
          ],
          "details": "Set up object pools for frequently created/destroyed objects, ensure textures and assets are unloaded when no longer needed, and monitor memory usage to identify and resolve leaks.",
          "status": "pending"
        },
        {
          "id": 4,
          "title": "Optimize React Performance",
          "description": "Apply React-specific optimizations, including using PureComponent, memoization, virtualizing long lists, and minimizing unnecessary re-renders.",
          "dependencies": [
            3
          ],
          "details": "Convert suitable components to PureComponent or use React.memo, implement shouldComponentUpdate where appropriate, and use tools like the React Profiler to identify bottlenecks. Virtualize large lists and optimize component structure to reduce reconciliation overhead.",
          "status": "pending"
        },
        {
          "id": 5,
          "title": "Reduce Load Times",
          "description": "Implement strategies to minimize initial and subsequent load times, such as code splitting, service worker caching, and optimizing the production build.",
          "dependencies": [
            4
          ],
          "details": "Use code splitting to load only necessary code, leverage service workers for caching assets and application state, and ensure the production build is optimized for size and speed. Continuously measure load times and iterate on improvements.",
          "status": "pending"
        }
      ]
    },
    {
      "id": 16,
      "title": "Fix Critical Combat System Bugs",
      "description": "Address and resolve four critical bugs in the combat system: enemy health bar display, player attack hit detection, enemy damage dealing, and projectile collision detection.",
      "details": "1. Enemy Health Bar Bug:\n   - Investigate the connection between enemy movement and health bar display\n   - Check if health bar UI updates are tied to enemy position updates\n   - Ensure health bar position is correctly synced with enemy sprite\n   - Implement a separate update loop for health bar display\n\n2. Player Attack Hit Detection:\n   - Review the hit detection logic in the CombatManager class\n   - Check if attack hitboxes are properly aligned with character models\n   - Verify that attack timing is correctly synchronized with animations\n   - Implement debug visualization for attack hitboxes\n   - Test different types of attacks (melee, projectile, AOE) separately\n\n3. Enemy Damage to Player:\n   - Examine the enemy AI and attack logic\n   - Verify that enemy attack events are being triggered\n   - Check if player hitbox is correctly defined and detected\n   - Ensure damage calculation and application to player is functioning\n\n4. Projectile Collision Detection:\n   - Review the projectile system in the Arcade Physics engine\n   - Check if projectiles and enemies have correct collision groups assigned\n   - Verify that projectile and enemy hitboxes are accurately defined\n   - Implement additional collision checks if necessary\n   - Add visual debugging for projectile paths and collision areas\n\nGeneral Approach:\n- Use console.logging extensively to track function calls and variable states\n- Implement a debug mode to visualize hitboxes, attack ranges, and collision areas\n- Create isolated test scenes for each bug to simplify debugging\n- Review recent changes to the combat system that might have introduced these bugs\n- Optimize combat calculations to ensure they're not impacting performance",
      "testStrategy": "1. Enemy Health Bar Bug:\n   - Move enemies in different patterns and speeds, verifying health bar remains correctly positioned\n   - Damage enemies while moving and stationary, ensuring health bar updates correctly\n   - Test with multiple enemies on screen simultaneously\n\n2. Player Attack Hit Detection:\n   - Create a test environment with stationary targets\n   - Perform each type of attack (melee, projectile, AOE) multiple times, verifying hit registration\n   - Test attacks at different ranges and angles\n   - Verify damage application on successful hits\n\n3. Enemy Damage to Player:\n   - Allow enemies to attack player character while player remains stationary\n   - Verify damage is applied to player and health decreases appropriately\n   - Test with different enemy types and attack patterns\n\n4. Projectile Collision Detection:\n   - Set up a shooting gallery style test with various enemy sizes and movements\n   - Fire projectiles at different speeds and angles\n   - Verify that projectiles collide with enemies and apply damage\n   - Test edge cases like firing through groups of enemies\n\nGeneral Testing:\n- Conduct playthroughs of combat-heavy areas to ensure all systems work together\n- Perform stress tests with numerous enemies and projectiles to check for performance issues\n- Verify that fixing these bugs hasn't introduced new issues in other game systems\n- Conduct regression testing on previously working combat scenarios",
      "status": "pending",
      "dependencies": [
        4,
        2,
        3
      ],
      "priority": "high",
      "subtasks": []
    }
  ]
}