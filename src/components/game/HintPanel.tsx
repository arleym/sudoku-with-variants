import { useState } from 'react';
import type { GridSize } from '../../types/puzzle';
import { getNextHint } from '../../lib/hints/hint-engine';
import { mergeCellValues } from '../../lib/candidates';
import { Button } from '../ui/Button';
import styles from './HintPanel.module.css';

interface HintPanelProps {
  puzzleCells: (number | null)[];
  userValues: (number | null)[];
  size: GridSize;
  onApplyHint: (index: number, value: number) => void;
}

export function HintPanel({
  puzzleCells,
  userValues,
  size,
  onApplyHint,
}: HintPanelProps) {
  const [currentHint, setCurrentHint] = useState<{
    cellIndex: number;
    value: number;
    description: string;
  } | null>(null);

  const handleGetHint = () => {
    const allCells = mergeCellValues(puzzleCells, userValues);
    const hint = getNextHint(allCells, size);
    setCurrentHint(hint);
  };

  const handleApplyHint = () => {
    if (currentHint) {
      onApplyHint(currentHint.cellIndex, currentHint.value);
      setCurrentHint(null);
    }
  };

  return (
    <div className={styles.panel}>
      {currentHint ? (
        <div className={styles.hintDisplay}>
          <p className={styles.hintText}>{currentHint.description}</p>
          <div className={styles.actions}>
            <Button onClick={() => setCurrentHint(null)} size="small">
              Dismiss
            </Button>
            <Button onClick={handleApplyHint} variant="primary" size="small">
              Apply
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={handleGetHint} size="small">
          Get Hint
        </Button>
      )}
    </div>
  );
}
