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
  onPrint: () => void;
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
  onPrint,
  canUndo,
  canRedo,
  isPencilMode,
  isPencilEnabled,
  isClearDisabled,
}: GameControlsProps) {
  return (
    <div className={styles.controls}>
      {/* Row 1: Undo / Redo / Reset / New Game */}
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
        <Button onClick={onNewGame} size="small" variant="primary">
          New Game
        </Button>
      </div>

      {/* Row 2: Pencil / Clear / Print / Share / Settings */}
      <div className={styles.row}>
        <Button
          onClick={onTogglePencilMode}
          disabled={!isPencilEnabled}
          variant={isPencilMode ? 'primary' : 'secondary'}
          size="small"
          title="Toggle pencil mode"
        >
          Pencil
        </Button>
        <Button onClick={onClear} disabled={isClearDisabled} size="small" title="Clear cell (Delete)">
          Clear
        </Button>
        <Button onClick={onPrint} size="small" title="Print puzzle">
          Print
        </Button>
        <Button onClick={onShare} size="small" title="Share puzzle">
          Share
        </Button>
        <Button onClick={onSettings} size="small" title="Settings">
          Settings
        </Button>
      </div>
    </div>
  );
}
