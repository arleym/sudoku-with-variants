import { Button } from '../ui/Button';
import styles from './GameControls.module.css';

interface GameControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onNewGame: () => void;
  onShare: () => void;
  onSettings: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function GameControls({
  onUndo,
  onRedo,
  onReset,
  onNewGame,
  onShare,
  onSettings,
  canUndo,
  canRedo,
}: GameControlsProps) {
  return (
    <div className={styles.controls}>
      <div className={styles.row}>
        <Button onClick={onUndo} disabled={!canUndo} size="small" title="Undo (Ctrl+Z)">
          Undo
        </Button>
        <Button onClick={onRedo} disabled={!canRedo} size="small" title="Redo (Ctrl+Y)">
          Redo
        </Button>
        <Button onClick={onReset} size="small" variant="danger" title="Reset puzzle">
          Reset
        </Button>
      </div>
      <div className={styles.row}>
        <Button onClick={onNewGame} size="small" variant="primary">
          New Game
        </Button>
        <Button onClick={onShare} size="small">
          Share
        </Button>
        <Button onClick={onSettings} size="small">
          Settings
        </Button>
      </div>
    </div>
  );
}
