import { useMemo } from 'react';
import { getAllConflicts3D, getRelatedIndices3D } from '../../lib/puzzle3d/validator3d';
import { displayValue } from '../../constants/grid-configs';
import type { GridSize } from '../../types/puzzle';
import styles from './ActiveLayerGrid.module.css';

interface ActiveLayerGridProps {
  size: number;                         // 4 or 9
  activeLayer: number;
  puzzleCells: (number | null)[];
  userValues: (number | null)[];
  pencilMarks: Set<number>[];
  selectedCell: number | null;          // 0..(size²-1) within the layer
  onCellClick: (index: number) => void;
}

export function ActiveLayerGrid({
  size,
  activeLayer,
  puzzleCells,
  userValues,
  pencilMarks,
  selectedCell,
  onCellClick,
}: ActiveLayerGridProps) {
  const layerSize = size * size;
  const boxSize = Math.sqrt(size);
  const allValues = useMemo(
    () => puzzleCells.map((c, i) => c ?? userValues[i]),
    [puzzleCells, userValues]
  );

  const selectedFlatIndex = selectedCell !== null ? activeLayer * layerSize + selectedCell : null;
  const conflicts = useMemo(() => getAllConflicts3D(allValues, size), [allValues, size]);

  const relatedLayer = useMemo(() => {
    if (selectedFlatIndex === null) return new Set<number>();
    return getRelatedIndices3D(selectedFlatIndex, size);
  }, [selectedFlatIndex, size]);

  const selectedValue = selectedFlatIndex !== null ? allValues[selectedFlatIndex] : null;
  const sameValueIndices = useMemo(() => {
    const set = new Set<number>();
    if (selectedValue === null) return set;
    for (let i = 0; i < allValues.length; i++) {
      if (allValues[i] === selectedValue) set.add(i);
    }
    return set;
  }, [selectedValue, allValues]);

  // Max grid size in px — scale by grid size
  const gridPx = size === 16 ? 'min(95vw, 520px)' : size === 9 ? 'min(88vw, 400px)' : 'min(80vw, 340px)';
  // Font size for cell values
  const fontSize = size === 16 ? '1em' : size === 9 ? 'clamp(0.85rem, 5vw, 1.4rem)' : 'clamp(1.2rem, 8vw, 1rem)';

  return (
    <div className={styles.wrapper} key={`layer-${activeLayer}-${size}`}>
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
          width: gridPx,
          fontSize,
        }}
        role="grid"
        aria-label={`Layer ${activeLayer + 1} of ${size}×${size}×${size} Sudoku`}
      >
        {Array.from({ length: layerSize }, (_, i) => {
          const row = Math.floor(i / size);
          const col = i % size;
          const flatIdx = activeLayer * layerSize + i;

          const puzzleVal = puzzleCells[flatIdx];
          const userVal = userValues[flatIdx];
          const displayVal = puzzleVal ?? userVal;
          const isGiven = puzzleVal !== null;
          const isSelected = selectedCell === i;
          const isRelated = relatedLayer.has(flatIdx) && !isSelected;
          const hasError = conflicts.has(flatIdx);
          const isHighlighted = sameValueIndices.has(flatIdx) && !isSelected;
          const marks = pencilMarks[flatIdx];

          // Box borders: bold line after each box boundary (not at grid edge)
          const isBoxBorderRight = col < size - 1 && (col + 1) % boxSize === 0;
          const isBoxBorderBottom = row < size - 1 && (row + 1) % boxSize === 0;

          const cellClass = [
            styles.cell,
            isSelected && styles.selected,
            isHighlighted && styles.highlighted,
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
                <span className={styles.value}>{displayValue(displayVal, size as GridSize)}</span>
              ) : marks.size > 0 ? (
                <div
                  className={styles.pencil}
                  style={{ gridTemplateColumns: `repeat(${boxSize}, 1fr)` }}
                >
                  {Array.from({ length: size }, (_, n) => n + 1).map(n => (
                    <span
                      key={n}
                      className={`${styles.pencilMark} ${marks.has(n) ? styles.pencilVisible : ''}`}
                    >
                      {marks.has(n) ? displayValue(n, size as GridSize) : ''}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {selectedFlatIndex !== null && (
        <div className={styles.pillarInfo}>
          <span className={styles.pillarLabel}>
            Pillar ({Math.floor((selectedFlatIndex % layerSize) / size) + 1},{' '}
            {(selectedFlatIndex % size) + 1}) — same position across all layers
          </span>
        </div>
      )}
    </div>
  );
}
