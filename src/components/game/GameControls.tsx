import { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import styles from './GameControls.module.css';

interface GameControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onNewGame: () => void;
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
  onClear,
  onTogglePencilMode,
  canUndo,
  canRedo,
  isPencilMode,
  isPencilEnabled,
  isClearDisabled,
}: GameControlsProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <div className={styles.controls}>
      <div className={styles.row}>
        <Button onClick={onUndo} disabled={!canUndo} size="small" title="Undo (Ctrl+Z)">
          Undo
        </Button>
        <Button onClick={onRedo} disabled={!canRedo} size="small" title="Redo (Ctrl+Y)">
          Redo
        </Button>
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
        <Button onClick={() => setShowResetConfirm(true)} size="small" variant="danger" title="Reset puzzle">
          Reset
        </Button>
        <Button onClick={onNewGame} size="small" variant="primary">
          New Game
        </Button>
      </div>

      <Modal isOpen={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="Reset Puzzle">
        <div className={styles.confirmContent}>
          <p>Clear all your progress and start this puzzle over?</p>
          <div className={styles.confirmActions}>
            <Button onClick={() => setShowResetConfirm(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                setShowResetConfirm(false);
                onReset();
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
