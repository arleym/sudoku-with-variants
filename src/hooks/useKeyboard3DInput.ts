import { useEffect } from 'react';

interface UseKeyboard3DInputProps {
  activeLayer: number;
  selectedCell: number | null;        // 0–15 within the active layer
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

      // Layer switching: [ and ]  or PageUp/PageDown
      if (e.key === '[' || e.key === 'PageDown') {
        e.preventDefault();
        onChangeLayer(Math.max(0, activeLayer - 1));
        return;
      }
      if (e.key === ']' || e.key === 'PageUp') {
        e.preventDefault();
        onChangeLayer(Math.min(3, activeLayer + 1));
        return;
      }

      // Arrow navigation within layer
      if (selectedCell !== null && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const row = Math.floor(selectedCell / 4);
        const col = selectedCell % 4;
        let newRow = row;
        let newCol = col;

        if (e.key === 'ArrowUp') newRow = Math.max(0, row - 1);
        if (e.key === 'ArrowDown') newRow = Math.min(3, row + 1);
        if (e.key === 'ArrowLeft') newCol = Math.max(0, col - 1);
        if (e.key === 'ArrowRight') newCol = Math.min(3, col + 1);

        onSelectCell(newRow * 4 + newCol);
        return;
      }

      if (selectedCell === null) return;

      const flatIndex = activeLayer * 16 + selectedCell;

      // Number input 1-4
      if (/^[1-4]$/.test(e.key)) {
        const value = parseInt(e.key);
        if (isGivenCell(flatIndex)) return;
        if (isPencilMode) {
          onTogglePencilMark(flatIndex, value);
        } else {
          onSetValue(flatIndex, value);
        }
        return;
      }

      // Clear cell
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        if (!isGivenCell(flatIndex)) {
          onClearCell(flatIndex);
        }
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
