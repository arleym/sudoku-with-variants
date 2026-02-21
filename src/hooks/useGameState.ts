import { useReducer, useCallback, useEffect } from 'react';
import type { GameState, GameAction, HistoryEntry } from '../types/game';
import type { Puzzle, GridSize, Difficulty } from '../types/puzzle';
import { isPuzzleComplete } from '../lib/puzzle/validator';
import { generatePuzzle } from '../lib/puzzle/generator';

const GAME_STORAGE_KEY = 'sudoku-game';

interface StoredGameState {
  puzzle: Puzzle;
  userValues: (number | null)[];
  pencilMarks: number[][];
  isPencilMode: boolean;
  isComplete: boolean;
}

function saveGameState(state: GameState): void {
  try {
    const stored: StoredGameState = {
      puzzle: state.puzzle,
      userValues: state.userValues,
      pencilMarks: state.pencilMarks.map(set => Array.from(set)),
      isPencilMode: state.isPencilMode,
      isComplete: state.isComplete,
    };
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {
    console.warn('Failed to save game state:', e);
  }
}

function loadGameState(): GameState | null {
  try {
    const stored = localStorage.getItem(GAME_STORAGE_KEY);
    if (!stored) return null;
    const parsed: StoredGameState = JSON.parse(stored);
    const pencilMarks = parsed.pencilMarks.map(arr => new Set<number>(arr));
    return {
      puzzle: parsed.puzzle,
      userValues: parsed.userValues,
      pencilMarks,
      selectedCell: null,
      isPencilMode: parsed.isPencilMode,
      isComplete: parsed.isComplete,
      history: [{
        userValues: [...parsed.userValues],
        pencilMarks: pencilMarks.map(s => new Set(s)),
      }],
      historyIndex: 0,
    };
  } catch (e) {
    console.warn('Failed to load game state:', e);
    return null;
  }
}

function createInitialState(puzzle: Puzzle): GameState {
  const initialHistory: HistoryEntry = {
    userValues: new Array(puzzle.size * puzzle.size).fill(null),
    pencilMarks: new Array(puzzle.size * puzzle.size).fill(null).map(() => new Set()),
  };

  return {
    puzzle,
    userValues: initialHistory.userValues,
    pencilMarks: initialHistory.pencilMarks,
    selectedCell: null,
    isPencilMode: false,
    isComplete: false,
    history: [initialHistory],
    historyIndex: 0,
  };
}

function cloneState(state: GameState): { userValues: (number | null)[]; pencilMarks: Set<number>[] } {
  return {
    userValues: [...state.userValues],
    pencilMarks: state.pencilMarks.map(set => new Set(set)),
  };
}

function saveToHistory(state: GameState): GameState {
  const entry: HistoryEntry = {
    userValues: [...state.userValues],
    pencilMarks: state.pencilMarks.map(set => new Set(set)),
  };

  // Remove any future history if we're not at the end
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(entry);

  return {
    ...state,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_CELL': {
      return { ...state, selectedCell: action.index };
    }

    case 'SET_VALUE': {
      const { index, value } = action;

      // Can't modify given cells
      if (state.puzzle.cells[index] !== null) {
        return state;
      }

      const { userValues, pencilMarks } = cloneState(state);
      userValues[index] = value;

      // Clear pencil marks when setting a value
      if (value !== null) {
        pencilMarks[index] = new Set();
      }

      const newState = saveToHistory({
        ...state,
        userValues,
        pencilMarks,
      });

      // Check completion
      const complete = isPuzzleComplete(
        state.puzzle.cells,
        userValues,
        state.puzzle.solution
      );

      return { ...newState, isComplete: complete };
    }

    case 'TOGGLE_PENCIL_MARK': {
      const { index, value } = action;

      // Can't modify given cells or cells with values
      if (state.puzzle.cells[index] !== null || state.userValues[index] !== null) {
        return state;
      }

      const { userValues, pencilMarks } = cloneState(state);
      const marks = pencilMarks[index];

      if (marks.has(value)) {
        marks.delete(value);
      } else {
        marks.add(value);
      }

      return saveToHistory({
        ...state,
        userValues,
        pencilMarks,
      });
    }

    case 'CLEAR_CELL': {
      const { index } = action;

      // Can't modify given cells
      if (state.puzzle.cells[index] !== null) {
        return state;
      }

      const { userValues, pencilMarks } = cloneState(state);
      userValues[index] = null;
      pencilMarks[index] = new Set();

      return saveToHistory({
        ...state,
        userValues,
        pencilMarks,
      });
    }

    case 'TOGGLE_PENCIL_MODE': {
      return { ...state, isPencilMode: !state.isPencilMode };
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) {
        return state;
      }

      const newIndex = state.historyIndex - 1;
      const entry = state.history[newIndex];

      return {
        ...state,
        userValues: [...entry.userValues],
        pencilMarks: entry.pencilMarks.map(set => new Set(set)),
        historyIndex: newIndex,
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) {
        return state;
      }

      const newIndex = state.historyIndex + 1;
      const entry = state.history[newIndex];

      return {
        ...state,
        userValues: [...entry.userValues],
        pencilMarks: entry.pencilMarks.map(set => new Set(set)),
        historyIndex: newIndex,
      };
    }

    case 'RESET_PUZZLE': {
      const initialEntry: HistoryEntry = {
        userValues: new Array(state.puzzle.size * state.puzzle.size).fill(null),
        pencilMarks: new Array(state.puzzle.size * state.puzzle.size).fill(null).map(() => new Set()),
      };

      return {
        ...state,
        userValues: initialEntry.userValues,
        pencilMarks: initialEntry.pencilMarks,
        selectedCell: null,
        isComplete: false,
        history: [initialEntry],
        historyIndex: 0,
      };
    }

    case 'NEW_PUZZLE': {
      return createInitialState(action.puzzle);
    }

    case 'LOAD_PUZZLE': {
      const initialState = createInitialState(action.puzzle);

      if (action.userValues) {
        initialState.userValues = action.userValues;
      }

      if (action.pencilMarks) {
        initialState.pencilMarks = action.pencilMarks;
      }

      // Update history with loaded state
      initialState.history = [{
        userValues: [...initialState.userValues],
        pencilMarks: initialState.pencilMarks.map(set => new Set(set)),
      }];

      return initialState;
    }

    case 'CHECK_COMPLETION': {
      const complete = isPuzzleComplete(
        state.puzzle.cells,
        state.userValues,
        state.puzzle.solution
      );
      return { ...state, isComplete: complete };
    }

    default:
      return state;
  }
}

