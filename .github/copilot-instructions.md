# Thrill Digger - AI Coding Agent Instructions

## Project Overview
React + TypeScript recreation of the Thrill Digger minigame from Zelda: Skyward Sword. Two modes:
- **Play Mode**: Random board generation with rupees/bombs (Minesweeper-style gameplay)
- **Solve Mode**: Manual board editing with real-time constraint satisfaction solver showing probability heatmaps

The app is deployed with a base path (`/thrill-digger/`) configured in [vite.config.ts](vite.config.ts).

**Note**: The `vanilla-version/` directory contains the original implementation kept for historical reference and performance comparison. Do not modify - all active development happens in the React codebase.

## Architecture

### State Management - Zustand Store
**Critical**: The app uses **Zustand** ([stores/gameStore.ts](src/stores/gameStore.ts)), NOT React Context, as the primary state manager. Do NOT create new Context providers for game state.

- `gameStore` exports the single source of truth with devtools middleware
- All game actions (`newGame`, `digCell`, `updateCell`, `solveBoardInternal`) are store methods
- Access state via `useGameStore(state => state.property)` (selector pattern for performance)
- The [GameContext](src/context/GameContext.tsx) exists but is largely unused - prefer the Zustand store

### Key Data Structures
```typescript
// BoardCell values encode game state
type BoardCell = number  // -3=bomb, -2=rupoor, -1=undug, 0+=rupee value
board: BoardCell[][]     // 2D array of cells
revealed: boolean[][]    // Matching 2D array tracking revealed state
solvedBoard: number[]    // 1D flat array of probabilities (0-100) from solver
```

**Important**: Probabilities are stored as a **flat 1D array** (`solvedBoard`), but board data is **2D arrays**. Convert indices using `row * width + col`.

### Core Algorithms

#### Solver ([utils/solver.ts](src/utils/solver.ts))
Credit: Josh Scotland's original constraint satisfaction solver.
- Exhaustively generates all valid bomb placements given revealed rupee constraints
- Rupee values map to expected adjacent bombs: Green (1) = 0, Blue (5) = 2, Red (20) = 4, etc.
- Computes probability for each unrevealed cell by counting valid configurations
- Rupoors (-2 or -10) are treated as non-constraints (do not affect adjacent bomb counts)
- **Performance**: Automatically warns/confirms if `unknownIndicesCount >= 22` (exponential complexity)

#### Play Board Generation ([utils/gameLogic.ts](src/utils/gameLogic.ts))
- `generatePlayBoard()` randomly places bombs/rupoors, then calculates rupee values based on adjacent hazards
- **Deterministic**: Board generated once at game start, not dynamically during play

### Component Patterns

#### Tile Sizing ([components/GameBoard.tsx](src/components/GameBoard.tsx))
Complex responsive logic (lines 18-90):
- Dynamically calculates tile size based on viewport, header/footer height, grid gaps, padding
- Handles portrait vs landscape, adjusts for hazard stats panel width
- Caches DOM elements to avoid repeated queries
- Debounces resize events (150ms)
- **Do not modify this logic lightly** - it's heavily tuned for all screen sizes

#### Modal Management
Modal state lives in `gameStore` (e.g., `showComputationWarning`, `requiresConfirmation`), not local component state. Modals coordinate through store actions.

## Development Workflow

### Commands
```bash
npm run dev      # Vite dev server (default port 5173)
npm run build    # TypeScript check + Vite build
npm run preview  # Preview production build
npm run lint     # ESLint
npm run deploy   # Alias for build
```

### SCSS Architecture
Partial-based structure imported via [styles/index.scss](src/styles/index.scss):
- [_variables.scss](src/styles/_variables.scss): Color palette (wood theme), probability gradient colors (11 stops from green to red)
- [_tiles.scss](src/styles/_tiles.scss): Hole component styles, hover states, probability overlays
- [_modals.scss](src/styles/_modals.scss): Shared modal styles (backdrop, container)
- Component-specific: `_game-over-modal.scss`, `_victory-modal.scss`, etc.

**Convention**: Probability colors (`$prob-colors` map) are interpolated in JS via computed styles - changes require both SCSS and potential JS updates.

## Conventions & Patterns

### Type Safety
- `BoardCell` type alias documents cell value semantics
- Difficulty and GameMode use `as const` + type extraction pattern (not enums)
- Strict null checks enabled

### Cell Updates
When editing board state:
1. Update `board` with new cell value
2. Recalculate `boardTotal` (sum of positive rupee values)
3. Set `lastChangedIndex` for animation triggers
4. Call `solveBoardInternal()` if in Solve Mode (automatic)

