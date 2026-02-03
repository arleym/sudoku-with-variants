import type { GridSize } from '../../types/puzzle';
import { displayValue } from '../../constants/grid-configs';
import styles from './NumberPad.module.css';

interface NumberPadProps {
  size: GridSize;
  onNumberClick: (value: number) => void;
  disabled: boolean;
  showNumberPad: boolean;
}

export function NumberPad({
  size,
  onNumberClick,
  disabled,
  showNumberPad,
}: NumberPadProps) {
  const values = Array.from({ length: size }, (_, i) => i + 1);

  // Determine grid layout based on size
  const cols = size === 4 ? 4 : size === 9 ? 5 : size === 16 ? 6 : 7;

  if (!showNumberPad) {
    return null;
  }

  return (
    <div className={styles.numberPad}>
      <div
        className={styles.numbers}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {values.map(value => (
          <button
            key={value}
            className={styles.numberButton}
            onClick={() => onNumberClick(value)}
            disabled={disabled}
            aria-label={`Enter ${displayValue(value, size)}`}
          >
            {displayValue(value, size)}
          </button>
        ))}
      </div>
    </div>
  );
}