export function useGameState(initialPuzzle?: Puzzle) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => {
    if (initialPuzzle) return createInitialState(initialPuzzle);
    const saved = loadGameState();
    if (saved) return saved;
    return createInitialState(generatePuzzle(9, 'easy'));
  });

  useEffect(() => {
    saveGameState(state);
  }, [state.puzzle, state.userValues, state.pencilMarks, state.isPencilMode, state.isComplete]);

  const selectCell = useCallback((index: number | null) => {
    dispatch({ type: 'SELECT_CELL', index });
  }, []);

  const setValue = useCallback((index: number, value: number | null) => {
    dispatch({ type: 'SET_VALUE', index, value });
  }, []);

  const togglePencilMark = useCallback((index: number, value: number) => {
    dispatch({ type: 'TOGGLE_PENCIL_MARK', index, value });
  }, []);

  const clearCell = useCallback((index: number) => {
    dispatch({ type: 'CLEAR_CELL', index });
  }, []);

  const togglePencilMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_PENCIL_MODE' });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const resetPuzzle = useCallback(() => {
    dispatch({ type: 'RESET_PUZZLE' });
  }, []);

  const newPuzzle = useCallback((size: GridSize, difficulty: Difficulty) => {
    const puzzle = generatePuzzle(size, difficulty);
    dispatch({ type: 'NEW_PUZZLE', puzzle });
  }, []);

  const loadPuzzle = useCallback((
    puzzle: Puzzle,
    userValues?: (number | null)[],
    pencilMarks?: Set<number>[]
  ) => {
    dispatch({ type: 'LOAD_PUZZLE', puzzle, userValues, pencilMarks });
  }, []);

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  return {
    state,
    selectCell,
    setValue,
    togglePencilMark,
    clearCell,
    togglePencilMode,
    undo,
    redo,
    resetPuzzle,
    newPuzzle,
    loadPuzzle,
    canUndo,
    canRedo,
  };
}
