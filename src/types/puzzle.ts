export type GridSize = 4 | 9 | 16;
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface Puzzle {
  id: string;
  size: GridSize;
  difficulty: Difficulty;
  cells: (number | null)[];    // Initial puzzle (null = empty cell)
  solution: number[];          // Complete solution
}

export interface CellPosition {
  row: number;
  col: number;
  box: number;
  index: number;
}

export interface BoxConfig {
  rows: number;
  cols: number;
}

export interface GridConfig {
  size: GridSize;
  boxConfig: BoxConfig;
  maxValue: number;
  values: (number | string)[];
  clueTargets: Record<Difficulty, { min: number; max: number }>;
}
