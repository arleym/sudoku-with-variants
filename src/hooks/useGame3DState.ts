import { useReducer, useCallback, useEffect } from 'react';
import type { Game3DState, Game3DAction, History3DEntry, Puzzle3D } from '../types/puzzle3d';
import type { Difficulty } from '../types/puzzle';
import { isComplete3D } from '../lib/puzzle3d/validator3d';
import { generatePuzzle3D } from '../lib/puzzle3d/generator3d';

const STORAGE_KEY = 'sudoku-3d-game';

interface StoredGame3DState {
  puzzle: Puzzle3D;
  userValues: (number | null)[];
  pencilMarks: number[][];
  activeLayer: number;
  isPencilMode: boolean;
  isComplete: boolean;
}

function saveState(state: Game3DState): void {
  try {
    const stored: StoredGame3DState = {
      puzzle: state.puzzle,
      userValues: state.userValues,
      pencilMarks: state.pencilMarks.map(s => Array.from(s)),
      activeLayer: state.activeLayer,
      isPencilMode: state.isPencilMode,
      isComplete: state.isComplete,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {
    console.warn('Failed to save 3D game state:', e);
  }
}

function loadState(): Game3DState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredGame3DState = JSON.parse(raw);
    const pencilMarks = parsed.pencilMarks.map(arr => new Set<number>(arr));
    return {
      puzzle: parsed.puzzle,
      userValues: parsed.userValues,
      pencilMarks,
      activeLayer: parsed.activeLayer,
      selectedCell: null,
      isPencilMode: parsed.isPencilMode,
      isComplete: parsed.isComplete,
      history: [{
        userValues: [...parsed.userValues],
        pencilMarks: pencilMarks.map(s => new Set(s)),
        activeLayer: parsed.activeLayer,
      }],
      historyIndex: 0,
    };
  } catch (e) {
    console.warn('Failed to load 3D game state:', e);
    return null;
  }
}

function createInitialState(puzzle: Puzzle3D): Game3DState {
  const initialEntry: History3DEntry = {
    userValues: new Array(64).fill(null),
    pencilMarks: new Array(64).fill(null).map(() => new Set<number>()),
    activeLayer: 0,
  };
  return {
    puzzle,
    userValues: initialEntry.userValues,
    pencilMarks: initialEntry.pencilMarks,
    activeLayer: 0,
    selectedCell: null,
    isPencilMode: false,
    isComplete: false,
    history: [initialEntry],
    historyIndex: 0,
  };
}

function cloneEditables(state: Game3DState) {
  return {
    userValues: [...state.userValues],
    pencilMarks: state.pencilMarks.map(s => new Set(s)),
  };
}

function pushHistory(state: Game3DState): Game3DState {
  const entry: History3DEntry = {
    userValues: [...state.userValues],
    pencilMarks: state.pencilMarks.map(s => new Set(s)),
    activeLayer: state.activeLayer,
  };
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(entry);
  return { ...state, history: newHistory, historyIndex: newHistory.length - 1 };
}

function reducer(state: Game3DState, action: Game3DAction): Game3DState {
  switch (action.type) {
    case 'SELECT_CELL':
      return { ...state, selectedCell: action.index };

    case 'SET_VALUE': {
      const { index, value } = action;
      // flat index in the 64-cell grid
      if (state.puzzle.cells[index] !== null) return state;

      const { userValues, pencilMarks } = cloneEditables(state);
      userValues[index] = value;
      if (value !== null) pencilMarks[index] = new Set();

      const complete = isComplete3D(state.puzzle.cells, userValues, state.puzzle.solution);

      return pushHistory({
        ...state,
        userValues,
        pencilMarks,
        isComplete: complete,
      });
    }

    case 'TOGGLE_PENCIL_MARK': {
      const { index, value } = action;
      if (state.puzzle.cells[index] !== null || state.userValues[index] !== null) return state;

      const { userValues, pencilMarks } = cloneEditables(state);
      const marks = pencilMarks[index];
      if (marks.has(value)) marks.delete(value);
      else marks.add(value);

      return pushHistory({ ...state, userValues, pencilMarks });
    }

    case 'CLEAR_CELL': {
      const { index } = action;
      if (state.puzzle.cells[index] !== null) return state;

      const { userValues, pencilMarks } = cloneEditables(state);
      userValues[index] = null;
      pencilMarks[index] = new Set();

      return pushHistory({ ...state, userValues, pencilMarks });
    }

    case 'TOGGLE_PENCIL_MODE':
      return { ...state, isPencilMode: !state.isPencilMode };

    case 'CHANGE_LAYER':
      return { ...state, activeLayer: action.layer, selectedCell: null };

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      const entry = state.history[newIndex];
      return {
        ...state,
        userValues: [...entry.userValues],
        pencilMarks: entry.pencilMarks.map(s => new Set(s)),
        activeLayer: entry.activeLayer,
        historyIndex: newIndex,
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      const entry = state.history[newIndex];
      return {
        ...state,
        userValues: [...entry.userValues],
        pencilMarks: entry.pencilMarks.map(s => new Set(s)),
        activeLayer: entry.activeLayer,
        historyIndex: newIndex,
      };
    }

    case 'RESET_PUZZLE': {
      const entry: History3DEntry = {
        userValues: new Array(64).fill(null),
        pencilMarks: new Array(64).fill(null).map(() => new Set<number>()),
        activeLayer: 0,
      };
      return {
        ...state,
        userValues: entry.userValues,
        pencilMarks: entry.pencilMarks,
        activeLayer: 0,
        selectedCell: null,
        isComplete: false,
        history: [entry],
        historyIndex: 0,
      };
    }

    case 'NEW_PUZZLE':
      return createInitialState(action.puzzle);

    default:
      return state;
  }
}

export function useGame3DState() {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const saved = loadState();
    if (saved) return saved;
    return createInitialState(generatePuzzle3D('easy'));
  });

  useEffect(() => {
    saveState(state);
  }, [state.puzzle, state.userValues, state.pencilMarks, state.activeLayer, state.isPencilMode, state.isComplete]);

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

  const changeLayer = useCallback((layer: number) => {
    dispatch({ type: 'CHANGE_LAYER', layer });
  }, []);

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

  const resetPuzzle = useCallback(() => dispatch({ type: 'RESET_PUZZLE' }), []);

  const newPuzzle = useCallback((difficulty: Difficulty) => {
    const puzzle = generatePuzzle3D(difficulty);
    dispatch({ type: 'NEW_PUZZLE', puzzle });
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
    changeLayer,
    undo,
    redo,
    resetPuzzle,
    newPuzzle,
    canUndo,
    canRedo,
  };
}
