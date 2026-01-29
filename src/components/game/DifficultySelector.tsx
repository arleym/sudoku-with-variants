import type { GridSize, Difficulty } from '../../types/puzzle';
import { Button } from '../ui/Button';
import styles from './DifficultySelector.module.css';

interface DifficultySelectorProps {
  currentSize: GridSize;
  currentDifficulty: Difficulty;
  onSelect: (size: GridSize, difficulty: Difficulty) => void;
  onCancel: () => void;
}

const SIZES: { value: GridSize; label: string }[] = [
  { value: 4, label: '4×4' },
  { value: 9, label: '9×9' },
  { value: 16, label: '16×16' },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
];

export function DifficultySelector({
  currentSize,
  currentDifficulty,
  onSelect,
  onCancel,
}: DifficultySelectorProps) {
  return (
    <div className={styles.selector}>
      <div className={styles.section}>
        <h3 className={styles.heading}>Grid Size</h3>
        <div className={styles.options}>
          {SIZES.map(({ value, label }) => (
            <button
              key={value}
              className={`${styles.option} ${
                value === currentSize ? styles.selected : ''
              }`}
              onClick={() => onSelect(value, currentDifficulty)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.heading}>Difficulty</h3>
        <div className={styles.options}>
          {DIFFICULTIES.map(({ value, label }) => (
            <button
              key={value}
              className={`${styles.option} ${
                value === currentDifficulty ? styles.selected : ''
              }`}
              onClick={() => onSelect(currentSize, value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <Button onClick={onCancel} size="medium">
          Cancel
        </Button>
        <Button
          onClick={() => onSelect(currentSize, currentDifficulty)}
          variant="primary"
          size="medium"
        >
          Start Game
        </Button>
      </div>
    </div>
  );
}
