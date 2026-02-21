import { useState } from 'react';
import type { GridSize, Difficulty } from '../../types/puzzle';
import { Button } from '../ui/Button';
import styles from './DifficultySelector.module.css';

interface DifficultySelectorProps {
  initialSize: GridSize;
  initialDifficulty: Difficulty;
  onSelect: (size: GridSize, difficulty: Difficulty) => void;
  onCancel: () => void;
}

const SIZES: { value: GridSize; label: string }[] = [
  { value: 4, label: '4×4' },
  { value: 9, label: '9×9' },
  { value: 16, label: '16×16' },
  { value: 25, label: '25×25' },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
];

export function DifficultySelector({
  initialSize,
  initialDifficulty,
  onSelect,
  onCancel,
}: DifficultySelectorProps) {
  const [selectedSize, setSelectedSize] = useState<GridSize>(initialSize);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(initialDifficulty);

  return (
    <div className={styles.selector}>
      <div className={styles.section}>
        <h3 className={styles.heading}>Grid Size</h3>
        <div className={styles.options}>
          {SIZES.map(({ value, label }) => (
            <button
              key={value}
              className={`${styles.option} ${
                value === selectedSize ? styles.selected : ''
              }`}
              onClick={() => setSelectedSize(value)}
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
                value === selectedDifficulty ? styles.selected : ''
              }`}
              onClick={() => setSelectedDifficulty(value)}
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
          onClick={() => onSelect(selectedSize, selectedDifficulty)}
          variant="primary"
          size="medium"
        >
          Start Game
        </Button>
      </div>
    </div>
  );
}
