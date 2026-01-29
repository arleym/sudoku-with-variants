import { useMemo, useCallback } from 'react';
import type { GridSize } from '../../types/puzzle';
import type { GameSettings } from '../../types/settings';
import { getGridConfig, getCellPosition } from '../../constants/grid-configs';
import { getConflicts, getRelatedIndices } from '../../lib/puzzle/validator';
import { mergeCellValues, getCandidates } from '../../lib/candidates';
import { SudokuCell } from './SudokuCell';
import styles from './SudokuGrid.module.css';

interface SudokuGridProps {
  size: GridSize;
  puzzleCells: (number | null)[];
  userValues: (number | null)[];
  pencilMarks: Set<number>[];
  selectedCell: number | null;
  settings: GameSettings;
  onCellClick: (index: number) => void;
}

export function SudokuGrid({
  size,
  puzzleCells,
  userValues,
  pencilMarks,
  selectedCell,
  settings,
  onCellClick,
}: SudokuGridProps) {
  const config = getGridConfig(size);
  const totalCells = size * size;

  // Merge puzzle and user values for display and validation
  const allValues = useMemo(
    () => mergeCellValues(puzzleCells, userValues),
    [puzzleCells, userValues]
  );

  // Calculate conflicts for error highlighting
  const conflicts = useMemo(() => {
    if (!settings.showErrors) return new Set<number>();

    const conflictSet = new Set<number>();
    for (let i = 0; i < totalCells; i++) {
      if (allValues[i] !== null && puzzleCells[i] === null) {
        const cellConflicts = getConflicts(allValues, i, size);
        if (cellConflicts.length > 0) {
          conflictSet.add(i);
          cellConflicts.forEach(c => conflictSet.add(c));
        }
      }
    }
    return conflictSet;
  }, [allValues, puzzleCells, size, settings.showErrors, totalCells]);

  // Get related cells for highlighting
  const relatedCells = useMemo(() => {
    if (selectedCell === null || !settings.highlightRowColBox) {
      return new Set<number>();
    }
    return getRelatedIndices(selectedCell, size);
  }, [selectedCell, size, settings.highlightRowColBox]);

  // Get cells with same number for highlighting
  const sameNumberCells = useMemo(() => {
    if (selectedCell === null || !settings.highlightSameNumbers) {
      return new Set<number>();
    }
    const value = allValues[selectedCell];
    if (value === null) return new Set<number>();

    const same = new Set<number>();
    for (let i = 0; i < totalCells; i++) {
      if (allValues[i] === value) {
        same.add(i);
      }
    }
    return same;
  }, [selectedCell, allValues, settings.highlightSameNumbers, totalCells]);

  // Calculate auto-fill candidates if enabled
  const autoCandidates = useMemo(() => {
    if (!settings.autoFillCandidates) {
      return pencilMarks;
    }
    return allValues.map((_, index) => {
      if (allValues[index] !== null) return new Set<number>();
      return getCandidates(allValues, index, size);
    });
  }, [allValues, size, settings.autoFillCandidates, pencilMarks]);

  const handleCellClick = useCallback(
    (index: number) => {
      onCellClick(index);
    },
    [onCellClick]
  );

  // Generate grid lines based on box configuration
  const gridStyle = {
    '--grid-size': `min(90vw, 90vh, 500px)`,
    '--box-rows': config.boxConfig.rows,
    '--box-cols': config.boxConfig.cols,
    gridTemplateColumns: `repeat(${size}, 1fr)`,
    gridTemplateRows: `repeat(${size}, 1fr)`,
  } as React.CSSProperties;

  return (
    <div className={styles.gridContainer}>
      <div
        className={styles.grid}
        style={gridStyle}
        data-size={size}
        role="grid"
        aria-label={`${size}x${size} Sudoku grid`}
      >
        {Array.from({ length: totalCells }, (_, index) => {
          const { row, col } = getCellPosition(index, size);
          const isBoxBorderRight =
            (col + 1) % config.boxConfig.cols === 0 && col < size - 1;
          const isBoxBorderBottom =
            (row + 1) % config.boxConfig.rows === 0 && row < size - 1;

          return (
            <div
              key={index}
              className={`${styles.cellWrapper} ${
                isBoxBorderRight ? styles.boxBorderRight : ''
              } ${isBoxBorderBottom ? styles.boxBorderBottom : ''}`}
            >
              <SudokuCell
                index={index}
                value={userValues[index]}
                givenValue={puzzleCells[index]}
                pencilMarks={
                  settings.showPencilMarks ? autoCandidates[index] : new Set()
                }
                size={size}
                isSelected={selectedCell === index}
                isHighlighted={sameNumberCells.has(index)}
                isRelated={relatedCells.has(index)}
                hasError={conflicts.has(index)}
                showPencilMarks={
                  settings.showPencilMarks || settings.autoFillCandidates
                }
                onClick={() => handleCellClick(index)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
