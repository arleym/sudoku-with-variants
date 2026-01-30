import type { GridConfig, GridSize } from '../types/puzzle';

export const GRID_CONFIGS: Record<GridSize, GridConfig> = {
  4: {
    size: 4,
    boxConfig: { rows: 2, cols: 2 },
    maxValue: 4,
    values: [1, 2, 3, 4],
    clueTargets: {
      easy: { min: 10, max: 12 },
      medium: { min: 8, max: 10 },
      hard: { min: 6, max: 8 },
      expert: { min: 4, max: 6 },
    },
  },
  9: {
    size: 9,
    boxConfig: { rows: 3, cols: 3 },
    maxValue: 9,
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    clueTargets: {
      easy: { min: 36, max: 45 },
      medium: { min: 32, max: 36 },
      hard: { min: 28, max: 32 },
      expert: { min: 22, max: 28 },
    },
  },
  16: {
    size: 16,
    boxConfig: { rows: 4, cols: 4 },
    maxValue: 16,
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 'A', 'B', 'C', 'D', 'E', 'F', 'G'],
    clueTargets: {
      easy: { min: 130, max: 160 },
      medium: { min: 100, max: 130 },
      hard: { min: 80, max: 100 },
      expert: { min: 60, max: 80 },
    },
  },
  25: {
    size: 25,
    boxConfig: { rows: 5, cols: 5 },
    maxValue: 25,
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'],
    clueTargets: {
      easy: { min: 380, max: 450 },
      medium: { min: 300, max: 380 },
      hard: { min: 220, max: 300 },
      expert: { min: 150, max: 220 },
    },
  },
};

export function getGridConfig(size: GridSize): GridConfig {
  return GRID_CONFIGS[size];
}

export function getBoxIndex(row: number, col: number, size: GridSize): number {
  const { boxConfig } = GRID_CONFIGS[size];
  const boxRow = Math.floor(row / boxConfig.rows);
  const boxCol = Math.floor(col / boxConfig.cols);
  return boxRow * (size / boxConfig.cols) + boxCol;
}

export function getCellPosition(index: number, size: GridSize) {
  const row = Math.floor(index / size);
  const col = index % size;
  const box = getBoxIndex(row, col, size);
  return { row, col, box, index };
}

export function displayValue(value: number | null, size: GridSize): string {
  if (value === null) return '';
  if (size > 9 && value > 9) {
    return String.fromCharCode('A'.charCodeAt(0) + value - 10);
  }
  return String(value);
}

export function parseInputValue(input: string, size: GridSize): number | null {
  const upper = input.toUpperCase();

  // Handle letter input for sizes > 9 (A-P for values 10-25)
  if (size > 9 && upper.length === 1 && upper >= 'A') {
    const value = upper.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
    if (value >= 10 && value <= size) {
      return value;
    }
    return null;
  }

  const num = parseInt(input, 10);
  if (isNaN(num) || num < 1 || num > Math.min(size, 9)) {
    return null;
  }
  return num;
}
