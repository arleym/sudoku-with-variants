import type { Puzzle } from './puzzle';

export interface GameState {
  puzzle: Puzzle;
  userValues: (number | null)[];
  pencilMarks: Set<number>[];
  selectedCell: number | null;
  isPencilMode: boolean;
  isComplete: boolean;
  history: HistoryEntry[];
  historyIndex: number;
}

export interface HistoryEntry {
  userValues: (number | null)[];
  pencilMarks: Set<number>[];
}

export type GameAction =
  | { type: 'SELECT_CELL'; index: number | null }
  | { type: 'SET_VALUE'; index: number; value: number | null }
  | { type: 'TOGGLE_PENCIL_MARK'; index: number; value: number }
  | { type: 'CLEAR_CELL'; index: number }
  | { type: 'TOGGLE_PENCIL_MODE' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET_PUZZLE' }
  | { type: 'NEW_PUZZLE'; puzzle: Puzzle }
  | { type: 'LOAD_PUZZLE'; puzzle: Puzzle; userValues?: (number | null)[]; pencilMarks?: Set<number>[] }
  | { type: 'CHECK_COMPLETION' };
