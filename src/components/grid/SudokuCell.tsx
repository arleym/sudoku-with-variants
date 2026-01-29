import { memo } from 'react';
import type { GridSize } from '../../types/puzzle';
import { displayValue } from '../../constants/grid-configs';
import { PencilMarks } from './PencilMarks';
import styles from './SudokuCell.module.css';

interface SudokuCellProps {
  index: number;
  value: number | null;
  givenValue: number | null;
  pencilMarks: Set<number>;
  size: GridSize;
  isSelected: boolean;
  isHighlighted: boolean;
  isRelated: boolean;
  hasError: boolean;
  showPencilMarks: boolean;
  onClick: () => void;
}

export const SudokuCell = memo(function SudokuCell({
  index,
  value,
  givenValue,
  pencilMarks,
  size,
  isSelected,
  isHighlighted,
  isRelated,
  hasError,
  showPencilMarks,
  onClick,
}: SudokuCellProps) {
  const displayedValue = givenValue ?? value;
  const isGiven = givenValue !== null;

  const classNames = [
    styles.cell,
    isSelected && styles.selected,
    isHighlighted && styles.highlighted,
    isRelated && !isSelected && styles.related,
    hasError && styles.error,
    isGiven && styles.given,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      onClick={onClick}
      data-index={index}
      role="gridcell"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`Cell ${Math.floor(index / size) + 1}, ${(index % size) + 1}${
        displayedValue ? `, value ${displayValue(displayedValue, size)}` : ', empty'
      }`}
    >
      {displayedValue !== null ? (
        <span className={styles.value}>{displayValue(displayedValue, size)}</span>
      ) : showPencilMarks && pencilMarks.size > 0 ? (
        <PencilMarks marks={pencilMarks} size={size} />
      ) : null}
    </div>
  );
});
