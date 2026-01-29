import type { GridSize, Difficulty } from '../../types/puzzle';
import { getGridConfig } from '../../constants/grid-configs';
import { getCandidates } from '../candidates';

export interface DifficultyAnalysis {
  difficulty: Difficulty;
  score: number;
  clueCount: number;
  nakedSingles: number;
  hiddenSingles: number;
  requiresAdvanced: boolean;
}

export function assessDifficulty(
  cells: (number | null)[],
  size: GridSize
): DifficultyAnalysis {
  const clueCount = cells.filter(c => c !== null).length;

  // Analyze solving techniques required
  let nakedSingles = 0;
  let hiddenSingles = 0;
  let requiresAdvanced = false;

  // Simulate solving and count technique usage
  const simulation = simulateSolve(cells, size);
  nakedSingles = simulation.nakedSingles;
  hiddenSingles = simulation.hiddenSingles;
  requiresAdvanced = simulation.requiresAdvanced;

  // Calculate difficulty score
  let score = 0;

  // Base score from clue count (fewer clues = harder)
  const totalCells = size * size;
  const emptyRatio = (totalCells - clueCount) / totalCells;
  score += emptyRatio * 40;

  // Add score for technique complexity
  score += hiddenSingles * 2;
  if (requiresAdvanced) score += 30;

  // Determine difficulty level
  let difficulty: Difficulty;
  if (score < 25) {
    difficulty = 'easy';
  } else if (score < 40) {
    difficulty = 'medium';
  } else if (score < 55) {
    difficulty = 'hard';
  } else {
    difficulty = 'expert';
  }

  return {
    difficulty,
    score,
    clueCount,
    nakedSingles,
    hiddenSingles,
    requiresAdvanced,
  };
}

interface SolveSimulation {
  nakedSingles: number;
  hiddenSingles: number;
  requiresAdvanced: boolean;
}

function simulateSolve(
  cells: (number | null)[],
  size: GridSize
): SolveSimulation {
  const grid = [...cells];
  let nakedSingles = 0;
  let hiddenSingles = 0;
  let requiresAdvanced = false;
  let progress = true;

  while (progress) {
    progress = false;

    // Try naked singles (cells with only one candidate)
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] !== null) continue;

      const candidates = getCandidates(grid, i, size);
      if (candidates.size === 1) {
        const value = [...candidates][0];
        grid[i] = value;
        nakedSingles++;
        progress = true;
      }
    }

    // If no naked singles found, try hidden singles
    if (!progress) {
      const hiddenResult = findHiddenSingle(grid, size);
      if (hiddenResult) {
        grid[hiddenResult.index] = hiddenResult.value;
        hiddenSingles++;
        progress = true;
      }
    }
  }

  // Check if puzzle is solved
  const unsolved = grid.filter(c => c === null).length;
  if (unsolved > 0) {
    requiresAdvanced = true;
  }

  return { nakedSingles, hiddenSingles, requiresAdvanced };
}

function findHiddenSingle(
  cells: (number | null)[],
  size: GridSize
): { index: number; value: number } | null {
  const { boxConfig } = getGridConfig(size);

  // Check each row
  for (let row = 0; row < size; row++) {
    for (let value = 1; value <= size; value++) {
      const possibleCols: number[] = [];
      for (let col = 0; col < size; col++) {
        const index = row * size + col;
        if (cells[index] === value) {
          break; // Value already placed in row
        }
        if (cells[index] === null) {
          const candidates = getCandidates(cells, index, size);
          if (candidates.has(value)) {
            possibleCols.push(col);
          }
        }
      }
      if (possibleCols.length === 1) {
        return { index: row * size + possibleCols[0], value };
      }
    }
  }

  // Check each column
  for (let col = 0; col < size; col++) {
    for (let value = 1; value <= size; value++) {
      const possibleRows: number[] = [];
      for (let row = 0; row < size; row++) {
        const index = row * size + col;
        if (cells[index] === value) {
          break;
        }
        if (cells[index] === null) {
          const candidates = getCandidates(cells, index, size);
          if (candidates.has(value)) {
            possibleRows.push(row);
          }
        }
      }
      if (possibleRows.length === 1) {
        return { index: possibleRows[0] * size + col, value };
      }
    }
  }

  // Check each box
  const boxesPerRow = size / boxConfig.cols;
  for (let box = 0; box < size; box++) {
    const boxRow = Math.floor(box / boxesPerRow) * boxConfig.rows;
    const boxCol = (box % boxesPerRow) * boxConfig.cols;

    for (let value = 1; value <= size; value++) {
      const possibleIndices: number[] = [];
      let alreadyPlaced = false;

      for (let r = boxRow; r < boxRow + boxConfig.rows && !alreadyPlaced; r++) {
        for (let c = boxCol; c < boxCol + boxConfig.cols && !alreadyPlaced; c++) {
          const index = r * size + c;
          if (cells[index] === value) {
            alreadyPlaced = true;
          } else if (cells[index] === null) {
            const candidates = getCandidates(cells, index, size);
            if (candidates.has(value)) {
              possibleIndices.push(index);
            }
          }
        }
      }

      if (!alreadyPlaced && possibleIndices.length === 1) {
        return { index: possibleIndices[0], value };
      }
    }
  }

  return null;
}

export function getTargetClueCount(
  size: GridSize,
  difficulty: Difficulty
): number {
  const config = getGridConfig(size);
  const { min, max } = config.clueTargets[difficulty];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
