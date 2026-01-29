import type { GridSize, Difficulty, Puzzle } from '../../types/puzzle';
import { solveWithRandomization, hasUniqueSolution } from './solver';
import { getTargetClueCount, assessDifficulty } from './difficulty';

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
  // Step 1: Generate a complete valid grid
  const emptyGrid: (number | null)[] = new Array(size * size).fill(null);
  const result = solveWithRandomization(emptyGrid, size);

  if (!result.solved || !result.solution) {
    throw new Error('Failed to generate complete grid');
  }

  const solution = result.solution;

  // Step 2: Remove cells while maintaining unique solution
  const targetClues = getTargetClueCount(size, difficulty);
  const puzzle = removeCells(solution, size, targetClues);

  // Step 3: Verify and adjust difficulty if needed
  const analysis = assessDifficulty(puzzle, size);

  return {
    id: generateId(),
    size,
    difficulty: analysis.difficulty, // Use assessed difficulty
    cells: puzzle,
    solution,
  };
}

function removeCells(
  solution: number[],
  size: GridSize,
  targetClues: number
): (number | null)[] {
  const puzzle: (number | null)[] = [...solution];
  const totalCells = size * size;
  const cellsToRemove = totalCells - targetClues;

  // Create list of indices to try removing
  const indices = shuffle(Array.from({ length: totalCells }, (_, i) => i));

  let removed = 0;
  for (const index of indices) {
    if (removed >= cellsToRemove) break;

    const value = puzzle[index];
    puzzle[index] = null;

    // Check if puzzle still has unique solution
    if (hasUniqueSolution(puzzle, size)) {
      removed++;
    } else {
      // Restore value if removing creates multiple solutions
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
