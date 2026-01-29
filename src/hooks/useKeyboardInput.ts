import { useEffect, useCallback } from 'react';
import type { GridSize } from '../types/puzzle';
import { parseInputValue } from '../constants/grid-configs';

interface UseKeyboardInputOptions {
  size: GridSize;
  selectedCell: number | null;
  isPencilMode: boolean;
  onSelectCell: (index: number | null) => void;
  onSetValue: (index: number, value: number | null) => void;
  onTogglePencilMark: (index: number, value: number) => void;
  onClearCell: (index: number) => void;
  onTogglePencilMode: () => void;
  onUndo: () => void;
  onRedo: () => void;
  isGivenCell: (index: number) => boolean;
}

export function useKeyboardInput({
  size,
  selectedCell,
  isPencilMode,
  onSelectCell,
  onSetValue,
  onTogglePencilMark,
  onClearCell,
  onTogglePencilMode,
  onUndo,
  onRedo,
  isGivenCell,
}: UseKeyboardInputOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Handle undo/redo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        onRedo();
      } else {
        onUndo();
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      onRedo();
      return;
    }

    // Toggle pencil mode with 'p'
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      onTogglePencilMode();
      return;
    }

    // No cell selected - nothing else to handle
    if (selectedCell === null) return;

    // Arrow key navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const row = Math.floor(selectedCell / size);
      const col = selectedCell % size;

      let newRow = row;
      let newCol = col;

      switch (e.key) {
        case 'ArrowUp':
          newRow = row > 0 ? row - 1 : size - 1;
          break;
        case 'ArrowDown':
          newRow = row < size - 1 ? row + 1 : 0;
          break;
        case 'ArrowLeft':
          newCol = col > 0 ? col - 1 : size - 1;
          break;
        case 'ArrowRight':
          newCol = col < size - 1 ? col + 1 : 0;
          break;
      }

      onSelectCell(newRow * size + newCol);
      return;
    }

    // Tab navigation
    if (e.key === 'Tab') {
      e.preventDefault();
      const direction = e.shiftKey ? -1 : 1;
      let newIndex = selectedCell + direction;

      if (newIndex < 0) newIndex = size * size - 1;
      if (newIndex >= size * size) newIndex = 0;

      onSelectCell(newIndex);
      return;
    }

    // Escape to deselect
    if (e.key === 'Escape') {
      e.preventDefault();
      onSelectCell(null);
      return;
    }

    // Delete/Backspace to clear cell
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (!isGivenCell(selectedCell)) {
        onClearCell(selectedCell);
      }
      return;
    }

    // Number/letter input
    const value = parseInputValue(e.key, size);
    if (value !== null && !isGivenCell(selectedCell)) {
      e.preventDefault();
      if (isPencilMode || e.shiftKey) {
        onTogglePencilMark(selectedCell, value);
      } else {
        onSetValue(selectedCell, value);
      }
    }
  }, [
    size,
    selectedCell,
    isPencilMode,
    onSelectCell,
    onSetValue,
    onTogglePencilMark,
    onClearCell,
    onTogglePencilMode,
    onUndo,
    onRedo,
    isGivenCell,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
