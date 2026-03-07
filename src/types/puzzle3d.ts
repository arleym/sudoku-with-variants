import type { Difficulty } from './puzzle';

export interface Puzzle3D {
  id: string;
  size: number;        // 4, 9, or 16
  depth: number;       // same as size (NxNxN)
  difficulty: Difficulty;
  cells: (number | null)[];  // flat index = layer * size² + row * size + col
  solution: number[];
}

export interface Game3DState {
  puzzle: Puzzle3D;
  userValues: (number | null)[];   // length 64
  pencilMarks: Set<number>[];      // length 64
  activeLayer: number;             // 0–3
  selectedCell: number | null;     // index within active layer, 0–15
  isPencilMode: boolean;
  isComplete: boolean;
  history: History3DEntry[];
  historyIndex: number;
}

export interface History3DEntry {
  userValues: (number | null)[];
  pencilMarks: Set<number>[];
  activeLayer: number;
}

export type Game3DAction =
  | { type: 'SELECT_CELL'; index: number | null }
  | { type: 'SET_VALUE'; index: number; value: number | null }
  | { type: 'TOGGLE_PENCIL_MARK'; index: number; value: number }
  | { type: 'CLEAR_CELL'; index: number }
  | { type: 'TOGGLE_PENCIL_MODE' }
  | { type: 'CHANGE_LAYER'; layer: number }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET_PUZZLE' }
  | { type: 'NEW_PUZZLE'; puzzle: Puzzle3D };
