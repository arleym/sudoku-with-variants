import type { GridSize } from '../../types/puzzle';
import { getCellPosition, getGridConfig } from '../../constants/grid-configs';

export function isValidPlacement(
  cells: (number | null)[],
  index: number,
  value: number,
  size: GridSize
): boolean {
  const { row, col } = getCellPosition(index, size);
  const { boxConfig } = getGridConfig(size);

  // Check row
  for (let c = 0; c < size; c++) {
    const i = row * size + c;
    if (i !== index && cells[i] === value) {
      return false;
    }
  }

  // Check column
  for (let r = 0; r < size; r++) {
    const i = r * size + col;
    if (i !== index && cells[i] === value) {
      return false;
    }
  }

  // Check box
  const boxStartRow = Math.floor(row / boxConfig.rows) * boxConfig.rows;
  const boxStartCol = Math.floor(col / boxConfig.cols) * boxConfig.cols;

  for (let r = boxStartRow; r < boxStartRow + boxConfig.rows; r++) {
    for (let c = boxStartCol; c < boxStartCol + boxConfig.cols; c++) {
      const i = r * size + c;
      if (i !== index && cells[i] === value) {
        return false;
      }
    }
  }

  return true;
}

export function getConflicts(
  cells: (number | null)[],
  index: number,
  size: GridSize
): number[] {
  const value = cells[index];
  if (value === null) return [];

  const conflicts: number[] = [];
  const { row, col } = getCellPosition(index, size);
  const { boxConfig } = getGridConfig(size);

  // Check row
  for (let c = 0; c < size; c++) {
    const i = row * size + c;
    if (i !== index && cells[i] === value) {
      conflicts.push(i);
    }
  }

  // Check column
  for (let r = 0; r < size; r++) {
    const i = r * size + col;
    if (i !== index && cells[i] === value) {
      conflicts.push(i);
    }
  }

  // Check box
  const boxStartRow = Math.floor(row / boxConfig.rows) * boxConfig.rows;
  const boxStartCol = Math.floor(col / boxConfig.cols) * boxConfig.cols;

  for (let r = boxStartRow; r < boxStartRow + boxConfig.rows; r++) {
    for (let c = boxStartCol; c < boxStartCol + boxConfig.cols; c++) {
      const i = r * size + c;
      if (i !== index && cells[i] === value && !conflicts.includes(i)) {
        conflicts.push(i);
      }
    }
  }

  return conflicts;
}

export function isPuzzleComplete(
  puzzle: (number | null)[],
  userValues: (number | null)[],
  solution: number[]
): boolean {
  for (let i = 0; i < solution.length; i++) {
    const value = puzzle[i] ?? userValues[i];
    if (value !== solution[i]) {
      return false;
    }
  }
  return true;
}

export function hasErrors(
  cells: (number | null)[],
  size: GridSize
): boolean {
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] !== null && !isValidPlacement(cells, i, cells[i]!, size)) {
      return true;
    }
  }
  return false;
}

export function getRowIndices(row: number, size: GridSize): number[] {
  const indices: number[] = [];
  for (let c = 0; c < size; c++) {
    indices.push(row * size + c);
  }
  return indices;
}

export function getColIndices(col: number, size: GridSize): number[] {
  const indices: number[] = [];
  for (let r = 0; r < size; r++) {
    indices.push(r * size + col);
  }
  return indices;
}

export function getBoxIndices(boxIndex: number, size: GridSize): number[] {
  const { boxConfig } = getGridConfig(size);
  const boxesPerRow = size / boxConfig.cols;
  const boxRow = Math.floor(boxIndex / boxesPerRow);
  const boxCol = boxIndex % boxesPerRow;
  const startRow = boxRow * boxConfig.rows;
  const startCol = boxCol * boxConfig.cols;

  const indices: number[] = [];
  for (let r = startRow; r < startRow + boxConfig.rows; r++) {
    for (let c = startCol; c < startCol + boxConfig.cols; c++) {
      indices.push(r * size + c);
    }
  }
  return indices;
}

export function getRelatedIndices(index: number, size: GridSize): Set<number> {
  const { row, col, box } = getCellPosition(index, size);
  const related = new Set<number>();

  getRowIndices(row, size).forEach(i => related.add(i));
  getColIndices(col, size).forEach(i => related.add(i));
  getBoxIndices(box, size).forEach(i => related.add(i));

  related.delete(index);
  return related;
}
