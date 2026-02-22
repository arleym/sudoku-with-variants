import type { Difficulty } from '../../types/puzzle';
import type { Puzzle3D } from '../../types/puzzle3d';
import { getCandidates3D } from './candidates3d';
import { isValidSolution3D } from './validator3d';
import { solveWithRandomization } from '../puzzle/solver';

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

// ─── 4×4×4 (backtracking with unique-solution check) ───────────────────────

function solve3D(grid: (number | null)[], cellIndex: number, size: number, randomize: boolean): boolean {
  const total = size * size * size;
  if (cellIndex === total) return isValidSolution3D(grid, size);
  if (grid[cellIndex] !== null) return solve3D(grid, cellIndex + 1, size, randomize);

  const candidates = Array.from(getCandidates3D(grid, cellIndex, size));
  const ordered = randomize ? shuffle(candidates) : candidates;

  for (const val of ordered) {
    grid[cellIndex] = val;
    if (solve3D(grid, cellIndex + 1, size, randomize)) return true;
    grid[cellIndex] = null;
  }

  return false;
}

function countSolutions3D(grid: (number | null)[], cellIndex: number, size: number, limit: number): number {
  const total = size * size * size;
  if (cellIndex === total) return 1;
  if (grid[cellIndex] !== null) return countSolutions3D(grid, cellIndex + 1, size, limit);

  let count = 0;
  for (const val of getCandidates3D(grid, cellIndex, size)) {
    grid[cellIndex] = val;
    count += countSolutions3D(grid, cellIndex + 1, size, limit);
    grid[cellIndex] = null;
    if (count >= limit) return count;
  }
  return count;
}

function hasUniqueSolution3D(puzzle: (number | null)[], size: number): boolean {
  return countSolutions3D([...puzzle], 0, size, 2) === 1;
}

const CLUE_TARGETS_4: Record<Difficulty, { min: number; max: number }> = {
  easy:   { min: 38, max: 44 },
  medium: { min: 30, max: 37 },
  hard:   { min: 24, max: 29 },
  expert: { min: 18, max: 23 },
};

function generate4x4x4(difficulty: Difficulty): Puzzle3D {
  const grid: (number | null)[] = new Array(64).fill(null);
  if (!solve3D(grid, 0, 4, true)) throw new Error('Failed to generate 4×4×4 solution');
  const solution = grid as number[];

  const { min, max } = CLUE_TARGETS_4[difficulty];
  const targetClues = min + Math.floor(Math.random() * (max - min + 1));
  const cellsToRemove = 64 - targetClues;

  const puzzle: (number | null)[] = [...solution];
  let removed = 0;
  for (const index of shuffle(Array.from({ length: 64 }, (_, i) => i))) {
    if (removed >= cellsToRemove) break;
    const saved = puzzle[index];
    puzzle[index] = null;
    if (hasUniqueSolution3D(puzzle, 4)) {
      removed++;
    } else {
      puzzle[index] = saved;
    }
  }

  return { id: generateId(), size: 4, depth: 4, difficulty, cells: puzzle, solution };
}

// ─── 9×9×9 (cyclic-shift construction, no uniqueness check) ─────────────────
//
// Strategy: generate one valid 9×9 layer, then produce layer d by shifting
// all values by d (mod 9). This guarantees:
//   • Each layer is a valid 9×9 Sudoku (shifting values preserves row/col/box)
//   • Each pillar contains 1–9 exactly once (values cycle through all 9)

const CLUE_TARGETS_9: Record<Difficulty, number> = {
  easy:   450,
  medium: 360,
  hard:   270,
  expert: 200,
};

function generate9x9x9Solution(): number[] {
  const base2D: (number | null)[] = new Array(81).fill(null);
  const result = solveWithRandomization(base2D, 9);
  if (!result.solved || !result.solution) throw new Error('Failed to generate 9×9 base layer');
  const base = result.solution;

  const solution = new Array<number>(729);
  for (let d = 0; d < 9; d++) {
    for (let i = 0; i < 81; i++) {
      solution[d * 81 + i] = ((base[i] - 1 + d) % 9) + 1;
    }
  }
  return solution;
}

function generate9x9x9(difficulty: Difficulty): Puzzle3D {
  const solution = generate9x9x9Solution();
  const targetClues = CLUE_TARGETS_9[difficulty];
  const cellsToRemove = 729 - targetClues;

  const puzzle: (number | null)[] = [...solution];
  const indices = shuffle(Array.from({ length: 729 }, (_, i) => i));
  for (let i = 0; i < cellsToRemove; i++) puzzle[indices[i]] = null;

  return { id: generateId(), size: 9, depth: 9, difficulty, cells: puzzle, solution };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function generatePuzzle3D(size: 4 | 9, difficulty: Difficulty): Puzzle3D {
  if (size === 9) return generate9x9x9(difficulty);
  return generate4x4x4(difficulty);
}
