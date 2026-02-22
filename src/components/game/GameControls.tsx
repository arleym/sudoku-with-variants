import { Button } from '../ui/Button';
import styles from './GameControls.module.css';

interface GameControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onNewGame: () => void;
  onShare: () => void;
  onSettings: () => void;
  onClear: () => void;
  onTogglePencilMode: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isPencilMode: boolean;
  isPencilEnabled: boolean;
  isClearDisabled: boolean;
}

export function GameControls({
  onUndo,
  onRedo,
  onReset,
  onNewGame,
  onShare,
  onSettings,
  onClear,
  onTogglePencilMode,
  canUndo,
  canRedo,
  isPencilMode,
  isPencilEnabled,
  isClearDisabled,
}: GameControlsProps) {
  return (
    <div className={styles.controls}>
      {/* Row 1: Undo/Redo, Reset, New Game */}
      <div className={styles.row}>
        <div className={styles.halfButtons}>
          <button
            className={styles.iconButton}
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            &#x21A9;
          </button>
          <button
            className={styles.iconButton}
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            &#x21AA;
          </button>
        </div>
        <Button onClick={onReset} size="small" variant="danger" title="Reset puzzle">
          Reset
        </Button>
        <Button onClick={onNewGame} size="small" variant="primary">
          New Game
        </Button>
      </div>

      {/* Row 2: Pencil, Clear, Share, Settings */}
      <div className={styles.row}>
        <button
          className={`${styles.controlButton} ${isPencilMode ? styles.active : ''}`}
          onClick={onTogglePencilMode}
          disabled={!isPencilEnabled}
          aria-pressed={isPencilMode}
          title="Toggle pencil mode"
        >
          Pencil
        </button>
        <button
          className={styles.controlButton}
          onClick={onClear}
          disabled={isClearDisabled}
          title="Clear cell (Delete)"
        >
          Clear
        </button>
        <button
          className={styles.iconButton}
          onClick={onShare}
          title="Share puzzle"
          aria-label="Share"
        >
          &#x1F517;
        </button>
        <button
          className={styles.iconButton}
          onClick={onSettings}
          title="Settings"
          aria-label="Settings"
        >
          &#x2699;
        </button>
      </div>
    </div>
  );
}