### Asset Loading
Images imported via [assets/images.ts](src/assets/images.ts) barrel file, then mapped in [utils/imageMap.ts](src/utils/imageMap.ts) to cell values. Add new images: update both files.

## Common Tasks

### Adding a New Difficulty Level
1. Update `Difficulty` enum in [utils/gameLogic.ts](src/utils/gameLogic.ts)
2. Add config to `DIFFICULTY_CONFIGS` (width, height, houseFee, bombCount, rupoorCount)
3. Update [constants/levels.ts](src/constants/levels.ts) `LEVELS` array and `SIZE_MAP`
4. Add responsive SCSS rules in [_responsive.scss](src/styles/_responsive.scss) if grid dimensions change significantly

### Modifying Solver Behavior
- Core logic in [utils/solver.ts](src/utils/solver.ts) `solveBoardProbabilities()`
- Performance gate in `gameStore.solveBoardInternal()` checks `unknownIndicesCount`
- Warning thresholds: 22 unknown cells (show warning), 30+ seconds (require confirmation)

#### Graduated Solver Process & User Interactions
For heavy computations (≥22 unknown cells), the solver uses a phased loading UI in [gameStore.ts](src/stores/gameStore.ts#L150-L268) to gradually escalate user feedback:

**Phase 1 (0-200ms)**: Silent initialization
- Solver begins immediately with no UI changes
- User continues interacting with the board normally
- No visual indication yet

**Phase 2 (200ms-2s)**: Loading spinner appears
- If solver is still computing after 200ms, a loading spinner displays
- Provides visual feedback that computation is in progress
- User understands the app is working
- State: `showLoadingSpinner = true`

**Phase 3 (2s+)**: Computation warning modal
- If solver exceeds 2 seconds, the warning modal replaces the spinner
- Displays estimated completion time (ETA), total combinations to evaluate, and progress count
- Offers two actions: **Continue** (proceed with computation) or **Cancel** (revert last change and discard solver)
- State: `showComputationWarning = true`, `computationWarning = { time: etaSeconds, combinations, processed }`

**User Actions**:
- **Continue**: Calls `confirmComputation()` → solver continues in Web Worker with progress updates
- **Cancel**: Calls `cancelComputation()` → terminates worker, reverts last board edit (Solve Mode only), clears computation state
- **Close/Timeout**: No automatic close—user must explicitly choose

The graduated approach avoids showing warnings for fast computations while preventing user uncertainty during long operations. The Web Worker ([workers/solver.worker.ts](src/workers/solver.worker.ts)) runs on a background thread and sends periodic progress messages to update the ETA and processed count in real-time.

#### Solver Performance Gotchas
Performance doesn't scale linearly with unknown cell count - constraint overlap matters significantly. Example: an 8×5 board with sparse high-value constraints (300 rupees at opposite corners, 5 rupees in middle) can trigger warnings even with only 3-4 visible constraints, because the solver exhaustively searches all valid bomb placements across the entire board. Boards with tightly clustered constraints or large empty zones are slower than evenly distributed ones.

## Solver Performance Notes

The constraint satisfaction solver uses exhaustive search, which can be computationally intensive. Performance scales with unknown cell count and constraint distribution, not linearly. Example on an 8×5 board:

**No computation warning** - Sparse constraints:
- Blue Rupee (5) at row 1, col 4
- Gold Rupee (300) at row 2, col 1
- Gold Rupee (300) at row 2, col 6

**Triggers computation warning** - Same board with additional Blue Rupee (5) at row 3, col 4:
- Blue Rupee (5) at row 1, col 4
- Gold Rupee (300) at row 2, col 1
- Gold Rupee (300) at row 2, col 6
- Blue Rupee (5) at row 3, col 4

The additional constraint creates exponentially more valid bomb placement configurations that the solver must evaluate, even though only one rupee was added.

**When implementing solver optimizations or board validation**: Test with sparse, high-value constraint layouts (see `Solve Mode` example above) as they represent worst-case performance scenarios. Utilize the existing fixture set in [test-data/solverFixtures.ts](src/test-data/solverFixtures.ts) and consider adding more edge cases. After optimizations run the test suite to compare performance metrics and ensure correctness. Only change the existing solutions in the fixture after warning the user, as they represent baseline probabilities.

### UI Theming
All colors centralized in [_variables.scss](src/styles/_variables.scss). The wood/earth tone palette is consistent across buttons ([_buttons.scss](src/styles/_buttons.scss)) and backgrounds.
