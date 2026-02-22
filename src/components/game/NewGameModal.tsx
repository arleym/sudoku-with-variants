import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GridSize, Difficulty } from '../../types/puzzle';
import { Button } from '../ui/Button';
import styles from './NewGameModal.module.css';

export type GameMode = '2d' | '3d';
export type Size3D = 4 | 9;

const PENDING_KEY = 'sudoku-pending-new-game';

export interface PendingNewGame {
  mode: GameMode;
  size2d: GridSize;
  size3d: Size3D;
  difficulty: Difficulty;
}

export function storePendingNewGame(data: PendingNewGame) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(data));
}

export function consumePendingNewGame(): PendingNewGame | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    localStorage.removeItem(PENDING_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const SIZES_2D: { value: GridSize; label: string }[] = [
  { value: 4, label: '4×4' },
  { value: 9, label: '9×9' },
  { value: 16, label: '16×16' },
  { value: 25, label: '25×25' },
];

const SIZES_3D: { value: Size3D; label: string }[] = [
  { value: 4, label: '4×4×4' },
  { value: 9, label: '9×9×9' },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
];

interface NewGameModalProps {
  currentMode: GameMode;
  initialSize2D: GridSize;
  initialSize3D: Size3D;
  initialDifficulty: Difficulty;
  isGenerating: boolean;
  onStart2D: (size: GridSize, difficulty: Difficulty) => void;
  onStart3D: (size: Size3D, difficulty: Difficulty) => void;
  onClose: () => void;
}

export function NewGameModal({
  currentMode,
  initialSize2D,
  initialSize3D,
  initialDifficulty,
  isGenerating,
  onStart2D,
  onStart3D,
  onClose,
}: NewGameModalProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<GameMode>(currentMode);
  const [size2D, setSize2D] = useState<GridSize>(initialSize2D);
  const [size3D, setSize3D] = useState<Size3D>(initialSize3D);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);

  function handleStart() {
    if (mode === currentMode) {
      // Same mode — start directly
      if (mode === '2d') onStart2D(size2D, difficulty);
      else onStart3D(size3D, difficulty);
    } else {
      // Different mode — hand off intent via localStorage, then navigate
      storePendingNewGame({ mode, size2d: size2D, size3d: size3D, difficulty });
      onClose();
      navigate(mode === '3d' ? '/3d' : '/');
    }
  }

  if (isGenerating) {
    return <div className={styles.generating}>Generating puzzle…</div>;
  }

  return (
    <div className={styles.picker}>
      <div className={styles.section}>
        <span className={styles.label}>Mode</span>
        <div className={styles.options}>
          {(['2d', '3d'] as GameMode[]).map(m => (
            <button
              key={m}
              className={`${styles.option} ${mode === m ? styles.selected : ''}`}
              onClick={() => setMode(m)}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.label}>Size</span>
        <div className={styles.options}>
          {mode === '2d'
            ? SIZES_2D.map(({ value, label }) => (
                <button
                  key={value}
                  className={`${styles.option} ${size2D === value ? styles.selected : ''}`}
                  onClick={() => setSize2D(value)}
                >
                  {label}
                </button>
              ))
            : SIZES_3D.map(({ value, label }) => (
                <button
                  key={value}
                  className={`${styles.option} ${size3D === value ? styles.selected : ''}`}
                  onClick={() => setSize3D(value)}
                >
                  {label}
                </button>
              ))}
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.label}>Difficulty</span>
        <div className={styles.options}>
          {DIFFICULTIES.map(({ value, label }) => (
            <button
              key={value}
              className={`${styles.option} ${difficulty === value ? styles.selected : ''}`}
              onClick={() => setDifficulty(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleStart}>Start Game</Button>
      </div>
    </div>
  );
}
