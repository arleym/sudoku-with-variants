import type { Difficulty } from '../../types/puzzle';
import type { Puzzle3D } from '../../types/puzzle3d';
import { getCandidates3D } from './candidates3d';
import { isValidSolution3D } from './validator3d';

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

/** Backtracking solver for 3D grid. Returns true if solved. */
function solve3D(grid: (number | null)[], cellIndex: number, randomize: boolean): boolean {
  if (cellIndex === 64) {
    return isValidSolution3D(grid);
  }

  if (grid[cellIndex] !== null) {
    return solve3D(grid, cellIndex + 1, randomize);
  }

  const candidates = Array.from(getCandidates3D(grid, cellIndex));
  const ordered = randomize ? shuffle(candidates) : candidates;

  for (const val of ordered) {
    grid[cellIndex] = val;
    if (solve3D(grid, cellIndex + 1, randomize)) return true;
    grid[cellIndex] = null;
  }

  return false;
}

/** Count solutions up to `limit` (for uniqueness check) */
function countSolutions3D(grid: (number | null)[], cellIndex: number, limit: number): number {
  if (cellIndex === 64) return 1;

  if (grid[cellIndex] !== null) {
    return countSolutions3D(grid, cellIndex + 1, limit);
  }

  const candidates = getCandidates3D(grid, cellIndex);
  let count = 0;

  for (const val of candidates) {
    grid[cellIndex] = val;
    count += countSolutions3D(grid, cellIndex + 1, limit);
    grid[cellIndex] = null;
    if (count >= limit) return count;
  }

  return count;
}

function hasUniqueSolution3D(puzzle: (number | null)[]): boolean {
  const grid = [...puzzle];
  return countSolutions3D(grid, 0, 2) === 1;
}

/** Generate a complete valid 3D solution */
function generateSolution3D(): number[] {
  const grid: (number | null)[] = new Array(64).fill(null);
  const success = solve3D(grid, 0, true);
  if (!success) throw new Error('Failed to generate 3D solution');
  return grid as number[];
}

const CLUE_TARGETS: Record<Difficulty, { min: number; max: number }> = {
  easy: { min: 38, max: 44 },
  medium: { min: 30, max: 37 },
  hard: { min: 24, max: 29 },
  expert: { min: 18, max: 23 },
};

/** Remove cells from solution while maintaining a unique solution */
function removeCells3D(solution: number[], difficulty: Difficulty): (number | null)[] {
  const puzzle: (number | null)[] = [...solution];
  const { min } = CLUE_TARGETS[difficulty];
  const targetClues = min + Math.floor(Math.random() * (CLUE_TARGETS[difficulty].max - min + 1));
  const cellsToRemove = 64 - targetClues;

  const indices = shuffle(Array.from({ length: 64 }, (_, i) => i));
  let removed = 0;

  for (const index of indices) {
    if (removed >= cellsToRemove) break;

    const saved = puzzle[index];
    puzzle[index] = null;

    if (hasUniqueSolution3D(puzzle)) {
      removed++;
    } else {
      puzzle[index] = saved;
    }
  }

  return puzzle;
}

export function generatePuzzle3D(difficulty: Difficulty): Puzzle3D {
  const solution = generateSolution3D();
  const cells = removeCells3D(solution, difficulty);

  return {
    id: generateId(),
    size: 4,
    depth: 4,
    difficulty,
    cells,
    solution,
  };
}
