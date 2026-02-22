import { useMemo } from 'react';
import { getAllConflicts3D, getRelatedIndices3D } from '../../lib/puzzle3d/validator3d';
import styles from './ActiveLayerGrid.module.css';

interface ActiveLayerGridProps {
  activeLayer: number;
  puzzleCells: (number | null)[];   // all 64
  userValues: (number | null)[];    // all 64
  pencilMarks: Set<number>[];       // all 64
  selectedCell: number | null;      // 0–15 within the layer
  onCellClick: (index: number) => void;  // 0–15
}

export function ActiveLayerGrid({
  activeLayer,
  puzzleCells,
  userValues,
  pencilMarks,
  selectedCell,
  onCellClick,
}: ActiveLayerGridProps) {
  // Merged all values for conflict detection
  const allValues = useMemo(() => puzzleCells.map((c, i) => c ?? userValues[i]), [puzzleCells, userValues]);

  // Flat index in 64-cell grid for the selected cell
  const selectedFlatIndex = selectedCell !== null ? activeLayer * 16 + selectedCell : null;

  // Conflicts across entire 3D grid
  const conflicts = useMemo(() => getAllConflicts3D(allValues), [allValues]);

  // Related indices (row/col/box in layer only) for selected cell
  const relatedLayer = useMemo(() => {
    if (selectedFlatIndex === null) return new Set<number>();
    return getRelatedIndices3D(selectedFlatIndex);
  }, [selectedFlatIndex]);

  // Same-value highlighting (within active layer)
  const selectedValue = selectedFlatIndex !== null ? allValues[selectedFlatIndex] : null;
  const sameValueIndices = useMemo(() => {
    const set = new Set<number>();
    if (selectedValue === null) return set;
    for (let i = 0; i < 64; i++) {
      if (allValues[i] === selectedValue) set.add(i);
    }
    return set;
  }, [selectedValue, allValues]);

  return (
    <div className={styles.wrapper} key={`layer-${activeLayer}`}>
      <div
        className={styles.grid}
        role="grid"
        aria-label={`Layer ${activeLayer + 1} of 4×4×4 Sudoku`}
      >
        {Array.from({ length: 16 }, (_, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          const flatIdx = activeLayer * 16 + i;

          const puzzleVal = puzzleCells[flatIdx];
          const userVal = userValues[flatIdx];
          const displayVal = puzzleVal ?? userVal;
          const isGiven = puzzleVal !== null;
          const isSelected = selectedCell === i;
          const isRelated = relatedLayer.has(flatIdx) && !isSelected;
          const hasError = conflicts.has(flatIdx);
          const isHighlighted = sameValueIndices.has(flatIdx) && !isSelected;
          const marks = pencilMarks[flatIdx];

          // Box borders
          const isBoxBorderRight = col === 1;
          const isBoxBorderBottom = row === 1;

          const cellClass = [
            styles.cell,
            isSelected && styles.selected,
            isHighlighted && !isSelected && styles.highlighted,
            isRelated && styles.related,
            hasError && styles.error,
            isGiven && styles.given,
            isBoxBorderRight && styles.boxBorderRight,
            isBoxBorderBottom && styles.boxBorderBottom,
          ].filter(Boolean).join(' ');

          return (
            <div
              key={i}
              className={cellClass}
              onClick={() => onCellClick(i)}
              role="gridcell"
              tabIndex={0}
              aria-selected={isSelected}
              aria-label={`Row ${row + 1}, Col ${col + 1}${displayVal ? `, value ${displayVal}` : ', empty'}`}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onCellClick(i); }}
            >
              {displayVal !== null ? (
                <span className={styles.value}>{displayVal}</span>
              ) : marks.size > 0 ? (
                <div className={styles.pencil}>
                  {[1, 2, 3, 4].map(n => (
                    <span key={n} className={`${styles.pencilMark} ${marks.has(n) ? styles.pencilVisible : ''}`}>
                      {marks.has(n) ? n : ''}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Pillar indicator: show which cells in OTHER layers are in the same pillar */}
      {selectedFlatIndex !== null && (
        <div className={styles.pillarInfo}>
          <span className={styles.pillarLabel}>
            Pillar: ({Math.floor((selectedFlatIndex % 16) / 4) + 1}, {(selectedFlatIndex % 4) + 1}) across all layers
          </span>
        </div>
      )}
    </div>
  );
}
