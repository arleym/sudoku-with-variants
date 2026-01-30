import type { GridSize } from '../../types/puzzle';
import { displayValue } from '../../constants/grid-configs';
import styles from './PencilMarks.module.css';

interface PencilMarksProps {
  marks: Set<number>;
  size: GridSize;
  completedNumbers?: Set<number>;
}

export function PencilMarks({ marks, size, completedNumbers }: PencilMarksProps) {
  if (marks.size === 0) return null;

  const gridSize = size === 4 ? 2 : size === 9 ? 3 : size === 16 ? 4 : 5;
  const values = Array.from({ length: size }, (_, i) => i + 1);

  return (
    <div
      className={styles.pencilMarks}
      style={{
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
      }}
    >
      {values.map(value => {
        const isActive = marks.has(value);
        const isCompleted = completedNumbers?.has(value) ?? false;
        return (
          <span
            key={value}
            className={`${styles.mark} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
          >
            {isActive ? displayValue(value, size) : ''}
          </span>
        );
      })}
    </div>
  );
}
