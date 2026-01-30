import type { GridSize, Difficulty, Puzzle } from '../../types/puzzle';
import { solveWithRandomization, hasUniqueSolution } from './solver';
import { getTargetClueCount, assessDifficulty } from './difficulty';
import { getGridConfig } from '../../constants/grid-configs';

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generatePuzzle(
  size: GridSize,
  difficulty: Difficulty
): Puzzle {
  // For large grids (16x16, 25x25), use fast pattern-based generation
  if (size >= 16) {
    return generateLargeGridPuzzle(size, difficulty);
  }

  // For smaller grids, use backtracking with unique solution check
  const emptyGrid: (number | null)[] = new Array(size * size).fill(null);
  const result = solveWithRandomization(emptyGrid, size);

  if (!result.solved || !result.solution) {
    throw new Error('Failed to generate complete grid');
  }

  const solution = result.solution;
  const targetClues = getTargetClueCount(size, difficulty);
  const puzzle = removeCellsWithCheck(solution, size, targetClues);
  const analysis = assessDifficulty(puzzle, size);

  return {
    id: generateId(),
    size,
    difficulty: analysis.difficulty,
    cells: puzzle,
    solution,
  };
}

// Fast generation for large grids using pattern shuffling
function generateLargeGridPuzzle(
  size: GridSize,
  difficulty: Difficulty
): Puzzle {
  const config = getGridConfig(size);
  const boxRows = config.boxConfig.rows;
  const boxCols = config.boxConfig.cols;

  // Step 1: Create a valid base grid using a simple pattern
  const solution = createPatternGrid(size, boxRows, boxCols);

  // Step 2: Shuffle to randomize
  shuffleGrid(solution, size, boxRows, boxCols);

  // Step 3: Remove cells (no unique solution check for speed)
  const targetClues = getTargetClueCount(size, difficulty);
  const puzzle = removeCellsSimple(solution, targetClues);

  return {
    id: generateId(),
    size,
    difficulty,
    cells: puzzle,
    solution,
  };
}

// Creates a valid Sudoku grid using a mathematical pattern
function createPatternGrid(size: number, boxRows: number, boxCols: number): number[] {
  const grid: number[] = new Array(size * size);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      // This formula creates a valid Sudoku pattern
      const value = (boxCols * (row % boxRows) + Math.floor(row / boxRows) + col) % size + 1;
      grid[row * size + col] = value;
    }
  }

  return grid;
}

// Shuffle the grid while maintaining validity
function shuffleGrid(grid: number[], size: number, boxRows: number, boxCols: number): void {
  // Shuffle rows within each band
  for (let band = 0; band < boxCols; band++) {
    const startRow = band * boxRows;
    const rowIndices = Array.from({ length: boxRows }, (_, i) => startRow + i);
    const shuffledRows = shuffle(rowIndices);
    swapRows(grid, size, rowIndices, shuffledRows);
  }

  // Shuffle columns within each stack
  for (let stack = 0; stack < boxRows; stack++) {
    const startCol = stack * boxCols;
    const colIndices = Array.from({ length: boxCols }, (_, i) => startCol + i);
    const shuffledCols = shuffle(colIndices);
    swapCols(grid, size, colIndices, shuffledCols);
  }

  // Shuffle the numbers themselves
  const numberMap = shuffle(Array.from({ length: size }, (_, i) => i + 1));
  for (let i = 0; i < grid.length; i++) {
    grid[i] = numberMap[grid[i] - 1];
  }
}

function swapRows(grid: number[], size: number, from: number[], to: number[]): void {
  const temp: number[][] = from.map(row => {
    const rowData: number[] = [];
    for (let col = 0; col < size; col++) {
      rowData.push(grid[row * size + col]);
    }
    return rowData;
  });

  for (let i = 0; i < from.length; i++) {
    for (let col = 0; col < size; col++) {
      grid[to[i] * size + col] = temp[i][col];
    }
  }
}

function swapCols(grid: number[], size: number, from: number[], to: number[]): void {
  const temp: number[][] = from.map(col => {
    const colData: number[] = [];
    for (let row = 0; row < size; row++) {
      colData.push(grid[row * size + col]);
    }
    return colData;
  });

  for (let i = 0; i < from.length; i++) {
    for (let row = 0; row < size; row++) {
      grid[row * size + to[i]] = temp[i][row];
    }
  }
}

// Simple cell removal without unique solution check (fast)
function removeCellsSimple(
  solution: number[],
  targetClues: number
): (number | null)[] {
  const puzzle: (number | null)[] = [...solution];
  const totalCells = solution.length;
  const cellsToRemove = totalCells - targetClues;

  const indices = shuffle(Array.from({ length: totalCells }, (_, i) => i));

  for (let i = 0; i < cellsToRemove && i < indices.length; i++) {
    puzzle[indices[i]] = null;
  }

  return puzzle;
}

// Cell removal with unique solution check (for smaller grids)
function removeCellsWithCheck(
  solution: number[],
  size: GridSize,
  targetClues: number
): (number | null)[] {
  const puzzle: (number | null)[] = [...solution];
  const totalCells = size * size;
  const cellsToRemove = totalCells - targetClues;

  const indices = shuffle(Array.from({ length: totalCells }, (_, i) => i));

  let removed = 0;
  for (const index of indices) {
    if (removed >= cellsToRemove) break;

    const value = puzzle[index];
    puzzle[index] = null;

    if (hasUniqueSolution(puzzle, size)) {
      removed++;
    } else {
      puzzle[index] = value;
    }
  }

  return puzzle;
}

export function generatePuzzleAsync(
  size: GridSize,
  difficulty: Difficulty
): Promise<Puzzle> {
  return new Promise((resolve, reject) => {
    // Use setTimeout to avoid blocking UI
    setTimeout(() => {
      try {
        const puzzle = generatePuzzle(size, difficulty);
        resolve(puzzle);
      } catch (error) {
        reject(error);
      }
    }, 0);
  });
}

// Generate a simple puzzle for testing
export function generateSimplePuzzle(size: GridSize): Puzzle {
  const emptyGrid: (number | null)[] = new Array(size * size).fill(null);
  const result = solveWithRandomization(emptyGrid, size);

  if (!result.solved || !result.solution) {
    throw new Error('Failed to generate puzzle');
  }

  const solution = result.solution;
  const puzzle: (number | null)[] = [...solution];

  // Remove ~40% of cells for a simple puzzle
  const cellsToRemove = Math.floor(size * size * 0.4);
  const indices = shuffle(Array.from({ length: size * size }, (_, i) => i));

  for (let i = 0; i < cellsToRemove; i++) {
    puzzle[indices[i]] = null;
  }

  return {
    id: generateId(),
    size,
    difficulty: 'easy',
    cells: puzzle,
    solution,
  };
}
