import type { GridSize } from '../types/puzzle';
import { getCellPosition, getGridConfig } from '../constants/grid-configs';

export function getCandidates(
  cells: (number | null)[],
  index: number,
  size: GridSize
): Set<number> {
  if (cells[index] !== null) {
    return new Set();
  }

  const candidates = new Set<number>();
  for (let v = 1; v <= size; v++) {
    candidates.add(v);
  }

  const { row, col } = getCellPosition(index, size);
  const { boxConfig } = getGridConfig(size);

  // Remove values in same row
  for (let c = 0; c < size; c++) {
    const value = cells[row * size + c];
    if (value !== null) {
      candidates.delete(value);
    }
  }

  // Remove values in same column
  for (let r = 0; r < size; r++) {
    const value = cells[r * size + col];
    if (value !== null) {
      candidates.delete(value);
    }
  }

  // Remove values in same box
  const boxStartRow = Math.floor(row / boxConfig.rows) * boxConfig.rows;
  const boxStartCol = Math.floor(col / boxConfig.cols) * boxConfig.cols;

  for (let r = boxStartRow; r < boxStartRow + boxConfig.rows; r++) {
    for (let c = boxStartCol; c < boxStartCol + boxConfig.cols; c++) {
      const value = cells[r * size + c];
      if (value !== null) {
        candidates.delete(value);
      }
    }
  }

  return candidates;
}

export function getAllCandidates(
  cells: (number | null)[],
  size: GridSize
): Set<number>[] {
  return cells.map((_, index) => getCandidates(cells, index, size));
}

export function mergeCellValues(
  puzzle: (number | null)[],
  userValues: (number | null)[]
): (number | null)[] {
  return puzzle.map((cell, index) => cell ?? userValues[index]);
}

export function getCompletedNumbers(
  cells: (number | null)[],
  size: GridSize
): Set<number> {
  const counts = new Map<number, number>();

  for (const value of cells) {
    if (value !== null) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  const completed = new Set<number>();
  for (let v = 1; v <= size; v++) {
    if (counts.get(v) === size) {
      completed.add(v);
    }
  }

  return completed;
}
