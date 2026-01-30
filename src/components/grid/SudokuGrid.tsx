import { useMemo, useCallback, useRef, useEffect } from 'react';
import type { GridSize } from '../../types/puzzle';
import type { GameSettings } from '../../types/settings';
import { getGridConfig, getCellPosition } from '../../constants/grid-configs';
import { getConflicts, getRelatedIndices, isRowComplete, isColComplete, isBoxComplete } from '../../lib/puzzle/validator';
import { mergeCellValues, getCandidates, getCompletedNumbers } from '../../lib/candidates';
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

  // Clean pencil marks by removing impossible candidates
  const cleanedPencilMarks = useMemo(() => {
    if (!settings.autoCleanPencilMarks || settings.autoFillCandidates) {
      return autoCandidates;
    }
    return pencilMarks.map((marks, index) => {
      if (allValues[index] !== null || marks.size === 0) return new Set<number>();
      const validCandidates = getCandidates(allValues, index, size);
      return new Set([...marks].filter(m => validCandidates.has(m)));
    });
  }, [pencilMarks, allValues, size, settings.autoCleanPencilMarks, settings.autoFillCandidates, autoCandidates]);

  // Calculate completed numbers (all N instances placed)
  const completedNumbers = useMemo(() => {
    return getCompletedNumbers(allValues, size);
  }, [allValues, size]);

  // Track previously completed sections to detect new completions
  const prevCompletedRef = useRef<{ rows: Set<number>; cols: Set<number>; boxes: Set<number> }>({
    rows: new Set(),
    cols: new Set(),
    boxes: new Set(),
  });

  // Calculate completed sections (rows, cols, boxes)
  const completedSections = useMemo(() => {
    const sections = {
      rows: new Set<number>(),
      cols: new Set<number>(),
      boxes: new Set<number>(),
    };

    for (let i = 0; i < size; i++) {
      if (isRowComplete(allValues, i, size)) sections.rows.add(i);
      if (isColComplete(allValues, i, size)) sections.cols.add(i);
      if (isBoxComplete(allValues, i, size)) sections.boxes.add(i);
    }

    return sections;
  }, [allValues, size]);

  // Track newly completed sections for animation
  const newlyCompletedCells = useMemo(() => {
    const cells = new Set<number>();
    const prev = prevCompletedRef.current;

    // Find newly completed rows
    for (const row of completedSections.rows) {
      if (!prev.rows.has(row)) {
        for (let col = 0; col < size; col++) {
          cells.add(row * size + col);
        }
      }
    }

    // Find newly completed cols
    for (const col of completedSections.cols) {
      if (!prev.cols.has(col)) {
        for (let row = 0; row < size; row++) {
          cells.add(row * size + col);
        }
      }
    }

    // Find newly completed boxes
    const { boxConfig } = config;
    const boxesPerRow = size / boxConfig.cols;
    for (const box of completedSections.boxes) {
      if (!prev.boxes.has(box)) {
        const boxRow = Math.floor(box / boxesPerRow) * boxConfig.rows;
        const boxCol = (box % boxesPerRow) * boxConfig.cols;
        for (let r = boxRow; r < boxRow + boxConfig.rows; r++) {
          for (let c = boxCol; c < boxCol + boxConfig.cols; c++) {
            cells.add(r * size + c);
          }
        }
      }
    }

    return cells;
  }, [completedSections, size, config]);

  // Update previous completed sections after render
  useEffect(() => {
    prevCompletedRef.current = {
      rows: new Set(completedSections.rows),
      cols: new Set(completedSections.cols),
      boxes: new Set(completedSections.boxes),
    };
  }, [completedSections]);

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
                  settings.showPencilMarks ? cleanedPencilMarks[index] : new Set()
                }
                size={size}
                isSelected={selectedCell === index}
                isHighlighted={sameNumberCells.has(index)}
                isRelated={relatedCells.has(index)}
                hasError={conflicts.has(index)}
                showPencilMarks={
                  settings.showPencilMarks || settings.autoFillCandidates
                }
                isSectionComplete={newlyCompletedCells.has(index)}
                completedNumbers={completedNumbers}
                onClick={() => handleCellClick(index)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
