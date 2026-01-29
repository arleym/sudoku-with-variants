import type { GridSize } from '../../types/puzzle';
import { displayValue } from '../../constants/grid-configs';
import styles from './PencilMarks.module.css';

interface PencilMarksProps {
  marks: Set<number>;
  size: GridSize;
}

export function PencilMarks({ marks, size }: PencilMarksProps) {
  if (marks.size === 0) return null;

  const gridSize = size === 4 ? 2 : size === 9 ? 3 : 4;
  const values = Array.from({ length: size }, (_, i) => i + 1);

  return (
    <div
      className={styles.pencilMarks}
      style={{
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
      }}
    >
      {values.map(value => (
        <span
          key={value}
          className={`${styles.mark} ${marks.has(value) ? styles.active : ''}`}
        >
          {marks.has(value) ? displayValue(value, size) : ''}
        </span>
      ))}
    </div>
  );
}
