import type { GridSize } from '../../types/puzzle';
import { displayValue } from '../../constants/grid-configs';
import styles from './NumberPad.module.css';

interface NumberPadProps {
  size: GridSize;
  isPencilMode: boolean;
  onNumberClick: (value: number) => void;
  onClear: () => void;
  onTogglePencilMode: () => void;
  disabled: boolean;
}

export function NumberPad({
  size,
  isPencilMode,
  onNumberClick,
  onClear,
  onTogglePencilMode,
  disabled,
}: NumberPadProps) {
  const values = Array.from({ length: size }, (_, i) => i + 1);

  // Determine grid layout based on size
  const cols = size === 4 ? 4 : size === 9 ? 5 : size === 16 ? 6 : 7;

  return (
    <div className={styles.numberPad}>
      <div className={styles.controls}>
        <button
          className={`${styles.controlButton} ${isPencilMode ? styles.active : ''}`}
          onClick={onTogglePencilMode}
          aria-pressed={isPencilMode}
          title="Toggle pencil mode (P)"
        >
          Pencil
        </button>
        <button
          className={styles.controlButton}
          onClick={onClear}
          disabled={disabled}
          title="Clear cell (Delete)"
        >
          Clear
        </button>
      </div>
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
