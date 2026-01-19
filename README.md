# Thrill Digger

A React + TypeScript web app recreation of the Thrill Digger minigame from The Legend of Zelda: Skyward Sword, featuring both a playable game mode and an interactive solver.

## Credits

This project is built on the foundation of the original [Thrill Digger Assistant](https://www.joshscotland.com/thrill-digger-assistant/) by **Josh Scotland**. Major credit goes to Josh for the constraint satisfaction solver algorithm that powers the probability calculations in Solve Mode.

Original game © Nintendo. The Legend of Zelda: Skyward Sword © Nintendo.

## Features

### Play Mode
- Dig up rupees on a randomly generated board
- Avoid bombs and rupoors that end the game
- Collect as much money as possible before hitting a hazard
- The revealed rupee value tells you how many bombs/rupoors are in adjacent squares
- Game over modal displays your total earnings

### Solve Mode
- Edit the board manually to set up specific scenarios
- Real-time constraint satisfaction solver calculates bomb probabilities
- Color-coded board: green (safe) to red (dangerous) based on probability
- Highlights the lowest-probability square to guide decision-making
- Visual display of probability percentages for each cell
- Track remaining bombs and rupoors on the board

### Game Modes
- **Beginner**: 5×4 board, 4 bombs, no rupoors, -30 house fee
- **Intermediate**: 6×5 board, 4 bombs, 4 rupoors, -50 house fee
- **Expert**: 8×5 board, 8 bombs, 8 rupoors, -70 house fee

## How to Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS with custom theming
- **Game Logic**: Constraint satisfaction solver for probability calculation
- **State Management**: React Context API with custom hooks

## Project Structure

- `src/components/` - React components (GameBoard, Hole, modals, etc.)
- `src/hooks/` - Custom React hooks (useGameBoard for state management)
- `src/utils/` - Game logic, solver algorithm, and utilities
- `src/context/` - React Context for game state
- `src/assets/` - Game images (rupees, bombs)
- `src/constants/` - Game configuration and difficulty levels

## Game Rules

The game is similar to Minesweeper. When you dig up a rupee:
- **Green Rupee** (+1): 0 nearby hazards
- **Blue Rupee** (+5): 1-2 nearby hazards
- **Red Rupee** (+20): 3-4 nearby hazards
- **Silver Rupee** (+100): 5-6 nearby hazards
- **Gold Rupee** (+300): 7-8 nearby hazards

Hitting a bomb or rupoor ends the game immediately. Your final score is the total rupees collected minus the house fee.

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
