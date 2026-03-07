import { useEffect } from 'react';

interface UseKeyboard3DInputProps {
  size: number;             // 4 or 9 — grid size per layer
  activeLayer: number;
  selectedCell: number | null;        // 0..(size*size-1) within the active layer
  isPencilMode: boolean;
  onSelectCell: (index: number | null) => void;
  onSetValue: (flatIndex: number, value: number | null) => void;
  onTogglePencilMark: (flatIndex: number, value: number) => void;
  onClearCell: (flatIndex: number) => void;
  onTogglePencilMode: () => void;
  onChangeLayer: (layer: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  isGivenCell: (flatIndex: number) => boolean;
}

export function useKeyboard3DInput({
  size,
  activeLayer,
  selectedCell,
  isPencilMode,
  onSelectCell,
  onSetValue,
  onTogglePencilMark,
  onClearCell,
  onTogglePencilMode,
  onChangeLayer,
  onUndo,
  onRedo,
  isGivenCell,
}: UseKeyboard3DInputProps) {
  useEffect(() => {
    const maxLayer = size - 1;
    const layerSize = size * size;

    function handleKeyDown(e: KeyboardEvent) {
      // Undo / Redo
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) onRedo();
        else onUndo();
        return;
      }
      if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onRedo();
        return;
      }

      // Pencil mode toggle
      if (e.key === 'p' || e.key === 'P') {
        onTogglePencilMode();
        return;
      }

      // Layer switching: [ / ]  or  PageUp / PageDown
      if (e.key === '[' || e.key === 'PageDown') {
        e.preventDefault();
        onChangeLayer(Math.max(0, activeLayer - 1));
        return;
      }
      if (e.key === ']' || e.key === 'PageUp') {
        e.preventDefault();
        onChangeLayer(Math.min(maxLayer, activeLayer + 1));
        return;
      }

      // Arrow navigation within layer
      if (selectedCell !== null && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const row = Math.floor(selectedCell / size);
        const col = selectedCell % size;
        let newRow = row;
        let newCol = col;

        if (e.key === 'ArrowUp')    newRow = Math.max(0, row - 1);
        if (e.key === 'ArrowDown')  newRow = Math.min(size - 1, row + 1);
        if (e.key === 'ArrowLeft')  newCol = Math.max(0, col - 1);
        if (e.key === 'ArrowRight') newCol = Math.min(size - 1, col + 1);

        onSelectCell(newRow * size + newCol);
        return;
      }

      if (selectedCell === null) return;

      const flatIndex = activeLayer * layerSize + selectedCell;

      // Number input 1–9
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= size) {
        if (isGivenCell(flatIndex)) return;
        if (isPencilMode) onTogglePencilMark(flatIndex, num);
        else onSetValue(flatIndex, num);
        return;
      }

      // Letter input A-G for values 10-16 (when size > 9)
      if (size > 9) {
        const upper = e.key.toUpperCase();
        if (upper >= 'A' && upper <= 'Z') {
          const letterVal = upper.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
          if (letterVal >= 10 && letterVal <= size) {
            if (isGivenCell(flatIndex)) return;
            if (isPencilMode) onTogglePencilMark(flatIndex, letterVal);
            else onSetValue(flatIndex, letterVal);
            return;
          }
        }
      }

      // Clear
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        if (!isGivenCell(flatIndex)) onClearCell(flatIndex);
        return;
      }

      // Escape deselects
      if (e.key === 'Escape') {
        onSelectCell(null);
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    size,
    activeLayer,
    selectedCell,
    isPencilMode,
    onSelectCell,
    onSetValue,
    onTogglePencilMark,
    onClearCell,
    onTogglePencilMode,
    onChangeLayer,
    onUndo,
    onRedo,
    isGivenCell,
  ]);
}
