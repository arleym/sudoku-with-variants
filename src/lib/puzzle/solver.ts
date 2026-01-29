import type { GridSize } from '../../types/puzzle';
import { isValidPlacement } from './validator';

export interface SolverResult {
  solved: boolean;
  solution: number[] | null;
  solutionCount?: number;
}

function findEmpty(cells: (number | null)[]): number {
  return cells.findIndex(cell => cell === null);
}

export function solve(
  cells: (number | null)[],
  size: GridSize
): SolverResult {
  const grid = [...cells];

  if (solveBacktrack(grid, size)) {
    return {
      solved: true,
      solution: grid as number[],
    };
  }

  return {
    solved: false,
    solution: null,
  };
}

function solveBacktrack(cells: (number | null)[], size: GridSize): boolean {
  const emptyIndex = findEmpty(cells);

  if (emptyIndex === -1) {
    return true; // Puzzle solved
  }

  // Try values 1 to size
  for (let value = 1; value <= size; value++) {
    if (isValidPlacement(cells, emptyIndex, value, size)) {
      cells[emptyIndex] = value;

      if (solveBacktrack(cells, size)) {
        return true;
      }

      cells[emptyIndex] = null;
    }
  }

  return false;
}

export function countSolutions(
  cells: (number | null)[],
  size: GridSize,
  maxCount: number = 2
): number {
  const grid = [...cells];
  let count = 0;

  function backtrack(): boolean {
    const emptyIndex = findEmpty(grid);

    if (emptyIndex === -1) {
      count++;
      return count >= maxCount;
    }

    for (let value = 1; value <= size; value++) {
      if (isValidPlacement(grid, emptyIndex, value, size)) {
        grid[emptyIndex] = value;

        if (backtrack()) {
          grid[emptyIndex] = null;
          return true;
        }

        grid[emptyIndex] = null;
      }
    }

    return false;
  }

  backtrack();
  return count;
}

export function hasUniqueSolution(
  cells: (number | null)[],
  size: GridSize
): boolean {
  return countSolutions(cells, size, 2) === 1;
}

export function solveWithRandomization(
  cells: (number | null)[],
  size: GridSize
): SolverResult {
  const grid = [...cells];

  if (solveBacktrackRandomized(grid, size)) {
    return {
      solved: true,
      solution: grid as number[],
    };
  }

  return {
    solved: false,
    solution: null,
  };
}

function solveBacktrackRandomized(
  cells: (number | null)[],
  size: GridSize
): boolean {
  const emptyIndex = findEmpty(cells);

  if (emptyIndex === -1) {
    return true;
  }

  // Shuffle values for randomization
  const values = shuffle(Array.from({ length: size }, (_, i) => i + 1));

  for (const value of values) {
    if (isValidPlacement(cells, emptyIndex, value, size)) {
      cells[emptyIndex] = value;

      if (solveBacktrackRandomized(cells, size)) {
        return true;
      }

      cells[emptyIndex] = null;
    }
  }

  return false;
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
